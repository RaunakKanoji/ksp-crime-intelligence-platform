# Catalyst Data Store Implementation Report

Status date: 2026-07-11

## Current deployment architecture

- Root `catalyst.json` deploys the Next.js app as Catalyst AppSail from `crime-intelligence`.
- Root `catalyst.json` also deploys `functions/ksp_crime_app_function` as a Catalyst Advanced I/O Function.
- The app uses the Next.js App Router under `src/app`.
- There is no Pages Router application surface.

## Existing Catalyst integration

- Browser authentication lives in `src/lib/catalyst/client.ts`.
- The Advanced I/O function already uses `zcatalyst-sdk-node` with `catalyst.initialize(req)` for the `FIRs` table.
- AppSail server code has partial repository abstractions in `src/server/repositories` and `src/server/catalyst/datastore.ts`, but no concrete Catalyst SDK adapter was wired before this integration.

## Missing database modules

- Operational Data Store modules were missing for districts, police stations, officers, crime categories, crime incidents, case records, locations, alerts, reports, saved queries, chat sessions, and chat messages.
- Schema validation existed only for local manifest files, not for live Catalyst Data Store schema inspection.
- Seed/import scripts existed only as command printers and local artifact validators.

## Mock data requiring replacement

The following modules still use typed sample data and should be migrated feature by feature after Catalyst tables are created:

- `src/lib/dashboard/service.ts`
- `src/lib/crime-map/mock-crime-data.ts`
- `src/lib/crime-map/map-api.ts`
- `src/lib/fir/search.ts`
- `src/lib/fir/detail.ts`
- `src/lib/fir/advanced-filters.ts`
- Analytics and intelligence services importing `MOCK_CRIME_INCIDENTS`
- Demo and AI services that explicitly state Catalyst persistence is pending

## Required environment configuration

- `CATALYST_PROJECT_ID`
- `CATALYST_ENVIRONMENT`
- `CATALYST_AUTH_DOMAIN`
- Catalyst AppSail runtime request context or Catalyst credentials supported by `zcatalyst-sdk-node`

## Risks and conflicts

- Replacing all existing mock-backed feature modules in one change would break pages until all Catalyst tables and seed data exist.
- Several existing routes still trust `role` query parameters. New CRUD endpoints must not follow that pattern.
- The Advanced I/O function has its own FIR table integration and should be migrated separately to shared repository conventions.
- Catalyst Console schema creation remains manual; scripts validate and report missing schema but do not create tables.
