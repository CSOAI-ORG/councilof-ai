# Field reference: nicktempleman/csoai-gspc-mach

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `axis-live.jsonl`

| field | type | description |
|---|---|---|
| `axis` | string | Observed type string; non-null in 1/1 rows read; example: machinery-conformity |
| `family` | string | Observed type string; non-null in 1/1 rows read; example: gspc |
| `kind` | string | Observed type string; non-null in 1/1 rows read; example: model-comparison |
| `bench` | string | Observed type string; non-null in 1/1 rows read; example: MachBench |
| `task` | string | Observed type string; non-null in 1/1 rows read; example: Machinery Reg self-evolving safety-function classification (… |
| `n` | integer | Observed type integer; non-null in 1/1 rows read; example: 33 |
| `separation` | string | Observed type string; non-null in 1/1 rows read; example: UNTESTED |
| `fleet_mean` | numeric | Observed type numeric; non-null in 1/1 rows read; example: 0.349 |
| `mean_harm` | numeric | Observed type numeric; non-null in 1/1 rows read; example: 0.651 |
| `cvar05_harm` | string | Observed type string; non-null in 0/1 rows read |
| `status` | string | Observed type string; non-null in 1/1 rows read; example: MEASURED |
| `dataset` | string | Observed type string; non-null in 1/1 rows read; example: csoai/gspc-mach |
| `colour` | string | Observed type string; non-null in 1/1 rows read; example: #fb923c |
| `hue` | integer | Observed type integer; non-null in 1/1 rows read; example: 40 |
| `excluded_leader` | string | Observed type string; non-null in 1/1 rows read; example: llama3.2:3b (base model) |
| `public_leader_state` | string | Observed type string; non-null in 1/1 rows read; example: NO_SIGNED_CARD |
| `note` | string | Observed type string; non-null in 1/1 rows read; example: No public leader: this axis is measured as a fleet aggregate… |
| `excluded_note` | string | Observed type string; non-null in 1/1 rows read; example: This axis named an external base model as the point-leader b… |
| `measurement_note` | string | Observed type string; non-null in 1/1 rows read; example: A base model leads on points; TIE. Anchor: Machinery Reg (EU… |
| `dataset_url` | url | Observed type url; non-null in 1/1 rows read; example: https://huggingface.co/datasets/csoai/gspc-mach |
| `_as_of` | datetime | Observed type datetime; non-null in 1/1 rows read; example: 2026-09-04T04:33:29Z |
| `_source` | url | Observed type url; non-null in 1/1 rows read; example: https://councilof.ai/api/gspc |
| `_authority` | string | Observed type string; non-null in 1/1 rows read; example: the live GET is the authority; this file is a snapshot and m… |
| `_public_count` | string | Observed type string; non-null in 1/1 rows read; example: 22 axis · 22 measured |

## `items.jsonl`

| field | type | description |
|---|---|---|
| `case` | string | Observed type string; non-null in 33/34 rows read; example: An ML safety controller with self-evolving behaviour that ke… |
| `expected` | string | Observed type string; non-null in 33/34 rows read; example: PART_A |
| `anchor` | string | Observed type string; non-null in 33/34 rows read; example: Annex I (Reg 2023/1230) cat.5/6: ML self-evolving safety com… |
| `axis` | string | Observed type string; non-null in 33/34 rows read; example: machinery |
| `source` | string | Observed type string; non-null in 33/34 rows read; example: csoai-authored-VERIFIED |
| `verified_against` | string | Observed type string; non-null in 33/34 rows read; example: EUR-Lex CELEX 32023R1230 Annex I, fetched 2026-08-05 |
| `_canary` | string | Observed type string; non-null in 1/34 rows read; example: GSPC-CANARY-GUID machinery-csoai-2026 |

## `mach.json`

Top-level keys: `schema`, `record_type`, `not_a_certification`, `endorsement`, `authored_by`, `basis`, `axis`, `model`, `measured`, `n`, `wilson95`, `bank`, `never`, `opinion_framing`, `witnessed_at`, `content_id`, `signature`, `pubkey`, `key_id`, `verification_method`, `did_resolver`.


## `machbench-draft.json`

Top-level keys: `schema`, `bench`, `axis`, `status`, `built`, `instrument`, `applies_from`, `task`, `labels`, `n_scored`, `n_disputed`, `rule`, `legal_basis`, `caveats`, `items`.
Records under `items`:

| field | type | description |
|---|---|---|
| `case` | string | Observed type string; non-null in 19/19 rows read; example: A bipedal warehouse robot runs a reinforcement-learned balan… |
| `expected` | string | Observed type string; non-null in 19/19 rows read; example: PART_A |
| `anchor` | string | Observed type string; non-null in 19/19 rows read; example: Annex I Part A item 6; Recital 54 |
| `basis` | string | Observed type string; non-null in 19/19 rows read; example: Ensures a safety function (falls onto persons), machine lear… |

## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 8/8 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 7/8 rows read; example: 2017 |
| `sha` | string | Observed type string; non-null in 7/8 rows read; example: e66b0b7a8c75070c4852e4370a8de3b752f98d18 |
| `ext` | string | Observed type string; non-null in 8/8 rows read; example: md |
| `url` | url | Observed type url; non-null in 8/8 rows read; example: https://huggingface.co/datasets/csoai/gspc-mach/resolve/main… |
| `repo` | string | Observed type string; non-null in 8/8 rows read; example: csoai/gspc-mach |
| `as_of` | datetime | Observed type datetime; non-null in 8/8 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 8/8 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-mach/tree/mai… |

## `meta.json`

Top-level keys: `schema`, `bench`, `axis`, `status`, `built`, `instrument`, `applies_from`, `task`, `labels`, `n_scored`, `n_disputed`, `rule`, `legal_basis`, `caveats`.


## `results_2026-08-11.json`

Top-level keys: `benchmark`, `harness`, `generated_utc`, `models`, `n`, `quotable`, `results`.

