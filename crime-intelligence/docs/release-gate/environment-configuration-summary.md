# Environment Configuration Summary

| Area | Expected configuration |
| --- | --- |
| Build command | `npm run build` |
| Start command | `npm run start` with `PORT` supplied by the host |
| Runtime | Node 22.x |
| Auth | Catalyst authentication on deployed Catalyst domain; local fallback only for development/demo serve contexts |
| API routes | Next.js app route handlers under `/api/*` |
| Data | Approved demo/sample data unless Catalyst Data Store is connected |
| Secrets | No secrets are stored in client source; environment values must be supplied by deployment platform |
| Debug logging | Audit/job transition logs require `KSP_DEBUG_AUDIT=true` or `KSP_DEBUG_JOBS=true` |
| Release checks | `npm run lint`, `npm run type-check`, `npm run a11y:static`, `npm run release:gate`, `npm run build` |

Production verification must confirm that deployment URLs do not redirect to local hosts and that direct routes load correctly.
