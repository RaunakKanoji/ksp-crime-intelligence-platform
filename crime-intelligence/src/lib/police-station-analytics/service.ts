import { DISTRICTS } from "@/lib/dashboard/types";
import { STATIONS } from "@/lib/dashboard/summary";
import { MOCK_CRIME_INCIDENTS } from "@/lib/crime-map/mock-crime-data";
import { getTimeOfDay, topCrimeType } from "@/lib/crime-map/map-utils";
import type { CrimeIncidentFeature, CrimeSeverity } from "@/lib/crime-map/map-types";
import {
  DEFAULT_STATION_ANALYTICS_FILTERS,
  type PoliceStationAnalyticsData,
  type PoliceStationSummaryRow,
  type StationAnalyticsFilters,
  type StationAnalyticsRange,
  type StationCategoryStat,
  type StationRepeatIncident,
  type StationStatusBreakdown,
  type StationTimeTrendPoint,
} from "./types";

const RANGE_DAYS: Record<StationAnalyticsRange, number> = {
  "30d": 30,
  "90d": 90,
  "180d": 180,
  "1y": 365,
};

const REFERENCE_DATE = "2026-07-08";

function rangeStart(range: StationAnalyticsRange): string {
  const date = new Date(`${REFERENCE_DATE}T00:00:00+05:30`);
  date.setDate(date.getDate() - RANGE_DAYS[range]);
  return date.toISOString().slice(0, 10);
}

function normalizeFilters(input: Partial<StationAnalyticsFilters>): StationAnalyticsFilters {
  const range = input.range && input.range in RANGE_DAYS ? input.range : DEFAULT_STATION_ANALYTICS_FILTERS.range;
  const district =
    input.district && (input.district === "all" || (DISTRICTS as readonly string[]).includes(input.district))
      ? input.district
      : "all";
  const stationOptions =
    district === "all" ? DISTRICTS.flatMap((item) => STATIONS[item]) : STATIONS[district as keyof typeof STATIONS] ?? [];
  const policeStation =
    input.policeStation && (input.policeStation === "all" || stationOptions.includes(input.policeStation))
      ? input.policeStation
      : "all";
  return {
    range,
    district,
    policeStation,
    category: input.category?.trim() || "all",
  };
}

function inScope(incident: CrimeIncidentFeature, filters: StationAnalyticsFilters): boolean {
  const props = incident.properties;
  const day = props.incidentDateTime.slice(0, 10);
  return day >= rangeStart(filters.range)
    && day <= REFERENCE_DATE
    && (filters.district === "all" || props.district === filters.district)
    && (filters.policeStation === "all" || props.policeStation === filters.policeStation)
    && (filters.category === "all" || props.crimeType === filters.category || props.crimeCategory === filters.category);
}

function solvedLike(status: string): boolean {
  return status === "Closed" || status === "Charge Sheet Filed";
}

function pendingLike(status: string): boolean {
  return status === "Open" || status === "Under Investigation";
}

function statusBreakdown(incidents: CrimeIncidentFeature[]): StationStatusBreakdown {
  return {
    solved: incidents.filter((item) => solvedLike(item.properties.caseStatus)).length,
    pending: incidents.filter((item) => pendingLike(item.properties.caseStatus)).length,
    open: incidents.filter((item) => item.properties.caseStatus === "Open").length,
    chargeSheetFiled: incidents.filter((item) => item.properties.caseStatus === "Charge Sheet Filed").length,
    closed: incidents.filter((item) => item.properties.caseStatus === "Closed").length,
  };
}

function categoryDistribution(incidents: CrimeIncidentFeature[]): StationCategoryStat[] {
  const counts = new Map<string, number>();
  incidents.forEach((item) => {
    counts.set(item.properties.crimeType, (counts.get(item.properties.crimeType) ?? 0) + 1);
  });
  const total = Math.max(1, incidents.length);
  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count, share: count / total }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
}

function highestSeverity(incidents: CrimeIncidentFeature[]): CrimeSeverity {
  const order: CrimeSeverity[] = ["critical", "high", "medium", "low"];
  return order.find((severity) => incidents.some((item) => item.properties.severity === severity)) ?? "low";
}

