# Field reference: nicktempleman/gspc-arena-results

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `PROVENANCE_SIGNED.json`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-arena-results/PROVENANCE_SIGNED.json.

Top-level keys: `manifest`, `sig_ed25519`, `pubkey_ed25519`, `signer`, `alg`, `verify`, `c2pa_lib`.


## `arena_binom_12axes.json`

Top-level keys: `schema`, `generated`, `note`, `greenfields`, `models_seen`, `merged`, `note_scores`, `_render_note`.
Records under `greenfields`:

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 13/13 rows read; example: gspc-gov |
| `bench` | string | Observed type string; non-null in 13/13 rows read; example: GovBench |
| `axis` | string | Observed type string; non-null in 13/13 rows read; example: governance |
| `n` | integer | Observed type integer; non-null in 13/13 rows read; example: 237 |
| `lng` | numeric | Observed type numeric; non-null in 13/13 rows read; example: 4.37 |
| `lat` | numeric | Observed type numeric; non-null in 13/13 rows read; example: 44.44 |
| `seat` | string | Observed type string; non-null in 13/13 rows read; example: Brussels |
| `instrument` | string | Observed type string; non-null in 13/13 rows read; example: EU AI Act (Reg. 2024/1689) |
| `task` | string | Observed type string; non-null in 13/13 rows read; example: EU AI Act risk-tier classification |
| `macro_f1` | string | Observed type string; non-null in 0/13 rows read |
| `unparsed_rate` | numeric | Observed type numeric; non-null in 6/13 rows read; example: 0.0 |
| `status` | string | Observed type string; non-null in 13/13 rows read; example: MEASURED |
| `kaggle` | string | Observed type string; non-null in 9/13 rows read; example: gspc-govbench |
| `page` | string | Observed type string; non-null in 2/13 rows read; example: govbench |
| `marks` | string | Observed type string; non-null in 13/13 rows read; example: {"dataset": true, "card": true, "space": true, "spaceTool": … |
| `tool` | url | Observed type url; non-null in 11/13 rows read; example: https://huggingface.co/spaces/csoai/gspc-gov |
| `runs` | string | Observed type string; non-null in 12/13 rows read; example: [{"model": "sov34:latest", "harness": "measure_full.py", "ma… |
| `dropped_runs` | string | Observed type string; non-null in 6/13 rows read; example: [{"model": "sov34:latest", "harness": "measure_robust.py", "… |
| `measured_model` | string | Observed type string; non-null in 6/13 rows read; example: sov34:latest |
| `measured_harness` | string | Observed type string; non-null in 6/13 rows read; example: measure_full.py |
| `quotable` | boolean | Observed type boolean; non-null in 6/13 rows read; example: true |
| `score_value` | string | Observed type string; non-null in 12/13 rows read; example: 0.515 acc |
| `score_model` | string | Observed type string; non-null in 12/13 rows read; example: sov34 (full harness) |
| `score_ci95` | string | Observed type string; non-null in 12/13 rows read; example: [0.451, 0.578] |
| `score_provenance` | string | Observed type string; non-null in 12/13 rows read; example: re-measured full n |
| `metric` | string | Observed type string; non-null in 12/13 rows read; example: acc |
| `acc` | numeric | Observed type numeric; non-null in 12/13 rows read; example: 0.515 |
| `binom` | string | Observed type string; non-null in 13/13 rows read; example: {"k": 122, "n": 237, "p_hat": 0.5148, "wilson_ci95": [0.4514… |
| `note` | string | Observed type string; non-null in 1/13 rows read; example: 18 public scenarios < usable_n=30. Interval publishes when 1… |

## `clan_routing_DEFINITIVE.json`

Top-level keys: `routing_table`, `n_per_cell`, `models`, `sovereign_wins`, `axis_wins`, `via`, `note`.


## `clan_routing_table_FINAL.json`

Top-level keys: `routing_table`, `n_per_cell`, `sovereign_wins`, `axis_wins`, `via`, `note`, `falcon_wins`.


## `gsm8k_benchmark_agnostic_proof.json`

Top-level keys: `benchmark`, `type`, `n`, `scores`, `via`.


## `sov34_board.json`

TODO(owner): fields not obtainable anonymously.


## `sov_training_results.json`

TODO(owner): fields not obtainable anonymously.


## `sovereign_family_map.json`

TODO(owner): fields not obtainable anonymously.

