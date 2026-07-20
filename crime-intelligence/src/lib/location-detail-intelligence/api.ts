import type { UserRole } from "@/lib/permissions";
import type { LocationDetailIntelligenceResponse, LocationIntelligenceFilters } from "./types";

export class LocationIntelligenceApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); this.name = "LocationIntelligenceApiError"; }
}

export async function fetchLocationIntelligence(filters: LocationIntelligenceFilters, role: UserRole) {
  const params = new URLSearchParams({ role, locationId: filters.locationId });
  for (const key of ["category", "from", "to"] as const) if (filters[key]) params.set(key, String(filters[key]));
  const response = await fetch(`/api/map/location-intelligence?${params}`, { cache: "no-store" });
  const body = await response.json() as { data: LocationDetailIntelligenceResponse | null; error?: string };
  if (!response.ok) throw new LocationIntelligenceApiError(body.error ?? "Unable to load location intelligence.", response.status);
  return body.data;
}
