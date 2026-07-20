export interface LocationIntelligenceFilters {
  locationId: string;
  category?: string;
  from?: string;
  to?: string;
}

export interface LocationCategoryStat {
  category: string;
  count: number;
  sharePercent: number;
}

export interface LocationTimePattern {
  window: "Morning" | "Afternoon" | "Evening" | "Night";
  incidentCount: number;
  sharePercent: number;
}

export interface LocationRecentFir {
  id: string;
  firNumber: string;
  category: string;
  incidentAt: string;
  status: string;
  detailLinkAllowed: boolean;
}

export interface LocationRepeatOffender {
  matchReference: string | null;
  displayLabel: string;
  linkedFirCount: number;
  confidence: "High" | "Medium" | "Low";
}

export interface LocationDetailIntelligenceResponse {
  location: {
    id: string;
    label: string;
    district: string;
    nearbyPoliceStation: string;
    maskedCenter: [number, number];
    precision: "district-scale masked";
  };
  incidentCount: number;
  topCategories: LocationCategoryStat[];
  timePatterns: LocationTimePattern[];
  repeatOffenders: LocationRepeatOffender[];
  recentFirs: LocationRecentFir[];
  hotspot: {
    score: number;
    level: "Low" | "Medium" | "High" | "Critical";
    confidence: "Low" | "Medium" | "High";
    explanation: string;
    signals: string[];
  };
  patrolInsight: {
    text: string;
    caution: string;
    sourceFields: string[];
  };
  isSampleData: boolean;
  generatedAt: string;
  sensitiveReferencesRedacted: boolean;
  explanation: string;
  limitations: string[];
  auditNote: string;
  availableFilters: {
    locations: Array<{ id: string; label: string; district: string }>;
    categories: string[];
  };
}
