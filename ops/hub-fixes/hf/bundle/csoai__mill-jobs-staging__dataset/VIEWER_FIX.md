# Viewer fix notes: csoai/mill-jobs-staging

Viewer status before: `{'preview': False, 'viewer': False, 'search': False, 'filter': False, 'statistics': False}`

Original failure: default/train: CastError

## Proposed configs (each loaded locally with `datasets` 5.2.0)

| config | files | rows loaded | method | partial |
|---|---|---|---|---|
| `safety-skip` | 3 | 2844 | full | no |
| `detector-interop-skip` | 2 | 1957 | full | no |
| `cross-reality-skip` | 2 | 1953 | full | no |
| `conformance-skip` | 3 | 888 | full | no |
| `jail-skip` | 3 | 869 | full | no |
| `care-skip` | 3 | 837 | full | no |
| `dead-care` | 3 | 468 | full | no |
| `care-dead-slugs` | 3 | 453 | full | no |
| `dead-governance` | 2 | 308 | full | no |
| `dead-safety` | 2 | 308 | full | no |
| `dead-swarm` | 2 | 280 | full | no |
| `dead-detector-interop` | 2 | 280 | full | no |
| `jail-dead-slugs` | 3 | 274 | full | no |
| `governance` | 3057 | 100 | stream100 | no |
| `safety` | 3014 | 100 | stream100 | no |
| `conformance-dead-slugs` | 3 | 39 | full | no |
| `governance-dead-slugs` | 2 | 32 | full | no |
| `safety-dead-slugs` | 3 | 32 | full | no |
| `detector-interop-dead-slugs` | 2 | 4 | full | no |
| `cross-reality-dead-slugs` | 2 | 4 | full | no |
| `detector-interop-sample` | 33 | 990 | full (per-file) | yes, of 45 |
| `cross-reality-sample` | 30 | 900 | full (per-file) | yes, of 49 |
| `root-json-sample` | 18 | 540 | full (per-file) | yes, of 22 |
| `affect-sample` | 18 | 540 | full (per-file) | yes, of 21 |
| `cross-reality-v2-sample` | 9 | 270 | full (per-file) | yes, of 49 |

## Notes / exclusions
- 15 smaller file groups not given configs (cap 25): safety/*/*.json, jail/*/*.json, care/*/*.json, detector-interop/*/*.json, cross-reality/*/*.json, */*/*.json, conformance/*/*.json, provenance/*/*.json, care/*/mill-report.json, conformance/*/mill-report.json, jail/*/mill-report.json, safety/*/mill-report.json, cross-reality/*/mill-report.json, detector-interop/*/mill-report.json, governance/*/mill-report.json
- cross-reality/*/*.jsonl: 49 files; schemas tested on 40; 3 distinct Arrow schemas; 39 files kept in 2 config(s); 0 unloadable
- detector-interop/*/*.jsonl: 45 files; schemas tested on 40; 3 distinct Arrow schemas; 39 files kept in 2 config(s); 0 unloadable
- */*/*.jsonl: 22 files; schemas tested on 22; 3 distinct Arrow schemas; 21 files kept in 2 config(s); 0 unloadable
- affect/*/*.jsonl: 21 files; schemas tested on 21; 3 distinct Arrow schemas; 20 files kept in 2 config(s); 0 unloadable
- governance/*/*.json: 2968 files; schemas tested on 40; 3 distinct Arrow schemas; 39 files kept in 2 config(s); 0 unloadable
- 5 further configs dropped by cap

**Owner recommendation:** these file groups mix many nested JSON shapes (one object per file, keys vary between files). The configs above expose the largest schema-consistent subsets. For full viewer coverage, publish a normalised table (JSONL or Parquet with flat columns, nested parts as JSON strings) and point a config at it.
