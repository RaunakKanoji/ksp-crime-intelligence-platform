# Feature 021: Criminal Network Graph

## 1. Summary
Visualize relationships between accused persons, FIRs, locations, and crime categories. This feature is part of the `Network Intelligence` group and must be implemented only when it is the active feature. It helps the KSP Crime Intelligence web app support secure, explainable, and progressive crime intelligence workflows without turning the project into a multi-app or mobile implementation.

## 2. Problem
Current crime analysis workflows can be fragmented, manual, and dependent on spreadsheet-heavy processes. Without a focused criminal network graph feature, users may lack a reliable way to perform this workflow with proper security, data context, permission controls, and auditability.

## 3. Users
- Investigators
- Crime analysts
- SCRB officials
- Admin users

## 4. Goals
- Deliver Criminal Network Graph in a focused, maintainable way.
- Use the project's selected/default UI components only.
- Respect role-based access and sensitive data rules.
- Support loading, empty, error, and permission-restricted states.
- Support nodes.
- Support edges.
- Support filters.
- Support relationship types.

## 5. Non-Goals
- Do not implement unrelated features in the same pass.
- Do not create complex placeholder UI for inactive features.
- Do not introduce a new component library or design system.
- Do not expose sensitive data to unauthorized users.

## 6. User Stories
- As an investigator, I want to use criminal network graph so that I can complete my crime-intelligence task without switching to manual spreadsheets.
- As a crime analyst, I want clear states and explanations so that I can understand whether data is unavailable, restricted, loading, or filtered out.
- As an admin/security reviewer, I want criminal network graph to respect permissions and audit requirements so that sensitive crime data remains protected.

## 7. Functional Requirements
- Provide the core workflow for criminal network graph exactly within the active feature scope.
- Support Nodes.
- Support Edges.
- Support Filters.
- Support Relationship types.
- Support Graph interaction.
- Support Detail panel.
- Support Access control.
- Support Performance limits.
- Use real connected data only when the related data layer exists; otherwise use clearly labeled demo/sample data if demo mode is active.
- Handle loading, success, empty, validation-error, server-error, and permission-denied states.
- Keep implementation modular so it can be extended by later feature specs.

## 8. UI Requirements
- Use the default selected UI components for layout, cards, buttons, forms, tables, dialogs, and navigation.
- Keep the interface professional, serious, minimal, and police/intelligence-oriented.
- The page or component title should clearly read `Criminal Network Graph`.
- Show clear labels, helper text, and safe empty states.
- UI should account for nodes.
- UI should account for edges.
- UI should account for filters.
- UI should account for relationship types.
- UI should account for graph interaction.

## 9. Data Requirements
- Use typed domain models and avoid unstructured `any` data.
- Record IDs should be stable and should not expose sensitive internals unnecessarily.
- All data returned to the UI must already be filtered by permission where sensitive.
- Requires FIR, incident, location, category, district, station, status, and aggregation data as applicable.
- Consider data needed for nodes.
- Consider data needed for edges.
- Consider data needed for filters.
- Consider data needed for relationship types.
- Consider data needed for graph interaction.

## 10. API Requirements
- Do not implement API routes until this feature is the active implementation target.
- Document request/response types before implementation.
- Apply authentication, authorization, validation, and safe error handling server-side.
- Potential route or service function may be added for `criminal-network-graph` if required by implementation.

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
- Validate inputs related to nodes.
- Validate inputs related to edges.
- Validate inputs related to filters.

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
- A user with the correct permission can access criminal network graph.
- A user without permission sees a safe restricted-access state.
- The feature uses only the selected/default UI component system.
- Loading, empty, error, and success states are handled.
- No unrelated features are implemented as part of this feature.
- Sensitive fields are redacted or hidden according to role permissions.
- Implementation updates the progress tracker when completed.
- The implementation supports nodes.
- The implementation supports edges.
- The implementation supports filters.
- The implementation supports relationship types.
- The implementation supports graph interaction.

## 17. Testing Notes
- Test authorized and unauthorized access.
- Test loading, empty, error, and success states.
- Test validation rules for all inputs and filters.
- Test that restricted fields are not returned from the server for unauthorized users.
- Perform a manual UI review for consistency with the selected component system.

## 18. Dependencies
- 017-accused-person-profile
- 019-repeat-offender-detection
- 020-linked-case-detection

## 19. Implementation Notes

- Catalyst-first: Use Catalyst Data Store as the default data source, Catalyst Functions/AppSail server logic for calculations, and Catalyst Data Store OLAP/ZCQL for aggregate analytics where suitable. Store sensitive access audit logs in Catalyst Data Store.
- Implement Criminal Network Graph in isolation after reading this spec and the main project docs.
- Keep route/page components thin and move domain logic into feature components or service utilities.
- Do not refactor unrelated files.
- Do not create production-looking placeholder data for inactive features.
- Update this spec if implementation decisions differ from the plan.
- Update `docs/progress-tracker.md` after meaningful changes.

## 20. Status
Initial status: Not Started.
