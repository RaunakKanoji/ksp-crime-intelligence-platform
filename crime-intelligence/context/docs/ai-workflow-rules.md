# AI Workflow Rules

These rules are mandatory for any coding AI or developer working on this project.

## 1. Read Docs Before Coding

Before modifying code, read:

1. `docs/project-overview.md`
2. `docs/architecture-context.md`
3. `docs/ai-workflow-rules.md`
4. `docs/progress-tracker.md`
5. The relevant feature specification in `docs/features/`

## 2. Implement One Feature at a Time

Never implement multiple feature specs in one pass unless the user explicitly asks for it. Complete the active feature, update the tracker, then move to the next feature.

## 3. Do Not Create Complex Placeholders

Inactive future pages may be plain pages with only the page name. Do not create fake charts, fake tables, fake filters, fake analytics, fake maps, or fake workflows for inactive features.

## 4. Do Not Invent APIs Without Documentation

If an API route, server action, or service function is needed, document it in the relevant feature spec before implementation.

## 5. Do Not Change the Selected Component System

Use the project’s currently selected/default UI component system. Do not change the component library, preset, theme, or design system unless explicitly asked.

## 6. Do Not Refactor Unrelated Files

Avoid broad refactors. Keep changes limited to the active feature and directly required shared utilities.

## 7. Do Not Remove Working Code Unnecessarily

Do not remove existing code unless it is clearly unused, broken, or part of a requested cleanup. Ask before destructive changes.

## 8. Update Progress Tracker

After meaningful implementation changes, update `docs/progress-tracker.md` with status, last updated date, and notes.

## 9. Status Rules

Allowed statuses:

- Not Started
- In Progress
- Blocked
- Done
- Needs Review

Every feature must have one of these statuses.

## 10. Feature Spec Sync

Before implementing a feature, read its spec. After implementing, update the spec if the implementation differs from the documented plan.

## 11. Inactive UI Rule

Keep inactive pages plain. Do not create production-looking mock analytics or investigative workflows unless the feature is active.

## 12. Crime Data Security

Treat FIR, accused, victim, witness, evidence, and investigation data as sensitive. Apply permission checks and audit logs for sensitive views and exports.

## 13. AI Safety Rule

Never treat AI output as confirmed evidence. AI-generated insights must be explainable, grounded in available data, and labeled as decision support requiring human review.

## 14. Change Summary Rule

After implementing a feature, summarize changed files, tracker updates, assumptions, tests performed, and any remaining limitations.

## Catalyst-First Rules

1. Before adding any backend, auth, database, storage, queue, scheduler, hosting, or notification dependency, check whether Catalyst can provide it.
2. Use Catalyst when possible.
3. Do not add Firebase, Supabase, Clerk, Auth0, AWS S3, external cron services, or a separate backend framework unless Catalyst cannot satisfy the requirement or the user explicitly approves the exception.
4. Use Catalyst Authentication for login and user management unless an exception is documented.
5. Use Catalyst Roles as the platform role foundation, then enforce app-level feature and data permissions in code.
6. Use Catalyst Data Store for persistent structured data unless the feature requires a different approved database.
7. Use Catalyst Stratus for object/file storage. Do not plan new work on deprecated File Store.
8. Use Catalyst Job Scheduling for scheduled jobs. Do not plan new work on deprecated Cron.
9. Use Catalyst Signals for event workflows where useful. Do not plan new work on deprecated Event Listeners.
10. Keep Catalyst SDK calls isolated in `lib/catalyst/` wrappers.
11. Update `docs/catalyst-platform-strategy.md` if a Catalyst decision changes.
