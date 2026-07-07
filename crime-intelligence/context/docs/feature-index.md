# Feature Index

This index lists all feature specifications for the KSP Crime Intelligence single web app. All statuses start as `Not Started`.

| Feature ID | Feature name | File path | Category | Priority | Dependencies | Implementation phase | Status |
|---|---|---|---|---|---|---|---|
| 001 | Auth Login | `docs/features/001-auth-login.md` | Access & Identity | High | None | Phase 2 | Not Started |
| 002 | Role-Based Access | `docs/features/002-auth-role-based-access.md` | Access & Identity | High | 001-auth-login | Phase 2 | Not Started |
| 003 | App Shell Layout | `docs/features/003-app-shell-layout.md` | Foundation | High | None | Phase 1 | Not Started |
| 004 | Dashboard Overview | `docs/features/004-dashboard-overview.md` | Dashboard | High | 003-app-shell-layout | Phase 3 | Not Started |
| 005 | Crime Summary Cards | `docs/features/005-crime-summary-cards.md` | Dashboard | High | 004-dashboard-overview | Phase 3 | Not Started |
| 006 | Natural Language Query | `docs/features/006-natural-language-query.md` | AI Querying | High | 001-auth-login, 002-auth-role-based-access, 008-fir-search, 035-audit-logs | Phase 7 | Not Started |
| 007 | AI Query Result Explanation | `docs/features/007-ai-query-result-explanation.md` | AI Querying | High | 006-natural-language-query | Phase 7 | Not Started |
| 008 | FIR Search | `docs/features/008-fir-search.md` | FIR Records | High | 001-auth-login, 002-auth-role-based-access | Phase 4 | Not Started |
| 009 | FIR Detail View | `docs/features/009-fir-detail-view.md` | FIR Records | High | 008-fir-search, 002-auth-role-based-access, 035-audit-logs | Phase 4 | Not Started |
| 010 | FIR Advanced Filters | `docs/features/010-fir-advanced-filters.md` | FIR Records | Medium | 008-fir-search, 054-saved-queries | Phase 4 | Not Started |
| 011 | Crime Map View | `docs/features/011-crime-map-view.md` | Maps & Geospatial | High | 008-fir-search, 002-auth-role-based-access | Phase 6 | Not Started |
| 012 | Hotspot Detection | `docs/features/012-hotspot-detection.md` | Maps & Geospatial | High | 011-crime-map-view, 026-geospatial-cluster-analysis | Phase 6 | Not Started |
| 013 | Police Station Analytics | `docs/features/013-police-station-analytics.md` | Analytics | Medium | 008-fir-search, 040-master-data-management | Phase 5 | Not Started |
| 014 | District Crime Comparison | `docs/features/014-district-crime-comparison.md` | Analytics | Medium | 040-master-data-management | Phase 5 | Not Started |
| 015 | Time-Series Crime Trends | `docs/features/015-time-series-crime-trends.md` | Analytics | Medium | 008-fir-search | Phase 5 | Not Started |
| 016 | Crime Category Breakdown | `docs/features/016-crime-category-breakdown.md` | Analytics | Medium | 008-fir-search | Phase 5 | Not Started |
| 017 | Accused Person Profile | `docs/features/017-accused-person-profile.md` | People Intelligence | High | 008-fir-search, 009-fir-detail-view, 002-auth-role-based-access | Phase 5 | Not Started |
| 018 | Victim Profile Summary | `docs/features/018-victim-profile-summary.md` | People Intelligence | High | 009-fir-detail-view, 002-auth-role-based-access, 035-audit-logs | Phase 5 | Not Started |
| 019 | Repeat Offender Detection | `docs/features/019-repeat-offender-detection.md` | Intelligence | High | 017-accused-person-profile, 020-linked-case-detection | Phase 5 | Not Started |
| 020 | Linked Case Detection | `docs/features/020-linked-case-detection.md` | Intelligence | High | 008-fir-search, 022-modus-operandi-analysis | Phase 5 | Not Started |
| 021 | Criminal Network Graph | `docs/features/021-criminal-network-graph.md` | Network Intelligence | Medium | 017-accused-person-profile, 019-repeat-offender-detection, 020-linked-case-detection | Phase 5 | Not Started |
| 022 | Modus Operandi Analysis | `docs/features/022-modus-operandi-analysis.md` | Intelligence | Medium | 008-fir-search, 006-natural-language-query | Phase 5 | Not Started |
| 023 | Case Status Tracking | `docs/features/023-case-status-tracking.md` | Case Management | Medium | 009-fir-detail-view | Phase 5 | Not Started |
| 024 | Investigation Priority Score | `docs/features/024-investigation-priority-score.md` | Decision Support | Medium | 023-case-status-tracking, 012-hotspot-detection, 019-repeat-offender-detection | Phase 5 | Not Started |
| 025 | Risk Alerts | `docs/features/025-risk-alerts.md` | Decision Support | Medium | 012-hotspot-detection, 019-repeat-offender-detection, 024-investigation-priority-score | Phase 5 | Not Started |
| 026 | Geospatial Cluster Analysis | `docs/features/026-geospatial-cluster-analysis.md` | Maps & Geospatial | Medium | 011-crime-map-view | Phase 6 | Not Started |
| 027 | Location Detail Intelligence | `docs/features/027-location-detail-intelligence.md` | Maps & Geospatial | Medium | 011-crime-map-view, 012-hotspot-detection | Phase 6 | Not Started |
| 028 | Crime Pattern Discovery | `docs/features/028-crime-pattern-discovery.md` | Intelligence | Medium | 015-time-series-crime-trends, 012-hotspot-detection, 022-modus-operandi-analysis | Phase 5 | Not Started |
| 029 | Predictive Crime Risk | `docs/features/029-predictive-crime-risk.md` | Decision Support | Low | 012-hotspot-detection, 028-crime-pattern-discovery | Phase 6 | Not Started |
| 030 | Report Builder | `docs/features/030-report-builder.md` | Reports & Export | Medium | 004-dashboard-overview, 008-fir-search | Phase 8 | Not Started |
| 031 | Report Export PDF | `docs/features/031-report-export-pdf.md` | Reports & Export | Medium | 030-report-builder, 002-auth-role-based-access, 035-audit-logs | Phase 8 | Not Started |
| 032 | Report Export CSV | `docs/features/032-report-export-csv.md` | Reports & Export | Medium | 008-fir-search, 002-auth-role-based-access, 035-audit-logs | Phase 8 | Not Started |
| 033 | User Management | `docs/features/033-user-management.md` | Admin | Medium | 001-auth-login, 002-auth-role-based-access, 035-audit-logs | Phase 9 | Not Started |
| 034 | Permission Management | `docs/features/034-permission-management.md` | Admin | Medium | 002-auth-role-based-access, 033-user-management | Phase 9 | Not Started |
| 035 | Audit Logs | `docs/features/035-audit-logs.md` | Security & Audit | High | 001-auth-login, 002-auth-role-based-access | Phase 9 | Not Started |
| 036 | Dataset Upload | `docs/features/036-dataset-upload.md` | Data Operations | High | 002-auth-role-based-access, 037-dataset-validation | Phase 9 | Not Started |
| 037 | Dataset Validation | `docs/features/037-dataset-validation.md` | Data Operations | High | 036-dataset-upload | Phase 9 | Not Started |
| 038 | Data Cleaning Rules | `docs/features/038-data-cleaning-rules.md` | Data Operations | Medium | 037-dataset-validation, 040-master-data-management | Phase 9 | Not Started |
| 039 | Data Import History | `docs/features/039-data-import-history.md` | Data Operations | Medium | 036-dataset-upload, 037-dataset-validation | Phase 9 | Not Started |
| 040 | Master Data Management | `docs/features/040-master-data-management.md` | Data Operations | Medium | 002-auth-role-based-access | Phase 9 | Not Started |
| 041 | Act Section Analysis | `docs/features/041-act-section-analysis.md` | Legal Analytics | Medium | 008-fir-search, 040-master-data-management | Phase 5 | Not Started |
| 042 | Charge Sheet Analysis | `docs/features/042-charge-sheet-analysis.md` | Legal Analytics | Medium | 023-case-status-tracking | Phase 5 | Not Started |
| 043 | Court Disposal Analysis | `docs/features/043-court-disposal-analysis.md` | Legal Analytics | Low | 023-case-status-tracking | Phase 5 | Not Started |
| 044 | Bail and Arrest Tracking | `docs/features/044-bail-and-arrest-tracking.md` | Legal Analytics | Medium | 017-accused-person-profile, 023-case-status-tracking | Phase 5 | Not Started |
| 045 | Property Offence Analysis | `docs/features/045-property-offence-analysis.md` | Domain Analytics | Medium | 008-fir-search, 011-crime-map-view, 019-repeat-offender-detection | Phase 5 | Not Started |
| 046 | Violent Crime Analysis | `docs/features/046-violent-crime-analysis.md` | Domain Analytics | Medium | 008-fir-search, 051-weapon-involvement-analysis | Phase 5 | Not Started |
| 047 | Cybercrime Analysis | `docs/features/047-cybercrime-analysis.md` | Domain Analytics | Medium | 008-fir-search | Phase 5 | Not Started |
| 048 | Women and Child Safety Analysis | `docs/features/048-women-child-safety-analysis.md` | Domain Analytics | High | 008-fir-search, 018-victim-profile-summary | Phase 5 | Not Started |
| 049 | Traffic Offence Analysis | `docs/features/049-traffic-offence-analysis.md` | Domain Analytics | Medium | 008-fir-search, 011-crime-map-view | Phase 5 | Not Started |
| 050 | Drug Related Crime Analysis | `docs/features/050-drug-related-crime-analysis.md` | Domain Analytics | Medium | 008-fir-search, 021-criminal-network-graph | Phase 5 | Not Started |
| 051 | Weapon Involvement Analysis | `docs/features/051-weapon-involvement-analysis.md` | Domain Analytics | Medium | 008-fir-search, 046-violent-crime-analysis | Phase 5 | Not Started |
| 052 | Suspect Watchlist | `docs/features/052-suspect-watchlist.md` | Decision Support | Medium | 017-accused-person-profile, 035-audit-logs | Phase 9 | Not Started |
| 053 | Alert Notification Center | `docs/features/053-alert-notification-center.md` | Decision Support | Medium | 025-risk-alerts | Phase 9 | Not Started |
| 054 | Saved Queries | `docs/features/054-saved-queries.md` | Productivity | Low | 006-natural-language-query, 010-fir-advanced-filters | Phase 7 | Not Started |
| 055 | Dashboard Customization | `docs/features/055-dashboard-customization.md` | Dashboard | Low | 004-dashboard-overview | Phase 10 | Not Started |
| 056 | AI Chat History | `docs/features/056-ai-chat-history.md` | AI Querying | Low | 006-natural-language-query, 035-audit-logs | Phase 7 | Not Started |
| 057 | Data Source Connectors | `docs/features/057-data-source-connectors.md` | Data Operations | Low | 036-dataset-upload, 040-master-data-management | Phase 9 | Not Started |
| 058 | Admin System Settings | `docs/features/058-admin-system-settings.md` | Admin | Low | 033-user-management, 034-permission-management, 035-audit-logs | Phase 9 | Not Started |
| 059 | Help and Documentation | `docs/features/059-help-and-documentation.md` | Support | Low | 003-app-shell-layout | Phase 10 | Not Started |
| 060 | Demo Mode and Sample Data | `docs/features/060-demo-mode-and-sample-data.md` | Demo | High | None | Phase 0 | Not Started |
