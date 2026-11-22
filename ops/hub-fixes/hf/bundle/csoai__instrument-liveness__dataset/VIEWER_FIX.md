# Viewer fix notes: csoai/instrument-liveness

Viewer status before: `{'preview': False, 'viewer': False, 'search': False, 'filter': False, 'statistics': False}`

Original failure: default/train: TypeError

## Proposed configs (each loaded locally with `datasets` 5.2.0)

| config | files | rows loaded | method | partial |
|---|---|---|---|---|
| `root-json-sample` | 6 | 6 | full (per-file) | yes, of 7 |

## Notes / exclusions
- */*.json: 7 files; schemas tested on 7; 2 distinct Arrow schemas; 6 files kept in 1 config(s); 0 unloadable

**Owner recommendation:** these file groups mix many nested JSON shapes (one object per file, keys vary between files). The configs above expose the largest schema-consistent subsets. For full viewer coverage, publish a normalised table (JSONL or Parquet with flat columns, nested parts as JSON strings) and point a config at it.
