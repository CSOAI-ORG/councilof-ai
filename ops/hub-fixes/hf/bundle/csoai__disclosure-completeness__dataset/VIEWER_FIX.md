# Viewer fix notes: csoai/disclosure-completeness

Viewer status before: `{'error': 'Not supported: dataset viewer is disabled in csoai/disclosure-completeness configuration.'}`

Original failure: Not supported: dataset viewer is disabled in csoai/disclosure-completeness configuration.

## Proposed configs (each loaded locally with `datasets` 5.2.0)

| config | files | rows loaded | method | partial |
|---|---|---|---|---|
| `disclosure-completeness-epoch-date-and-n-record` | 1 | 1 | full | no |
| `disclosure-completeness-epoch-date-and-n-record-signed` | 1 | 1 | full | no |
| `disclosure-completeness-lmarena-publish-lag-record` | 1 | 1 | full | no |
| `disclosure-completeness-lmarena-publish-lag-record-signed` | 1 | 1 | full | no |
| `disclosure-completeness-openrouter-hf-declared-fields-record` | 1 | 1 | full | no |
| `disclosure-completeness-openrouter-hf-declared-fields-record-json` | 1 | 1 | full | no |
| `disclosure-completeness-swebench-logs-pointer-record` | 1 | 1 | full | no |
| `disclosure-completeness-swebench-logs-pointer-record-signed` | 1 | 1 | full | no |
| `ots-upgraded-ots-upgrade` | 1 | 1 | full | no |

## Notes / exclusions
- disclosure-completeness-*/set.json: 1 files; schemas tested on 1; 0 distinct Arrow schemas; 0 files kept in 0 config(s); 1 unloadable ({'ValueError: Expected object or value at position 0': 1})
