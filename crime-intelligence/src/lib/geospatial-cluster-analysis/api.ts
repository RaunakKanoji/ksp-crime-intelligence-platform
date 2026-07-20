import type { UserRole } from "@/lib/permissions";
import type { GeospatialClusterFilters, GeospatialClusterResponse } from "./types";

export class GeospatialClusterApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); this.name = "GeospatialClusterApiError"; }
}

export async function fetchGeospatialClusters(filters: GeospatialClusterFilters, role: UserRole) {
  const params = new URLSearchParams({ role, radiusKm: String(filters.radiusKm ?? 5), minimumPoints: String(filters.minimumPoints ?? 2) });
  for (const key of ["category", "district", "boundaryId", "from", "to"] as const) if (filters[key]) params.set(key, String(filters[key]));
  const response = await fetch(`/api/map/cluster-analysis?${params}`, { cache: "no-store" });
  const body = await response.json() as GeospatialClusterResponse & { error?: string };
  if (!response.ok) throw new GeospatialClusterApiError(body.error ?? "Unable to analyze geospatial clusters.", response.status);
  return body;
}
