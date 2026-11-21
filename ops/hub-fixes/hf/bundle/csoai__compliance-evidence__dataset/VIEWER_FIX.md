# Viewer fix notes: csoai/compliance-evidence

Viewer status before: `{'preview': False, 'viewer': False, 'search': False, 'filter': False, 'statistics': False}`

Original failure: default/train: CastError

## Proposed configs (each loaded locally with `datasets` 5.2.0)

| config | files | rows loaded | method | partial |
|---|---|---|---|---|
| `root-json-sample` | 6 | 834 | full (per-file) | yes, of 22 |
| `root-json-v2-sample` | 6 | 786 | full (per-file) | yes, of 22 |
| `root-json-json` | 10 | 10 | full | no |

## Notes / exclusions
- *.jsonl: 22 files; schemas tested on 22; 2 distinct Arrow schemas; 12 files kept in 2 config(s); 10 unloadable ({"HTTPStatusError: Client error '429 Too Many Requests' for url 'https:/": 10})

**Owner recommendation:** these file groups mix many nested JSON shapes (one object per file, keys vary between files). The configs above expose the largest schema-consistent subsets. For full viewer coverage, publish a normalised table (JSONL or Parquet with flat columns, nested parts as JSON strings) and point a config at it.
