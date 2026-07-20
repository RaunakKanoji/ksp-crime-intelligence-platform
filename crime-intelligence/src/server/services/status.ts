export const CASE_STATUSES = [
  "registered",
  "under_investigation",
  "charge_sheet_filed",
  "pending_trial",
  "solved",
  "closed",
  "disposed",
  "archived",
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];

export const IMPORT_STATUSES = [
  "uploaded",
  "validating",
  "validation_failed",
  "validated",
  "importing",
  "imported",
  "failed",
  "archived",
] as const;

export type ImportStatus = (typeof IMPORT_STATUSES)[number];

export const ALERT_STATUSES = [
  "new",
  "assigned",
  "under_review",
  "resolved",
  "dismissed",
  "archived",
] as const;

export type AlertStatus = (typeof ALERT_STATUSES)[number];

export const REPORT_RUN_STATUSES = [
  "queued",
  "generating",
  "completed",
  "failed",
  "expired",
] as const;

export type ReportRunStatus = (typeof REPORT_RUN_STATUSES)[number];

