# Current System Audit

Date: 2026-07-11

## Framework And Packages

- App: Next.js App Router project under `crime-intelligence`.
- Current package versions: Next.js `14.2.5`, React `^18`, TypeScript via `tsc --noEmit`, Tailwind CSS `^3.4.1`.
- Current runtime/deployment dependency still includes `zcatalyst-sdk-node`.
- Target architecture from the migration prompt is not yet implemented: Next.js 16, Clerk, Neon PostgreSQL, Drizzle ORM, Zod, Vitest, Playwright, and Vercel are not wired as runtime architecture.

## Route Structure

- Auth and entry routes: `/`, `/home`, `/login`, `/signin`, `/signup`, `/dashboard`.
- Admin routes: `/admin-settings`, `/admin/audit-logs`, `/admin/permission-management`, `/admin/role-based-access`, `/admin/user-management`.
- AI routes: `/ai-query`, `/ai-query/explanation`, `/ai-query/history`.
- Analytics routes: `/analytics`, `/analytics/*` for district, trends, crime categories, act-section, domain analytics, and case/court analysis.
- FIR routes: `/fir-search`, `/fir-search/[id]`, `/fir-advanced-filters`.
- Map routes: `/crime-map`, `/crime-map/clusters`, `/crime-map/location-intelligence`, `/map`.
- Intelligence routes: `/intelligence/linked-cases`, `/intelligence/modus-operandi`, `/intelligence/network-graph`, `/intelligence/pattern-discovery`.
- Case and decision-support routes: `/cases/*`, `/decision-support/*`.
- Data routes: `/dataset-upload`, `/dataset-validation`, `/dataset-cleaning`, `/dataset-import-history`, `/dataset-master-data`, `/data-source-connectors`.
- API route handlers exist under `/api/*` for admin, AI, analytics, cases, datasets, decision support, help, incidents, intelligence, map, people, productivity, reports, and current user.

## Existing UI Modules

- Shared shell and navigation: `src/components/layout/AppShell.tsx`, `src/components/layout/navigation.tsx`.
- Shared UI primitives: `src/components/ui/index.tsx`.
- Feature components are split under `src/components/*`, including admin, AI, analytics, crime map, FIR, intelligence, reports, and decision-support surfaces.
- The interface is feature-rich and should be preserved during migration; the data layer behind many surfaces is the unstable area.

## Authentication Implementation

- Current browser auth is Catalyst-based through `src/lib/catalyst/client.ts`.
- Current server auth is Catalyst-based through `src/server/catalyst/auth.ts` and `src/server/catalyst/server.ts`.
- Localhost falls back to a demo user when Catalyst SDK/session is unavailable.
- Logout uses Catalyst domain assumptions in `src/app/api/logout/route.ts`.
- Clerk is not installed or configured yet.

## Catalyst-Related Files

- Root: `.catalystrc`, `catalyst.json`, `catalyst-debug.log`.
- AppSail: `crime-intelligence/app-config.json`.
- Local Catalyst folder: `crime-intelligence/.catalyst/`.
- Runtime client/server code: `src/lib/catalyst/client.ts`, `src/server/catalyst/*`.
- Function folders: `functions/ksp_crime_app_function`, `functions/database_connector_service`.
- Docs and context still reference Catalyst heavily: `docs/catalyst-*`, `context/docs/catalyst-platform-strategy.md`, database scripts, and release docs.

## Environment Variables

- Current `.env.example` now lists the target migration variables: `DATABASE_URL`, Clerk keys, `AI_API_KEY`, embedding keys, object storage keys, map style URL, and app URL.
- Legacy variables still present during migration: `NEXT_PUBLIC_CATALYST_DOMAIN`, `GEMINI_API_KEY`, `GEMINI_NLP_MODEL`.
- Current AI adapter accepts `AI_API_KEY` / `AI_MODEL` first, with `GEMINI_API_KEY` / `GEMINI_NLP_MODEL` fallback.

## Existing APIs

- Many route handlers wrap local service modules and return feature-specific DTOs.
- Admin user routes are partially server-backed through Catalyst datastore abstractions.
- Map APIs explicitly return `source: "mock"` in multiple routes.
- Incident APIs use Catalyst server abstractions.
- Several APIs accept `role` query parameters instead of deriving authorization exclusively from authenticated server state.

## Existing Database Abstractions

- Current repository layer exists under `src/server/repositories`.
- Current adapter abstraction is `src/server/catalyst/datastore.ts`.
- Current concrete adapter is Catalyst SDK based in `src/server/catalyst/server.ts`.
- No Drizzle client, Neon client, migrations, or schema modules exist yet.
- `database/schema/*.json` and `database/seeds/*.csv` describe intended Catalyst Data Store tables, not Neon/Drizzle schema.

## Mock And Static Data Sources

- Major mock sources include `src/lib/crime-map/mock-crime-data.ts`, `src/lib/fir/search.ts`, `src/lib/fir/detail.ts`, feature service `INITIAL_*` arrays, and domain-analysis `data.ts` files.
- Many service modules include artificial delays using `setTimeout`.
- Several components use browser `localStorage` for preferences, permissions, filters, and demo role overrides.
- `docs/mock-data-audit.md` contains the initial replacement inventory.

## File Upload Logic

- `src/lib/dataset-upload/service.ts` uses in-memory/global job state and simulated async progression.
- No object storage adapter is wired.
- File metadata is not yet backed by Neon.

## AI Integration

- Natural-language querying is in `src/lib/ai/natural-language-query.ts`.
- Gemini adapter is in `src/lib/ai/gemini.ts`.
- The adapter sends only prompt text and enum values, not raw FIR PII.
- If no API key is configured, current behavior falls back to deterministic local interpretation.

## Map Implementation

- Map UI is under `src/components/crime-map/*`.
- Map data uses `src/lib/crime-map/mock-crime-data.ts` and `src/lib/crime-map/service.ts`.
- MapLibre-related dependencies are installed, with SVG/provider-free fallback behavior in several components.

## Chart Implementation

- Analytics and dashboard charts are mostly custom SVG/Tailwind components.
- No central charting library is established in `package.json`.
- Recharts is not installed.

## Build And Runtime Errors

- `npm run type-check` passes after the latest changes.
- `npm run a11y:static` passes.
- Earlier `catalyst serve` failed because AppSail ran `next start` without a production `.next/BUILD_ID`; `start:appsail` guard was added.
- Catalyst CLI commands have recently emitted repeated "unexpected error" messages after login checks.

## Dead Or Duplicated Code

- Catalyst Client/Auth/AppSail/Functions are obsolete relative to the new prompt and should be archived under `archive/catalyst/` during migration.
- Current context docs still instruct Catalyst-first development and conflict with the new target architecture.
- Both Catalyst datastore schema files and app service mocks coexist; neither is the final Neon source of truth.

## Functional Status Summary

- Visually implemented but mock-backed: most analytics, FIR search/detail, maps, intelligence, reports, alerts, case status, saved queries, data cleaning, upload jobs, and demo mode.
- Partially database-connected through Catalyst abstractions: admin users/roles/audit routes and incident routes.
- Completely disconnected from final target architecture: Clerk auth, Neon/Drizzle persistence, pgvector search, object storage, and Vercel deployment.

