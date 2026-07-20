# Known Issues

| Severity | Issue | Status | Release decision |
| --- | --- | --- | --- |
| Medium | Live Catalyst credentials and deployed auth cookies must be verified in the target production environment. | Environment-dependent | Not a code blocker; must be checked before demo. |
| Medium | MapLibre canvas internals are not fully accessible to screen readers. | Mitigated | Synchronized incident list is the supported accessible path. |
| Low | Browserslist database reports that `caniuse-lite` is outdated during build. | Tooling maintenance | Non-blocking; update dependency metadata in a maintenance pass. |
| Low | Demo/sample data labels remain visible on demo-backed screens. | Intentional | Required to avoid misleading operational claims. |

No critical or high release blockers are documented in this audit.
