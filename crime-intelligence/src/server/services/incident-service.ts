import { AppError, assertFound } from "@/server/catalyst/errors";
import { requireRowId } from "@/server/catalyst/server";
import type { AuthenticatedUser } from "@/server/catalyst/auth";
import { requirePermission, requireRecordAccess } from "@/server/permissions";
import { crimeIncidentRepository, type CrimeIncidentRecord } from "@/server/repositories/crime-incident-repository";
import { recordAuditEvent } from "@/server/services/audit-service";
import {
  optionalString,
  parsePagination,
  requireEnum,
  requireIsoDate,
  requireNumber,
  requireString,
} from "@/server/validation";
import type { ListResult } from "@/server/catalyst/datastore";

const INCIDENT_STATUSES = ["registered", "under_investigation", "charge_sheet_filed", "closed", "archived"] as const;
const SEVERITIES = ["low", "medium", "high", "critical"] as const;
const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
const EDITABLE_FIELDS = new Set([
  "title",
  "description",
  "crime_category_id",
  "district_id",
  "station_id",
  "occurred_at",
  "reported_at",
  "status",
  "severity",
  "priority",
  "latitude",
  "longitude",
  "assigned_officer_id",
]);

export async function listIncidents(user: AuthenticatedUser, params: URLSearchParams): Promise<ListResult<CrimeIncidentRecord>> {
  requirePermission(user, "page:fir-search");
  const pagination = parsePagination(params, 100);
  const filters: Record<string, unknown> = { is_deleted: false };
  const districtId = params.get("districtId") || undefined;
  const stationId = params.get("stationId") || undefined;
  if (districtId) filters.district_id = districtId;
  if (stationId) filters.station_id = stationId;
  applyJurisdictionFilters(user, filters);
  return crimeIncidentRepository.list({
    ...pagination,
    filters,
    sortBy: params.get("sortBy") ?? "occurred_at",
    sortDirection: params.get("sortDirection") === "asc" ? "asc" : "desc",
  });
}

export async function getIncident(user: AuthenticatedUser, id: string): Promise<CrimeIncidentRecord> {
  requirePermission(user, "page:fir-detail");
  const record = assertFound(await findIncident(id), "The requested incident could not be found.");
  requireRecordAccess(user, toScopedRecord(record));
  return record;
}

export async function createIncident(user: AuthenticatedUser, body: unknown): Promise<CrimeIncidentRecord> {
  requirePermission(user, "page:fir-detail");
  const input = parseIncidentInput(body);
  applyWriteJurisdiction(user, input);
  const existing = await crimeIncidentRepository.findByFirNumber(input.fir_number);
  if (existing) throw new AppError("RECORD_CONFLICT", "An incident with this FIR number already exists.");

  const now = new Date().toISOString();
  const record = await crimeIncidentRepository.insert({
    ...input,
    incident_id: createIncidentId(input.district_id),
    created_at: now,
    created_by: user.id,
    updated_at: now,
    updated_by: user.id,
    version: 1,
    is_deleted: false,
  });
  await recordAuditEvent({ actor: user, action: "incident_created", entityType: "crime_incidents", entityId: record.incident_id, newState: record });
  return record;
}

export async function updateIncident(user: AuthenticatedUser, id: string, body: unknown): Promise<CrimeIncidentRecord> {
  requirePermission(user, "page:fir-detail");
  const current = assertFound(await findIncident(id), "The requested incident could not be found.");
  requireRecordAccess(user, toScopedRecord(current));
  const changes = parseIncidentUpdate(body);
  applyWriteJurisdiction(user, changes);
  const rowId = requireRowId(current);
  const now = new Date().toISOString();
  const updated = await crimeIncidentRepository.update(rowId, {
    ...current,
    ...changes,
    incident_id: current.incident_id,
    fir_number: current.fir_number,
    created_at: current.created_at,
    created_by: current.created_by,
    updated_at: now,
    updated_by: user.id,
    version: (current.version ?? 1) + 1,
  });
  await recordAuditEvent({ actor: user, action: "incident_updated", entityType: "crime_incidents", entityId: current.incident_id, previousState: current, newState: updated });
  return updated;
}

export async function deleteIncident(user: AuthenticatedUser, id: string): Promise<void> {
  requirePermission(user, "page:fir-detail");
  const current = assertFound(await findIncident(id), "The requested incident could not be found.");
  requireRecordAccess(user, toScopedRecord(current));
  const rowId = requireRowId(current);
  const now = new Date().toISOString();
  await crimeIncidentRepository.update(rowId, {
    ...current,
    is_deleted: true,
    deleted_at: now,
    deleted_by: user.id,
    updated_at: now,
    updated_by: user.id,
    version: (current.version ?? 1) + 1,
  });
  await recordAuditEvent({ actor: user, action: "incident_deleted", entityType: "crime_incidents", entityId: current.incident_id, previousState: current, newState: { is_deleted: true } });
}

async function findIncident(id: string): Promise<CrimeIncidentRecord | null> {
  if (/^\d+$/.test(id)) return crimeIncidentRepository.findById(id);
  return crimeIncidentRepository.findByIncidentId(id);
}

