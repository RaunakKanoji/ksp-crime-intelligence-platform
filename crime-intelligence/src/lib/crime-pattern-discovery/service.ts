import { MOCK_CRIME_INCIDENTS } from "@/lib/crime-map/mock-crime-data";
import { getTimeOfDay } from "@/lib/crime-map/map-utils";
import { hasPermission, type UserRole } from "@/lib/permissions";
import type { CrimeIncidentFeature } from "@/lib/crime-map/map-types";
import type { CrimePatternConfidence, CrimePatternDiscoveryResponse, CrimePatternFilters, CrimePatternType, DiscoveredCrimePattern, PatternRule } from "./types";

export class CrimePatternValidationError extends Error {
  constructor(message: string) { super(message); this.name = "CrimePatternValidationError"; }
}

const TYPES: CrimePatternType[] = ["time", "location", "category", "modus-operandi", "accused"];
const REFERENCE_DATE = "2026-07-08";
const RULES: PatternRule[] = [
  { id: "RULE-TIME-01", type: "time", name: "Time-window concentration", condition: "At least the selected minimum incidents share a category and time-of-day window, with concentration of 50% or more.", sourceFields: ["crimeType", "incidentDateTime"], limitation: "Time concentration may reflect reporting or routine activity rather than a common cause." },
  { id: "RULE-LOC-01", type: "location", name: "Station/category concentration", condition: "At least the selected minimum incidents share a district, station, and category.", sourceFields: ["district", "policeStation", "crimeType"], limitation: "Administrative station areas are broad and do not establish spatial proximity or common authorship." },
  { id: "RULE-CAT-01", type: "category", name: "Recent category growth", condition: "Current 30-day category count is at least the selected minimum and exceeds the prior 30-day count.", sourceFields: ["crimeType", "incidentDateTime"], limitation: "Small samples, delayed entry, and classification changes can create apparent growth." },
  { id: "RULE-MO-01", type: "modus-operandi", name: "Repeated method phrase", condition: "At least the selected minimum incident records share a controlled method phrase.", sourceFields: ["modusOperandi", "crimeType"], limitation: "Similar narrative wording does not establish a common offender or coordinated activity." },
  { id: "RULE-ACC-01", type: "accused", name: "Accused-linked recurrence", condition: "A permission-filtered identity grouping links at least the selected minimum FIRs.", sourceFields: ["accusedReference", "linkedFirs", "identityConfidence"], limitation: "Identity groupings can be incomplete or false and require investigator verification." },
];

const ACCUSED_GROUPS = [
  { reference: "MATCH-ACC-001-A", district: "Bengaluru City", category: "Vehicle Theft", firIds: ["CM-001", "CM-002", "CM-013"], confidence: 78 },
  { reference: "MATCH-ACC-006-A", district: "Mysuru", category: "Burglary", firIds: ["CM-011", "CM-012"], confidence: 62 },
];

function date(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) throw new CrimePatternValidationError(`${label} must be a valid date.`);
}

export function validateCrimePatternFilters(input: CrimePatternFilters): Required<Pick<CrimePatternFilters, "minimumOccurrences" | "minimumConfidence">> & CrimePatternFilters {
  const search = input.search?.trim() ?? "";
  if (search.length > 100) throw new CrimePatternValidationError("Search text must be 100 characters or fewer.");
  const minimumOccurrences = input.minimumOccurrences ?? 2;
  const minimumConfidence = input.minimumConfidence ?? 50;
  if (!Number.isInteger(minimumOccurrences) || minimumOccurrences < 2 || minimumOccurrences > 10) throw new CrimePatternValidationError("Minimum occurrences must be between 2 and 10.");
  if (!Number.isInteger(minimumConfidence) || minimumConfidence < 20 || minimumConfidence > 100) throw new CrimePatternValidationError("Minimum confidence must be between 20 and 100.");
  if (input.from) date(input.from, "From date");
  if (input.to) date(input.to, "To date");
  if (input.from && input.to && input.from > input.to) throw new CrimePatternValidationError("From date cannot be after to date.");
  const districts = Array.from(new Set(MOCK_CRIME_INCIDENTS.features.map((item) => item.properties.district)));
  const categories = Array.from(new Set(MOCK_CRIME_INCIDENTS.features.map((item) => item.properties.crimeType)));
  if (input.district && !districts.includes(input.district)) throw new CrimePatternValidationError("District filter is invalid.");
  if (input.category && !categories.includes(input.category)) throw new CrimePatternValidationError("Category filter is invalid.");
  if (input.type && !TYPES.includes(input.type)) throw new CrimePatternValidationError("Pattern type is invalid.");
  return { ...input, search, minimumOccurrences, minimumConfidence };
}

