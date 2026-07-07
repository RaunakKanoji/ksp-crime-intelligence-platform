# Catalyst Platform Strategy

## 1. Platform Decision

The KSP Crime Intelligence & Analytics Web App must follow a Catalyst-first implementation strategy.

This means every capability that can reasonably be built using Zoho Catalyst should be planned for Catalyst before introducing external infrastructure or additional managed platforms.

The project remains a single web application. Catalyst should be used as the primary backend, hosting, serverless, data, storage, scheduling, and platform layer wherever suitable.

## 2. Catalyst-First Rule

Use Catalyst for the following whenever technically feasible:

1. Web application hosting and deployment.
2. Authentication and user account management.
3. Role management and user access classification.
4. Server-side business logic through Catalyst Functions or AppSail.
5. HTTP API routing through Catalyst API Gateway or Catalyst security rules.
6. Persistent application data through Catalyst Data Store.
7. Analytical queries through Catalyst Data Store OLAP capabilities where suitable.
8. Dataset files, generated reports, and exports through Catalyst Stratus.
9. Scheduled jobs through Catalyst Job Scheduling.
10. Event-driven workflows through Catalyst Signals where needed.
11. Push or in-app notifications through Catalyst-supported notification capabilities where suitable.
12. Audit logs, AI query logs, import logs, and report generation logs through Catalyst Data Store.

External services should only be added when Catalyst does not provide the required capability, when the feature requires a specialized third-party service, or when the user explicitly approves it.

## 3. Recommended Catalyst Component Mapping

| App Need | Preferred Catalyst Component | Notes |
|---|---|---|
| Web app hosting | Catalyst AppSail, Web Client Hosting, or Slate | Use AppSail when the app needs a Node.js server runtime or SSR-style deployment. Use Web Client Hosting/Slate when the app is a client-focused frontend build. |
| Authentication | Catalyst Authentication | Prefer Catalyst-managed login, user accounts, password reset, and supported sign-in methods. |
| Roles | Catalyst Roles + app permission matrix | Catalyst roles should map to Admin, Investigator, Analyst, Officer, and Viewer. Fine-grained feature/data permissions should still be enforced in app code. |
| API backend | Catalyst Functions or AppSail routes | Keep server logic centralized and permission-checked. |
| API entry point | Catalyst API Gateway / Security Rules | Use for routing, auth enforcement, throttling, and controlled exposure of functions/web client endpoints. |
| Primary database | Catalyst Data Store | Store FIRs, districts, police stations, users, cases, audit logs, alerts, reports, saved queries, and import metadata. |
| Analytics queries | Catalyst Data Store OLAP / ZCQL | Use for dashboard metrics, trends, district comparisons, and crime summaries where suitable. |
| File/object storage | Catalyst Stratus | Use for dataset uploads, validation reports, generated PDFs/CSVs, and secure exports. |
| Scheduled workflows | Catalyst Job Scheduling | Use for periodic hotspot refreshes, weekly summaries, demo-data resets, cleanup jobs, and alert recalculation. |
| Event workflows | Catalyst Signals | Use for upload-completed, validation-completed, alert-created, report-generated, or audit-related events if needed. |
| Notifications | Catalyst-supported push/in-app mechanisms where appropriate | Use for alert center notifications if supported by the selected deployment mode. |
| AI assistant | Catalyst Function + approved AI provider | Catalyst should host the query orchestration, permission filtering, prompt construction, response grounding, and audit logging. |
| Maps/geospatial | Catalyst Function + approved map/geospatial provider | Catalyst stores incident/location data and serves masked/authorized map payloads. Use external map tiles/geocoding only when required. |

## 4. Components to Avoid Unless Explicitly Approved

Do not introduce these by default:

1. Firebase or Supabase for auth/database/storage.
2. Clerk, Auth0, or NextAuth unless Catalyst Authentication is rejected or unsupported for the specific use case.
3. AWS S3, Google Cloud Storage, or Cloudinary for files unless Stratus is unavailable or insufficient.
4. Separate Express/Nest/FastAPI backend services outside Catalyst unless the project explicitly moves away from Catalyst.
5. A multi-app monorepo with separate `apps/web`, `apps/api`, or `apps/mobile` folders.
6. Cron libraries or external schedulers when Catalyst Job Scheduling can handle the job.

