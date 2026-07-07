# Architecture Context

## 1. High-Level Architecture

The KSP Crime Intelligence app should use a simple single-web-app architecture. The application can include frontend pages, server-side routes/actions, data access utilities, AI service utilities, map utilities, reporting utilities, and security/audit utilities inside one app codebase.

Avoid microservices, separate mobile apps, or a multi-app monorepo unless explicitly requested later.

Recommended high-level layers:

1. UI layer: pages, layouts, components, forms, tables, filters, maps, dialogs, and navigation.
2. Application layer: feature-specific server actions, route handlers, controllers, and orchestration logic.
3. Data access layer: database queries, repositories, schema types, and query builders.
4. Service layer: AI, geospatial, reporting/export, validation, audit, and import services.
5. Security layer: authentication, authorization, permission checks, audit logging, input validation, and export controls.

## 2. Frontend Structure

Keep frontend code organized by route and feature. Use the selected/default component system for UI primitives.

Suggested structure for a single app:

```txt
app/
  (auth)/
  (app)/
  api/
components/
  app/
  dashboard/
  fir/
  analytics/
  maps/
  ai/
  reports/
  admin/
  data/
  ui/
lib/
  auth/
  permissions/
  data/
  ai/
  maps/
  reports/
  audit/
  validation/
types/
docs/
```

If the existing framework uses a different convention, follow the existing convention while preserving a single-app structure.

## 3. Backend / Server / API Structure

APIs may be implemented through the web framework's route handlers or server actions. Do not introduce a separate `apps/api` folder. Every API should be documented in the relevant feature spec before implementation.

APIs should be organized by business domain:

- `/api/firs`
- `/api/analytics`
- `/api/maps`
- `/api/ai/query`
- `/api/reports`
- `/api/datasets`
- `/api/admin`
- `/api/audit`

Do not implement APIs until the relevant feature is active.

## 4. Data Access Layer

Data access should be centralized in `lib/data/` or a similar folder. Avoid direct database calls scattered across UI components.

Recommended modules:

- `lib/data/firs.ts`
- `lib/data/users.ts`
- `lib/data/analytics.ts`
- `lib/data/locations.ts`
- `lib/data/reports.ts`
- `lib/data/audit.ts`
- `lib/data/datasets.ts`

All data access methods must apply permission and filtering rules where needed.

## 5. AI Service Layer

AI behavior should be isolated in `lib/ai/`. AI services should never query unrestricted sensitive data. They should receive already-authorized, filtered context from application services.

Recommended modules:

- `lib/ai/query-parser.ts`
- `lib/ai/query-explainer.ts`
- `lib/ai/safety-rules.ts`
- `lib/ai/prompt-templates.ts`
- `lib/ai/result-grounding.ts`

AI output must include source references, confidence/limitation notes, and a warning that the result is not final evidence.

## 6. Map / Geospatial Layer

Geospatial features should be isolated in `lib/maps/` and map UI components in `components/maps/`.

Recommended responsibilities:

- Convert incident locations to map-safe display coordinates.
- Apply sensitive location masking where required.
- Cluster markers for performance.
- Generate heatmap/hotspot overlays from authorized aggregated data.
- Explain hotspot logic and limitations.

## 7. Authentication and Authorization Layer

Authentication and authorization must be applied at route, API, feature, and data levels.

Roles:

- Admin
- Investigator
- Analyst
- Officer
- Viewer

Permission checks should live in `lib/permissions/` and should be reusable across server code and UI guards.

## 8. Reporting / Export Layer

Reports and exports should be implemented only when their features become active. Export logic should apply permission checks, PII redaction, file naming rules, audit logs, and security footers.

Suggested modules:

- `lib/reports/report-builder.ts`
- `lib/reports/pdf-export.ts`
- `lib/reports/csv-export.ts`

## 9. Logging and Audit Layer

Sensitive actions must generate audit logs, including login, FIR detail view, victim profile view, export, dataset upload, role changes, AI queries, report generation, and watchlist changes.

Audit logs should capture:

- User ID
- Role
- Action type
- Target entity type and ID
- Timestamp
- IP/device metadata if available
- Result status
- Reason/context where applicable

## 10. Deployment Context

The app should support local development and hackathon demo deployment. Environment variables should be documented before they are required.

Potential variables:

- Database URL
- Auth provider keys
- AI API key
- Map API key
- File storage configuration
- Export storage configuration
- Demo mode flag

## 11. Folder Structure

Do not create `apps/mobile`, `apps/web`, or `apps/api`. Keep the project as a single web application.

Suggested docs structure:

```txt
docs/
  project-overview.md
  architecture-context.md
  code-standards.md
  ai-workflow-rules.md
  project-implementation.md
  current-issues.md
  progress-tracker.md
  data-model-overview.md
  security-and-privacy.md
  ui-guidelines.md
  api-design.md
  testing-strategy.md
  deployment-notes.md
  feature-index.md
  features/
```

## 12. Naming Conventions

- Files: kebab-case.
- Components: PascalCase.
- Hooks: `useSomething`.
- Types: PascalCase with domain prefixes where helpful.
- Utilities: camelCase exports from kebab-case files.
- API routes: plural nouns and stable resource names.
- Feature spec files: `XXX-feature-name.md`.

## 13. Module Boundaries

- UI components should not contain database logic.
- Data utilities should not render UI.
- AI services should not bypass permission checks.
- Export services should not expose restricted fields.
- Map utilities should not expose exact sensitive locations unless permitted.
- Admin utilities should not be imported into public or unauthorized routes.

## 14. Where Future Features Should Be Added

Each feature must be implemented only after reading its feature spec. Add route files under the single app's route structure, UI components under the closest feature folder, service functions under `lib/`, types under `types/`, and tests alongside feature code or in the project's test convention.

## 15. Catalyst-First Architecture Addendum

Use Catalyst as the default platform layer wherever possible.

Preferred mapping:

- Authentication: Catalyst Authentication.
- Roles: Catalyst Roles plus the app's permission matrix.
- Backend logic: Catalyst Functions or Catalyst AppSail server routes.
- API routing: Catalyst API Gateway or Security Rules.
- Database: Catalyst Data Store and ZCQL.
- Analytics: Catalyst Data Store OLAP where suitable.
- Storage: Catalyst Stratus for uploaded datasets, validation reports, generated exports, and report files.
- Scheduling: Catalyst Job Scheduling for recurring jobs.
- Event workflows: Catalyst Signals when event-driven decoupling is useful.
- Deployment: Catalyst AppSail, Web Client Hosting, or Slate depending on the selected web framework and rendering needs.

Avoid older Catalyst File Store, Event Listeners, and Cloud Scale Cron for new work. Use Stratus, Signals, and Job Scheduling instead.

Catalyst-specific SDK calls should be isolated in `lib/catalyst/` wrappers. Feature modules should call app services, not raw Catalyst SDK clients directly.
