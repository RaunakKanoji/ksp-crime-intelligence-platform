# KSP Crime Intelligence Information Architecture

Specification 062 consolidates implemented routes into seven product areas. Primary navigation shows these areas only. Area-specific pages appear as local secondary navigation after the user enters an area.

## Product Areas

| Area | Primary route | Purpose |
| --- | --- | --- |
| Overview | `/` | Operational summary, alerts, recent activity, and common tasks. |
| Crime map | `/crime-map` | Geographic exploration, hotspots, layers, and area comparison. |
| Analytics | `/analytics` | Trends, patterns, comparisons, time analysis, and category analysis. |
| Records | `/fir-search` | Crime records, case data, search, filtering, and details. |
| Reports | `/reports` | Report generation and exports. |
| Assistant | `/ai-query` | Conversational crime intelligence, query history, prompts, and sources. |
| Administration | `/admin-settings` | Users, roles, permissions, data management, configuration, and audit activity. |
| Help | `/help` | Utility route available from the account menu when permitted. |

## Route Mapping

| Route | Area |
| --- | --- |
| `/`, `/crime-summary`, `/dashboard/customization` | Overview |
| `/crime-map`, `/crime-map/clusters`, `/crime-map/location-intelligence`, `/map` | Crime map |
| `/analytics/*`, `/intelligence/*`, `/decision-support/predictive-risk` | Analytics |
| `/fir-search`, `/fir-search/[id]`, `/fir-advanced-filters`, `/cases/*`, `/people`, `/people/repeat-offenders`, `/victims`, `/decision-support/suspect-watchlist`, `/decision-support/alert-notifications` | Records |
| `/reports` | Reports |
| `/ai-query`, `/ai-query/explanation`, `/ai-query/history`, `/productivity/saved-queries` | Assistant |
| `/admin-settings`, `/admin/*`, `/dataset-*`, `/data-source-connectors`, `/demo-mode` | Administration |
| `/help` | Help |

## Navigation Rules

- Keep only the seven areas in primary navigation.
- Keep implemented detail pages reachable through local secondary navigation and in-page links.
- Use `Crime map`, `Records`, `Reports`, and `Assistant` consistently.
- Hide navigation items when the active role lacks the route permission.
- Keep administrative navigation hidden from roles that do not have administrative or data-management access.
- Keep advanced controls behind local pages or expandable controls instead of exposing them as primary navigation.
