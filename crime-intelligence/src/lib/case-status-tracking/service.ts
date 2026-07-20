import { hasPermission, type UserRole } from "@/lib/permissions";
import type { CaseLifecycleStatus, CaseSortField, CaseStatusFilters, CaseStatusRow, CaseStatusTrackingResponse, SortDirection } from "./types";

interface RawCase extends Omit<CaseStatusRow, "assignedOfficer" | "timeline"> {
  assignedOfficer: string;
  timeline: Array<Omit<CaseStatusRow["timeline"][number], "recordedBy" | "internalNote"> & { recordedBy: string; internalNote: string }>;
}

export class CaseStatusValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CaseStatusValidationError";
  }
}

export const CASE_LIFECYCLE_STATUSES: CaseLifecycleStatus[] = ["Registered", "Under Investigation", "Charge Sheet Filed", "Pending Trial", "Solved", "Closed", "Disposed"];

const event = (id: string, status: CaseLifecycleStatus, occurredAt: string, summary: string, note: string) => ({ id, status, occurredAt, summary, recordedBy: "Authorized case officer", internalNote: note });

const CASES: RawCase[] = [
  { id: "FIR-SAMPLE-020", firNumber: "BLR-CEN-2026-0210", district: "Bengaluru City", station: "Central Division", category: "Theft", registeredAt: "2026-07-07T09:30:00+05:30", updatedAt: "2026-07-07T09:30:00+05:30", currentStatus: "Registered", assignedOfficer: "PI Central Division", timeline: [event("EV-020-1", "Registered", "2026-07-07T09:30:00+05:30", "FIR registered and jurisdiction confirmed.", "Initial scrutiny pending.")] },
  { id: "FIR-SAMPLE-001", firNumber: "BLR-CEN-2026-0142", district: "Bengaluru City", station: "Central Division", category: "Theft", registeredAt: "2026-07-02T10:35:00+05:30", updatedAt: "2026-07-06T16:10:00+05:30", currentStatus: "Under Investigation", assignedOfficer: "PI Central Division", timeline: [event("EV-001-1", "Registered", "2026-07-02T10:35:00+05:30", "FIR registered.", "Initial record created."), event("EV-001-2", "Under Investigation", "2026-07-02T14:10:00+05:30", "Investigation commenced.", "CCTV and movement checks requested.")] },
  { id: "FIR-SAMPLE-012", firNumber: "BLR-UPR-2025-0811", district: "Bengaluru City", station: "Upparpet", category: "Theft", registeredAt: "2025-12-12T16:20:00+05:30", updatedAt: "2026-06-28T11:00:00+05:30", currentStatus: "Charge Sheet Filed", assignedOfficer: "PSI Upparpet", timeline: [event("EV-012-1", "Registered", "2025-12-12T16:20:00+05:30", "FIR registered.", "Initial record created."), event("EV-012-2", "Under Investigation", "2025-12-13T09:00:00+05:30", "Investigation commenced.", "Evidence collection recorded."), event("EV-012-3", "Charge Sheet Filed", "2026-06-28T11:00:00+05:30", "Charge sheet filing recorded.", "Court reference held in restricted case records.")] },
  { id: "FIR-SAMPLE-021", firNumber: "MYS-LKR-2025-0182", district: "Mysuru", station: "Lashkar", category: "Burglary", registeredAt: "2025-09-14T07:50:00+05:30", updatedAt: "2026-07-01T12:15:00+05:30", currentStatus: "Pending Trial", assignedOfficer: "PI Lashkar", timeline: [event("EV-021-1", "Registered", "2025-09-14T07:50:00+05:30", "FIR registered.", "Initial record created."), event("EV-021-2", "Under Investigation", "2025-09-14T13:30:00+05:30", "Investigation commenced.", "Scene review completed."), event("EV-021-3", "Charge Sheet Filed", "2026-02-08T10:00:00+05:30", "Charge sheet filing recorded.", "Filing verified."), event("EV-021-4", "Pending Trial", "2026-07-01T12:15:00+05:30", "Case marked pending trial.", "Court schedule is restricted.")] },
  { id: "FIR-SAMPLE-022", firNumber: "BLR-WFD-2025-0631", district: "Bengaluru City", station: "Whitefield", category: "Cybercrime", registeredAt: "2025-08-10T14:05:00+05:30", updatedAt: "2026-06-20T17:30:00+05:30", currentStatus: "Solved", assignedOfficer: "Cyber liaison officer", timeline: [event("EV-022-1", "Registered", "2025-08-10T14:05:00+05:30", "FIR registered.", "Initial record created."), event("EV-022-2", "Under Investigation", "2025-08-10T17:00:00+05:30", "Investigation commenced.", "Transaction review initiated."), event("EV-022-3", "Solved", "2026-06-20T17:30:00+05:30", "Investigation outcome marked solved.", "Outcome basis requires authorized source review.")] },
  { id: "FIR-SAMPLE-010", firNumber: "BLR-WFD-2026-0067", district: "Bengaluru City", station: "Whitefield", category: "Cybercrime", registeredAt: "2026-01-19T11:45:00+05:30", updatedAt: "2026-05-12T15:20:00+05:30", currentStatus: "Closed", assignedOfficer: "Cyber liaison officer", timeline: [event("EV-010-1", "Registered", "2026-01-19T11:45:00+05:30", "FIR registered.", "Initial record created."), event("EV-010-2", "Under Investigation", "2026-01-19T15:00:00+05:30", "Investigation commenced.", "Digital references requested."), event("EV-010-3", "Closed", "2026-05-12T15:20:00+05:30", "Case closure recorded.", "Closure basis is available in restricted case records.")] },
  { id: "FIR-SAMPLE-023", firNumber: "MDY-CEN-2024-0294", district: "Mandya", station: "Central", category: "Property crime", registeredAt: "2024-11-22T18:00:00+05:30", updatedAt: "2026-04-02T10:40:00+05:30", currentStatus: "Disposed", assignedOfficer: "PI Mandya Central", timeline: [event("EV-023-1", "Registered", "2024-11-22T18:00:00+05:30", "FIR registered.", "Initial record created."), event("EV-023-2", "Charge Sheet Filed", "2025-05-17T10:30:00+05:30", "Charge sheet filing recorded.", "Filing verified."), event("EV-023-3", "Pending Trial", "2025-08-08T09:20:00+05:30", "Case marked pending trial.", "Court schedule restricted."), event("EV-023-4", "Disposed", "2026-04-02T10:40:00+05:30", "Court disposal status recorded.", "Disposal particulars require authorized source review.")] },
];

