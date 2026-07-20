# Navigation Audit

Status date: 2026-07-11

## Current State

The app shell groups routes by domain, but it still exposes nearly every implemented feature as a primary navigation item. This makes the product feel like a specification catalog rather than an operational tool.

Primary problems:

- Dashboard contains both `Dashboard` and `Dashboard Customization`.
- FIR Search and Advanced Filters are separate top-level entries even though they are one workflow.
- Analytics is split into general, domain, and legal analytics groups, creating 15+ visible analytics destinations.
- People Intelligence separates accused, victim, and repeat-offender workflows across different route names.
- Case Intelligence and Decision Support overlap with risk alerts, predictive risk, and alert notifications.
- Maps & Hotspots has separate top-level entries for views that should be modes or drilldowns.
- Demo Mode is visible as a navigation group instead of a development/admin utility.
- `/map` and `/crime-map` both exist.

## Target Top-Level Areas

Use a limited role-aware hierarchy:

| Area | Primary route | Contains |
|---|---|---|
| Overview | `/dashboard` | Role-specific summary, current work, high-priority alerts |
| Crime Records | `/fir-search` | Search, advanced filters, FIR detail, saved views |
| Map | `/crime-map` | Map, layers, hotspots, clusters, location detail |
| Intelligence | `/intelligence` or first available intelligence route | Linked cases, patterns, network graph, MO, people intelligence |
| Cases | `/cases/status-tracking` | Status tracking, priority scores, case risk alerts |
| Analytics | `/analytics` | Police station, district, time-series, category, legal/domain analytics as tabs/secondary nav |
| Reports | `/reports` | Report builder, PDF/CSV exports, generated files |
| Assistant | `/ai-query` | Natural language query, result explanation, chat history |
| Administration | `/admin/user-management` | Users, permissions, audit logs, system settings, data operations |
| Help | `/help` | Documentation and support |

## Consolidation Actions

- Redirect `/` to `/dashboard` or make `/` the dashboard consistently.
- Merge `/fir-advanced-filters` into `/fir-search` as an advanced filter panel.
- Retain `/crime-map` as canonical; redirect or remove `/map`.
- Move cluster and location intelligence to map modes/contextual panels.
- Move domain/legal analytics under `/analytics` tabs or secondary nav.
- Move dashboard customization under a settings menu, not the primary dashboard group.
- Move demo mode into Administration and hide in production unless explicitly enabled.
- Merge risk-alert and alert-notification terminology into one alert lifecycle.