function parseIncidentInput(body: unknown) {
  if (!body || typeof body !== "object") throw new AppError("VALIDATION_FAILED", "Expected a JSON object.");
  const input = body as Record<string, unknown>;
  return {
    fir_number: requireString(input.fir_number, "fir_number", { min: 3, max: 80 }),
    title: requireString(input.title, "title", { min: 3, max: 180 }),
    description: optionalString(input.description, "description", { max: 2000 }),
    crime_category_id: requireString(input.crime_category_id, "crime_category_id", { min: 2, max: 100 }),
    district_id: requireString(input.district_id, "district_id", { min: 2, max: 100 }),
    station_id: requireString(input.station_id, "station_id", { min: 2, max: 100 }),
    occurred_at: requireIsoDate(input.occurred_at, "occurred_at"),
    reported_at: input.reported_at ? requireIsoDate(input.reported_at, "reported_at") : undefined,
    status: requireEnum(input.status ?? "registered", "status", INCIDENT_STATUSES),
    severity: requireEnum(input.severity ?? "medium", "severity", SEVERITIES),
    priority: requireEnum(input.priority ?? "normal", "priority", PRIORITIES),
    latitude: input.latitude === undefined ? undefined : requireNumber(input.latitude, "latitude", { min: -90, max: 90 }),
    longitude: input.longitude === undefined ? undefined : requireNumber(input.longitude, "longitude", { min: -180, max: 180 }),
    assigned_officer_id: optionalString(input.assigned_officer_id, "assigned_officer_id", { max: 100 }),
  };
}

function parseIncidentUpdate(body: unknown): Partial<CrimeIncidentRecord> {
  if (!body || typeof body !== "object") throw new AppError("VALIDATION_FAILED", "Expected a JSON object.");
  const input = body as Record<string, unknown>;
  const next: Partial<CrimeIncidentRecord> = {};
  for (const key of Object.keys(input)) {
    if (!EDITABLE_FIELDS.has(key)) throw new AppError("VALIDATION_FAILED", `Field ${key} cannot be updated.`);
  }
  if ("title" in input) next.title = requireString(input.title, "title", { min: 3, max: 180 });
  if ("description" in input) next.description = optionalString(input.description, "description", { max: 2000 });
  if ("crime_category_id" in input) next.crime_category_id = requireString(input.crime_category_id, "crime_category_id", { min: 2, max: 100 });
  if ("district_id" in input) next.district_id = requireString(input.district_id, "district_id", { min: 2, max: 100 });
  if ("station_id" in input) next.station_id = requireString(input.station_id, "station_id", { min: 2, max: 100 });
  if ("occurred_at" in input) next.occurred_at = requireIsoDate(input.occurred_at, "occurred_at");
  if ("reported_at" in input) next.reported_at = input.reported_at ? requireIsoDate(input.reported_at, "reported_at") : undefined;
  if ("status" in input) next.status = requireEnum(input.status, "status", INCIDENT_STATUSES);
  if ("severity" in input) next.severity = requireEnum(input.severity, "severity", SEVERITIES);
  if ("priority" in input) next.priority = requireEnum(input.priority, "priority", PRIORITIES);
  if ("latitude" in input) next.latitude = input.latitude === undefined ? undefined : requireNumber(input.latitude, "latitude", { min: -90, max: 90 });
  if ("longitude" in input) next.longitude = input.longitude === undefined ? undefined : requireNumber(input.longitude, "longitude", { min: -180, max: 180 });
  if ("assigned_officer_id" in input) next.assigned_officer_id = optionalString(input.assigned_officer_id, "assigned_officer_id", { max: 100 });
  return next;
}

function applyJurisdictionFilters(user: AuthenticatedUser, filters: Record<string, unknown>): void {
  if (user.role === "Admin" || user.role === "Analyst") return;
  if (user.stationId) filters.station_id = user.stationId;
  else if (user.districtId) filters.district_id = user.districtId;
}

function applyWriteJurisdiction(user: AuthenticatedUser, changes: Partial<CrimeIncidentRecord>): void {
  if (user.role === "Admin" || user.role === "Analyst") return;
  if (user.stationId && changes.station_id && changes.station_id !== user.stationId) {
    throw new AppError("PERMISSION_DENIED", "You can only write records for your station.");
  }
  if (user.districtId && changes.district_id && changes.district_id !== user.districtId) {
    throw new AppError("PERMISSION_DENIED", "You can only write records for your district.");
  }
}

function toScopedRecord(record: CrimeIncidentRecord) {
  return {
    districtId: record.district_id,
    stationId: record.station_id,
    createdBy: record.created_by,
    assignedUserId: record.assigned_officer_id,
  };
}

function createIncidentId(districtId: string): string {
  const safeDistrict = districtId.toUpperCase().replace(/[^A-Z0-9]+/g, "-").slice(0, 16);
  return `INC-${safeDistrict}-${Date.now().toString(36).toUpperCase()}`;
}
