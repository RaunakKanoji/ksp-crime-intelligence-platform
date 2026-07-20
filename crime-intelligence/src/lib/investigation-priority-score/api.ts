import type { UserRole } from "@/lib/permissions";
import type { InvestigationPriorityResponse, PriorityScoreFilters } from "./types";

export class PriorityScoreApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); this.name = "PriorityScoreApiError"; }
}

export async function fetchPriorityScores(filters: PriorityScoreFilters, role: UserRole) {
  const params = new URLSearchParams({ role, minimumScore: String(filters.minimumScore ?? 0) });
  for (const key of ["search", "district", "category", "status"] as const) if (filters[key]) params.set(key, String(filters[key]));
  const response = await fetch(`/api/cases/priority-scores?${params}`, { cache: "no-store" });
  const body = await response.json() as InvestigationPriorityResponse & { error?: string };
  if (!response.ok) throw new PriorityScoreApiError(body.error ?? "Unable to load priority scores.", response.status);
  return body;
}
