import type { UserRole } from "@/lib/permissions";
import type { RiskAlertFilters, RiskAlertsResponse } from "./types";

export class RiskAlertsApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); this.name = "RiskAlertsApiError"; }
}

export async function fetchRiskAlerts(filters: RiskAlertFilters, role: UserRole) {
  const params = new URLSearchParams({ role });
  for (const key of ["search", "type", "severity", "reviewStatus", "district", "from", "to"] as const) if (filters[key]) params.set(key, String(filters[key]));
  const response = await fetch(`/api/cases/risk-alerts?${params}`, { cache: "no-store" });
  const body = await response.json() as RiskAlertsResponse & { error?: string };
  if (!response.ok) throw new RiskAlertsApiError(body.error ?? "Unable to load risk alerts.", response.status);
  return body;
}
