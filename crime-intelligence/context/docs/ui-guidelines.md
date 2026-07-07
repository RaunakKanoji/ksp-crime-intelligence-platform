# UI Guidelines

## 1. Use Default Selected Components

Use the project’s currently selected/default UI component system for layouts, cards, buttons, forms, inputs, dialogs, tables, sidebars, navigation, and other UI elements.

Do not change the component library, preset, theme, or design system unless explicitly asked.

## 2. Do Not Change the Component System

Do not introduce random UI libraries. If a specialized component is required, document why it is needed in the feature spec before adding it.

## 3. Layout Rules

- Use a clear dashboard-oriented layout.
- Keep pages readable and data-focused.
- Use consistent spacing and hierarchy.
- Avoid cluttered placeholder sections.
- Keep inactive routes plain.

## 4. Sidebar Rules

Sidebar navigation should be grouped by domain:

- Dashboard
- FIR Records
- Analytics
- Maps & Hotspots
- AI Query
- Reports
- Data Operations
- Admin
- Help

## 5. Header Rules

The header should include page title context, global actions if needed, user menu, and status indicators only when useful.

## 6. Dashboard Card Rules

- Cards should show one key metric each.
- Include labels, comparison period, and data source/demo label where applicable.
- Provide loading, empty, error, and permission-restricted states.
- Do not show fake production analytics.

## 7. Table Rules

- Tables should support clear column labels.
- Sensitive columns must be hidden or redacted based on role.
- Use pagination for large datasets.
- Provide empty and loading states.
- Include filter summary when helpful.

## 8. Filter Rules

- Filters should be grouped logically.
- Include reset behavior.
- Use date ranges and category filters consistently.
- Avoid too many controls on initial views.

## 9. Form Rules

- Use labels, descriptions, validation messages, and disabled states.
- Validate inputs server-side.
- Do not submit unrestricted sensitive operations without confirmation where appropriate.

## 10. Map Page Rules

- Show maps with clear legends.
- Use clustering for many points.
- Use heatmap/hotspot overlays only with explained logic.
- Mask sensitive locations where required.
- Provide fallback when map data or API key is unavailable.

## 11. Empty State Rules

Empty states should explain whether there is no data, no permission, no matching filters, or a setup issue.

## 12. Loading State Rules

Use calm, professional loading states. Avoid distracting animations.

## 13. Error State Rules

Errors should be understandable and safe. Do not expose technical details or sensitive identifiers.

## 14. Accessibility Rules

- Provide keyboard navigation.
- Use semantic headings.
- Label inputs.
- Maintain contrast.
- Do not rely on color alone.

## 15. Responsive Behavior

The app is a web app and should work on common desktop and tablet viewport sizes. Mobile web responsiveness is acceptable, but this is not a mobile app project.

## 16. Color and Typography Principles

The UI should feel professional, serious, police/intelligence-oriented, minimal, and focused. Avoid childish gamification, flashy visuals, excessive gradients, and unnecessary animations.

## Catalyst UI Integration Notes

The UI must still use the default selected component system. Catalyst does not replace the UI component library.

Catalyst UI integration should be limited to:

1. Authentication state and login/logout flows.
2. Permission-aware navigation.
3. Data loading from Catalyst-backed services.
4. Upload states for Stratus-backed dataset/report flows.
5. Audit-safe display of sensitive data.
6. Error messages from Catalyst Functions, Data Store, API Gateway, or Stratus.

Do not add new UI libraries just because Catalyst is used.
