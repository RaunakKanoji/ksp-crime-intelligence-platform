import type { DashboardData, DashboardFilters } from "./types";

export async function getDashboardOverview(filters: DashboardFilters, role: string): Promise<DashboardData> {
  const params = new URLSearchParams({ ...filters, role });
  const response = await fetch(`/api/dashboard/overview?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Dashboard overview API failed.");
  const payload = (await response.json()) as { data?: DashboardData };
  if (!payload.data) throw new Error("Dashboard overview payload was empty.");
  return payload.data;
}
