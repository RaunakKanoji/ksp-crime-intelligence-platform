import type { UserRole } from "@/lib/permissions";
import type { CaseStatusFilters, CaseStatusTrackingResponse } from "./types";

export class CaseStatusApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); this.name = "CaseStatusApiError"; }
}

export async function fetchCaseStatusTracking(filters: CaseStatusFilters, role: UserRole) {
  const params = new URLSearchParams({ role, page: String(filters.page ?? 1), pageSize: String(filters.pageSize ?? 5), sortBy: filters.sortBy ?? "updatedAt", sortDirection: filters.sortDirection ?? "desc" });
  for (const key of ["search", "district", "station", "category", "status", "from", "to"] as const) if (filters[key]) params.set(key, String(filters[key]));
  const response = await fetch(`/api/cases/status-tracking?${params}`, { cache: "no-store" });
  const body = await response.json() as CaseStatusTrackingResponse & { error?: string };
  if (!response.ok) throw new CaseStatusApiError(body.error ?? "Unable to load case status tracking.", response.status);
  return body;
}
