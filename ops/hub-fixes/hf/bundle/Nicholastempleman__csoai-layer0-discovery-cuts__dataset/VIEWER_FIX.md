# Viewer fix notes: Nicholastempleman/csoai-layer0-discovery-cuts

Viewer status before: `{'preview': False, 'viewer': False, 'search': False, 'filter': False, 'statistics': False}`

Original failure: default/train: CastError

## Proposed configs (each loaded locally with `datasets` 5.2.0)

| config | files | rows loaded | method | partial |
|---|---|---|---|---|
| `root-json-sample` | 3 | 3 | full (per-file) | yes, of 10 |
| `root-json-v2-sample` | 2 | 2 | full (per-file) | yes, of 10 |

## Notes / exclusions
- *.json: 10 files; schemas tested on 10; 7 distinct Arrow schemas; 5 files kept in 2 config(s); 0 unloadable

**Owner recommendation:** these file groups mix many nested JSON shapes (one object per file, keys vary between files). The configs above expose the largest schema-consistent subsets. For full viewer coverage, publish a normalised table (JSONL or Parquet with flat columns, nested parts as JSON strings) and point a config at it.
