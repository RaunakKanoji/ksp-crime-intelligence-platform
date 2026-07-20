export type RiskAlertType =
  | "theft-spike"
  | "repeated-location"
  | "repeat-accused"
  | "high-risk-unresolved"
  | "district-category-spike";
export type RiskAlertSeverity = "Critical" | "High" | "Medium" | "Low";
export type RiskAlertReviewStatus = "New" | "Acknowledged" | "Under review" | "Resolved";

export interface RiskAlertFilters {
  search?: string;
  type?: RiskAlertType;
  severity?: RiskAlertSeverity;
  reviewStatus?: RiskAlertReviewStatus;
  district?: string;
  from?: string;
  to?: string;
}

export interface RiskAlertSignal {
  label: string;
  value: string;
  sourceFields: string[];
  explanation: string;
}

export interface RiskAlert {
  id: string;
  type: RiskAlertType;
  title: string;
  summary: string;
  severity: RiskAlertSeverity;
  confidence: "High" | "Medium" | "Low";
  reviewStatus: RiskAlertReviewStatus;
  district: string;
  station: string | null;
  category: string;
  detectedAt: string;
  relatedRecordCount: number;
  sensitiveReference: string | null;
  signals: RiskAlertSignal[];
  thresholdExplanation: string;
  limitation: string;
}

export interface RiskAlertsResponse {
  alerts: RiskAlert[];
  total: number;
  counts: Record<RiskAlertSeverity, number>;
  isSampleData: boolean;
  generatedAt: string;
  explanation: string;
  humanReviewRequired: true;
  sensitiveReferencesRedacted: boolean;
  auditNote: string;
  availableFilters: {
    types: RiskAlertType[];
    severities: RiskAlertSeverity[];
    reviewStatuses: RiskAlertReviewStatus[];
    districts: string[];
  };
}
