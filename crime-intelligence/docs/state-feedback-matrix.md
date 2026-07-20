# Interaction Feedback and System States

Specification 063 standardizes how the app communicates loading, success, failure, permissions, empty results, and offline states.

## Shared Primitives

| Primitive | Use |
| --- | --- |
| `ToastProvider` / `useToast` | One toast system for action success and recoverable action failures. |
| `ConnectivityBanner` | Global offline notice when browser connectivity is unavailable. |
| `LoadingState` | Inline loading where content is not yet available. |
| `SkeletonBlock` | Structured loading placeholders that resemble final content. |
| `RefreshingIndicator` | Background refresh while existing content remains usable. |
| `EmptyState` | No data or no matching results with one clear next step. |
| `ErrorState` | Recoverable page or region failure with retry and safe navigation. |
| `StateNotice` | Concise status for reports, maps, search, and long-running actions. |
| `Button loading` | Button-level progress and duplicate-submit prevention. |

## Component Matrix

| Surface | Loading | Empty | Error | Retry | Success | Disabled |
| --- | --- | --- | --- | --- | --- | --- |
| Dashboard cards | Structured skeletons | Explain missing records or filters | Page/region error with retry | Reload current filters | Not used for routine refresh | Controls disabled only while request is active |
| Tables | Skeleton rows or current rows plus refresh indicator | No data vs no filtered results | Preserve filters and show retry | Repeat last query | Toast for row actions | Pagination/action buttons disabled during busy states |
| Charts | Chart-shaped skeletons | “No chart data” with filter action | Error card with retry | Reload chart query | Not used for passive chart loads | Chart controls disabled only when needed |
| Maps | Initial overlay; refresh indicator for layer updates | No incidents in selected scope | Current map stays visible with retry | Reload active filters | Status notice when layers are ready | Layer controls remain usable unless unsafe |
| Forms | Submit button loading | Not applicable | Field errors near inputs; server errors preserve values | Resubmit same values | Toast with completed result | Duplicate submit blocked while saving |
| Dialogs | Button loading | Not applicable | Inline message in dialog | Keep dialog open | Toast and close only after save | Confirm buttons disabled while action runs |
| Assistant | Response skeleton and processing notice | Sample prompts before first query | Failed question preserved with retry | Retry last question | Toast when response is ready | Submit/examples disabled while processing |
| Reports | Preview skeleton and export status | No records match report scope | Filters preserved with retry | Re-run preview or export | Toast plus report status text | Export buttons block duplicate preparation |
| Exports | Button loading and status notice | Export unavailable message | Actionable error toast | Retry same config | “Export prepared” toast | Other export format disabled while one runs |
| Administration | Table skeletons | No users/audit events with filter guidance | Filters preserved with retry | Reload directory | Toast for user access changes | Access-change buttons disabled while action runs |

## Message Rules

- Say what failed, whether user work was preserved, and what to do next.
- Do not expose stack traces, raw backend errors, API keys, or internal service names.
- Use toasts for completed actions and recoverable action failures.
- Use field-level messages for validation errors.
- Keep destructive confirmation labels explicit, for example “Disable access.”
- Preserve search, filters, report settings, and assistant questions after recoverable failure.
