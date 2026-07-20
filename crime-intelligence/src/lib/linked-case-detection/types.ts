export type LinkConfidence = "High" | "Medium" | "Low";
export type LinkSignalType =
  | "same-accused"
  | "same-vehicle"
  | "similar-modus-operandi"
  | "same-location"
  | "same-phone"
  | "similar-time-pattern"
  | "same-property-type"
  | "shared-associate";

export interface LinkedCaseFilters {
  sourceFirId: string;
  district?: string;
  from?: string;
  to?: string;
  minimumConfidence?: LinkConfidence;
}

export interface CaseLinkSignal {
  type: LinkSignalType;
  label: string;
  explanation: string;
  weight: number;
  sensitive: boolean;
}

export interface LinkedCaseCandidate {
  linkId: string;
  sourceFirId: string;
  target: {
    id: string;
    firNumber: string;
    category: string;
    district: string;
    station: string;
    registeredAt: string;
    status: string;
  };
  score: number;
  confidence: LinkConfidence;
  signals: CaseLinkSignal[];
  explanation: string;
}

export interface LinkedCaseDetectionResponse {
  sourceCase: LinkedCaseCandidate["target"];
  candidates: LinkedCaseCandidate[];
  total: number;
  isSampleData: boolean;
  generatedAt: string;
  phoneSignalsRedacted: boolean;
  associateSignalsRedacted: boolean;
  explanation: string;
  limitation: string;
  humanReviewRequired: true;
  availableFilters: { sourceCases: Array<{ id: string; firNumber: string }>; districts: string[] };
}
