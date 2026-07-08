// FIR Advanced Filters data service (feature 010).
//
// Catalyst Data Store is not connected yet, so this service filters the shared
// SAMPLE FIR records. Multi-select filtering, validation, pagination, and
// permission redaction happen here before the UI receives data.

import { CATEGORIES, DISTRICTS } from "@/lib/dashboard/types";
import { STATIONS } from "@/lib/dashboard/summary";
import { hasPermission, type UserRole } from "@/lib/permissions";
import {
  ACTS,
  CASE_STATUSES,
  EMPTY_FIR_ADVANCED_FILTERS,
  FIR_ADVANCED_PAGE_SIZE,
  SECTIONS,
  type FirAdvancedFilterRequest,
  type FirAdvancedFilterResponse,
  type FirAdvancedFilters,
  type FirDatePreset,
  type FirSearchResult,
  type FirValidationError,
} from "./types";
import { SAMPLE_FIR_RECORDS, type RawFirRecord } from "./search";

export class FirAdvancedFilterValidationError extends Error {
  errors: FirValidationError[];

  constructor(errors: FirValidationError[]) {
    super("Invalid FIR advanced filters.");
    this.name = "FirAdvancedFilterValidationError";
    this.errors = errors;
  }
}

export const FIR_DATE_PRESETS: { key: FirDatePreset; label: string }[] = [
  { key: "all", label: "All dates" },
  { key: "last-7-days", label: "Last 7 days" },
  { key: "last-30-days", label: "Last 30 days" },
  { key: "last-90-days", label: "Last 90 days" },
  { key: "custom", label: "Custom range" },
];

const REFERENCE_DATE = "2026-07-08";

function cleanText(value: string | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeDate(value: string | undefined): string {
  const cleaned = cleanText(value);
  if (!cleaned) return "";
  return /^\d{4}-\d{2}-\d{2}$/.test(cleaned) ? cleaned : "";
}

function uniqueAllowed(values: string[] | undefined, allowed: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values ?? []) {
    const cleaned = cleanText(value);
    if (allowed.includes(cleaned) && !seen.has(cleaned)) {
      seen.add(cleaned);
      result.push(cleaned);
    }
  }
  return result;
}

function allStations(): string[] {
  return DISTRICTS.flatMap((district) => STATIONS[district] ?? []);
}

function presetRange(preset: FirDatePreset): { from: string; to: string } {
  if (preset === "all" || preset === "custom") return { from: "", to: "" };
  const days = preset === "last-7-days" ? 7 : preset === "last-30-days" ? 30 : 90;
  const to = new Date(`${REFERENCE_DATE}T00:00:00.000Z`);
  const from = new Date(to);
  from.setUTCDate(to.getUTCDate() - days + 1);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function normalizeAdvancedFilters(input: Partial<FirAdvancedFilters>): FirAdvancedFilters {
  const datePreset = FIR_DATE_PRESETS.some((preset) => preset.key === input.datePreset)
    ? (input.datePreset as FirDatePreset)
    : "all";
  const presetDates = presetRange(datePreset);
  const districts = uniqueAllowed(input.districts, DISTRICTS);
  const allowedStations =
    districts.length > 0 ? districts.flatMap((district) => STATIONS[district as keyof typeof STATIONS] ?? []) : allStations();

  return {
    ...EMPTY_FIR_ADVANCED_FILTERS,
    datePreset,
    dateFrom: datePreset === "custom" ? normalizeDate(input.dateFrom) : presetDates.from,
    dateTo: datePreset === "custom" ? normalizeDate(input.dateTo) : presetDates.to,
    districts,
    policeStations: uniqueAllowed(input.policeStations, allowedStations),
    crimeCategories: uniqueAllowed(input.crimeCategories, CATEGORIES),
    acts: uniqueAllowed(input.acts, ACTS),
    sections: uniqueAllowed(input.sections, SECTIONS),
    caseStatuses: uniqueAllowed(input.caseStatuses, CASE_STATUSES),
    keyword: cleanText(input.keyword).slice(0, 80),
  };
}

function validateFilters(filters: FirAdvancedFilters): FirValidationError[] {
  const errors: FirValidationError[] = [];
  if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
    errors.push({ field: "dateFrom", message: "Start date must be on or before end date." });
  }
  if (filters.datePreset === "custom" && (filters.dateFrom || filters.dateTo) && !(filters.dateFrom && filters.dateTo)) {
    errors.push({ field: "datePreset", message: "Custom date range requires both start and end dates." });
  }
  if (filters.keyword && !/^[\w\s./()-]+$/i.test(filters.keyword)) {
    errors.push({
      field: "keyword",
      message: "Keyword can contain letters, numbers, spaces, dots, slashes, parentheses, and hyphens only.",
    });
  }
  return errors;
}

