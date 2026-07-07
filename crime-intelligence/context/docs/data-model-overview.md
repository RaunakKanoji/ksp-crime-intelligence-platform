# Data Model Overview

This document describes conceptual entities for the KSP Crime Intelligence single web app. It is not a final database schema. Actual schema design should be implemented feature by feature.

## 1. User

**Purpose:** Authenticated person using the app.

**Key fields:** id, name, email, roleId, stationId, districtId, status, lastLoginAt

**Relationships:** User belongs to Role; may be linked to Police Station/District; creates Audit Logs, AI Queries, Saved Reports, uploads datasets.

**Sensitive data concerns:** Email and identity details must be protected; disabled users must not retain access.

**Future extension notes:** Can support SSO, MFA, department IDs, and approval workflows.

## 2. Role

**Purpose:** Defines access level and permissions.

**Key fields:** id, name, description, permissions, createdAt, updatedAt

**Relationships:** Role is assigned to Users and controls feature/data/export access.

**Sensitive data concerns:** Misconfigured roles can expose sensitive data; safe defaults are required.

**Future extension notes:** Can evolve into permission groups or attribute-based access control.

## 3. Police Station

**Purpose:** Reference entity for police station jurisdiction.

**Key fields:** id, name, code, districtId, boundary, contact, status

**Relationships:** Police Station belongs to District and links to FIRs, Users, and analytics.

**Sensitive data concerns:** Station boundaries and internal codes may be sensitive.

**Future extension notes:** Can include jurisdiction boundaries, staffing metadata, and response metrics.

## 4. District

**Purpose:** Reference entity for district-level grouping.

**Key fields:** id, name, code, state, boundary, population

**Relationships:** District has many Police Stations, FIRs, and analytics metrics.

**Sensitive data concerns:** Boundary and operational metadata should be verified before display.

**Future extension notes:** Can support population-normalized crime rates.

## 5. FIR

**Purpose:** Primary record for registered complaint/case.

**Key fields:** id, firNumber, stationId, districtId, registeredAt, categoryId, status, summary

**Relationships:** FIR links to Crime Incident, Accused, Victims, Witnesses, Acts, Sections, Case, Investigation, Evidence, Court Outcome.

**Sensitive data concerns:** Highly sensitive; access must be role-controlled and views must be audit logged.

**Future extension notes:** Can support version history, document attachments, and linked cases.

## 6. Crime Incident

**Purpose:** Incident details associated with an FIR.

**Key fields:** id, firId, incidentAt, locationId, description, categoryId, severity

**Relationships:** Crime Incident belongs to FIR and links to Location and Crime Category.

**Sensitive data concerns:** Descriptions may contain PII and sensitive details.

**Future extension notes:** Can support structured incident narratives and evidence tags.

## 7. Accused Person

**Purpose:** Person accused or suspected in a case.

**Key fields:** id, name, alias, age, gender, identifiers, address, riskFlags

**Relationships:** Accused may link to many FIRs, Cases, Locations, Networks, Watchlists.

**Sensitive data concerns:** Sensitive personal data; identity matching must be cautious and access-controlled.

**Future extension notes:** Can support biometric/identifier references only under approved policy.

## 8. Victim

**Purpose:** Person affected by a crime.

**Key fields:** id, protectedName, age, gender, demographicFields, contactRestricted, firId

**Relationships:** Victim links to FIR and Case.

**Sensitive data concerns:** Highly sensitive; identity should be hidden by default and audited when viewed.

**Future extension notes:** Can support anonymized analytics and victim support references.

## 9. Witness

**Purpose:** Witness linked to a case.

**Key fields:** id, protectedName, contactRestricted, statementRef, firId

**Relationships:** Witness links to FIR, Case, Investigation, Evidence.

**Sensitive data concerns:** Highly sensitive; should be restricted to authorized roles only.

**Future extension notes:** Can support statement management and protection flags.

## 10. Case

**Purpose:** Operational case record associated with FIR lifecycle.

**Key fields:** id, firId, caseNumber, status, priority, assignedOfficerId

**Relationships:** Case links to FIR, Investigation, Charge Sheet, Court Outcome, Reports.

**Sensitive data concerns:** Case assignment and priority can be operationally sensitive.

**Future extension notes:** Can support task tracking and escalation.

## 11. Investigation

**Purpose:** Investigation activity and notes.

**Key fields:** id, caseId, officerId, notes, status, updatedAt

**Relationships:** Investigation belongs to Case and can link to Evidence, Charge Sheet, Audit Logs.

**Sensitive data concerns:** Investigation notes are restricted and should not be exposed broadly.

**Future extension notes:** Can support structured milestones and approval workflows.

## 12. Charge Sheet

**Purpose:** Charge sheet filing information.

**Key fields:** id, caseId, filedAt, sections, status, filingDelayDays

**Relationships:** Charge Sheet links to Case, Acts, Sections, Court Outcome.

**Sensitive data concerns:** Legal documents may contain sensitive details and PII.

**Future extension notes:** Can support document upload and filing analytics.

