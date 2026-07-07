# Testing Strategy

## 1. Unit Testing Strategy

Unit test pure functions and domain rules:

- Permission checks
- Role mapping
- Data validators
- Date filters
- Query builders
- Formatters
- Hotspot scoring
- Priority scoring
- Redaction utilities

## 2. Component Testing Strategy

Component tests should cover:

- Forms and validation messages
- Tables and empty states
- Dashboard cards
- Filter bars
- Permission-restricted UI
- Error and loading states
- Dialogs and confirmation flows

## 3. Integration Testing Strategy

Integration tests should cover:

- Login-protected route access
- Role-based page access
- FIR search with filters
- FIR detail permission handling
- Dataset upload validation flow
- Report export permission checks
- Audit log creation for sensitive actions

## 4. API Testing Strategy

API tests should verify:

- Authentication required for private endpoints
- Authorization enforced per role
- Request validation
- Error response shape
- Pagination, sorting, filtering
- Redaction in responses
- Audit log side effects

## 5. Security Testing Strategy

Security checks should include:

- Unauthorized route access
- Restricted field leakage
- Export redaction
- Prompt injection attempts
- File upload validation
- Cross-role data access
- Sensitive audit log access

## 6. Data Validation Testing

Dataset validation tests should include:

- Missing required columns
- Invalid dates
- Duplicate FIR numbers
- Invalid district/station names
- Unknown sections/acts
- Empty or malformed location values
- Large files and partial failures

## 7. AI Response Testing

AI tests should verify:

- Natural language query parsing
- Structured query generation
- Refusal when query asks for unauthorized data
- No hallucinated FIR records
- Explanation includes limitations
- Prompt injection resistance
- Human-review warning present

## 8. Map / Geospatial Testing

Map tests should verify:

- Marker rendering with authorized data
- Clustering behavior
- Heatmap toggles
- Boundary display fallback
- Sensitive location masking
- Empty map state
- Missing map API key state

## 9. Report Export Testing

Report tests should verify:

- Correct filters included
- Permission checks
- PII redaction
- File naming
- Generated timestamp
- Generated-by metadata
- Security footer
- Audit log created

## 10. Manual Demo Testing Checklist

Before demo:

- App loads without console errors.
- Login flow works or demo access is clearly labeled.
- Dashboard shows demo data labels.
- FIR search works on sample data.
- Sensitive fields are restricted by role.
- Map/hotspot pages explain limitations.
- AI query assistant does not hallucinate.
- Reports/exports are permission checked if implemented.
- No mobile app or multi-app folder structure was created.

## Catalyst Testing Notes

Testing should cover Catalyst integration boundaries without overbuilding inactive features.

When a feature uses Catalyst, test:

1. Authentication-required routes reject unauthenticated access.
2. Role and permission checks are enforced server-side.
3. Catalyst Data Store queries return only authorized records.
4. Catalyst Functions/AppSail server logic validates inputs and handles errors.
5. API Gateway/Security Rules do not expose private endpoints unintentionally.
6. Stratus uploads/downloads enforce file type, size, retention, and access restrictions.
7. Job Scheduling jobs are idempotent and safe to retry.
8. Signals/event-driven workflows do not duplicate sensitive actions.
9. Audit logs are written for sensitive operations.
