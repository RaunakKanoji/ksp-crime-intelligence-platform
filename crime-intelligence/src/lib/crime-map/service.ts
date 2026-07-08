import { CATEGORIES, DISTRICTS } from "@/lib/dashboard/types";
import { STATIONS } from "@/lib/dashboard/summary";
import { hasPermission, type UserRole } from "@/lib/permissions";
import {
  CRIME_MAP_TABLES,
  DEFAULT_MAP_FILTERS,
  type BoundaryProperties,
  type CasePreview,
  type ClusterProperties,
  type CrimeCluster,
  type CrimeHotspotCell,
  type CrimeIncidentRecord,
  type CrimePatternAlert,
  type GeoJsonFeatureCollection,
  type GeoJsonPointFeature,
  type GeoJsonPolygonFeature,
  type HotspotProperties,
  type IncidentMapProperties,
  type MapApiResponse,
  type MapAuditLogEntry,
  type MapFilters,
  type PoliceStationBoundary,
  type Severity,
  type TimelinePoint,
} from "./types";

type IncidentFeature = GeoJsonPointFeature<IncidentMapProperties>;
type HotspotFeature = GeoJsonPointFeature<HotspotProperties>;
type ClusterFeature = GeoJsonPointFeature<ClusterProperties>;
type BoundaryFeature = GeoJsonPolygonFeature<BoundaryProperties>;

const ALL_STATUSES = ["Open", "Under Investigation", "Charge Sheet Filed", "Closed"];
const ALL_SEVERITIES = ["low", "medium", "high", "critical"];
const ALL_TIMES = ["morning", "afternoon", "evening", "night"];

const SAMPLE_INCIDENTS: CrimeIncidentRecord[] = [
  incident("CM-001", "BLR-CEN-2026-0142", "Vehicle theft", "Theft", "2026-07-02T20:20:00+05:30", "Bengaluru City", "Central Division", "Commercial parking area, MG Road", 12.9759, 77.6068, "Under Investigation", "high", 85000, null, "Parking-lot vehicle lift using duplicate key."),
  incident("CM-002", "BLR-CEN-2026-0147", "Vehicle theft", "Theft", "2026-07-04T21:10:00+05:30", "Bengaluru City", "Central Division", "Transit parking, Richmond Road", 12.9669, 77.5994, "Open", "high", 72000, null, "Evening two-wheeler theft near mixed commercial zone."),
  incident("CM-003", "BLR-WFD-2026-0188", "UPI fraud", "Cybercrime", "2026-06-24T15:05:00+05:30", "Bengaluru City", "Whitefield", "IT corridor service road", 12.9698, 77.7499, "Open", "medium", 46000, null, "Phone impersonation followed by payment-link fraud."),
  incident("CM-004", "BLR-WFD-2026-0194", "Credential misuse", "Cybercrime", "2026-07-01T14:40:00+05:30", "Bengaluru City", "Whitefield", "Business park area", 12.9823, 77.7284, "Under Investigation", "medium", 38000, null, "Account recovery pattern with repeated wallet attempts."),
  incident("CM-005", "BLR-KEN-2026-0117", "House break-in", "Property", "2026-06-18T02:10:00+05:30", "Bengaluru City", "Kengeri", "Residential lane near satellite bus stop", 12.9177, 77.4848, "Charge Sheet Filed", "critical", 210000, "Iron rod", "Night entry through rear window."),
  incident("CM-006", "MYS-DVR-2026-0064", "Assault", "Assault", "2026-06-11T19:30:00+05:30", "Mysuru", "Devaraja", "Market street", 12.3094, 76.6532, "Under Investigation", "medium", 0, "Blunt object", "Dispute escalated near crowded market area."),
  incident("CM-007", "MYS-NZR-2026-0079", "Harassment", "Women Safety", "2026-05-29T18:15:00+05:30", "Mysuru", "Nazarbad", "Transit point near bus stand", 12.3051, 76.6651, "Open", "high", 0, null, "Repeated evening harassment complaints near transit area."),
  incident("CM-008", "BLG-CMP-2026-0041", "Narcotics seizure", "Narcotics", "2026-05-17T23:45:00+05:30", "Belagavi", "Camp", "Highway checkpoint", 15.8584, 74.5123, "Under Investigation", "critical", 0, null, "Late-night movement and seizure at checkpoint."),
  incident("CM-009", "KLB-SBZ-2026-0033", "Rash driving", "Traffic", "2026-04-22T09:15:00+05:30", "Kalaburagi", "Station Bazar", "Main junction", 17.3297, 76.8343, "Closed", "low", 12000, null, "Morning junction rash-driving case."),
  incident("CM-010", "MNG-BRK-2026-0058", "Identity misuse", "Cybercrime", "2026-04-09T11:25:00+05:30", "Mangaluru", "Barke", "Commercial office block", 12.8846, 74.8411, "Charge Sheet Filed", "medium", 61000, null, "Wallet access misuse using identity documents."),
  incident("CM-011", "HBD-VID-2026-0092", "Mobile theft", "Theft", "2026-06-29T20:55:00+05:30", "Hubballi-Dharwad", "Vidyanagar", "Retail premises", 15.3647, 75.124, "Open", "medium", 22000, null, "Evening theft from crowded retail counter."),
  incident("CM-012", "HBD-VID-2026-0098", "Mobile theft", "Theft", "2026-07-03T19:35:00+05:30", "Hubballi-Dharwad", "Vidyanagar", "Market lane", 15.371, 75.1189, "Open", "medium", 26000, null, "Similar timing and crowded-location method."),
];

