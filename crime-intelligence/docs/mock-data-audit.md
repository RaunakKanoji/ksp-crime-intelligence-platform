# Mock Data Audit

Date: 2026-07-11

This is the initial inventory required before replacing mock sources. Do not delete a source until all listed consumers are migrated to Neon-backed repositories.

| File path | Export/source | Data type | Known consumers | Replacement table | Replacement repository | Replacement endpoint/server function | Migration status | Removal status |
|---|---|---|---|---|---|---|---|---|
| `src/lib/crime-map/mock-crime-data.ts` | `MOCK_CRIME_INCIDENTS` | GeoJSON incident features | crime map, property offence, district comparison, geospatial cluster, location intelligence, category breakdown, police-station analytics, trends, prediction, report builder, map APIs | `crime_incidents`, `incident_locations`, `police_stations`, `crime_categories` | `crimeIncidentRepository`, future Drizzle repositories | `/api/map/*`, analytics services | Not migrated | Keep |
| `src/lib/crime-map/mock-crime-data.ts` | `MOCK_POLICE_BOUNDARIES` | GeoJSON boundaries | crime map, geospatial cluster, map boundary API | `police_station_boundaries` | future geography repository | `/api/map/boundaries`, `/api/map/clusters` | Not migrated | Keep |
| `src/lib/crime-map/mock-crime-data.ts` | `MOCK_PATTERN_ALERTS` | pattern alert array | map API, map alert panels | `alerts`, `alert_events`, `crime_patterns` | future alert repository | `/api/map/pattern-alerts` | Not migrated | Keep |
| `src/lib/fir/search.ts` | `SAMPLE_FIR_RECORDS` | FIR search records | FIR search, advanced filters, demo mode, category breakdown, report builder | `crime_records`, `firs`, `case_parties`, `legal_sections` | future FIR repository | `/api/incidents`, FIR pages | Not migrated | Keep |
| `src/lib/fir/detail.ts` | `SAMPLE_FIR_DETAILS` | FIR detail records | FIR detail page | `crime_records`, `case_parties`, `case_sections`, `case_events` | future FIR detail repository | `/fir-search/[id]`, `/api/incidents/[id]` | Not migrated | Keep |
| `src/lib/crime-map/service.ts` | `SAMPLE_INCIDENTS`, `SAMPLE_BOUNDARIES` | local incident/boundary arrays | server map service | `crime_incidents`, `police_station_boundaries` | future map repository | `/api/map/*` | Not migrated | Keep |
| `src/lib/act-section-analysis/service.ts` | `MOCK_METRICS`, `MOCK_CASES` | aggregate metrics and drilldown cases | act-section analytics | `legal_acts`, `legal_sections`, `crime_records` | future legal analytics repository | `/api/analytics/act-section` | Not migrated | Keep |
| `src/lib/cybercrime-analysis/data.ts` | sample cybercrime records | domain records | cybercrime analytics service | `crime_records`, `cybercrime_details` | future cybercrime repository | `/api/analytics/cybercrime` | Not migrated | Keep |
| `src/lib/violent-crime-analysis/data.ts` | sample violent-crime records | domain records | violent crime analytics service | `crime_records`, `violent_crime_details` | future violent-crime repository | `/api/analytics/violent-crime` | Not migrated | Keep |
| `src/lib/drug-related-crime-analysis/data.ts` | sample drug-crime records | domain records | drug crime analytics service | `crime_records`, `drug_crime_details`, `seized_items` | future drug-crime repository | `/api/analytics/drug-crime` | Not migrated | Keep |
| `src/lib/traffic-offence-analysis/data.ts` | sample traffic records | domain records | traffic offence analytics service | `traffic_offences`, `accident_records` | future traffic repository | `/api/analytics/traffic-offence` | Not migrated | Keep |
| `src/lib/weapon-involvement-analysis/data.ts` | sample weapon records | domain records | weapon involvement analytics service | `weapons`, `crime_record_weapons` | future weapon repository | `/api/analytics/weapon-involvement` | Not migrated | Keep |
| `src/lib/women-child-safety/data.ts` | sample safety records | domain records | women/child safety analytics service | `crime_records`, `victim_profiles`, `safety_flags` | future safety repository | `/api/analytics/women-child-safety` | Not migrated | Keep |
| `src/lib/user-management/service.ts` | `INITIAL_USERS`, `INITIAL_AUDITS` | in-memory users/audits | user management fallback, demo mode | `users`, `roles`, `user_role_assignments`, `audit_events` | current Catalyst repositories, future Drizzle identity repositories | `/api/admin/users`, `/api/admin/audit-logs` | Partially Catalyst-backed, not Neon | Keep |
| `src/lib/audit-logs/service.ts` | `INITIAL_LOGS` | in-memory audit events | audit dashboards, user management fallback | `audit_events` | future audit repository | `/api/admin/audit-logs` | Partially Catalyst-backed, not Neon | Keep |
| `src/lib/alert-notification-center/service.ts` | `INITIAL_NOTIFICATIONS` | in-memory notification records | alert center | `alerts`, `notifications` | future alert repository | `/api/decision-support/alert-notifications` | Not migrated | Keep |
| `src/lib/suspect-watchlist/service.ts` | `INITIAL_ENTRIES` | in-memory watchlist | suspect watchlist | `watchlist_entries`, `persons`, `case_links` | future watchlist repository | `/api/decision-support/suspect-watchlist` | Not migrated | Keep |
| `src/lib/saved-queries/service.ts` | `INITIAL_QUERIES` | in-memory saved queries | saved queries page/API | `saved_queries`, `saved_query_runs` | future productivity repository | `/api/productivity/saved-queries` | Not migrated | Keep |
| `src/lib/ai-chat-history/service.ts` | `INITIAL_CONVERSATIONS` | in-memory conversations | AI chat history | `conversations`, `messages` | future conversation repository | `/api/ai/chat-history` | Not migrated | Keep |
| `src/lib/dataset-upload/service.ts` | `INITIAL_JOBS`, timers | in-memory upload jobs | dataset upload/import views | `dataset_jobs`, `dataset_files`, object storage metadata | future dataset repository | `/api/datasets/*` | Not migrated | Keep |
| `src/lib/dataset-cleaning/service.ts` | `INITIAL_RULES`, `INITIAL_REVIEWS` | in-memory cleaning rules/reviews | data cleaning dashboard | `cleaning_rules`, `manual_review_items` | future dataset quality repository | `/api/datasets/cleaning/*` | Not migrated | Keep |
| `src/lib/dataset-master-data/service.ts` | `INITIAL_ENTRIES` | in-memory master data | master data dashboard | geography, policing, legal, status, role tables | future master-data repositories | `/api/datasets/master-data` | Not migrated | Keep |
| `src/lib/data-source-connectors/service.ts` | `INITIAL_CONNECTORS` | in-memory connector plans | data source connectors | `data_connectors`, `connector_events` | future integration repository | `/api/datasets/connectors` | Not migrated | Keep |
| `src/lib/admin-system-settings/service.ts` | `INITIAL_GROUPS` | in-memory settings | admin settings | `system_settings` | future settings repository | `/api/admin/system-settings` | Not migrated | Keep |
| `src/lib/accused-person-profile/service.ts` | `SAMPLE_PROFILES` | sample accused profiles | accused profile page | `persons`, `aliases`, `case_parties`, `person_links` | future people repository | `/api/people/accused-profile` | Not migrated | Keep |
| `src/lib/victim-profile-summary/service.ts` | `SAMPLE_VICTIM_PROFILES` | sample victim profiles | victim profile page | `victim_profiles`, `case_parties` | future people repository | `/api/people/victim-profile` | Not migrated | Keep |
| `src/lib/bail-arrest-tracking/service.ts` | `INITIAL_RECORDS` | sample arrest/bail records | bail/arrest analytics | `arrests`, `bail_events`, `case_status_events` | future case repository | `/api/analytics/bail-arrest` | Not migrated | Keep |

## Cross-Cutting Mock Behaviors

- Artificial request delays via `setTimeout` exist in most feature services and should be removed as each service is moved to real async database calls.
- Browser `localStorage` is used for permissions, demo role override, sidebar preferences, advanced filter saves, and demo reset controls. Only harmless UI preferences should remain client-side after migration.
- Many route handlers accept a query-string `role`; production authorization should derive role from Clerk session plus Neon-backed RBAC.
- Map APIs currently return `source: "mock"` and should fail safely rather than silently substituting sample data once production mode is enabled.

