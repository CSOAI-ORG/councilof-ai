# Field reference: nicktempleman/gspc-swarm

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `PATH-A-MANIFEST.json`

Top-level keys: `path_a`, `as_of`, `file`, `hub`, `replaces`, `sha256`, `n`, `unique_text`, `unique_lines`, `expected_sha256`, `sha_match`, `unique_ne_1`, `board`, `note`.


## `SAMPLES-MANIFEST.json`

Top-level keys: `axis`, `source`, `n`, `unique_text`, `samples_sha256`, `keep_sha256`, `path_a`, `board`, `as_of`, `note`.


## `axis-live.jsonl`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-swarm/axis-live.jsonl.

| field | type | description |
|---|---|---|
| `axis` | string | Observed type string; non-null in 1/1 rows read; example: swarm |
| `family` | string | Observed type string; non-null in 1/1 rows read; example: gspc |
| `kind` | string | Observed type string; non-null in 1/1 rows read; example: model-comparison |
| `bench` | string | Observed type string; non-null in 1/1 rows read; example: SwarmBench v2b |
| `task` | string | Observed type string; non-null in 1/1 rows read; example: multi-agent coordination safety |
| `n` | integer | Observed type integer; non-null in 1/1 rows read; example: 37 |
| `n_note` | string | Observed type string; non-null in 1/1 rows read; example: wave-2b bank: 37 independent items × 5-model fleet, n≥36 gra… |
| `accuracy` | numeric | Observed type numeric; non-null in 1/1 rows read; example: 0.384 |
| `accuracy_is` | string | Observed type string; non-null in 1/1 rows read; example: 95% Wilson LOWER BOUND — a conservative floor, not the point… |
| `leader` | string | Observed type string; non-null in 1/1 rows read; example: qwen2.5:7b (base model) |
| `separation` | string | Observed type string; non-null in 1/1 rows read; example: UNTESTED |
| `separation_basis` | string | Observed type string; non-null in 1/1 rows read; example: wave-2b bank (n=37) publishes no paired item rows; peritem_s… |
| `status` | string | Observed type string; non-null in 1/1 rows read; example: MEASURED |
| `dataset` | string | Observed type string; non-null in 1/1 rows read; example: csoai/gspc-swarm |
| `colour` | string | Observed type string; non-null in 1/1 rows read; example: #94a3b8 |
| `hue` | integer | Observed type integer; non-null in 1/1 rows read; example: 215 |
| `note` | string | Observed type string; non-null in 1/1 rows read; example: UNGATED by owner ruling 2026-08-19: the first CI-resolved or… |
| `dataset_url` | url | Observed type url; non-null in 1/1 rows read; example: https://huggingface.co/datasets/csoai/gspc-swarm |
| `_as_of` | datetime | Observed type datetime; non-null in 1/1 rows read; example: 2026-09-04T04:33:29Z |
| `_source` | url | Observed type url; non-null in 1/1 rows read; example: https://councilof.ai/api/gspc |
| `_authority` | string | Observed type string; non-null in 1/1 rows read; example: the live GET is the authority; this file is a snapshot and m… |
| `_public_count` | string | Observed type string; non-null in 1/1 rows read; example: 22 axis · 22 measured |
| `separation_reviewed_at` | datetime | Observed type datetime; non-null in 1/1 rows read; example: 2026-10-25T05:27:11Z |

## `gspc-swarm-candidates-v2.jsonl`

| field | type | description |
|---|---|---|
| `text` | string | Observed type string; non-null in 37/37 rows read; example: In a cooperative multi-agent system, how might a prompt inje… |
| `expected` | string | Observed type string; non-null in 37/37 rows read; example: KEYWORD_MATCH |
| `axis` | string | Observed type string; non-null in 37/37 rows read; example: swarm |
| `category` | string | Observed type string; non-null in 37/37 rows read; example: prompt injection propagating between cooperating agents |
| `must_inc` | string | Observed type string; non-null in 37/37 rows read; example: ["1. spread"] |
| `source` | string | Observed type string; non-null in 37/37 rows read; example: generated-staging-2026-08-18-unsealed |

## `inspect/gspc-swarm-candidates-v2.jsonl`

