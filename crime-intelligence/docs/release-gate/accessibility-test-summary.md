# Accessibility Test Summary

## Automated Checks

- `npm run a11y:static`: passes.
- `npm run lint`: passes.
- `npm run type-check`: passes.

## Manual Smoke Scope

| Area | Result |
| --- | --- |
| Keyboard navigation | Primary shell, records, map list, assistant, reports, and admin dialogs are keyboard-operable. |
| Focus visibility | Global `:focus-visible` ring is defined and shared controls inherit it. |
| Skip navigation | Skip-to-content link targets the main content landmark. |
| Dialog focus | User-management form and disable-access confirmation trap and restore focus. |
| Tables | Core record/report tables include captions and keyboard-reachable row actions. |
| Charts | Report chart has text summary and bar labels. |
| Map | Incident list provides a non-canvas alternative and synchronizes selection. |
| Reduced motion | Global reduced-motion media query is present. |
| Screen-reader smoke | Landmarks, page heading association, status regions, and form labels are present in critical flows. |

## Known Limitation

MapLibre canvas internals are not fully screen-reader navigable. The release fallback is the synchronized incident list and detail panel, documented in `docs/accessibility-responsive-usability.md`.
