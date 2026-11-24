# Viewer fix notes: Nicholastempleman/csoai-lf-agent-infrastructure-index

Viewer status before: `{'preview': False, 'viewer': False, 'search': False, 'filter': False, 'statistics': False}`

Original failure: default/train: CastError

## Proposed configs (each loaded locally with `datasets` 5.2.0)

| config | files | rows loaded | method | partial |
|---|---|---|---|---|
| `bitcoin-path-readback` | 1 | 1 | full | no |
| `directory-receipt` | 1 | 1 | full | no |
| `files` | 1 | 1 | full | no |
| `index` | 1 | 1 | full | no |
| `root-json` | 1 | 1 | full (per-file) | no |
| `root-json-v2` | 1 | 1 | full (per-file) | no |
| `root-json-v3` | 1 | 1 | full (per-file) | no |

## Notes / exclusions
- graph.json: 1 files; schemas tested on 1; 0 distinct Arrow schemas; 0 files kept in 0 config(s); 1 unloadable ({'ArrowInvalid: JSON parse error: Column() changed from object to string': 1})
