# KSP Crime Intelligence Project Overview

## 1. Project Name

`ksp-crime-intelligence`

## 2. Problem Statement

Karnataka State Police crime records can include FIR details, incidents, accused persons, victims, witnesses, police stations, districts, acts, sections, charges, case status, investigation notes, location information, and court outcomes. Existing analytical workflows are often fragmented, manual, and Excel-heavy. This makes statewide analysis, pattern discovery, case linking, repeat-offender identification, and investigator decision support slower than it needs to be.

## 3. Proposed Solution

Build a single AI-driven Crime Intelligence & Analytics Web App that helps authorized police users search FIR records, ask natural language questions, view dashboards, analyze trends, map hotspots, detect linked cases, explore criminal networks, generate reports, and manage crime datasets safely.

The system must treat all crime data as sensitive. AI-generated outputs must be explainable, grounded in available data, and clearly marked as decision support rather than final investigative or legal proof.

## 4. Target Users

- Police investigators who need record search, linked-case intelligence, and case context.
- Crime analysts who need dashboards, trends, maps, network views, and reports.
- SCRB / department officials who need aggregated statewide intelligence.
- Policymakers who need high-level and anonymized trends.
- Admin users who manage users, roles, permissions, settings, and audit logs.
- Data officers who upload, validate, clean, and import datasets.

## 5. Core Workflows

1. Authorized user logs in.
2. User lands in the authenticated app shell.
3. User views dashboard summary and alerts.
4. User searches FIRs using filters or natural language.
5. User opens permitted record details.
6. User analyzes trends by district, station, category, act, section, time, or status.
7. User explores map hotspots and location intelligence.
8. User reviews repeat offenders, linked cases, and network relationships.
9. User builds and exports reports according to role permissions.
10. Admin/data officer uploads and validates datasets.
11. Sensitive actions are audit logged.

## 6. Feature Groups

- Foundation and layout
- Authentication and role-based access
- Dashboard and summary analytics
- FIR search and detail views
- Crime analytics and trend analysis
- Map, hotspot, and geospatial intelligence
- AI natural language query and explanations
- People intelligence: accused, victims, repeat offenders
- Case linking and criminal network analysis
- Reports and exports
- Dataset upload, validation, cleaning, and import tracking
- Admin, permissions, audit logs, and settings
- Demo mode and help documentation

## 7. What the App Is

This is a single web application for KSP crime intelligence, analytics, natural language querying, and investigator decision support. It is intended to be built progressively, feature by feature, using documentation and feature specifications as the source of truth.

## 8. What the App Is Not

- It is not a mobile app.
- It is not a multi-app platform at this stage.
- It must not create `apps/web`, `apps/mobile`, or `apps/api` folders unless a future explicit decision changes the architecture.
- It is not a final legal evidence system.
- It is not an autonomous policing decision system.
- It must not present AI predictions as guaranteed outcomes.
- It must not expose sensitive FIR, victim, accused, witness, or investigation data to unauthorized users.

## 9. Hackathon / Demo Scope

The demo should focus on a safe, understandable, and well-scoped experience:

1. App shell and navigation.
2. Authentication and role-based access assumptions.
3. Dashboard overview using clearly labeled demo/sample data.
4. FIR search and detail exploration with sanitized records.
5. Crime map and hotspot preview with safe sample coordinates.
6. Natural language query assistant grounded only in available sample data.
7. Report/demo export flow if time allows.
8. Clear data sensitivity and AI limitation notices.

## 10. Long-Term Production Scope

Production can later include real KSP/SCRB dataset integration, secure ingestion pipelines, approved identity systems, fine-grained data access, audit retention, production-grade geospatial services, validated ML models, legal review, strict data governance, and operational monitoring.

## 11. Constraints

- Build only one web app.
- Implement one feature at a time.
- Create and maintain documentation first.
- Use the selected/default UI component system.
- Avoid complex placeholder UIs.
- Do not implement backend APIs until their feature is active.
- Treat crime data as sensitive.
- Keep AI explainable and bounded.
- Update the progress tracker after meaningful implementation changes.

## 12. Assumptions

- The initial app may use sample/demo data because real KSP datasets may not be available during the hackathon.
- The app will likely use TypeScript and a modern web framework if the existing project supports it.
- Authentication provider and database decisions may be finalized during implementation.
- Map/geospatial services may depend on available API keys or open-source datasets.
- Population-normalized metrics require external population data and should not be shown unless the data exists.

## 13. Success Criteria

- The project has a complete documentation system before feature implementation.
- All 60 feature specifications exist and follow the required structure.
- The app remains a single web application.
- The team can implement features one at a time without ambiguity.
- Sensitive data rules are documented and consistently applied.
- AI outputs are explainable, grounded, and clearly limited.
- Demo data is clearly labeled and does not include real sensitive records.

## Catalyst-First Platform Decision

Everything that is technically feasible should be implemented using Catalyst before introducing external services or additional managed infrastructure.

This includes authentication, role management, persistent data, server-side functions, API routing, object storage for datasets and reports, scheduled jobs, event workflows, deployment/hosting, audit logs, import history, saved reports, saved queries, and alert metadata.

External services may still be used for specialized AI providers, map tiles/geocoding, document rendering libraries, or other capabilities Catalyst does not provide, but each exception must be documented before implementation.

The app remains a single web app. Catalyst usage must not create separate mobile, web, or API app folders.
