import { getPoliceStationAnalytics } from "./service";
import type {
  PoliceStationAnalyticsData,
  StationAnalyticsFilters,
} from "./types";

function serialize(filters: StationAnalyticsFilters, role: string): string {
  const params = new URLSearchParams({ role });
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString();
}

export async function fetchPoliceStationAnalytics(
  filters: StationAnalyticsFilters,
  role: string
): Promise<PoliceStationAnalyticsData> {
  try {
    const response = await fetch(`/api/analytics/police-station?${serialize(filters, role)}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Police station analytics API failed.");
    return (await response.json()) as PoliceStationAnalyticsData;
  } catch {
    return getPoliceStationAnalytics(filters);
  }
}
