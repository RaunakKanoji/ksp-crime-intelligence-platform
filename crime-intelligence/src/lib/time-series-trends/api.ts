import { getTimeSeriesCrimeTrends } from "./service";
import type { TimeSeriesTrendsData, TrendFilters } from "./types";

function serialize(filters: TrendFilters, role: string): string {
  const params = new URLSearchParams({ role });
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString();
}

export async function fetchTimeSeriesCrimeTrends(
  filters: TrendFilters,
  role: string
): Promise<TimeSeriesTrendsData> {
  try {
    const response = await fetch(`/api/analytics/trends?${serialize(filters, role)}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Time-series crime trends API failed.");
    return (await response.json()) as TimeSeriesTrendsData;
  } catch {
    return getTimeSeriesCrimeTrends(filters);
  }
}
