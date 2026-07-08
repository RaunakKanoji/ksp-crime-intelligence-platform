import type {
  CrimeIncidentFeature,
  CrimeIncidentFeatureCollection,
  CrimeMapFilters,
  CrimeSeverity,
} from "./map-types";

const severityRank: Record<CrimeSeverity, number> = {
  low: 15,
  medium: 45,
  high: 70,
  critical: 90,
};

export function classifyRisk(score: number): CrimeSeverity {
  if (score <= 30) return "low";
  if (score <= 60) return "medium";
  if (score <= 80) return "high";
  return "critical";
}

export function computeRiskScore(input: {
  frequencyScore: number;
  severityScore: number;
  recentGrowthScore: number;
  timePatternScore: number;
  repeatPatternScore: number;
}): number {
  const score =
    input.frequencyScore * 0.35 +
    input.severityScore * 0.25 +
    input.recentGrowthScore * 0.2 +
    input.timePatternScore * 0.1 +
    input.repeatPatternScore * 0.1;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function severityScore(severity: CrimeSeverity): number {
  return severityRank[severity];
}

export function getTimeOfDay(dateTime: string): Required<CrimeMapFilters>["timeOfDay"] {
  const hour = new Date(dateTime).getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

export function serializeCrimeMapFilters(filters: CrimeMapFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "all") params.set(key, String(value));
  });
  return params.toString();
}

export function filterCrimeIncidents(
  collection: CrimeIncidentFeatureCollection,
  filters: CrimeMapFilters
): CrimeIncidentFeatureCollection {
  const search = filters.search?.trim().toLowerCase() ?? "";
  const features = collection.features.filter((feature) => {
    const props = feature.properties;
    const day = props.incidentDateTime.slice(0, 10);
    return (!filters.district || filters.district === "all" || props.district === filters.district)
      && (!filters.policeStation || filters.policeStation === "all" || props.policeStation === filters.policeStation)
      && (!filters.crimeType || filters.crimeType === "all" || props.crimeType === filters.crimeType || props.crimeCategory === filters.crimeType)
      && (!filters.caseStatus || filters.caseStatus === "all" || props.caseStatus === filters.caseStatus)
      && (!filters.severity || filters.severity === "all" || props.severity === filters.severity)
      && (!filters.timeOfDay || filters.timeOfDay === "all" || getTimeOfDay(props.incidentDateTime) === filters.timeOfDay)
      && (!filters.dateFrom || day >= filters.dateFrom)
      && (!filters.dateTo || day <= filters.dateTo)
      && (!search || `${props.firNumber} ${props.crimeType} ${props.district} ${props.policeStation} ${props.addressText ?? ""}`.toLowerCase().includes(search));
  });
  return { type: "FeatureCollection", features };
}

export function topCrimeType(incidents: CrimeIncidentFeature[]): string {
  const counts = new Map<string, number>();
  incidents.forEach((incident) => {
    const key = incident.properties.crimeType;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None";
}

export function maxRiskIncident(incidents: CrimeIncidentFeature[]): CrimeIncidentFeature | null {
  return incidents.reduce<CrimeIncidentFeature | null>((best, item) => {
    if (!best || item.properties.riskScore > best.properties.riskScore) return item;
    return best;
  }, null);
}
