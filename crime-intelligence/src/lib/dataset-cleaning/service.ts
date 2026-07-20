import { type CleaningRuleAlias, type ManualReviewItem } from "./types";
import { logAuditEvent } from "@/lib/audit-logs/service";

declare global {
  var _cleaningRules: CleaningRuleAlias[] | undefined;
  var _manualReviews: ManualReviewItem[] | undefined;
}

const INITIAL_RULES: CleaningRuleAlias[] = [
  {
    id: "RULE-001",
    category: "District",
    alias: "blr city",
    canonicalValue: "Bengaluru City",
    enabled: true,
  },
  {
    id: "RULE-002",
    category: "District",
    alias: "bengaluru",
    canonicalValue: "Bengaluru City",
    enabled: true,
  },
  {
    id: "RULE-003",
    category: "Police Station",
    alias: "Indiranagara PS",
    canonicalValue: "Indiranagar PS",
    enabled: true,
  },
  {
    id: "RULE-004",
    category: "Crime Category",
    alias: "V. Theft",
    canonicalValue: "Vehicle Theft",
    enabled: true,
  },
  {
    id: "RULE-005",
    category: "Crime Category",
    alias: "theft of vehicle",
    canonicalValue: "Vehicle Theft",
    enabled: true,
  },
];

const INITIAL_REVIEWS: ManualReviewItem[] = [
  {
    id: "REV-001",
    fileName: "mysore_theft_data.xlsx",
    rowNumber: 15,
    fieldName: "Police Station",
    invalidValue: "Indiranagar PS",
    status: "Pending",
  },
  {
    id: "REV-002",
    fileName: "mysore_theft_data.xlsx",
    rowNumber: 22,
    fieldName: "Risk Score",
    invalidValue: "high_score",
    status: "Pending",
  },
  {
    id: "REV-003",
    fileName: "mysore_theft_data.xlsx",
    rowNumber: 45,
    fieldName: "Legal Section",
    invalidValue: "IPC-999Z",
    status: "Pending",
  },
];

export function getCleaningRules(): CleaningRuleAlias[] {
  if (!global._cleaningRules) {
    global._cleaningRules = [...INITIAL_RULES];
  }
  return global._cleaningRules;
}

export function addCleaningRule(
  category: CleaningRuleAlias["category"],
  alias: string,
  canonicalValue: string
): CleaningRuleAlias {
  const rules = getCleaningRules();
  const nextId = `RULE-${String(rules.length + 1).padStart(3, "0")}`;
  const newRule: CleaningRuleAlias = {
    id: nextId,
    category,
    alias: alias.trim(),
    canonicalValue: canonicalValue.trim(),
    enabled: true,
  };
  rules.push(newRule);
  return newRule;
}

export function getManualReviews(): ManualReviewItem[] {
  if (!global._manualReviews) {
    global._manualReviews = [...INITIAL_REVIEWS];
  }
  return global._manualReviews;
}

export function resolveManualReviewItem(id: string, correctedVal: string, actor: string): ManualReviewItem {
  const reviews = getManualReviews();
  const item = reviews.find((r) => r.id === id);
  if (!item) throw new Error("Manual review item not found");

  item.status = "Resolved";
  item.resolvedValue = correctedVal.trim();

  // Audit Mutation
  logAuditEvent(
    actor,
    "Manual Resolve",
    "Mutation",
    "Success",
    `Manually corrected validation alert for row ${item.rowNumber} field "${item.fieldName}" in "${item.fileName}" (value changed from "${item.invalidValue}" to "${correctedVal.trim()}").`
  );

  return item;
}
