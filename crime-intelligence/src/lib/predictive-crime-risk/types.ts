export type PredictiveRiskLevel = "High" | "Medium" | "Low";
export type PredictiveRiskConfidence = "High" | "Medium" | "Low";
export type PredictiveRiskTimeWindow = "morning" | "afternoon" | "evening" | "night";

export interface PredictiveCrimeRiskFilters {
  search?: string;
  district?: string;
  station?: string;
  category?: string;
  timeWindow?: PredictiveRiskTimeWindow;
  from?: string;
  to?: string;
  horizonDays?: number;
  minimumConfidence?: number;
}

export interface PredictiveRiskSignal {
  label: string;
  value: string;
  scoreContribution: number;
  sourceFields: string[];
  explanation: string;
}

export interface PredictiveCrimeRiskAssessment {
  id: string;
  district: string;
  station: string;
  category: string;
  timeWindow: PredictiveRiskTimeWindow;
  horizonDays: number;
  riskScore: number;
  riskLevel: PredictiveRiskLevel;
  confidenceScore: number;
  confidence: PredictiveRiskConfidence;
  historicalIncidentCount: number;
  currentWindowCount: number;
  previousWindowCount: number;
  trendPercent: number;
  averageHistoricalRiskScore: number;
  firstObservedAt: string;
  lastObservedAt: string;
  relatedFirIds: string[];
  observation: string;
  explanation: string;
  limitation: string;
  biasWarning: string;
  noDeterministicClaim: string;
  signals: PredictiveRiskSignal[];
}

export interface PredictiveCrimeRiskResponse {
  assessments: PredictiveCrimeRiskAssessment[];
  total: number;
  isSampleData: boolean;
  generatedAt: string;
  modelProvider: "deterministic-explainable-rules";
  scoringFormula: string;
  explanation: string;
  limitations: string[];
  biasWarning: string;
  humanReviewRequired: true;
  sensitiveReferencesRedacted: boolean;
  auditNote: string;
  availableFilters: {
    districts: string[];
    stations: string[];
    categories: string[];
    timeWindows: PredictiveRiskTimeWindow[];
  };
}
