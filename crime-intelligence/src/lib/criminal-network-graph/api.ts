import type { UserRole } from "@/lib/permissions";
import type { NetworkGraphFilters, NetworkGraphResponse } from "./types";

export class NetworkGraphApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "NetworkGraphApiError";
  }
}

export async function fetchNetworkGraph(filters: NetworkGraphFilters, role: UserRole) {
  const params = new URLSearchParams({ role, maxNodes: String(filters.maxNodes ?? 50) });
  if (filters.search) params.set("search", filters.search);
  if (filters.district) params.set("district", filters.district);
  if (filters.nodeTypes) {
    params.set("nodeTypesProvided", "true");
    filters.nodeTypes.forEach((item) => params.append("nodeType", item));
  }
  if (filters.relationshipTypes) {
    params.set("relationshipTypesProvided", "true");
    filters.relationshipTypes.forEach((item) => params.append("relationshipType", item));
  }
  const response = await fetch(`/api/intelligence/network-graph?${params}`, { cache: "no-store" });
  const body = await response.json() as NetworkGraphResponse & { error?: string };
  if (!response.ok) throw new NetworkGraphApiError(body.error ?? "Unable to load network graph.", response.status);
  return body;
}
