// FIR Search data service (feature 008).
//
// FIR Search data service (feature 008).
//
// Reads FIR records through the Catalyst Advanced I/O function. Validation,
// filtering, pagination, and role-based redaction happen here so the UI only
// receives authorized fields.

import { getAllFirs, type FirRecord } from "@/lib/api/firs";
import { CATEGORIES, DISTRICTS } from "@/lib/dashboard/types";
import { STATIONS } from "@/lib/dashboard/summary";
import { hasPermission, type UserRole } from "@/lib/permissions";
import {
  ACTS,
  CASE_STATUSES,
  EMPTY_FIR_FILTERS,
  FIR_PAGE_SIZE,
  SECTIONS,
  type CaseStatus,
  type FirSearchFilters,
  type FirSearchRequest,
  type FirSearchResponse,
  type FirSearchResult,
  type FirValidationError,
} from "./types";

type District = (typeof DISTRICTS)[number];
type Category = (typeof CATEGORIES)[number];
type Act = (typeof ACTS)[number];
type Section = (typeof SECTIONS)[number];

export interface RawFirRecord {
  id: string;
  firNumber: string;
  district: District;
  policeStation: string;
  incidentDate: string;
  reportedDate: string;
  crimeCategory: Category;
  act: Act;
  section: Section;
  caseStatus: CaseStatus;
  accusedName: string;
  victimName: string;
  incidentSummary: string;
  sensitiveNote: string;
}

export class FirSearchValidationError extends Error {
  errors: FirValidationError[];

  constructor(errors: FirValidationError[]) {
    super("Invalid FIR search filters.");
    this.name = "FirSearchValidationError";
    this.errors = errors;
  }
}

