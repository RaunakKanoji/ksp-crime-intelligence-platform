export type AppErrorCode =
  | "AUTHENTICATION_REQUIRED"
  | "PERMISSION_DENIED"
  | "VALIDATION_FAILED"
  | "RECORD_NOT_FOUND"
  | "RECORD_CONFLICT"
  | "DATABASE_UNAVAILABLE"
  | "DATABASE_OPERATION_FAILED"
  | "CATALYST_TABLE_NOT_FOUND"
  | "CATALYST_COLUMN_NOT_FOUND"
  | "SCHEMA_MISMATCH"
  | "EXTERNAL_SERVICE_FAILED"
  | "FILE_UPLOAD_FAILED"
  | "RATE_LIMITED"
  | "UNKNOWN_ERROR";

export type FieldErrors = Record<string, string[]>;

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly fieldErrors?: FieldErrors;
  readonly correlationId?: string;

  constructor(
    code: AppErrorCode,
    message: string,
    options: { status?: number; fieldErrors?: FieldErrors; correlationId?: string } = {},
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = options.status ?? statusForCode(code);
    this.fieldErrors = options.fieldErrors;
    this.correlationId = options.correlationId;
  }
}

export function statusForCode(code: AppErrorCode): number {
  switch (code) {
    case "AUTHENTICATION_REQUIRED":
      return 401;
    case "PERMISSION_DENIED":
      return 403;
    case "VALIDATION_FAILED":
      return 400;
    case "RECORD_NOT_FOUND":
      return 404;
    case "RECORD_CONFLICT":
      return 409;
    case "DATABASE_UNAVAILABLE":
    case "DATABASE_OPERATION_FAILED":
    case "CATALYST_TABLE_NOT_FOUND":
    case "CATALYST_COLUMN_NOT_FOUND":
    case "SCHEMA_MISMATCH":
    case "EXTERNAL_SERVICE_FAILED":
    case "FILE_UPLOAD_FAILED":
      return 503;
    case "RATE_LIMITED":
      return 429;
    case "UNKNOWN_ERROR":
    default:
      return 500;
  }
}

export function normalizeCatalystError(error: unknown, fallbackMessage: string): AppError {
  if (error instanceof AppError) return error;
  const message = error instanceof Error ? error.message : JSON.stringify(error);
  const lower = message.toLowerCase();
  if (lower.includes("table") && lower.includes("not")) {
    return new AppError("CATALYST_TABLE_NOT_FOUND", fallbackMessage, { status: 500 });
  }
  if (lower.includes("column") && lower.includes("not")) {
    return new AppError("CATALYST_COLUMN_NOT_FOUND", fallbackMessage, { status: 500 });
  }
  if (lower.includes("duplicate") || lower.includes("unique")) {
    return new AppError("RECORD_CONFLICT", "A matching record already exists.");
  }
  return new AppError("DATABASE_OPERATION_FAILED", fallbackMessage, { status: 500 });
}

export function toSafeErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: {
        error: {
          code: error.code,
          message: error.message,
          fieldErrors: error.fieldErrors,
          correlationId: error.correlationId,
        },
      },
    };
  }

  return {
    status: 500,
    body: {
      error: {
        code: "UNKNOWN_ERROR" satisfies AppErrorCode,
        message: "Something went wrong. Please try again.",
      },
    },
  };
}

export function assertFound<T>(record: T | null | undefined, message = "Record not found."): T {
  if (record == null) {
    throw new AppError("RECORD_NOT_FOUND", message);
  }

  return record;
}
