# Feature 052: Suspect Watchlist

## 1. Summary
Allow authorized users to maintain a watchlist. This feature is part of the `Decision Support` group and must be implemented only when it is the active feature. It helps the KSP Crime Intelligence web app support secure, explainable, and progressive crime intelligence workflows without turning the project into a multi-app or mobile implementation.

## 2. Problem
Current crime analysis workflows can be fragmented, manual, and dependent on spreadsheet-heavy processes. Without a focused suspect watchlist feature, users may lack a reliable way to perform this workflow with proper security, data context, permission controls, and auditability.

## 3. Users
- Investigators
- Crime analysts
- SCRB officials
- Admin users

## 4. Goals
- Deliver Suspect Watchlist in a focused, maintainable way.
- Use the project's selected/default UI components only.
- Respect role-based access and sensitive data rules.
- Support loading, empty, error, and permission-restricted states.
- Support add suspect.
- Support remove suspect.
- Support reason for watchlist.
- Support linked firs.

## 5. Non-Goals
- Do not implement unrelated features in the same pass.
- Do not create complex placeholder UI for inactive features.
- Do not introduce a new component library or design system.
- Do not expose sensitive data to unauthorized users.
- Do not present AI or scoring output as final legal, investigative, or operational proof.

## 6. User Stories
- As an investigator, I want to use suspect watchlist so that I can complete my crime-intelligence task without switching to manual spreadsheets.
- As a crime analyst, I want clear states and explanations so that I can understand whether data is unavailable, restricted, loading, or filtered out.
- As an admin/security reviewer, I want suspect watchlist to respect permissions and audit requirements so that sensitive crime data remains protected.

## 7. Functional Requirements
- Provide the core workflow for suspect watchlist exactly within the active feature scope.
- Support Add suspect.
- Support Remove suspect.
- Support Reason for watchlist.
- Support Linked FIRs.
- Support Review date.
- Support Permission control.
- Support Audit log.
- Support Avoid misuse warning.
- Use real connected data only when the related data layer exists; otherwise use clearly labeled demo/sample data if demo mode is active.
- Handle loading, success, empty, validation-error, server-error, and permission-denied states.
- Keep implementation modular so it can be extended by later feature specs.
- Return explanations for generated insights, including source fields or signals used.
- Show confidence/limitations where the output involves matching, scoring, prediction, or AI interpretation.

## 8. UI Requirements
- Use the default selected UI components for layout, cards, buttons, forms, tables, dialogs, and navigation.
- Keep the interface professional, serious, minimal, and police/intelligence-oriented.
- The page or component title should clearly read `Suspect Watchlist`.
- Show clear labels, helper text, and safe empty states.
- UI should account for add suspect.
- UI should account for remove suspect.
- UI should account for reason for watchlist.
- UI should account for linked firs.
- UI should account for review date.

## 9. Data Requirements
- Use typed domain models and avoid unstructured `any` data.
- Record IDs should be stable and should not expose sensitive internals unnecessarily.
- All data returned to the UI must already be filtered by permission where sensitive.
- Requires FIR, incident, location, category, district, station, status, and aggregation data as applicable.
- Consider data needed for add suspect.
- Consider data needed for remove suspect.
- Consider data needed for reason for watchlist.
- Consider data needed for linked firs.
- Consider data needed for review date.

## 10. API Requirements
- Do not implement API routes until this feature is the active implementation target.
- Document request/response types before implementation.
- Apply authentication, authorization, validation, and safe error handling server-side.
- Potential route or service function may be added for `suspect-watchlist` if required by implementation.

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
- Validate inputs related to add suspect.
- Validate inputs related to remove suspect.
- Validate inputs related to reason for watchlist.

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
- A user with the correct permission can access suspect watchlist.
- A user without permission sees a safe restricted-access state.
- The feature uses only the selected/default UI component system.
- Loading, empty, error, and success states are handled.
- No unrelated features are implemented as part of this feature.
- Sensitive fields are redacted or hidden according to role permissions.
- Implementation updates the progress tracker when completed.
- The implementation supports add suspect.
- The implementation supports remove suspect.
- The implementation supports reason for watchlist.
- The implementation supports linked firs.
- The implementation supports review date.
- Generated insight includes explanation, limitation note, and human-review warning.

## 17. Testing Notes
- Test authorized and unauthorized access.
- Test loading, empty, error, and success states.
- Test validation rules for all inputs and filters.
- Test that restricted fields are not returned from the server for unauthorized users.
- Perform a manual UI review for consistency with the selected component system.
- Test hallucination prevention, restricted query refusal, explanation output, and human-review warning.

## 18. Dependencies
- 017-accused-person-profile
- 035-audit-logs

## 19. Implementation Notes

- Catalyst-first: Store watchlist records and review metadata in Catalyst Data Store. Every add/remove/update must create a Catalyst-backed audit log.
- Implement Suspect Watchlist in isolation after reading this spec and the main project docs.
- Keep route/page components thin and move domain logic into feature components or service utilities.
- Do not refactor unrelated files.
- Do not create production-looking placeholder data for inactive features.
- Update this spec if implementation decisions differ from the plan.
- Update `docs/progress-tracker.md` after meaningful changes.
- Keep algorithm/AI logic explainable and separately testable.

## 20. Status
Initial status: Not Started.
