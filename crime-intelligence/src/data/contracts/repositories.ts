import type { DateRange, PaginatedResult, PageRequest, SortDirection } from "./common";
import type {
  Alert,
  CaseNote,
  CasePersonRelationship,
  CaseStatus,
  CaseStatusHistory,
  CrimeCase,
  CrimeCategory,
  CrimeHotspot,
  District,
  Evidence,
  EvidenceCustodyEvent,
  Fir,
  GeographicLocation,
  Incident,
  IntelligenceReport,
  LegalSection,
  Person,
  PoliceOfficer,
  PoliceStation,
  Task,
  UserAccount,
  Vehicle,
} from "./entities";

export type CaseQuery = PageRequest & {
  search?: string;
  districtId?: string;
  stationId?: string;
  officerId?: string;
  crimeCategoryId?: string;
  status?: CaseStatus[];
  priority?: string[];
  severity?: string[];
  openedFrom?: string;
  openedTo?: string;
  tags?: string[];
  sortBy?: "openedAt" | "updatedAt" | "priority" | "riskScore";
  sortDirection?: SortDirection;
};

export type IncidentQuery = PageRequest & DateRange & {
  search?: string;
  districtId?: string;
  stationId?: string;
  crimeCategoryId?: string;
  status?: string[];
  severity?: string[];
  priority?: string[];
  sortBy?: "occurredAt" | "reportedAt" | "severity" | "priority";
  sortDirection?: SortDirection;
};

export type FirQuery = PageRequest & DateRange & {
  search?: string;
  districtId?: string;
  stationId?: string;
  crimeCategoryId?: string;
  status?: string[];
  priority?: string[];
};

export type PersonQuery = PageRequest & { search?: string; districtId?: string; riskFlag?: string };
export type OfficerQuery = PageRequest & { search?: string; stationId?: string; districtId?: string; status?: string };
export type StationQuery = PageRequest & { search?: string; districtId?: string; stationType?: string };
export type TaskQuery = PageRequest & { caseId?: string; officerId?: string; status?: string[]; overdue?: boolean };
export type AlertQuery = PageRequest & { districtId?: string; stationId?: string; status?: string[]; severity?: string[]; caseId?: string };

export type CaseCreateInput = Omit<CrimeCase, "id" | "createdAt" | "updatedAt" | "deletedAt" | "isSyntheticData" | "caseNumber">;
export type CaseUpdateInput = Partial<Pick<CrimeCase, "title" | "summary" | "leadOfficerId" | "supportingOfficerIds" | "priority" | "severity" | "status" | "investigationStage" | "riskScore" | "confidenceScore" | "expectedClosureDate" | "tags">>;
export type IncidentCreateInput = Omit<Incident, "id" | "createdAt" | "updatedAt" | "deletedAt" | "isSyntheticData" | "incidentNumber">;
export type IncidentUpdateInput = Partial<Pick<Incident, "title" | "description" | "crimeCategoryId" | "reportedAt" | "occurredAt" | "stationId" | "districtId" | "latitude" | "longitude" | "locationName" | "severity" | "priority" | "status" | "assignedOfficerId">>;
export type FirCreateInput = Omit<Fir, "id" | "createdAt" | "updatedAt" | "isSyntheticData" | "firNumber">;
export type FirUpdateInput = Partial<Pick<Fir, "status" | "priority" | "summary" | "investigatingOfficerId" | "chargeSheetStatus" | "chargeSheetDate" | "closureReason">>;

export type CaseTimelineItem = { id: string; kind: "status" | "note" | "task" | "evidence" | "audit"; timestamp: string; title: string; description: string };

export interface DistrictRepository { findById(id: string): Promise<District | null>; findMany(query?: PageRequest & { search?: string }): Promise<PaginatedResult<District>>; }
export interface StationRepository { findById(id: string): Promise<PoliceStation | null>; findMany(query?: StationQuery): Promise<PaginatedResult<PoliceStation>>; }
export interface OfficerRepository { findById(id: string): Promise<PoliceOfficer | null>; findMany(query?: OfficerQuery): Promise<PaginatedResult<PoliceOfficer>>; getWorkload(id?: string): Promise<Record<string, number>>; }
export interface CategoryRepository { findMany(): Promise<CrimeCategory[]>; }
export interface LegalSectionRepository { findMany(): Promise<LegalSection[]>; }

export interface IncidentRepository {
  findById(id: string): Promise<Incident | null>;
  findMany(query?: IncidentQuery): Promise<PaginatedResult<Incident>>;
  create(input: IncidentCreateInput): Promise<Incident>;
  update(id: string, input: IncidentUpdateInput): Promise<Incident>;
  delete(id: string): Promise<void>;
}

export interface FirRepository {
  findById(id: string): Promise<Fir | null>;
  findMany(query?: FirQuery): Promise<PaginatedResult<Fir>>;
  create(input: FirCreateInput): Promise<Fir>;
  update(id: string, input: FirUpdateInput): Promise<Fir>;
}

