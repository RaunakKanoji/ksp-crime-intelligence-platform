export interface CleaningRuleAlias {
  id: string;
  category: "District" | "Police Station" | "Crime Category";
  alias: string;
  canonicalValue: string;
  enabled: boolean;
}

export interface ManualReviewItem {
  id: string;
  fileName: string;
  rowNumber: number;
  fieldName: string;
  invalidValue: string;
  resolvedValue?: string;
  status: "Pending" | "Resolved";
}
