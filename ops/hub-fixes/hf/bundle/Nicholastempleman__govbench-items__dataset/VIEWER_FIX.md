# Viewer fix notes: Nicholastempleman/govbench-items

Viewer status before: `{'preview': True, 'viewer': False, 'search': False, 'filter': False, 'statistics': False}`

Original failure: default/train: None; default/test: CastError

## Proposed configs (each loaded locally with `datasets` 5.2.0)

| config | files | rows loaded | method | partial |
|---|---|---|---|---|
| `govbench-items` | 1 | 193 | full | no |
| `results-defoneos-depth-items` | 1 | 23 | full | no |
| `results-robustness-depth-items` | 1 | 8 | full | no |
| `results-citation-accuracy` | 1 | 1 | full | no |
| `item-fingerprints` | 1 | 1 | full | no |
| `results-arena-analysis` | 1 | 1 | full | no |
| `results-arena-champion` | 1 | 1 | full | no |
| `results-arena-final` | 1 | 1 | full | no |
| `results-arena-full-results` | 1 | 1 | full | no |
| `results-arena-results` | 1 | 1 | full | no |
| `results-board-fingerprints` | 1 | 1 | full | no |
| `results-cad-analysis` | 1 | 1 | full | no |
| `results-capability-registry` | 1 | 1 | full | no |
| `results-care-gate-eval` | 1 | 1 | full | no |
| `results-care-gate-experiment` | 1 | 1 | full | no |
| `results-clan-ledger` | 1 | 1 | full | no |
| `results-eat-final-report` | 1 | 1 | full | no |
| `results-evaluation-scores` | 1 | 1 | full | no |
| `results-expanded-items` | 1 | 1 | full | no |
| `results-full-arena-results` | 1 | 1 | full | no |
| `results-govbench-results` | 1 | 1 | full | no |
| `results-kb-split` | 1 | 1 | full | no |
| `results-length-controlled-eval` | 1 | 1 | full | no |
| `results-mitosis` | 1 | 1 | full | no |
| `results-sample` | 2 | 2 | full (per-file) | yes, of 15 |

## Notes / exclusions
- excluded results/board_models_broken.json (list-nonobj)
- 14 smaller file groups not given configs (cap 25): results/n_eff.json, results/overnight_gates.json, results/overnight_improvement.json, results/overnight_run.json, results/overnight_state.json, results/prereg_retrieval_annex.json, results/regional_govbench.json, results/rescore_absence_dims.json, results/rescore_robustness.json, results/retrieval_bench.json, results/router_control.json, results/sov_benchmark_results.json, results/sov_kb.json, results/sov_space_drawings.json
- results/*.json: 15 files; schemas tested on 15; 10 distinct Arrow schemas; 4 files kept in 2 config(s); 3 unloadable ({"HTTPStatusError: Client error '429 Too Many Requests' for url 'https:/": 3})
- 1 further configs dropped by cap

**Owner recommendation:** these file groups mix many nested JSON shapes (one object per file, keys vary between files). The configs above expose the largest schema-consistent subsets. For full viewer coverage, publish a normalised table (JSONL or Parquet with flat columns, nested parts as JSON strings) and point a config at it.
