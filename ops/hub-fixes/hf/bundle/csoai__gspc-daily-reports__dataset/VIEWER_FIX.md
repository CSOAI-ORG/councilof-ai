# Viewer fix notes: csoai/gspc-daily-reports

Viewer status before: `{'preview': False, 'viewer': False, 'search': False, 'filter': False, 'statistics': False}`

Original failure: default/train: TypeError

## Proposed configs (each loaded locally with `datasets` 5.2.0)

| config | files | rows loaded | method | partial |
|---|---|---|---|---|
| `watch-hf-watch-latest` | 1 | 11 | full | no |
| `reports-sample` | 11 | 11 | full (per-file) | yes, of 17 |

## Notes / exclusions
- reports/*/*.json: 17 files; schemas tested on 17; 2 distinct Arrow schemas; 11 files kept in 1 config(s); 5 unloadable ({"HTTPStatusError: Client error '429 Too Many Requests' for url 'https:/": 5})

**Owner recommendation:** these file groups mix many nested JSON shapes (one object per file, keys vary between files). The configs above expose the largest schema-consistent subsets. For full viewer coverage, publish a normalised table (JSONL or Parquet with flat columns, nested parts as JSON strings) and point a config at it.
