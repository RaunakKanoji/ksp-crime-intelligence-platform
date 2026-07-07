# Feature 011: Crime Map View

## 1. Summary
Show crimes on a map. This feature is part of the `Maps & Geospatial` group and must be implemented only when it is the active feature. It helps the KSP Crime Intelligence web app support secure, explainable, and progressive crime intelligence workflows without turning the project into a multi-app or mobile implementation.

## 2. Problem
Current crime analysis workflows can be fragmented, manual, and dependent on spreadsheet-heavy processes. Without a focused crime map view feature, users may lack a reliable way to perform this workflow with proper security, data context, permission controls, and auditability.

## 3. Users
- Investigators
- Crime analysts
- Officers
- SCRB officials

## 4. Goals
- Deliver Crime Map View in a focused, maintainable way.
- Use the project's selected/default UI components only.
- Respect role-based access and sensitive data rules.
- Support loading, empty, error, and permission-restricted states.
- Support map container.
- Support marker clustering.
- Support heatmap layer.
- Support district boundaries.

## 5. Non-Goals
- Do not implement unrelated features in the same pass.
- Do not create complex placeholder UI for inactive features.
- Do not introduce a new component library or design system.
- Do not expose sensitive data to unauthorized users.
- Do not expose exact sensitive locations unless the user has permission.

## 6. User Stories
- As an investigator, I want to use crime map view so that I can complete my crime-intelligence task without switching to manual spreadsheets.
- As a crime analyst, I want clear states and explanations so that I can understand whether data is unavailable, restricted, loading, or filtered out.
- As an admin/security reviewer, I want crime map view to respect permissions and audit requirements so that sensitive crime data remains protected.

## 7. Functional Requirements
- Provide the core workflow for crime map view exactly within the active feature scope.
- Support Map container.
- Support Marker clustering.
- Support Heatmap layer.
- Support District boundaries.
- Support Police station boundaries if data exists.
- Support Category filters.
- Support Time filters.
- Support Location detail panel.
- Support Sensitive location handling.
- Use real connected data only when the related data layer exists; otherwise use clearly labeled demo/sample data if demo mode is active.
- Handle loading, success, empty, validation-error, server-error, and permission-denied states.
- Keep implementation modular so it can be extended by later feature specs.

## 8. UI Requirements
- Use the default selected UI components for layout, cards, buttons, forms, tables, dialogs, and navigation.
- Keep the interface professional, serious, minimal, and police/intelligence-oriented.
- The page or component title should clearly read `Crime Map View`.
- Show clear labels, helper text, and safe empty states.
- Include a map container, legend, filter panel, and detail panel where applicable.
- Show fallback UI if geospatial data or map configuration is missing.
- UI should account for map container.
- UI should account for marker clustering.
- UI should account for heatmap layer.
- UI should account for district boundaries.
- UI should account for police station boundaries if data exists.

## 9. Data Requirements
- Use typed domain models and avoid unstructured `any` data.
- Record IDs should be stable and should not expose sensitive internals unnecessarily.
- All data returned to the UI must already be filtered by permission where sensitive.
- Requires incident locations, district boundaries, police station boundaries where available, precision level, category, and time fields.
- Consider data needed for map container.
- Consider data needed for marker clustering.
- Consider data needed for heatmap layer.
- Consider data needed for district boundaries.
- Consider data needed for police station boundaries if data exists.

## 10. API Requirements
- Do not implement API routes until this feature is the active implementation target.
- Document request/response types before implementation.
- Apply authentication, authorization, validation, and safe error handling server-side.
- Potential route: `GET /api/maps/incidents` or `GET /api/maps/hotspots`.
- Responses should include masked coordinates or aggregated geometries where required.

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
- Validate latitude/longitude ranges, boundary IDs, clustering radius, and date/category filters.
- Validate inputs related to map container.
- Validate inputs related to marker clustering.
- Validate inputs related to heatmap layer.

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
- Records have missing or low-confidence coordinates.
- Map provider/API key is unavailable.

## 16. Acceptance Criteria
- A user with the correct permission can access crime map view.
- A user without permission sees a safe restricted-access state.
- The feature uses only the selected/default UI component system.
- Loading, empty, error, and success states are handled.
- No unrelated features are implemented as part of this feature.
- Sensitive fields are redacted or hidden according to role permissions.
- Implementation updates the progress tracker when completed.
- The implementation supports map container.
- The implementation supports marker clustering.
- The implementation supports heatmap layer.
- The implementation supports district boundaries.
- The implementation supports police station boundaries if data exists.

## 17. Testing Notes
- Test authorized and unauthorized access.
- Test loading, empty, error, and success states.
- Test validation rules for all inputs and filters.
- Test that restricted fields are not returned from the server for unauthorized users.
- Perform a manual UI review for consistency with the selected component system.
- Test missing coordinates, map fallback, clustering, and sensitive location masking.

## 18. Dependencies
- 008-fir-search
- 002-auth-role-based-access

## 19. Implementation Notes

- Catalyst-first: Use Catalyst Data Store for incident/location data and Catalyst Functions/AppSail to return permission-filtered, location-masked map payloads. Use external map/geocoding providers only when Catalyst does not provide the needed map capability.
- Implement Crime Map View in isolation after reading this spec and the main project docs.
- Keep route/page components thin and move domain logic into feature components or service utilities.
- Do not refactor unrelated files.
- Do not create production-looking placeholder data for inactive features.
- Update this spec if implementation decisions differ from the plan.
- Update `docs/progress-tracker.md` after meaningful changes.

## 20. Status
Initial status: Not Started.
