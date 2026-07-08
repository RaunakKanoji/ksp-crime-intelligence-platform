import type { CrimeSeverity } from "@/lib/crime-map/map-types";

export type StationAnalyticsRange = "30d" | "90d" | "180d" | "1y";

export type StationAnalyticsFilters = {
  range: StationAnalyticsRange;
  district: string;
  policeStation: string;
  category: string;
};

export type StationStatusBreakdown = {
  solved: number;
  pending: number;
  open: number;
  chargeSheetFiled: number;
  closed: number;
};

export type StationCategoryStat = {
  category: string;
  count: number;
  share: number;
};

export type StationTimeTrendPoint = {
  label: string;
  firCount: number;
};

export type StationRepeatIncident = {
  id: string;
  policeStation: string;
  district: string;
  crimeType: string;
  incidentCount: number;
  peakWindow: string;
  highestSeverity: CrimeSeverity;
  note: string;
};

export type StationResponseIndicator = {
  label: string;
  value: string;
  helper: string;
  available: boolean;
};

export type PoliceStationSummaryRow = {
  policeStation: string;
  district: string;
  firCount: number;
  solvedCount: number;
  pendingCount: number;
  solvedRate: number;
  dominantCategory: string;
  repeatIncidentCount: number;
  averageRiskScore: number;
  comparisonToDistrictAverage: number;
};

export type PoliceStationAnalyticsData = {
  source: "mock" | "real";
  generatedAt: string;
  filters: StationAnalyticsFilters;
  selectedStation: PoliceStationSummaryRow | null;
  totals: {
    firCount: number;
    stationCount: number;
    solvedRate: number;
    pendingCount: number;
    repeatIncidentCount: number;
  };
  statusBreakdown: StationStatusBreakdown;
  categoryDistribution: StationCategoryStat[];
  timeTrend: StationTimeTrendPoint[];
  repeatIncidents: StationRepeatIncident[];
  responseIndicators: StationResponseIndicator[];
  stationRows: PoliceStationSummaryRow[];
  emptyReason?: string;
};

export const DEFAULT_STATION_ANALYTICS_FILTERS: StationAnalyticsFilters = {
  range: "90d",
  district: "all",
  policeStation: "all",
  category: "all",
};
