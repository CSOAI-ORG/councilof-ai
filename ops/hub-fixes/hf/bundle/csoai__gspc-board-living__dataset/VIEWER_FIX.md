# Viewer fix notes: csoai/gspc-board-living

Viewer status before: `{'preview': False, 'viewer': False, 'search': False, 'filter': False, 'statistics': False}`

Original failure: no splits

## Proposed configs (each loaded locally with `datasets` 5.2.0)

| config | files | rows loaded | method | partial |
|---|---|---|---|---|
| `measurements-pulse-rows` | 88 | 50 | full | no |
| `measurements-pulse-summary-sample` | 6 | 6 | full (per-file) | yes, of 88 |
| `measurements-pulse-summary-v2-sample` | 6 | 6 | full (per-file) | yes, of 88 |

## Notes / exclusions
- measurements/*.pulse-summary.json: 88 files; schemas tested on 40; 2 distinct Arrow schemas; 12 files kept in 2 config(s); 28 unloadable ({"HTTPStatusError: Client error '429 Too Many Requests' for url 'https:/": 28})
- board.json: 1 files; schemas tested on 1; 0 distinct Arrow schemas; 0 files kept in 0 config(s); 1 unloadable ({'ValueError: Expected object or value at position 0': 1})

**Owner recommendation:** these file groups mix many nested JSON shapes (one object per file, keys vary between files). The configs above expose the largest schema-consistent subsets. For full viewer coverage, publish a normalised table (JSONL or Parquet with flat columns, nested parts as JSON strings) and point a config at it.