## 13. Act

**Purpose:** Legal act reference.

**Key fields:** id, name, code, jurisdiction, active

**Relationships:** Act has many Sections and links to FIRs/Charge Sheets.

**Sensitive data concerns:** Usually reference data; still must be accurate and maintained.

**Future extension notes:** Can support versioning and legal updates.

## 14. Section

**Purpose:** Legal section reference.

**Key fields:** id, actId, sectionNumber, title, description, severity

**Relationships:** Section belongs to Act and links to FIRs/Charge Sheets.

**Sensitive data concerns:** Legal classification impacts analytics and must be validated.

**Future extension notes:** Can support mappings to crime categories.

## 15. Court Outcome

**Purpose:** Court disposal/outcome data.

**Key fields:** id, caseId, status, disposedAt, convictionStatus, remarks

**Relationships:** Court Outcome belongs to Case and may link to Charge Sheet.

**Sensitive data concerns:** Court data may contain sensitive legal details.

**Future extension notes:** Can support appeal status and outcome analytics.

## 16. Location

**Purpose:** Geospatial location of incident or operational entity.

**Key fields:** id, address, latitude, longitude, districtId, stationId, precisionLevel

**Relationships:** Location links to Incidents, Hotspots, Police Stations, Districts.

**Sensitive data concerns:** Exact locations can expose victims/witnesses; masking may be required.

**Future extension notes:** Can support geocoding, boundaries, and confidence score.

## 17. Crime Category

**Purpose:** Normalized category for crime classification.

**Key fields:** id, name, code, parentCategoryId, severityDefault

**Relationships:** Category links to FIRs, Incidents, Analytics, Reports.

**Sensitive data concerns:** Incorrect categorization affects intelligence outputs.

**Future extension notes:** Can support category hierarchy and aliases.

## 18. Modus Operandi

**Purpose:** Method/pattern used in crimes.

**Key fields:** id, label, description, extractedFrom, confidence

**Relationships:** MO links to FIRs, Crime Categories, Linked Case Detection.

**Sensitive data concerns:** Extracted MO may be uncertain and must be verified.

**Future extension notes:** Can support AI-assisted extraction and manual review.

## 19. Evidence

**Purpose:** Evidence metadata linked to a case.

**Key fields:** id, caseId, type, description, storageRef, collectedAt

**Relationships:** Evidence links to Case, Investigation, Accused, Location if applicable.

**Sensitive data concerns:** Evidence data is highly sensitive and must be restricted.

**Future extension notes:** Can support chain-of-custody workflows later.

## 20. Uploaded Dataset

**Purpose:** File uploaded for import.

**Key fields:** id, fileName, uploadedBy, uploadedAt, status, validationSummary

**Relationships:** Uploaded Dataset links to Data Import History, validation errors, normalized records.

**Sensitive data concerns:** Raw uploads may contain PII and must be stored securely.

**Future extension notes:** Can support schema mapping versions and rollback.

## 21. Audit Log

**Purpose:** Record of important user/system actions.

**Key fields:** id, actorUserId, action, entityType, entityId, timestamp, metadata

**Relationships:** Audit Log links to User and target entities.

**Sensitive data concerns:** Audit logs may reveal sensitive access patterns and must be protected.

**Future extension notes:** Can support retention rules and export for compliance.

## 22. AI Query

**Purpose:** Natural language query and structured interpretation.

**Key fields:** id, userId, prompt, structuredQuery, resultSummary, createdAt

**Relationships:** AI Query links to User, Saved Queries, Audit Logs, FIR result sets.

**Sensitive data concerns:** Prompts may include sensitive data and must be access-controlled.

**Future extension notes:** Can support conversation threads and redaction.

## 23. Saved Report

**Purpose:** User-generated report or draft.

**Key fields:** id, title, ownerUserId, filters, sections, createdAt, updatedAt

**Relationships:** Saved Report links to User, exported files, Audit Logs.

**Sensitive data concerns:** Reports may contain sensitive aggregated or record-level data.

**Future extension notes:** Can support sharing, approvals, and scheduled generation.

## 24. Alert

**Purpose:** Generated risk/system notification.

**Key fields:** id, type, severity, status, relatedEntityType, relatedEntityId, createdAt

**Relationships:** Alert links to User assignments, FIRs, Hotspots, Reports, Audit Logs.

**Sensitive data concerns:** Alerts can influence operations and must be explainable.

**Future extension notes:** Can support workflows, SLA tracking, and notification channels.

## Catalyst Data Store Notes

Catalyst Data Store should be treated as the default structured data layer for the entities above.

Implementation rules:

1. Create tables only when the related feature is active.
2. Keep sensitive entities permission-controlled at service and query layers.
3. Use app-level permission checks even when Catalyst table scopes are configured.
4. Store audit metadata for sensitive reads and writes.
5. Use Stratus object references for large uploaded files, generated reports, validation reports, and exports instead of storing file blobs in regular tables.
6. Use OLAP/ZCQL-based queries for aggregate analytics when suitable.
