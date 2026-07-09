export type CategoryBreakdownRange = "30d" | "90d" | "180d" | "1y";

export interface CategoryBreakdownFilters {
  range: CategoryBreakdownRange;
  district: string; // "all" or specific district name
}

export interface CategoryBreakdownItem {
  category: string;
  count: number;
  share: number; // 0..100
  prevCount: number;
  trend: "up" | "down" | "flat";
  change: number; // percentage change, e.g. 15.5
  solvedCount: number;
  solvedRate: number; // 0..100
}

export interface CategoryFirDetail {
  id: string;
  firNumber: string;
  district: string;
  policeStation: string;
  incidentDateTime: string;
  caseStatus: string;
  severity: string;
  riskScore: number;
  addressText: string;
  accusedName: string;
  victimName: string;
  incidentSummary: string;
}

export interface CategoryBreakdownData {
  isSampleData: boolean;
  generatedAt: string;
  filters: CategoryBreakdownFilters;
  totalCount: number;
  categories: CategoryBreakdownItem[];
  firs: Record<string, CategoryFirDetail[]>;
  auditNote: string;
  redaction: {
    pii: boolean;
  };
}

export const DEFAULT_CATEGORY_BREAKDOWN_FILTERS: CategoryBreakdownFilters = {
  range: "30d",
  district: "all",
};
