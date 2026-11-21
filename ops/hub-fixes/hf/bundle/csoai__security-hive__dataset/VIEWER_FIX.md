# Viewer fix notes: csoai/security-hive

Viewer status before: `{'preview': False, 'viewer': False, 'search': False, 'filter': False, 'statistics': False}`

Original failure: no splits

## Proposed configs (each loaded locally with `datasets` 5.2.0)

| config | files | rows loaded | method | partial |
|---|---|---|---|---|
| `owasp-asi-asi-gspc-axis-map` | 1 | 1 | full | no |

## Notes / exclusions
- measurements/*.json: 13 files; schemas tested on 13; 0 distinct Arrow schemas; 0 files kept in 0 config(s); 13 unloadable ({'ValueError: Expected object or value at position 0': 12, "HTTPStatusError: Client error '429 Too Many Requests' for url 'https:/": 1})
