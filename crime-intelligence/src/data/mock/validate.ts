import "server-only";

import { AppError } from "@/server/catalyst/errors";
import type { MockDatabaseState } from "@/data/contracts/entities";
import { getMockDatabase } from "./database";

export type MockValidationReport = { valid: boolean; errors: string[]; counts: Record<string, number> };

export function validateMockDatabase(state: MockDatabaseState = getMockDatabase().data): MockValidationReport {
  const errors: string[] = [];
  const exists = <T extends { id: string }>(rows: T[], id: string | undefined, label: string) => { if (id && !rows.some((item) => item.id === id)) errors.push(`${label} references missing id ${id}`); };
  state.stations.forEach((item) => exists(state.districts, item.districtId, `station ${item.id}`));
  state.officers.forEach((item) => { exists(state.stations, item.stationId, `officer ${item.id}`); exists(state.districts, item.districtId, `officer ${item.id}`); });
  state.incidents.forEach((item) => { exists(state.stations, item.stationId, `incident ${item.id}`); exists(state.districts, item.districtId, `incident ${item.id}`); exists(state.categories, item.crimeCategoryId, `incident ${item.id}`); if (item.latitude < -90 || item.latitude > 90 || item.longitude < -180 || item.longitude > 180) errors.push(`incident ${item.id} has invalid coordinates`); });
  state.firs.forEach((item) => { exists(state.incidents, item.incidentId, `fir ${item.id}`); exists(state.stations, item.stationId, `fir ${item.id}`); exists(state.districts, item.districtId, `fir ${item.id}`); item.legalSectionIds.forEach((id) => exists(state.legalSections, id, `fir ${item.id}`)); exists(state.persons, item.complainantPersonId, `fir ${item.id}`); exists(state.officers, item.investigatingOfficerId, `fir ${item.id}`); });
  state.cases.forEach((item) => { exists(state.firs, item.firId, `case ${item.id}`); exists(state.stations, item.stationId, `case ${item.id}`); exists(state.districts, item.districtId, `case ${item.id}`); exists(state.officers, item.leadOfficerId, `case ${item.id}`); item.supportingOfficerIds.forEach((id) => exists(state.officers, id, `case ${item.id}`)); });
  state.casePersons.forEach((item) => { exists(state.cases, item.caseId, `case-person ${item.id}`); exists(state.persons, item.personId, `case-person ${item.id}`); });
  state.evidence.forEach((item) => { exists(state.cases, item.caseId, `evidence ${item.id}`); exists(state.firs, item.firId, `evidence ${item.id}`); exists(state.officers, item.collectedByOfficerId, `evidence ${item.id}`); if (item.title.toLowerCase().includes("real")) errors.push(`evidence ${item.id} contains unsafe real-data marker`); });
  state.custodyEvents.forEach((item) => { exists(state.evidence, item.evidenceId, `custody ${item.id}`); exists(state.officers, item.fromOfficerId, `custody ${item.id}`); exists(state.officers, item.toOfficerId, `custody ${item.id}`); });
  state.tasks.forEach((item) => { exists(state.cases, item.caseId, `task ${item.id}`); exists(state.officers, item.assignedToOfficerId, `task ${item.id}`); exists(state.officers, item.assignedByOfficerId, `task ${item.id}`); });
  state.alerts.forEach((item) => { exists(state.districts, item.districtId, `alert ${item.id}`); exists(state.stations, item.stationId, `alert ${item.id}`); exists(state.cases, item.caseId, `alert ${item.id}`); });
  state.hotspots.forEach((item) => { exists(state.locations, item.locationId, `hotspot ${item.id}`); exists(state.stations, item.stationId, `hotspot ${item.id}`); exists(state.categories, item.crimeCategoryId, `hotspot ${item.id}`); });
  state.suspects.forEach((item) => { exists(state.persons, item.personId, `suspect ${item.id}`); item.linkedCaseIds.forEach((id) => exists(state.cases, id, `suspect ${item.id}`)); });
  state.documents.forEach((item) => { exists(state.officers, item.uploadedByOfficerId, `document ${item.id}`); });
  state.messages.forEach((item) => exists(state.conversations, item.sessionId, `message ${item.id}`));
  Object.entries(state).forEach(([name, rows]) => rows.forEach((row) => { if (!row.isSyntheticData) errors.push(`${name} contains a non-synthetic record`); }));
  return { valid: errors.length === 0, errors, counts: Object.fromEntries(Object.entries(state).map(([key, value]) => [key, value.length])) };
}

export function assertMockDatabaseValid(): MockValidationReport {
  const report = validateMockDatabase();
  if (!report.valid) throw new AppError("SCHEMA_MISMATCH", `Mock database validation failed with ${report.errors.length} errors.`);
  return report;
}
