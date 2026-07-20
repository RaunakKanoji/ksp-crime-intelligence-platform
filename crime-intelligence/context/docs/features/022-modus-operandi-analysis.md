# Feature 022: Modus Operandi Analysis

## 1. Summary
Analyze repeated methods used in crimes. This feature is part of the `Intelligence` group and must be implemented only when it is the active feature. It helps the KSP Crime Intelligence web app support secure, explainable, and progressive crime intelligence workflows without turning the project into a multi-app or mobile implementation.

## 2. Problem
Current crime analysis workflows can be fragmented, manual, and dependent on spreadsheet-heavy processes. Without a focused modus operandi analysis feature, users may lack a reliable way to perform this workflow with proper security, data context, permission controls, and auditability.

## 3. Users
- Investigators
- Crime analysts
- SCRB officials
- Admin users

## 4. Goals
- Deliver Modus Operandi Analysis in a focused, maintainable way.
- Use the project's selected/default UI components only.
- Respect role-based access and sensitive data rules.
- Support loading, empty, error, and permission-restricted states.
- Support mo extraction.
- Support category grouping.
- Support similarity matching.
- Support text search.

## 5. Non-Goals
- Do not implement unrelated features in the same pass.
- Do not create complex placeholder UI for inactive features.
- Do not introduce a new component library or design system.
- Do not expose sensitive data to unauthorized users.
- Do not present AI or scoring output as final legal, investigative, or operational proof.

## 6. User Stories
- As an investigator, I want to use modus operandi analysis so that I can complete my crime-intelligence task without switching to manual spreadsheets.
- As a crime analyst, I want clear states and explanations so that I can understand whether data is unavailable, restricted, loading, or filtered out.
- As an admin/security reviewer, I want modus operandi analysis to respect permissions and audit requirements so that sensitive crime data remains protected.

## 7. Functional Requirements
- Provide the core workflow for modus operandi analysis exactly within the active feature scope.
- Support MO extraction.
- Support Category grouping.
- Support Similarity matching.
- Support Text search.
- Support Linked FIRs.
- Support Repeat pattern detection.
- Support AI assistance if needed.
- Support Manual verification.
- Use real connected data only when the related data layer exists; otherwise use clearly labeled demo/sample data if demo mode is active.
- Handle loading, success, empty, validation-error, server-error, and permission-denied states.
- Keep implementation modular so it can be extended by later feature specs.
- Return explanations for generated insights, including source fields or signals used.
- Show confidence/limitations where the output involves matching, scoring, prediction, or AI interpretation.

## 8. UI Requirements
- Use the default selected UI components for layout, cards, buttons, forms, tables, dialogs, and navigation.
- Keep the interface professional, serious, minimal, and police/intelligence-oriented.
- The page or component title should clearly read `Modus Operandi Analysis`.
- Show clear labels, helper text, and safe empty states.
- UI should account for mo extraction.
- UI should account for category grouping.
- UI should account for similarity matching.
- UI should account for text search.
- UI should account for linked firs.

## 9. Data Requirements
- Use typed domain models and avoid unstructured `any` data.
- Record IDs should be stable and should not expose sensitive internals unnecessarily.
- All data returned to the UI must already be filtered by permission where sensitive.
- Requires FIR, incident, location, category, district, station, status, and aggregation data as applicable.
- Consider data needed for mo extraction.
- Consider data needed for category grouping.
- Consider data needed for similarity matching.
- Consider data needed for text search.
- Consider data needed for linked firs.

## 10. API Requirements
- Do not implement API routes until this feature is the active implementation target.
- Document request/response types before implementation.
- Apply authentication, authorization, validation, and safe error handling server-side.
- Potential route or service function may be added for `modus-operandi-analysis` if required by implementation.

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
- Validate inputs related to mo extraction.
- Validate inputs related to category grouping.
- Validate inputs related to similarity matching.

## 13. Security and Access Control
- Require authenticated access unless explicitly documented otherwise.
- Apply role-based permissions server-side.
- Redact or hide restricted fields based on user role.
- Log sensitive views or mutations where required.
- Do not expose raw sensitive data in client-side bundles, logs, URLs, or error messages.
- AI/scoring outputs must include limitations and must not be treated as final evidence.

## 14. AI Behavior
- AI or algorithmic assistance may be used only if the logic is documented and explainable.
- Show signals used, confidence level, limitations, and human-review requirement.
- Do not make deterministic claims about guilt, future crime, or final policing decisions.
- Avoid bias amplification and include caution notes for predictive or matching outputs.

## 15. Edge Cases
- User is authenticated but lacks permission.
- No records match active filters.
- Data exists but contains missing or inconsistent fields.
- Network/server request fails.
- Demo mode is enabled and data must be clearly labeled.
- AI or matching service returns low confidence.
- User asks for restricted or unsupported information.

## 16. Acceptance Criteria
- A user with the correct permission can access modus operandi analysis.
- A user without permission sees a safe restricted-access state.
- The feature uses only the selected/default UI component system.
- Loading, empty, error, and success states are handled.
- No unrelated features are implemented as part of this feature.
- Sensitive fields are redacted or hidden according to role permissions.
- Implementation updates the progress tracker when completed.
- The implementation supports mo extraction.
- The implementation supports category grouping.
- The implementation supports similarity matching.
- The implementation supports text search.
- The implementation supports linked firs.
- Generated insight includes explanation, limitation note, and human-review warning.

## 17. Testing Notes
- Test authorized and unauthorized access.
- Test loading, empty, error, and success states.
- Test validation rules for all inputs and filters.
- Test that restricted fields are not returned from the server for unauthorized users.
- Perform a manual UI review for consistency with the selected component system.
- Test hallucination prevention, restricted query refusal, explanation output, and human-review warning.

## 18. Dependencies
- 008-fir-search
- 006-natural-language-query

## 19. Implementation Notes

- Catalyst-first: Use Catalyst Functions/AppSail as the AI orchestration layer. Retrieve only permission-filtered data from Catalyst Data Store, call external AI providers only server-side if required, return grounded explanations, and audit every AI query in Catalyst Data Store.
- Implement Modus Operandi Analysis in isolation after reading this spec and the main project docs.
- Keep route/page components thin and move domain logic into feature components or service utilities.
- Do not refactor unrelated files.
- Do not create production-looking placeholder data for inactive features.
- Update this spec if implementation decisions differ from the plan.
- Update `docs/progress-tracker.md` after meaningful changes.
- Keep algorithm/AI logic explainable and separately testable.

## 20. Status
Status: Done (2026-07-09).

Implemented at `/intelligence/modus-operandi` with an authenticated, role-gated
API and typed analysis service. The current sample-data implementation uses
deterministic controlled-attribute extraction and set-overlap similarity because
an external AI provider is not needed for the available structured demo workflow.
Every pattern identifies source fields, confidence, limitations, linked FIRs, and
the manual-verification requirement. Audit persistence remains pending feature 035.
