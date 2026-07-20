# Build and Deployment Verification Record

| Check | Command / method | Result |
| --- | --- | --- |
| Lint | `npm run lint` | Pass |
| Type-check | `npm run type-check` | Pass |
| Static accessibility | `npm run a11y:static` | Pass |
| Release gate | `npm run release:gate` | Pass when this document set is present |
| Production build | `npm run build` | Pass |
| Deployment URL | Manual production check | Required before public demo |
| Browser matrix | Chrome, Edge, Firefox, Safari where available | Required before public demo |
| Direct route loading | Manual production check for Overview, Records, Crime map, Assistant, Reports | Required before public demo |

The release gate records code-level readiness. Environment and browser checks must be repeated after deployment because authentication cookies, Catalyst domain behavior, and route hosting are environment-specific.
