import { hasPermission, type UserRole } from "@/lib/permissions";
import type { RiskAlert, RiskAlertFilters, RiskAlertsResponse, RiskAlertReviewStatus, RiskAlertSeverity, RiskAlertType } from "./types";

interface RawAlert extends Omit<RiskAlert, "sensitiveReference"> {
  sensitiveReference: string;
}

export class RiskAlertValidationError extends Error {
  constructor(message: string) { super(message); this.name = "RiskAlertValidationError"; }
}

const TYPES: RiskAlertType[] = ["theft-spike", "repeated-location", "repeat-accused", "high-risk-unresolved", "district-category-spike"];
const SEVERITIES: RiskAlertSeverity[] = ["Critical", "High", "Medium", "Low"];
const REVIEW_STATUSES: RiskAlertReviewStatus[] = ["New", "Acknowledged", "Under review", "Resolved"];

const ALERTS: RawAlert[] = [
  {
    id: "ALERT-SAMPLE-001", type: "theft-spike", title: "Theft reports increased in Central Bengaluru",
    summary: "The current sample window contains a sustained increase in theft reports compared with the preceding window.",
    severity: "High", confidence: "High", reviewStatus: "New", district: "Bengaluru City", station: "Central Division",
    category: "Theft", detectedAt: "2026-07-08T08:30:00+05:30", relatedRecordCount: 8, sensitiveReference: "HOTSPOT-BLR-CENTRAL",
    signals: [
      { label: "Current window", value: "8 reports", sourceFields: ["crimeCategory", "incidentDateTime"], explanation: "Authorized theft reports in the current 30-day sample window." },
      { label: "Previous window", value: "4 reports", sourceFields: ["crimeCategory", "incidentDateTime"], explanation: "Authorized theft reports in the preceding comparable window." },
      { label: "Change", value: "+100%", sourceFields: ["currentWindowCount", "previousWindowCount"], explanation: "Percentage change between equal windows." },
    ],
    thresholdExplanation: "Alert generated because current-window theft count is at least 5 and is 50% or more above the previous comparable window.",
    limitation: "Small sample sizes and reporting changes can create apparent spikes; verify against current source records.",
  },
  {
    id: "ALERT-SAMPLE-002", type: "repeated-location", title: "Repeated incidents in a generalized parking area",
    summary: "Multiple property incidents share the same permission-safe occurrence area.",
    severity: "Medium", confidence: "High", reviewStatus: "Acknowledged", district: "Bengaluru City", station: "Central Division",
    category: "Property crime", detectedAt: "2026-07-07T17:00:00+05:30", relatedRecordCount: 5, sensitiveReference: "LOC-BLR-CENTRAL-PARKING",
    signals: [
      { label: "Incident count", value: "5 incidents", sourceFields: ["generalizedLocationKey", "incidentDateTime"], explanation: "Cases sharing the same generalized area within the sample review window." },
      { label: "Hotspot risk", value: "High", sourceFields: ["hotspotRiskScore", "hotspotTrend"], explanation: "Feature 012 area-level risk classification." },
    ],
    thresholdExplanation: "Alert generated when at least 4 incidents occur in one generalized location and hotspot risk is medium or higher.",
    limitation: "Generalized areas may cover unrelated events and do not establish a common offender.",
  },
  {
    id: "ALERT-SAMPLE-003", type: "repeat-accused", title: "Repeat accused identity grouping detected",
    summary: "A permission-filtered accused identity grouping is linked to multiple sample FIRs.",
    severity: "High", confidence: "Medium", reviewStatus: "Under review", district: "Bengaluru City", station: null,
    category: "Theft", detectedAt: "2026-07-06T11:45:00+05:30", relatedRecordCount: 3, sensitiveReference: "MATCH-ACC-001-A",
    signals: [
      { label: "Linked FIR count", value: "3 FIRs", sourceFields: ["accusedReference", "linkedFirs"], explanation: "Feature 019 permission-filtered identity grouping." },
      { label: "Match confidence", value: "Medium", sourceFields: ["identitySignals", "identityConflicts"], explanation: "Identity signals include a shared name/alias, age range, and generalized location." },
    ],
    thresholdExplanation: "Alert generated when an identity grouping links at least 2 FIRs with medium or high matching confidence.",
    limitation: "Identity grouping can be false or incomplete and is not proof of identity, involvement, or guilt.",
  },
  {
    id: "ALERT-SAMPLE-004", type: "high-risk-unresolved", title: "High-priority unresolved case requires review",
    summary: "An unresolved sample case crossed the high-review priority threshold.",
    severity: "Critical", confidence: "High", reviewStatus: "New", district: "Mysuru", station: "Nazarbad",
    category: "Women Safety", detectedAt: "2026-07-08T09:10:00+05:30", relatedRecordCount: 1, sensitiveReference: "FIR-SAMPLE-005",
    signals: [
      { label: "Priority score", value: "High review", sourceFields: ["priorityScore", "priorityFactors"], explanation: "Feature 024 transparent weighted review indicator." },
      { label: "Case status", value: "Under Investigation", sourceFields: ["currentStatus"], explanation: "Feature 023 case lifecycle status remains unresolved." },
    ],
    thresholdExplanation: "Alert generated when priority score is at least 65 and lifecycle status is Registered or Under Investigation.",
    limitation: "A priority score is decision support only and does not determine urgency, resource assignment, or investigative action.",
  },
  {
    id: "ALERT-SAMPLE-005", type: "district-category-spike", title: "Cybercrime category increase in Mysuru",
    summary: "Cybercrime reports in Mysuru exceed the preceding sample window.",
    severity: "Medium", confidence: "Medium", reviewStatus: "Resolved", district: "Mysuru", station: null,
    category: "Cybercrime", detectedAt: "2026-07-03T10:20:00+05:30", relatedRecordCount: 6, sensitiveReference: "DISTRICT-MYS-CYBER",
    signals: [
      { label: "Current district/category count", value: "6 reports", sourceFields: ["district", "crimeCategory", "incidentDateTime"], explanation: "Authorized district-category aggregate for the current window." },
      { label: "Change", value: "+50%", sourceFields: ["currentWindowCount", "previousWindowCount"], explanation: "Change from 4 to 6 reports across comparable windows." },
    ],
    thresholdExplanation: "Alert generated because the district/category count is at least 5 and increased by at least 40%.",
    limitation: "Reporting volume, data completeness, and classification changes can affect district-level comparisons.",
  },
];

