# Database Model

Status date: 2026-07-11

This is the production target model derived from implemented specifications `001-060`, existing services, and `context/docs/data-model-overview.md`. It is intentionally consolidated around shared domain objects so the app does not create one table per feature demo.

## Shared Fields

Use these metadata fields where applicable:

`id`, `created_at`, `created_by`, `updated_at`, `updated_by`, `status`, `version`, `is_archived`, `archived_at`, `archived_by`

Catalyst-native identifiers should be used where Catalyst supplies stable row IDs. Do not duplicate platform IDs unless an external reference must be stored.

## Core Tables

| Table | Purpose | Primary identifier | Required columns | Optional columns | Relationships | Ownership and permissions | Indexing needs | Soft delete/audit | Specs |
|---|---|---|---|---|---|---|---|---|---|
| `users` | App profile for Catalyst-authenticated users | `id`/Catalyst user id | email, display_name, role_id, status | district_id, station_id, phone, last_login_at | role, district, station | User can read own safe profile; Admin manages | email, role_id, district_id, station_id, status | Archive disabled users; audit role/status changes | F001-F003, F033 |
| `user_profiles` | Non-authentication user profile details | `user_id` | user_id, status | rank_title, organization_id, district_id, station_id | users | User can read/update allowed own fields; Admin manages | user_id, organization_id, district_id, station_id, status | Archive with user; audit administrative updates | F001-F003, F033 |
| `roles` | Role definitions mapped to app permissions | `id` | name, description, status | catalyst_role_id | users, role_permissions | Admin write; all authenticated read safe role labels | name, status | Archive only if no active users; audit changes | F002, F034 |
| `user_role_assignments` | Assignment history connecting users to roles | `assignment_key` | assignment_key, user_id, role_id, status, assigned_at, assigned_by | removed_at, removed_by | users, roles | Admin read/write | assignment_key, user_id, role_id, status, assigned_at | Close assignments rather than delete; audit every assignment/removal | F002, F033, F034 |
| `jurisdiction_access` | User jurisdiction or organizational access grants | `access_key` | access_key, user_id, access_level, status | organization_id, district_id, station_id | users | User can read own grants; Admin manages | access_key, user_id, organization_id, district_id, station_id, status | Archive revoked grants; audit every grant/update/archive | F002, F033 |
| `role_permissions` | Fine-grained permission grants | `id` | role_id, permission_key, status | scope | role | Admin write | role_id, permission_key | Audit every change | F002, F034 |
| `districts` | Jurisdiction reference | `id` | name, code, status | boundary_ref, population | stations, crime_records | Admin/master-data write; scoped reads | code, name, status | Archive only if unused or migrated | F013, F014, F040 |
| `police_stations` | Police station jurisdiction | `id` | name, code, district_id, status | boundary_ref, contact | district, users, crime_records | Admin/master-data write; scoped reads | district_id, code, status | Archive with impact check | F013, F040 |
| `crime_categories` | Normalized crime category hierarchy | `id` | name, code, status | parent_id, severity_default | crime_records | Admin/master-data write | code, parent_id, status | Audit changes | F005, F016, F045-F051 |
| `legal_acts` | Legal act reference | `id` | name, code, status | jurisdiction, effective_from | legal_sections | Admin/master-data write | code, status | Version significant legal changes | F040-F042 |
| `legal_sections` | Legal section reference | `id` | act_id, section_number, title, status | description, severity | act, crime_record_sections, charge_sheets | Admin/master-data write | act_id, section_number, status | Version significant legal changes | F040-F042 |
| `crime_records` | FIR/case-facing primary crime record | `id` | fir_number, district_id, station_id, registered_at, category_id, case_status | summary, incident_at, location_id, investigation_status, source_import_id | district, station, category, location, case, persons | Scoped by role, district, station; sensitive fields redacted | fir_number, district_id, station_id, category_id, case_status, registered_at | Archive instead of delete; audit sensitive views/mutations | F008-F016, F020-F032, F045-F051 |
| `locations` | Incident and jurisdiction geospatial records | `id` | district_id, precision_level | station_id, address_masked, latitude, longitude, boundary_ref | crime_records, map layers | Exact access restricted; aggregates broadly scoped | district_id, station_id, precision_level | Audit exact-location access | F011-F012, F026-F027 |
| `persons` | Accused, victim, witness, suspect profiles | `id` | person_type, protected_name, status | age, gender, aliases, identifiers_hash, district_id, station_id | person_case_links, watchlist | PII access restricted and audited | person_type, district_id, station_id, status | Archive; never hard-delete without policy | F017-F019, F021, F044, F048, F052 |
| `person_case_links` | Relationship between persons and records/cases | `id` | person_id, crime_record_id, relationship_type, status | confidence, notes_restricted | persons, crime_records | Scoped to record access; PII redaction applies | person_id, crime_record_id, relationship_type | Audit sensitive link changes | F017-F021 |
| `cases` | Operational case lifecycle | `id` | crime_record_id, case_number, status | assigned_user_id, priority_band, closed_at | crime_record, status_events, documents | Scoped by jurisdiction and assignment | status, assigned_user_id, crime_record_id | Archive closed cases by retention policy | F023-F025, F042-F044 |
| `case_status_events` | Case timeline/status history | `id` | case_id, status, occurred_at, actor_id | note_restricted | case | Read with case; write by authorized roles | case_id, status, occurred_at | Audit status changes | F023 |
| `documents` | Uploaded/generated file metadata | `id` | owner_type, owner_id, file_name, storage_key, file_type, status | size_bytes, checksum, generated_by | cases, reports, imports | Server-only storage access; scoped metadata reads | owner_type, owner_id, status | Audit upload/delete/download | F030-F037 |
| `data_imports` | Dataset upload/import job | `id` | file_document_id, status, submitted_by | row_count, error_count, started_at, completed_at | documents, validation_results, processing_jobs | Admin/data roles | status, submitted_by, created_at | Audit upload/import/reset | F036-F039, F057 |
| `validation_results` | Dataset validation findings | `id` | import_id, severity, code, message | row_number, field_name | data_import | Admin/data roles | import_id, severity | Retain with import | F037-F038 |
| `cleaning_rules` | Data cleaning rule definitions | `id` | name, rule_type, status | configuration_json | imports | Admin/data roles | status, rule_type | Audit every rule change | F038 |
| `processing_jobs` | Async/background job state | `id` | job_type, status, requested_by | entity_type, entity_id, progress, error_code | imports, reports, alerts | Scoped by job type/owner | job_type, status, created_at | Audit job state failures | F012, F036-F039 |
| `reports` | Saved report definitions | `id` | name, owner_id, report_type, status | filters_json, schedule_json | report_runs, saved_queries | Owner/admin read; export permissions required | owner_id, report_type, status | Archive; audit changes | F030-F032 |
| `report_runs` | Generated report/export executions | `id` | report_id, status, requested_by | output_document_id, format, row_count | reports, documents | Owner/admin read | report_id, status, created_at | Audit all exports | F030-F032 |
| `saved_queries` | Saved searches and assistant queries | `id` | owner_id, name, query_type, query_payload | shared_scope, last_run_at | users, dashboard preferences | Owner read/write; shared by scope | owner_id, query_type, updated_at | Archive; audit sharing | F006, F010, F054 |
| `dashboard_preferences` | Per-user dashboard layout/settings | `id` | user_id, layout_json, status | default_filters_json | users | User owner/admin support | user_id, status | Archive superseded versions | F004, F055 |
| `alerts` | Risk/notification source alerts | `id` | alert_type, severity, status, created_at | entity_type, entity_id, assigned_to, due_at | notifications, crime_records, cases | Scoped by jurisdiction/assignment | severity, status, alert_type, created_at | Audit status changes | F025, F052-F053 |
| `notifications` | User-facing notification instances | `id` | user_id, alert_id, status | read_at, channel | user, alert | Owner read/update | user_id, status, created_at | Archive after retention | F053 |
| `watchlist_entries` | Suspect/person watchlist state | `id` | person_id, status, reason, created_by | review_due_at, removed_reason | persons, audit | Restricted investigator/admin | person_id, status, review_due_at | Audit all changes | F052 |
| `ai_conversations` | Assistant conversation sessions | `id` | owner_id, title, status | source_context | ai_messages | Owner/admin with scoped data | owner_id, status, updated_at | Archive; audit sensitive queries | F006-F007, F056 |
| `ai_messages` | Assistant messages/results | `id` | conversation_id, role, content_summary, created_at | structured_result_json, sources_json, error_code | conversation | Owner/admin scoped | conversation_id, created_at | Avoid storing secrets/raw excessive PII | F006-F007, F056 |
| `generated_insights` | Persisted analytic/pattern outputs | `id` | insight_type, status, generated_at | entity_type, entity_id, confidence, explanation_json | crime_records, locations, cases | Scoped by source entities | insight_type, status, generated_at | Audit review/accept/reject | F012, F022, F024, F028-F029 |
| `map_layers` | User/system map layer configuration | `id` | name, layer_type, status | configuration_json, owner_id | locations, boundaries | System/admin write; user-owned private layers | layer_type, status | Audit shared layers | F011, F026-F027 |
| `data_connectors` | External/source connector configuration metadata | `id` | name, connector_type, status | safe_config_json, last_run_at | connector_runs | Admin only; no secrets in client | connector_type, status | Audit changes; secrets in Catalyst env only | F057 |
| `connector_runs` | Connector execution logs | `id` | connector_id, status, started_at | completed_at, row_count, error_code | data_connectors | Admin/data roles | connector_id, status, started_at | Retain by policy | F057 |
| `system_settings` | Server-authoritative app settings | `id` | setting_key, setting_value_json, status | scope | none | Admin write; server read | setting_key, scope | Audit all changes | F058 |
| `help_articles` | Help/documentation content if editable | `id` | slug, title, body, status | audience_role | none | Admin write; all scoped read | slug, status | Audit edits | F059 |
| `audit_events` | Security and operational audit trail | `id` | actor_id, action, entity_type, entity_id, occurred_at, outcome | previous_state_json, new_state_json, route, error_code, correlation_id | all sensitive entities | Admin/security read; append-only server writes | actor_id, action, entity_type, occurred_at, outcome | Append-only; retention policy required | F001-F060 |

## Lifecycle Constants

Centralize status constants in code rather than repeating strings.

- Case lifecycle: `registered`, `under_investigation`, `charge_sheet_filed`, `pending_trial`, `solved`, `closed`, `disposed`, `archived`
- Import lifecycle: `uploaded`, `validating`, `validation_failed`, `validated`, `importing`, `imported`, `failed`, `archived`
- Alert lifecycle: `new`, `assigned`, `under_review`, `resolved`, `dismissed`, `archived`
- Report run lifecycle: `queued`, `generating`, `completed`, `failed`, `expired`
- Watchlist lifecycle: `active`, `under_review`, `removed`, `archived`
- Generic record lifecycle: `active`, `inactive`, `archived`

## Catalyst Mapping

- Catalyst Authentication: identity, sign-in, sign-up, sign-out.
- Catalyst Data Store: all structured tables above.
- Catalyst Stratus/File storage: `documents` storage keys for uploads and generated reports.
- Catalyst Functions/AppSail routes: protected server operations, validation, import processing, AI orchestration.
- Catalyst Cache: safe short-lived reference data and dashboard aggregate caching.
- Catalyst Job Scheduling: hotspot/alert recalculation, retention checks, scheduled report generation.
