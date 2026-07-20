import { MOCK_CRIME_INCIDENTS } from "@/lib/crime-map/mock-crime-data";
import { getTimeOfDay } from "@/lib/crime-map/map-utils";
import type { CrimeIncidentFeature } from "@/lib/crime-map/map-types";
import { hasPermission, type UserRole } from "@/lib/permissions";
import type {
  PredictiveCrimeRiskAssessment,
  PredictiveCrimeRiskFilters,
  PredictiveCrimeRiskResponse,
  PredictiveRiskConfidence,
  PredictiveRiskLevel,
  PredictiveRiskTimeWindow,
} from "./types";

export class PredictiveCrimeRiskValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PredictiveCrimeRiskValidationError";
  }
}

const TIME_WINDOWS: PredictiveRiskTimeWindow[] = ["morning", "afternoon", "evening", "night"];
const REFERENCE_DATE = "2026-07-08";
const DAY_MS = 86_400_000;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function date(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new PredictiveCrimeRiskValidationError(`${label} must be a valid date.`);
  }
}

function normalizeWindow(value: string): PredictiveRiskTimeWindow {
  const normalized = value.toLowerCase();
  if (normalized === "morning" || normalized === "afternoon" || normalized === "evening" || normalized === "night") return normalized;
  return "night";
}

function incidentWindow(item: CrimeIncidentFeature): PredictiveRiskTimeWindow {
  return normalizeWindow(getTimeOfDay(item.properties.incidentDateTime));
}

export function validatePredictiveCrimeRiskFilters(
  input: PredictiveCrimeRiskFilters
): Required<Pick<PredictiveCrimeRiskFilters, "horizonDays" | "minimumConfidence">> & PredictiveCrimeRiskFilters {
  const search = input.search?.trim() ?? "";
  if (search.length > 100) throw new PredictiveCrimeRiskValidationError("Search text must be 100 characters or fewer.");
  if (input.from) date(input.from, "From date");
  if (input.to) date(input.to, "To date");
  if (input.from && input.to && input.from > input.to) throw new PredictiveCrimeRiskValidationError("From date cannot be after to date.");
  const horizonDays = input.horizonDays ?? 14;
  const minimumConfidence = input.minimumConfidence ?? 35;
  if (!Number.isInteger(horizonDays) || horizonDays < 1 || horizonDays > 90) throw new PredictiveCrimeRiskValidationError("Prediction horizon must be between 1 and 90 days.");
  if (!Number.isInteger(minimumConfidence) || minimumConfidence < 0 || minimumConfidence > 100) throw new PredictiveCrimeRiskValidationError("Minimum confidence must be between 0 and 100.");
  const districts = Array.from(new Set(MOCK_CRIME_INCIDENTS.features.map((item) => item.properties.district)));
  const stations = Array.from(new Set(MOCK_CRIME_INCIDENTS.features.map((item) => item.properties.policeStation)));
  const categories = Array.from(new Set(MOCK_CRIME_INCIDENTS.features.map((item) => item.properties.crimeType)));
  if (input.district && !districts.includes(input.district)) throw new PredictiveCrimeRiskValidationError("District filter is invalid.");
  if (input.station && !stations.includes(input.station)) throw new PredictiveCrimeRiskValidationError("Station filter is invalid.");
  if (input.category && !categories.includes(input.category)) throw new PredictiveCrimeRiskValidationError("Category filter is invalid.");
  if (input.timeWindow && !TIME_WINDOWS.includes(input.timeWindow)) throw new PredictiveCrimeRiskValidationError("Time-window filter is invalid.");
  return { ...input, search, horizonDays, minimumConfidence };
}

function riskLevel(score: number): PredictiveRiskLevel {
  if (score >= 70) return "High";
  if (score >= 45) return "Medium";
  return "Low";
}

