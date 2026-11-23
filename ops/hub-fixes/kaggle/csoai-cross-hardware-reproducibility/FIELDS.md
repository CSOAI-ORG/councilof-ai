# Field reference: nicktempleman/csoai-cross-hardware-reproducibility

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `capsules/batch1/capsules.jsonl`

TODO(owner): fields not obtainable anonymously.


## `capsules/batch1/record.json`

Top-level keys: `schema`, `as_of`, `capsule_schema`, `adapter`, `kind`, `n_capsules`, `states`, `merkle_root`, `merkle`, `canonicalisation`, `capsules_file`, `authority_state`, `what_this_is`, `what_this_is_not`, `source`, `private_until`.


## `capsules/batch1/record.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`.


## `capsules/batch2/capsules.jsonl`

TODO(owner): fields not obtainable anonymously.


## `capsules/batch2/record.json`

Top-level keys: `schema`, `as_of`, `capsule_schema`, `adapter`, `kind`, `n_capsules`, `states`, `merkle_root`, `merkle`, `canonicalisation`, `capsules_file`, `authority_state`, `what_this_is`, `what_this_is_not`, `source`, `private_until`.


## `capsules/batch2/record.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`.


## `data/cards.jsonl`

| field | type | description |
|---|---|---|
| `batch` | string | Observed type string; non-null in 154/154 rows read; example: batch1 |
| `card_id` | string | Observed type string; non-null in 154/154 rows read; example: 1c8b971b47e9c7f8f6b53d2b4a2b4697edc9927fbf6419ff05e42dfe2691… |
| `card_file` | string | Observed type string; non-null in 154/154 rows read; example: signed-affect-1c8b971b47e9.json |
| `model` | string | Observed type string; non-null in 154/154 rows read; example: mistral-nemo:12b |
| `model_digest` | string | Observed type string; non-null in 154/154 rows read; example: sha256:e7e06d107c6c86ed0cf45445f1790720b5092149c4c95f4d96584… |
| `axis` | string | Observed type string; non-null in 154/154 rows read; example: affect |
| `bank_sha256` | string | Observed type string; non-null in 154/154 rows read; example: c64a5986bf807127c047344178262fade96dfaf856f555aa8bc1b79e0cee… |
| `instrument_sha256` | string | Observed type string; non-null in 154/154 rows read; example: 4f18ed4164d48b01b3f6dcc45202f8fb6a85860c73457320561676e4af91… |
| `declaration_file` | string | Observed type string; non-null in 154/154 rows read; example: declarations/runtime-declaration-affect.json |
| `declaration_sha256` | string | Observed type string; non-null in 154/154 rows read; example: ff07c6fd37df1ab0dbe6dda926be8265b96711b8c66fccf7aa28999547ee… |
| `run_id_rtx3090` | string | Observed type string; non-null in 154/154 rows read; example: 20260924T161149.012760Z-631ffb8784 |
| `run_id_t4_run1` | string | Observed type string; non-null in 154/154 rows read; example: 20260926T041433.450961Z-aa66e041c3 |
| `run_id_t4_run2` | string | Observed type string; non-null in 150/154 rows read; example: 20260926T042633.327385Z-40c47c7f92 |
| `counts_rtx3090` | string | Observed type string; non-null in 154/154 rows read; example: {"attempted": 41, "correct": 19, "graded_n": 36, "parse_erro… |
| `counts_t4_run1` | string | Observed type string; non-null in 154/154 rows read; example: {"attempted": 41, "correct": 20, "graded_n": 37, "parse_erro… |
| `counts_t4_run2` | string | Observed type string; non-null in 150/154 rows read; example: {"attempted": 41, "correct": 20, "graded_n": 37, "parse_erro… |
| `n_items` | integer | Observed type integer; non-null in 154/154 rows read; example: 41 |
| `raw_equal` | integer | Observed type integer; non-null in 154/154 rows read; example: 40 |
| `label_equal` | integer | Observed type integer; non-null in 154/154 rows read; example: 40 |
| `grade_equal` | integer | Observed type integer; non-null in 154/154 rows read; example: 40 |
| `status_equal` | integer | Observed type integer; non-null in 154/154 rows read; example: 40 |
| `flips_up` | integer | Observed type integer; non-null in 154/154 rows read; example: 1 |
| `flips_down` | integer | Observed type integer; non-null in 154/154 rows read; example: 0 |
| `swaps` | integer | Observed type integer; non-null in 154/154 rows read; example: 0 |
| `totals_equal` | boolean | Observed type boolean; non-null in 154/154 rows read; example: false |
| `grade_equal_every_item` | boolean | Observed type boolean; non-null in 154/154 rows read; example: false |
| `admitted_counts_only_rule` | boolean | Observed type boolean; non-null in 154/154 rows read; example: false |
| `admitted_item_level_rule` | boolean | Observed type boolean; non-null in 154/154 rows read; example: false |
| `flip_item_ids` | string | Observed type string; non-null in 154/154 rows read; example: ["item-000019-4bf6a62d1397"] |
| `swap_item_ids` | string | Observed type string; non-null in 154/154 rows read; example: ["item-000004-0ff227364a64", "item-000140-443c299ef54a"] |
| `repeat_raw_equal` | integer | Observed type integer; non-null in 150/154 rows read; example: 41 |
| `repeat_grade_equal` | integer | Observed type integer; non-null in 150/154 rows read; example: 41 |
| `repeat_totals_equal` | boolean | Observed type boolean; non-null in 150/154 rows read; example: true |

## `data/items.jsonl`

| field | type | description |
|---|---|---|
| `batch` | string | Observed type string; non-null in 5000/5000 rows read; example: batch1 |
| `card_id` | string | Observed type string; non-null in 5000/5000 rows read; example: 1c8b971b47e9c7f8f6b53d2b4a2b4697edc9927fbf6419ff05e42dfe2691… |
| `model` | string | Observed type string; non-null in 5000/5000 rows read; example: mistral-nemo:12b |
| `model_digest` | string | Observed type string; non-null in 5000/5000 rows read; example: sha256:e7e06d107c6c86ed0cf45445f1790720b5092149c4c95f4d96584… |
| `axis` | string | Observed type string; non-null in 5000/5000 rows read; example: affect |
| `bank_sha256` | string | Observed type string; non-null in 5000/5000 rows read; example: c64a5986bf807127c047344178262fade96dfaf856f555aa8bc1b79e0cee… |
| `instrument_sha256` | string | Observed type string; non-null in 5000/5000 rows read; example: 4f18ed4164d48b01b3f6dcc45202f8fb6a85860c73457320561676e4af91… |
| `item_id` | string | Observed type string; non-null in 5000/5000 rows read; example: item-000001-3afb872d800b |
| `sequence` | integer | Observed type integer; non-null in 5000/5000 rows read; example: 1 |
| `prompt_sha256` | string | Observed type string; non-null in 5000/5000 rows read; example: efcf0ad87604d9e845c77e685f1ddd7f2b7d5c332785ab6b1b7939c53218… |
| `predicate` | string | Observed type string; non-null in 5000/5000 rows read; example: EXACT_LABEL |
| `expected` | string | Observed type string; non-null in 5000/5000 rows read; example: PROHIBITED |
| `rtx3090_run_id` | string | Observed type string; non-null in 5000/5000 rows read; example: 20260924T161149.012760Z-631ffb8784 |
| `rtx3090_raw_output` | string | Observed type string; non-null in 5000/5000 rows read; example: PROHIBITED |
| `rtx3090_raw_output_sha256` | string | Observed type string; non-null in 5000/5000 rows read; example: aa3b4c8e61087a4214bb8772d010668b0f17a65daf7421e789edf292cd5d… |
| `rtx3090_parsed_label` | string | Observed type string; non-null in 3862/5000 rows read; example: PROHIBITED |
| `rtx3090_grade` | boolean | Observed type boolean; non-null in 5000/5000 rows read; example: true |
| `rtx3090_status` | string | Observed type string; non-null in 5000/5000 rows read; example: correct |
| `rtx3090_done_reason` | string | Observed type string; non-null in 5000/5000 rows read; example: stop |
| `t4_run1_run_id` | string | Observed type string; non-null in 5000/5000 rows read; example: 20260926T041433.450961Z-aa66e041c3 |
| `t4_run1_raw_output` | string | Observed type string; non-null in 5000/5000 rows read; example: PROHIBITED |
| `t4_run1_raw_output_sha256` | string | Observed type string; non-null in 5000/5000 rows read; example: aa3b4c8e61087a4214bb8772d010668b0f17a65daf7421e789edf292cd5d… |
| `t4_run1_parsed_label` | string | Observed type string; non-null in 3865/5000 rows read; example: PROHIBITED |
| `t4_run1_grade` | boolean | Observed type boolean; non-null in 5000/5000 rows read; example: true |
| `t4_run1_status` | string | Observed type string; non-null in 5000/5000 rows read; example: correct |
| `t4_run1_done_reason` | string | Observed type string; non-null in 5000/5000 rows read; example: stop |
| `t4_run2_run_id` | string | Observed type string; non-null in 4452/5000 rows read; example: 20260926T042633.327385Z-40c47c7f92 |
| `t4_run2_raw_output` | string | Observed type string; non-null in 4452/5000 rows read; example: PROHIBITED |
| `t4_run2_raw_output_sha256` | string | Observed type string; non-null in 4452/5000 rows read; example: aa3b4c8e61087a4214bb8772d010668b0f17a65daf7421e789edf292cd5d… |
| `t4_run2_parsed_label` | string | Observed type string; non-null in 3350/5000 rows read; example: PROHIBITED |
| `t4_run2_grade` | boolean | Observed type boolean; non-null in 4452/5000 rows read; example: true |
| `t4_run2_status` | string | Observed type string; non-null in 4452/5000 rows read; example: correct |
| `t4_run2_done_reason` | string | Observed type string; non-null in 4452/5000 rows read; example: stop |
| `xhw_raw_equal` | boolean | Observed type boolean; non-null in 5000/5000 rows read; example: true |
| `xhw_label_equal` | boolean | Observed type boolean; non-null in 5000/5000 rows read; example: true |
| `xhw_grade_equal` | boolean | Observed type boolean; non-null in 5000/5000 rows read; example: true |
| `xhw_status_equal` | boolean | Observed type boolean; non-null in 5000/5000 rows read; example: true |
| `xhw_flip` | string | Observed type string; non-null in 139/5000 rows read; example: up |
| `repeat_raw_equal` | boolean | Observed type boolean; non-null in 4452/5000 rows read; example: true |
| `repeat_grade_equal` | boolean | Observed type boolean; non-null in 4452/5000 rows read; example: true |
| `repeat_status_equal` | boolean | Observed type boolean; non-null in 4452/5000 rows read; example: true |

## `data/runtimes.jsonl`

| field | type | description |
|---|---|---|
| `card_id` | string | Observed type string; non-null in 458/458 rows read; example: 1c8b971b47e9c7f8f6b53d2b4a2b4697edc9927fbf6419ff05e42dfe2691… |
| `run` | string | Observed type string; non-null in 458/458 rows read; example: rtx3090 |
| `run_id` | string | Observed type string; non-null in 458/458 rows read; example: 20260924T161149.012760Z-631ffb8784 |
| `substrate` | string | Observed type string; non-null in 458/458 rows read; example: RunPod RTX 3090 pod fpowppss5ngtkw |
| `gpu` | string | Observed type string; non-null in 458/458 rows read; example: NVIDIA RTX 3090 (count UNRECORDED) |
| `driver` | string | Observed type string; non-null in 458/458 rows read; example: UNRECORDED |
| `ollama` | string | Observed type string; non-null in 458/458 rows read; example: client 0.33.0 (binary /workspace/ollama on the pod, read 202… |
| `flash_attention` | string | Observed type string; non-null in 458/458 rows read; example: UNRECORDED |
| `docker_image` | string | Observed type string; non-null in 458/458 rows read; example: UNRECORDED |
| `bundle_sha256` | string | Observed type string; non-null in 308/458 rows read; example: e15209d2f49705e10d06201cd6c0659d40c4ccf47bf828dd08f99f9d5620… |
| `code_commit` | string | Observed type string; non-null in 304/458 rows read; example: fd80a903694552839ca8465851fdc8d6a9b1f022 |
| `decode` | string | Observed type string; non-null in 304/458 rows read; example: {"keyword_max_tokens": 1024, "max_tokens": 128, "seed": 0, "… |

## `data/withheld.jsonl`


## `declarations/runtime-declaration-affect.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 41/41 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 41/41 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 41/41 rows read; example: item-000001-3afb872d800b |
| `parsed_label` | string | Observed type string; non-null in 37/41 rows read; example: PROHIBITED |
| `prompt_sha256` | string | Observed type string; non-null in 41/41 rows read; example: efcf0ad87604d9e845c77e685f1ddd7f2b7d5c332785ab6b1b7939c53218… |
| `raw_output_sha256` | string | Observed type string; non-null in 41/41 rows read; example: aa3b4c8e61087a4214bb8772d010668b0f17a65daf7421e789edf292cd5d… |
| `sequence` | integer | Observed type integer; non-null in 41/41 rows read; example: 1 |

## `declarations/runtime-declaration-art5-safeguard.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 36/36 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 36/36 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 36/36 rows read; example: item-000001-339f2c0417c3 |
| `parsed_label` | string | Observed type string; non-null in 36/36 rows read; example: PERMITTED |
| `prompt_sha256` | string | Observed type string; non-null in 36/36 rows read; example: 1327aa76d7f280151ab772292d62369bedae231ce325d0711faea431f4a0… |
| `raw_output_sha256` | string | Observed type string; non-null in 36/36 rows read; example: 83824ff28dafc888808d5f42def724b7ee0dcdd3d0126ac71e7434af0013… |
| `sequence` | integer | Observed type integer; non-null in 36/36 rows read; example: 1 |

## `declarations/runtime-declaration-care.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 199/199 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 199/199 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 199/199 rows read; example: item-000001-31f7e72083c7 |
| `parsed_label` | string | Observed type string; non-null in 181/199 rows read; example: 0 |
| `prompt_sha256` | string | Observed type string; non-null in 199/199 rows read; example: 6f5b7e6127bcc306e895575119a4a500c886692d87e88457f2f85cd98334… |
| `raw_output_sha256` | string | Observed type string; non-null in 199/199 rows read; example: 5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb… |
| `sequence` | integer | Observed type integer; non-null in 199/199 rows read; example: 1 |

## `declarations/runtime-declaration-conformance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 35/35 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 35/35 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 35/35 rows read; example: item-000001-318a1aabe43e |
| `parsed_label` | string | Observed type string; non-null in 35/35 rows read; example: VIOLATES |
| `prompt_sha256` | string | Observed type string; non-null in 35/35 rows read; example: ecf69b5031e5dd84e1c39146895eeca2563ffab57b75169a7f34a4ee30da… |
| `raw_output_sha256` | string | Observed type string; non-null in 35/35 rows read; example: 666803c08bc9f7ea41c29557653157727339856fc52afeabbe0aa9244daf… |
| `sequence` | integer | Observed type integer; non-null in 35/35 rows read; example: 1 |

## `declarations/runtime-declaration-continuity.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-a712d3ea4465 |
| `parsed_label` | string | Observed type string; non-null in 33/33 rows read; example: QUANTUM_VULNERABLE |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 318545465273df9011a1c4f2767c99592a6754abc8fc3282b5123d7b4b61… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 51e8994d20431cba294b7d167730664b4c4e5b07e8c4d85cef9909b97db1… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-cross-reality.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-62179f0578a2 |
| `parsed_label` | string | Observed type string; non-null in 32/32 rows read; example: REFUSE |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: e4496c09b5ce294ecf24989393e5a5a1f00230c5af9c239e86641dd61048… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 9092bec2ae8859f01e5a0d6e8994f90d4f0bb21b3604b77743b8804dd271… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-detector-interop.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-5399cdd4d65c |
| `parsed_label` | string | Observed type string; non-null in 33/33 rows read; example: INTEROPERABLE |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 5bf1540ad2f3a34e819b10c41f47752e7c6d9ca2c68c80defda983a1a239… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 3eb869b3016260f89b6d86287ed3bb91e7fd4663289dab085ffba243a5ec… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-12b--affect.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 41/41 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 41/41 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 41/41 rows read; example: item-000001-3afb872d800b |
| `parsed_label` | string | Observed type string; non-null in 41/41 rows read; example: PROHIBITED |
| `prompt_sha256` | string | Observed type string; non-null in 41/41 rows read; example: efcf0ad87604d9e845c77e685f1ddd7f2b7d5c332785ab6b1b7939c53218… |
| `raw_output_sha256` | string | Observed type string; non-null in 41/41 rows read; example: aa3b4c8e61087a4214bb8772d010668b0f17a65daf7421e789edf292cd5d… |
| `sequence` | integer | Observed type integer; non-null in 41/41 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-12b--art5-safeguard.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 36/36 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 36/36 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 36/36 rows read; example: item-000001-339f2c0417c3 |
| `parsed_label` | string | Observed type string; non-null in 36/36 rows read; example: PERMITTED |
| `prompt_sha256` | string | Observed type string; non-null in 36/36 rows read; example: 1327aa76d7f280151ab772292d62369bedae231ce325d0711faea431f4a0… |
| `raw_output_sha256` | string | Observed type string; non-null in 36/36 rows read; example: 83824ff28dafc888808d5f42def724b7ee0dcdd3d0126ac71e7434af0013… |
| `sequence` | integer | Observed type integer; non-null in 36/36 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-12b--care.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 199/199 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 199/199 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 199/199 rows read; example: item-000001-31f7e72083c7 |
| `parsed_label` | string | Observed type string; non-null in 167/199 rows read; example: 0 |
| `prompt_sha256` | string | Observed type string; non-null in 199/199 rows read; example: 6f5b7e6127bcc306e895575119a4a500c886692d87e88457f2f85cd98334… |
| `raw_output_sha256` | string | Observed type string; non-null in 199/199 rows read; example: 5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb… |
| `sequence` | integer | Observed type integer; non-null in 199/199 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-12b--conformance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 35/35 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 35/35 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 35/35 rows read; example: item-000001-318a1aabe43e |
| `parsed_label` | string | Observed type string; non-null in 35/35 rows read; example: VIOLATES |
| `prompt_sha256` | string | Observed type string; non-null in 35/35 rows read; example: ecf69b5031e5dd84e1c39146895eeca2563ffab57b75169a7f34a4ee30da… |
| `raw_output_sha256` | string | Observed type string; non-null in 35/35 rows read; example: 666803c08bc9f7ea41c29557653157727339856fc52afeabbe0aa9244daf… |
| `sequence` | integer | Observed type integer; non-null in 35/35 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-12b--continuity.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-a712d3ea4465 |
| `parsed_label` | string | Observed type string; non-null in 33/33 rows read; example: QUANTUM_VULNERABLE |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 318545465273df9011a1c4f2767c99592a6754abc8fc3282b5123d7b4b61… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 51e8994d20431cba294b7d167730664b4c4e5b07e8c4d85cef9909b97db1… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-12b--cross-reality.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-62179f0578a2 |
| `parsed_label` | string | Observed type string; non-null in 32/32 rows read; example: REFUSE |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: e4496c09b5ce294ecf24989393e5a5a1f00230c5af9c239e86641dd61048… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 9092bec2ae8859f01e5a0d6e8994f90d4f0bb21b3604b77743b8804dd271… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-12b--detector-interop.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-5399cdd4d65c |
| `parsed_label` | string | Observed type string; non-null in 33/33 rows read; example: DIVERGENT |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 5bf1540ad2f3a34e819b10c41f47752e7c6d9ca2c68c80defda983a1a239… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: b38e628bc33598b52e73c8f9477374f37da602d0484d8348f8e05145ef24… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-12b--governance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 237/237 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 237/237 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 237/237 rows read; example: item-000001-b20ea2bce63d |
| `parsed_label` | string | Observed type string; non-null in 237/237 rows read; example: HIGH_RISK |
| `prompt_sha256` | string | Observed type string; non-null in 237/237 rows read; example: 4b12952f90a6923b3813ca9b1287741e3dcd9f678de119d19ba338664dd1… |
| `raw_output_sha256` | string | Observed type string; non-null in 237/237 rows read; example: 5eb95ba9ff576cf151b9b45ae91eb05ef775bf5cc99c8f8d6c2d10ea32e9… |
| `sequence` | integer | Observed type integer; non-null in 237/237 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-12b--jail.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 71/71 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 71/71 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 71/71 rows read; example: esc-sh-1 |
| `parsed_label` | string | Observed type string; non-null in 71/71 rows read; example: BENIGN |
| `prompt_sha256` | string | Observed type string; non-null in 71/71 rows read; example: 5e58844bc5e39033e1ab26e77693afe243268fe031cc8a5367afc4f13d83… |
| `raw_output_sha256` | string | Observed type string; non-null in 71/71 rows read; example: ebca9a34b4a863de6f32b616d011e6961890d7cf6f89f69d77fd83a20bc8… |
| `sequence` | integer | Observed type integer; non-null in 71/71 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-12b--machinery-conformity.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-c6b796e6f63b |
| `parsed_label` | string | Observed type string; non-null in 33/33 rows read; example: PART_A |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: dd1e790ab87076457dcae924cd5080ff0de8dc28628479636beb82e93a64… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 2710bb19fd6a522459ea75ffcc783487b721d6093accd20f2271c202b57a… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-12b--openness.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-5096155e7eae |
| `parsed_label` | string | Observed type string; non-null in 32/32 rows read; example: PERMITTED |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 725d83b877198a6c47c6dc05fa8ebd24035f7a205c84d11b05b10af24914… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 83824ff28dafc888808d5f42def724b7ee0dcdd3d0126ac71e7434af0013… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-12b--provenance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-d2df06a02411 |
| `parsed_label` | string | Observed type string; non-null in 32/32 rows read; example: SURVIVES |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 74e895b4d741ebf246e2974717b202b61d1e6a0d8261e972d82d377fea89… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 7cbcfd688ae0099f2de7186e0fb132b03a4cc7e5fea569bd5fdce6e7863d… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-12b--safety.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 36/36 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 36/36 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 36/36 rows read; example: item-000001-36490af58e30 |
| `parsed_label` | string | Observed type string; non-null in 32/36 rows read; example: COMPLY |
| `prompt_sha256` | string | Observed type string; non-null in 36/36 rows read; example: c10fbe77e5730081de430517e5aa214d37bef436bd1bc7d048bf6ef479a7… |
| `raw_output_sha256` | string | Observed type string; non-null in 36/36 rows read; example: fb5a86e96380911adb71733d652c60803b49e45848e1e1d5c72327777912… |
| `sequence` | integer | Observed type integer; non-null in 36/36 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-12b--swarm.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 37/37 rows read; example: length |
| `grade` | boolean | Observed type boolean; non-null in 37/37 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 37/37 rows read; example: item-000001-904adcf6c8a5 |
| `parsed_label` | string | Observed type string; non-null in 0/37 rows read |
| `prompt_sha256` | string | Observed type string; non-null in 37/37 rows read; example: 904adcf6c8a57162a86d0046d8a38c5bc28b691b0685a193f5001805c6ba… |
| `raw_output_sha256` | string | Observed type string; non-null in 37/37 rows read; example: e6de767c896408c934de559d5868b924270a9ea404a2ba85fdc26ff0104a… |
| `sequence` | integer | Observed type integer; non-null in 37/37 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-4b--affect.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 41/41 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 41/41 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 41/41 rows read; example: item-000001-3afb872d800b |
| `parsed_label` | string | Observed type string; non-null in 40/41 rows read; example: DISCLOSE |
| `prompt_sha256` | string | Observed type string; non-null in 41/41 rows read; example: efcf0ad87604d9e845c77e685f1ddd7f2b7d5c332785ab6b1b7939c53218… |
| `raw_output_sha256` | string | Observed type string; non-null in 41/41 rows read; example: 3dd9126ae556cc18112f5122bec68649e6e33689e1057259bf465e945b7e… |
| `sequence` | integer | Observed type integer; non-null in 41/41 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-4b--art5-safeguard.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 36/36 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 36/36 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 36/36 rows read; example: item-000001-339f2c0417c3 |
| `parsed_label` | string | Observed type string; non-null in 36/36 rows read; example: PERMITTED |
| `prompt_sha256` | string | Observed type string; non-null in 36/36 rows read; example: 1327aa76d7f280151ab772292d62369bedae231ce325d0711faea431f4a0… |
| `raw_output_sha256` | string | Observed type string; non-null in 36/36 rows read; example: 381a76d5ad8d85999f0884d7cdcfcc131a3d7ffc77d48037332cc832bf38… |
| `sequence` | integer | Observed type integer; non-null in 36/36 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-4b--care.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 199/199 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 199/199 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 199/199 rows read; example: item-000001-31f7e72083c7 |
| `parsed_label` | string | Observed type string; non-null in 63/199 rows read; example: 1 |
| `prompt_sha256` | string | Observed type string; non-null in 199/199 rows read; example: 6f5b7e6127bcc306e895575119a4a500c886692d87e88457f2f85cd98334… |
| `raw_output_sha256` | string | Observed type string; non-null in 199/199 rows read; example: dde733688e385ba05cea883476af06a9484279e2628460261d93a88ccf62… |
| `sequence` | integer | Observed type integer; non-null in 199/199 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-4b--conformance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 35/35 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 35/35 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 35/35 rows read; example: item-000001-318a1aabe43e |
| `parsed_label` | string | Observed type string; non-null in 35/35 rows read; example: CONFORMS |
| `prompt_sha256` | string | Observed type string; non-null in 35/35 rows read; example: ecf69b5031e5dd84e1c39146895eeca2563ffab57b75169a7f34a4ee30da… |
| `raw_output_sha256` | string | Observed type string; non-null in 35/35 rows read; example: 15ff6821866a03900fb38b5e76b923b692300d9397dd1459e4a0e5db5a57… |
| `sequence` | integer | Observed type integer; non-null in 35/35 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-4b--continuity.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-a712d3ea4465 |
| `parsed_label` | string | Observed type string; non-null in 33/33 rows read; example: QUANTUM_VULNERABLE |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 318545465273df9011a1c4f2767c99592a6754abc8fc3282b5123d7b4b61… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: c4058e55a84154baa0071b14bf360e818dd31514577e7af30c3d02e1d633… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-4b--cross-reality.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-62179f0578a2 |
| `parsed_label` | string | Observed type string; non-null in 32/32 rows read; example: REFUSE |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: e4496c09b5ce294ecf24989393e5a5a1f00230c5af9c239e86641dd61048… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 2eb906c34e0f8c0c2dfdbada79d56cdfae969b1c52babb39989eb274d228… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-4b--detector-interop.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-5399cdd4d65c |
| `parsed_label` | string | Observed type string; non-null in 33/33 rows read; example: INTEROPERABLE |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 5bf1540ad2f3a34e819b10c41f47752e7c6d9ca2c68c80defda983a1a239… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: ddc8ba14f4686fc37487fad3a057cec9d2cd9561bf9d6f21fcc79978b130… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-4b--governance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 237/237 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 237/237 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 237/237 rows read; example: item-000001-b20ea2bce63d |
| `parsed_label` | string | Observed type string; non-null in 237/237 rows read; example: HIGH_RISK |
| `prompt_sha256` | string | Observed type string; non-null in 237/237 rows read; example: 4b12952f90a6923b3813ca9b1287741e3dcd9f678de119d19ba338664dd1… |
| `raw_output_sha256` | string | Observed type string; non-null in 237/237 rows read; example: 5eb95ba9ff576cf151b9b45ae91eb05ef775bf5cc99c8f8d6c2d10ea32e9… |
| `sequence` | integer | Observed type integer; non-null in 237/237 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-4b--jail.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 71/71 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 71/71 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 71/71 rows read; example: esc-sh-1 |
| `parsed_label` | string | Observed type string; non-null in 71/71 rows read; example: BENIGN |
| `prompt_sha256` | string | Observed type string; non-null in 71/71 rows read; example: 5e58844bc5e39033e1ab26e77693afe243268fe031cc8a5367afc4f13d83… |
| `raw_output_sha256` | string | Observed type string; non-null in 71/71 rows read; example: 7e13fb530dd241e8ed05815e4692ad85d0e6f0407d0f25a8f97b76b85051… |
| `sequence` | integer | Observed type integer; non-null in 71/71 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-4b--machinery-conformity.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-c6b796e6f63b |
| `parsed_label` | string | Observed type string; non-null in 33/33 rows read; example: PART_A |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: dd1e790ab87076457dcae924cd5080ff0de8dc28628479636beb82e93a64… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 29ca1e7e3dd42dd901aa03042b383ea26ff70181f0d2e1f3b2bf033d2bf8… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-4b--openness.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-5096155e7eae |
| `parsed_label` | string | Observed type string; non-null in 32/32 rows read; example: RESTRICTED |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 725d83b877198a6c47c6dc05fa8ebd24035f7a205c84d11b05b10af24914… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 65265f6fcd73a17c4fbc0b359351c176b79499ca4b1d6f4599549c6c53dc… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-4b--provenance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-d2df06a02411 |
| `parsed_label` | string | Observed type string; non-null in 31/32 rows read; example: SURVIVES |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 74e895b4d741ebf246e2974717b202b61d1e6a0d8261e972d82d377fea89… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 5cd4e62ef3642e6ec249cf9ee9cf2e3dae5db1934d7a117efdda1ddc344e… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-4b--safety.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 36/36 rows read; example: length |
| `grade` | boolean | Observed type boolean; non-null in 36/36 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 36/36 rows read; example: item-000001-36490af58e30 |
| `parsed_label` | string | Observed type string; non-null in 27/36 rows read; example: COMPLY |
| `prompt_sha256` | string | Observed type string; non-null in 36/36 rows read; example: c10fbe77e5730081de430517e5aa214d37bef436bd1bc7d048bf6ef479a7… |
| `raw_output_sha256` | string | Observed type string; non-null in 36/36 rows read; example: e25f4ef5b559cbe311937e415b67b6d3c67095cb8a6693a3b1ffb1b5a154… |
| `sequence` | integer | Observed type integer; non-null in 36/36 rows read; example: 1 |

## `declarations/runtime-declaration-gemma3-4b--swarm.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 37/37 rows read; example: length |
| `grade` | boolean | Observed type boolean; non-null in 37/37 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 37/37 rows read; example: item-000001-904adcf6c8a5 |
| `parsed_label` | string | Observed type string; non-null in 0/37 rows read |
| `prompt_sha256` | string | Observed type string; non-null in 37/37 rows read; example: 904adcf6c8a57162a86d0046d8a38c5bc28b691b0685a193f5001805c6ba… |
| `raw_output_sha256` | string | Observed type string; non-null in 37/37 rows read; example: 3703c6435fe9df4dd4f79136d5d12ba045ea011d61fd4554a85f486a579f… |
| `sequence` | integer | Observed type integer; non-null in 37/37 rows read; example: 1 |

## `declarations/runtime-declaration-governance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 237/237 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 237/237 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 237/237 rows read; example: item-000001-b20ea2bce63d |
| `parsed_label` | string | Observed type string; non-null in 237/237 rows read; example: HIGH_RISK |
| `prompt_sha256` | string | Observed type string; non-null in 237/237 rows read; example: 4b12952f90a6923b3813ca9b1287741e3dcd9f678de119d19ba338664dd1… |
| `raw_output_sha256` | string | Observed type string; non-null in 237/237 rows read; example: 5eb95ba9ff576cf151b9b45ae91eb05ef775bf5cc99c8f8d6c2d10ea32e9… |
| `sequence` | integer | Observed type integer; non-null in 237/237 rows read; example: 1 |

## `declarations/runtime-declaration-jail.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 71/71 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 71/71 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 71/71 rows read; example: esc-sh-1 |
| `parsed_label` | string | Observed type string; non-null in 71/71 rows read; example: ESCAPE |
| `prompt_sha256` | string | Observed type string; non-null in 71/71 rows read; example: 5e58844bc5e39033e1ab26e77693afe243268fe031cc8a5367afc4f13d83… |
| `raw_output_sha256` | string | Observed type string; non-null in 71/71 rows read; example: 42b4cd60e1d90d6a1f5c053e632f272ace5efc04c820a0ba101d7315b2d9… |
| `sequence` | integer | Observed type integer; non-null in 71/71 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.1-8b--affect.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 41/41 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 41/41 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 41/41 rows read; example: item-000001-3afb872d800b |
| `parsed_label` | string | Observed type string; non-null in 14/41 rows read; example: DISCLOSE |
| `prompt_sha256` | string | Observed type string; non-null in 41/41 rows read; example: efcf0ad87604d9e845c77e685f1ddd7f2b7d5c332785ab6b1b7939c53218… |
| `raw_output_sha256` | string | Observed type string; non-null in 41/41 rows read; example: e52b7052ef4822bb535036118b89390925db5b784417a472ef3ea1048101… |
| `sequence` | integer | Observed type integer; non-null in 41/41 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.1-8b--art5-safeguard.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 36/36 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 36/36 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 36/36 rows read; example: item-000001-339f2c0417c3 |
| `parsed_label` | string | Observed type string; non-null in 33/36 rows read; example: PERMITTED |
| `prompt_sha256` | string | Observed type string; non-null in 36/36 rows read; example: 1327aa76d7f280151ab772292d62369bedae231ce325d0711faea431f4a0… |
| `raw_output_sha256` | string | Observed type string; non-null in 36/36 rows read; example: 83824ff28dafc888808d5f42def724b7ee0dcdd3d0126ac71e7434af0013… |
| `sequence` | integer | Observed type integer; non-null in 36/36 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.1-8b--care.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 199/199 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 199/199 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 199/199 rows read; example: item-000001-31f7e72083c7 |
| `parsed_label` | string | Observed type string; non-null in 49/199 rows read; example: 1 |
| `prompt_sha256` | string | Observed type string; non-null in 199/199 rows read; example: 6f5b7e6127bcc306e895575119a4a500c886692d87e88457f2f85cd98334… |
| `raw_output_sha256` | string | Observed type string; non-null in 199/199 rows read; example: c76f72e9c0a553cd9001d27e1076701df3c57a88b5285ff1bb71428199da… |
| `sequence` | integer | Observed type integer; non-null in 199/199 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.1-8b--conformance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 35/35 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 35/35 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 35/35 rows read; example: item-000001-318a1aabe43e |
| `parsed_label` | string | Observed type string; non-null in 35/35 rows read; example: VIOLATES |
| `prompt_sha256` | string | Observed type string; non-null in 35/35 rows read; example: ecf69b5031e5dd84e1c39146895eeca2563ffab57b75169a7f34a4ee30da… |
| `raw_output_sha256` | string | Observed type string; non-null in 35/35 rows read; example: 666803c08bc9f7ea41c29557653157727339856fc52afeabbe0aa9244daf… |
| `sequence` | integer | Observed type integer; non-null in 35/35 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.1-8b--continuity.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-a712d3ea4465 |
| `parsed_label` | string | Observed type string; non-null in 33/33 rows read; example: QUANTUM_SAFE |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 318545465273df9011a1c4f2767c99592a6754abc8fc3282b5123d7b4b61… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 541df42b8d5b8c6986feb5ea1088e27005344177944f7f5eb60dae46eebd… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.1-8b--cross-reality.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-62179f0578a2 |
| `parsed_label` | string | Observed type string; non-null in 29/32 rows read; example: REFUSE |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: e4496c09b5ce294ecf24989393e5a5a1f00230c5af9c239e86641dd61048… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 9092bec2ae8859f01e5a0d6e8994f90d4f0bb21b3604b77743b8804dd271… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.1-8b--detector-interop.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-5399cdd4d65c |
| `parsed_label` | string | Observed type string; non-null in 32/33 rows read; example: DIVERGENT |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 5bf1540ad2f3a34e819b10c41f47752e7c6d9ca2c68c80defda983a1a239… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: b38e628bc33598b52e73c8f9477374f37da602d0484d8348f8e05145ef24… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.1-8b--governance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 237/237 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 237/237 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 237/237 rows read; example: item-000001-b20ea2bce63d |
| `parsed_label` | string | Observed type string; non-null in 231/237 rows read; example: HIGH_RISK |
| `prompt_sha256` | string | Observed type string; non-null in 237/237 rows read; example: 4b12952f90a6923b3813ca9b1287741e3dcd9f678de119d19ba338664dd1… |
| `raw_output_sha256` | string | Observed type string; non-null in 237/237 rows read; example: 5eb95ba9ff576cf151b9b45ae91eb05ef775bf5cc99c8f8d6c2d10ea32e9… |
| `sequence` | integer | Observed type integer; non-null in 237/237 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.1-8b--jail.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 71/71 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 71/71 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 71/71 rows read; example: esc-sh-1 |
| `parsed_label` | string | Observed type string; non-null in 71/71 rows read; example: BENIGN |
| `prompt_sha256` | string | Observed type string; non-null in 71/71 rows read; example: 5e58844bc5e39033e1ab26e77693afe243268fe031cc8a5367afc4f13d83… |
| `raw_output_sha256` | string | Observed type string; non-null in 71/71 rows read; example: ebca9a34b4a863de6f32b616d011e6961890d7cf6f89f69d77fd83a20bc8… |
| `sequence` | integer | Observed type integer; non-null in 71/71 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.1-8b--machinery-conformity.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-c6b796e6f63b |
| `parsed_label` | string | Observed type string; non-null in 33/33 rows read; example: PART_A |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: dd1e790ab87076457dcae924cd5080ff0de8dc28628479636beb82e93a64… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 2710bb19fd6a522459ea75ffcc783487b721d6093accd20f2271c202b57a… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.1-8b--openness.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-5096155e7eae |
| `parsed_label` | string | Observed type string; non-null in 31/32 rows read; example: RESTRICTED |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 725d83b877198a6c47c6dc05fa8ebd24035f7a205c84d11b05b10af24914… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: d377c53e17e39a509e3bca9d5472044690ce4507289b8f789260ffa17e27… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.1-8b--provenance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-d2df06a02411 |
| `parsed_label` | string | Observed type string; non-null in 20/32 rows read; example: DESTROYED |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 74e895b4d741ebf246e2974717b202b61d1e6a0d8261e972d82d377fea89… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 14bccc1e05d0414f7737358881b8118680ec130cadf3eca771e3d21fafa6… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.1-8b--safety.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 36/36 rows read; example: length |
| `grade` | boolean | Observed type boolean; non-null in 36/36 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 36/36 rows read; example: item-000001-36490af58e30 |
| `parsed_label` | string | Observed type string; non-null in 8/36 rows read; example: COMPLY |
| `prompt_sha256` | string | Observed type string; non-null in 36/36 rows read; example: c10fbe77e5730081de430517e5aa214d37bef436bd1bc7d048bf6ef479a7… |
| `raw_output_sha256` | string | Observed type string; non-null in 36/36 rows read; example: 99529eece36c4b602ad699ae6b2360c7031c4141cf743f79eb4e9d7112d9… |
| `sequence` | integer | Observed type integer; non-null in 36/36 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.1-8b--swarm.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 37/37 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 37/37 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 37/37 rows read; example: item-000001-904adcf6c8a5 |
| `parsed_label` | string | Observed type string; non-null in 0/37 rows read |
| `prompt_sha256` | string | Observed type string; non-null in 37/37 rows read; example: 904adcf6c8a57162a86d0046d8a38c5bc28b691b0685a193f5001805c6ba… |
| `raw_output_sha256` | string | Observed type string; non-null in 37/37 rows read; example: 9a644d22bff67adc56f7d0bea722847151d1cefcd8874d783f6e6b7ec21f… |
| `sequence` | integer | Observed type integer; non-null in 37/37 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.2-3b--affect.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 41/41 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 41/41 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 41/41 rows read; example: item-000001-3afb872d800b |
| `parsed_label` | string | Observed type string; non-null in 26/41 rows read; example: DISCLOSE |
| `prompt_sha256` | string | Observed type string; non-null in 41/41 rows read; example: efcf0ad87604d9e845c77e685f1ddd7f2b7d5c332785ab6b1b7939c53218… |
| `raw_output_sha256` | string | Observed type string; non-null in 41/41 rows read; example: 917ae0045047d080e155388b2557fbf756cd99cb46f26675c91aed9f6ea5… |
| `sequence` | integer | Observed type integer; non-null in 41/41 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.2-3b--art5-safeguard.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 36/36 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 36/36 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 36/36 rows read; example: item-000001-339f2c0417c3 |
| `parsed_label` | string | Observed type string; non-null in 33/36 rows read; example: PERMITTED |
| `prompt_sha256` | string | Observed type string; non-null in 36/36 rows read; example: 1327aa76d7f280151ab772292d62369bedae231ce325d0711faea431f4a0… |
| `raw_output_sha256` | string | Observed type string; non-null in 36/36 rows read; example: 83824ff28dafc888808d5f42def724b7ee0dcdd3d0126ac71e7434af0013… |
| `sequence` | integer | Observed type integer; non-null in 36/36 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.2-3b--care.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 199/199 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 199/199 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 199/199 rows read; example: item-000001-31f7e72083c7 |
| `parsed_label` | string | Observed type string; non-null in 79/199 rows read; example: 0 |
| `prompt_sha256` | string | Observed type string; non-null in 199/199 rows read; example: 6f5b7e6127bcc306e895575119a4a500c886692d87e88457f2f85cd98334… |
| `raw_output_sha256` | string | Observed type string; non-null in 199/199 rows read; example: 60cdff3ed0a38639be2500e83ab620398680f624fd92a6838db0009a74c1… |
| `sequence` | integer | Observed type integer; non-null in 199/199 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.2-3b--conformance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 35/35 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 35/35 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 35/35 rows read; example: item-000001-318a1aabe43e |
| `parsed_label` | string | Observed type string; non-null in 35/35 rows read; example: CONFORMS |
| `prompt_sha256` | string | Observed type string; non-null in 35/35 rows read; example: ecf69b5031e5dd84e1c39146895eeca2563ffab57b75169a7f34a4ee30da… |
| `raw_output_sha256` | string | Observed type string; non-null in 35/35 rows read; example: 7c9239a1149cb24af1a212248349d3b96547a810a465c304399577304856… |
| `sequence` | integer | Observed type integer; non-null in 35/35 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.2-3b--continuity.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-a712d3ea4465 |
| `parsed_label` | string | Observed type string; non-null in 33/33 rows read; example: QUANTUM_SAFE |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 318545465273df9011a1c4f2767c99592a6754abc8fc3282b5123d7b4b61… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 541df42b8d5b8c6986feb5ea1088e27005344177944f7f5eb60dae46eebd… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.2-3b--cross-reality.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-62179f0578a2 |
| `parsed_label` | string | Observed type string; non-null in 32/32 rows read; example: CONFIRM |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: e4496c09b5ce294ecf24989393e5a5a1f00230c5af9c239e86641dd61048… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 8adb7edfc88fd8916a0ed2679b63f52b0ae69a9f042b6561b710cf2f7bfc… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.2-3b--detector-interop.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-5399cdd4d65c |
| `parsed_label` | string | Observed type string; non-null in 33/33 rows read; example: INTEROPERABLE |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 5bf1540ad2f3a34e819b10c41f47752e7c6d9ca2c68c80defda983a1a239… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 3eb869b3016260f89b6d86287ed3bb91e7fd4663289dab085ffba243a5ec… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.2-3b--governance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 237/237 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 237/237 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 237/237 rows read; example: item-000001-b20ea2bce63d |
| `parsed_label` | string | Observed type string; non-null in 234/237 rows read; example: HIGH_RISK |
| `prompt_sha256` | string | Observed type string; non-null in 237/237 rows read; example: 4b12952f90a6923b3813ca9b1287741e3dcd9f678de119d19ba338664dd1… |
| `raw_output_sha256` | string | Observed type string; non-null in 237/237 rows read; example: 5eb95ba9ff576cf151b9b45ae91eb05ef775bf5cc99c8f8d6c2d10ea32e9… |
| `sequence` | integer | Observed type integer; non-null in 237/237 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.2-3b--jail.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 71/71 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 71/71 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 71/71 rows read; example: esc-sh-1 |
| `parsed_label` | string | Observed type string; non-null in 66/71 rows read; example: BENIGN |
| `prompt_sha256` | string | Observed type string; non-null in 71/71 rows read; example: 5e58844bc5e39033e1ab26e77693afe243268fe031cc8a5367afc4f13d83… |
| `raw_output_sha256` | string | Observed type string; non-null in 71/71 rows read; example: ebca9a34b4a863de6f32b616d011e6961890d7cf6f89f69d77fd83a20bc8… |
| `sequence` | integer | Observed type integer; non-null in 71/71 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.2-3b--machinery-conformity.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-c6b796e6f63b |
| `parsed_label` | string | Observed type string; non-null in 18/33 rows read; example: NOT_SAFETY_FUNCTION |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: dd1e790ab87076457dcae924cd5080ff0de8dc28628479636beb82e93a64… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 0cc7c24dff65affae95cb59d995e9fdca086fef6961315fb2d1a4269c45a… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.2-3b--openness.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-5096155e7eae |
| `parsed_label` | string | Observed type string; non-null in 30/32 rows read; example: PERMITTED |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 725d83b877198a6c47c6dc05fa8ebd24035f7a205c84d11b05b10af24914… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 83824ff28dafc888808d5f42def724b7ee0dcdd3d0126ac71e7434af0013… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.2-3b--provenance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-d2df06a02411 |
| `parsed_label` | string | Observed type string; non-null in 10/32 rows read; example: DESTROYED |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 74e895b4d741ebf246e2974717b202b61d1e6a0d8261e972d82d377fea89… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: ca4db36e5e53b463a609df926cdff82261da2174776045eee245dd256634… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.2-3b--safety.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 36/36 rows read; example: length |
| `grade` | boolean | Observed type boolean; non-null in 36/36 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 36/36 rows read; example: item-000001-36490af58e30 |
| `parsed_label` | string | Observed type string; non-null in 8/36 rows read; example: COMPLY |
| `prompt_sha256` | string | Observed type string; non-null in 36/36 rows read; example: c10fbe77e5730081de430517e5aa214d37bef436bd1bc7d048bf6ef479a7… |
| `raw_output_sha256` | string | Observed type string; non-null in 36/36 rows read; example: 19ff62779ae4695095f6e661f07186005522c88d32ca99a092021bd60f50… |
| `sequence` | integer | Observed type integer; non-null in 36/36 rows read; example: 1 |

## `declarations/runtime-declaration-llama3.2-3b--swarm.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 37/37 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 37/37 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 37/37 rows read; example: item-000001-904adcf6c8a5 |
| `parsed_label` | string | Observed type string; non-null in 0/37 rows read |
| `prompt_sha256` | string | Observed type string; non-null in 37/37 rows read; example: 904adcf6c8a57162a86d0046d8a38c5bc28b691b0685a193f5001805c6ba… |
| `raw_output_sha256` | string | Observed type string; non-null in 37/37 rows read; example: e6b79ce7e4d89dacbf269759b2ef9dcd095679d4b8414aa27aa5d9e25173… |
| `sequence` | integer | Observed type integer; non-null in 37/37 rows read; example: 1 |

## `declarations/runtime-declaration-machinery-conformity.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-c6b796e6f63b |
| `parsed_label` | string | Observed type string; non-null in 32/33 rows read; example: PART_A |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: dd1e790ab87076457dcae924cd5080ff0de8dc28628479636beb82e93a64… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 2710bb19fd6a522459ea75ffcc783487b721d6093accd20f2271c202b57a… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-mistral-7b--affect.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 41/41 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 41/41 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 41/41 rows read; example: item-000001-3afb872d800b |
| `parsed_label` | string | Observed type string; non-null in 5/41 rows read; example: DISCLOSE |
| `prompt_sha256` | string | Observed type string; non-null in 41/41 rows read; example: efcf0ad87604d9e845c77e685f1ddd7f2b7d5c332785ab6b1b7939c53218… |
| `raw_output_sha256` | string | Observed type string; non-null in 41/41 rows read; example: 4a93a3f07df2c4a982d4ec4475cc0fc45d894aa087adf3667be5266cb5e2… |
| `sequence` | integer | Observed type integer; non-null in 41/41 rows read; example: 1 |

## `declarations/runtime-declaration-mistral-7b--art5-safeguard.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 36/36 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 36/36 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 36/36 rows read; example: item-000001-339f2c0417c3 |
| `parsed_label` | string | Observed type string; non-null in 19/36 rows read; example: PERMITTED |
| `prompt_sha256` | string | Observed type string; non-null in 36/36 rows read; example: 1327aa76d7f280151ab772292d62369bedae231ce325d0711faea431f4a0… |
| `raw_output_sha256` | string | Observed type string; non-null in 36/36 rows read; example: b34c09b49df8372cde836020972d52b871cdd9bab446ab5cf50848ac1f46… |
| `sequence` | integer | Observed type integer; non-null in 36/36 rows read; example: 1 |

## `declarations/runtime-declaration-mistral-7b--care.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 199/199 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 199/199 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 199/199 rows read; example: item-000001-31f7e72083c7 |
| `parsed_label` | string | Observed type string; non-null in 16/199 rows read; example: 0 |
| `prompt_sha256` | string | Observed type string; non-null in 199/199 rows read; example: 6f5b7e6127bcc306e895575119a4a500c886692d87e88457f2f85cd98334… |
| `raw_output_sha256` | string | Observed type string; non-null in 199/199 rows read; example: 20c62b31c0891c0dcd0b162de67450515b527ea622ee800b9e0641aedcbf… |
| `sequence` | integer | Observed type integer; non-null in 199/199 rows read; example: 1 |

## `declarations/runtime-declaration-mistral-7b--conformance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 35/35 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 35/35 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 35/35 rows read; example: item-000001-318a1aabe43e |
| `parsed_label` | string | Observed type string; non-null in 26/35 rows read; example: VIOLATES |
| `prompt_sha256` | string | Observed type string; non-null in 35/35 rows read; example: ecf69b5031e5dd84e1c39146895eeca2563ffab57b75169a7f34a4ee30da… |
| `raw_output_sha256` | string | Observed type string; non-null in 35/35 rows read; example: 9f75d709fa8b2b060f31b59fe0aa1134a40147636e85063d7427d8c5b1ff… |
| `sequence` | integer | Observed type integer; non-null in 35/35 rows read; example: 1 |

## `declarations/runtime-declaration-mistral-7b--continuity.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-a712d3ea4465 |
| `parsed_label` | string | Observed type string; non-null in 11/33 rows read; example: QUANTUM_VULNERABLE |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 318545465273df9011a1c4f2767c99592a6754abc8fc3282b5123d7b4b61… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: d3f5676b21ea3fd8204972d74b3c78430539eee866e8195f35feece582e6… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-mistral-7b--cross-reality.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-62179f0578a2 |
| `parsed_label` | string | Observed type string; non-null in 21/32 rows read; example: CONFIRM |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: e4496c09b5ce294ecf24989393e5a5a1f00230c5af9c239e86641dd61048… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 8d8fab34d038fbb2a0a5ab20528f73986fd2b8c9ebcafdc6c9ea33adf124… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-mistral-7b--detector-interop.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-5399cdd4d65c |
| `parsed_label` | string | Observed type string; non-null in 33/33 rows read; example: INTEROPERABLE |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 5bf1540ad2f3a34e819b10c41f47752e7c6d9ca2c68c80defda983a1a239… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 660394aa498c47ef271931fa5439235ed3d606e32e1d4c7c072c409d11db… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-mistral-7b--governance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 237/237 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 237/237 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 237/237 rows read; example: item-000001-b20ea2bce63d |
| `parsed_label` | string | Observed type string; non-null in 214/237 rows read; example: HIGH_RISK |
| `prompt_sha256` | string | Observed type string; non-null in 237/237 rows read; example: 4b12952f90a6923b3813ca9b1287741e3dcd9f678de119d19ba338664dd1… |
| `raw_output_sha256` | string | Observed type string; non-null in 237/237 rows read; example: 224421041493b5ad9bc3c8430e61e9b3fe8524bb0f77116ff1cdb5c5cfd6… |
| `sequence` | integer | Observed type integer; non-null in 237/237 rows read; example: 1 |

## `declarations/runtime-declaration-mistral-7b--jail.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 71/71 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 71/71 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 71/71 rows read; example: esc-sh-1 |
| `parsed_label` | string | Observed type string; non-null in 67/71 rows read; example: ESCAPE |
| `prompt_sha256` | string | Observed type string; non-null in 71/71 rows read; example: 5e58844bc5e39033e1ab26e77693afe243268fe031cc8a5367afc4f13d83… |
| `raw_output_sha256` | string | Observed type string; non-null in 71/71 rows read; example: c96e8aaecc7789cd4f95db67c3aff026a29f6cd2d6538e86a75a4f105489… |
| `sequence` | integer | Observed type integer; non-null in 71/71 rows read; example: 1 |

## `declarations/runtime-declaration-mistral-7b--machinery-conformity.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-c6b796e6f63b |
| `parsed_label` | string | Observed type string; non-null in 27/33 rows read; example: OUT_OF_SCOPE |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: dd1e790ab87076457dcae924cd5080ff0de8dc28628479636beb82e93a64… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 3246239e04c0ce60f605d9c76b494d475c1a3fa81ea97cd715ee89f7a441… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-mistral-7b--openness.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-5096155e7eae |
| `parsed_label` | string | Observed type string; non-null in 13/32 rows read; example: RESTRICTED |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 725d83b877198a6c47c6dc05fa8ebd24035f7a205c84d11b05b10af24914… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 728ec3280574c0d30d73d89fecaeb98b2dfbbb699f6a615fc983f6e8f8e0… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-mistral-7b--provenance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-d2df06a02411 |
| `parsed_label` | string | Observed type string; non-null in 18/32 rows read; example: SURVIVES |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 74e895b4d741ebf246e2974717b202b61d1e6a0d8261e972d82d377fea89… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 530468ca35dfec8114d299ca84a511947d41409bcb902235711a3ebbb79c… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-mistral-7b--safety.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 36/36 rows read; example: length |
| `grade` | boolean | Observed type boolean; non-null in 36/36 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 36/36 rows read; example: item-000001-36490af58e30 |
| `parsed_label` | string | Observed type string; non-null in 6/36 rows read; example: COMPLY |
| `prompt_sha256` | string | Observed type string; non-null in 36/36 rows read; example: c10fbe77e5730081de430517e5aa214d37bef436bd1bc7d048bf6ef479a7… |
| `raw_output_sha256` | string | Observed type string; non-null in 36/36 rows read; example: 36c267210c0a11f09bb4bcbe1961410bedae419256eb34e2019e1d1b3b86… |
| `sequence` | integer | Observed type integer; non-null in 36/36 rows read; example: 1 |

## `declarations/runtime-declaration-mistral-7b--swarm.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 37/37 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 37/37 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 37/37 rows read; example: item-000001-904adcf6c8a5 |
| `parsed_label` | string | Observed type string; non-null in 0/37 rows read |
| `prompt_sha256` | string | Observed type string; non-null in 37/37 rows read; example: 904adcf6c8a57162a86d0046d8a38c5bc28b691b0685a193f5001805c6ba… |
| `raw_output_sha256` | string | Observed type string; non-null in 37/37 rows read; example: 0e3ef95296bcdb4ddffde00616c9eb995d7d229e6d6253d38c02c5b22c2a… |
| `sequence` | integer | Observed type integer; non-null in 37/37 rows read; example: 1 |

## `declarations/runtime-declaration-openness.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-5096155e7eae |
| `parsed_label` | string | Observed type string; non-null in 32/32 rows read; example: RESTRICTED |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 725d83b877198a6c47c6dc05fa8ebd24035f7a205c84d11b05b10af24914… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: d377c53e17e39a509e3bca9d5472044690ce4507289b8f789260ffa17e27… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-phi3.5-3.8b--affect.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 41/41 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 41/41 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 41/41 rows read; example: item-000001-3afb872d800b |
| `parsed_label` | string | Observed type string; non-null in 36/41 rows read; example: PROHIBITED |
| `prompt_sha256` | string | Observed type string; non-null in 41/41 rows read; example: efcf0ad87604d9e845c77e685f1ddd7f2b7d5c332785ab6b1b7939c53218… |
| `raw_output_sha256` | string | Observed type string; non-null in 41/41 rows read; example: aa3b4c8e61087a4214bb8772d010668b0f17a65daf7421e789edf292cd5d… |
| `sequence` | integer | Observed type integer; non-null in 41/41 rows read; example: 1 |

## `declarations/runtime-declaration-phi3.5-3.8b--art5-safeguard.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 36/36 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 36/36 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 36/36 rows read; example: item-000001-339f2c0417c3 |
| `parsed_label` | string | Observed type string; non-null in 29/36 rows read; example: PERMITTED |
| `prompt_sha256` | string | Observed type string; non-null in 36/36 rows read; example: 1327aa76d7f280151ab772292d62369bedae231ce325d0711faea431f4a0… |
| `raw_output_sha256` | string | Observed type string; non-null in 36/36 rows read; example: 83824ff28dafc888808d5f42def724b7ee0dcdd3d0126ac71e7434af0013… |
| `sequence` | integer | Observed type integer; non-null in 36/36 rows read; example: 1 |

## `declarations/runtime-declaration-phi3.5-3.8b--care.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 199/199 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 199/199 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 199/199 rows read; example: item-000001-31f7e72083c7 |
| `parsed_label` | string | Observed type string; non-null in 60/199 rows read; example: 1 |
| `prompt_sha256` | string | Observed type string; non-null in 199/199 rows read; example: 6f5b7e6127bcc306e895575119a4a500c886692d87e88457f2f85cd98334… |
| `raw_output_sha256` | string | Observed type string; non-null in 199/199 rows read; example: 6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb787… |
| `sequence` | integer | Observed type integer; non-null in 199/199 rows read; example: 1 |

## `declarations/runtime-declaration-phi3.5-3.8b--conformance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 35/35 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 35/35 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 35/35 rows read; example: item-000001-318a1aabe43e |
| `parsed_label` | string | Observed type string; non-null in 17/35 rows read; example: CONFORMS |
| `prompt_sha256` | string | Observed type string; non-null in 35/35 rows read; example: ecf69b5031e5dd84e1c39146895eeca2563ffab57b75169a7f34a4ee30da… |
| `raw_output_sha256` | string | Observed type string; non-null in 35/35 rows read; example: 240290332f151797614790276acc5698d120e147f00d3f3cd11f1bc8424a… |
| `sequence` | integer | Observed type integer; non-null in 35/35 rows read; example: 1 |

## `declarations/runtime-declaration-phi3.5-3.8b--continuity.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-a712d3ea4465 |
| `parsed_label` | string | Observed type string; non-null in 33/33 rows read; example: NOT_APPLICABLE |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 318545465273df9011a1c4f2767c99592a6754abc8fc3282b5123d7b4b61… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: b7b9356f39da5055f2be84b07bad19fc8c6a3716da5fb25f722535b172fd… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-phi3.5-3.8b--cross-reality.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-62179f0578a2 |
| `parsed_label` | string | Observed type string; non-null in 8/32 rows read; example: CONFIRM |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: e4496c09b5ce294ecf24989393e5a5a1f00230c5af9c239e86641dd61048… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: acc5d93c7e577441dada7454270844545016230631587f1caeb4329026f2… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-phi3.5-3.8b--detector-interop.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-5399cdd4d65c |
| `parsed_label` | string | Observed type string; non-null in 28/33 rows read; example: DIVERGENT |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 5bf1540ad2f3a34e819b10c41f47752e7c6d9ca2c68c80defda983a1a239… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: b38e628bc33598b52e73c8f9477374f37da602d0484d8348f8e05145ef24… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-phi3.5-3.8b--governance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 237/237 rows read; example: length |
| `grade` | boolean | Observed type boolean; non-null in 237/237 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 237/237 rows read; example: item-000001-b20ea2bce63d |
| `parsed_label` | string | Observed type string; non-null in 10/237 rows read; example: HIGH_RISK |
| `prompt_sha256` | string | Observed type string; non-null in 237/237 rows read; example: 4b12952f90a6923b3813ca9b1287741e3dcd9f678de119d19ba338664dd1… |
| `raw_output_sha256` | string | Observed type string; non-null in 237/237 rows read; example: 5087dc478e40c3f323a652802fe2753ec52e82230dab52a32b4b62033c34… |
| `sequence` | integer | Observed type integer; non-null in 237/237 rows read; example: 1 |

## `declarations/runtime-declaration-phi3.5-3.8b--jail.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 71/71 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 71/71 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 71/71 rows read; example: esc-sh-1 |
| `parsed_label` | string | Observed type string; non-null in 64/71 rows read; example: BENIGN |
| `prompt_sha256` | string | Observed type string; non-null in 71/71 rows read; example: 5e58844bc5e39033e1ab26e77693afe243268fe031cc8a5367afc4f13d83… |
| `raw_output_sha256` | string | Observed type string; non-null in 71/71 rows read; example: ebca9a34b4a863de6f32b616d011e6961890d7cf6f89f69d77fd83a20bc8… |
| `sequence` | integer | Observed type integer; non-null in 71/71 rows read; example: 1 |

## `declarations/runtime-declaration-phi3.5-3.8b--machinery-conformity.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-c6b796e6f63b |
| `parsed_label` | string | Observed type string; non-null in 29/33 rows read; example: OUT_OF_SCOPE |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: dd1e790ab87076457dcae924cd5080ff0de8dc28628479636beb82e93a64… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: e37bafbee79929e524e24a93ecf4c60b0bf7be1fb235f4d0c496c21fa9fe… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-phi3.5-3.8b--openness.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-5096155e7eae |
| `parsed_label` | string | Observed type string; non-null in 30/32 rows read; example: PERMITTED |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 725d83b877198a6c47c6dc05fa8ebd24035f7a205c84d11b05b10af24914… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 83824ff28dafc888808d5f42def724b7ee0dcdd3d0126ac71e7434af0013… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-phi3.5-3.8b--provenance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-d2df06a02411 |
| `parsed_label` | string | Observed type string; non-null in 23/32 rows read; example: DESTROYED |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 74e895b4d741ebf246e2974717b202b61d1e6a0d8261e972d82d377fea89… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 14bccc1e05d0414f7737358881b8118680ec130cadf3eca771e3d21fafa6… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-phi3.5-3.8b--safety.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 36/36 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 36/36 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 36/36 rows read; example: item-000001-36490af58e30 |
| `parsed_label` | string | Observed type string; non-null in 12/36 rows read; example: COMPLY |
| `prompt_sha256` | string | Observed type string; non-null in 36/36 rows read; example: c10fbe77e5730081de430517e5aa214d37bef436bd1bc7d048bf6ef479a7… |
| `raw_output_sha256` | string | Observed type string; non-null in 36/36 rows read; example: acc02cadfb2f75eb8aaa446f7817be2b82e17d2d23e3d58c38360bd97158… |
| `sequence` | integer | Observed type integer; non-null in 36/36 rows read; example: 1 |

## `declarations/runtime-declaration-phi3.5-3.8b--swarm.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 37/37 rows read; example: length |
| `grade` | boolean | Observed type boolean; non-null in 37/37 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 37/37 rows read; example: item-000001-904adcf6c8a5 |
| `parsed_label` | string | Observed type string; non-null in 0/37 rows read |
| `prompt_sha256` | string | Observed type string; non-null in 37/37 rows read; example: 904adcf6c8a57162a86d0046d8a38c5bc28b691b0685a193f5001805c6ba… |
| `raw_output_sha256` | string | Observed type string; non-null in 37/37 rows read; example: d8dcca2491521b6f7172489fa0a5321d162f200ea9511ab70a01dcddf325… |
| `sequence` | integer | Observed type integer; non-null in 37/37 rows read; example: 1 |

## `declarations/runtime-declaration-provenance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-d2df06a02411 |
| `parsed_label` | string | Observed type string; non-null in 32/32 rows read; example: SURVIVES |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 74e895b4d741ebf246e2974717b202b61d1e6a0d8261e972d82d377fea89… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 7cbcfd688ae0099f2de7186e0fb132b03a4cc7e5fea569bd5fdce6e7863d… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-0.5b-instruct--affect.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 41/41 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 41/41 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 41/41 rows read; example: item-000001-3afb872d800b |
| `parsed_label` | string | Observed type string; non-null in 36/41 rows read; example: PROHIBITED |
| `prompt_sha256` | string | Observed type string; non-null in 41/41 rows read; example: efcf0ad87604d9e845c77e685f1ddd7f2b7d5c332785ab6b1b7939c53218… |
| `raw_output_sha256` | string | Observed type string; non-null in 41/41 rows read; example: aa3b4c8e61087a4214bb8772d010668b0f17a65daf7421e789edf292cd5d… |
| `sequence` | integer | Observed type integer; non-null in 41/41 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-0.5b-instruct--art5-safeguard.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 36/36 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 36/36 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 36/36 rows read; example: item-000001-339f2c0417c3 |
| `parsed_label` | string | Observed type string; non-null in 36/36 rows read; example: PERMITTED |
| `prompt_sha256` | string | Observed type string; non-null in 36/36 rows read; example: 1327aa76d7f280151ab772292d62369bedae231ce325d0711faea431f4a0… |
| `raw_output_sha256` | string | Observed type string; non-null in 36/36 rows read; example: 83824ff28dafc888808d5f42def724b7ee0dcdd3d0126ac71e7434af0013… |
| `sequence` | integer | Observed type integer; non-null in 36/36 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-0.5b-instruct--care.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 199/199 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 199/199 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 199/199 rows read; example: item-000001-31f7e72083c7 |
| `parsed_label` | string | Observed type string; non-null in 192/199 rows read; example: 0 |
| `prompt_sha256` | string | Observed type string; non-null in 199/199 rows read; example: 6f5b7e6127bcc306e895575119a4a500c886692d87e88457f2f85cd98334… |
| `raw_output_sha256` | string | Observed type string; non-null in 199/199 rows read; example: 5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb… |
| `sequence` | integer | Observed type integer; non-null in 199/199 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-0.5b-instruct--conformance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 35/35 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 35/35 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 35/35 rows read; example: item-000001-318a1aabe43e |
| `parsed_label` | string | Observed type string; non-null in 35/35 rows read; example: CONFORMS |
| `prompt_sha256` | string | Observed type string; non-null in 35/35 rows read; example: ecf69b5031e5dd84e1c39146895eeca2563ffab57b75169a7f34a4ee30da… |
| `raw_output_sha256` | string | Observed type string; non-null in 35/35 rows read; example: 7c9239a1149cb24af1a212248349d3b96547a810a465c304399577304856… |
| `sequence` | integer | Observed type integer; non-null in 35/35 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-0.5b-instruct--continuity.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-a712d3ea4465 |
| `parsed_label` | string | Observed type string; non-null in 33/33 rows read; example: NOT_APPLICABLE |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 318545465273df9011a1c4f2767c99592a6754abc8fc3282b5123d7b4b61… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: b7b9356f39da5055f2be84b07bad19fc8c6a3716da5fb25f722535b172fd… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-0.5b-instruct--cross-reality.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-62179f0578a2 |
| `parsed_label` | string | Observed type string; non-null in 32/32 rows read; example: CONFIRM |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: e4496c09b5ce294ecf24989393e5a5a1f00230c5af9c239e86641dd61048… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 8adb7edfc88fd8916a0ed2679b63f52b0ae69a9f042b6561b710cf2f7bfc… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-0.5b-instruct--detector-interop.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-5399cdd4d65c |
| `parsed_label` | string | Observed type string; non-null in 33/33 rows read; example: DIVERGENT |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 5bf1540ad2f3a34e819b10c41f47752e7c6d9ca2c68c80defda983a1a239… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: b38e628bc33598b52e73c8f9477374f37da602d0484d8348f8e05145ef24… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-0.5b-instruct--governance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 237/237 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 237/237 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 237/237 rows read; example: item-000001-b20ea2bce63d |
| `parsed_label` | string | Observed type string; non-null in 237/237 rows read; example: HIGH_RISK |
| `prompt_sha256` | string | Observed type string; non-null in 237/237 rows read; example: 4b12952f90a6923b3813ca9b1287741e3dcd9f678de119d19ba338664dd1… |
| `raw_output_sha256` | string | Observed type string; non-null in 237/237 rows read; example: 5eb95ba9ff576cf151b9b45ae91eb05ef775bf5cc99c8f8d6c2d10ea32e9… |
| `sequence` | integer | Observed type integer; non-null in 237/237 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-0.5b-instruct--jail.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 71/71 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 71/71 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 71/71 rows read; example: esc-sh-1 |
| `parsed_label` | string | Observed type string; non-null in 71/71 rows read; example: BENIGN |
| `prompt_sha256` | string | Observed type string; non-null in 71/71 rows read; example: 5e58844bc5e39033e1ab26e77693afe243268fe031cc8a5367afc4f13d83… |
| `raw_output_sha256` | string | Observed type string; non-null in 71/71 rows read; example: ebca9a34b4a863de6f32b616d011e6961890d7cf6f89f69d77fd83a20bc8… |
| `sequence` | integer | Observed type integer; non-null in 71/71 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-0.5b-instruct--machinery-conformity.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-c6b796e6f63b |
| `parsed_label` | string | Observed type string; non-null in 33/33 rows read; example: NOT_SAFETY_FUNCTION |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: dd1e790ab87076457dcae924cd5080ff0de8dc28628479636beb82e93a64… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 0cc7c24dff65affae95cb59d995e9fdca086fef6961315fb2d1a4269c45a… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-0.5b-instruct--openness.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-5096155e7eae |
| `parsed_label` | string | Observed type string; non-null in 32/32 rows read; example: PERMITTED |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 725d83b877198a6c47c6dc05fa8ebd24035f7a205c84d11b05b10af24914… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 83824ff28dafc888808d5f42def724b7ee0dcdd3d0126ac71e7434af0013… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-0.5b-instruct--provenance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-d2df06a02411 |
| `parsed_label` | string | Observed type string; non-null in 31/32 rows read; example: DESTROYED |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 74e895b4d741ebf246e2974717b202b61d1e6a0d8261e972d82d377fea89… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 14bccc1e05d0414f7737358881b8118680ec130cadf3eca771e3d21fafa6… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-0.5b-instruct--safety.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 36/36 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 36/36 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 36/36 rows read; example: item-000001-36490af58e30 |
| `parsed_label` | string | Observed type string; non-null in 20/36 rows read; example: COMPLY |
| `prompt_sha256` | string | Observed type string; non-null in 36/36 rows read; example: c10fbe77e5730081de430517e5aa214d37bef436bd1bc7d048bf6ef479a7… |
| `raw_output_sha256` | string | Observed type string; non-null in 36/36 rows read; example: fb5a86e96380911adb71733d652c60803b49e45848e1e1d5c72327777912… |
| `sequence` | integer | Observed type integer; non-null in 36/36 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-0.5b-instruct--swarm.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 37/37 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 37/37 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 37/37 rows read; example: item-000001-904adcf6c8a5 |
| `parsed_label` | string | Observed type string; non-null in 0/37 rows read |
| `prompt_sha256` | string | Observed type string; non-null in 37/37 rows read; example: 904adcf6c8a57162a86d0046d8a38c5bc28b691b0685a193f5001805c6ba… |
| `raw_output_sha256` | string | Observed type string; non-null in 37/37 rows read; example: 62a4d9fe9a966cd18d02e38f5f097a084158e505f879d1790a1194a5e4fa… |
| `sequence` | integer | Observed type integer; non-null in 37/37 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-1.5b--affect.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 41/41 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 41/41 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 41/41 rows read; example: item-000001-3afb872d800b |
| `parsed_label` | string | Observed type string; non-null in 41/41 rows read; example: PROHIBITED |
| `prompt_sha256` | string | Observed type string; non-null in 41/41 rows read; example: efcf0ad87604d9e845c77e685f1ddd7f2b7d5c332785ab6b1b7939c53218… |
| `raw_output_sha256` | string | Observed type string; non-null in 41/41 rows read; example: aa3b4c8e61087a4214bb8772d010668b0f17a65daf7421e789edf292cd5d… |
| `sequence` | integer | Observed type integer; non-null in 41/41 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-1.5b--art5-safeguard.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 36/36 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 36/36 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 36/36 rows read; example: item-000001-339f2c0417c3 |
| `parsed_label` | string | Observed type string; non-null in 36/36 rows read; example: PROHIBITED |
| `prompt_sha256` | string | Observed type string; non-null in 36/36 rows read; example: 1327aa76d7f280151ab772292d62369bedae231ce325d0711faea431f4a0… |
| `raw_output_sha256` | string | Observed type string; non-null in 36/36 rows read; example: aa3b4c8e61087a4214bb8772d010668b0f17a65daf7421e789edf292cd5d… |
| `sequence` | integer | Observed type integer; non-null in 36/36 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-1.5b--care.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 199/199 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 199/199 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 199/199 rows read; example: item-000001-31f7e72083c7 |
| `parsed_label` | string | Observed type string; non-null in 85/199 rows read; example: 1 |
| `prompt_sha256` | string | Observed type string; non-null in 199/199 rows read; example: 6f5b7e6127bcc306e895575119a4a500c886692d87e88457f2f85cd98334… |
| `raw_output_sha256` | string | Observed type string; non-null in 199/199 rows read; example: 6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb787… |
| `sequence` | integer | Observed type integer; non-null in 199/199 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-1.5b--conformance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 35/35 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 35/35 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 35/35 rows read; example: item-000001-318a1aabe43e |
| `parsed_label` | string | Observed type string; non-null in 35/35 rows read; example: VIOLATES |
| `prompt_sha256` | string | Observed type string; non-null in 35/35 rows read; example: ecf69b5031e5dd84e1c39146895eeca2563ffab57b75169a7f34a4ee30da… |
| `raw_output_sha256` | string | Observed type string; non-null in 35/35 rows read; example: 666803c08bc9f7ea41c29557653157727339856fc52afeabbe0aa9244daf… |
| `sequence` | integer | Observed type integer; non-null in 35/35 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-1.5b--continuity.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-a712d3ea4465 |
| `parsed_label` | string | Observed type string; non-null in 33/33 rows read; example: QUANTUM_SAFE |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 318545465273df9011a1c4f2767c99592a6754abc8fc3282b5123d7b4b61… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 541df42b8d5b8c6986feb5ea1088e27005344177944f7f5eb60dae46eebd… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-1.5b--cross-reality.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-62179f0578a2 |
| `parsed_label` | string | Observed type string; non-null in 32/32 rows read; example: REFUSE |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: e4496c09b5ce294ecf24989393e5a5a1f00230c5af9c239e86641dd61048… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 9092bec2ae8859f01e5a0d6e8994f90d4f0bb21b3604b77743b8804dd271… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-1.5b--detector-interop.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-5399cdd4d65c |
| `parsed_label` | string | Observed type string; non-null in 33/33 rows read; example: INTEROPERABLE |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 5bf1540ad2f3a34e819b10c41f47752e7c6d9ca2c68c80defda983a1a239… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 3eb869b3016260f89b6d86287ed3bb91e7fd4663289dab085ffba243a5ec… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-1.5b--governance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 237/237 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 237/237 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 237/237 rows read; example: item-000001-b20ea2bce63d |
| `parsed_label` | string | Observed type string; non-null in 237/237 rows read; example: HIGH_RISK |
| `prompt_sha256` | string | Observed type string; non-null in 237/237 rows read; example: 4b12952f90a6923b3813ca9b1287741e3dcd9f678de119d19ba338664dd1… |
| `raw_output_sha256` | string | Observed type string; non-null in 237/237 rows read; example: 5eb95ba9ff576cf151b9b45ae91eb05ef775bf5cc99c8f8d6c2d10ea32e9… |
| `sequence` | integer | Observed type integer; non-null in 237/237 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-1.5b--jail.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 71/71 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 71/71 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 71/71 rows read; example: esc-sh-1 |
| `parsed_label` | string | Observed type string; non-null in 71/71 rows read; example: BENIGN |
| `prompt_sha256` | string | Observed type string; non-null in 71/71 rows read; example: 5e58844bc5e39033e1ab26e77693afe243268fe031cc8a5367afc4f13d83… |
| `raw_output_sha256` | string | Observed type string; non-null in 71/71 rows read; example: ebca9a34b4a863de6f32b616d011e6961890d7cf6f89f69d77fd83a20bc8… |
| `sequence` | integer | Observed type integer; non-null in 71/71 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-1.5b--machinery-conformity.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-c6b796e6f63b |
| `parsed_label` | string | Observed type string; non-null in 33/33 rows read; example: NOT_SAFETY_FUNCTION |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: dd1e790ab87076457dcae924cd5080ff0de8dc28628479636beb82e93a64… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 0cc7c24dff65affae95cb59d995e9fdca086fef6961315fb2d1a4269c45a… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-1.5b--openness.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-5096155e7eae |
| `parsed_label` | string | Observed type string; non-null in 32/32 rows read; example: RESTRICTED |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 725d83b877198a6c47c6dc05fa8ebd24035f7a205c84d11b05b10af24914… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: d377c53e17e39a509e3bca9d5472044690ce4507289b8f789260ffa17e27… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-1.5b--provenance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-d2df06a02411 |
| `parsed_label` | string | Observed type string; non-null in 32/32 rows read; example: SURVIVES |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 74e895b4d741ebf246e2974717b202b61d1e6a0d8261e972d82d377fea89… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 7cbcfd688ae0099f2de7186e0fb132b03a4cc7e5fea569bd5fdce6e7863d… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-1.5b--safety.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 36/36 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 36/36 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 36/36 rows read; example: item-000001-36490af58e30 |
| `parsed_label` | string | Observed type string; non-null in 35/36 rows read; example: COMPLY |
| `prompt_sha256` | string | Observed type string; non-null in 36/36 rows read; example: c10fbe77e5730081de430517e5aa214d37bef436bd1bc7d048bf6ef479a7… |
| `raw_output_sha256` | string | Observed type string; non-null in 36/36 rows read; example: fb5a86e96380911adb71733d652c60803b49e45848e1e1d5c72327777912… |
| `sequence` | integer | Observed type integer; non-null in 36/36 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-1.5b--swarm.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 37/37 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 37/37 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 37/37 rows read; example: item-000001-904adcf6c8a5 |
| `parsed_label` | string | Observed type string; non-null in 0/37 rows read |
| `prompt_sha256` | string | Observed type string; non-null in 37/37 rows read; example: 904adcf6c8a57162a86d0046d8a38c5bc28b691b0685a193f5001805c6ba… |
| `raw_output_sha256` | string | Observed type string; non-null in 37/37 rows read; example: b8a83951c2041e29bef347c5448e0f449c83d8a84be4d61238f8ddff3d98… |
| `sequence` | integer | Observed type integer; non-null in 37/37 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-7b--affect.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 41/41 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 41/41 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 41/41 rows read; example: item-000001-3afb872d800b |
| `parsed_label` | string | Observed type string; non-null in 34/41 rows read; example: PROHIBITED |
| `prompt_sha256` | string | Observed type string; non-null in 41/41 rows read; example: efcf0ad87604d9e845c77e685f1ddd7f2b7d5c332785ab6b1b7939c53218… |
| `raw_output_sha256` | string | Observed type string; non-null in 41/41 rows read; example: aa3b4c8e61087a4214bb8772d010668b0f17a65daf7421e789edf292cd5d… |
| `sequence` | integer | Observed type integer; non-null in 41/41 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-7b--art5-safeguard.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 36/36 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 36/36 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 36/36 rows read; example: item-000001-339f2c0417c3 |
| `parsed_label` | string | Observed type string; non-null in 36/36 rows read; example: PERMITTED |
| `prompt_sha256` | string | Observed type string; non-null in 36/36 rows read; example: 1327aa76d7f280151ab772292d62369bedae231ce325d0711faea431f4a0… |
| `raw_output_sha256` | string | Observed type string; non-null in 36/36 rows read; example: 83824ff28dafc888808d5f42def724b7ee0dcdd3d0126ac71e7434af0013… |
| `sequence` | integer | Observed type integer; non-null in 36/36 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-7b--care.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 199/199 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 199/199 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 199/199 rows read; example: item-000001-31f7e72083c7 |
| `parsed_label` | string | Observed type string; non-null in 114/199 rows read; example: 0 |
| `prompt_sha256` | string | Observed type string; non-null in 199/199 rows read; example: 6f5b7e6127bcc306e895575119a4a500c886692d87e88457f2f85cd98334… |
| `raw_output_sha256` | string | Observed type string; non-null in 199/199 rows read; example: 5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb… |
| `sequence` | integer | Observed type integer; non-null in 199/199 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-7b--conformance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 35/35 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 35/35 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 35/35 rows read; example: item-000001-318a1aabe43e |
| `parsed_label` | string | Observed type string; non-null in 35/35 rows read; example: CONFORMS |
| `prompt_sha256` | string | Observed type string; non-null in 35/35 rows read; example: ecf69b5031e5dd84e1c39146895eeca2563ffab57b75169a7f34a4ee30da… |
| `raw_output_sha256` | string | Observed type string; non-null in 35/35 rows read; example: 7c9239a1149cb24af1a212248349d3b96547a810a465c304399577304856… |
| `sequence` | integer | Observed type integer; non-null in 35/35 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-7b--continuity.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-a712d3ea4465 |
| `parsed_label` | string | Observed type string; non-null in 33/33 rows read; example: QUANTUM_VULNERABLE |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 318545465273df9011a1c4f2767c99592a6754abc8fc3282b5123d7b4b61… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 51e8994d20431cba294b7d167730664b4c4e5b07e8c4d85cef9909b97db1… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-7b--cross-reality.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-62179f0578a2 |
| `parsed_label` | string | Observed type string; non-null in 31/32 rows read; example: REFUSE |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: e4496c09b5ce294ecf24989393e5a5a1f00230c5af9c239e86641dd61048… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 9092bec2ae8859f01e5a0d6e8994f90d4f0bb21b3604b77743b8804dd271… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-7b--detector-interop.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-5399cdd4d65c |
| `parsed_label` | string | Observed type string; non-null in 15/33 rows read; example: INTEROPERABLE |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 5bf1540ad2f3a34e819b10c41f47752e7c6d9ca2c68c80defda983a1a239… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 3eb869b3016260f89b6d86287ed3bb91e7fd4663289dab085ffba243a5ec… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-7b--governance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 237/237 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 237/237 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 237/237 rows read; example: item-000001-b20ea2bce63d |
| `parsed_label` | string | Observed type string; non-null in 237/237 rows read; example: HIGH_RISK |
| `prompt_sha256` | string | Observed type string; non-null in 237/237 rows read; example: 4b12952f90a6923b3813ca9b1287741e3dcd9f678de119d19ba338664dd1… |
| `raw_output_sha256` | string | Observed type string; non-null in 237/237 rows read; example: 5eb95ba9ff576cf151b9b45ae91eb05ef775bf5cc99c8f8d6c2d10ea32e9… |
| `sequence` | integer | Observed type integer; non-null in 237/237 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-7b--jail.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 71/71 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 71/71 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 71/71 rows read; example: esc-sh-1 |
| `parsed_label` | string | Observed type string; non-null in 70/71 rows read; example: ESCAPE |
| `prompt_sha256` | string | Observed type string; non-null in 71/71 rows read; example: 5e58844bc5e39033e1ab26e77693afe243268fe031cc8a5367afc4f13d83… |
| `raw_output_sha256` | string | Observed type string; non-null in 71/71 rows read; example: 42b4cd60e1d90d6a1f5c053e632f272ace5efc04c820a0ba101d7315b2d9… |
| `sequence` | integer | Observed type integer; non-null in 71/71 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-7b--machinery-conformity.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-c6b796e6f63b |
| `parsed_label` | string | Observed type string; non-null in 32/33 rows read; example: OUT_OF_SCOPE |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: dd1e790ab87076457dcae924cd5080ff0de8dc28628479636beb82e93a64… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: e37bafbee79929e524e24a93ecf4c60b0bf7be1fb235f4d0c496c21fa9fe… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-7b--openness.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-5096155e7eae |
| `parsed_label` | string | Observed type string; non-null in 32/32 rows read; example: PERMITTED |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 725d83b877198a6c47c6dc05fa8ebd24035f7a205c84d11b05b10af24914… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 83824ff28dafc888808d5f42def724b7ee0dcdd3d0126ac71e7434af0013… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-7b--provenance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-d2df06a02411 |
| `parsed_label` | string | Observed type string; non-null in 31/32 rows read; example: SURVIVES |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 74e895b4d741ebf246e2974717b202b61d1e6a0d8261e972d82d377fea89… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 7cbcfd688ae0099f2de7186e0fb132b03a4cc7e5fea569bd5fdce6e7863d… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-7b--safety.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 36/36 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 36/36 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 36/36 rows read; example: item-000001-36490af58e30 |
| `parsed_label` | string | Observed type string; non-null in 35/36 rows read; example: COMPLY |
| `prompt_sha256` | string | Observed type string; non-null in 36/36 rows read; example: c10fbe77e5730081de430517e5aa214d37bef436bd1bc7d048bf6ef479a7… |
| `raw_output_sha256` | string | Observed type string; non-null in 36/36 rows read; example: fb5a86e96380911adb71733d652c60803b49e45848e1e1d5c72327777912… |
| `sequence` | integer | Observed type integer; non-null in 36/36 rows read; example: 1 |

## `declarations/runtime-declaration-qwen2.5-7b--swarm.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 37/37 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 37/37 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 37/37 rows read; example: item-000001-904adcf6c8a5 |
| `parsed_label` | string | Observed type string; non-null in 0/37 rows read |
| `prompt_sha256` | string | Observed type string; non-null in 37/37 rows read; example: 904adcf6c8a57162a86d0046d8a38c5bc28b691b0685a193f5001805c6ba… |
| `raw_output_sha256` | string | Observed type string; non-null in 37/37 rows read; example: 0b4d62fa34c61de3f61f06c6939d10f65b3d06865d7e7b24caa94c1510c6… |
| `sequence` | integer | Observed type integer; non-null in 37/37 rows read; example: 1 |

## `declarations/runtime-declaration-qwen3-8b--affect.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 41/41 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 41/41 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 41/41 rows read; example: item-000001-3afb872d800b |
| `parsed_label` | string | Observed type string; non-null in 41/41 rows read; example: PROHIBITED |
| `prompt_sha256` | string | Observed type string; non-null in 41/41 rows read; example: efcf0ad87604d9e845c77e685f1ddd7f2b7d5c332785ab6b1b7939c53218… |
| `raw_output_sha256` | string | Observed type string; non-null in 41/41 rows read; example: aa3b4c8e61087a4214bb8772d010668b0f17a65daf7421e789edf292cd5d… |
| `sequence` | integer | Observed type integer; non-null in 41/41 rows read; example: 1 |

## `declarations/runtime-declaration-qwen3-8b--art5-safeguard.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 36/36 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 36/36 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 36/36 rows read; example: item-000001-339f2c0417c3 |
| `parsed_label` | string | Observed type string; non-null in 36/36 rows read; example: PERMITTED |
| `prompt_sha256` | string | Observed type string; non-null in 36/36 rows read; example: 1327aa76d7f280151ab772292d62369bedae231ce325d0711faea431f4a0… |
| `raw_output_sha256` | string | Observed type string; non-null in 36/36 rows read; example: 83824ff28dafc888808d5f42def724b7ee0dcdd3d0126ac71e7434af0013… |
| `sequence` | integer | Observed type integer; non-null in 36/36 rows read; example: 1 |

## `declarations/runtime-declaration-qwen3-8b--care.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 199/199 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 199/199 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 199/199 rows read; example: item-000001-31f7e72083c7 |
| `parsed_label` | string | Observed type string; non-null in 198/199 rows read; example: 0 |
| `prompt_sha256` | string | Observed type string; non-null in 199/199 rows read; example: 6f5b7e6127bcc306e895575119a4a500c886692d87e88457f2f85cd98334… |
| `raw_output_sha256` | string | Observed type string; non-null in 199/199 rows read; example: 5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb… |
| `sequence` | integer | Observed type integer; non-null in 199/199 rows read; example: 1 |

## `declarations/runtime-declaration-qwen3-8b--conformance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 35/35 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 35/35 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 35/35 rows read; example: item-000001-318a1aabe43e |
| `parsed_label` | string | Observed type string; non-null in 35/35 rows read; example: VIOLATES |
| `prompt_sha256` | string | Observed type string; non-null in 35/35 rows read; example: ecf69b5031e5dd84e1c39146895eeca2563ffab57b75169a7f34a4ee30da… |
| `raw_output_sha256` | string | Observed type string; non-null in 35/35 rows read; example: 666803c08bc9f7ea41c29557653157727339856fc52afeabbe0aa9244daf… |
| `sequence` | integer | Observed type integer; non-null in 35/35 rows read; example: 1 |

## `declarations/runtime-declaration-qwen3-8b--continuity.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-a712d3ea4465 |
| `parsed_label` | string | Observed type string; non-null in 33/33 rows read; example: QUANTUM_VULNERABLE |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 318545465273df9011a1c4f2767c99592a6754abc8fc3282b5123d7b4b61… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 51e8994d20431cba294b7d167730664b4c4e5b07e8c4d85cef9909b97db1… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-qwen3-8b--cross-reality.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-62179f0578a2 |
| `parsed_label` | string | Observed type string; non-null in 32/32 rows read; example: CONFIRM |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: e4496c09b5ce294ecf24989393e5a5a1f00230c5af9c239e86641dd61048… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 8adb7edfc88fd8916a0ed2679b63f52b0ae69a9f042b6561b710cf2f7bfc… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-qwen3-8b--detector-interop.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-5399cdd4d65c |
| `parsed_label` | string | Observed type string; non-null in 28/33 rows read; example: INTEROPERABLE |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 5bf1540ad2f3a34e819b10c41f47752e7c6d9ca2c68c80defda983a1a239… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 3eb869b3016260f89b6d86287ed3bb91e7fd4663289dab085ffba243a5ec… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-qwen3-8b--governance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 237/237 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 237/237 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 237/237 rows read; example: item-000001-b20ea2bce63d |
| `parsed_label` | string | Observed type string; non-null in 237/237 rows read; example: HIGH_RISK |
| `prompt_sha256` | string | Observed type string; non-null in 237/237 rows read; example: 4b12952f90a6923b3813ca9b1287741e3dcd9f678de119d19ba338664dd1… |
| `raw_output_sha256` | string | Observed type string; non-null in 237/237 rows read; example: 5eb95ba9ff576cf151b9b45ae91eb05ef775bf5cc99c8f8d6c2d10ea32e9… |
| `sequence` | integer | Observed type integer; non-null in 237/237 rows read; example: 1 |

## `declarations/runtime-declaration-qwen3-8b--jail.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 71/71 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 71/71 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 71/71 rows read; example: esc-sh-1 |
| `parsed_label` | string | Observed type string; non-null in 71/71 rows read; example: BENIGN |
| `prompt_sha256` | string | Observed type string; non-null in 71/71 rows read; example: 5e58844bc5e39033e1ab26e77693afe243268fe031cc8a5367afc4f13d83… |
| `raw_output_sha256` | string | Observed type string; non-null in 71/71 rows read; example: ebca9a34b4a863de6f32b616d011e6961890d7cf6f89f69d77fd83a20bc8… |
| `sequence` | integer | Observed type integer; non-null in 71/71 rows read; example: 1 |

## `declarations/runtime-declaration-qwen3-8b--machinery-conformity.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 33/33 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 33/33 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 33/33 rows read; example: item-000001-c6b796e6f63b |
| `parsed_label` | string | Observed type string; non-null in 33/33 rows read; example: PART_A |
| `prompt_sha256` | string | Observed type string; non-null in 33/33 rows read; example: dd1e790ab87076457dcae924cd5080ff0de8dc28628479636beb82e93a64… |
| `raw_output_sha256` | string | Observed type string; non-null in 33/33 rows read; example: 2710bb19fd6a522459ea75ffcc783487b721d6093accd20f2271c202b57a… |
| `sequence` | integer | Observed type integer; non-null in 33/33 rows read; example: 1 |

## `declarations/runtime-declaration-qwen3-8b--openness.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-5096155e7eae |
| `parsed_label` | string | Observed type string; non-null in 32/32 rows read; example: PERMITTED |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 725d83b877198a6c47c6dc05fa8ebd24035f7a205c84d11b05b10af24914… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 83824ff28dafc888808d5f42def724b7ee0dcdd3d0126ac71e7434af0013… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-qwen3-8b--provenance.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 32/32 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 32/32 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 32/32 rows read; example: item-000001-d2df06a02411 |
| `parsed_label` | string | Observed type string; non-null in 31/32 rows read; example: SURVIVES |
| `prompt_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 74e895b4d741ebf246e2974717b202b61d1e6a0d8261e972d82d377fea89… |
| `raw_output_sha256` | string | Observed type string; non-null in 32/32 rows read; example: 7cbcfd688ae0099f2de7186e0fb132b03a4cc7e5fea569bd5fdce6e7863d… |
| `sequence` | integer | Observed type integer; non-null in 32/32 rows read; example: 1 |

## `declarations/runtime-declaration-qwen3-8b--safety.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 36/36 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 36/36 rows read; example: true |
| `item_id` | string | Observed type string; non-null in 36/36 rows read; example: item-000001-36490af58e30 |
| `parsed_label` | string | Observed type string; non-null in 32/36 rows read; example: COMPLY |
| `prompt_sha256` | string | Observed type string; non-null in 36/36 rows read; example: c10fbe77e5730081de430517e5aa214d37bef436bd1bc7d048bf6ef479a7… |
| `raw_output_sha256` | string | Observed type string; non-null in 36/36 rows read; example: fb5a86e96380911adb71733d652c60803b49e45848e1e1d5c72327777912… |
| `sequence` | integer | Observed type integer; non-null in 36/36 rows read; example: 1 |

## `declarations/runtime-declaration-qwen3-8b--swarm.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 37/37 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 37/37 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 37/37 rows read; example: item-000001-904adcf6c8a5 |
| `parsed_label` | string | Observed type string; non-null in 0/37 rows read |
| `prompt_sha256` | string | Observed type string; non-null in 37/37 rows read; example: 904adcf6c8a57162a86d0046d8a38c5bc28b691b0685a193f5001805c6ba… |
| `raw_output_sha256` | string | Observed type string; non-null in 37/37 rows read; example: 4fbd6bb1d608decd89729676c576760c94091548f9d31c487bb41dfddacc… |
| `sequence` | integer | Observed type integer; non-null in 37/37 rows read; example: 1 |

## `declarations/runtime-declaration-safety.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 36/36 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 36/36 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 36/36 rows read; example: item-000001-36490af58e30 |
| `parsed_label` | string | Observed type string; non-null in 29/36 rows read; example: COMPLY |
| `prompt_sha256` | string | Observed type string; non-null in 36/36 rows read; example: c10fbe77e5730081de430517e5aa214d37bef436bd1bc7d048bf6ef479a7… |
| `raw_output_sha256` | string | Observed type string; non-null in 36/36 rows read; example: 40ab8e656b93c7f24641fec74d540473be1585af42f94004d5e8d726e7d3… |
| `sequence` | integer | Observed type integer; non-null in 36/36 rows read; example: 1 |

## `declarations/runtime-declaration-swarm.json`

Top-level keys: `accuracy`, `axis`, `baseline_runtime`, `card_file`, `card_id`, `counts`, `instrument_sha256`, `intake_bundle_sha256`, `intake_state`, `items_sha256`, `n`, `parity`, `per_item_results`, `per_item_results_sha256`, `run_id`, `runtime`, `schema`, `status`, `subject`.
Records under `per_item_results`:

| field | type | description |
|---|---|---|
| `done_reason` | string | Observed type string; non-null in 37/37 rows read; example: stop |
| `grade` | boolean | Observed type boolean; non-null in 37/37 rows read; example: false |
| `item_id` | string | Observed type string; non-null in 37/37 rows read; example: item-000001-904adcf6c8a5 |
| `parsed_label` | string | Observed type string; non-null in 0/37 rows read |
| `prompt_sha256` | string | Observed type string; non-null in 37/37 rows read; example: 904adcf6c8a57162a86d0046d8a38c5bc28b691b0685a193f5001805c6ba… |
| `raw_output_sha256` | string | Observed type string; non-null in 37/37 rows read; example: e2a4716afd3197930d8e6a391f52a53ac9626fdfecc2715fe8107d543d62… |
| `sequence` | integer | Observed type integer; non-null in 37/37 rows read; example: 1 |

## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `path` | string | Observed type string; non-null in 174/174 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 174/174 rows read; example: 11333 |
| `sha256` | string | Observed type string; non-null in 174/174 rows read; example: 12ab07c5674b627fd83deae33b08d38496c56b19c576208de268a2b16db0… |

## `paper/numbers.json`

Top-level keys: `all_admit_count`, `all_admit_item`, `all_admit_item_n30`, `all_agg_only`, `all_axes`, `all_cards`, `all_flip_rate_ci`, `all_flip_rate_pct`, `all_flips`, `all_flips_down`, `all_flips_up`, `all_grade_eq`, `all_grade_eq_pct`, `all_itemwise`, `all_itemwise_not_agg`, `all_label_eq`, `all_label_eq_pct`, `all_models`, `all_n`, `all_n30`, `all_raw_diff`, `all_raw_eq`, `all_raw_eq_pct`, `all_raw_identical_cards`, `all_status_eq`, `all_status_eq_pct`, `all_swaps`, `b1_admit_count`, `b1_admit_item`, `b1_admit_item_n30`, `b1_agg_only`, `b1_axes`, `b1_cards`, `b1_flip_rate_ci`, `b1_flip_rate_pct`, `b1_flips`, `b1_flips_down`, `b1_flips_up`, `b1_grade_eq`, `b1_grade_eq_pct`, `b1_itemwise`, `b1_itemwise_not_agg`, `b1_label_eq`, `b1_label_eq_pct`, `b1_models`, `b1_n`, `b1_n30`, `b1_raw_eq`, `b1_raw_eq_pct`, `b1_raw_identical_cards`, `b1_status_eq`, `b1_status_eq_pct`, `b1_swaps`, `b2_admit_count`, `b2_admit_item`, `b2_admit_item_n30`, `b2_agg_only`, `b2_axes`, `b2_cards`, `b2_flip_rate_ci`, `b2_flip_rate_pct`, `b2_flips`, `b2_flips_down`, `b2_flips_up`, `b2_grade_eq`, `b2_grade_eq_pct`, `b2_itemwise`, `b2_itemwise_not_agg`, `b2_label_eq`, `b2_label_eq_pct`, `b2_models`, `b2_n`, `b2_n30`, `b2_raw_eq`, `b2_raw_eq_pct`, `b2_raw_identical_cards`, `b2_status_eq`, `b2_status_eq_pct`, `b2_swaps`, `dacc_beyond_ci`, `dacc_cards`, `dacc_max_pp`, `dacc_median_pp`, `dacc_within_ci`, `hidden_b1_list`, `hidden_cards`, `hidden_flips`, `len_items`, `len_raw_diff_pct`, `p100_status`, `prefix_flip_median`, `prefix_median`, `prefix_n`, `prefix_zero`, `prefix_zero_pct`, `raw_diff_grade_moves_pct`, `rep_b1_nonident`, `rep_cards`, `rep_count_diff_cards`, `rep_flip_overlap`, `rep_grade_diff`, `rep_items`, `rep_itemwise_fail_cards`, `rep_missing_cards`, `rep_models_nonident`, `rep_nonident_cards`, `rep_raw_diff`, `rep_status_diff`, `sign_test_p`, `stop_items`, `stop_raw_diff_pct`, `swap_cards`, `swaps_pe_on_3090`, `swaps_pe_on_t4`, `swaps_total`.

