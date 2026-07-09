import { getCrimeCategoryBreakdown } from "./service";
import type {
  CategoryBreakdownData,
  CategoryBreakdownFilters,
} from "./types";
import type { UserRole } from "@/lib/permissions";

function serialize(filters: CategoryBreakdownFilters, role: string): string {
  const params = new URLSearchParams({ role });
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString();
}

export async function fetchCrimeCategoryBreakdown(
  filters: CategoryBreakdownFilters,
  role: UserRole
): Promise<CategoryBreakdownData> {
  try {
    const response = await fetch(`/api/analytics/category-breakdown?${serialize(filters, role)}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Crime category breakdown API failed.");
    return (await response.json()) as CategoryBreakdownData;
  } catch {
    // SSR or offline fallback
    return getCrimeCategoryBreakdown(filters, role);
  }
}
