export type MoConfidence = "High" | "Medium" | "Low";

export interface MoAnalysisFilters {
  search?: string;
  category?: string;
  district?: string;
  from?: string;
  to?: string;
  minimumSimilarity?: number;
}

export interface MoAttribute {
  type: "entry-method" | "target" | "tool" | "timing" | "transport" | "approach";
  value: string;
  sourceField: "incidentNarrative" | "incidentTimeRange" | "crimeCategory";
}

export interface MoFir {
  id: string;
  firNumber: string;
  category: string;
  district: string;
  station: string;
  registeredAt: string;
  attributes: MoAttribute[];
}

export interface MoPattern {
  id: string;
  label: string;
  category: string;
  attributes: MoAttribute[];
  linkedFirs: MoFir[];
  firCount: number;
  districts: string[];
  similarityScore: number;
  confidence: MoConfidence;
  repeatPattern: boolean;
  explanation: string;
}

export interface MoCategoryGroup {
  category: string;
  patternCount: number;
  linkedFirCount: number;
}

export interface MoAnalysisResponse {
  patterns: MoPattern[];
  categoryGroups: MoCategoryGroup[];
  total: number;
  isSampleData: boolean;
  extractionMethod: "deterministic-rules";
  generatedAt: string;
  explanation: string;
  limitation: string;
  humanReviewRequired: true;
  auditNote: string;
  availableFilters: { categories: string[]; districts: string[] };
}
