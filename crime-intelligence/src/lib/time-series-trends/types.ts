export type TrendRange = "30d" | "90d" | "180d" | "1y";
export type TrendInterval = "daily" | "weekly" | "monthly" | "yearly";

export interface TrendFilters {
  range: TrendRange;
  interval: TrendInterval;
  district: string;
  policeStation: string;
  category: string;
}

export interface TrendDataPoint {
  label: string; // YYYY-MM-DD for daily, WXX/Date for weekly, Mon/Year for monthly, YYYY for yearly
  firCount: number;
  solvedCount: number;
  categoryBreakdown: Record<string, number>;
  districtBreakdown: Record<string, number>;
}

export interface SeasonalityNote {
  id: string;
  title: string;
  description: string;
  period: string;
  significance: "high" | "medium" | "low";
}

export interface TimeSeriesTrendsData {
  source: "mock" | "real";
  generatedAt: string;
  filters: TrendFilters;
  dataPoints: TrendDataPoint[];
  totals: {
    firCount: number;
    prevFirCount: number;
    changePercentage: number;
    solvedRate: number;
    peakInterval: string;
    peakCount: number;
  };
  seasonalityNotes: SeasonalityNote[];
  emptyReason?: string;
}

export const DEFAULT_TREND_FILTERS: TrendFilters = {
  range: "90d",
  interval: "monthly",
  district: "all",
  policeStation: "all",
  category: "all",
};
