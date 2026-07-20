import type { UserRole } from "@/lib/permissions";
import type { MoAnalysisFilters, MoAnalysisResponse } from "./types";

export class MoAnalysisApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "MoAnalysisApiError";
  }
}

export async function fetchMoAnalysis(filters: MoAnalysisFilters, role: UserRole) {
  const params = new URLSearchParams({ role, minimumSimilarity: String(filters.minimumSimilarity ?? 50) });
  for (const key of ["search", "category", "district", "from", "to"] as const) if (filters[key]) params.set(key, filters[key]!);
  const response = await fetch(`/api/intelligence/modus-operandi?${params}`, { cache: "no-store" });
  const body = await response.json() as MoAnalysisResponse & { error?: string };
  if (!response.ok) throw new MoAnalysisApiError(body.error ?? "Unable to analyze modus operandi.", response.status);
  return body;
}
