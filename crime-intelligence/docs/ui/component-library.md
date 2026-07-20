# Component Library

Status date: 2026-07-11

Specification 061 standardizes the existing UI rather than adding new product features. The approved shared primitives live in `src/components/ui`.

## Approved primitives

- `PageHeader`
- `SectionHeader`
- `PageSection`
- `Card`
- `Button`
- `IconButton`
- `Input`
- `Textarea`
- `Select`
- `SearchInput`
- `FormField`
- `Badge`
- `StatusBadge`
- `Alert`
- `LoadingState`
- `EmptyState`
- `ErrorState`
- `FilterBar`
- `Table`
- `Pagination`
- `ChartContainer`
- `MapControlPanel`

## Tokens

Global tokens are defined as CSS variables in `src/app/globals.css` and exposed through Tailwind theme entries in `tailwind.config.js`.

Use token-backed classes such as `bg-app-surface`, `text-ink-primary`, `border-app-border`, `bg-app-primary`, and the `ksp-*` component classes before introducing page-local styles.

## Rules

- Use one primary action per main region.
- Use `Button` variants for action hierarchy.
- Use `FormField` so labels are always visible.
- Use `Card` only for meaningful grouping.
- Use `Table` for operational tables.
- Use `ChartContainer` for charts with titles, descriptions, and empty states.
- Use `MapControlPanel` for map overlays and controls.
- Keep icon style outline/currentColor, matching the existing navigation icons.

