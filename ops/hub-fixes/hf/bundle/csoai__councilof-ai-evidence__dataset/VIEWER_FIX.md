# Viewer fix notes: csoai/councilof-ai-evidence

Viewer status before: `{'error': 'Not supported: dataset viewer is disabled in csoai/councilof-ai-evidence configuration.'}`

Original failure: Not supported: dataset viewer is disabled in csoai/councilof-ai-evidence configuration.

## Proposed configs (each loaded locally with `datasets` 5.2.0)

| config | files | rows loaded | method | partial |
|---|---|---|---|---|
| `index` | 1 | 36750 | full | no |
| `interop-mill-cards-signed-superseded` | 1 | 1682 | full | no |
| `interop-ots` | 1 | 604 | full | no |
| `public-interop-claim-maintenance-candidates` | 1 | 116 | full | no |
| `interop-mill-cards-signed-withdrawn` | 1 | 58 | full | no |
| `public-interop-claim-maintenance-outcomes` | 1 | 11 | full | no |
| `interop-mill-evidence-sample` | 40 | 1200 | full (per-file) | yes, of 2827 |
| `interop-mill-evidence-json-sample` | 38 | 38 | full (per-file) | yes, of 4924 |
| `interop-mill-evidence-json-v2-sample` | 2 | 2 | full (per-file) | yes, of 4924 |
| `proofs` | 7139 | 100 | stream100 | no |
| `public-interop-corrections-watch-signed` | 19 | 19 | full | no |
| `ots-upgraded-ots-upgrade` | 18 | 18 | full | no |
| `roots-root` | 2 | 2 | full | no |
| `root-json` | 1 | 1 | full | no |
| `prune-manifest` | 1 | 1 | full | no |
| `interop-mill-cards-signed-governance-retrieve` | 1 | 1 | full | no |
| `interop-mill-evidence-runtime-declarations-runtime-declarati` | 1 | 1 | full | no |
| `interop-mill-evidence-runtime-declarations-runtime-declarati-json` | 1 | 1 | full | no |
| `interop-mill-cards-unsigned-sample` | 8 | 8 | full (per-file) | yes, of 5951 |
| `cards-sample` | 7 | 7 | full (per-file) | yes, of 7139 |
| `interop-mill-evidence-runtime-declarations-sample` | 7 | 7 | full (per-file) | yes, of 35 |
| `public-interop-corrections-watch-sample` | 7 | 7 | full (per-file) | yes, of 22 |
| `interop-mill-cards-unsigned-v2-sample` | 6 | 6 | full (per-file) | yes, of 5951 |
| `interop-mill-cards-signed-sample` | 5 | 5 | full (per-file) | yes, of 3193 |
| `public-interop-corrections-watch-v2-sample` | 5 | 5 | full (per-file) | yes, of 22 |

## Notes / exclusions
- 13 smaller file groups not given configs (cap 25): interop/mill-evidence/runtime-declarations/runtime-declaration-hf.co_openbmb_MiniCPM5-2B-GGUF-Q8_0--detector-interop--1ce9810c8466.json, interop/mill-evidence/runtime-declarations/runtime-declaration-hf.co_openbmb_MiniCPM5-2B-GGUF-Q8_0--jail--05b10ce55648.json, interop/mill-evidence/runtime-declarations/runtime-declaration-hf.co_openbmb_MiniCPM5-2B-GGUF-Q8_0--machinery-conformity--9a55b2da248c.json, interop/mill-evidence/runtime-declarations/runtime-declaration-hf.co_openbmb_MiniCPM5-2B-GGUF-Q8_0--openness--052f97aeb25d.json, interop/mill-evidence/runtime-declarations/runtime-declaration-hf.co
- interop/mill-evidence/*.jsonl: 2827 files; schemas tested on 40; 1 distinct Arrow schemas; 40 files kept in 1 config(s); 0 unloadable
- interop/mill-evidence/*.json: 4924 files; schemas tested on 40; 2 distinct Arrow schemas; 40 files kept in 2 config(s); 0 unloadable
- cards/*.json: 7139 files; schemas tested on 40; 25 distinct Arrow schemas; 13 files kept in 3 config(s); 0 unloadable
- interop/mill-cards-unsigned/*.json: 5951 files; schemas tested on 40; 3 distinct Arrow schemas; 16 files kept in 3 config(s); 24 unloadable ({"HTTPStatusError: Client error '429 Too Many Requests' for url 'https:/": 24})
- interop/mill-cards-signed/*.json: 3193 files; schemas tested on 40; 6 distinct Arrow schemas; 8 files kept in 2 config(s); 28 unloadable ({"HTTPStatusError: Client error '429 Too Many Requests' for url 'https:/": 28})
- interop/mill-evidence/runtime-declarations/*.json: 35 files; schemas tested on 35; 4 distinct Arrow schemas; 10 files kept in 2 config(s); 23 unloadable ({"HTTPStatusError: Client error '429 Too Many Requests' for url 'https:/": 23})
- public/interop/corrections-watch/*.json: 22 files; schemas tested on 22; 2 distinct Arrow schemas; 12 files kept in 2 config(s); 10 unloadable ({"HTTPStatusError: Client error '429 Too Many Requests' for url 'https:/": 10})
- interop/*.json: 2 files; schemas tested on 2; 0 distinct Arrow schemas; 0 files kept in 0 config(s); 2 unloadable ({'ArrowInvalid: JSON parse error: The document is empty.': 1, 'ArrowInvalid: JSON parse error: Column() changed from object to string': 1})
- interop/ots/*.json: 2 files; schemas tested on 2; 1 distinct Arrow schemas; 1 files kept in 1 config(s); 1 unloadable ({'ArrowInvalid: JSON parse error: Column() changed from object to string': 1})
- 10 further configs dropped by cap

**Owner recommendation:** these file groups mix many nested JSON shapes (one object per file, keys vary between files). The configs above expose the largest schema-consistent subsets. For full viewer coverage, publish a normalised table (JSONL or Parquet with flat columns, nested parts as JSON strings) and point a config at it.
