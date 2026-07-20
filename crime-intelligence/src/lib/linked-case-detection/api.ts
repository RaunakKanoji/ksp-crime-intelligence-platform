import type { UserRole } from "@/lib/permissions";
import type { LinkedCaseDetectionResponse, LinkedCaseFilters } from "./types";

export class LinkedCaseApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "LinkedCaseApiError";
  }
}

export async function fetchLinkedCases(filters: LinkedCaseFilters, role: UserRole) {
  const params = new URLSearchParams({ role, sourceFirId: filters.sourceFirId });
  for (const key of ["district", "from", "to", "minimumConfidence"] as const) {
    if (filters[key]) params.set(key, filters[key]!);
  }
  const response = await fetch(`/api/intelligence/linked-cases?${params}`, { cache: "no-store" });
  const body = await response.json() as LinkedCaseDetectionResponse & { error?: string };
  if (!response.ok) throw new LinkedCaseApiError(body.error ?? "Unable to detect linked cases.", response.status);
  return body;
}
