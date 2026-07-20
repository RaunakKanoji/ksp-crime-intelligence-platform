# Catalyst Data Store Setup

This app uses Catalyst AppSail for the Next.js application and an Advanced I/O Function for legacy FIR access. New server-controlled CRUD endpoints use `zcatalyst-sdk-node` from server-only code.

## Console Actions Required

Create the tables listed in `database/manifest.json` in Catalyst Console. For each table, add exactly the columns defined in the corresponding `database/schema/*.json` file. Mark columns with `"unique": true` as unique. Configure lookup relationships shown in each schema file's `relationships` array.

Required tables:

- `roles`
- `users`
- `user_profiles`
- `user_role_assignments`
- `jurisdiction_access`
- `audit_events`
- `districts`
- `police_stations`
- `officers`
- `crime_categories`
- `crime_incidents`
- `incident_locations`
- `case_records`
- `alerts`
- `reports`
- `saved_queries`
- `chat_sessions`
- `chat_messages`

## Required Script Environment

Set these outside source control:

```sh
export CATALYST_PROJECT_ID=...
export CATALYST_PROJECT_KEY=...
export CATALYST_PROJECT_DOMAIN=...
export CATALYST_REFRESH_TOKEN=...
export CATALYST_CLIENT_ID=...
export CATALYST_CLIENT_SECRET=...
export CATALYST_ENVIRONMENT=development
```

## Commands

```sh
npm install
npm run db:validate:files
npm run db:validate -- --environment development
npm run db:seed:development
npm run db:import -- --environment development --file ./data/incidents.csv
npm run type-check
npm run build
npm run dev
```

## CRUD Flow

- Next.js route handlers initialize Catalyst from the incoming request.
- Route handlers authenticate through Catalyst user management.
- Services validate input, enforce permissions and jurisdiction, call repositories, and write audit events.
- Repositories use `ROWID` for row updates and soft deletes.

## Debugging

- `CATALYST_TABLE_NOT_FOUND`: create the missing table in Catalyst Console.
- `CATALYST_COLUMN_NOT_FOUND`: add the exact missing column from the schema JSON.
- `AUTHENTICATION_REQUIRED`: verify Catalyst session cookies and AppSail domain configuration.
- `PERMISSION_DENIED`: verify Catalyst role mapping and application role assignment rows.

## Still Manual in Catalyst Console

- Table creation
- Column creation and column type changes
- Unique constraints
- Lookup relationships
- Data Store permissions/scopes
- OAuth client and refresh-token setup for scripts
