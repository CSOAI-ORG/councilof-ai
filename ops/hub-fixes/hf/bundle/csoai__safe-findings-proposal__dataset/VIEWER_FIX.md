# Viewer fix notes: csoai/safe-findings-proposal

Viewer status before: `{'error': 'Not supported: dataset viewer is disabled in csoai/safe-findings-proposal configuration.'}`

Original failure: Not supported: dataset viewer is disabled in csoai/safe-findings-proposal configuration.

## Proposed configs (each loaded locally with `datasets` 5.2.0)

| config | files | rows loaded | method | partial |
|---|---|---|---|---|
| `out-corrections-ledger-integrity-safe-rv` | 1 | 1 | full | no |
| `out-corrections-ledger-timing-safe-rv` | 1 | 1 | full | no |
| `out-disclosure-lag-activity-stopped-safe-rv` | 1 | 1 | full | no |
| `out-disclosure-lag-incident-to-notification-safe-rv` | 1 | 1 | full | no |
| `out-index` | 1 | 1 | full | no |
| `out-safe-rv` | 1 | 1 | full | no |
| `out-measurement-capsules-index-safe-rv` | 1 | 1 | full | no |
| `safe-rfc-fieldmap` | 1 | 1 | full | no |
| `out-post-fix-safe-rv` | 1 | 1 | full (per-file) | no |
| `out-post-fix-safe-rv-v2` | 1 | 1 | full (per-file) | no |
| `out-pre-fix-safe-rv` | 1 | 1 | full (per-file) | no |
| `out-pre-fix-safe-rv-v2` | 1 | 1 | full (per-file) | no |

## Notes / exclusions
- excluded JSON-Schema file(s) schema/*.schema.json
