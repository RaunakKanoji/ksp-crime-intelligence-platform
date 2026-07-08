import {
  DEFAULT_CRIME_MAP_FILTERS,
  type CrimeCaseResponse,
  type CrimeHotspotsResponse,
  type CrimeIncidentFeatureCollection,
  type CrimeIncidentsResponse,
  type CrimeMapFilters,
  type HotspotDetectionSummary,
  type HotspotFeatureCollection,
  type PatternAlert,
  type PatternAlertsResponse,
  type PoliceBoundaryFeatureCollection,
} from "./map-types";
import { aggregateIncidentsByH3 } from "./h3-utils";
import { buildHotspotDetectionSummary } from "./hotspot-detection";
import { filterCrimeIncidents, serializeCrimeMapFilters } from "./map-utils";
import {
  MOCK_CRIME_INCIDENTS,
  MOCK_PATTERN_ALERTS,
  MOCK_POLICE_BOUNDARIES,
} from "./mock-crime-data";

export type ApiResult<T> = {
  source: "real" | "mock";
  data: T;
};

function withDefaults(filters: CrimeMapFilters): CrimeMapFilters {
  return { ...DEFAULT_CRIME_MAP_FILTERS, ...filters };
}

async function requestJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function getMockIncidents(filters: CrimeMapFilters): CrimeIncidentFeatureCollection {
  return filterCrimeIncidents(MOCK_CRIME_INCIDENTS, withDefaults(filters));
}

export function getMockHotspots(filters: CrimeMapFilters): HotspotFeatureCollection {
  return aggregateIncidentsByH3(getMockIncidents(filters), 7);
}

export function getMockHotspotDetection(filters: CrimeMapFilters): HotspotDetectionSummary {
  const incidents = getMockIncidents(filters);
  return buildHotspotDetectionSummary(incidents, aggregateIncidentsByH3(incidents, 7));
}

export function getMockPatternAlerts(filters: CrimeMapFilters): PatternAlert[] {
  const normalized = withDefaults(filters);
  return MOCK_PATTERN_ALERTS.filter((alert) =>
    (!normalized.district || normalized.district === "all" || alert.district === normalized.district)
    && (!normalized.policeStation || normalized.policeStation === "all" || alert.policeStation === normalized.policeStation)
    && (!normalized.crimeType || normalized.crimeType === "all" || alert.crimeType === normalized.crimeType)
    && (!normalized.severity || normalized.severity === "all" || alert.severity === normalized.severity)
  );
}

export function getMockBoundaries(): PoliceBoundaryFeatureCollection {
  return MOCK_POLICE_BOUNDARIES;
}

export async function getCrimeIncidents(
  filters: CrimeMapFilters,
  role = "Analyst"
): Promise<CrimeIncidentFeatureCollection> {
  const params = serializeCrimeMapFilters({ ...filters, search: filters.search });
  const prefix = params ? `${params}&` : "";
  const response = await requestJson<CrimeIncidentsResponse>(`/api/map/incidents?${prefix}role=${role}`);
  return response?.data ?? getMockIncidents(filters);
}

export async function getCrimeHotspots(
  filters: CrimeMapFilters,
  role = "Analyst"
): Promise<HotspotFeatureCollection> {
  const params = serializeCrimeMapFilters(filters);
  const prefix = params ? `${params}&` : "";
  const response = await requestJson<CrimeHotspotsResponse>(`/api/map/hotspots?${prefix}role=${role}`);
  return response?.data ?? getMockHotspots(filters);
}

export async function getPatternAlerts(
  filters: CrimeMapFilters,
  role = "Analyst"
): Promise<PatternAlert[]> {
  const params = serializeCrimeMapFilters(filters);
  const prefix = params ? `${params}&` : "";
  const response = await requestJson<PatternAlertsResponse>(`/api/map/pattern-alerts?${prefix}role=${role}`);
  return response?.data ?? getMockPatternAlerts(filters);
}

export async function getCrimeMapBundle(filters: CrimeMapFilters, role = "Analyst") {
  const params = serializeCrimeMapFilters(filters);
  const prefix = params ? `${params}&` : "";

  const [incidentsResponse, hotspotsResponse, alertsResponse] = await Promise.all([
    requestJson<CrimeIncidentsResponse>(`/api/map/incidents?${prefix}role=${role}`),
    requestJson<CrimeHotspotsResponse>(`/api/map/hotspots?${prefix}role=${role}`),
    requestJson<PatternAlertsResponse>(`/api/map/pattern-alerts?${prefix}role=${role}`),
  ]);

  const incidents = incidentsResponse?.data ?? getMockIncidents(filters);
  const hotspots = hotspotsResponse?.data ?? aggregateIncidentsByH3(incidents, 7);
  const alerts = alertsResponse?.data ?? getMockPatternAlerts(filters);
  const detection = hotspotsResponse?.detection ?? buildHotspotDetectionSummary(incidents, hotspots);

  return {
    source: incidentsResponse?.source ?? "mock",
    incidents,
    hotspots,
    alerts,
    detection,
    boundaries: getMockBoundaries(),
  };
}

export async function getCrimeCase(id: string, role = "Analyst"): Promise<CrimeCaseResponse> {
  const response = await requestJson<CrimeCaseResponse>(`/api/map/case/${encodeURIComponent(id)}?role=${role}`);
  return response ?? {
    source: "mock",
    data: MOCK_CRIME_INCIDENTS.features.find((item) => item.properties.id === id) ?? null,
  };
}