function validDate(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) throw new RiskAlertValidationError(`${label} must be a valid date.`);
}

export function validateRiskAlertFilters(input: RiskAlertFilters): RiskAlertFilters {
  const search = input.search?.trim() ?? "";
  if (search.length > 80) throw new RiskAlertValidationError("Search text must be 80 characters or fewer.");
  if (input.from) validDate(input.from, "From date");
  if (input.to) validDate(input.to, "To date");
  if (input.from && input.to && input.from > input.to) throw new RiskAlertValidationError("From date cannot be after to date.");
  if (input.type && !TYPES.includes(input.type)) throw new RiskAlertValidationError("Alert type is invalid.");
  if (input.severity && !SEVERITIES.includes(input.severity)) throw new RiskAlertValidationError("Severity is invalid.");
  if (input.reviewStatus && !REVIEW_STATUSES.includes(input.reviewStatus)) throw new RiskAlertValidationError("Review status is invalid.");
  const districts = Array.from(new Set(ALERTS.map((item) => item.district)));
  if (input.district && !districts.includes(input.district)) throw new RiskAlertValidationError("District filter is invalid.");
  return { ...input, search };
}

export async function getRiskAlerts(input: RiskAlertFilters, role: UserRole): Promise<RiskAlertsResponse> {
  if (!hasPermission(role, "page:risk-alerts")) throw new Error("Permission denied.");
  const filters = validateRiskAlertFilters(input);
  const canViewSensitiveReferences = hasPermission(role, "data:view-investigation-notes");
  const search = filters.search?.toLowerCase();
  const alerts = ALERTS.filter((item) =>
    (!search || `${item.title} ${item.summary} ${item.category} ${item.district}`.toLowerCase().includes(search)) &&
    (!filters.type || item.type === filters.type) && (!filters.severity || item.severity === filters.severity) &&
    (!filters.reviewStatus || item.reviewStatus === filters.reviewStatus) && (!filters.district || item.district === filters.district) &&
    (!filters.from || item.detectedAt.slice(0, 10) >= filters.from) && (!filters.to || item.detectedAt.slice(0, 10) <= filters.to)
  ).map((item): RiskAlert => ({ ...item, sensitiveReference: canViewSensitiveReferences ? item.sensitiveReference : null }))
    .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
  const counts: Record<RiskAlertSeverity, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  alerts.forEach((alert) => { counts[alert.severity] += 1; });
  await new Promise((resolve) => setTimeout(resolve, 200));
  return {
    alerts, total: alerts.length, counts, isSampleData: true, generatedAt: new Date().toISOString(),
    explanation: "Alerts are deterministic threshold checks over permission-filtered hotspot, repeat-offender, case-status, and priority-score signals. Each alert lists its source fields and trigger threshold.",
    humanReviewRequired: true, sensitiveReferencesRedacted: !canViewSensitiveReferences,
    auditNote: "Audit persistence is pending feature 035. Alert views and review-status changes must be logged to Catalyst Data Store when alert management is active.",
    availableFilters: { types: TYPES, severities: SEVERITIES, reviewStatuses: REVIEW_STATUSES, districts: Array.from(new Set(ALERTS.map((item) => item.district))).sort() },
  };
}
