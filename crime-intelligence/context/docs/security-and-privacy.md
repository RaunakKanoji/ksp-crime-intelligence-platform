# Security and Privacy

## 1. Sensitive Data Handling

The application must treat FIR, victim, accused, witness, investigation, evidence, location, and legal outcome data as sensitive. Access must be granted only according to role, permission, operational need, and data sensitivity.

## 2. Role-Based Access

Role-based access must be enforced on private routes, server actions, API routes, record-level views, exports, dataset imports, admin screens, and AI query workflows.

Default roles:

- Admin
- Investigator
- Analyst
- Officer
- Viewer

## 3. Audit Logging

Audit logs are required for sensitive actions:

- Login and logout
- FIR detail view
- Victim profile view
- Accused profile view where required
- Witness or investigation note access
- AI query execution
- Dataset upload/import
- Export generation
- User role changes
- Watchlist changes
- Report generation

## 4. Data Minimization

Only show fields required for the user's role and task. Prefer aggregated analytics for broad users. Hide or redact identity fields unless explicitly permitted.

## 5. PII Protection

PII includes names, addresses, phone numbers, IDs, exact victim/witness locations, investigation notes, and sensitive legal details. PII should be redacted in restricted views and exports.

## 6. Secure Exports

Exports must apply permission checks, field redaction, user/timestamp metadata, file naming rules, and audit logging. PDF exports should include a security footer. CSV exports should avoid restricted columns unless permitted.

## 7. Access Restrictions

The application must not expose sensitive FIR, victim, accused, witness, or investigation data to unauthorized users. Restricted data must be protected server-side and not merely hidden in the UI.

## 8. AI Safety Rules

- AI must only use authorized data.
- AI must not hallucinate crime records.
- AI must cite or reference data sources where possible.
- AI must show limitations and confidence notes.
- AI must not be treated as final evidence.
- AI must not make autonomous policing decisions.

## 9. Prompt Injection Protection

Treat user prompts, uploaded text, FIR narratives, and external data as untrusted input. AI services must ignore instructions embedded in records or uploads that try to override system rules, reveal secrets, bypass permissions, or alter security behavior.

## 10. Secure File Uploads

- Validate file type and size.
- Scan or reject unsafe files where supported.
- Validate schema before import.
- Store files securely.
- Restrict raw file access.
- Log upload and import actions.
- Provide validation reports without exposing unnecessary PII.

## 11. Demo Data Rules

Demo data must be clearly labeled. It must not contain real FIRs, victim identities, accused identities, witness identities, or investigation details. Sample locations should be generalized if needed.

## 12. Production Data Rules

Production data requires approved data access, secure infrastructure, encryption, backups, logging, retention policy, least-privilege access, and legal/department review before use.

## Catalyst Security Implementation Notes

Use Catalyst Authentication and Catalyst Roles as the platform foundation for access control.

Security rules:

1. Catalyst roles must map to application roles but must not be the only layer of security.
2. Every sensitive server route/function must also enforce app-level permission checks.
3. Catalyst Data Store table scopes and permissions should be configured where appropriate.
4. Sensitive views such as FIR details, victim profiles, accused profiles, investigation notes, exports, AI queries, and watchlists must write audit logs to Catalyst Data Store.
5. Uploaded datasets and generated reports should be stored in Catalyst Stratus with strict object-level access rules.
6. Avoid client-side direct access to sensitive tables unless the access scope is clearly safe.
7. AI providers must be called only from Catalyst server-side logic or another approved server-side runtime, never directly from the browser.
