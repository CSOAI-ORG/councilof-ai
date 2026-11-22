# Viewer fix notes: csoai/agent-interop-census

Viewer status before: `{'preview': True, 'viewer': False, 'search': False, 'filter': False, 'statistics': False}`

Original failure: default/train: None

## Proposed configs (each loaded locally with `datasets` 5.2.0)

| config | files | rows loaded | method | partial |
|---|---|---|---|---|
| `manifest` | 1 | 5 | full | no |
| `census-frame-summary` | 1 | 1 | full | no |
| `manifest-json` | 1 | 1 | full | no |
| `totals` | 1 | 1 | full | no |

## Notes / exclusions
- census.jsonl: 1 files; schemas tested on 1; 0 distinct Arrow schemas; 0 files kept in 0 config(s); 1 unloadable ({"CastError: Couldn't cast\nsource: string\nkind: string\nid: string\nversio": 1})
