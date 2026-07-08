import type { UserRole } from "@/lib/permissions";

export type MapCaseStatus = "Open" | "Under Investigation" | "Charge Sheet Filed" | "Closed";
export type AccuracyLevel = "exact" | "street" | "area" | "station";
export type Severity = "low" | "medium" | "high" | "critical";
export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
export type Trend = "up" | "down" | "flat";

export interface MapFilters {
  district: string;
  policeStation: string;
  crimeType: string;
  dateFrom: string;
  dateTo: string;
  caseStatus: string;
  severity: string;
  timeOfDay: string;
  search: string;
}

export interface CrimeIncidentRecord {
  id: string;
  fir_number: string;
  crime_type: string;
  crime_category: string;
  ipc_bns_sections: string[];
  incident_datetime: string;
  reported_datetime: string;
  district: string;
  police_station: string;
  address_text: string;
  latitude: number;
  longitude: number;
  accuracy_level: AccuracyLevel;
  case_status: MapCaseStatus;
  accused_count: number;
  victim_count: number;
  property_loss_value: number;
  weapon_used: string | null;
  modus_operandi: string;
  severity: Severity;
  created_at: string;
  updated_at: string;
}

export interface CrimeHotspotCell {
  id: string;
  district: string;
  police_station: string;
  cell_id: string;
  center: [number, number];
  radius_meters: number;
  incident_count: number;
  previous_incident_count: number;
  dominant_crime_type: string;
  peak_time_window: string;
  trend: Trend;
  risk_level: Severity;
  summary: string;
}

export interface CrimeCluster {
  id: string;
  center: [number, number];
  incident_count: number;
  dominant_crime_type: string;
  district: string;
  police_station: string;
  severity: Severity;
}

export interface CrimePatternAlert {
  id: string;
  title: string;
  district: string;
  police_station: string;
  hotspot_id: string;
  crime_type: string;
  severity: Severity;
  observed_count: number;
  baseline_count: number;
  message: string;
  raised_at: string;
}

export interface PoliceStationBoundary {
  id: string;
  district: string;
  police_station: string;
  polygon: [number, number][];
}

export interface MapAuditLogEntry {
  id: string;
  action: "search" | "filter" | "export" | "case-view" | "hotspot-view";
  role: UserRole;
  filters: MapFilters;
  created_at: string;
}

export type GeoJsonPointFeature<T> = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: T;
};

export type GeoJsonPolygonFeature<T> = {
  type: "Feature";
  geometry: { type: "Polygon"; coordinates: [Array<[number, number]>] };
  properties: T;
};

export interface GeoJsonFeatureCollection<F> {
  type: "FeatureCollection";
  features: F[];
}

export interface IncidentMapProperties {
  id: string;
  firNumber: string;
  crimeType: string;
  crimeCategory: string;
  incidentDateTime: string;
  district: string;
  policeStation: string;
  accuracyLevel: AccuracyLevel;
  caseStatus: MapCaseStatus;
  severity: Severity;
  safeLocationLabel: string;
}

export interface HotspotProperties {
  id: string;
  district: string;
  policeStation: string;
  incidentCount: number;
  previousIncidentCount: number;
  dominantCrimeType: string;
  peakTimeWindow: string;
  trend: Trend;
  riskLevel: Severity;
  summary: string;
  radiusMeters: number;
}

export interface ClusterProperties {
  id: string;
  incidentCount: number;
  dominantCrimeType: string;
  district: string;
  policeStation: string;
  severity: Severity;
}

export interface BoundaryProperties {
  id: string;
  district: string;
  policeStation: string;
}

export interface CasePreview {
  id: string;
  firNumber: string;
  crimeType: string;
  crimeCategory: string;
  incidentDateTime: string;
  reportedDateTime: string;
  district: string;
  policeStation: string;
  safeLocationLabel: string;
  accuracyLevel: AccuracyLevel;
  caseStatus: MapCaseStatus;
  sections: string[];
  severity: Severity;
  propertyLossValue: number | null;
  weaponUsed: string | null;
  modusOperandi: string | null;
}

export interface MapApiResponse<T> {
  isSampleData: boolean;
  generatedAt: string;
  filters: MapFilters;
  redaction: { exactCoordinates: boolean; investigationNotes: boolean };
  data: T;
}

export interface TimelinePoint {
  label: string;
  incidentCount: number;
}

export const DEFAULT_MAP_FILTERS: MapFilters = {
  district: "all",
  policeStation: "all",
  crimeType: "all",
  dateFrom: "2026-06-01",
  dateTo: "2026-07-08",
  caseStatus: "all",
  severity: "all",
  timeOfDay: "all",
  search: "",
};

export const CRIME_MAP_TABLES = [
  "CrimeIncident",
  "CrimeHotspotCell",
  "CrimeCluster",
  "CrimePatternAlert",
  "PoliceStationBoundary",
  "MapAuditLog",
] as const;
