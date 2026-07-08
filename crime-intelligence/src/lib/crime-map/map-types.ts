export type CrimeSeverity = "low" | "medium" | "high" | "critical";

export type CrimeIncidentProperties = {
  id: string;
  firNumber: string;
  crimeType: string;
  crimeCategory: string;
  district: string;
  policeStation: string;
  incidentDateTime: string;
  caseStatus: string;
  severity: CrimeSeverity;
  riskScore: number;
  addressText?: string;
  modusOperandi?: string;
};

export type CrimeIncidentFeature = GeoJSON.Feature<
  GeoJSON.Point,
  CrimeIncidentProperties
>;

export type CrimeIncidentFeatureCollection =
  GeoJSON.FeatureCollection<GeoJSON.Point, CrimeIncidentProperties>;

export type CrimeMapFilters = {
  district?: string;
  policeStation?: string;
  crimeType?: string;
  dateFrom?: string;
  dateTo?: string;
  severity?: CrimeSeverity | "all";
  caseStatus?: string;
  timeOfDay?: "all" | "morning" | "afternoon" | "evening" | "night";
  search?: string;
};

export type HotspotProperties = {
  id: string;
  h3CellId?: string;
  areaName?: string;
  incidentCount: number;
  dominantCrimeType: string;
  riskScore: number;
  severity: CrimeSeverity;
  trend: "falling" | "stable" | "rising" | "spike";
  peakTimeWindow?: string;
  confidence: "low" | "medium" | "high";
  explanation: string;
  scoringSignals: {
    frequencyScore: number;
    severityScore: number;
    recentGrowthScore: number;
    timePatternScore: number;
    repeatPatternScore: number;
  };
};

export type HotspotFeature = GeoJSON.Feature<
  GeoJSON.Polygon,
  HotspotProperties
>;

export type HotspotFeatureCollection =
  GeoJSON.FeatureCollection<GeoJSON.Polygon, HotspotProperties>;

export type PatternAlert = {
  id: string;
  title: string;
  description: string;
  alertType: "spike" | "cluster" | "repeat_pattern" | "trend";
  severity: CrimeSeverity;
  riskScore: number;
  district?: string;
  policeStation?: string;
  crimeType?: string;
  relatedIncidentCount: number;
  createdAt: string;
};

export type PoliceBoundaryProperties = {
  id: string;
  district: string;
  policeStation: string;
};

export type PoliceBoundaryFeature = GeoJSON.Feature<
  GeoJSON.Polygon,
  PoliceBoundaryProperties
>;

export type PoliceBoundaryFeatureCollection =
  GeoJSON.FeatureCollection<GeoJSON.Polygon, PoliceBoundaryProperties>;

export type CrimeMapSource = "real" | "mock";

export type CrimeIncidentsResponse = {
  source: CrimeMapSource;
  data: CrimeIncidentFeatureCollection;
};

export type CrimeHotspotsResponse = {
  source: CrimeMapSource;
  data: HotspotFeatureCollection;
  summary: {
    totalHotspots: number;
    criticalHotspots: number;
    risingAreas: number;
  };
  detection?: HotspotDetectionSummary;
};

export type PatternAlertsResponse = {
  source: CrimeMapSource;
  data: PatternAlert[];
};

export type CrimeCaseResponse = {
  source: CrimeMapSource;
  data: CrimeIncidentFeature | null;
};

export type CrimeMapLayerState = {
  incidents: boolean;
  clusters: boolean;
  heatmap: boolean;
  hotspots: boolean;
  boundaries: boolean;
};

export type HotspotRanking = {
  name: string;
  incidentCount: number;
  hotspotCount: number;
  dominantCrimeType: string;
  averageRiskScore: number;
  highestSeverity: CrimeSeverity;
};

export type HotspotTimeWindow = {
  window: "morning" | "afternoon" | "evening" | "night";
  incidentCount: number;
  hotspotCount: number;
  averageRiskScore: number;
};

export type HotspotCategoryStat = {
  crimeType: string;
  incidentCount: number;
  hotspotCount: number;
  averageRiskScore: number;
};

export type HotspotDetectionSummary = {
  scoringFormula: string;
  limitations: string[];
  humanReviewRequired: boolean;
  districtRankings: HotspotRanking[];
  policeStationRankings: HotspotRanking[];
  timeWindows: HotspotTimeWindow[];
  categoryHotspots: HotspotCategoryStat[];
};

export type MapBoundsQuery = {
  bounds?: string;
  zoom?: string;
};

export const DEFAULT_CRIME_MAP_FILTERS: Required<CrimeMapFilters> = {
  district: "all",
  policeStation: "all",
  crimeType: "all",
  dateFrom: "2026-06-01",
  dateTo: "2026-07-08",
  severity: "all",
  caseStatus: "all",
  timeOfDay: "all",
  search: "",
};

export const DEFAULT_CRIME_MAP_LAYERS: CrimeMapLayerState = {
  incidents: true,
  clusters: true,
  heatmap: true,
  hotspots: true,
  boundaries: false,
};