export const SAMPLE_FIR_RECORDS: RawFirRecord[] = [
  {
    id: "FIR-SAMPLE-001",
    firNumber: "BLR-CEN-2026-0142",
    district: "Bengaluru City",
    policeStation: "Central Division",
    incidentDate: "2026-07-02",
    reportedDate: "2026-07-02",
    crimeCategory: "Theft",
    act: "IPC",
    section: "379",
    caseStatus: "Under Investigation",
    accusedName: "Ravi K.",
    victimName: "Meera S.",
    incidentSummary: "Two-wheeler theft reported near a commercial parking area.",
    sensitiveNote: "Possible link to vehicle theft cluster under manual review.",
  },
  {
    id: "FIR-SAMPLE-002",
    firNumber: "BLR-WFD-2026-0188",
    district: "Bengaluru City",
    policeStation: "Whitefield",
    incidentDate: "2026-06-24",
    reportedDate: "2026-06-25",
    crimeCategory: "Cybercrime",
    act: "IT Act",
    section: "66D",
    caseStatus: "Open",
    accusedName: "Unknown caller",
    victimName: "Anil R.",
    incidentSummary: "UPI fraud complaint involving impersonation over phone.",
    sensitiveNote: "Bank transaction trail requested; do not disclose account identifiers.",
  },
  {
    id: "FIR-SAMPLE-003",
    firNumber: "BLR-KEN-2026-0117",
    district: "Bengaluru City",
    policeStation: "Kengeri",
    incidentDate: "2026-06-18",
    reportedDate: "2026-06-18",
    crimeCategory: "Property",
    act: "IPC",
    section: "420",
    caseStatus: "Charge Sheet Filed",
    accusedName: "Kiran M.",
    victimName: "Private complainant",
    incidentSummary: "Residential break-in with recovered property pending court submission.",
    sensitiveNote: "Accused may overlap with earlier burglary alert; verify before linking.",
  },
  {
    id: "FIR-SAMPLE-004",
    firNumber: "MYS-DVR-2026-0064",
    district: "Mysuru",
    policeStation: "Devaraja",
    incidentDate: "2026-06-11",
    reportedDate: "2026-06-11",
    crimeCategory: "Assault",
    act: "IPC",
    section: "323",
    caseStatus: "Under Investigation",
    accusedName: "Srinivas G.",
    victimName: "Name withheld",
    incidentSummary: "Assault complaint after local dispute; medical report pending.",
    sensitiveNote: "Witness statement contains sensitive contact details.",
  },
  {
    id: "FIR-SAMPLE-005",
    firNumber: "MYS-NZR-2026-0079",
    district: "Mysuru",
    policeStation: "Nazarbad",
    incidentDate: "2026-05-29",
    reportedDate: "2026-05-30",
    crimeCategory: "Women Safety",
    act: "IPC",
    section: "354",
    caseStatus: "Open",
    accusedName: "Identity under verification",
    victimName: "Protected victim",
    incidentSummary: "Harassment complaint registered near transit area.",
    sensitiveNote: "Victim identity and statement are strictly restricted.",
  },
  {
    id: "FIR-SAMPLE-006",
    firNumber: "BLG-CMP-2026-0041",
    district: "Belagavi",
    policeStation: "Camp",
    incidentDate: "2026-05-17",
    reportedDate: "2026-05-17",
    crimeCategory: "Narcotics",
    act: "NDPS Act",
    section: "20(b)",
    caseStatus: "Under Investigation",
    accusedName: "Confidential suspect",
    victimName: "State",
    incidentSummary: "Narcotics seizure entered for laboratory confirmation.",
    sensitiveNote: "Source handling notes unavailable to non-investigation roles.",
  },
  {
    id: "FIR-SAMPLE-007",
    firNumber: "KLB-SBZ-2026-0033",
    district: "Kalaburagi",
    policeStation: "Station Bazar",
    incidentDate: "2026-04-22",
    reportedDate: "2026-04-23",
    crimeCategory: "Traffic",
    act: "Motor Vehicles Act",
    section: "279",
    caseStatus: "Closed",
    accusedName: "Mahesh P.",
    victimName: "Road user",
    incidentSummary: "Rash driving case closed after penalty and documentation.",
    sensitiveNote: "No active investigation note.",
  },
  {
    id: "FIR-SAMPLE-008",
    firNumber: "MNG-BRK-2026-0058",
    district: "Mangaluru",
    policeStation: "Barke",
    incidentDate: "2026-04-09",
    reportedDate: "2026-04-09",
    crimeCategory: "Cybercrime",
    act: "IT Act",
    section: "66C",
    caseStatus: "Charge Sheet Filed",
    accusedName: "Digital wallet operator",
    victimName: "Local business",
    incidentSummary: "Identity misuse complaint tied to unauthorized wallet access.",
    sensitiveNote: "Device identifiers redacted until FIR detail view is active.",
  },
  {
    id: "FIR-SAMPLE-009",
    firNumber: "HBD-VID-2026-0092",
    district: "Hubballi-Dharwad",
    policeStation: "Vidyanagar",
    incidentDate: "2026-03-30",
    reportedDate: "2026-03-31",
    crimeCategory: "Theft",
    act: "IPC",
    section: "379",
    caseStatus: "Open",
    accusedName: "Unknown person",
    victimName: "Shop owner",
    incidentSummary: "Mobile phone theft reported from retail premises.",
    sensitiveNote: "CCTV review pending.",
  },
  {
    id: "FIR-SAMPLE-010",
    firNumber: "BLR-WFD-2026-0067",
    district: "Bengaluru City",
    policeStation: "Whitefield",
    incidentDate: "2026-03-12",
    reportedDate: "2026-03-12",
    crimeCategory: "Cybercrime",
    act: "IT Act",
    section: "66C",
    caseStatus: "Closed",
    accusedName: "Unknown network",
    victimName: "Software employee",
    incidentSummary: "Credential misuse complaint closed after account recovery.",
    sensitiveNote: "Credential details must never be exposed.",
  },
  {
    id: "FIR-SAMPLE-011",
    firNumber: "BLG-MKT-2026-0028",
    district: "Belagavi",
    policeStation: "Market",
    incidentDate: "2026-02-26",
    reportedDate: "2026-02-27",
    crimeCategory: "Property",
    act: "IPC",
    section: "420",
    caseStatus: "Under Investigation",
    accusedName: "Naveen R.",
    victimName: "Trader association member",
    incidentSummary: "Property fraud complaint involving forged lease documents.",
    sensitiveNote: "Document verification pending with revenue office.",
  },
  {
    id: "FIR-SAMPLE-012",
    firNumber: "MNG-PDW-2026-0019",
    district: "Mangaluru",
    policeStation: "Pandeshwar",
    incidentDate: "2026-01-21",
    reportedDate: "2026-01-21",
    crimeCategory: "Assault",
    act: "Karnataka Police Act",
    section: "78",
    caseStatus: "Closed",
    accusedName: "Local group",
    victimName: "Public servant",
    incidentSummary: "Minor assault complaint closed after preventive action.",
    sensitiveNote: "No active sensitive note.",
  },
];

