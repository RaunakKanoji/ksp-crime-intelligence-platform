import type { JsonValue, SyntheticRecord } from "./common";

export type Severity = "low" | "medium" | "high" | "critical";
export type Priority = "low" | "normal" | "high" | "urgent";
export type RiskLevel = "low" | "medium" | "high" | "critical";

export type District = SyntheticRecord & {
  id: string;
  code: string;
  name: string;
  region: string;
  headquarters: string;
  latitude: number;
  longitude: number;
  activePoliceStations: number;
  totalPoliceStations: number;
  populationEstimate: number;
  areaSquareKm: number;
  riskLevel: RiskLevel;
  createdAt: string;
  updatedAt: string;
};

export type PoliceStation = SyntheticRecord & {
  id: string;
  stationCode: string;
  name: string;
  districtId: string;
  division: string;
  subDivision: string;
  jurisdictionName: string;
  address: string;
  latitude: number;
  longitude: number;
  phoneMasked: string;
  email: string;
  stationType: "law_and_order" | "traffic" | "cyber_crime" | "women" | "railway" | "special_unit" | "rural" | "urban";
  operationalStatus: "active" | "limited" | "inactive";
  officerInChargeId?: string;
  sanctionedStrength: number;
  activeStrength: number;
  beatCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PoliceOfficer = SyntheticRecord & {
  id: string;
  badgeNumber: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  displayName: string;
  rank: "constable" | "head_constable" | "assistant_sub_inspector" | "sub_inspector" | "inspector" | "deputy_superintendent" | "assistant_commissioner" | "deputy_commissioner" | "superintendent";
  stationId?: string;
  districtId?: string;
  unit: string;
  designation: string;
  email: string;
  phoneMasked: string;
  avatarUrl?: string;
  status: "active" | "on_leave" | "inactive";
  dateOfJoining: string;
  specializations: string[];
  currentCaseCount: number;
  createdAt: string;
  updatedAt: string;
};

export type UserAccount = SyntheticRecord & {
  id: string;
  officerId?: string;
  name: string;
  email: string;
  role: "super_admin" | "state_command" | "district_admin" | "station_admin" | "investigating_officer" | "crime_analyst" | "intelligence_officer" | "control_room_operator" | "read_only";
  permissions: string[];
  stationId?: string;
  districtId?: string;
  status: "active" | "locked" | "inactive";
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CrimeCategory = SyntheticRecord & {
  id: string;
  code: string;
  name: string;
  description: string;
  parentCategoryId?: string;
  severityDefault: Severity;
  colorKey: string;
  iconKey: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LegalSection = SyntheticRecord & {
  id: string;
  code: string;
  title: string;
  actName: string;
  description: string;
  cognizable: boolean;
  bailable: boolean;
  severity: Severity;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type IncidentStatus = "reported" | "under_review" | "assigned" | "fir_registered" | "closed" | "rejected" | "duplicate";
export type ReportingChannel = "station" | "emergency_call" | "online" | "mobile_patrol" | "control_room" | "citizen_app" | "anonymous_tip";

export type Incident = SyntheticRecord & {
  id: string;
  incidentNumber: string;
  title: string;
  description: string;
  crimeCategoryId: string;
  reportedAt: string;
  occurredAt: string;
  occurredFrom?: string;
  occurredTo?: string;
  reportedByType: "citizen" | "officer" | "anonymous" | "system";
  reportingChannel: ReportingChannel;
  stationId: string;
  districtId: string;
  jurisdictionId: string;
  latitude: number;
  longitude: number;
  locationName: string;
  addressMasked: string;
  severity: Severity;
  priority: Priority;
  status: IncidentStatus;
  source: "seed" | "user" | "import";
  assignedOfficerId?: string;
  linkedFirId?: string;
  isSensitive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type FirStatus = "draft" | "registered" | "investigation_open" | "evidence_collection" | "suspect_identified" | "arrest_made" | "charge_sheet_preparation" | "charge_sheet_filed" | "court_proceeding" | "closed" | "transferred";

export type Fir = SyntheticRecord & {
  id: string;
  firNumber: string;
  incidentId: string;
  stationId: string;
  districtId: string;
  registrationDate: string;
  crimeCategoryId: string;
  legalSectionIds: string[];
  complainantPersonId?: string;
  investigatingOfficerId?: string;
  status: FirStatus;
  caseNature: "cognizable" | "non_cognizable" | "preventive";
  priority: Priority;
  summary: string;
  occurrenceLocation: string;
  latitude: number;
  longitude: number;
  courtReference?: string;
  chargeSheetStatus: "not_started" | "in_preparation" | "filed" | "not_required";
  chargeSheetDate?: string;
  closureReason?: string;
  isSensitive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CaseStatus = "open" | "under_investigation" | "evidence_review" | "suspect_identified" | "charge_sheet" | "court_support" | "closed" | "transferred";
export type InvestigationStage = "initial_assessment" | "evidence_collection" | "witness_interviews" | "suspect_analysis" | "field_investigation" | "forensic_review" | "arrest_and_recovery" | "charge_sheet" | "court_support" | "case_closure";

export type CrimeCase = SyntheticRecord & {
  id: string;
  caseNumber: string;
  firId: string;
  title: string;
  summary: string;
  crimeCategoryId: string;
  stationId: string;
  districtId: string;
  leadOfficerId?: string;
  supportingOfficerIds: string[];
  priority: Priority;
  severity: Severity;
  status: CaseStatus;
  investigationStage: InvestigationStage;
  riskScore: number;
  confidenceScore: number;
  openedAt: string;
  lastActivityAt: string;
  expectedClosureDate?: string;
  closedAt?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type Person = SyntheticRecord & {
  id: string;
  personCode: string;
  firstName: string;
  lastName: string;
  displayName: string;
  gender: "female" | "male" | "non_binary" | "unknown";
  approximateAge: number;
  dateOfBirth?: string;
  nationality: string;
  occupation: string;
  phoneMasked: string;
  emailMasked: string;
  addressMasked: string;
  districtId?: string;
  identityStatus: "verified" | "under_review" | "protected" | "unknown";
  riskFlag: "none" | "low" | "medium" | "high";
  profileImageUrl?: string;
  isProtectedIdentity: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CasePersonRelationship = SyntheticRecord & {
  id: string;
  caseId: string;
  personId: string;
  relationshipType: "complainant" | "victim" | "witness" | "suspect" | "accused" | "informant" | "person_of_interest" | "guardian" | "relative" | "associate";
  relationshipStatus: "active" | "cleared" | "unknown";
  statementRecorded: boolean;
  statementDate?: string;
  legalRepresentation?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type SuspectProfile = SyntheticRecord & {
  id: string;
  personId: string;
  primaryCaseId?: string;
  aliasNames: string[];
  riskLevel: RiskLevel;
  threatLevel: "low" | "medium" | "high" | "critical";
  knownAssociates: string[];
  linkedCaseIds: string[];
  modusOperandi: string;
  lastKnownArea: string;
  latitude: number;
  longitude: number;
  watchlistStatus: "not_listed" | "under_review" | "watchlisted" | "cleared";
  verificationStatus: "unverified" | "partially_verified" | "verified";
  officerNotes: string;
  createdAt: string;
  updatedAt: string;
};

export type Arrest = SyntheticRecord & {
  id: string;
  caseId: string;
  personId: string;
  arrestNumber: string;
  arrestedAt: string;
  arrestedByOfficerId: string;
  arrestLocation: string;
  stationId: string;
  grounds: string;
  custodyStatus: "police_custody" | "judicial_custody" | "released" | "absconding";
  courtPresentedAt?: string;
  bailStatus: "pending" | "granted" | "rejected" | "not_applicable";
  releaseDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type Evidence = SyntheticRecord & {
  id: string;
  evidenceNumber: string;
  caseId: string;
  firId: string;
  type: "document" | "photograph" | "video" | "audio" | "digital_device" | "digital_record" | "fingerprint" | "biological" | "weapon" | "vehicle" | "financial_record" | "physical_object" | "other";
  title: string;
  description: string;
  collectedAt: string;
  collectedByOfficerId: string;
  collectionLocation: string;
  storageLocation: string;
  chainOfCustodyStatus: "collected" | "sealed" | "in_transit" | "at_lab" | "at_court" | "released" | "disposed";
  forensicStatus: "not_required" | "pending" | "in_review" | "completed";
  fileReference?: string;
  thumbnailUrl?: string;
  sensitivity: "normal" | "restricted" | "highly_restricted";
  sealed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EvidenceCustodyEvent = SyntheticRecord & {
  id: string;
  evidenceId: string;
  action: "collected" | "sealed" | "transferred" | "received" | "submitted_to_lab" | "returned_from_lab" | "submitted_to_court" | "released" | "disposed";
  fromOfficerId?: string;
  toOfficerId?: string;
  location: string;
  timestamp: string;
  remarks: string;
  signatureStatus: "pending" | "verified";
  createdAt: string;
};

export type CaseNote = SyntheticRecord & {
  id: string;
  caseId: string;
  authorOfficerId: string;
  noteType: "investigation" | "field_visit" | "witness" | "handover" | "general";
  content: string;
  visibility: "case_team" | "station" | "district" | "restricted";
  createdAt: string;
  updatedAt: string;
};

export type CaseStatusHistory = SyntheticRecord & {
  id: string;
  caseId: string;
  previousStatus?: CaseStatus;
  newStatus: CaseStatus;
  changedByOfficerId: string;
  reason: string;
  changedAt: string;
};

export type Task = SyntheticRecord & {
  id: string;
  caseId: string;
  title: string;
  description: string;
  assignedToOfficerId: string;
  assignedByOfficerId: string;
  priority: Priority;
  status: "pending" | "in_progress" | "blocked" | "completed" | "cancelled";
  dueDate: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type Alert = SyntheticRecord & {
  id: string;
  type: "crime_spike" | "repeat_location" | "suspect_match" | "vehicle_match" | "case_inactivity" | "evidence_deadline" | "missing_person" | "high_risk_incident" | "hotspot_escalation" | "inter_station_link";
  title: string;
  message: string;
  severity: Severity;
  districtId?: string;
  stationId?: string;
  caseId?: string;
  personId?: string;
  latitude?: number;
  longitude?: number;
  status: "new" | "acknowledged" | "resolved";
  assignedToOfficerId?: string;
  generatedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  metadata: JsonValue;
  createdAt: string;
  updatedAt: string;
};

export type IntelligenceReport = SyntheticRecord & {
  id: string;
  reportNumber: string;
  title: string;
  summary: string;
  reportType: "district_summary" | "case_link" | "hotspot" | "suspect" | "vehicle" | "trend" | "patrol";
  classification: "internal" | "restricted" | "confidential";
  districtId?: string;
  stationId?: string;
  authorOfficerId: string;
  relatedCaseIds: string[];
  relatedPersonIds: string[];
  relatedLocationIds: string[];
  confidenceLevel: "low" | "medium" | "high";
  sourceReliability: "unknown" | "limited" | "moderate" | "strong";
  status: "draft" | "review" | "published" | "archived";
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type GeographicLocation = SyntheticRecord & {
  id: string;
  name: string;
  type: "crime_scene" | "hotspot" | "landmark" | "station" | "checkpoint" | "beat_point" | "camera_zone" | "patrol_area";
  districtId: string;
  stationId?: string;
  latitude: number;
  longitude: number;
  geohash: string;
  ward: string;
  beat: string;
  jurisdiction: string;
  riskLevel: RiskLevel;
  createdAt: string;
  updatedAt: string;
};

export type CrimeHotspot = SyntheticRecord & {
  id: string;
  locationId: string;
  districtId: string;
  stationId: string;
  crimeCategoryId: string;
  periodStart: string;
  periodEnd: string;
  incidentCount: number;
  severityIndex: number;
  trendPercentage: number;
  riskLevel: RiskLevel;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  topCrimeTypes: string[];
  recommendedAction: string;
  createdAt: string;
  updatedAt: string;
};

export type PatrolBeat = SyntheticRecord & {
  id: string;
  beatCode: string;
  name: string;
  stationId: string;
  districtId: string;
  assignedOfficerIds: string[];
  boundaryReference: string;
  riskLevel: RiskLevel;
  activeIncidents: number;
  patrolStatus: "on_schedule" | "delayed" | "paused" | "completed";
  lastPatrolledAt: string;
  nextPatrolAt: string;
  createdAt: string;
  updatedAt: string;
};

export type Vehicle = SyntheticRecord & {
  id: string;
  vehicleCode: string;
  registrationMasked: string;
  make: string;
  model: string;
  color: string;
  vehicleType: "two_wheeler" | "car" | "commercial" | "heavy_vehicle";
  ownerPersonId?: string;
  status: "normal" | "reported_stolen" | "suspected" | "recovered" | "seized" | "under_verification";
  linkedCaseIds: string[];
  lastSeenLocation: string;
  latitude: number;
  longitude: number;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentAttachment = SyntheticRecord & {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  displayName: string;
  mimeType: string;
  sizeBytes: number;
  category: "fir" | "evidence" | "statement" | "report" | "court" | "identity" | "other";
  storageReference: string;
  uploadedByOfficerId: string;
  uploadedAt: string;
  verificationStatus: "pending" | "verified" | "rejected";
  sensitivity: "normal" | "restricted" | "highly_restricted";
  createdAt: string;
  updatedAt: string;
};

export type AuditLog = SyntheticRecord & {
  id: string;
  actorUserId?: string;
  actorOfficerId?: string;
  action: string;
  entityType: string;
  entityId: string;
  previousData?: JsonValue;
  newData?: JsonValue;
  ipAddressMasked: string;
  userAgent: string;
  requestId: string;
  timestamp: string;
};

export type ConversationSession = SyntheticRecord & {
  id: string;
  userId: string;
  title: string;
  contextType: "state" | "district" | "station" | "case" | "search";
  contextEntityId?: string;
  startedAt: string;
  lastMessageAt: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
};

export type ConversationMessage = SyntheticRecord & {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  queryIntent?: string;
  filters?: JsonValue;
  referencedEntityIds: string[];
  generatedVisualization?: JsonValue;
  feedback?: "helpful" | "not_helpful";
  createdAt: string;
};

export type MockDatabaseState = {
  districts: District[];
  stations: PoliceStation[];
  officers: PoliceOfficer[];
  users: UserAccount[];
  categories: CrimeCategory[];
  legalSections: LegalSection[];
  incidents: Incident[];
  firs: Fir[];
  cases: CrimeCase[];
  persons: Person[];
  casePersons: CasePersonRelationship[];
  suspects: SuspectProfile[];
  arrests: Arrest[];
  evidence: Evidence[];
  custodyEvents: EvidenceCustodyEvent[];
  caseNotes: CaseNote[];
  caseStatusHistory: CaseStatusHistory[];
  tasks: Task[];
  alerts: Alert[];
  intelligenceReports: IntelligenceReport[];
  locations: GeographicLocation[];
  hotspots: CrimeHotspot[];
  beats: PatrolBeat[];
  vehicles: Vehicle[];
  documents: DocumentAttachment[];
  auditLogs: AuditLog[];
  conversations: ConversationSession[];
  messages: ConversationMessage[];
};
