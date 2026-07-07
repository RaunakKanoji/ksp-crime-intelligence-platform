# Deployment Notes

## 1. Local Development Setup

Use the existing single web app setup. Do not create separate app folders for web, mobile, or API. Follow the package manager and framework already present in the project.

Typical local flow:

```bash
npm install
npm run dev
```

Adjust commands only if the existing project uses another package manager.

## 2. Environment Variables

Potential variables to document when needed:

- `DATABASE_URL`
- Auth provider publishable key
- Auth provider secret key
- AI provider API key
- Map provider API key
- File storage bucket/configuration
- Export storage configuration
- `DEMO_MODE`

Do not require variables before the related feature is implemented.

## 3. Build Command

Typical build command:

```bash
npm run build
```

## 4. Start Command

Typical production start command:

```bash
npm run start
```

## 5. Deployment Platform Notes

Any platform may be used if it supports the selected web framework, environment variables, database connectivity, and secure HTTPS. Do not deploy real sensitive data without an approved production environment.

## 6. Database Notes

- Use migrations when database schema is introduced.
- Avoid direct production schema changes without review.
- Seed demo data separately from real data.
- Do not include secrets or real data in commits.

## 7. File Upload Notes

Dataset upload features require secure file storage, size limits, type validation, access restrictions, and retention rules.

## 8. AI API Key Notes

AI keys must be server-side only. Do not expose AI provider keys in client bundles. AI usage must follow safety and audit rules.

## 9. Map API Key Notes

Map keys should be restricted by domain where supported. Sensitive location masking must be handled by the app before rendering.

## 10. Demo Deployment Checklist

- Use demo/sample data only.
- Clearly label demo mode.
- Confirm no real FIR/victim/accused/witness data is included.
- Confirm environment variables are set.
- Confirm build passes.
- Confirm private routes are protected.
- Confirm AI warnings and data sensitivity notices are visible where relevant.

## 11. Catalyst Deployment Notes

Catalyst should be the default deployment and platform target where possible.

Recommended deployment decision:

1. Use Catalyst AppSail if the selected web framework requires a server runtime, SSR, server actions, or long-running web service behavior.
2. Use Catalyst Web Client Hosting or Slate if the app can be deployed as a client-focused/static frontend build.
3. Use Catalyst Functions for backend tasks that fit serverless function patterns.
4. Use Catalyst API Gateway or Security Rules for controlled endpoint exposure.
5. Use Catalyst Data Store for persistent app data.
6. Use Catalyst Stratus for dataset uploads and generated report/export files.
7. Use Catalyst Job Scheduling for scheduled jobs.
8. Use Catalyst Signals for event-driven workflows if needed.

Potential Catalyst-related configuration values:

- Catalyst project ID / environment configuration.
- Catalyst auth configuration.
- Catalyst Data Store table IDs or names, if required by SDK usage.
- Catalyst Stratus bucket names.
- Catalyst API Gateway configuration.
- Catalyst Function names.
- Catalyst AppSail service name, if used.
- AI provider API key stored server-side.
- Map provider API key stored server-side or domain-restricted if client-side tiles require it.

Do not commit Catalyst secrets, exported production data, real FIR files, real victim data, or real investigation records.
