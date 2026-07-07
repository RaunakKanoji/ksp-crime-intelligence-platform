# Feature 018: Victim Profile Summary

## 1. Summary
Show victim information only to permitted users. This feature is part of the `People Intelligence` group and must be implemented only when it is the active feature. It helps the KSP Crime Intelligence web app support secure, explainable, and progressive crime intelligence workflows without turning the project into a multi-app or mobile implementation.

## 2. Problem
Current crime analysis workflows can be fragmented, manual, and dependent on spreadsheet-heavy processes. Without a focused victim profile summary feature, users may lack a reliable way to perform this workflow with proper security, data context, permission controls, and auditability.

## 3. Users
- Investigators
- Authorized officers
- Admin users for oversight

## 4. Goals
- Deliver Victim Profile Summary in a focused, maintainable way.
- Use the project's selected/default UI components only.
- Respect role-based access and sensitive data rules.
- Support loading, empty, error, and permission-restricted states.
- Support victim identity protection.
- Support linked firs.
- Support demographic fields if available.
- Support case status.

## 5. Non-Goals
- Do not implement unrelated features in the same pass.
- Do not create complex placeholder UI for inactive features.
- Do not introduce a new component library or design system.
- Do not expose sensitive data to unauthorized users.

## 6. User Stories
- As an investigator, I want to use victim profile summary so that I can complete my crime-intelligence task without switching to manual spreadsheets.
- As an authorized officer, I want clear states and explanations so that I can understand whether data is unavailable, restricted, loading, or filtered out.
- As an admin/security reviewer, I want victim profile summary to respect permissions and audit requirements so that sensitive crime data remains protected.

## 7. Functional Requirements
- Provide the core workflow for victim profile summary exactly within the active feature scope.
- Support Victim identity protection.
- Support Linked FIRs.
- Support Demographic fields if available.
- Support Case status.
- Support Privacy warnings.
- Support Restricted access.
- Support Audit logging.
- Use real connected data only when the related data layer exists; otherwise use clearly labeled demo/sample data if demo mode is active.
- Handle loading, success, empty, validation-error, server-error, and permission-denied states.
- Keep implementation modular so it can be extended by later feature specs.

## 8. UI Requirements
- Use the default selected UI components for layout, cards, buttons, forms, tables, dialogs, and navigation.
- Keep the interface professional, serious, minimal, and police/intelligence-oriented.
- The page or component title should clearly read `Victim Profile Summary`.
- Show clear labels, helper text, and safe empty states.
- Use tables for lists and structured sections for details.
- Restricted fields must show a permission-safe redacted state rather than hidden layout glitches.
- UI should account for victim identity protection.
- UI should account for linked firs.
- UI should account for demographic fields if available.
- UI should account for case status.
- UI should account for privacy warnings.

## 9. Data Requirements
- Use typed domain models and avoid unstructured `any` data.
- Record IDs should be stable and should not expose sensitive internals unnecessarily.
- All data returned to the UI must already be filtered by permission where sensitive.
- Requires Accused/Victim person records, linked FIRs, case statuses, aliases, categories, and access flags.
- Consider data needed for victim identity protection.
- Consider data needed for linked firs.
- Consider data needed for demographic fields if available.
- Consider data needed for case status.
- Consider data needed for privacy warnings.

## 10. API Requirements
- Do not implement API routes until this feature is the active implementation target.
- Document request/response types before implementation.
- Apply authentication, authorization, validation, and safe error handling server-side.
- Potential route: `GET /api/firs` or `GET /api/firs/:id` with permission-filtered fields.
- List endpoints should support pagination, filters, sorting, and search.

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
- Validate inputs related to victim identity protection.
- Validate inputs related to linked firs.
- Validate inputs related to demographic fields if available.

## 13. Security and Access Control
- Require authenticated access unless explicitly documented otherwise.
- Apply role-based permissions server-side.
- Redact or hide restricted fields based on user role.
- Log sensitive views or mutations where required.
- Do not expose raw sensitive data in client-side bundles, logs, URLs, or error messages.
- Victim, witness, accused, and investigation details require strict permission controls.

## 14. AI Behavior
- Not applicable.

## 15. Edge Cases
- User is authenticated but lacks permission.
- No records match active filters.
- Data exists but contains missing or inconsistent fields.
- Network/server request fails.
- Demo mode is enabled and data must be clearly labeled.

## 16. Acceptance Criteria
- A user with the correct permission can access victim profile summary.
- A user without permission sees a safe restricted-access state.
- The feature uses only the selected/default UI component system.
- Loading, empty, error, and success states are handled.
- No unrelated features are implemented as part of this feature.
- Sensitive fields are redacted or hidden according to role permissions.
- Implementation updates the progress tracker when completed.
- The implementation supports victim identity protection.
- The implementation supports linked firs.
- The implementation supports demographic fields if available.
- The implementation supports case status.
- The implementation supports privacy warnings.
- Relevant sensitive actions create an audit log or document a pending audit integration if audit feature is not yet active.

## 17. Testing Notes
- Test authorized and unauthorized access.
- Test loading, empty, error, and success states.
- Test validation rules for all inputs and filters.
- Test that restricted fields are not returned from the server for unauthorized users.
- Perform a manual UI review for consistency with the selected component system.

## 18. Dependencies
- 009-fir-detail-view
- 002-auth-role-based-access
- 035-audit-logs

## 19. Implementation Notes

- Catalyst-first: Use Catalyst Data Store as the default data source, Catalyst Functions/AppSail server logic for calculations, and Catalyst Data Store OLAP/ZCQL for aggregate analytics where suitable. Store sensitive access audit logs in Catalyst Data Store.
- Implement Victim Profile Summary in isolation after reading this spec and the main project docs.
- Keep route/page components thin and move domain logic into feature components or service utilities.
- Do not refactor unrelated files.
- Do not create production-looking placeholder data for inactive features.
- Update this spec if implementation decisions differ from the plan.
- Update `docs/progress-tracker.md` after meaningful changes.

## 20. Status
Initial status: Not Started.
