# API Design

## 1. API Design Principles

- Keep APIs feature-driven and documented before implementation.
- Use stable resource names.
- Apply authentication and authorization server-side.
- Validate all inputs.
- Return predictable response shapes.
- Audit sensitive operations.
- Do not implement APIs until the relevant feature is active.

## 2. Endpoint Naming Conventions

Use plural nouns and domain grouping:

- `/api/firs`
- `/api/firs/:id`
- `/api/analytics/districts`
- `/api/maps/incidents`
- `/api/ai/query`
- `/api/reports`
- `/api/datasets/uploads`
- `/api/admin/users`
- `/api/audit/logs`

## 3. Request Structure

Use JSON request bodies for create/update actions. Use query parameters for filtering, pagination, sorting, and search.

## 4. Response Structure

Standard successful response:

```json
{
  "data": {},
  "meta": {},
  "warnings": []
}
```

For lists:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "total": 0,
    "hasNextPage": false
  },
  "meta": {},
  "warnings": []
}
```

## 5. Error Response Format

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource.",
    "details": []
  }
}
```

Do not expose stack traces or sensitive data in API errors.

## 6. Pagination Format

Use `page`, `pageSize`, `total`, and `hasNextPage` by default. Cursor pagination may be used for large audit logs or imports if documented.

## 7. Filtering Format

Use explicit query parameters:

- `districtId`
- `stationId`
- `categoryId`
- `status`
- `dateFrom`
- `dateTo`
- `actId`
- `sectionId`

## 8. Sorting Format

Use `sortBy` and `sortDirection`. Validate allowed sort fields server-side.

## 9. Search Format

Use `q` for broad search and specific filters for structured search. Sensitive search fields must check permissions.

## 10. Authentication Expectations

Private APIs require authenticated sessions. Unauthenticated requests should return 401.

## 11. Authorization Expectations

Authorized sessions must still pass role, feature, data, and export permission checks. Forbidden requests should return 403.

## 12. Audit Requirements

APIs that view or mutate sensitive data must write audit logs. Exports and AI queries must always be logged.

## 13. AI Endpoint Requirements

AI endpoints must:

- Accept natural language input.
- Enforce permission-filtered data access.
- Return structured interpretation.
- Return grounded results.
- Return explanation and limitations.
- Avoid hallucinated records.
- Audit the query.

## 14. Dataset Upload Endpoint Requirements

Dataset upload endpoints must validate file type, size, schema, required columns, duplicate records, date parsing, and location validity before import.

## 15. Export Endpoint Requirements

Export endpoints must apply role checks, field redaction, row limits, generated-by metadata, timestamp, security footer, and audit logs.

## 16. Catalyst API Strategy

All APIs should be Catalyst-first.

Preferred implementation:

1. Use Catalyst Functions or AppSail server routes for server-side business logic.
2. Use Catalyst API Gateway or Security Rules for route exposure, routing, authentication enforcement, and throttling where needed.
3. Keep each endpoint documented in the relevant feature spec before implementation.
4. Do not create a separate `apps/api` application.
5. Use Catalyst Data Store through server-side services for persistent data.
6. Use Catalyst Stratus for uploads and exports.
7. Log sensitive API calls to Catalyst Data Store audit tables.
8. Keep external API keys server-side in Catalyst environment/configuration.
