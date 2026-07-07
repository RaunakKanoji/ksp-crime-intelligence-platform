# Feature 014: District Crime Comparison

## 1. Summary
Compare crime metrics across districts. This feature is part of the `Analytics` group and must be implemented only when it is the active feature. It helps the KSP Crime Intelligence web app support secure, explainable, and progressive crime intelligence workflows without turning the project into a multi-app or mobile implementation.

## 2. Problem
Current crime analysis workflows can be fragmented, manual, and dependent on spreadsheet-heavy processes. Without a focused district crime comparison feature, users may lack a reliable way to perform this workflow with proper security, data context, permission controls, and auditability.

## 3. Users
- Crime analysts
- Investigators
- SCRB officials
- Policymakers using aggregated views

## 4. Goals
- Deliver District Crime Comparison in a focused, maintainable way.
- Use the project's selected/default UI components only.
- Respect role-based access and sensitive data rules.
- Support loading, empty, error, and permission-restricted states.
- Support district ranking.
- Support crime category comparison.
- Support population-normalized metrics if population data exists.
- Support time-period comparison.

## 5. Non-Goals
- Do not implement unrelated features in the same pass.
- Do not create complex placeholder UI for inactive features.
- Do not introduce a new component library or design system.
- Do not expose sensitive data to unauthorized users.

## 6. User Stories
- As a crime analyst, I want to use district crime comparison so that I can complete my crime-intelligence task without switching to manual spreadsheets.
- As an investigator, I want clear states and explanations so that I can understand whether data is unavailable, restricted, loading, or filtered out.
- As an admin/security reviewer, I want district crime comparison to respect permissions and audit requirements so that sensitive crime data remains protected.

## 7. Functional Requirements
- Provide the core workflow for district crime comparison exactly within the active feature scope.
- Support District ranking.
- Support Crime category comparison.
- Support Population-normalized metrics if population data exists.
- Support Time-period comparison.
- Support Trend arrows.
- Support Export support in future.
- Use real connected data only when the related data layer exists; otherwise use clearly labeled demo/sample data if demo mode is active.
- Handle loading, success, empty, validation-error, server-error, and permission-denied states.
- Keep implementation modular so it can be extended by later feature specs.

## 8. UI Requirements
- Use the default selected UI components for layout, cards, buttons, forms, tables, dialogs, and navigation.
- Keep the interface professional, serious, minimal, and police/intelligence-oriented.
- The page or component title should clearly read `District Crime Comparison`.
- Show clear labels, helper text, and safe empty states.
- Use summary cards, tables, and charts only when backed by available data.
- Include filter context such as date range, district, station, and category where relevant.
- UI should account for district ranking.
- UI should account for crime category comparison.
- UI should account for population-normalized metrics if population data exists.
- UI should account for time-period comparison.
- UI should account for trend arrows.

## 9. Data Requirements
- Use typed domain models and avoid unstructured `any` data.
- Record IDs should be stable and should not expose sensitive internals unnecessarily.
- All data returned to the UI must already be filtered by permission where sensitive.
- Requires FIR, incident, location, category, district, station, status, and aggregation data as applicable.
- Consider data needed for district ranking.
- Consider data needed for crime category comparison.
- Consider data needed for population-normalized metrics if population data exists.
- Consider data needed for time-period comparison.
- Consider data needed for trend arrows.

## 10. API Requirements
- Do not implement API routes until this feature is the active implementation target.
- Document request/response types before implementation.
- Apply authentication, authorization, validation, and safe error handling server-side.
- Potential route or service function may be added for `district-crime-comparison` if required by implementation.

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
- Validate inputs related to district ranking.
- Validate inputs related to crime category comparison.
- Validate inputs related to population-normalized metrics if population data exists.

## 13. Security and Access Control
- Require authenticated access unless explicitly documented otherwise.
- Apply role-based permissions server-side.
- Redact or hide restricted fields based on user role.
- Log sensitive views or mutations where required.
- Do not expose raw sensitive data in client-side bundles, logs, URLs, or error messages.

## 14. AI Behavior
- Not applicable.

## 15. Edge Cases
- User is authenticated but lacks permission.
- No records match active filters.
- Data exists but contains missing or inconsistent fields.
- Network/server request fails.
- Demo mode is enabled and data must be clearly labeled.

## 16. Acceptance Criteria
- A user with the correct permission can access district crime comparison.
- A user without permission sees a safe restricted-access state.
- The feature uses only the selected/default UI component system.
- Loading, empty, error, and success states are handled.
- No unrelated features are implemented as part of this feature.
- Sensitive fields are redacted or hidden according to role permissions.
- Implementation updates the progress tracker when completed.
- The implementation supports district ranking.
- The implementation supports crime category comparison.
- The implementation supports population-normalized metrics if population data exists.
- The implementation supports time-period comparison.
- The implementation supports trend arrows.

## 17. Testing Notes
- Test authorized and unauthorized access.
- Test loading, empty, error, and success states.
- Test validation rules for all inputs and filters.
- Test that restricted fields are not returned from the server for unauthorized users.
- Perform a manual UI review for consistency with the selected component system.

## 18. Dependencies
- 040-master-data-management

## 19. Implementation Notes

- Catalyst-first: Use Catalyst Data Store as the default data source, Catalyst Functions/AppSail server logic for calculations, and Catalyst Data Store OLAP/ZCQL for aggregate analytics where suitable. Store sensitive access audit logs in Catalyst Data Store.
- Implement District Crime Comparison in isolation after reading this spec and the main project docs.
- Keep route/page components thin and move domain logic into feature components or service utilities.
- Do not refactor unrelated files.
- Do not create production-looking placeholder data for inactive features.
- Update this spec if implementation decisions differ from the plan.
- Update `docs/progress-tracker.md` after meaningful changes.

## 20. Status
Initial status: Not Started.
