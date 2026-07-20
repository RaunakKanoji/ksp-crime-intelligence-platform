import type { CaseLifecycleStatus } from "@/lib/case-status-tracking/types";

export type PriorityBand = "Critical review" | "High review" | "Medium review" | "Routine review";
export type FactorKey = "severity" | "repeatOffender" | "victimRisk" | "locationRisk" | "caseAge" | "publicSafety";

export interface PriorityScoreFilters {
  search?: string;
  district?: string;
  category?: string;
  status?: CaseLifecycleStatus;
  minimumScore?: number;
}

export interface PriorityFactor {
  key: FactorKey;
  label: string;
  rawLevel: "Low" | "Medium" | "High" | "Critical";
  points: number;
  maximumPoints: number;
  sourceFields: string[];
  explanation: string;
  limitation: string;
}

export interface InvestigationPriorityResult {
  id: string;
  firNumber: string;
  category: string;
  district: string;
  station: string;
  status: CaseLifecycleStatus;
  registeredAt: string;
  score: number;
  priorityBand: PriorityBand;
  confidence: "High" | "Medium" | "Low";
  factors: PriorityFactor[];
  repeatOffenderReference: string | null;
}

export interface InvestigationPriorityResponse {
  results: InvestigationPriorityResult[];
  total: number;
  isSampleData: boolean;
  generatedAt: string;
  scoringFormula: string;
  explanation: string;
  limitations: string[];
  humanReviewRequired: true;
  sensitiveReferencesRedacted: boolean;
  auditNote: string;
  availableFilters: { districts: string[]; categories: string[]; statuses: CaseLifecycleStatus[] };
}
