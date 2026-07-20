# Mock API

The mock API returns the shared `{ success, data, meta }` or `{ success: false, error }` response shape.

Core endpoints:

```text
GET/POST        /api/incidents
GET/PATCH/DELETE /api/incidents/:id
GET/POST        /api/firs
GET/PATCH       /api/firs/:id
GET/POST        /api/cases
GET/PATCH/DELETE /api/cases/:id
GET             /api/cases/:id/timeline|persons|evidence|tasks|related
GET/POST        /api/evidence
POST            /api/evidence/:id/transfer
GET/POST        /api/tasks
PATCH           /api/tasks/:id
GET             /api/alerts
PATCH           /api/alerts/:id/acknowledge|resolve
GET             /api/hotspots
GET             /api/search?q=...
GET             /api/analytics/overview|categories|districts|stations|case-performance
GET             /api/mock/analytics/trends
GET/POST        /api/conversations
GET             /api/conversations/:id
POST            /api/conversations/:id/messages
GET             /api/mock/status|validate
POST            /api/mock/seed|reset
```

Query parameters are applied server-side, including pagination, date ranges, status, district, station, severity, priority, and search. The map endpoints return map-specific DTOs instead of full database records.

The mock reset/seed endpoints are development-only. They must not be used as production administration endpoints.