function confidence(score: number): CrimePatternConfidence {
  return score >= 80 ? "High" : score >= 55 ? "Medium" : "Low";
}

function dates(items: CrimeIncidentFeature[]) {
  const values = items.map((item) => item.properties.incidentDateTime).sort();
  return { first: values[0], last: values[values.length - 1] };
}

function buildTimePatterns(items: CrimeIncidentFeature[], minimum: number): DiscoveredCrimePattern[] {
  const groups = new Map<string, CrimeIncidentFeature[]>();
  items.forEach((item) => {
    const window = getTimeOfDay(item.properties.incidentDateTime);
    const key = `${item.properties.crimeType}|${window}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });
  return Array.from(groups.entries()).filter(([, group]) => group.length >= minimum).map(([key, group], index): DiscoveredCrimePattern => {
    const [category, window] = key.split("|"); const span = dates(group);
    const categoryTotal = items.filter((item) => item.properties.crimeType === category).length;
    const concentration = Math.round(group.length / categoryTotal * 100);
    const score = Math.min(100, 45 + group.length * 10 + Math.round(concentration * .25));
    return { id: `PAT-TIME-${index + 1}`, type: "time", title: `${category} concentration during ${window}`, observation: `${group.length} ${category.toLowerCase()} incidents fall in the ${window} window, representing ${concentration}% of that category in scope.`, district: null, category, occurrenceCount: group.length, confidenceScore: score, confidence: confidence(score), firstObservedAt: span.first, lastObservedAt: span.last, relatedFirIds: group.map((item) => item.properties.id), accusedMatchReference: null, signals: [{ label: "Time concentration", value: `${concentration}%`, sourceFields: ["crimeType", "incidentDateTime"] }, { label: "Occurrence count", value: String(group.length), sourceFields: ["incidentDateTime"] }], ruleId: "RULE-TIME-01", explanation: "Grouped authorized incidents by controlled category and derived time-of-day window.", limitation: RULES[0].limitation };
  }).filter((item) => Number(item.signals[0].value.replace("%", "")) >= 50);
}

function buildLocationPatterns(items: CrimeIncidentFeature[], minimum: number): DiscoveredCrimePattern[] {
  const groups = new Map<string, CrimeIncidentFeature[]>();
  items.forEach((item) => {
    const key = `${item.properties.district}|${item.properties.policeStation}|${item.properties.crimeType}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });
  return Array.from(groups.entries()).filter(([, group]) => group.length >= minimum).map(([key, group], index): DiscoveredCrimePattern => {
    const [district, station, category] = key.split("|"); const span = dates(group);
    const score = Math.min(95, 50 + group.length * 12);
    return { id: `PAT-LOC-${index + 1}`, type: "location", title: `${category} concentration in ${station}`, observation: `${group.length} authorized incidents share the ${station} station area and ${category} category.`, district, category, occurrenceCount: group.length, confidenceScore: score, confidence: confidence(score), firstObservedAt: span.first, lastObservedAt: span.last, relatedFirIds: group.map((item) => item.properties.id), accusedMatchReference: null, signals: [{ label: "Station area", value: station, sourceFields: ["district", "policeStation"] }, { label: "Occurrence count", value: String(group.length), sourceFields: ["crimeType"] }], ruleId: "RULE-LOC-01", explanation: "Grouped authorized incidents by district, police station, and category.", limitation: RULES[1].limitation };
  });
}