function validDate(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) throw new CaseStatusValidationError(`${label} must be a valid date.`);
}

export function validateCaseStatusFilters(input: CaseStatusFilters): Required<Pick<CaseStatusFilters, "page" | "pageSize" | "sortBy" | "sortDirection">> & CaseStatusFilters {
  const search = input.search?.trim() ?? "";
  if (search.length > 80) throw new CaseStatusValidationError("Search text must be 80 characters or fewer.");
  if (input.from) validDate(input.from, "From date");
  if (input.to) validDate(input.to, "To date");
  if (input.from && input.to && input.from > input.to) throw new CaseStatusValidationError("From date cannot be after to date.");
  if (input.status && !CASE_LIFECYCLE_STATUSES.includes(input.status)) throw new CaseStatusValidationError("Status filter is invalid.");
  for (const [value, allowed, label] of [
    [input.district, Array.from(new Set(CASES.map((item) => item.district))), "District"],
    [input.station, Array.from(new Set(CASES.map((item) => item.station))), "Station"],
    [input.category, Array.from(new Set(CASES.map((item) => item.category))), "Category"],
  ] as const) if (value && !allowed.includes(value)) throw new CaseStatusValidationError(`${label} filter is invalid.`);
  const page = input.page ?? 1; const pageSize = input.pageSize ?? 5;
  if (!Number.isInteger(page) || page < 1) throw new CaseStatusValidationError("Page must be a positive integer.");
  if (![5, 10, 20].includes(pageSize)) throw new CaseStatusValidationError("Page size is invalid.");
  const sortBy = input.sortBy ?? "updatedAt"; const sortDirection = input.sortDirection ?? "desc";
  const sorts: CaseSortField[] = ["updatedAt", "registeredAt", "firNumber", "status"];
  const directions: SortDirection[] = ["asc", "desc"];
  if (!sorts.includes(sortBy) || !directions.includes(sortDirection)) throw new CaseStatusValidationError("Sort selection is invalid.");
  return { ...input, search, page, pageSize, sortBy, sortDirection };
}

export async function getCaseStatusTracking(input: CaseStatusFilters, role: UserRole): Promise<CaseStatusTrackingResponse> {
  if (!hasPermission(role, "page:case-status-tracking")) throw new Error("Permission denied.");
  const filters = validateCaseStatusFilters(input);
  const canViewDetails = hasPermission(role, "data:view-investigation-notes");
  const search = filters.search?.toLowerCase();
  const rows = CASES.filter((item) =>
    (!search || `${item.firNumber} ${item.category} ${item.district} ${item.station}`.toLowerCase().includes(search)) &&
    (!filters.district || item.district === filters.district) && (!filters.station || item.station === filters.station) &&
    (!filters.category || item.category === filters.category) && (!filters.status || item.currentStatus === filters.status) &&
    (!filters.from || item.registeredAt.slice(0, 10) >= filters.from) && (!filters.to || item.registeredAt.slice(0, 10) <= filters.to)
  ).sort((a, b) => {
    const left = filters.sortBy === "status" ? a.currentStatus : a[filters.sortBy];
    const right = filters.sortBy === "status" ? b.currentStatus : b[filters.sortBy];
    return left.localeCompare(right) * (filters.sortDirection === "asc" ? 1 : -1);
  });
  const total = rows.length; const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const paged = rows.slice((page - 1) * filters.pageSize, page * filters.pageSize).map((item): CaseStatusRow => ({
    ...item, assignedOfficer: canViewDetails ? item.assignedOfficer : null,
    timeline: item.timeline.map((entry) => ({ ...entry, recordedBy: canViewDetails ? entry.recordedBy : null, internalNote: canViewDetails ? entry.internalNote : null })),
  }));
  await new Promise((resolve) => setTimeout(resolve, 200));
  return {
    rows: paged, total, page, pageSize: filters.pageSize, totalPages, isSampleData: true,
    generatedAt: new Date().toISOString(), restrictedDetailsRedacted: !canViewDetails,
    auditNote: "Audit persistence is pending feature 035. Case status views and restricted timeline access must be logged to Catalyst Data Store when audit logs are active.",
    availableFilters: {
      districts: Array.from(new Set(CASES.map((item) => item.district))).sort(),
      stations: Array.from(new Set(CASES.map((item) => item.station))).sort(),
      categories: Array.from(new Set(CASES.map((item) => item.category))).sort(),
      statuses: CASE_LIFECYCLE_STATUSES,
    },
  };
}
