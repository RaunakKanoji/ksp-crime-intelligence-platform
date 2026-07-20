# UX Issues

Status date: 2026-07-11

## Product-Level Issues

- Too many routes are equally prominent.
- Several pages are demos of one analytic lens over the same sample dataset.
- Data source labels often say mock/sample, which is honest but makes production readiness incomplete.
- Some pages have multiple competing actions and dense controls.
- Several workflow concepts use inconsistent names: FIR, case, incident, crime record; alert vs notification; user vs officer.
- Some important actions appear to succeed before persistence exists.

## Required Shared Components

Create or consolidate these components as database-backed pages are migrated:

- `PageHeader`
- `PageSection`
- `EmptyState`
- `ErrorState`
- `LoadingState`
- `SearchInput`
- `FilterBar`
- `DataTable`
- `Pagination`
- `StatusBadge`
- `ConfirmDialog`
- `FormField`
- `FormActions`
- `DetailsPanel`
- `AuditTimeline`
- `PermissionGate`

## State Requirements

Every migrated data page must distinguish:

- Initial loading
- Empty database state
- Filtered no-results state
- Permission-denied state
- Validation error
- Server/database unavailable error
- Successful persisted mutation

## Terminology

Use this terminology unless a later specification explicitly requires a distinct concept:

| Preferred term | Avoid mixing with | Notes |
|---|---|---|
| Crime record | Incident/event for primary FIR list rows | FIR number remains a field |
| Case | Investigation/lifecycle entity linked to a crime record | Use for status/assignment workflows |
| Police station | Police unit/station | Use consistently |
| Alert | Notification for source event | Notification is delivery/user inbox item |
| Report | Export/document definition or run | Document/file is stored output |
| Officer | User when referring to operational identity | User is generic account/admin term |
| Saved view | Saved filters/table view | Saved query for AI/search text payloads |

## Accessibility Regression Checklist

- Keyboard-visible focus on all controls.
- No icon-only buttons without accessible names.
- No horizontal scrolling at common tablet/desktop widths.
- Dialogs trap focus and can be dismissed with Escape.
- Tables have headers and row action labels.
- Statuses include text, not color alone.
- Map data has a non-map list or summary alternative.

