# Viewer fix notes: csoai/meok-process-world-partial-transitions-v1

Viewer status before: `{'preview': True, 'viewer': False, 'search': False, 'filter': False, 'statistics': False}`

Original failure: default/train: None; default/validation: None; default/test: CastError

## Proposed configs (each loaded locally with `datasets` 5.2.0)

| config | files | rows loaded | method | partial |
|---|---|---|---|---|
| `train` | 1 | 1600 | full | no |
| `test-predictions` | 1 | 560 | full | no |
| `test` | 1 | 560 | full | no |
| `validation` | 1 | 400 | full | no |
| `source` | 1 | 1 | full | no |
| `manifest` | 1 | 1 | full | no |
| `training-report` | 1 | 1 | full | no |

## Notes / exclusions
- none