export interface CaseRepository {
  findById(id: string): Promise<CrimeCase | null>;
  findMany(query?: CaseQuery): Promise<PaginatedResult<CrimeCase>>;
  create(input: CaseCreateInput): Promise<CrimeCase>;
  update(id: string, input: CaseUpdateInput): Promise<CrimeCase>;
  updateStatus(id: string, status: CaseStatus, actorId: string, reason?: string): Promise<CrimeCase>;
  delete(id: string): Promise<void>;
  getTimeline(id: string): Promise<CaseTimelineItem[]>;
  getRelated(id: string): Promise<CrimeCase[]>;
  getPersons(id: string): Promise<CasePersonRelationship[]>;
  getEvidence(id: string): Promise<Evidence[]>;
  getTasks(id: string): Promise<Task[]>;
}

export interface PersonRepository { findById(id: string): Promise<Person | null>; findMany(query?: PersonQuery): Promise<PaginatedResult<Person>>; getCaseRelationships(id: string): Promise<CasePersonRelationship[]>; }
export interface EvidenceRepository { findById(id: string): Promise<Evidence | null>; findMany(query?: PageRequest & { caseId?: string }): Promise<PaginatedResult<Evidence>>; create(input: Omit<Evidence, "id" | "evidenceNumber" | "createdAt" | "updatedAt" | "isSyntheticData">): Promise<Evidence>; transfer(id: string, input: { toOfficerId?: string; location: string; remarks: string; action: EvidenceCustodyEvent["action"] }): Promise<Evidence>; getCustody(id: string): Promise<EvidenceCustodyEvent[]>; }
export interface TaskRepository { findMany(query?: TaskQuery): Promise<PaginatedResult<Task>>; create(input: Omit<Task, "id" | "createdAt" | "updatedAt" | "isSyntheticData">): Promise<Task>; update(id: string, input: Partial<Pick<Task, "status" | "priority" | "dueDate" | "assignedToOfficerId" | "description" | "title">>): Promise<Task>; }
export interface AlertRepository { findMany(query?: AlertQuery): Promise<PaginatedResult<Alert>>; acknowledge(id: string): Promise<Alert>; resolve(id: string): Promise<Alert>; }
export interface HotspotRepository { findMany(query?: PageRequest & { districtId?: string; stationId?: string; crimeCategoryId?: string }): Promise<PaginatedResult<CrimeHotspot>>; getMapMarkers(query?: { districtId?: string; stationId?: string; crimeCategoryId?: string }): Promise<CrimeHotspot[]>; }
export interface VehicleRepository { findMany(query?: PageRequest & { search?: string; status?: string }): Promise<PaginatedResult<Vehicle>>; }
export interface ReportRepository { findMany(query?: PageRequest): Promise<PaginatedResult<IntelligenceReport>>; }
export interface AuditRepository { list(query?: PageRequest & { entityType?: string; entityId?: string }): Promise<PaginatedResult<import("./entities").AuditLog>>; append(input: Omit<import("./entities").AuditLog, "id" | "isSyntheticData">): Promise<import("./entities").AuditLog>; }

export type DashboardOverview = {
  totalIncidents: number;
  totalFirs: number;
  activeCases: number;
  closedCases: number;
  highPriorityCases: number;
  pendingEvidence: number;
  overdueTasks: number;
  activeAlerts: number;
  clearanceRate: number;
  averageCaseAgeDays: number;
  casesToday: number;
  casesThisWeek: number;
  trendVsPreviousPeriod: number;
};

export type DashboardRepository = { overview(): Promise<DashboardOverview>; trends(): Promise<Array<{ date: string; incidents: number; firs: number; closedCases: number }>>; categories(): Promise<Array<{ categoryId: string; category: string; count: number; percentage: number }>>; districts(): Promise<Array<{ districtId: string; district: string; incidents: number; activeCases: number; closureRate: number }>>; stations(): Promise<Array<{ stationId: string; station: string; incidents: number; activeCases: number; overdueTasks: number }>>; casePerformance(): Promise<Array<{ officerId: string; officer: string; activeCases: number; overdueTasks: number; closedCases: number; averageCaseAgeDays: number }>>; };

export type SearchResultItem = { id: string; type: string; title: string; subtitle: string; href: string; match: string };
export type GlobalSearchResult = { cases: SearchResultItem[]; firs: SearchResultItem[]; incidents: SearchResultItem[]; persons: SearchResultItem[]; officers: SearchResultItem[]; stations: SearchResultItem[]; vehicles: SearchResultItem[]; evidence: SearchResultItem[]; reports: SearchResultItem[] };
export type SearchRepository = { search(query: string, limit?: number): Promise<GlobalSearchResult> };

export type RepositoryProvider = {
  provider: "mock" | "neon";
  districts: DistrictRepository;
  stations: StationRepository;
  officers: OfficerRepository;
  categories: CategoryRepository;
  legalSections: LegalSectionRepository;
  incidents: IncidentRepository;
  firs: FirRepository;
  cases: CaseRepository;
  persons: PersonRepository;
  evidence: EvidenceRepository;
  tasks: TaskRepository;
  alerts: AlertRepository;
  hotspots: HotspotRepository;
  vehicles: VehicleRepository;
  reports: ReportRepository;
  audit: AuditRepository;
  dashboard: DashboardRepository;
  search: SearchRepository;
};
