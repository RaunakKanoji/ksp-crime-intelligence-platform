// Typed domain models for FIR Search (feature 008).
// Records use stable human-safe IDs and are redacted before being returned to UI.

export type CaseStatus = "Open" | "Under Investigation" | "Charge Sheet Filed" | "Closed";

export interface FirSearchFilters {
  firNumber: string;
  district: string;
  policeStation: string;
  dateFrom: string;
  dateTo: string;
  crimeCategory: string;
  act: string;
  section: string;
  accusedName: string;
  victimName: string;
  caseStatus: string;
}

export interface FirSearchRequest {
  filters: Partial<FirSearchFilters>;
  page: number;
  pageSize: number;
}

export interface FirSearchResult {
  id: string;
  firNumber: string;
  district: string;
  policeStation: string;
  incidentDate: string;
  reportedDate: string;
  crimeCategory: string;
  act: string;
  section: string;
  caseStatus: CaseStatus;
  accusedName: string | null;
  victimName: string | null;
  incidentSummary: string;
  sensitiveNote: string | null;
}

export interface FirSearchResponse {
  isSampleData: boolean;
  generatedAt: string;
  filters: FirSearchFilters;
  rows: FirSearchResult[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  redaction: {
    pii: boolean;
    investigationNotes: boolean;
  };
  auditNote: string;
}

export type FirDatePreset = "all" | "last-7-days" | "last-30-days" | "last-90-days" | "custom";

export interface FirAdvancedFilters {
  datePreset: FirDatePreset;
  dateFrom: string;
  dateTo: string;
  districts: string[];
  policeStations: string[];
  crimeCategories: string[];
  acts: string[];
  sections: string[];
  caseStatuses: string[];
  keyword: string;
}

export interface FirAdvancedFilterRequest {
  filters: Partial<FirAdvancedFilters>;
  page: number;
  pageSize: number;
}

export interface FirAdvancedFilterResponse {
  isSampleData: boolean;
  generatedAt: string;
  filters: FirAdvancedFilters;
  rows: FirSearchResult[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  activeFilterCount: number;
  redaction: {
    pii: boolean;
    investigationNotes: boolean;
  };
  savedFilterNote: string;
  auditNote: string;
}

export interface FirSavedFilter {
  id: string;
  name: string;
  createdAt: string;
  filters: FirAdvancedFilters;
}

export interface FirDetailParty {
  id: string;
  name: string | null;
  ageRange: string | null;
  gender: string | null;
  addressSummary: string | null;
  role: string;
  status?: string;
  redacted: boolean;
}

export interface FirDetailLinkedCase {
  id: string;
  firNumber: string;
  relationship: string;
  status: CaseStatus;
}

export interface FirDetailInvestigationNote {
  id: string;
  recordedAt: string;
  authorRole: string;
  note: string;
}

export interface FirDetail {
  id: string;
  firNumber: string;
  district: string;
  policeStation: string;
  stationCode: string;
  jurisdiction: string;
  registeredAt: string;
  incidentDate: string;
  incidentTimeRange: string;
  reportedDate: string;
  placeOfOccurrence: string;
  crimeCategory: string;
  act: string;
  sections: string[];
  caseStatus: CaseStatus;
  investigatingOfficer: string | null;
  incidentSummary: string;
  incidentNarrative: string;
  accused: FirDetailParty[];
  victims: FirDetailParty[];
  investigationNotes: FirDetailInvestigationNote[] | null;
  linkedCases: FirDetailLinkedCase[];
  isSampleData: boolean;
  generatedAt: string;
  redaction: {
    pii: boolean;
    investigationNotes: boolean;
  };
  auditNote: string;
}

export interface FirValidationError {
  field: keyof FirSearchFilters | keyof FirAdvancedFilters | "page";
  message: string;
}

export const CASE_STATUSES: CaseStatus[] = [
  "Open",
  "Under Investigation",
  "Charge Sheet Filed",
  "Closed",
];

export const ACTS = [
  "IPC",
  "IT Act",
  "NDPS Act",
  "Motor Vehicles Act",
  "Karnataka Police Act",
] as const;

export const SECTIONS = [
  "379",
  "420",
  "354",
  "323",
  "279",
  "66C",
  "66D",
  "20(b)",
  "78",
] as const;

export const FIR_PAGE_SIZE = 8;

export const FIR_ADVANCED_PAGE_SIZE = 8;

export const EMPTY_FIR_FILTERS: FirSearchFilters = {
  firNumber: "",
  district: "all",
  policeStation: "all",
  dateFrom: "",
  dateTo: "",
  crimeCategory: "all",
  act: "all",
  section: "all",
  accusedName: "",
  victimName: "",
  caseStatus: "all",
};

export const EMPTY_FIR_ADVANCED_FILTERS: FirAdvancedFilters = {
  datePreset: "all",
  dateFrom: "",
  dateTo: "",
  districts: [],
  policeStations: [],
  crimeCategories: [],
  acts: [],
  sections: [],
  caseStatuses: [],
  keyword: "",
};
