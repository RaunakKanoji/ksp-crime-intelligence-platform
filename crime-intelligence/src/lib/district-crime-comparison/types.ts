export type ComparisonRange = "30d" | "90d" | "180d" | "1y";

export interface DistrictComparisonFilters {
  range: ComparisonRange;
  category: string;
}

export interface CategoryBreakdownItem {
  category: string;
  count: number;
  share: number;
}

export interface DistrictComparisonRow {
  district: string;
  population: number;
  firCount: number;
  prevFirCount: number;
  changePercentage: number;
  solvedCount: number;
  solvedRate: number;
  averageRiskScore: number;
  crimeRatePer100k: number;
  prevCrimeRatePer100k: number;
  trend: "up" | "down" | "flat";
  categoryBreakdown: CategoryBreakdownItem[];
}

export interface StateTotals {
  firCount: number;
  prevFirCount: number;
  changePercentage: number;
  solvedRate: number;
  averageRiskScore: number;
  crimeRatePer100k: number;
  trend: "up" | "down" | "flat";
}

export interface DistrictComparisonData {
  isSampleData: boolean;
  generatedAt: string;
  filters: DistrictComparisonFilters;
  districtRows: DistrictComparisonRow[];
  totals: StateTotals;
  categoryTotals: CategoryBreakdownItem[];
  emptyReason: string;
}

export const DEFAULT_DISTRICT_ANALYTICS_FILTERS: DistrictComparisonFilters = {
  range: "30d",
  category: "all",
};

export const DISTRICT_POPULATIONS: Record<string, number> = {
  "Bengaluru City": 8400000,
  "Mysuru": 1000000,
  "Belagavi": 1200000,
  "Kalaburagi": 800000,
  "Mangaluru": 500000,
  "Hubballi-Dharwad": 900000,
};