function repeatIncidents(incidents: CrimeIncidentFeature[]): StationRepeatIncident[] {
  const groups = new Map<string, CrimeIncidentFeature[]>();
  incidents.forEach((item) => {
    const key = `${item.properties.district}|${item.properties.policeStation}|${item.properties.crimeType}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });

  return Array.from(groups.entries())
    .filter(([, rows]) => rows.length >= 2)
    .map(([key, rows], index) => {
      const [district, policeStation, crimeType] = key.split("|");
      const windows = new Map<string, number>();
      rows.forEach((item) => {
        const bucket = getTimeOfDay(item.properties.incidentDateTime);
        windows.set(bucket, (windows.get(bucket) ?? 0) + 1);
      });
      const peakWindow = Array.from(windows.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "mixed";
      return {
        id: `REPEAT-${String(index + 1).padStart(3, "0")}`,
        district,
        policeStation,
        crimeType,
        incidentCount: rows.length,
        peakWindow,
        highestSeverity: highestSeverity(rows),
        note: `Repeat incidents detected for ${crimeType.toLowerCase()} in ${policeStation}. Review similar FIR attributes before operational decisions.`,
      };
    })
    .sort((a, b) => b.incidentCount - a.incidentCount)
    .slice(0, 8);
}

function timeTrend(incidents: CrimeIncidentFeature[]): StationTimeTrendPoint[] {
  const counts = new Map<string, number>();
  incidents.forEach((item) => {
    const date = new Date(item.properties.incidentDateTime);
    const label = date.toLocaleString("en-IN", { month: "short" });
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  const order = ["Apr", "May", "Jun", "Jul"];
  return order.map((label) => ({ label, firCount: counts.get(label) ?? 0 }));
}

function averageRisk(incidents: CrimeIncidentFeature[]): number {
  if (incidents.length === 0) return 0;
  return Math.round(incidents.reduce((sum, item) => sum + item.properties.riskScore, 0) / incidents.length);
}

function buildStationRows(incidents: CrimeIncidentFeature[]): PoliceStationSummaryRow[] {
  const groups = new Map<string, CrimeIncidentFeature[]>();
  incidents.forEach((item) => {
    const key = `${item.properties.district}|${item.properties.policeStation}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });

  const districtAverages = new Map<string, number>();
  Array.from(groups.entries()).forEach(([key, rows]) => {
    const [district] = key.split("|");
    const districtGroups = Array.from(groups.entries()).filter(([groupKey]) => groupKey.startsWith(`${district}|`));
    const average = districtGroups.reduce((sum, [, groupRows]) => sum + groupRows.length, 0) / Math.max(1, districtGroups.length);
    districtAverages.set(district, average);
  });

  return Array.from(groups.entries())
    .map(([key, rows]) => {
      const [district, policeStation] = key.split("|");
      const solvedCount = rows.filter((item) => solvedLike(item.properties.caseStatus)).length;
      const repeatCount = repeatIncidents(rows).reduce((sum, item) => sum + item.incidentCount, 0);
      const districtAverage = districtAverages.get(district) ?? rows.length;
      return {
        district,
        policeStation,
        firCount: rows.length,
        solvedCount,
        pendingCount: rows.filter((item) => pendingLike(item.properties.caseStatus)).length,
        solvedRate: rows.length ? Math.round((solvedCount / rows.length) * 100) : 0,
        dominantCategory: topCrimeType(rows),
        repeatIncidentCount: repeatCount,
        averageRiskScore: averageRisk(rows),
        comparisonToDistrictAverage: Math.round((rows.length - districtAverage) * 10) / 10,
      };
    })
    .sort((a, b) => b.firCount - a.firCount || b.averageRiskScore - a.averageRiskScore);
}

function responseIndicators(incidents: CrimeIncidentFeature[]) {
  const criticalCount = incidents.filter((item) => item.properties.severity === "critical").length;
  const openCount = incidents.filter((item) => item.properties.caseStatus === "Open").length;
  const avgResponse = incidents.length ? Math.max(12, Math.round(42 - criticalCount * 2 + openCount)) : 0;
  const chargeSheetRate = incidents.length
    ? Math.round((incidents.filter((item) => item.properties.caseStatus === "Charge Sheet Filed").length / incidents.length) * 100)
    : 0;
  return [
    {
      label: "Avg response indicator",
      value: incidents.length ? `${avgResponse} min` : "Unavailable",
      helper: "Sample operational indicator derived from available mock incident severity.",
      available: incidents.length > 0,
    },
    {
      label: "Charge-sheet rate",
      value: incidents.length ? `${chargeSheetRate}%` : "Unavailable",
      helper: "Share of matching FIRs marked Charge Sheet Filed.",
      available: incidents.length > 0,
    },
  ];
}

export async function getPoliceStationAnalytics(
  input: Partial<StationAnalyticsFilters>
): Promise<PoliceStationAnalyticsData> {
  const filters = normalizeFilters(input);
  await new Promise((resolve) => setTimeout(resolve, 180));

  const scopedIncidents = MOCK_CRIME_INCIDENTS.features.filter((item) => inScope(item, filters));
  const rows = buildStationRows(scopedIncidents);
  const selectedStation =
    filters.policeStation === "all"
      ? rows[0] ?? null
      : rows.find((row) => row.policeStation === filters.policeStation) ?? null;
  const status = statusBreakdown(scopedIncidents);
  const repeats = repeatIncidents(scopedIncidents);
  const solvedRate = scopedIncidents.length ? Math.round((status.solved / scopedIncidents.length) * 100) : 0;

  return {
    source: "mock",
    generatedAt: new Date().toISOString(),
    filters,
    selectedStation,
    totals: {
      firCount: scopedIncidents.length,
      stationCount: rows.length,
      solvedRate,
      pendingCount: status.pending,
      repeatIncidentCount: repeats.reduce((sum, item) => sum + item.incidentCount, 0),
    },
    statusBreakdown: status,
    categoryDistribution: categoryDistribution(scopedIncidents),
    timeTrend: timeTrend(scopedIncidents),
    repeatIncidents: repeats,
    responseIndicators: responseIndicators(scopedIncidents),
    stationRows: rows,
    emptyReason: scopedIncidents.length === 0 ? "No matching FIR aggregates are available for the selected filters." : undefined,
  };
}
