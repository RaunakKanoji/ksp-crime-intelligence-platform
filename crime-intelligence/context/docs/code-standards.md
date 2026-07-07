# Code Standards

## 1. File Naming Rules

- Use kebab-case for file and folder names.
- Keep feature files small and focused.
- Avoid large catch-all files.
- Use `index.ts` only when it improves imports and does not hide complexity.

## 2. Component Naming Rules

- Use PascalCase for React or UI components.
- Name components by responsibility, not visual appearance only.
- Prefer `FirSearchTable`, `CrimeSummaryCards`, `RiskAlertList`, and `MapFilterPanel` over vague names such as `DataView` or `CardSection`.

## 3. Page Naming Rules

- Route/page files should follow the framework convention.
- Page components should be simple orchestration components.
- Complex logic belongs in feature components, services, or data utilities.

## 4. Utility Naming Rules

- Use descriptive camelCase function names.
- Utilities should do one thing.
- Separate formatting, validation, permissions, and data fetching.

## 5. Type Naming Rules

- Use PascalCase for types and interfaces.
- Prefer explicit domain names: `FirRecord`, `CrimeIncident`, `PoliceStation`, `AuditLogEntry`.
- Avoid `any` unless there is a documented reason.
- Use narrow string unions for statuses, roles, categories, and severity values.

## 6. API Naming Rules

- Use plural resource names.
- Keep endpoints predictable and documented.
- Use query parameters for filtering, sorting, searching, and pagination.
- Do not create APIs before the active feature needs them.

## 7. Form Handling Rules

- Validate all user input client-side and server-side.
- Show clear validation messages.
- Preserve entered values after validation errors.
- Disable submit buttons during submission.
- Never trust client-side validation alone.

## 8. Error Handling Rules

- Use user-safe error messages in the UI.
- Log technical details server-side where appropriate.
- Avoid exposing stack traces, SQL details, API keys, or sensitive identifiers.
- Include permission-denied states where access is restricted.

## 9. Loading State Rules

- Show lightweight loading states for cards, tables, maps, and forms.
- Avoid flashy animations.
- Loading states should preserve layout stability.

## 10. Empty State Rules

- Empty states should explain why no data is visible.
- Distinguish between no data, no permission, filters too narrow, and failed loading.
- Do not invent fake data to fill empty states.

## 11. Accessibility Rules

- Use semantic HTML where possible.
- Ensure keyboard navigation for interactive elements.
- Provide visible focus states.
- Use labels for inputs and controls.
- Ensure sufficient contrast.
- Do not rely on color alone for severity/status.

## 12. Security Rules

- Apply authorization on the server for sensitive data.
- Audit sensitive actions.
- Redact PII in restricted views and exports.
- Sanitize uploaded files and user-generated text.
- Treat AI prompts and responses as untrusted data.

## 13. Commenting Rules

- Prefer self-explanatory code.
- Add comments for domain-specific rules, security constraints, permission decisions, and non-obvious logic.
- Do not leave stale TODOs without owner/context.

## 14. Testing Rules

- Unit test permissions, validators, formatters, query builders, and scoring logic.
- Component test critical forms, tables, filters, and error states.
- Integration test APIs and server actions.
- Manually test role restrictions and export behavior.

## 15. Git Commit Guidelines

- Make small, focused commits.
- Mention feature ID where possible.
- Avoid mixing unrelated refactors with feature implementation.
- Update docs and tracker in the same change when implementation changes behavior.

## Catalyst Code Standards

1. Keep all Catalyst SDK initialization in `lib/catalyst/`.
2. Do not initialize Catalyst clients directly inside UI components.
3. Use service functions such as `getFirById`, `searchFirs`, `createAuditLog`, and `uploadDatasetFile` that internally call Catalyst wrappers.
4. Keep Catalyst table names, bucket names, and function names centralized.
5. Never expose server-only Catalyst credentials in client code.
6. Prefer typed request/response DTOs for Catalyst Functions and API Gateway endpoints.
7. Keep AI provider calls, export generation, dataset validation, and sensitive analytics in server-side Catalyst logic.
8. Add comments only where Catalyst-specific behavior is non-obvious.
