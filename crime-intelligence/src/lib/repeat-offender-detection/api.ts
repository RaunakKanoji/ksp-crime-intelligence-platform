import type { UserRole } from "@/lib/permissions";
import type { RepeatOffenderDetectionResponse, RepeatOffenderFilters } from "./types";

export class RepeatOffenderApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "RepeatOffenderApiError";
  }
}

export async function fetchRepeatOffenders(filters: RepeatOffenderFilters, role: UserRole) {
  const params = new URLSearchParams({ role, minimumFirCount: String(filters.minimumFirCount ?? 2) });
  for (const key of ["search", "category", "district", "from", "to"] as const) {
    if (filters[key]) params.set(key, filters[key]!);
  }
  const response = await fetch(`/api/people/repeat-offenders?${params}`, { cache: "no-store" });
  const body = await response.json() as RepeatOffenderDetectionResponse & { error?: string };
  if (!response.ok) throw new RepeatOffenderApiError(body.error ?? "Unable to run detection.", response.status);
  return body;
}
