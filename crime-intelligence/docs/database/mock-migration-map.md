# KSP mock database migration map

The mock provider is the migration seam for the KSP Crime Intelligence application. New server code should depend on repository interfaces and services, not on feature-local arrays or the legacy Catalyst adapter.

| Application capability | Central source | Repository/service | API seam | Current consumer status |
| --- | --- | --- | --- | --- |
| Incidents | `incidents` | `provider.incidents` | `/api/incidents` | Central provider selected when `DATA_PROVIDER=mock` |
| FIR search and detail | `firs` | `provider.firs` | `/api/firs` | Central provider selected when `DATA_PROVIDER=mock` |
| Case status and timeline | `cases`, notes, status history, relationships | `provider.cases` | `/api/cases` | Central repository and child-resource routes |
| Evidence and custody | `evidence`, custody events | `provider.evidence` | `/api/evidence`, `/api/evidence/:id/transfer` | Central repository and mutation audit |
| Dashboard metrics | incidents, FIRs, cases, tasks, alerts | `provider.dashboard` | `/api/analytics/*` | Central overview/category/district/station/performance routes |
| Map incidents and hotspots | incidents, locations, hotspots, alerts | `map-service` | `/api/map/*` | Central DTO service; UI loads through API client |
| Global search | cases, FIRs, incidents, people, officers, stations, vehicles, evidence, reports | `provider.search` | `/api/search` | Central repository |
| Conversational queries | repository-derived aggregates | `conversation-service` | `/api/conversations` | Central rule-based mock assistant with persisted sessions |
| Tasks and alerts | tasks, alerts | `provider.tasks`, `provider.alerts` | `/api/tasks`, `/api/alerts` | Central repository and audit-backed mutations |
| Admin/audit views | users, audit logs | provider contracts are available | existing admin APIs | Existing feature-specific routes still require incremental adapter migration |

## Migration order

1. Keep all new feature reads and writes behind `getRepositoryProvider()`.
2. Move remaining feature-local fixtures into the matching entity seeders.
3. Adapt existing feature-specific services to repository interfaces one capability at a time.
4. Add Neon implementations with the same interfaces and switch only through `DATA_PROVIDER=neon`.
5. Remove legacy Catalyst/mock fixture paths after the Neon adapter and integration tests pass.

The existing feature pages and specialized analytics routes are intentionally not silently rewritten in this change: several already contain user worktree changes and some still use their feature-specific services. The central provider, API seams, and migration mapping make those remaining migrations explicit and incremental.
