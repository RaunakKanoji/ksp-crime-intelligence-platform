# Mock to Neon migration

The current persistent seed path is:

```sh
npm run db:apply:postgres
npm run db:seed:postgres
npm run db:seed:mock:postgres
```

The last command writes the deterministic core mock records to Neon. The
application still defaults to `DATA_PROVIDER=mock`; switching the application
to `DATA_PROVIDER=neon` requires the repository adapter described below.

The migration boundary is the repository contract, not the UI. Replace `src/data/mock/repositories.ts` with a Neon implementation that satisfies `RepositoryProvider`; keep API response contracts and domain services unchanged.

## Replacement order

1. Create normalized tables for districts, stations, officers, categories, incidents, FIRs, and cases.
2. Add person relationships, evidence/custody, tasks, alerts, hotspots, and vehicles.
3. Add reports, documents, audit logs, and conversation history.
4. Add jurisdiction and record-level authorization at the server boundary.
5. Replace the in-memory seed with migrations and a development-only seed import.

## Database recommendations

Index incident `district_id`, `station_id`, `crime_category_id`, `occurred_at`, and `status`; case `district_id`, `station_id`, `lead_officer_id`, `status`, `priority`, and `updated_at`; evidence `case_id`; tasks `assigned_to_officer_id`, `status`, and `due_date`; alerts `status`, `district_id`, and `generated_at`; and conversation messages `session_id`, `created_at`.

Keep `CasePersonRelationship`, `EvidenceCustodyEvent`, `CaseStatusHistory`, and `AuditLog` as relational history tables. Keep event-specific alert metadata and conversation filters as JSON only where the fields are genuinely flexible.

## Files that should remain stable

- `src/data/contracts/*`
- `src/data/services/*`
- API response shapes
- UI components and feature hooks

The future implementation should change the provider factory and repository implementation, then remove the mock-only development controls after production authorization and migration tests are in place.
