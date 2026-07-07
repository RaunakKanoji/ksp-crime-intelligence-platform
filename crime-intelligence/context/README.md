# KSP Crime Intelligence Documentation Package

Generated on 2026-07-04.

This package contains the documentation foundation for the `ksp-crime-intelligence` single web app.

## Contents

- `docs/` main project context files
- `docs/features/` 60 feature specification files
- `docs/feature-index.md`
- `docs/progress-tracker.md`

## Implementation Rule

Do not implement all features at once. Read the relevant spec and implement one feature at a time.

Recommended first feature: Feature 003 — App Shell Layout.


## Catalyst-First Platform Rule

Everything that is technically feasible should be built using Catalyst before adding another managed platform. This includes auth, roles, Data Store, server functions, API routing, Stratus object storage, Job Scheduling, Signals, hosting/deployment, audit logs, import metadata, and report/export storage.

Use external services only when Catalyst does not provide the required capability, such as specialized AI models, map tiles/geocoding, or other approved integrations.

Read `docs/catalyst-platform-strategy.md` before implementing any feature.
