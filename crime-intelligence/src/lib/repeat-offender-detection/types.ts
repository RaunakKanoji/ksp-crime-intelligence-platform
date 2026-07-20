export type MatchConfidence = "High" | "Medium" | "Low";

export interface RepeatOffenderFilters {
  search?: string;
  category?: string;
  district?: string;
  from?: string;
  to?: string;
  minimumFirCount?: number;
}

export interface MatchSignal {
  field: "name" | "alias" | "ageRange" | "location";
  explanation: string;
  weight: number;
}

export interface RepeatOffenderResult {
  matchId: string;
  personId: string;
  displayName: string | null;
  firCount: number;
  categories: string[];
  locations: string[];
  firstSeen: string;
  lastSeen: string;
  confidence: MatchConfidence;
  confidenceScore: number;
  identityStatus: "Likely match" | "Possible match" | "Identity conflict";
  signals: MatchSignal[];
  conflicts: string[];
  linkedFirs: Array<{
    id: string;
    firNumber: string;
    category: string;
    district: string;
    station: string;
    registeredAt: string;
  }>;
}

export interface RepeatOffenderDetectionResponse {
  results: RepeatOffenderResult[];
  total: number;
  isSampleData: boolean;
  explanation: string;
  limitation: string;
  humanReviewRequired: true;
  redacted: boolean;
  generatedAt: string;
  availableFilters: { categories: string[]; districts: string[] };
}
