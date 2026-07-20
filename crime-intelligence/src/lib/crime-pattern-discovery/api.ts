import type { UserRole } from "@/lib/permissions";
import type { CrimePatternDiscoveryResponse, CrimePatternFilters } from "./types";

export class CrimePatternApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); this.name = "CrimePatternApiError"; }
}

export async function fetchCrimePatterns(filters: CrimePatternFilters, role: UserRole) {
  const params = new URLSearchParams({ role, minimumOccurrences: String(filters.minimumOccurrences ?? 2), minimumConfidence: String(filters.minimumConfidence ?? 50) });
  for (const key of ["search", "district", "category", "type", "from", "to"] as const) if (filters[key]) params.set(key, String(filters[key]));
  const response = await fetch(`/api/intelligence/pattern-discovery?${params}`, { cache: "no-store" });
  const body = await response.json() as CrimePatternDiscoveryResponse & { error?: string };
  if (!response.ok) throw new CrimePatternApiError(body.error ?? "Unable to discover crime patterns.", response.status);
  return body;
}