function cleanText(value: string | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeDate(value: string | undefined): string {
  const cleaned = cleanText(value);
  if (!cleaned) return "";
  return /^\d{4}-\d{2}-\d{2}$/.test(cleaned) ? cleaned : "";
}

function allowedStation(district: string, station: string): boolean {
  if (station === "all") return true;
  if (district !== "all") {
    return (STATIONS[district as District] ?? []).includes(station);
  }
  return DISTRICTS.some((d) => (STATIONS[d] ?? []).includes(station));
}

export function normalizeFirFilters(input: Partial<FirSearchFilters>): FirSearchFilters {
  const district =
    input.district && (input.district === "all" || (DISTRICTS as readonly string[]).includes(input.district))
      ? input.district
      : "all";
  const policeStation =
    input.policeStation && allowedStation(district, input.policeStation) ? input.policeStation : "all";
  const crimeCategory =
    input.crimeCategory &&
    (input.crimeCategory === "all" || (CATEGORIES as readonly string[]).includes(input.crimeCategory))
      ? input.crimeCategory
      : "all";
  const act =
    input.act && (input.act === "all" || (ACTS as readonly string[]).includes(input.act)) ? input.act : "all";
  const section =
    input.section && (input.section === "all" || (SECTIONS as readonly string[]).includes(input.section))
      ? input.section
      : "all";
  const caseStatus =
    input.caseStatus &&
    (input.caseStatus === "all" || (CASE_STATUSES as readonly string[]).includes(input.caseStatus))
      ? input.caseStatus
      : "all";

  return {
    ...EMPTY_FIR_FILTERS,
    firNumber: cleanText(input.firNumber).slice(0, 40),
    district,
    policeStation,
    dateFrom: normalizeDate(input.dateFrom),
    dateTo: normalizeDate(input.dateTo),
    crimeCategory,
    act,
    section,
    accusedName: cleanText(input.accusedName).slice(0, 80),
    victimName: cleanText(input.victimName).slice(0, 80),
    caseStatus,
  };
}

function validateFilters(filters: FirSearchFilters, role: UserRole): FirValidationError[] {
  const errors: FirValidationError[] = [];
  const canViewPii = hasPermission(role, "data:view-pii");

  if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
    errors.push({ field: "dateFrom", message: "Start date must be on or before end date." });
  }
  if (filters.accusedName && !canViewPii) {
    errors.push({ field: "accusedName", message: "Accused-name search requires PII access." });
  }
  if (filters.victimName && !canViewPii) {
    errors.push({ field: "victimName", message: "Victim-name search requires PII access." });
  }
  if (filters.firNumber.length > 0 && !/^[a-z0-9/-]+$/i.test(filters.firNumber)) {
    errors.push({ field: "firNumber", message: "FIR number can contain letters, numbers, hyphens, and slashes only." });
  }

  return errors;
}