function buildCategoryPatterns(items: CrimeIncidentFeature[], minimum: number): DiscoveredCrimePattern[] {
  const reference = Date.parse(`${REFERENCE_DATE}T23:59:59+05:30`);
  const currentStart = reference - 30 * 86400000; const priorStart = reference - 60 * 86400000;
  const categories = Array.from(new Set(items.map((item) => item.properties.crimeType)));
  return categories.map((category, index): DiscoveredCrimePattern | null => {
    const scoped = items.filter((item) => item.properties.crimeType === category);
    const current = scoped.filter((item) => Date.parse(item.properties.incidentDateTime) >= currentStart);
    const prior = scoped.filter((item) => { const time = Date.parse(item.properties.incidentDateTime); return time >= priorStart && time < currentStart; });
    if (current.length < minimum || current.length <= prior.length) return null;
    const growth = prior.length ? Math.round((current.length - prior.length) / prior.length * 100) : 100;
    const span = dates(current); const score = Math.min(95, 50 + current.length * 8 + Math.min(20, Math.round(growth / 5)));
    return { id: `PAT-CAT-${index + 1}`, type: "category", title: `Recent ${category} increase`, observation: `${current.length} current-window incidents compared with ${prior.length} in the previous 30-day window.`, district: null, category, occurrenceCount: current.length, confidenceScore: score, confidence: confidence(score), firstObservedAt: span.first, lastObservedAt: span.last, relatedFirIds: current.map((item) => item.properties.id), accusedMatchReference: null, signals: [{ label: "Current window", value: String(current.length), sourceFields: ["crimeType", "incidentDateTime"] }, { label: "Previous window", value: String(prior.length), sourceFields: ["crimeType", "incidentDateTime"] }, { label: "Change", value: `+${growth}%`, sourceFields: ["currentCount", "previousCount"] }], ruleId: "RULE-CAT-01", explanation: "Compared equal, fixed 30-day category windows ending on the sample reference date.", limitation: RULES[2].limitation };
  }).filter((item): item is DiscoveredCrimePattern => item !== null);
}

function buildMoPatterns(items: CrimeIncidentFeature[], minimum: number): DiscoveredCrimePattern[] {
  const phrases = [
    { label: "parking-area vehicle method", terms: ["parking", "two-wheeler"] },
    { label: "night-entry burglary method", terms: ["night", "rear window", "burglary"] },
    { label: "impersonation/payment-link method", terms: ["impersonation", "payment-link"] },
  ];
  return phrases.map((phrase, index): DiscoveredCrimePattern | null => {
    const group = items.filter((item) => phrase.terms.some((term) => (item.properties.modusOperandi ?? "").toLowerCase().includes(term)));
    if (group.length < minimum) return null;
    const span = dates(group); const category = group[0].properties.crimeType; const score = Math.min(90, 45 + group.length * 15);
    return { id: `PAT-MO-${index + 1}`, type: "modus-operandi", title: `Repeated ${phrase.label}`, observation: `${group.length} incident narratives contain controlled terms associated with ${phrase.label}.`, district: null, category, occurrenceCount: group.length, confidenceScore: score, confidence: confidence(score), firstObservedAt: span.first, lastObservedAt: span.last, relatedFirIds: group.map((item) => item.properties.id), accusedMatchReference: null, signals: [{ label: "Controlled phrase", value: phrase.label, sourceFields: ["modusOperandi"] }, { label: "Matching records", value: String(group.length), sourceFields: ["modusOperandi", "crimeType"] }], ruleId: "RULE-MO-01", explanation: "Matched normalized narrative text against a documented controlled phrase list.", limitation: RULES[3].limitation };
  }).filter((item): item is DiscoveredCrimePattern => item !== null);
}