const SAMPLE_BOUNDARIES: PoliceStationBoundary[] = [
  boundary("BD-001", "Bengaluru City", "Central Division", [[77.57, 12.94], [77.64, 12.94], [77.64, 13.0], [77.57, 13.0], [77.57, 12.94]]),
  boundary("BD-002", "Bengaluru City", "Whitefield", [[77.69, 12.94], [77.78, 12.94], [77.78, 13.02], [77.69, 13.02], [77.69, 12.94]]),
  boundary("BD-003", "Mysuru", "Nazarbad", [[76.63, 12.28], [76.69, 12.28], [76.69, 12.33], [76.63, 12.33], [76.63, 12.28]]),
  boundary("BD-004", "Hubballi-Dharwad", "Vidyanagar", [[75.09, 15.34], [75.15, 15.34], [75.15, 15.39], [75.09, 15.39], [75.09, 15.34]]),
];

const AUDIT_LOG: MapAuditLogEntry[] = [];

function incident(id: string, fir: string, type: string, category: string, date: string, district: string, station: string, address: string, lat: number, lon: number, status: CrimeIncidentRecord["case_status"], severity: Severity, loss: number, weapon: string | null, mo: string): CrimeIncidentRecord {
  return {
    id,
    fir_number: fir,
    crime_type: type,
    crime_category: category,
    ipc_bns_sections: category === "Cybercrime" ? ["IT Act 66C/66D"] : ["IPC/BNS mapped section"],
    incident_datetime: date,
    reported_datetime: date,
    district,
    police_station: station,
    address_text: address,
    latitude: lat,
    longitude: lon,
    accuracy_level: severity === "critical" ? "area" : "street",
    case_status: status,
    accused_count: status === "Open" ? 0 : 1,
    victim_count: 1,
    property_loss_value: loss,
    weapon_used: weapon,
    modus_operandi: mo,
    severity,
    created_at: "2026-07-08T09:00:00+05:30",
    updated_at: "2026-07-08T09:00:00+05:30",
  };
}

function boundary(id: string, district: string, station: string, polygon: [number, number][]): PoliceStationBoundary {
  return { id, district, police_station: station, polygon };
}