## 5. Deprecated Catalyst Components Warning

Avoid planning new work on older Catalyst File Store, Cloud Scale Cron, or Event Listeners. Use Catalyst Stratus for object storage, Catalyst Job Scheduling for scheduled jobs, and Catalyst Signals for event-driven workflows.

## 6. Single Web App Structure with Catalyst

The project must still remain a single web app. A Catalyst-oriented structure may look like this:

```txt
ksp-crime-intelligence/
  app/ or src/
  components/
  lib/
    catalyst/
    auth/
    permissions/
    data/
    ai/
    maps/
    reports/
    audit/
  catalyst/
    functions/
    appsail/              # only if AppSail is used by the existing project setup
    gateway/              # API Gateway definitions/config if exported locally
  docs/
```

Do not add separate app folders for mobile, web, or API.

## 7. Catalyst Wrapper Modules

All Catalyst-specific code should be isolated behind small wrapper modules. Avoid scattering direct SDK calls across pages and components.

Recommended wrapper files:

```txt
lib/catalyst/client.ts
lib/catalyst/server.ts
lib/catalyst/auth.ts
lib/catalyst/data-store.ts
lib/catalyst/stratus.ts
lib/catalyst/functions.ts
lib/catalyst/gateway.ts
lib/catalyst/jobs.ts
lib/catalyst/signals.ts
```

Feature code should call project-level services, and those services should call Catalyst wrappers. This keeps the app easier to test and easier to change later.

## 8. Data Store Planning

Catalyst Data Store should be the default home for persistent structured data:

1. Users and role metadata.
2. Police stations and districts.
3. FIR records and case records.
4. Accused, victim, witness, and investigation entities.
5. Crime categories, acts, and sections.
6. Dataset import jobs.
7. Audit logs.
8. AI queries and AI chat history.
9. Alerts and notification metadata.
10. Saved queries and report metadata.

Use table-level scopes and app-level permission checks together. Do not rely only on UI hiding for sensitive data protection.

## 9. AI with Catalyst

AI features should use Catalyst as the trusted orchestration layer.

The client should not directly call external AI APIs. Instead:

1. User submits a natural language query from the web app.
2. The request goes to a Catalyst Function or AppSail server route.
3. The server checks authentication and permissions.
4. The server retrieves only authorized data from Catalyst Data Store.
5. The server constructs a grounded prompt with safety instructions.
6. The server calls the approved AI provider if required.
7. The server returns structured results, explanations, warnings, and source references.
8. The query and result metadata are audit logged.

## 10. Dataset Uploads and Reports with Catalyst

Dataset upload and report export should use Catalyst-first storage and processing:

1. Upload original dataset file to Catalyst Stratus.
2. Store upload metadata in Catalyst Data Store.
3. Run validation in Catalyst Functions or AppSail server logic.
4. Store validation reports in Stratus.
5. Store validation status and row counts in Data Store.
6. Import approved rows into Data Store.
7. Generate reports through server-side logic.
8. Store generated PDFs/CSVs in Stratus.
9. Audit every upload, import, export, and download.

## 11. Scheduled and Event Workflows

Use Catalyst Job Scheduling for recurring or delayed jobs, including:

1. Hotspot score recalculation.
2. Alert generation.
3. Dataset cleanup.
4. Demo data reset.
5. Weekly summary generation.
6. Audit retention checks.
7. Report generation jobs for large exports.

Use Catalyst Signals only when event-driven decoupling is useful, such as triggering validation after upload completion or alert creation after hotspot recalculation.

## 12. Implementation Rule for AI Coding Agents

Before implementing any feature, the coding AI must check whether Catalyst can handle the required backend, data, auth, storage, scheduled, or deployment capability.

If Catalyst can handle it, use Catalyst.

If Catalyst cannot handle it, document the exception in the feature spec and `docs/current-issues.md` before adding another service.

## 13. Status

Initial status: Catalyst-first platform strategy accepted.
