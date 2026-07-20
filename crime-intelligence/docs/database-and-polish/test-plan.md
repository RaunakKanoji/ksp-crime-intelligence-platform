# Test Plan

Status date: 2026-07-11

## Current Gap

The project has scripts for `lint`, `type-check`, and `build`, but no visible automated test runner in `package.json`. Production migration should add repository/API/workflow coverage before claiming completion.

## Required Tests

### Repository Tests

- Create/read/update/archive for core tables.
- Pagination, filtering, sorting.
- Referential integrity checks.
- Duplicate prevention for stable keys.
- Permission-scoped list/detail reads.
- Audit event creation on sensitive actions.

### API Tests

For important routes:

- Unauthenticated returns 401.
- Unauthorized role returns 403.
- Invalid request returns validation error.
- Missing record returns 404.
- Conflict returns 409.
- Database failure returns safe 503/500 error.
- Success response shape matches `{ data, meta, warnings }`.

### Workflow Tests

- Sign in and route to role-specific dashboard.
- Search crime records and open detail.
- Save an advanced search view.
- View a record on the map.
- Generate a report export.
- Ask an assistant query and reopen history.
- Upload and validate a dataset.
- Admin updates user role and audit log records it.
- Alert is reviewed/resolved.
- Sign out without redirect loops.

### UX Regression Tests

- Navigation is role-aware and not overpopulated.
- No blank protected pages.
- Loading/empty/no-results/error states render distinctly.
- No dead primary buttons.
- Dialogs and menus are keyboard usable.

## Verification Commands

Run from `crime-intelligence/`:

```sh
npm run lint
npm run type-check
npm run build
```