export function normalizeMapFilters(input: Partial<MapFilters>): MapFilters {
  const district = input.district && (input.district === "all" || (DISTRICTS as readonly string[]).includes(input.district)) ? input.district : "all";
  const stationOptions = district === "all" ? DISTRICTS.flatMap((d) => STATIONS[d]) : STATIONS[district as keyof typeof STATIONS] ?? [];
  const policeStation = input.policeStation && (input.policeStation === "all" || stationOptions.includes(input.policeStation)) ? input.policeStation : "all";
  const crimeType = input.crimeType && (input.crimeType === "all" || (CATEGORIES as readonly string[]).includes(input.crimeType)) ? input.crimeType : "all";
  const caseStatus = input.caseStatus && (input.caseStatus === "all" || ALL_STATUSES.includes(input.caseStatus)) ? input.caseStatus : "all";
  const severity = input.severity && (input.severity === "all" || ALL_SEVERITIES.includes(input.severity)) ? input.severity : "all";
  const timeOfDay = input.timeOfDay && (input.timeOfDay === "all" || ALL_TIMES.includes(input.timeOfDay)) ? input.timeOfDay : "all";
  const dateFrom = /^\d{4}-\d{2}-\d{2}$/.test(input.dateFrom ?? "") ? input.dateFrom! : DEFAULT_MAP_FILTERS.dateFrom;
  const dateTo = /^\d{4}-\d{2}-\d{2}$/.test(input.dateTo ?? "") && input.dateTo! >= dateFrom ? input.dateTo! : DEFAULT_MAP_FILTERS.dateTo;
  const search = (input.search ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  return { district, policeStation, crimeType, dateFrom, dateTo, caseStatus, severity, timeOfDay, search };
}

export function parseMapRequest(url: string): { filters: MapFilters; role: UserRole } {
  const params = new URL(url).searchParams;
  const roleParam = params.get("role");
  const role: UserRole = roleParam && ["Admin", "Investigator", "Analyst", "Officer", "Viewer"].includes(roleParam) ? (roleParam as UserRole) : "Viewer";
  return {
    role,
    filters: normalizeMapFilters({
      district: params.get("district") ?? undefined,
      policeStation: params.get("policeStation") ?? undefined,
      crimeType: params.get("crimeType") ?? undefined,
      dateFrom: params.get("dateFrom") ?? undefined,
      dateTo: params.get("dateTo") ?? undefined,
      caseStatus: params.get("caseStatus") ?? undefined,
      severity: params.get("severity") ?? undefined,
      timeOfDay: params.get("timeOfDay") ?? undefined,
      search: params.get("search") ?? undefined,
    }),
  };
}

export function canViewCrimeMap(role: UserRole): boolean {
  return hasPermission(role, "page:map");
}

export function preparedCrimeMapTables() {
  return CRIME_MAP_TABLES.map((name) => ({ name, status: "prepared-for-catalyst-data-store" }));
}

export function logMapAudit(action: MapAuditLogEntry["action"], role: UserRole, filters: MapFilters): void {
  AUDIT_LOG.push({ id: `MAP-AUDIT-${AUDIT_LOG.length + 1}`, action, role, filters, created_at: new Date().toISOString() });
}

function hourBucket(dateTime: string) {
  const hour = new Date(dateTime).getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

function filteredIncidents(filters: MapFilters): CrimeIncidentRecord[] {
  const q = filters.search.toLowerCase();
  return SAMPLE_INCIDENTS.filter((item) => {
    const day = item.incident_datetime.slice(0, 10);
    return (filters.district === "all" || item.district === filters.district)
      && (filters.policeStation === "all" || item.police_station === filters.policeStation)
      && (filters.crimeType === "all" || item.crime_category === filters.crimeType)
      && (filters.caseStatus === "all" || item.case_status === filters.caseStatus)
      && (filters.severity === "all" || item.severity === filters.severity)
      && (filters.timeOfDay === "all" || hourBucket(item.incident_datetime) === filters.timeOfDay)
      && day >= filters.dateFrom
      && day <= filters.dateTo
      && (!q || `${item.fir_number} ${item.crime_type} ${item.district} ${item.police_station}`.toLowerCase().includes(q));
  });
}

function maskCoordinates(item: CrimeIncidentRecord, role: UserRole): [number, number] {
  if (hasPermission(role, "data:view-investigation-notes")) return [item.longitude, item.latitude];
  return [Number((item.longitude + 0.006).toFixed(4)), Number((item.latitude + 0.006).toFixed(4))];
}

function response<T>(filters: MapFilters, role: UserRole, data: T): MapApiResponse<T> {
  return {
    isSampleData: true,
    generatedAt: new Date().toISOString(),
    filters,
    redaction: {
      exactCoordinates: hasPermission(role, "data:view-investigation-notes"),
      investigationNotes: hasPermission(role, "data:view-investigation-notes"),
    },
    data,
  };
}

export async function getMapIncidents(filters: MapFilters, role: UserRole): Promise<MapApiResponse<GeoJsonFeatureCollection<IncidentFeature>>> {
  await new Promise((resolve) => setTimeout(resolve, 120));
  const features = filteredIncidents(filters).map((item) => ({
    type: "Feature" as const,
    geometry: { type: "Point" as const, coordinates: maskCoordinates(item, role) },
    properties: {
      id: item.id,
      firNumber: item.fir_number,
      crimeType: item.crime_type,
      crimeCategory: item.crime_category,
      incidentDateTime: item.incident_datetime,
      district: item.district,
      policeStation: item.police_station,
      accuracyLevel: item.accuracy_level,
      caseStatus: item.case_status,
      severity: item.severity,
      safeLocationLabel: hasPermission(role, "data:view-investigation-notes") ? item.address_text : `${item.police_station} area`,
    },
  }));
  return response(filters, role, { type: "FeatureCollection", features });
}

function buildHotspots(filters: MapFilters): CrimeHotspotCell[] {
  const groups = new Map<string, CrimeIncidentRecord[]>();
  for (const item of filteredIncidents(filters)) {
    const key = `${item.district}|${item.police_station}|${Math.floor(item.latitude * 20)}|${Math.floor(item.longitude * 20)}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return Array.from(groups.entries())
    .filter(([, rows]) => rows.length >= 2)
    .map(([key, rows], index) => {
      const counts: Record<string, number> = {};
      rows.forEach((row) => {
        counts[row.crime_category] = (counts[row.crime_category] ?? 0) + 1;
      });
      const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Mixed";
      const previous = Math.max(1, Math.round(rows.length * (index % 2 === 0 ? 0.45 : 0.8)));
      const [district, station] = key.split("|");
      return {
        id: `HOT-${index + 1}`,
        district,
        police_station: station,
        cell_id: key,
        center: [rows.reduce((s, r) => s + r.longitude, 0) / rows.length, rows.reduce((s, r) => s + r.latitude, 0) / rows.length],
        radius_meters: 850,
        incident_count: rows.length,
        previous_incident_count: previous,
        dominant_crime_type: dominant,
        peak_time_window: "18:00-22:00",
        trend: rows.length > previous ? "up" : "flat",
        risk_level: rows.some((r) => r.severity === "critical") ? "critical" : "high",
        summary: `Hotspot identified: ${rows.length} incidents grouped in ${station}. Pattern detected around ${dominant.toLowerCase()} activity.`,
      };
    });
}

export async function getMapHotspots(filters: MapFilters, role: UserRole): Promise<MapApiResponse<GeoJsonFeatureCollection<HotspotFeature>>> {
  const features = buildHotspots(filters).map((cell) => ({
    type: "Feature" as const,
    geometry: { type: "Point" as const, coordinates: cell.center },
    properties: {
      id: cell.id,
      district: cell.district,
      policeStation: cell.police_station,
      incidentCount: cell.incident_count,
      previousIncidentCount: cell.previous_incident_count,
      dominantCrimeType: cell.dominant_crime_type,
      peakTimeWindow: cell.peak_time_window,
      trend: cell.trend,
      riskLevel: cell.risk_level,
      summary: cell.summary,
      radiusMeters: cell.radius_meters,
    },
  }));
  return response(filters, role, { type: "FeatureCollection", features });
}

export async function getMapClusters(filters: MapFilters, role: UserRole): Promise<MapApiResponse<GeoJsonFeatureCollection<ClusterFeature>>> {
  const clusters: CrimeCluster[] = buildHotspots(filters).map((cell) => ({ id: cell.id.replace("HOT", "CLU"), center: cell.center, incident_count: cell.incident_count, dominant_crime_type: cell.dominant_crime_type, district: cell.district, police_station: cell.police_station, severity: cell.risk_level }));
  const features = clusters.map((cluster) => ({ type: "Feature" as const, geometry: { type: "Point" as const, coordinates: cluster.center }, properties: { id: cluster.id, incidentCount: cluster.incident_count, dominantCrimeType: cluster.dominant_crime_type, district: cluster.district, policeStation: cluster.police_station, severity: cluster.severity } }));
  return response(filters, role, { type: "FeatureCollection", features });
}

export async function getMapTimeline(filters: MapFilters, role: UserRole): Promise<MapApiResponse<TimelinePoint[]>> {
  const counts = new Map<string, number>();
  for (const item of filteredIncidents(filters)) counts.set(item.incident_datetime.slice(0, 10), (counts.get(item.incident_datetime.slice(0, 10)) ?? 0) + 1);
  const data = Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([label, incidentCount]) => ({ label, incidentCount }));
  return response(filters, role, data);
}

export async function getMapPatternAlerts(filters: MapFilters, role: UserRole): Promise<MapApiResponse<CrimePatternAlert[]>> {
  const alerts = buildHotspots(filters)
    .filter((cell) => cell.incident_count >= cell.previous_incident_count * 1.5)
    .map((cell) => ({
      id: `ALERT-${cell.id}`,
      title: "Spike observed",
      district: cell.district,
      police_station: cell.police_station,
      hotspot_id: cell.id,
      crime_type: cell.dominant_crime_type,
      severity: cell.risk_level,
      observed_count: cell.incident_count,
      baseline_count: cell.previous_incident_count,
      message: `Spike observed in ${cell.police_station}: ${cell.incident_count} ${cell.dominant_crime_type.toLowerCase()} incidents compared with ${cell.previous_incident_count} in the previous period.`,
      raised_at: "2026-07-08T09:15:00+05:30",
    }));
  return response(filters, role, alerts);
}

export async function getMapBoundaries(filters: MapFilters, role: UserRole): Promise<MapApiResponse<GeoJsonFeatureCollection<BoundaryFeature>>> {
  const features: BoundaryFeature[] = SAMPLE_BOUNDARIES.filter((b) => (filters.district === "all" || b.district === filters.district) && (filters.policeStation === "all" || b.police_station === filters.policeStation)).map((b) => ({ type: "Feature" as const, geometry: { type: "Polygon" as const, coordinates: [b.polygon] }, properties: { id: b.id, district: b.district, policeStation: b.police_station } }));
  return response(filters, role, { type: "FeatureCollection", features });
}

export async function getMapCasePreview(id: string, role: UserRole): Promise<MapApiResponse<CasePreview | null>> {
  const filters = DEFAULT_MAP_FILTERS;
  const item = SAMPLE_INCIDENTS.find((row) => row.id === id) ?? null;
  if (!item) return response(filters, role, null);
  const canViewIntel = hasPermission(role, "data:view-investigation-notes");
  return response(filters, role, {
    id: item.id,
    firNumber: item.fir_number,
    crimeType: item.crime_type,
    crimeCategory: item.crime_category,
    incidentDateTime: item.incident_datetime,
    reportedDateTime: item.reported_datetime,
    district: item.district,
    policeStation: item.police_station,
    safeLocationLabel: canViewIntel ? item.address_text : `${item.police_station} area`,
    accuracyLevel: item.accuracy_level,
    caseStatus: item.case_status,
    sections: item.ipc_bns_sections,
    severity: item.severity,
    propertyLossValue: canViewIntel ? item.property_loss_value : null,
    weaponUsed: canViewIntel ? item.weapon_used : null,
    modusOperandi: canViewIntel ? item.modus_operandi : null,
  });
}
