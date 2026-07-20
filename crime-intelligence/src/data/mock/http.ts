import { AppError } from "@/server/catalyst/errors";

export function requireObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new AppError("VALIDATION_FAILED", "Expected a JSON object.");
  return value as Record<string, unknown>;
}

export function requiredString(input: Record<string, unknown>, field: string, min = 1, max = 240): string {
  const value = input[field];
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) throw new AppError("VALIDATION_FAILED", `Invalid ${field}.`);
  return value.trim();
}

export function optionalString(input: Record<string, unknown>, field: string, max = 240): string | undefined {
  const value = input[field];
  if (value === undefined || value === null || value === "") return undefined;
  return requiredString(input, field, 1, max);
}

export function requiredNumber(input: Record<string, unknown>, field: string, min?: number, max?: number): number {
  const value = typeof input[field] === "number" ? input[field] as number : Number(input[field]);
  if (!Number.isFinite(value) || min !== undefined && value < min || max !== undefined && value > max) throw new AppError("VALIDATION_FAILED", `Invalid ${field}.`);
  return value;
}

export function developmentOnly(): void {
  if (process.env.NODE_ENV === "production") throw new AppError("PERMISSION_DENIED", "Mock database controls are available only in development.");
}

export function parseStringList(value: string | null): string[] | undefined {
  if (!value) return undefined;
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}