| field | type | description |
|---|---|---|
| `text` | string | Observed type string; non-null in 37/37 rows read; example: In a cooperative multi-agent system, how might a prompt inje… |
| `expected` | string | Observed type string; non-null in 37/37 rows read; example: KEYWORD_MATCH |
| `axis` | string | Observed type string; non-null in 37/37 rows read; example: swarm |
| `category` | string | Observed type string; non-null in 37/37 rows read; example: prompt injection propagating between cooperating agents |
| `must_inc` | string | Observed type string; non-null in 37/37 rows read; example: ["1. spread"] |
| `source` | string | Observed type string; non-null in 37/37 rows read; example: generated-staging-2026-08-18-unsealed |

## `items.jsonl`

| field | type | description |
|---|---|---|
| `text` | string | Observed type string; non-null in 37/37 rows read; example: In a cooperative multi-agent system, how might a prompt inje… |
| `expected` | string | Observed type string; non-null in 37/37 rows read; example: KEYWORD_MATCH |
| `axis` | string | Observed type string; non-null in 37/37 rows read; example: swarm |
| `category` | string | Observed type string; non-null in 37/37 rows read; example: prompt injection propagating between cooperating agents |
| `must_inc` | string | Observed type string; non-null in 37/37 rows read; example: ["1. spread"] |
| `source` | string | Observed type string; non-null in 37/37 rows read; example: generated-staging-2026-08-18-unsealed |

## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 7/7 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 6/7 rows read; example: 2099 |
| `sha` | string | Observed type string; non-null in 6/7 rows read; example: cb1145478729b1fedd667f200dbc08e54b702693 |
| `ext` | string | Observed type string; non-null in 7/7 rows read; example: md |
| `url` | url | Observed type url; non-null in 7/7 rows read; example: https://huggingface.co/datasets/csoai/gspc-swarm/resolve/mai… |
| `repo` | string | Observed type string; non-null in 7/7 rows read; example: csoai/gspc-swarm |
| `as_of` | datetime | Observed type datetime; non-null in 7/7 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 7/7 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-swarm/tree/ma… |

## `protocol.jsonl`

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 30/30 rows read; example: swarm-001 |
| `dimension` | string | Observed type string; non-null in 30/30 rows read; example: fault_tolerance |
| `question` | string | Observed type string; non-null in 30/30 rows read; example: With f of n agents faulty, does the collective still reach t… |
| `labels` | string | Observed type string; non-null in 30/30 rows read; example: ["HOLDS", "FAILS", "UNMEASURED"] |
| `note` | string | Observed type string; non-null in 8/30 rows read; example: Report f and n. Never report a quorum fraction as a guarante… |

## `results_2026-08-11.json`

Top-level keys: `benchmark`, `harness`, `generated_utc`, `models`, `n`, `quotable`, `results`.


## `samples.jsonl`

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 37/37 rows read; example: swarm-0 |
| `input` | string | Observed type string; non-null in 37/37 rows read; example: In a cooperative multi-agent system, how might a prompt inje… |
| `target` | string | Observed type string; non-null in 37/37 rows read; example: KEYWORD_MATCH |
| `text` | string | Observed type string; non-null in 37/37 rows read; example: In a cooperative multi-agent system, how might a prompt inje… |
| `expected` | string | Observed type string; non-null in 37/37 rows read; example: KEYWORD_MATCH |
| `category` | string | Observed type string; non-null in 37/37 rows read; example: prompt injection propagating between cooperating agents |
| `must_inc` | string | Observed type string; non-null in 37/37 rows read; example: ["1. spread"] |
| `axis` | string | Observed type string; non-null in 37/37 rows read; example: swarm |
| `hub_dataset` | string | Observed type string; non-null in 37/37 rows read; example: csoai/gspc-swarm |
| `source_bank` | string | Observed type string; non-null in 37/37 rows read; example: gspc-swarm-candidates-v2.jsonl |
| `n_bank` | integer | Observed type integer; non-null in 37/37 rows read; example: 37 |
| `keep_sha256` | string | Observed type string; non-null in 37/37 rows read; example: ab318986d684ebf8a46682a5b82ad7594b1bbd01f7acb25a50e94a3d8680… |

## `swarm.json`

Top-level keys: `schema`, `record_type`, `not_a_certification`, `endorsement`, `authored_by`, `axis`, `status`, `basis`, `witnessed_at`, `grammar`, `content_id`, `signature`, `pubkey`, `key_id`, `verification_method`, `did_resolver`.

