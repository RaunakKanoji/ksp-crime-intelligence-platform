# Data Flow Map

Status date: 2026-07-11

## Current Flow

```text
Browser page/component
  -> feature API helper or fetch()
  -> Next.js app/api route or direct service import
  -> feature service
  -> mock/sample/static data, localStorage, or in-memory state
```

Current risks:

- Frontend components and route handlers sometimes import the same mock source.
- Authorization is mostly role/permission checks, not record-level datastore scoping.
- Simulated latency with `setTimeout` appears in production services.
- Saved filters, role overrides, and permission edits can live in browser storage.
- Audit persistence is repeatedly documented as pending.

## Target Flow

```text
Browser UI
  -> API route/server action
  -> validation
  -> authenticated session helper
  -> permission and record-scope checks
  -> service
  -> repository
  -> Catalyst Data Store / Stratus / Cache
  -> audit event append
  -> normalized response or safe application error
```

## Migration Order

1. Auth/session, roles, permissions, audit events.
2. Master data: districts, stations, categories, acts, sections.
3. Core crime records, cases, locations, person links.
4. Map and analytics read paths over bounded/paginated queries.
5. Reports, exports, document metadata, and Stratus storage.
6. Saved queries, dashboard preferences, AI conversations.
7. Alerts, notifications, watchlist entries.
8. Dataset imports, validation, cleaning rules, connectors, processing jobs.

## Route Clusters

| Cluster | Current routes | Target data flow |
|---|---|---|
| Auth | `/login`, `/signin`, `/signup`, `/api/logout` | Catalyst Auth -> server session profile -> audit security events |
| Dashboard | `/`, `/dashboard`, `/crime-summary`, `/dashboard/customization` | Aggregated repository queries + persisted dashboard preferences |
| Crime records | `/fir-search`, `/fir-search/[id]`, `/fir-advanced-filters` | `crime_records` search/detail APIs with saved views |
| Map | `/crime-map`, `/map`, `/crime-map/clusters`, `/crime-map/location-intelligence`, `/api/map/*` | Viewport/bounded location queries + generated insights |
| Analytics | `/analytics/*` | Server aggregate queries over `crime_records`, cases, legal/domain detail tables |
| People | `/people`, `/people/repeat-offenders`, `/victims` | `persons` + `person_case_links`, with audited PII access |
| Intelligence | `/intelligence/*` | Derived links/patterns from persisted records and reviewed insights |
| Cases | `/cases/*` | `cases`, status events, alert and priority score records |
| Reports | `/reports` | report definitions/runs + Stratus documents + export audit |
| Assistant | `/ai-query`, `/ai-query/explanation`, `/ai-query/history` | server-grounded assistant requests + persisted conversations/messages |
| Data operations | `/dataset-*`, `/data-source-connectors` | documents/import jobs/validation/connector runs |
| Admin | `/admin-*`, `/admin/*` | server-authoritative users/roles/settings/audit |
| Support/demo | `/help`, `/demo-mode` | static or editable help; demo isolated from production data |

## Server Response Standard

All migrated APIs should return:

```json
{
  "data": {},
  "meta": {},
  "warnings": []
}
```

Errors should return:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Check the highlighted fields and try again.",
    "fieldErrors": {},
    "correlationId": "optional"
  }
}
```

