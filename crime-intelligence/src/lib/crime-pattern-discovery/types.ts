export type CrimePatternType = "time" | "location" | "category" | "modus-operandi" | "accused";
export type CrimePatternConfidence = "High" | "Medium" | "Low";

export interface CrimePatternFilters {
  search?: string;
  district?: string;
  category?: string;
  type?: CrimePatternType;
  from?: string;
  to?: string;
  minimumOccurrences?: number;
  minimumConfidence?: number;
}

export interface PatternRule {
  id: string;
  type: CrimePatternType;
  name: string;
  condition: string;
  sourceFields: string[];
  limitation: string;
}

export interface DiscoveredCrimePattern {
  id: string;
  type: CrimePatternType;
  title: string;
  observation: string;
  district: string | null;
  category: string | null;
  occurrenceCount: number;
  confidenceScore: number;
  confidence: CrimePatternConfidence;
  firstObservedAt: string;
  lastObservedAt: string;
  relatedFirIds: string[];
  accusedMatchReference: string | null;
  signals: Array<{ label: string; value: string; sourceFields: string[] }>;
  ruleId: string;
  explanation: string;
  limitation: string;
}

export interface CrimePatternDiscoveryResponse {
  patterns: DiscoveredCrimePattern[];
  rules: PatternRule[];
  total: number;
  isSampleData: boolean;
  generatedAt: string;
  observationProvider: "deterministic-rules";
  explanation: string;
  limitations: string[];
  humanReviewRequired: true;
  sensitiveReferencesRedacted: boolean;
  auditNote: string;
  availableFilters: {
    types: CrimePatternType[];
    districts: string[];
    categories: string[];
  };
}
