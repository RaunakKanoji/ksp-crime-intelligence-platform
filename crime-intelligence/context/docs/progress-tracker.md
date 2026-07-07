# Progress Tracker

Last initialized: 2026-07-04

Allowed statuses: `Not Started`, `In Progress`, `Blocked`, `Done`, `Needs Review`.

| Feature ID | Feature name | Status | Priority | Dependencies | Last updated | Notes |
|---|---|---|---|---|---|---|
| 001 | Auth Login | Done | High | None | 2026-07-07 | Custom styled login iframe using absolute local CSS path, default CSS fallbacks. |
| 002 | Role-Based Access | Done | High | 001-auth-login | 2026-07-07 | Custom role mapping and interactive role simulation page at /admin/role-based-access. |
| 003 | App Shell Layout | Not Started | High | None | 2026-07-04 | Initial documentation/spec created. |
| 004 | Dashboard Overview | Not Started | High | 003-app-shell-layout | 2026-07-04 | Initial documentation/spec created. |
| 005 | Crime Summary Cards | Not Started | High | 004-dashboard-overview | 2026-07-04 | Initial documentation/spec created. |
| 006 | Natural Language Query | Not Started | High | 001-auth-login, 002-auth-role-based-access, 008-fir-search, 035-audit-logs | 2026-07-04 | Initial documentation/spec created. |
| 007 | AI Query Result Explanation | Not Started | High | 006-natural-language-query | 2026-07-04 | Initial documentation/spec created. |
| 008 | FIR Search | Not Started | High | 001-auth-login, 002-auth-role-based-access | 2026-07-04 | Initial documentation/spec created. |
| 009 | FIR Detail View | Not Started | High | 008-fir-search, 002-auth-role-based-access, 035-audit-logs | 2026-07-04 | Initial documentation/spec created. |
| 010 | FIR Advanced Filters | Not Started | Medium | 008-fir-search, 054-saved-queries | 2026-07-04 | Initial documentation/spec created. |
| 011 | Crime Map View | Not Started | High | 008-fir-search, 002-auth-role-based-access | 2026-07-04 | Initial documentation/spec created. |
| 012 | Hotspot Detection | Not Started | High | 011-crime-map-view, 026-geospatial-cluster-analysis | 2026-07-04 | Initial documentation/spec created. |
| 013 | Police Station Analytics | Not Started | Medium | 008-fir-search, 040-master-data-management | 2026-07-04 | Initial documentation/spec created. |
| 014 | District Crime Comparison | Not Started | Medium | 040-master-data-management | 2026-07-04 | Initial documentation/spec created. |
| 015 | Time-Series Crime Trends | Not Started | Medium | 008-fir-search | 2026-07-04 | Initial documentation/spec created. |
| 016 | Crime Category Breakdown | Not Started | Medium | 008-fir-search | 2026-07-04 | Initial documentation/spec created. |
| 017 | Accused Person Profile | Not Started | High | 008-fir-search, 009-fir-detail-view, 002-auth-role-based-access | 2026-07-04 | Initial documentation/spec created. |
| 018 | Victim Profile Summary | Not Started | High | 009-fir-detail-view, 002-auth-role-based-access, 035-audit-logs | 2026-07-04 | Initial documentation/spec created. |
| 019 | Repeat Offender Detection | Not Started | High | 017-accused-person-profile, 020-linked-case-detection | 2026-07-04 | Initial documentation/spec created. |
| 020 | Linked Case Detection | Not Started | High | 008-fir-search, 022-modus-operandi-analysis | 2026-07-04 | Initial documentation/spec created. |
| 021 | Criminal Network Graph | Not Started | Medium | 017-accused-person-profile, 019-repeat-offender-detection, 020-linked-case-detection | 2026-07-04 | Initial documentation/spec created. |
| 022 | Modus Operandi Analysis | Not Started | Medium | 008-fir-search, 006-natural-language-query | 2026-07-04 | Initial documentation/spec created. |
| 023 | Case Status Tracking | Not Started | Medium | 009-fir-detail-view | 2026-07-04 | Initial documentation/spec created. |
| 024 | Investigation Priority Score | Not Started | Medium | 023-case-status-tracking, 012-hotspot-detection, 019-repeat-offender-detection | 2026-07-04 | Initial documentation/spec created. |
| 025 | Risk Alerts | Not Started | Medium | 012-hotspot-detection, 019-repeat-offender-detection, 024-investigation-priority-score | 2026-07-04 | Initial documentation/spec created. |
| 026 | Geospatial Cluster Analysis | Not Started | Medium | 011-crime-map-view | 2026-07-04 | Initial documentation/spec created. |
| 027 | Location Detail Intelligence | Not Started | Medium | 011-crime-map-view, 012-hotspot-detection | 2026-07-04 | Initial documentation/spec created. |
| 028 | Crime Pattern Discovery | Not Started | Medium | 015-time-series-crime-trends, 012-hotspot-detection, 022-modus-operandi-analysis | 2026-07-04 | Initial documentation/spec created. |
| 029 | Predictive Crime Risk | Not Started | Low | 012-hotspot-detection, 028-crime-pattern-discovery | 2026-07-04 | Initial documentation/spec created. |
| 030 | Report Builder | Not Started | Medium | 004-dashboard-overview, 008-fir-search | 2026-07-04 | Initial documentation/spec created. |
| 031 | Report Export PDF | Not Started | Medium | 030-report-builder, 002-auth-role-based-access, 035-audit-logs | 2026-07-04 | Initial documentation/spec created. |
| 032 | Report Export CSV | Not Started | Medium | 008-fir-search, 002-auth-role-based-access, 035-audit-logs | 2026-07-04 | Initial documentation/spec created. |
| 033 | User Management | Not Started | Medium | 001-auth-login, 002-auth-role-based-access, 035-audit-logs | 2026-07-04 | Initial documentation/spec created. |
| 034 | Permission Management | Not Started | Medium | 002-auth-role-based-access, 033-user-management | 2026-07-04 | Initial documentation/spec created. |
| 035 | Audit Logs | Not Started | High | 001-auth-login, 002-auth-role-based-access | 2026-07-04 | Initial documentation/spec created. |
| 036 | Dataset Upload | Not Started | High | 002-auth-role-based-access, 037-dataset-validation | 2026-07-04 | Initial documentation/spec created. |
| 037 | Dataset Validation | Not Started | High | 036-dataset-upload | 2026-07-04 | Initial documentation/spec created. |
| 038 | Data Cleaning Rules | Not Started | Medium | 037-dataset-validation, 040-master-data-management | 2026-07-04 | Initial documentation/spec created. |
| 039 | Data Import History | Not Started | Medium | 036-dataset-upload, 037-dataset-validation | 2026-07-04 | Initial documentation/spec created. |
| 040 | Master Data Management | Not Started | Medium | 002-auth-role-based-access | 2026-07-04 | Initial documentation/spec created. |
| 041 | Act Section Analysis | Not Started | Medium | 008-fir-search, 040-master-data-management | 2026-07-04 | Initial documentation/spec created. |
| 042 | Charge Sheet Analysis | Not Started | Medium | 023-case-status-tracking | 2026-07-04 | Initial documentation/spec created. |
| 043 | Court Disposal Analysis | Not Started | Low | 023-case-status-tracking | 2026-07-04 | Initial documentation/spec created. |
| 044 | Bail and Arrest Tracking | Not Started | Medium | 017-accused-person-profile, 023-case-status-tracking | 2026-07-04 | Initial documentation/spec created. |
| 045 | Property Offence Analysis | Not Started | Medium | 008-fir-search, 011-crime-map-view, 019-repeat-offender-detection | 2026-07-04 | Initial documentation/spec created. |
| 046 | Violent Crime Analysis | Not Started | Medium | 008-fir-search, 051-weapon-involvement-analysis | 2026-07-04 | Initial documentation/spec created. |
| 047 | Cybercrime Analysis | Not Started | Medium | 008-fir-search | 2026-07-04 | Initial documentation/spec created. |
| 048 | Women and Child Safety Analysis | Not Started | High | 008-fir-search, 018-victim-profile-summary | 2026-07-04 | Initial documentation/spec created. |
| 049 | Traffic Offence Analysis | Not Started | Medium | 008-fir-search, 011-crime-map-view | 2026-07-04 | Initial documentation/spec created. |
| 050 | Drug Related Crime Analysis | Not Started | Medium | 008-fir-search, 021-criminal-network-graph | 2026-07-04 | Initial documentation/spec created. |
| 051 | Weapon Involvement Analysis | Not Started | Medium | 008-fir-search, 046-violent-crime-analysis | 2026-07-04 | Initial documentation/spec created. |
| 052 | Suspect Watchlist | Not Started | Medium | 017-accused-person-profile, 035-audit-logs | 2026-07-04 | Initial documentation/spec created. |
| 053 | Alert Notification Center | Not Started | Medium | 025-risk-alerts | 2026-07-04 | Initial documentation/spec created. |
| 054 | Saved Queries | Not Started | Low | 006-natural-language-query, 010-fir-advanced-filters | 2026-07-04 | Initial documentation/spec created. |
| 055 | Dashboard Customization | Not Started | Low | 004-dashboard-overview | 2026-07-04 | Initial documentation/spec created. |
| 056 | AI Chat History | Not Started | Low | 006-natural-language-query, 035-audit-logs | 2026-07-04 | Initial documentation/spec created. |
| 057 | Data Source Connectors | Not Started | Low | 036-dataset-upload, 040-master-data-management | 2026-07-04 | Initial documentation/spec created. |
| 058 | Admin System Settings | Not Started | Low | 033-user-management, 034-permission-management, 035-audit-logs | 2026-07-04 | Initial documentation/spec created. |
| 059 | Help and Documentation | Not Started | Low | 003-app-shell-layout | 2026-07-04 | Initial documentation/spec created. |
| 060 | Demo Mode and Sample Data | Not Started | High | None | 2026-07-04 | Initial documentation/spec created. |
