# Database Execution Guide

Status date: 2026-07-11

This guide covers the Phase 1 Catalyst Data Store cluster for `users`, `user_profiles`, `roles`, `user_role_assignments`, `jurisdiction_access`, and `audit_events`.

## 1. Prerequisites

- Zoho Catalyst project access with permission to create Data Store tables.
- Catalyst CLI installed and authenticated.
- Existing Next.js/Catalyst application configuration.
- No API Gateway enablement in this phase.

## 2. Required Catalyst Project

Use the same Catalyst project that hosts the KSP Crime Intelligence app. Do not create a second backend project for this cluster.

## 3. Required Environment Variables

The database environment check expects:

```sh
CATALYST_PROJECT_ID
CATALYST_ENVIRONMENT
CATALYST_AUTH_DOMAIN
```

## 4. Table Creation Order

1. `roles`
2. `users`
3. `user_profiles`
4. `user_role_assignments`
5. `jurisdiction_access`
6. `audit_events`

## 5. Table and Column Checklist

Run:

```sh
npm run db:schema
```

Use the printed checklist to create every table and column in Catalyst Console. The schema files are the source of truth:

- `database/schema/roles.json`
- `database/schema/users.json`
- `database/schema/user-profiles.json`
- `database/schema/user-role-assignments.json`
- `database/schema/jurisdiction-access.json`
- `database/schema/audit-events.json`

## 6. Scope and Permission Configuration

- `roles`: reference table. Admin writes; authenticated roles may read safe labels.
- `users`: operational table. Users can read safe own profile; Admin manages.
- `user_profiles`: operational table. Users can read safe own profile; Admin manages.
- `user_role_assignments`: operational table. Admin-only read/write.
- `jurisdiction_access`: operational table. Users can read own access; Admin manages.
- `audit_events`: append-only server writes; Admin reads.

Do not expose privileged Catalyst credentials in browser code.

## 7. Index Setup

Create indexes recommended by `npm run db:schema`, prioritizing:

- `roles.name`
- `users.email`
- `users.role_id`
- `users.district_id`
- `users.station_id`
- `user_profiles.user_id`
- `user_role_assignments.assignment_key`
- `user_role_assignments.user_id`
- `jurisdiction_access.access_key`
- `jurisdiction_access.user_id`
- `audit_events.actor_id`
- `audit_events.entity_type`
- `audit_events.occurred_at`

## 8. Validation Commands

Run:

```sh
npm run db:validate
npm run db:check-env
```

`db:check-env` fails until required environment variables are configured in the shell or runtime environment.

## 9. Import Commands

Print commands with:

```sh
npm run db:commands
```

The command output is generated from `database/manifest.json`.

## 10. Import Verification

After each manually executed import, run:

```sh
catalyst ds:status import
```

Confirm row counts and failures in Catalyst Console before importing dependent tables.

## 11. Application Deployment Order

1. Validate database artifacts.
2. Create Catalyst Data Store tables.
3. Configure indexes and permissions.
4. Import `roles`.
5. Import development users only in a development environment.
6. Import development role assignments only in a development environment.
7. Import development jurisdiction access only in a development environment.
8. Configure server-side Catalyst Data Store adapter/session lookup.
9. Deploy the existing application.
10. Verify `/api/users/me`, `/api/admin/users`, and `/api/admin/audit-logs`.

## 12. Testing Procedure

Run:

```sh
npm run db:validate
npm run db:schema
npm run db:commands
npm run lint
npm run type-check
npm run build
```

Then test with a development Catalyst user assigned to `Admin`:

- Current user profile loads.
- Admin can list users.
- Admin can assign and remove a role.
- Admin can read audit events.
- Non-admin users cannot list users or read audit events.

## 13. Rollback Procedure

Do not hard-delete audit data. For rollback:

1. Disable application routes that depend on the new Data Store adapter.
2. Stop imports in progress from Catalyst Console.
3. Archive development seed users by setting `is_archived=true` and `status=inactive`.
4. Archive development role assignments and jurisdiction access rows.
5. Keep `audit_events` for traceability.

## 14. Development Seed Removal Procedure

Development users are marked with `development_only=true`. To remove them:

1. Filter `users` where `development_only=true`.
2. Archive related `user_role_assignments`.
3. Archive related `jurisdiction_access`.
4. Archive related `user_profiles`.
5. Archive the user rows.

## 15. Known Manual Catalyst Console Steps

- Create tables and columns manually or via a Catalyst-supported import workflow.
- Configure indexes.
- Configure Catalyst Authentication roles.
- Map Catalyst Auth roles to app roles.
- Configure server-side environment variables.
- Configure the server Data Store adapter/session implementation.

