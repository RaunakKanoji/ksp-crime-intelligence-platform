# Migration Plan

Status date: 2026-07-11

## Phase 1: Audit and Stabilization

- Keep this audit package current.
- Run lint, type-check, and production build.
- Record failures in `completion-report.md`.
- Stop adding feature `061` or unrelated features.
- Classify mock/demo/sample usage.

## Phase 2: Database Design

- Review `database-model.md` with Catalyst table names and column constraints.
- Define Catalyst Data Store tables and indexes.
- Document Stratus buckets/folders for uploads and generated files.
- Define seed data split: reference, development demo, and tests.

## Phase 3: Platform Foundation

- Add server-side Catalyst wrapper modules.
- Add shared app error model.
- Add authenticated-user helper.
- Add server permission helpers.
- Add repository conventions.
- Add audit event service.
- Added executable Phase 1 database artifacts for users, profiles, roles, assignments, jurisdiction access, and audit events.
- Added validation, schema checklist, import command, and environment verification scripts.

## Phase 4: Core Persistence

Order:

1. Users, roles, permissions.
2. Districts, police stations, categories, acts, sections.
3. Crime records, cases, locations.
4. Persons and person-case links.
5. Documents/imports/reports.
6. Saved views, dashboard preferences, assistant conversations.
7. Alerts, notifications, watchlist.

## Phase 5: Feature Migration

Migrate one connected cluster at a time:

1. Crime Records: F008-F010.
2. Map: F011-F012, F026-F027.
3. Dashboard/summary/analytics: F004-F005, F013-F016, F041-F051.
4. People/intelligence: F017-F022, F028-F029.
5. Cases/alerts: F023-F025, F052-F053.
6. Reports/assistant/productivity: F006-F007, F030-F032, F054-F056.
7. Data/admin: F033-F040, F057-F058.

Each cluster must include repository methods, service methods, validation, permissions, audit events, UI states, tests, and removal of obsolete mocks.

## Catalyst Setup Checklist

- Catalyst Authentication roles mapped to Admin, Investigator, Analyst, Officer, Viewer.
- Catalyst Data Store Phase 1 tables: `roles`, `users`, `user_profiles`, `user_role_assignments`, `jurisdiction_access`, `audit_events`.
- Catalyst Data Store tables from `database-model.md`.
- Indexes for owner, role, jurisdiction, status, created/updated dates, FIR number, and entity references.
- Stratus folders for dataset uploads, validation reports, generated exports, and case documents.
- Environment variables for server-only Catalyst credentials/configuration.
- Scheduled jobs only for documented recurring work: hotspot refresh, alert recalculation, retention, scheduled report generation.

## Idempotent Seed Strategy

- Upsert reference data by stable codes.
- Upsert roles by role name.
- Upsert demo users by email.
- Upsert user role assignments by `assignment_key`.
- Upsert jurisdiction access by `access_key`.
- Upsert sample crime records by FIR number only in development/demo mode.
- Never seed demo data into production without an explicit demo environment flag.
