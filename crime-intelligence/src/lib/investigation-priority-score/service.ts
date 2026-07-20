import { hasPermission, type UserRole } from "@/lib/permissions";
import { CASE_LIFECYCLE_STATUSES } from "@/lib/case-status-tracking/service";
import type { CaseLifecycleStatus } from "@/lib/case-status-tracking/types";
import type { FactorKey, InvestigationPriorityResponse, InvestigationPriorityResult, PriorityFactor, PriorityScoreFilters } from "./types";

type Level = PriorityFactor["rawLevel"];
interface RawCase {
  id: string; firNumber: string; category: string; district: string; station: string;
  status: CaseLifecycleStatus; registeredAt: string; severity: Level; victimRisk: Level;
  locationRisk: Level; publicSafety: Level; repeatOffenderReference: string | null;
}

export class PriorityScoreValidationError extends Error {
  constructor(message: string) { super(message); this.name = "PriorityScoreValidationError"; }
}

const CASES: RawCase[] = [
  { id: "FIR-SAMPLE-020", firNumber: "BLR-CEN-2026-0210", category: "Theft", district: "Bengaluru City", station: "Central Division", status: "Registered", registeredAt: "2026-07-07T09:30:00+05:30", severity: "Medium", victimRisk: "Low", locationRisk: "High", publicSafety: "Medium", repeatOffenderReference: null },
  { id: "FIR-SAMPLE-001", firNumber: "BLR-CEN-2026-0142", category: "Theft", district: "Bengaluru City", station: "Central Division", status: "Under Investigation", registeredAt: "2026-07-02T10:35:00+05:30", severity: "Medium", victimRisk: "Low", locationRisk: "High", publicSafety: "Medium", repeatOffenderReference: "MATCH-ACC-001-A" },
  { id: "FIR-SAMPLE-012", firNumber: "BLR-UPR-2025-0811", category: "Theft", district: "Bengaluru City", station: "Upparpet", status: "Charge Sheet Filed", registeredAt: "2025-12-12T16:20:00+05:30", severity: "Medium", victimRisk: "Low", locationRisk: "Medium", publicSafety: "Low", repeatOffenderReference: "MATCH-ACC-001-A" },
  { id: "FIR-SAMPLE-021", firNumber: "MYS-LKR-2025-0182", category: "Burglary", district: "Mysuru", station: "Lashkar", status: "Pending Trial", registeredAt: "2025-09-14T07:50:00+05:30", severity: "High", victimRisk: "Medium", locationRisk: "Medium", publicSafety: "Medium", repeatOffenderReference: "MATCH-ACC-006-A" },
  { id: "FIR-SAMPLE-022", firNumber: "BLR-WFD-2025-0631", category: "Cybercrime", district: "Bengaluru City", station: "Whitefield", status: "Solved", registeredAt: "2025-08-10T14:05:00+05:30", severity: "High", victimRisk: "High", locationRisk: "Low", publicSafety: "High", repeatOffenderReference: null },
  { id: "FIR-SAMPLE-005", firNumber: "MYS-NZR-2026-0079", category: "Women Safety", district: "Mysuru", station: "Nazarbad", status: "Under Investigation", registeredAt: "2026-05-30T09:50:00+05:30", severity: "High", victimRisk: "Critical", locationRisk: "Medium", publicSafety: "High", repeatOffenderReference: null },
  { id: "FIR-SAMPLE-023", firNumber: "MDY-CEN-2024-0294", category: "Property crime", district: "Mandya", station: "Central", status: "Disposed", registeredAt: "2024-11-22T18:00:00+05:30", severity: "Medium", victimRisk: "Low", locationRisk: "Low", publicSafety: "Low", repeatOffenderReference: null },
];

const LEVEL_RATIO: Record<Level, number> = { Low: .25, Medium: .5, High: .75, Critical: 1 };
const MAXIMUM: Record<FactorKey, number> = { severity: 30, repeatOffender: 20, victimRisk: 20, locationRisk: 15, caseAge: 10, publicSafety: 5 };

function factor(key: FactorKey, label: string, level: Level, sourceFields: string[], explanation: string, limitation: string): PriorityFactor {
  return { key, label, rawLevel: level, maximumPoints: MAXIMUM[key], points: Math.round(MAXIMUM[key] * LEVEL_RATIO[level]), sourceFields, explanation, limitation };
}

function ageLevel(registeredAt: string): { level: Level; days: number } {
  const days = Math.max(0, Math.floor((Date.now() - Date.parse(registeredAt)) / 86400000));
  return { days, level: days >= 365 ? "Critical" : days >= 180 ? "High" : days >= 60 ? "Medium" : "Low" };
}

