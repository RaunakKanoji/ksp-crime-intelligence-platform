import { getDistrictCrimeComparison } from "./service";
import type {
  DistrictComparisonData,
  DistrictComparisonFilters,
} from "./types";

function serialize(filters: DistrictComparisonFilters, role: string): string {
  const params = new URLSearchParams({ role });
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString();
}

export async function fetchDistrictCrimeComparison(
  filters: DistrictComparisonFilters,
  role: string
): Promise<DistrictComparisonData> {
  try {
    const response = await fetch(`/api/analytics/district-comparison?${serialize(filters, role)}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("District crime comparison API failed.");
    return (await response.json()) as DistrictComparisonData;
  } catch {
    return getDistrictCrimeComparison(filters);
  }
}
