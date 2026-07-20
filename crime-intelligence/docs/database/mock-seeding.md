# Mock seeding guide

The default seed is deterministic (`MOCK_DATABASE_SEED=20260720`) and uses `MOCK_REFERENCE_DATE=2026-07-20`. Reinitializing the server with the same configuration creates the same identifiers and core records.

Supported configuration includes:

```env
DATA_PROVIDER=mock
MOCK_DATABASE_ENABLED=true
MOCK_DATABASE_SEED=20260720
MOCK_REFERENCE_DATE=2026-07-20
MOCK_DATABASE_LATENCY_MS=0
MOCK_DATABASE_FAILURE=false
MOCK_DISTRICT_COUNT=10
MOCK_STATION_COUNT=32
MOCK_OFFICER_COUNT=146
MOCK_PERSON_COUNT=612
MOCK_INCIDENT_COUNT=420
MOCK_FIR_COUNT=286
MOCK_CASE_COUNT=278
```

Additional entity-count variables are documented in `src/data/mock/config.ts`.

The seed order is reference data, districts/stations, officers/users, persons, incidents, FIRs, cases, relationships, suspects/arrests, evidence/custody, notes/tasks, alerts, locations/hotspots, beats/vehicles, reports/documents, audit logs, and conversations.

To simulate failure and latency in development:

```sh
MOCK_DATABASE_LATENCY_MS=500 MOCK_DATABASE_FAILURE=false npm run dev
MOCK_DATABASE_FAILURE=true npm run dev
```

The validation endpoint checks foreign-key-like references, coordinates, synthetic flags, and major operational relationships.