function contains(value: string, query: string): boolean {
  return value.toLowerCase().includes(query.toLowerCase());
}

function matches(record: RawFirRecord, filters: FirAdvancedFilters): boolean {
  if (filters.dateFrom && record.incidentDate < filters.dateFrom) return false;
  if (filters.dateTo && record.incidentDate > filters.dateTo) return false;
  if (filters.districts.length > 0 && !filters.districts.includes(record.district)) return false;
  if (filters.policeStations.length > 0 && !filters.policeStations.includes(record.policeStation)) return false;
  if (filters.crimeCategories.length > 0 && !filters.crimeCategories.includes(record.crimeCategory)) return false;
  if (filters.acts.length > 0 && !filters.acts.includes(record.act)) return false;
  if (filters.sections.length > 0 && !filters.sections.includes(record.section)) return false;
  if (filters.caseStatuses.length > 0 && !filters.caseStatuses.includes(record.caseStatus)) return false;
  if (filters.keyword) {
    const haystack = [
      record.firNumber,
      record.district,
      record.policeStation,
      record.crimeCategory,
      record.act,
      record.section,
      record.caseStatus,
      record.incidentSummary,
    ].join(" ");
    if (!contains(haystack, filters.keyword)) return false;
  }
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

function activeFilterCount(filters: FirAdvancedFilters): number {
  return [
    filters.datePreset !== "all",
    filters.districts.length > 0,
    filters.policeStations.length > 0,
    filters.crimeCategories.length > 0,
    filters.acts.length > 0,
    filters.sections.length > 0,
    filters.caseStatuses.length > 0,
    filters.keyword.length > 0,
  ].filter(Boolean).length;
}

export async function filterFirsAdvanced(
  request: FirAdvancedFilterRequest,
  role: UserRole
): Promise<FirAdvancedFilterResponse> {
  const filters = normalizeAdvancedFilters(request.filters);
  const errors = validateFilters(filters);
  if (errors.length > 0) throw new FirAdvancedFilterValidationError(errors);

  const pageSize = FIR_ADVANCED_PAGE_SIZE;
  const page = Number.isInteger(request.page) && request.page > 0 ? request.page : 1;

  await new Promise((resolve) => setTimeout(resolve, 250));

  const filtered = SAMPLE_FIR_RECORDS.filter((record) => matches(record, filters)).sort((a, b) =>
    b.incidentDate.localeCompare(a.incidentDate)
  );
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    isSampleData: true,
    generatedAt: new Date().toISOString(),
    filters,
    rows: filtered.slice(start, start + pageSize).map((record) => redact(record, role)),
    total,
    page: safePage,
    pageSize,
    totalPages,
    activeFilterCount: activeFilterCount(filters),
    redaction: {
      pii: hasPermission(role, "data:view-pii"),
      investigationNotes: hasPermission(role, "data:view-investigation-notes"),
    },
    savedFilterNote:
      "Saved filters are stored locally in this browser until feature 054 adds connected saved-query storage.",
    auditNote:
      "Audit integration is pending feature 035. Advanced filter criteria and sensitive-result views should be logged in Catalyst Data Store when audit logs are active.",
  };
}
