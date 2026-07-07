# Feature 032: Report Export CSV

## 1. Summary
Export table data as CSV. This feature is part of the `Reports & Export` group and must be implemented only when it is the active feature. It helps the KSP Crime Intelligence web app support secure, explainable, and progressive crime intelligence workflows without turning the project into a multi-app or mobile implementation.

## 2. Problem
Current crime analysis workflows can be fragmented, manual, and dependent on spreadsheet-heavy processes. Without a focused report export csv feature, users may lack a reliable way to perform this workflow with proper security, data context, permission controls, and auditability.

## 3. Users
- Crime analysts
- SCRB officials
- Policymakers with approved access
- Admin users

## 4. Goals
- Deliver Report Export CSV in a focused, maintainable way.
- Use the project's selected/default UI components only.
- Respect role-based access and sensitive data rules.
- Support loading, empty, error, and permission-restricted states.
- Support selected dataset.
- Support active filters.
- Support permission checks.
- Support pii protection.

## 5. Non-Goals
- Do not implement unrelated features in the same pass.
- Do not create complex placeholder UI for inactive features.
- Do not introduce a new component library or design system.
- Do not expose sensitive data to unauthorized users.
- Do not export restricted fields without explicit permission checks and audit logs.

## 6. User Stories
- As a crime analyst, I want to use report export csv so that I can complete my crime-intelligence task without switching to manual spreadsheets.
- As a scrb officials, I want clear states and explanations so that I can understand whether data is unavailable, restricted, loading, or filtered out.
- As an admin/security reviewer, I want report export csv to respect permissions and audit requirements so that sensitive crime data remains protected.

## 7. Functional Requirements
- Provide the core workflow for report export csv exactly within the active feature scope.
- Support Selected dataset.
- Support Active filters.
- Support Permission checks.
- Support PII protection.
- Support File naming.
- Support Audit logging.
- Support Large export handling.
- Use real connected data only when the related data layer exists; otherwise use clearly labeled demo/sample data if demo mode is active.
- Handle loading, success, empty, validation-error, server-error, and permission-denied states.
- Keep implementation modular so it can be extended by later feature specs.
- Apply export permission checks before creating downloadable files.
- Create audit logs for export actions.

## 8. UI Requirements
- Use the default selected UI components for layout, cards, buttons, forms, tables, dialogs, and navigation.
- Keep the interface professional, serious, minimal, and police/intelligence-oriented.
- The page or component title should clearly read `Report Export CSV`.
- Show clear labels, helper text, and safe empty states.
- Use report sections, filter summaries, preview panels, and export action controls.
- UI should account for selected dataset.
- UI should account for active filters.
- UI should account for permission checks.
- UI should account for pii protection.
- UI should account for file naming.

## 9. Data Requirements
- Use typed domain models and avoid unstructured `any` data.
- Record IDs should be stable and should not expose sensitive internals unnecessarily.
- All data returned to the UI must already be filtered by permission where sensitive.
- Requires report configuration, selected filters, chart/table definitions, generated file metadata, and audit logs.
- Consider data needed for selected dataset.
- Consider data needed for active filters.
- Consider data needed for permission checks.
- Consider data needed for pii protection.
- Consider data needed for file naming.

## 10. API Requirements
- Do not implement API routes until this feature is the active implementation target.
- Document request/response types before implementation.
- Apply authentication, authorization, validation, and safe error handling server-side.
- Potential routes: `POST /api/reports`, `POST /api/reports/export/pdf`, `POST /api/reports/export/csv`.
- Export routes must check permissions and create audit logs before returning files.

## 11. State Management
- Loading: show stable skeleton or loading message without shifting layout.
- Success: show authorized data and clear context for filters or data source.
- Empty: explain whether there are no records, no matching filters, or unavailable demo data.
- Error: show safe user-facing message without stack traces or sensitive details.
- Permission denied: show a restricted-access state and avoid fetching/rendering restricted data.
- Needs review: where AI/scoring/matching is involved, show human-review requirement.

## 12. Validation Rules
- Validate all required inputs before submission.
- Validate dates and ensure date ranges are logical.
- Validate IDs and enum values against known allowed values.
- Trim search text and reject unsafe or excessively long input.
- Apply server-side validation even if client-side validation exists.
- Validate selected fields, row limits, file format, and export permission before generation.
- Validate inputs related to selected dataset.
- Validate inputs related to active filters.
- Validate inputs related to permission checks.

## 13. Security and Access Control
- Require authenticated access unless explicitly documented otherwise.
- Apply role-based permissions server-side.
- Redact or hide restricted fields based on user role.
- Log sensitive views or mutations where required.
- Do not expose raw sensitive data in client-side bundles, logs, URLs, or error messages.
- Exports must be permission-controlled, redacted where required, and audit logged.

## 14. AI Behavior
- Not applicable.

## 15. Edge Cases
- User is authenticated but lacks permission.
- No records match active filters.
- Data exists but contains missing or inconsistent fields.
- Network/server request fails.
- Demo mode is enabled and data must be clearly labeled.
- Export result is too large.
- Requested export contains restricted fields.

## 16. Acceptance Criteria
- A user with the correct permission can access report export csv.
- A user without permission sees a safe restricted-access state.
- The feature uses only the selected/default UI component system.
- Loading, empty, error, and success states are handled.
- No unrelated features are implemented as part of this feature.
- Sensitive fields are redacted or hidden according to role permissions.
- Implementation updates the progress tracker when completed.
- The implementation supports selected dataset.
- The implementation supports active filters.
- The implementation supports permission checks.
- The implementation supports pii protection.
- The implementation supports file naming.
- Relevant sensitive actions create an audit log or document a pending audit integration if audit feature is not yet active.

## 17. Testing Notes
- Test authorized and unauthorized access.
- Test loading, empty, error, and success states.
- Test validation rules for all inputs and filters.
- Test that restricted fields are not returned from the server for unauthorized users.
- Perform a manual UI review for consistency with the selected component system.
- Test export permission checks, redaction, generated metadata, and audit logging.

## 18. Dependencies
- 008-fir-search
- 002-auth-role-based-access
- 035-audit-logs

## 19. Implementation Notes

- Catalyst-first: Use Catalyst server-side logic for CSV generation, store large exports in Catalyst Stratus when needed, and write export audit logs to Catalyst Data Store.
- Implement Report Export CSV in isolation after reading this spec and the main project docs.
- Keep route/page components thin and move domain logic into feature components or service utilities.
- Do not refactor unrelated files.
- Do not create production-looking placeholder data for inactive features.
- Update this spec if implementation decisions differ from the plan.
- Update `docs/progress-tracker.md` after meaningful changes.

## 20. Status
Initial status: Not Started.
