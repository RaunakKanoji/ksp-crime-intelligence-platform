import { AppError, type FieldErrors } from "@/server/catalyst/errors";

export type PaginationInput = {
  page: number;
  pageSize: number;
};

export function parsePagination(params: URLSearchParams, maxPageSize = 100): PaginationInput {
  const page = parsePositiveInteger(params.get("page"), 1);
  const pageSize = Math.min(parsePositiveInteger(params.get("pageSize"), 25), maxPageSize);

  return { page, pageSize };
}

export function requireString(
  value: unknown,
  field: string,
  options: { min?: number; max?: number } = {},
): string {
  if (typeof value !== "string") {
    throwValidation({ [field]: ["Enter a valid value."] });
  }

  const trimmed = value.trim();
  const min = options.min ?? 1;
  if (trimmed.length < min) {
    throwValidation({ [field]: [`Enter at least ${min} character${min === 1 ? "" : "s"}.`] });
  }

  if (options.max && trimmed.length > options.max) {
    throwValidation({ [field]: [`Enter no more than ${options.max} characters.`] });
  }

  return trimmed;
}

export function requireEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): T {
  if (typeof value === "string" && allowed.includes(value as T)) {
    return value as T;
  }

  throwValidation({ [field]: [`Use one of: ${allowed.join(", ")}.`] });
}

export function throwValidation(fieldErrors: FieldErrors): never {
  throw new AppError("VALIDATION_FAILED", "Check the highlighted fields and try again.", {
    fieldErrors,
  });
}

export function optionalString(value: unknown, field: string, options: { max?: number } = {}): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return requireString(value, field, { min: 1, max: options.max });
}

export function requireNumber(
  value: unknown,
  field: string,
  options: { min?: number; max?: number } = {},
): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) throwValidation({ [field]: ["Enter a valid number."] });
  if (options.min !== undefined && parsed < options.min) throwValidation({ [field]: [`Use a value of at least ${options.min}.`] });
  if (options.max !== undefined && parsed > options.max) throwValidation({ [field]: [`Use a value no more than ${options.max}.`] });
  return parsed;
}

export function requireIsoDate(value: unknown, field: string): string {
  const text = requireString(value, field, { min: 8, max: 40 });
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) throwValidation({ [field]: ["Enter a valid date."] });
  return parsed.toISOString();
}

function parsePositiveInteger(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