function confidence(score: number): PredictiveRiskConfidence {
  if (score >= 75) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

function dateSpan(items: CrimeIncidentFeature[]) {
  const dates = items.map((item) => item.properties.incidentDateTime).sort();
  return { first: dates[0], last: dates[dates.length - 1] };
}

function pct(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function buildAssessment(key: string, group: CrimeIncidentFeature[], index: number, horizonDays: number): PredictiveCrimeRiskAssessment {
  const [district, station, category, timeWindow] = key.split("|") as [string, string, string, PredictiveRiskTimeWindow];
  const reference = Date.parse(`${REFERENCE_DATE}T23:59:59+05:30`);
  const currentStart = reference - 30 * DAY_MS;
  const previousStart = reference - 60 * DAY_MS;
  const currentWindow = group.filter((item) => Date.parse(item.properties.incidentDateTime) >= currentStart);
  const previousWindow = group.filter((item) => {
    const time = Date.parse(item.properties.incidentDateTime);
    return time >= previousStart && time < currentStart;
  });
  const currentWindowCount = currentWindow.length;
  const previousWindowCount = previousWindow.length;
  const trendPercent = pct(currentWindowCount, previousWindowCount);
  const averageHistoricalRiskScore = Math.round(group.reduce((sum, item) => sum + item.properties.riskScore, 0) / group.length);
  const volumeContribution = clamp(group.length * 8, 0, 30);
  const trendContribution = clamp(trendPercent > 0 ? 12 + Math.round(trendPercent / 4) : 4, 0, 25);
  const locationContribution = clamp(Math.round(averageHistoricalRiskScore * 0.25), 0, 25);
  const timeContribution = clamp(currentWindowCount >= 2 ? 14 : 7, 0, 20);
  const riskScore = clamp(volumeContribution + trendContribution + locationContribution + timeContribution);
  const confidenceScore = clamp(30 + group.length * 8 + Math.min(20, currentWindowCount * 5) + (previousWindowCount > 0 ? 10 : 0) - (group.length < 3 ? 12 : 0));
  const span = dateSpan(group);
  return {
    id: `PCR-${String(index + 1).padStart(3, "0")}`,
    district,
    station,
    category,
    timeWindow,
    horizonDays,
    riskScore,
    riskLevel: riskLevel(riskScore),
    confidenceScore,
    confidence: confidence(confidenceScore),
    historicalIncidentCount: group.length,
    currentWindowCount,
    previousWindowCount,
    trendPercent,
    averageHistoricalRiskScore,
    firstObservedAt: span.first,
    lastObservedAt: span.last,
    relatedFirIds: group.map((item) => item.properties.id),
    observation: `${category} in ${station}, ${district} has an estimated ${riskLevel(riskScore).toLowerCase()} review risk for the next ${horizonDays} day${horizonDays === 1 ? "" : "s"} during the ${timeWindow} window.`,
    explanation: "Risk is estimated from historical incident volume, recent trend, area-level historical risk, and time-window concentration. It is a planning indicator, not a prediction that crime will occur.",
    limitation: "The score is based on available sample records only. Missing reports, delayed entry, enforcement patterns, and classification practices can change the result.",
    biasWarning: "Predictive policing indicators can amplify reporting and enforcement bias. Use only as one input for human-reviewed resource planning.",
    noDeterministicClaim: "This assessment does not claim that a crime will occur, identify an offender, or justify enforcement action by itself.",
    signals: [
      { label: "Historical volume", value: `${group.length} incidents`, scoreContribution: volumeContribution, sourceFields: ["district", "policeStation", "crimeType", "incidentDateTime"], explanation: "Authorized records grouped by area, category, and time window." },
      { label: "Recent trend", value: `${currentWindowCount} current vs ${previousWindowCount} previous (${trendPercent >= 0 ? "+" : ""}${trendPercent}%)`, scoreContribution: trendContribution, sourceFields: ["incidentDateTime", "currentWindowCount", "previousWindowCount"], explanation: "Current 30-day count compared with the preceding 30-day count." },
      { label: "Location risk", value: `${averageHistoricalRiskScore}/100 average`, scoreContribution: locationContribution, sourceFields: ["riskScore", "district", "policeStation"], explanation: "Average historical area-level risk score from permission-safe incident data." },
      { label: "Time feature", value: timeWindow, scoreContribution: timeContribution, sourceFields: ["incidentDateTime"], explanation: "Derived time-of-day window from incident timestamps." },
    ],
  };
}

export async function getPredictiveCrimeRisk(input: PredictiveCrimeRiskFilters, role: UserRole): Promise<PredictiveCrimeRiskResponse> {
  if (!hasPermission(role, "page:predictive-crime-risk")) throw new Error("Permission denied.");
  const filters = validatePredictiveCrimeRiskFilters(input);
  const scoped = MOCK_CRIME_INCIDENTS.features.filter((item) =>
    (!filters.district || item.properties.district === filters.district) &&
    (!filters.station || item.properties.policeStation === filters.station) &&
    (!filters.category || item.properties.crimeType === filters.category) &&
    (!filters.timeWindow || incidentWindow(item) === filters.timeWindow) &&
    (!filters.from || item.properties.incidentDateTime.slice(0, 10) >= filters.from) &&
    (!filters.to || item.properties.incidentDateTime.slice(0, 10) <= filters.to)
  );
  const groups = new Map<string, CrimeIncidentFeature[]>();
  scoped.forEach((item) => {
    const key = `${item.properties.district}|${item.properties.policeStation}|${item.properties.crimeType}|${incidentWindow(item)}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });
  const search = filters.search?.toLowerCase();
  const assessments = Array.from(groups.entries())
    .filter(([, group]) => group.length >= 1)
    .map(([key, group], index) => buildAssessment(key, group, index, filters.horizonDays))
    .filter((item) =>
      item.confidenceScore >= filters.minimumConfidence &&
      (!search || `${item.district} ${item.station} ${item.category} ${item.timeWindow} ${item.observation}`.toLowerCase().includes(search))
    )
    .sort((a, b) => b.riskScore - a.riskScore || b.confidenceScore - a.confidenceScore || b.historicalIncidentCount - a.historicalIncidentCount);
  await new Promise((resolve) => setTimeout(resolve, 200));
  return {
    assessments,
    total: assessments.length,
    isSampleData: true,
    generatedAt: new Date().toISOString(),
    modelProvider: "deterministic-explainable-rules",
    scoringFormula: "riskScore = historical volume contribution (0-30) + recent trend contribution (0-25) + area risk contribution (0-25) + time-window contribution (0-20).",
    explanation: "Predictive Crime Risk is implemented as an explainable decision-support score over permission-filtered sample FIR/incident aggregates. No external AI provider is called and no deterministic future-crime claim is made.",
    limitations: [
      "Scores are planning indicators only and must not be treated as evidence, guilt assessment, or automated deployment instruction.",
      "Small samples, delayed reporting, uneven enforcement, missing records, and category changes can distort risk estimates.",
      "Location outputs use police-station level/generalized data and do not expose exact addresses or raw sensitive location details.",
      "Every assessment requires authorized human review before operational use.",
    ],
    biasWarning: "Historical crime data can reflect reporting access, policing intensity, and social bias. Review equity impact before acting on any risk estimate.",
    humanReviewRequired: true,
    sensitiveReferencesRedacted: !hasPermission(role, "data:view-investigation-notes"),
    auditNote: "Audit persistence is pending feature 035. Predictive-risk queries, filter context, and review outcomes must be logged to Catalyst Data Store when audit logs are active.",
    availableFilters: {
      districts: Array.from(new Set(MOCK_CRIME_INCIDENTS.features.map((item) => item.properties.district))).sort(),
      stations: Array.from(new Set(MOCK_CRIME_INCIDENTS.features.map((item) => item.properties.policeStation))).sort(),
      categories: Array.from(new Set(MOCK_CRIME_INCIDENTS.features.map((item) => item.properties.crimeType))).sort(),
      timeWindows: TIME_WINDOWS,
    },
  };
}