function contains(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function toRawFirRecord(record: FirRecord): RawFirRecord {
  const crimeCategory = record.crimeCategory || record.crimeType || "Property";
  const caseStatus = record.caseStatus || "Open";
  return {
    id: record.id,
    firNumber: record.firNumber,
    district: record.district as District,
    policeStation: record.policeStation || "",
    incidentDate: record.firDate,
    reportedDate: record.reportedDate || record.firDate,
    crimeCategory: crimeCategory as Category,
    act: (record.act || "IPC") as Act,
    section: (record.section || "379") as Section,
    caseStatus: caseStatus as CaseStatus,
    accusedName: record.accused,
    victimName: record.victim,
    incidentSummary: record.description,
    sensitiveNote: record.sensitiveNote || "",
  };
}

function matchesFilters(record: RawFirRecord, filters: FirSearchFilters): boolean {
  if (filters.firNumber && !contains(record.firNumber, filters.firNumber)) return false;
  if (filters.district !== "all" && record.district !== filters.district) return false;
  if (filters.policeStation !== "all" && record.policeStation !== filters.policeStation) return false;
  if (filters.dateFrom && record.incidentDate < filters.dateFrom) return false;
  if (filters.dateTo && record.incidentDate > filters.dateTo) return false;
  if (filters.crimeCategory !== "all" && record.crimeCategory !== filters.crimeCategory) return false;
  if (filters.act !== "all" && record.act !== filters.act) return false;
  if (filters.section !== "all" && record.section !== filters.section) return false;
  if (filters.caseStatus !== "all" && record.caseStatus !== filters.caseStatus) return false;
  if (filters.accusedName && !contains(record.accusedName, filters.accusedName)) return false;
  if (filters.victimName && !contains(record.victimName, filters.victimName)) return false;
  return true;
}

function redact(record: RawFirRecord, role: UserRole): FirSearchResult {
  const canViewPii = hasPermission(role, "data:view-pii");
  const canViewNotes = hasPermission(role, "data:view-investigation-notes");
  return {
    id: record.id,
    firNumber: record.firNumber,
    district: record.district,
    policeStation: record.policeStation,
    incidentDate: record.incidentDate,
    reportedDate: record.reportedDate,
    crimeCategory: record.crimeCategory,
    act: record.act,
    section: record.section,
    caseStatus: record.caseStatus,
    accusedName: canViewPii ? record.accusedName : null,
    victimName: canViewPii ? record.victimName : null,
    incidentSummary: record.incidentSummary,
    sensitiveNote: canViewNotes ? record.sensitiveNote : null,
  };
}

export async function searchFirs(
  request: FirSearchRequest,
  role: UserRole
): Promise<FirSearchResponse> {
  const filters = normalizeFirFilters(request.filters);
  const errors = validateFilters(filters, role);
  if (errors.length > 0) throw new FirSearchValidationError(errors);

  const pageSize = FIR_PAGE_SIZE;
  const page = Number.isInteger(request.page) && request.page > 0 ? request.page : 1;

  const records = (await getAllFirs()).map(toRawFirRecord);
  const filtered = records.filter((record) => matchesFilters(record, filters)).sort((a, b) =>
    b.incidentDate.localeCompare(a.incidentDate)
  );
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize).map((record) => redact(record, role));

  return {
    isSampleData: false,
    generatedAt: new Date().toISOString(),
    filters,
    rows,
    total,
    page: safePage,
    pageSize,
    totalPages,
    redaction: {
      pii: hasPermission(role, "data:view-pii"),
      investigationNotes: hasPermission(role, "data:view-investigation-notes"),
    },
    auditNote:
      "FIR records are loaded through the Catalyst Advanced I/O function. Sensitive-result views should be logged to audit_events as feature-specific audit wiring is completed.",
  };
}