function buildAccusedPatterns(minimum: number, canViewReference: boolean): DiscoveredCrimePattern[] {
  return ACCUSED_GROUPS.filter((item) => item.firIds.length >= minimum).map((item, index): DiscoveredCrimePattern => ({
    id: `PAT-ACC-${index + 1}`, type: "accused", title: "Repeat accused grouping across FIRs",
    observation: `A permission-filtered identity grouping links ${item.firIds.length} sample FIRs in ${item.district}.`,
    district: item.district, category: item.category, occurrenceCount: item.firIds.length,
    confidenceScore: item.confidence, confidence: confidence(item.confidence),
    firstObservedAt: "2025-12-12T16:20:00+05:30", lastObservedAt: "2026-07-04T21:10:00+05:30",
    relatedFirIds: item.firIds, accusedMatchReference: canViewReference ? item.reference : null,
    signals: [{ label: "Linked FIR count", value: String(item.firIds.length), sourceFields: ["accusedReference", "linkedFirs"] }, { label: "Identity confidence", value: `${item.confidence}%`, sourceFields: ["identitySignals", "identityConflicts"] }],
    ruleId: "RULE-ACC-01", explanation: "Uses feature 019 permission-filtered identity grouping; no new identity inference is performed.", limitation: RULES[4].limitation,
  }));
}

export async function discoverCrimePatterns(input: CrimePatternFilters, role: UserRole): Promise<CrimePatternDiscoveryResponse> {
  if (!hasPermission(role, "page:crime-pattern-discovery")) throw new Error("Permission denied.");
  const filters = validateCrimePatternFilters(input);
  const canViewReference = hasPermission(role, "data:view-investigation-notes");
  const incidents = MOCK_CRIME_INCIDENTS.features.filter((item) =>
    (!filters.district || item.properties.district === filters.district) &&
    (!filters.category || item.properties.crimeType === filters.category) &&
    (!filters.from || item.properties.incidentDateTime.slice(0, 10) >= filters.from) &&
    (!filters.to || item.properties.incidentDateTime.slice(0, 10) <= filters.to)
  );
  let patterns = [
    ...buildTimePatterns(incidents, filters.minimumOccurrences),
    ...buildLocationPatterns(incidents, filters.minimumOccurrences),
    ...buildCategoryPatterns(incidents, filters.minimumOccurrences),
    ...buildMoPatterns(incidents, filters.minimumOccurrences),
    ...buildAccusedPatterns(filters.minimumOccurrences, canViewReference),
  ];
  const search = filters.search?.toLowerCase();
  patterns = patterns.filter((item) =>
    (!filters.type || item.type === filters.type) &&
    (!filters.district || !item.district || item.district === filters.district) &&
    (!filters.category || !item.category || item.category === filters.category) &&
    item.confidenceScore >= filters.minimumConfidence &&
    (!search || `${item.title} ${item.observation} ${item.category ?? ""} ${item.district ?? ""}`.toLowerCase().includes(search))
  ).sort((a, b) => b.confidenceScore - a.confidenceScore || b.occurrenceCount - a.occurrenceCount);
  await new Promise((resolve) => setTimeout(resolve, 200));
  return {
    patterns, rules: filters.type ? RULES.filter((rule) => rule.type === filters.type) : RULES,
    total: patterns.length, isSampleData: true, generatedAt: new Date().toISOString(),
    observationProvider: "deterministic-rules",
    explanation: "Generated observations are templated summaries of documented rule matches over permission-filtered time-series, hotspot/location, category, method, and accused-grouping signals. No generative model or unrestricted data is used.",
    limitations: [
      "Patterns are descriptive correlations in available records and do not predict crime, identify causation, or establish guilt.",
      "Small samples, missing records, reporting practices, and classification changes can create or hide patterns.",
      "Accused-based results inherit identity-matching uncertainty and require source-record verification.",
      "Every pattern requires authorized human review before investigative or operational use.",
    ],
    humanReviewRequired: true, sensitiveReferencesRedacted: !canViewReference,
    auditNote: "Audit persistence is pending feature 035. Pattern discovery queries and review outcomes must be logged to Catalyst Data Store when audit logs are active.",
    availableFilters: {
      types: TYPES,
      districts: Array.from(new Set(MOCK_CRIME_INCIDENTS.features.map((item) => item.properties.district))).sort(),
      categories: Array.from(new Set(MOCK_CRIME_INCIDENTS.features.map((item) => item.properties.crimeType))).sort(),
    },
  };
}
