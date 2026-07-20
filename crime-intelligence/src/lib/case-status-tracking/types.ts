export type CaseLifecycleStatus =
  | "Registered"
  | "Under Investigation"
  | "Charge Sheet Filed"
  | "Pending Trial"
  | "Solved"
  | "Closed"
  | "Disposed";

export type CaseSortField = "updatedAt" | "registeredAt" | "firNumber" | "status";
export type SortDirection = "asc" | "desc";

export interface CaseStatusFilters {
  search?: string;
  district?: string;
  station?: string;
  category?: string;
  status?: CaseLifecycleStatus;
  from?: string;
  to?: string;
  sortBy?: CaseSortField;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
}

export interface CaseStatusEvent {
  id: string;
  status: CaseLifecycleStatus;
  occurredAt: string;
  summary: string;
  recordedBy: string | null;
  internalNote: string | null;
}

export interface CaseStatusRow {
  id: string;
  firNumber: string;
  district: string;
  station: string;
  category: string;
  registeredAt: string;
  updatedAt: string;
  currentStatus: CaseLifecycleStatus;
  assignedOfficer: string | null;
  timeline: CaseStatusEvent[];
}

export interface CaseStatusTrackingResponse {
  rows: CaseStatusRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isSampleData: boolean;
  generatedAt: string;
  restrictedDetailsRedacted: boolean;
  auditNote: string;
  availableFilters: {
    districts: string[];
    stations: string[];
    categories: string[];
    statuses: CaseLifecycleStatus[];
  };
}
