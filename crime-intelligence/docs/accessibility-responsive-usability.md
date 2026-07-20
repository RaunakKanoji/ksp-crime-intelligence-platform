# Accessibility, Responsive Design, and Guided Usability

Specification 064 targets practical WCAG 2.2 AA alignment for core KSP Crime Intelligence workflows.

## Implemented Guardrails

- Skip-to-content link targets the main content landmark.
- Route changes focus the main content region associated with the page heading.
- Primary navigation, user menu, mobile drawer, and custom dialogs close with Escape.
- Menus and drawers restore focus to their trigger after dismissal.
- Custom dialogs in user management move focus inside, trap Tab focus, and expose accessible titles/descriptions.
- Shared form fields associate labels, descriptions, required state, and errors with controls.
- Shared buttons expose loading state with `aria-busy` and prevent duplicate submission.
- Shared tables support captions and keyboard-focusable horizontal scrolling.
- Shared charts can expose text summaries before visual content.
- Global offline banner announces connectivity loss.
- Reduced-motion preference is respected globally.
- Touch targets for shared buttons, icon buttons, and inputs are at least 44px.

## Core Workflow Coverage

| Workflow | Accessibility support |
| --- | --- |
| Authentication shell | Structured loading state and stable focus indicator. |
| Records search | Programmatic filter labels, result table caption, accessible record links, filter status announcement. |
| Map exploration | Keyboard-accessible incident list synchronized with map selection; selected incident is announced; map has non-gesture alternative. |
| Assistant | Prompt instructions tied to the textarea; suggested prompts are keyboard buttons; responses use polite live regions. |
| Reports | Validation focuses the title field; export status is announced; chart bars have text summary and accessible labels. |
| Administration | User dialogs trap focus, restore focus, and describe destructive access changes. |

## Responsive Requirements

The shell and core surfaces are designed for 1440, 1280, 1024, 768, 390, and 320 px widths:

- Sidebar becomes a keyboard-accessible drawer on smaller screens.
- Page content uses constrained widths and avoids whole-page horizontal scrolling.
- Data tables keep horizontal scroll inside the table container.
- Map side content stacks below controls on narrow screens; incident list remains available.
- Dialogs are constrained on desktop and scroll within the viewport on small screens.
- Primary actions remain visible and do not depend on hover.

## Known Third-Party Limitation

MapLibre renders an interactive canvas with controls owned by the provider. Complete screen-reader access to the canvas internals is not available through the provider alone. The implemented fallback is a synchronized incident list and detail panel that exposes essential map records without drag gestures or canvas interaction.

Remediation path:

- Continue using the synchronized list as the accessible source of truth.
- Add provider-specific control labels if MapLibre exposes stable hooks for custom control rendering.
- Extend list-to-map synchronization when live Catalyst data adds more incident attributes.

## Testing Checklist

- Keyboard-only: navigation, records search, map list selection, assistant, reports, user management.
- Screen-reader smoke test: page heading, landmarks, form labels, status announcements, dialogs.
- Responsive widths: 1440, 1280, 1024, 768, 390, and 320 px.
- Browser zoom: 200% with no clipped dialogs or hidden primary actions.
- Reduced motion: verify animations and transitions are minimized.
- Error states: verify retry actions and preserved user input.
- Static guard: run `npm run a11y:static`.
