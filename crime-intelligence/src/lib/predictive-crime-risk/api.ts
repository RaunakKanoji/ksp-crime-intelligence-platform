import type { UserRole } from "@/lib/permissions";
import type { PredictiveCrimeRiskFilters, PredictiveCrimeRiskResponse, PredictiveRiskTimeWindow } from "./types";

export class PredictiveCrimeRiskApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "PredictiveCrimeRiskApiError";
  }
}

export async function fetchPredictiveCrimeRisk(filters: PredictiveCrimeRiskFilters, role: UserRole): Promise<PredictiveCrimeRiskResponse> {
  const params = new URLSearchParams({ role });
  if (filters.search) params.set("search", filters.search);
  if (filters.district) params.set("district", filters.district);
  if (filters.station) params.set("station", filters.station);
  if (filters.category) params.set("category", filters.category);
  if (filters.timeWindow) params.set("timeWindow", filters.timeWindow satisfies PredictiveRiskTimeWindow);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.horizonDays) params.set("horizonDays", String(filters.horizonDays));
  if (filters.minimumConfidence !== undefined) params.set("minimumConfidence", String(filters.minimumConfidence));
  const response = await fetch(`/api/intelligence/predictive-crime-risk?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Unable to load predictive crime risk." })) as { error?: string };
    throw new PredictiveCrimeRiskApiError(body.error ?? "Unable to load predictive crime risk.", response.status);
  }
  return response.json() as Promise<PredictiveCrimeRiskResponse>;
}
