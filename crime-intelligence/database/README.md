# Catalyst Database Artifacts

This directory contains the executable database artifact set for the first persistent cluster:

- `users`
- `user_profiles`
- `roles`
- `user_role_assignments`
- `jurisdiction_access`
- `audit_events`

The files are designed for Catalyst Data Store setup and import preparation. They do not run Catalyst imports automatically.

## Commands

Run from `crime-intelligence/`:

```sh
npm run db:validate
npm run db:schema
npm run db:commands
npm run db:check-env
```

## PostgreSQL / Neon Table Generation

The current schema source lives in `database/schema/*.json`. Generate runnable
PostgreSQL SQL from those files:

```sh
npm run db:generate:postgres
```

This writes:

- `database/generated/schema.sql`
- `database/generated/seeds.sql`

After adding `DATABASE_URL` to `.env.local` or exporting it in your shell, create
the tables:

```sh
npm run db:apply:postgres
```

Then insert the available seed/reference rows:

```sh
npm run db:seed:postgres
```

To populate the persistent Neon tables with the deterministic KSP mock records
used by the application, run:

```sh
npm run db:seed:mock:postgres
```

This command is idempotent and upserts synthetic users, districts, stations,
categories, officers, incidents, incident locations, cases, alerts, reports,
and conversation history. It uses the same seeded generator as the server-side
mock database. The current PostgreSQL artifact set does not yet have tables for
every in-memory entity such as evidence and persons; those remain part of the
mock provider until their Neon migrations are added.

The npm commands load `DATABASE_URL` from `.env.local`. Equivalent direct `psql`
commands if you have already exported `DATABASE_URL` in your shell:

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/generated/schema.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/generated/seeds.sql
```

## Import Order

1. `roles`
2. `users`
3. `user_role_assignments`
4. `jurisdiction_access`

`user_profiles` and `audit_events` have no seed files in this cluster. Audit events must be created by actual application operations.

## Production Safety

Development seed users use `@ksp.local` addresses, contain no passwords or tokens, and are marked `development_only=true`. Do not import development seed users into production unless a production owner explicitly approves a controlled demo environment.
