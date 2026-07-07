# Feature 039: Data Import History

## 1. Summary
Track dataset import jobs. This feature is part of the `Data Operations` group and must be implemented only when it is the active feature. It helps the KSP Crime Intelligence web app support secure, explainable, and progressive crime intelligence workflows without turning the project into a multi-app or mobile implementation.

## 2. Problem
Current crime analysis workflows can be fragmented, manual, and dependent on spreadsheet-heavy processes. Without a focused data import history feature, users may lack a reliable way to perform this workflow with proper security, data context, permission controls, and auditability.

## 3. Users
- Data officers
- Admin users
- Crime analysts

## 4. Goals
- Deliver Data Import History in a focused, maintainable way.
- Use the project's selected/default UI components only.
- Respect role-based access and sensitive data rules.
- Support loading, empty, error, and permission-restricted states.
- Support file name.
- Support uploaded by.
- Support upload date.
- Support records processed.

## 5. Non-Goals
- Do not implement unrelated features in the same pass.
- Do not create complex placeholder UI for inactive features.
- Do not introduce a new component library or design system.
- Do not expose sensitive data to unauthorized users.

## 6. User Stories
- As a data officer, I want to use data import history so that I can complete my crime-intelligence task without switching to manual spreadsheets.
- As an admin user, I want clear states and explanations so that I can understand whether data is unavailable, restricted, loading, or filtered out.
- As an admin/security reviewer, I want data import history to respect permissions and audit requirements so that sensitive crime data remains protected.

## 7. Functional Requirements
- Provide the core workflow for data import history exactly within the active feature scope.
- Support File name.
- Support Uploaded by.
- Support Upload date.
- Support Records processed.
- Support Records failed.
- Support Validation result.
- Support Import status.
- Support Error download.
- Use real connected data only when the related data layer exists; otherwise use clearly labeled demo/sample data if demo mode is active.
- Handle loading, success, empty, validation-error, server-error, and permission-denied states.
- Keep implementation modular so it can be extended by later feature specs.
- Never import data until validation is complete and the user confirms the import step where required.

## 8. UI Requirements
- Use the default selected UI components for layout, cards, buttons, forms, tables, dialogs, and navigation.
- Keep the interface professional, serious, minimal, and police/intelligence-oriented.
- The page or component title should clearly read `Data Import History`.
- Show clear labels, helper text, and safe empty states.
- Use tables for management views and confirmation dialogs for sensitive changes.
- Show audit/security notices where appropriate.
- UI should account for file name.
- UI should account for uploaded by.
- UI should account for upload date.
- UI should account for records processed.
- UI should account for records failed.

## 9. Data Requirements
- Use typed domain models and avoid unstructured `any` data.
- Record IDs should be stable and should not expose sensitive internals unnecessarily.
- All data returned to the UI must already be filtered by permission where sensitive.
- Requires Uploaded Dataset, validation result, import job, normalized reference data, and error report records.
- Consider data needed for file name.
- Consider data needed for uploaded by.
- Consider data needed for upload date.
- Consider data needed for records processed.
- Consider data needed for records failed.

## 10. API Requirements
- Do not implement API routes until this feature is the active implementation target.
- Document request/response types before implementation.
- Apply authentication, authorization, validation, and safe error handling server-side.
- Potential routes: `POST /api/datasets/upload`, `POST /api/datasets/validate`, `POST /api/datasets/import`.
- Upload routes must validate file type, size, schema, and user permissions.

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
- Validate uploaded file type, size, required columns, data types, duplicate keys, and schema mapping.
- Validate inputs related to file name.
- Validate inputs related to uploaded by.
- Validate inputs related to upload date.

## 13. Security and Access Control
- Require authenticated access unless explicitly documented otherwise.
- Apply role-based permissions server-side.
- Redact or hide restricted fields based on user role.
- Log sensitive views or mutations where required.
- Do not expose raw sensitive data in client-side bundles, logs, URLs, or error messages.
- Dataset uploads must be restricted, validated, and securely stored.

## 14. AI Behavior
- Not applicable.

## 15. Edge Cases
- User is authenticated but lacks permission.
- No records match active filters.
- Data exists but contains missing or inconsistent fields.
- Network/server request fails.
- Demo mode is enabled and data must be clearly labeled.
- Uploaded file has mixed encodings, duplicate rows, or invalid schema.

## 16. Acceptance Criteria
- A user with the correct permission can access data import history.
- A user without permission sees a safe restricted-access state.
- The feature uses only the selected/default UI component system.
- Loading, empty, error, and success states are handled.
- No unrelated features are implemented as part of this feature.
- Sensitive fields are redacted or hidden according to role permissions.
- Implementation updates the progress tracker when completed.
- The implementation supports file name.
- The implementation supports uploaded by.
- The implementation supports upload date.
- The implementation supports records processed.
- The implementation supports records failed.
- Relevant sensitive actions create an audit log or document a pending audit integration if audit feature is not yet active.

## 17. Testing Notes
- Test authorized and unauthorized access.
- Test loading, empty, error, and success states.
- Test validation rules for all inputs and filters.
- Test that restricted fields are not returned from the server for unauthorized users.
- Perform a manual UI review for consistency with the selected component system.
- Test invalid files, schema mismatch, duplicate records, and validation report output.

## 18. Dependencies
- 036-dataset-upload
- 037-dataset-validation

## 19. Implementation Notes

- Catalyst-first: Store import history in Catalyst Data Store. Store downloadable error files or validation reports in Catalyst Stratus.
- Implement Data Import History in isolation after reading this spec and the main project docs.
- Keep route/page components thin and move domain logic into feature components or service utilities.
- Do not refactor unrelated files.
- Do not create production-looking placeholder data for inactive features.
- Update this spec if implementation decisions differ from the plan.
- Update `docs/progress-tracker.md` after meaningful changes.
- Keep raw upload handling separate from validation, cleaning, and import commits.

## 20. Status
Initial status: Not Started.
