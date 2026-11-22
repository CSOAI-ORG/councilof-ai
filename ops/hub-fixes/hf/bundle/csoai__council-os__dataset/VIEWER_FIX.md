# Viewer fix notes: csoai/council-os

Viewer status before: `{'preview': False, 'viewer': False, 'search': False, 'filter': False, 'statistics': False}`

Original failure: default/train: CastError

## Proposed configs (each loaded locally with `datasets` 5.2.0)

| config | files | rows loaded | method | partial |
|---|---|---|---|---|
| `pointers` | 1 | 34 | full | no |
| `manifest` | 1 | 2 | full | no |
| `root-json` | 1 | 1 | full (per-file) | no |
| `root-json-v2` | 1 | 1 | full (per-file) | no |
| `root-json-v3` | 1 | 1 | full (per-file) | no |
| `root-json-v4` | 1 | 1 | full (per-file) | no |
| `root-json-v5` | 1 | 1 | full (per-file) | no |
| `root-json-v6` | 1 | 1 | full (per-file) | no |

## Notes / exclusions
- excluded JSON-Schema file(s) safe-gspc-interop.schema.json
