# Viewer fix notes: Nicholastempleman/govbench

Viewer status before: `{'preview': True, 'viewer': False, 'search': False, 'filter': False, 'statistics': False}`

Original failure: default/train: None; default/test: CastError

## Proposed configs (each loaded locally with `datasets` 5.2.0)

| config | files | rows loaded | method | partial |
|---|---|---|---|---|
| `govbench-compliance-scenarios` | 1 | 45 | full | no |
| `results-defoneos-depth-items` | 1 | 23 | full | no |
| `results-citation-accuracy` | 1 | 1 | full | no |
| `root-json` | 1 | 1 | full | no |
| `results-arena-analysis` | 1 | 1 | full | no |
| `results-arena-champion` | 1 | 1 | full | no |
| `results-arena-final` | 1 | 1 | full | no |
| `results-arena-full-results` | 1 | 1 | full | no |
| `results-arena-results` | 1 | 1 | full | no |
| `results-auto-run` | 1 | 1 | full | no |
| `results-board-fingerprints` | 1 | 1 | full | no |
| `results-board-preflight` | 1 | 1 | full | no |
| `results-cad-analysis` | 1 | 1 | full | no |
| `results-capability-registry` | 1 | 1 | full | no |
| `results-care-gate-eval` | 1 | 1 | full | no |
| `results-care-gate-experiment` | 1 | 1 | full | no |
| `results-clan-ledger` | 1 | 1 | full | no |
| `results-corpus-anchor` | 1 | 1 | full | no |
| `results-coverage-crosswalk` | 1 | 1 | full | no |
| `results-defbench` | 1 | 1 | full | no |
| `results-eat-final-report` | 1 | 1 | full | no |
| `results-evaluation-scores` | 1 | 1 | full | no |
| `results-sample` | 10 | 10 | full (per-file) | yes, of 26 |
| `control-sets` | 2 | 2 | full (per-file) | no |
| `control-sets-v2` | 1 | 1 | full (per-file) | no |

## Notes / exclusions
- excluded results/board_models_broken.json (list-nonobj)
- 14 smaller file groups not given configs (cap 25): results/expanded_items.json, results/full_arena_results.json, results/govbench_results.json, results/kb_split.json, results/layer_attribution.json, results/length_controlled_eval.json, results/mitosis.json, results/n_eff.json, results/ossbench.json, results/overnight_gates.json, results/overnight_improvement.json, results/overnight_run.json, results/overnight_state.json, results/pqcbench.json
- results/*.json: 26 files; schemas tested on 26; 3 distinct Arrow schemas; 10 files kept in 1 config(s); 14 unloadable ({"HTTPStatusError: Client error '429 Too Many Requests' for url 'https:/": 14})
- 2 further configs dropped by cap

**Owner recommendation:** these file groups mix many nested JSON shapes (one object per file, keys vary between files). The configs above expose the largest schema-consistent subsets. For full viewer coverage, publish a normalised table (JSONL or Parquet with flat columns, nested parts as JSON strings) and point a config at it.