export function scoreInvestigationCase(item: RawCase): Omit<InvestigationPriorityResult, "repeatOffenderReference"> {
  const age = ageLevel(item.registeredAt);
  const factors: PriorityFactor[] = [
    factor("severity", "Alleged offence severity", item.severity, ["crimeCategory", "severityClassification"], "Controlled severity classification for the reported offence category.", "Severity does not establish facts, intent, or guilt."),
    factor("repeatOffender", "Repeat-offender link", item.repeatOffenderReference ? "High" : "Low", ["accusedReference", "repeatOffenderMatch"], item.repeatOffenderReference ? "A reviewed sample identity grouping links an accused reference to multiple FIRs." : "No repeat-offender link is available in the authorized sample data.", "Identity matches can be incomplete or false and require investigator verification."),
    factor("victimRisk", "Victim risk", item.victimRisk, ["protectedVictimRiskClassification"], "Permission-filtered victim vulnerability and immediate-safety classification.", "No victim identity or protected demographic attribute is used or returned by this score."),
    factor("locationRisk", "Location risk", item.locationRisk, ["district", "policeStation", "hotspotRiskBand"], "Area-level incident concentration from the authorized hotspot risk band.", "Area risk must not be attributed to individuals or used as proof of future crime."),
    factor("caseAge", "Case age", age.level, ["registeredAt"], `${age.days} days since FIR registration.`, "Age can indicate review need but does not by itself determine operational urgency."),
    factor("publicSafety", "Public safety impact", item.publicSafety, ["crimeCategory", "publicSafetyClassification"], "Controlled assessment of potential ongoing public-safety impact.", "This classification is decision support and must be checked against current case facts."),
  ];
  const score = factors.reduce((sum, item) => sum + item.points, 0);
  const priorityBand = score >= 80 ? "Critical review" : score >= 65 ? "High review" : score >= 40 ? "Medium review" : "Routine review";
  const confidence = factors.every((item) => item.sourceFields.length > 0) ? "High" : factors.length >= 4 ? "Medium" : "Low";
  return { id: item.id, firNumber: item.firNumber, category: item.category, district: item.district, station: item.station, status: item.status, registeredAt: item.registeredAt, score, priorityBand, confidence, factors };
}

export function validatePriorityFilters(input: PriorityScoreFilters): Required<Pick<PriorityScoreFilters, "minimumScore">> & PriorityScoreFilters {
  const search = input.search?.trim() ?? "";
  if (search.length > 80) throw new PriorityScoreValidationError("Search text must be 80 characters or fewer.");
  const minimumScore = input.minimumScore ?? 0;
  if (!Number.isInteger(minimumScore) || minimumScore < 0 || minimumScore > 100) throw new PriorityScoreValidationError("Minimum score must be between 0 and 100.");
  const districts = Array.from(new Set(CASES.map((item) => item.district)));
  const categories = Array.from(new Set(CASES.map((item) => item.category)));
  if (input.district && !districts.includes(input.district)) throw new PriorityScoreValidationError("District filter is invalid.");
  if (input.category && !categories.includes(input.category)) throw new PriorityScoreValidationError("Category filter is invalid.");
  if (input.status && !CASE_LIFECYCLE_STATUSES.includes(input.status)) throw new PriorityScoreValidationError("Status filter is invalid.");
  return { ...input, search, minimumScore };
}

export async function getInvestigationPriorityScores(input: PriorityScoreFilters, role: UserRole): Promise<InvestigationPriorityResponse> {
  if (!hasPermission(role, "page:investigation-priority-score")) throw new Error("Permission denied.");
  const filters = validatePriorityFilters(input);
  const canViewSensitiveReferences = hasPermission(role, "data:view-investigation-notes");
  const search = filters.search?.toLowerCase();
  const results = CASES.filter((item) =>
    (!search || `${item.firNumber} ${item.category} ${item.district} ${item.station}`.toLowerCase().includes(search)) &&
    (!filters.district || item.district === filters.district) && (!filters.category || item.category === filters.category) &&
    (!filters.status || item.status === filters.status)
  ).map((item): InvestigationPriorityResult => ({
    ...scoreInvestigationCase(item),
    repeatOffenderReference: canViewSensitiveReferences ? item.repeatOffenderReference : null,
  })).filter((item) => item.score >= filters.minimumScore).sort((a, b) => b.score - a.score);
  await new Promise((resolve) => setTimeout(resolve, 200));
  return {
    results, total: results.length, isSampleData: true, generatedAt: new Date().toISOString(),
    scoringFormula: "score = severity (30) + repeat-offender link (20) + victim risk (20) + location risk (15) + case age (10) + public-safety impact (5)",
    explanation: "Each controlled factor level contributes 25%, 50%, 75%, or 100% of its fixed maximum. The result ranks sample cases for human review only and does not change case status or assignments.",
    limitations: [
      "Scores depend on completeness and correctness of the source classifications.",
      "A higher score is not evidence of guilt, future offending, or investigative merit.",
      "Protected identity or demographic characteristics are not scoring factors.",
      "Authorized officers must review current facts, legal duties, and local operational context.",
    ],
    humanReviewRequired: true, sensitiveReferencesRedacted: !canViewSensitiveReferences,
    auditNote: "Audit persistence is pending feature 035. Priority-score views and review decisions must be logged to Catalyst Data Store when audit logs are active.",
    availableFilters: {
      districts: Array.from(new Set(CASES.map((item) => item.district))).sort(),
      categories: Array.from(new Set(CASES.map((item) => item.category))).sort(),
      statuses: CASE_LIFECYCLE_STATUSES,
    },
  };
}
