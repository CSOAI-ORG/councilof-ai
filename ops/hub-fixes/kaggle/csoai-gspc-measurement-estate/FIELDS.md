# Field reference: nicktempleman/csoai-gspc-measurement-estate

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `arena/elo_reference.json`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-estate/arena/elo_reference.json.

Top-level keys: `as_of`, `axes`, `axis_meta`, `content_id`, `generated`, `leaderboard`, `method`, `models`, `n_rounds`, `per_axis`, `rank_rule`, `register`, `rounds`, `schema`, `signature`, `sources`, `supersedes`.
Records under `leaderboard`:

| field | type | description |
|---|---|---|
| `ci` | string | Observed type string; non-null in 7/7 rows read; example: [0.61, 0.73] |
| `elo` | numeric | Observed type numeric; non-null in 7/7 rows read; example: 1629 |
| `games` | integer | Observed type integer; non-null in 7/7 rows read; example: 232 |
| `model` | string | Observed type string; non-null in 7/7 rows read; example: qwen3:8b |
| `winrate` | numeric | Observed type numeric; non-null in 7/7 rows read; example: 0.672 |

## `arena/rounds.jsonl`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-estate/arena/rounds.jsonl.

| field | type | description |
|---|---|---|
| `round` | integer | Observed type integer; non-null in 3163/3163 rows read; example: 1 |
| `ts` | datetime | Observed type datetime; non-null in 3163/3163 rows read; example: 2026-08-21T08:47:08Z |
| `axis` | string | Observed type string; non-null in 3163/3163 rows read; example: jail |
| `qwen2.5:1.5b` | string | Observed type string; non-null in 8/3163 rows read; example: {"score": 0, "elo": 1196.0} |
| `deepseek-r1:8b` | string | Observed type string; non-null in 11/3163 rows read; example: {"score": 0, "elo": 1196.0} |
| `winner` | string | Observed type string; non-null in 3163/3163 rows read; example: tie |
| `qwen2.5:7b` | string | Observed type string; non-null in 12/3163 rows read; example: {"score": 0, "elo": 1196.0} |
| `nemotron-3-nano:30b` | string | Observed type string; non-null in 804/3163 rows read; example: {"score": 0, "elo": 1196.0} |
| `gemma3:12b` | string | Observed type string; non-null in 1242/3163 rows read; example: {"score": 0, "elo": 1196.0} |
| `phi4:14b` | string | Observed type string; non-null in 840/3163 rows read; example: {"score": 0, "elo": 1196.0} |
| `qwen3:4b` | string | Observed type string; non-null in 8/3163 rows read; example: {"score": 0, "elo": 1196.0} |
| `mistral:7b` | string | Observed type string; non-null in 1559/3163 rows read; example: {"score": 0, "elo": 1196.0} |
| `qwen3:8b` | string | Observed type string; non-null in 762/3163 rows read; example: {"score": 0.0, "elo": 1200.0} |
| `bank_path` | string | Observed type string; non-null in 1320/3163 rows read; example: /workspace/lanes/out/arena-restart-2026-09-22/gspc-gov.items… |
| `bank_sha256` | string | Observed type string; non-null in 1320/3163 rows read; example: 9c9de457cdded0d8e176067d684b3dab0074cc0a8d14e497c7c0b6f7aa3b… |
| `bank_items` | integer | Observed type integer; non-null in 1320/3163 rows read; example: 237 |
| `bank_canary_rows` | integer | Observed type integer; non-null in 1320/3163 rows read; example: 1 |
| `item` | integer | Observed type integer; non-null in 1320/3163 rows read; example: 26 |
| `expected` | string | Observed type string; non-null in 1320/3163 rows read; example: LIMITED_RISK |
| `prompt_sha256` | string | Observed type string; non-null in 1320/3163 rows read; example: d9bddc67cb295dfd75612fc0dc0fd84859e6a877f3d816c173053ff41d59… |
| `grader` | string | Observed type string; non-null in 1320/3163 rows read; example: axis_arena.score_first_label |
| `seed` | integer | Observed type integer; non-null in 1320/3163 rows read; example: 20260922 |
| `answers` | string | Observed type string; non-null in 1320/3163 rows read; example: {"mistral:7b": " LIMITED_RISK: The deployment of the Nutrien… |
| `phi3.5:3.8b` | string | Observed type string; non-null in 680/3163 rows read; example: {"score": 1.0, "elo": 1200.0} |
| `bank_textless_rows` | integer | Observed type integer; non-null in 1160/3163 rows read; example: 0 |
| `llama3.1:8b` | string | Observed type string; non-null in 400/3163 rows read; example: {"score": 1.0, "elo": 1200.0} |

## `banks/frozen-banks.jsonl`

| field | type | description |
|---|---|---|
| `axis` | string | Observed type string; non-null in 14/14 rows read; example: affect |
| `bytes` | integer | Observed type integer; non-null in 14/14 rows read; example: 17438 |
| `file` | string | Observed type string; non-null in 14/14 rows read; example: items.jsonl |
| `hf_dataset` | string | Observed type string; non-null in 14/14 rows read; example: csoai/gspc-affect |
| `items` | integer | Observed type integer; non-null in 14/14 rows read; example: 42 |
| `note` | string | Observed type string; non-null in 14/14 rows read; example: Public, no token. The sha256 pins the bank bytes a run was g… |
| `sha256` | string | Observed type string; non-null in 14/14 rows read; example: 5ce11c084a6e968cc49314cfec2898725fb7b01513dc117f869be17b4a26… |
| `state` | string | Observed type string; non-null in 14/14 rows read; example: RESOLVABLE |
| `url` | url | Observed type url; non-null in 14/14 rows read; example: https://huggingface.co/datasets/csoai/gspc-affect/resolve/ma… |

## `board/board-axes.jsonl`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-estate/board/board-axes.jsonl.

| field | type | description |
|---|---|---|
| `_board_as_of` | string | Observed type string; non-null in 23/23 rows read; example: behavioural axes 2026-08-12 · jail 2026-08-18 · financial-fa… |
| `_fetched_at` | datetime | Observed type datetime; non-null in 23/23 rows read; example: 2026-09-27T10:05:38Z |
| `accuracy` | numeric | Observed type numeric; non-null in 9/23 rows read; example: 0.5865 |
| `axis` | string | Observed type string; non-null in 23/23 rows read; example: governance |
| `bench` | string | Observed type string; non-null in 23/23 rows read; example: GovBench |
| `colour` | string | Observed type string; non-null in 23/23 rows read; example: #34d399 |
| `cvar05_harm` | numeric | Observed type numeric; non-null in 2/23 rows read; example: 0.8728 |
| `dataset` | string | Observed type string; non-null in 22/23 rows read; example: csoai/gspc-gov |
| `dataset_url` | url | Observed type url; non-null in 22/23 rows read; example: https://huggingface.co/datasets/csoai/gspc-gov |
| `excluded_leader` | string | Observed type string; non-null in 11/23 rows read; example: council-embodiment-v3-light (council specialist) |
| `family` | string | Observed type string; non-null in 23/23 rows read; example: gspc |
| `fleet_mean` | numeric | Observed type numeric; non-null in 13/23 rows read; example: 0.49 |
| `historical_measurement_record` | string | Observed type string; non-null in 11/23 rows read; example: {"does_not_assert_current_public_fields": true, "note": "v2 … |
| `hue` | integer | Observed type integer; non-null in 23/23 rows read; example: 152 |
| `interval` | string | Observed type string; non-null in 8/23 rows read; example: [0.523, 0.647] |
| `kind` | string | Observed type string; non-null in 23/23 rows read; example: model-comparison |
| `leader` | string | Observed type string; non-null in 9/23 rows read; example: mistral:7b (base model) |
| `leader_card` | string | Observed type string; non-null in 3/23 rows read; example: cfba2ad1aaf8c3586d692a3b1f138f5e86f2adb0ac84f49353482c6fe864… |
| `leader_card_note` | string | Observed type string; non-null in 7/23 rows read; example: leader shown from per-item rows; no signed per-model card ye… |
| `leader_card_state` | string | Observed type string; non-null in 7/23 rows read; example: CARD_RECORDS_A_DIFFERENT_MEASUREMENT |
| `leader_card_url` | string | Observed type string; non-null in 3/23 rows read; example: /signed/cards/cfba2ad1aaf8c3586d692a3b1f138f5e86f2adb0ac84f4… |
| `leader_source` | string | Observed type string; non-null in 7/23 rows read; example: per-item rows |
| `mean_harm` | numeric | Observed type numeric; non-null in 12/23 rows read; example: 0.51 |
| `n` | integer | Observed type integer; non-null in 23/23 rows read; example: 237 |
| `note` | string | Observed type string; non-null in 23/23 rows read; example: No model separated from the next best on this axis (exact Mc… |
| `own_model_exclusion_note` | string | Observed type string; non-null in 6/23 rows read; example: Our own council specialist held the point lead in the full 1… |
| `peritem_file_sha256` | string | Observed type string; non-null in 13/23 rows read; example: 3a1d3193d3651448dd311efe4c7efcbdffb19e07fba06c15e628b844bfbf… |
| `separation` | string | Observed type string; non-null in 14/23 rows read; example: TIE |
| `separation_evidence` | string | Observed type string; non-null in 8/23 rows read; example: {"control": {"fixed_pair_rate": 0.044, "nperm": 1000, "resel… |
| `separation_method` | string | Observed type string; non-null in 8/23 rows read; example: Exact McNemar on the discordant items, leader vs the best ba… |
| `separation_p` | numeric | Observed type numeric; non-null in 7/23 rows read; example: 0.3787 |
| `separation_sentence` | string | Observed type string; non-null in 7/23 rows read; example: No model separated from the next best on this axis (exact Mc… |
| `status` | string | Observed type string; non-null in 23/23 rows read; example: MEASURED |
| `task` | string | Observed type string; non-null in 23/23 rows read; example: EU AI Act risk-tier classification |
| `macro_f1` | numeric | Observed type numeric; non-null in 1/23 rows read; example: 0.944 |
| `unparsed_rate` | numeric | Observed type numeric; non-null in 1/23 rows read; example: 0.0541 |
| `excluded_note` | string | Observed type string; non-null in 5/23 rows read; example: This axis named an external base model as the point-leader b… |
| `public_leader_state` | string | Observed type string; non-null in 5/23 rows read; example: NO_SIGNED_CARD |
| `separation_untested_reason` | string | Observed type string; non-null in 6/23 rows read; example: The published rows give TIE (exact McNemar p=0.5811, n=33), … |
| `separation_untested_reason_code` | string | Observed type string; non-null in 6/23 rows read; example: NO_SIGNED_CARD_FOR_AXIS |
| `n_note` | string | Observed type string; non-null in 6/23 rows read; example: 200 bank records, one exact-duplicate pair → 199 unique scor… |
| `separation_n_note` | string | Observed type string; non-null in 1/23 rows read; example: The test counts 200 rows per model over 199 distinct paired … |
| `accuracy_is` | string | Observed type string; non-null in 1/23 rows read; example: point estimate from the signed qwen2.5:7b candidate card b44… |
| `separation_basis` | string | Observed type string; non-null in 1/23 rows read; example: The signed candidate cards establish the point ordering only… |
| `dataset_note` | string | Observed type string; non-null in 3/23 rows read; example: Frozen 71-cell gold bank, published on HuggingFace 2026-08-2… |
| `fleet` | string | Observed type string; non-null in 1/23 rows read; example: 7 models (4 base + 2 council fine-tunes + 1 base variant) — … |
| `null_grammar` | string | Observed type string; non-null in 1/23 rows read; example: In per_model, null and 0.0 mean different things and are nev… |
| `per_model` | string | Observed type string; non-null in 1/23 rows read; example: {"council-inhouse-ft": {"accuracy": 0.4648, "fn": 38, "fp": … |
| `quotable_models` | string | Observed type string; non-null in 1/23 rows read; example: ["qwen2.5:0.5b-instruct", "council-safe", "qwen2.5:7b", "mis… |
| `quotable_note` | string | Observed type string; non-null in 1/23 rows read; example: 7 models x >=30 usable gold-bank items (68-71 each); per-mod… |
| `coverage` | string | Observed type string; non-null in 2/23 rows read; example: 261 of 600 servers tried, from a population of 20,992 third-… |
| `coverage_note` | string | Observed type string; non-null in 2/23 rows read; example: The verdict population is biased toward servers that answer … |
| `evidence_url` | string | Observed type string; non-null in 9/23 rows read; example: /interop/effect-binding-server-probe-2026-09-22.signed.json |
| `n_unit` | string | Observed type string; non-null in 9/23 rows read; example: tool-call servers probed |
| `run_attestation` | string | Observed type string; non-null in 9/23 rows read; example: ED25519_SIGNED |
| `carrier` | string | Observed type string; non-null in 1/23 rows read; example: attestation carrier is DEVNET; the facts are read from MAINN… |
| `facts_as_of` | datetime | Observed type datetime; non-null in 8/23 rows read; example: 2026-09-07T11:30:35Z |
| `facts_status` | string | Observed type string; non-null in 8/23 rows read; example: MEASURED |

## `board/board-longitudinal.jsonl`

| field | type | description |
|---|---|---|
| `axes` | integer | Observed type integer; non-null in 3/3 rows read; example: 22 |
| `committed_at` | datetime | Observed type datetime; non-null in 3/3 rows read; example: 2026-08-26T12:44:38+01:00 |
| `git_commit` | string | Observed type string; non-null in 2/3 rows read; example: 8f00a132b44594569105a59da0dc78c5d041d8bc |
| `measured_axes` | integer | Observed type integer; non-null in 3/3 rows read; example: 15 |
| `measured_on_date` | string | Observed type string; non-null in 3/3 rows read; example: 2026-08-12 (13 canonical axes) · 2026-08-18 (jail) |
| `note` | string | Observed type string; non-null in 3/3 rows read; example: A committed signed board artifact. Sparse by construction: t… |
| `public_count` | string | Observed type string; non-null in 3/3 rows read; example: 22 axes · 15 measured |
| `sha256` | string | Observed type string; non-null in 3/3 rows read; example: 639dc564cf31f80f4742a41b6f1a6ea38bb26279018638c8bf5f1a67f2f8… |
| `source` | string | Observed type string; non-null in 3/3 rows read; example: public/signed/gspc-board.signed.json |
| `unmeasured_axes` | integer | Observed type integer; non-null in 3/3 rows read; example: 7 |

## `board/board-snapshot.json`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-estate/board/board-snapshot.json.

Top-level keys: `schema`, `issuer`, `doi`, `doi_note`, `measured_on`, `note`, `state_enum`, `totals`, `peritem_rows`, `bank_host`, `banked_axes`, `banked_axes_resolvable`, `banked_axes_unresolvable`, `bank_note`, `axes`, `measured_in_lane`, `domains`, `limitations`, `site_attestation`.
Records under `axes`:

| field | type | description |
|---|---|---|
| `axis` | string | Observed type string; non-null in 23/23 rows read; example: governance |
| `family` | string | Observed type string; non-null in 23/23 rows read; example: gspc |
| `kind` | string | Observed type string; non-null in 23/23 rows read; example: model-comparison |
| `bench` | string | Observed type string; non-null in 23/23 rows read; example: GovBench |
| `task` | string | Observed type string; non-null in 23/23 rows read; example: EU AI Act risk-tier classification |
| `n` | integer | Observed type integer; non-null in 23/23 rows read; example: 237 |
| `separation` | string | Observed type string; non-null in 14/23 rows read; example: TIE |
| `fleet_mean` | numeric | Observed type numeric; non-null in 13/23 rows read; example: 0.49 |
| `mean_harm` | numeric | Observed type numeric; non-null in 12/23 rows read; example: 0.51 |
| `cvar05_harm` | numeric | Observed type numeric; non-null in 2/23 rows read; example: 0.8728 |
| `status` | string | Observed type string; non-null in 23/23 rows read; example: MEASURED |
| `dataset` | string | Observed type string; non-null in 22/23 rows read; example: csoai/gspc-gov |
| `colour` | string | Observed type string; non-null in 23/23 rows read; example: #34d399 |
| `hue` | integer | Observed type integer; non-null in 23/23 rows read; example: 152 |
| `excluded_leader` | string | Observed type string; non-null in 11/23 rows read; example: council-embodiment-v3-light (council specialist) |
| `historical_measurement_record` | string | Observed type string; non-null in 11/23 rows read; example: {"state": "SUPERSEDED_FOR_PUBLIC_RANKING", "scope": "ORIGINA… |
| `leader` | string | Observed type string; non-null in 9/23 rows read; example: mistral:7b (base model) |
| `accuracy` | numeric | Observed type numeric; non-null in 9/23 rows read; example: 0.5865 |
| `interval` | string | Observed type string; non-null in 8/23 rows read; example: [0.523, 0.647] |
| `separation_p` | numeric | Observed type numeric; non-null in 7/23 rows read; example: 0.3787 |
| `separation_method` | string | Observed type string; non-null in 8/23 rows read; example: Exact McNemar on the discordant items, leader vs the best ba… |
| `separation_sentence` | string | Observed type string; non-null in 7/23 rows read; example: No model separated from the next best on this axis (exact Mc… |
| `separation_evidence` | string | Observed type string; non-null in 8/23 rows read; example: {"source": "https://huggingface.co/datasets/csoai/gspc-perit… |
| `peritem_file_sha256` | string | Observed type string; non-null in 13/23 rows read; example: 3a1d3193d3651448dd311efe4c7efcbdffb19e07fba06c15e628b844bfbf… |
| `leader_source` | string | Observed type string; non-null in 7/23 rows read; example: per-item rows |
| `leader_card_state` | string | Observed type string; non-null in 7/23 rows read; example: CARD_RECORDS_A_DIFFERENT_MEASUREMENT |
| `leader_card_note` | string | Observed type string; non-null in 7/23 rows read; example: leader shown from per-item rows; no signed per-model card ye… |
| `leader_card` | string | Observed type string; non-null in 3/23 rows read; example: cfba2ad1aaf8c3586d692a3b1f138f5e86f2adb0ac84f49353482c6fe864… |
| `leader_card_url` | string | Observed type string; non-null in 3/23 rows read; example: /signed/cards/cfba2ad1aaf8c3586d692a3b1f138f5e86f2adb0ac84f4… |
| `own_model_exclusion_note` | string | Observed type string; non-null in 6/23 rows read; example: Our own council specialist held the point lead in the full 1… |
| `note` | string | Observed type string; non-null in 23/23 rows read; example: No model separated from the next best on this axis (exact Mc… |
| `dataset_url` | url | Observed type url; non-null in 22/23 rows read; example: https://huggingface.co/datasets/csoai/gspc-gov |
| `macro_f1` | numeric | Observed type numeric; non-null in 1/23 rows read; example: 0.944 |
| `unparsed_rate` | numeric | Observed type numeric; non-null in 1/23 rows read; example: 0.0541 |
| `public_leader_state` | string | Observed type string; non-null in 5/23 rows read; example: NO_SIGNED_CARD |
| `excluded_note` | string | Observed type string; non-null in 5/23 rows read; example: This axis named an external base model as the point-leader b… |
| `separation_untested_reason` | string | Observed type string; non-null in 6/23 rows read; example: The published rows give TIE (exact McNemar p=0.5811, n=33), … |
| `separation_untested_reason_code` | string | Observed type string; non-null in 6/23 rows read; example: NO_SIGNED_CARD_FOR_AXIS |
| `n_note` | string | Observed type string; non-null in 6/23 rows read; example: 200 bank records, one exact-duplicate pair → 199 unique scor… |
| `separation_n_note` | string | Observed type string; non-null in 1/23 rows read; example: The test counts 200 rows per model over 199 distinct paired … |
| `accuracy_is` | string | Observed type string; non-null in 1/23 rows read; example: point estimate from the signed qwen2.5:7b candidate card b44… |
| `separation_basis` | string | Observed type string; non-null in 1/23 rows read; example: The signed candidate cards establish the point ordering only… |
| `quotable_models` | string | Observed type string; non-null in 1/23 rows read; example: ["qwen2.5:0.5b-instruct", "council-safe", "qwen2.5:7b", "mis… |
| `quotable_note` | string | Observed type string; non-null in 1/23 rows read; example: 7 models x >=30 usable gold-bank items (68-71 each); per-mod… |
| `fleet` | string | Observed type string; non-null in 1/23 rows read; example: 7 models (4 base + 2 council fine-tunes + 1 base variant) — … |
| `per_model` | string | Observed type string; non-null in 1/23 rows read; example: {"qwen3:4b": {"n": 68, "quotable": true, "tp": 6, "fp": 0, "… |
| `dataset_note` | string | Observed type string; non-null in 3/23 rows read; example: Frozen 71-cell gold bank, published on HuggingFace 2026-08-2… |
| `null_grammar` | string | Observed type string; non-null in 1/23 rows read; example: In per_model, null and 0.0 mean different things and are nev… |
| `n_unit` | string | Observed type string; non-null in 9/23 rows read; example: tool-call servers probed |
| `evidence_url` | string | Observed type string; non-null in 9/23 rows read; example: /interop/effect-binding-server-probe-2026-09-22.signed.json |
| `run_attestation` | string | Observed type string; non-null in 9/23 rows read; example: ED25519_SIGNED |
| `coverage` | string | Observed type string; non-null in 2/23 rows read; example: 261 of 600 servers tried, from a population of 20,992 third-… |
| `coverage_note` | string | Observed type string; non-null in 2/23 rows read; example: The verdict population is biased toward servers that answer … |
| `carrier` | string | Observed type string; non-null in 1/23 rows read; example: attestation carrier is DEVNET; the facts are read from MAINN… |
| `facts_as_of` | datetime | Observed type datetime; non-null in 8/23 rows read; example: 2026-09-07T11:30:35Z |
| `facts_status` | string | Observed type string; non-null in 8/23 rows read; example: MEASURED |

## `cards/card-corpora.jsonl`

| field | type | description |
|---|---|---|
| `artifact` | string | Observed type string; non-null in 5/5 rows read; example: public/cards-bundle.json |
| `as_of` | datetime | Observed type datetime; non-null in 4/5 rows read; example: 2026-09-22T08:54:02Z |
| `corpus` | string | Observed type string; non-null in 5/5 rows read; example: 1 |
| `field` | string | Observed type string; non-null in 5/5 rows read; example: card_count |
| `identifier_overlap_with_other_corpora` | integer | Observed type integer; non-null in 5/5 rows read; example: 0 |
| `in_api_state` | boolean | Observed type boolean; non-null in 5/5 rows read; example: false |
| `kind` | string | Observed type string; non-null in 5/5 rows read; example: build aggregate |
| `means` | string | Observed type string; non-null in 5/5 rows read; example: Every public/cards/*.json wrapper on disk at build time. Its… |
| `name` | string | Observed type string; non-null in 5/5 rows read; example: card wrappers on disk |
| `relationship` | string | Observed type string; non-null in 5/5 rows read; example: SEPARATE_CORPORA |
| `value` | integer | Observed type integer; non-null in 5/5 rows read; example: 4084 |

## `cards/mill-cards-index.jsonl`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-estate/cards/mill-cards-index.jsonl.

| field | type | description |
|---|---|---|
| `accuracy` | numeric | Observed type numeric; non-null in 2814/2825 rows read; example: 0.7667 |
| `alg` | string | Observed type string; non-null in 2825/2825 rows read; example: Ed25519 |
| `axis` | string | Observed type string; non-null in 2825/2825 rows read; example: affect |
| `bank_dataset` | string | Observed type string; non-null in 537/2825 rows read; example: csoai/gspc-affect |
| `bank_file` | string | Observed type string; non-null in 512/2825 rows read; example: bank-affect-5ce11c084a6e.jsonl |
| `bank_sha256` | string | Observed type string; non-null in 542/2825 rows read; example: 5ce11c084a6e968cc49314cfec2898725fb7b01513dc117f869be17b4a26… |
| `card_url` | url | Observed type url; non-null in 2825/2825 rows read; example: https://councilof.ai/interop/mill-cards-signed/signed-affect… |
| `did` | string | Observed type string; non-null in 2825/2825 rows read; example: did:web:csoai.org#board-attestation-1 |
| `file` | string | Observed type string; non-null in 2825/2825 rows read; example: signed-affect-0377d52b937b.json |
| `id` | string | Observed type string; non-null in 2825/2825 rows read; example: 0377d52b937b7b294a71e16fe67b59329ed605d10a30498353a2a02db072… |
| `items_file` | string | Observed type string; non-null in 542/2825 rows read; example: items-affect-e45f03cc3597.jsonl |
| `items_sha256` | string | Observed type string; non-null in 542/2825 rows read; example: e45f03cc3597ddf3856033b28c7fe38376fadf535a25ddbbf08ec31163b0… |
| `model` | string | Observed type string; non-null in 2825/2825 rows read; example: Qwen/Qwen2.5-7B-Instruct |
| `n` | integer | Observed type integer; non-null in 2825/2825 rows read; example: 30 |
| `not_a_certificate` | boolean | Observed type boolean; non-null in 2825/2825 rows read; example: true |
| `preimage_rule` | string | Observed type string; non-null in 2825/2825 rows read; example: sha256(canonical body) |
| `quotable` | boolean | Observed type boolean; non-null in 2825/2825 rows read; example: true |
| `route` | string | Observed type string; non-null in 1748/2825 rows read; example: hf-router:Qwen/Qwen2.5-7B-Instruct:featherless-ai |
| `run_id` | string | Observed type string; non-null in 625/2825 rows read; example: gha-34831802137 |
| `sha256_of_file_bytes` | string | Observed type string; non-null in 2825/2825 rows read; example: 17f9dc2adb9e5302ba4e6dc33f2ec097c7052aab9862a367981fac4ec2f9… |
| `signature` | string | Observed type string; non-null in 2825/2825 rows read; example: bf9cfb389f35ba4ef4a0dfcb21637b0b9fc181b59180a480fea3b54dcecc… |
| `status` | string | Observed type string; non-null in 2825/2825 rows read; example: MEASURED |
| `unmeasured` | string | Observed type string; non-null in 557/2825 rows read; example: n<30 unquotable |

## `cards/mill-cards-signed.jsonl`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-estate/cards/mill-cards-signed.jsonl.

| field | type | description |
|---|---|---|
| `_file` | string | Observed type string; non-null in 2825/2825 rows read; example: signed-affect-0377d52b937b.json |
| `_sha256_of_file_bytes` | string | Observed type string; non-null in 2825/2825 rows read; example: 17f9dc2adb9e5302ba4e6dc33f2ec097c7052aab9862a367981fac4ec2f9… |
| `alg` | string | Observed type string; non-null in 2825/2825 rows read; example: Ed25519 |
| `body` | string | Observed type string; non-null in 2825/2825 rows read; example: {"accuracy": 0.7667, "admission": {"file": "admission-7693a8… |
| `did` | string | Observed type string; non-null in 2825/2825 rows read; example: did:web:csoai.org#board-attestation-1 |
| `id` | string | Observed type string; non-null in 2825/2825 rows read; example: 0377d52b937b7b294a71e16fe67b59329ed605d10a30498353a2a02db072… |
| `n` | integer | Observed type integer; non-null in 2825/2825 rows read; example: 30 |
| `not_a_certificate` | boolean | Observed type boolean; non-null in 2825/2825 rows read; example: true |
| `preimage_rule` | string | Observed type string; non-null in 2825/2825 rows read; example: sha256(canonical body) |
| `quotable` | boolean | Observed type boolean; non-null in 2825/2825 rows read; example: true |
| `signature` | string | Observed type string; non-null in 2825/2825 rows read; example: bf9cfb389f35ba4ef4a0dfcb21637b0b9fc181b59180a480fea3b54dcecc… |

## `cards/superseded.jsonl`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-estate/cards/superseded.jsonl.

| field | type | description |
|---|---|---|
| `at` | datetime | Observed type datetime; non-null in 1402/1402 rows read; example: 2026-09-03T05:14:29Z |
| `axis` | string | Observed type string; non-null in 1402/1402 rows read; example: affect |
| `by_file` | string | Observed type string; non-null in 1401/1402 rows read; example: signed-affect-e37184166a77.json |
| `by_id` | string | Observed type string; non-null in 1401/1402 rows read; example: e37184166a7754ecf1552feba50f4165a2daad9267026df93ed15d37891a… |
| `model` | string | Observed type string; non-null in 1402/1402 rows read; example: deepseek-ai/DeepSeek-V3.2 |
| `reason` | string | Observed type string; non-null in 1402/1402 rows read; example: #1155: body state corrected — the signed body must be true a… |
| `superseded_file` | string | Observed type string; non-null in 1402/1402 rows read; example: signed-affect-0e870854f6bf.json |
| `superseded_id` | string | Observed type string; non-null in 1402/1402 rows read; example: 0e870854f6bfa3827552d5a4f66d1d992c280121108a9512546913973c33… |
| `by_run_id` | string | Observed type string; non-null in 56/1402 rows read; example: 20260909T070700.098700Z-7b94649264 |
| `superseded_run_id` | string | Observed type string; non-null in 56/1402 rows read; example: 20260905T004223.725150Z-0c2f70cb5a |

## `chain/card_index.json`

Top-level keys: `cards`, `created`, `head`, `kind`, `n_cards`, `n_cells`, `packaged_at`, `pubkey`, `schema`, `verification`, `what_this_does_not_establish`.
Records under `cards`:

| field | type | description |
|---|---|---|
| `alg` | string | Observed type string; non-null in 335/335 rows read; example: Ed25519 |
| `axis` | string | Observed type string; non-null in 335/335 rows read; example: care-refusal-protect |
| `card` | string | Observed type string; non-null in 335/335 rows read; example: 82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a0… |
| `card_url` | string | Observed type string; non-null in 335/335 rows read; example: /signed/cards/82994353b8f94337746ddf73700b0edc425d695d43910d… |
| `kid` | string | Observed type string; non-null in 335/335 rows read; example: card-attestation-1 |
| `pubkey` | string | Observed type string; non-null in 335/335 rows read; example: d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c3… |
| `sig` | string | Observed type string; non-null in 335/335 rows read; example: 58b0c41457e440f6ca886a3e3465f736856b1680cba590869427f1774789… |
| `signed` | boolean | Observed type boolean; non-null in 335/335 rows read; example: true |
| `ts` | datetime | Observed type datetime; non-null in 335/335 rows read; example: 2026-08-19T09:24:39.152331+00:00 |

## `chain/did.json`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-estate/chain/did.json.

Top-level keys: `@context`, `id`, `verificationMethod`, `assertionMethod`, `authentication`, `service`, `_serviceNote`, `_keyContinuity`, `_boardAttestationNote`, `_gspcBoardKeyNote`, `_pqcNote`.
Records under `verificationMethod`:

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 6/6 rows read; example: did:web:csoai.org#site-release-1 |
| `type` | string | Observed type string; non-null in 6/6 rows read; example: JsonWebKey2020 |
| `controller` | string | Observed type string; non-null in 6/6 rows read; example: did:web:csoai.org |
| `publicKeyJwk` | string | Observed type string; non-null in 6/6 rows read; example: {"kty": "OKP", "crv": "Ed25519", "x": "03g9l-dVNGVEAVVWQrJU9… |

## `chain/gsr-rekor-entry.json`

Top-level keys: `schema`, `name`, `description`, `as_of`.


## `chain/ots-manifest-as-published.json`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-estate/chain/ots-manifest-as-published.json.

Top-level keys: `as_of`, `bitcoin_attested_means`, `counts`, `dirs_scanned`, `how_this_was_built`, `pending_is_not_anchored`, `proofs`, `schema`, `subject_absent_means`, `supersedes`.
Records under `proofs`:

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 643/643 rows read; example: a2a-directories-20260905T185400Z.json.ots |
| `path` | string | Observed type string; non-null in 643/643 rows read; example: /interop/a2a-directories-20260905T185400Z.json.ots |
| `sha256_of_proof` | string | Observed type string; non-null in 643/643 rows read; example: de559bd826bbeca03f71d4764d536f169d9ea92a9bb253207aa1e531ea25… |
| `state` | string | Observed type string; non-null in 643/643 rows read; example: BITCOIN |
| `subject` | string | Observed type string; non-null in 640/643 rows read; example: /interop/a2a-directories-20260905T185400Z.json |
| `subject_present` | boolean | Observed type boolean; non-null in 643/643 rows read; example: true |

## `chain/ots-proof-states.jsonl`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-estate/chain/ots-proof-states.jsonl.

| field | type | description |
|---|---|---|
| `anchor_state` | string | Observed type string; non-null in 675/675 rows read; example: SUBMITTED_PENDING |
| `bitcoin_block` | integer | Observed type integer; non-null in 639/675 rows read; example: 967410 |
| `covers_named_file` | boolean | Observed type boolean; non-null in 494/675 rows read; example: true |
| `file_digest` | string | Observed type string; non-null in 675/675 rows read; example: eff510e1f9af41d4e76e88361b1c6ef644365f9a7892a24d7ab648c21172… |
| `naming` | string | Observed type string; non-null in 675/675 rows read; example: file-named |
| `note` | string | Observed type string; non-null in 675/675 rows read; example: SUBMITTED_PENDING means the calendar accepted it and no Bitc… |
| `path` | string | Observed type string; non-null in 675/675 rows read; example: public/claims/claimreg-ai-assurance-and-settlement-2026-09-2… |
| `proof` | string | Observed type string; non-null in 675/675 rows read; example: OTS |

## `chain/rekor-entry.json`

Top-level keys: `108e9186e8c5677ab4e7b3a794e2c00462e22d27f2a5d0e00cdc9c764615153b07736e5280084770`.


## `chain/root.json`

Top-level keys: `as_of`, `card_count`, `card_sha256`, `did_intended`, `kind`, `leaf_definition`, `node_definition`, `tree_caveat`, `language`, `merkle_root`, `note`, `schema`, `sources`, `xrpl_asset_count_attempted`, `xrpl_basket_merkle`, `xrpl_fi_assetCount`, `xrpl_fi_updatedAt`, `sig_ed25519`, `sig_preimage`.


## `corrections/corrections.jsonl`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-estate/corrections/corrections.jsonl.

| field | type | description |
|---|---|---|
| `_license` | string | Observed type string; non-null in 74/74 rows read; example: CC-BY-4.0 |
| `_policy` | string | Observed type string; non-null in 74/74 rows read; example: Public, source-maintained corrections record. Each entry sta… |
| `_publisher` | string | Observed type string; non-null in 74/74 rows read; example: Council of AI (CSOAI Ltd, UK Companies House 16939677) |
| `date` | datetime | Observed type datetime; non-null in 74/74 rows read; example: 2026-09-27 |
| `detected_at` | string | Observed type string; non-null in 74/74 rows read; example: 2026-09-27 |
| `detected_by` | string | Observed type string; non-null in 74/74 rows read; example: internal audit |
| `evidence` | string | Observed type string; non-null in 15/74 rows read; example: ["https://huggingface.co/datasets/csoai/gspc-peritem-rows-20… |
| `how_caught` | string | Observed type string; non-null in 63/74 rows read; example: A separation analysis on 2026-09-27 re-ran the fixed test (e… |
| `id` | string | Observed type string; non-null in 74/74 rows read; example: C-2026-0927-03 |
| `published_at` | string | Observed type string; non-null in 74/74 rows read; example: UNRECORDED |
| `reached_the_public` | boolean | Observed type boolean; non-null in 18/74 rows read; example: true |
| `status` | string | Observed type string; non-null in 66/74 rows read; example: CORRECTED - rows published and bound by hash; six axes UNTES… |
| `timing_evidence` | string | Observed type string; non-null in 25/74 rows read; example: ["separation re-run, 2026-09-27: the fixed 2026-08-13 test r… |
| `what_changed` | string | Observed type string; non-null in 18/74 rows read; example: The rows are published, owner-approved on 27 Sep 2026 ('publ… |
| `what_was_wrong` | string | Observed type string; non-null in 74/74 rows read; example: Two things on GET /api/gspc. (1) Six model-comparison axes (… |
| `detected_window` | string | Observed type string; non-null in 4/74 rows read; example: {"basis": "not before the daily record was published (datase… |
| `first_observed_at` | datetime | Observed type datetime; non-null in 19/74 rows read; example: 2026-09-26T08:52:00Z |
| `supersedes_text` | string | Observed type string; non-null in 1/74 rows read; example: {"field": "what_was_wrong", "id": "C-2026-0925-01", "origina… |
| `note` | string | Observed type string; non-null in 11/74 rows read; example: Owner ruling 2026-09-25 ('both'): correct the wording now, a… |
| `text_superseded_by` | string | Observed type string; non-null in 1/74 rows read; example: C-2026-0926-01 |
| `why_it_was_wrong` | string | Observed type string; non-null in 11/74 rows read; example: 'Multi-party' describes the signing protocol, not where the … |
| `fix` | string | Observed type string; non-null in 56/74 rows read; example: The file now states, at the top and on every row, that it re… |
| `error_introduced_at` | datetime | Observed type datetime; non-null in 2/74 rows read; example: 2026-09-14T08:29Z |
| `corrected_at` | datetime | Observed type datetime; non-null in 1/74 rows read; example: 2026-09-13T02:29Z |

## `evidence/evidence-manifest.jsonl`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-estate/evidence/evidence-manifest.jsonl.

| field | type | description |
|---|---|---|
| `bytes` | integer | Observed type integer; non-null in 1542/1542 rows read; example: 1690 |
| `file` | string | Observed type string; non-null in 1542/1542 rows read; example: admission-002b38d34e08.json |
| `kind` | string | Observed type string; non-null in 1542/1542 rows read; example: admission-receipt |
| `live_url` | url | Observed type url; non-null in 1542/1542 rows read; example: https://councilof.ai/interop/mill-evidence/admission-002b38d… |
| `sha256` | string | Observed type string; non-null in 1542/1542 rows read; example: 002b38d34e0887de7a6ecf7240c4d6404dd45c2c8b3897bf0d24e385a550… |

## `findings/grading-honesty.json`

Top-level keys: `rows`, `rows_carrying_a_label_field`, `rows_carrying_finish_reason`, `schema`, `total_rows`, `truncated`, `unreadable_label`, `what_this_is`, `why_it_matters`.
Records under `rows`:

| field | type | description |
|---|---|---|
| `note` | string | Observed type string; non-null in 4/4 rows read; example: A rate is only reported over the rows that CARRY the field. … |
| `rows` | integer | Observed type integer; non-null in 4/4 rows read; example: 1290 |
| `rows_carrying_a_label_field` | integer | Observed type integer; non-null in 4/4 rows read; example: 1290 |
| `rows_carrying_finish_reason` | integer | Observed type integer; non-null in 4/4 rows read; example: 0 |
| `schema` | string | Observed type string; non-null in 4/4 rows read; example: (no schema field) |
| `truncated_at_token_limit` | integer | Observed type integer; non-null in 4/4 rows read; example: 0 |
| `truncation_rate` | string | Observed type string; non-null in 4/4 rows read; example: finish_reason absent — UNMEASURED |
| `unreadable_label` | integer | Observed type integer; non-null in 4/4 rows read; example: 246 |
| `unreadable_rate` | string | Observed type string; non-null in 4/4 rows read; example: 246/1290 = 19.07% |

## `footprint/capabilities.jsonl`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-estate/footprint/capabilities.jsonl.

| field | type | description |
|---|---|---|
| `audience` | string | Observed type string; non-null in 227/227 rows read; example: agent |
| `description` | string | Observed type string; non-null in 183/227 rows read; example: Verify a C2PA-style signed manifest for AI-generated content… |
| `description_state` | string | Observed type string; non-null in 227/227 rows read; example: DOCUMENTED |
| `id` | string | Observed type string; non-null in 227/227 rows read; example: article50-detect |
| `kind` | string | Observed type string; non-null in 227/227 rows read; example: a2a_skill |
| `lifecycle` | string | Observed type string; non-null in 227/227 rows read; example: LIVE |
| `name` | string | Observed type string; non-null in 227/227 rows read; example: Article 50 provenance detection (free) |
| `payment` | string | Observed type string; non-null in 227/227 rows read; example: free |
| `surfaces` | string | Observed type string; non-null in 210/227 rows read; example: a2a, llms |
| `tags` | string | Observed type string; non-null in 10/227 rows read; example: article-50, provenance, detection, verification, c2pa |

## `footprint/distribution-latest.json`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-estate/footprint/distribution-latest.json.

Top-level keys: `schema`, `as_of`, `measurement_started`, `max_age_hours`, `stale_after`, `generator`, `host`, `package_list`, `window_rule`, `state_rule`, `requests`, `registries`, `totals`, `by_entity`, `packages`.
Records under `packages`:

| field | type | description |
|---|---|---|
| `registry` | string | Observed type string; non-null in 837/837 rows read; example: huggingface |
| `repo_type` | string | Observed type string; non-null in 116/837 rows read; example: dataset |
| `name` | string | Observed type string; non-null in 837/837 rows read; example: csoai/a2a-census |
| `entity` | string | Observed type string; non-null in 837/837 rows read; example: csoai |
| `downloads_30d` | integer | Observed type integer; non-null in 836/837 rows read; example: 328 |
| `downloads_all_time` | integer | Observed type integer; non-null in 836/837 rows read; example: 328 |
| `source_url` | url | Observed type url; non-null in 837/837 rows read; example: https://huggingface.co/api/datasets?author=csoai&expand[]=do… |
| `all_time_covers_all_time` | boolean | Observed type boolean; non-null in 324/837 rows read; example: true |
| `days_in_window` | integer | Observed type integer; non-null in 396/837 rows read; example: 30 |
| `series_starts` | datetime | Observed type datetime; non-null in 396/837 rows read; example: 2026-06-25 |
| `window_note` | string | Observed type string; non-null in 16/837 rows read; example: pepy's daily series for this package starts 2026-09-15, insi… |
| `reason` | string | Observed type string; non-null in 1/837 rows read; example: http 404 |

## `footprint/distribution.jsonl`

| field | type | description |
|---|---|---|
| `as_of` | datetime | Observed type datetime; non-null in 8/8 rows read; example: 2026-09-24T07:14:02Z |
| `attempted` | integer | Observed type integer; non-null in 8/8 rows read; example: 837 |
| `covered` | integer | Observed type integer; non-null in 8/8 rows read; example: 836 |
| `kind` | string | Observed type string; non-null in 8/8 rows read; example: third-party counter (includes mirror and automated traffic) |
| `metric` | string | Observed type string; non-null in 8/8 rows read; example: downloads_30d |
| `reason` | string | Observed type string; non-null in 4/8 rows read; example: not every counter answered in full; the value is a lower bou… |
| `scope` | string | Observed type string; non-null in 8/8 rows read; example: ALL REGISTRIES |
| `state` | string | Observed type string; non-null in 8/8 rows read; example: PARTIAL |
| `state_rule` | string | Observed type string; non-null in 8/8 rows read; example: READ: every counter in the fan-out answered. PARTIAL: some a… |
| `unit` | string | Observed type string; non-null in 8/8 rows read; example: downloads |
| `value` | integer | Observed type integer; non-null in 8/8 rows read; example: 386320 |
| `window` | string | Observed type string; non-null in 8/8 rows read; example: last 30 days, each registry over its own 30-day window |
| `window_rule` | string | Observed type string; non-null in 8/8 rows read; example: 30-day and cumulative are different windows over the same pa… |

## `footprint/memberships-excluded.jsonl`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-estate/footprint/memberships-excluded.jsonl.

| field | type | description |
|---|---|---|
| `_why_this_list` | string | Observed type string; non-null in 13/13 rows read; example: Bodies a reader might expect to find above, and are not ther… |
| `evidence` | url | Observed type url; non-null in 5/13 rows read; example: https://www.weforum.org/communities/ai-governance-alliance/ |
| `org` | string | Observed type string; non-null in 13/13 rows read; example: World Economic Forum — AI Governance Alliance |
| `reason` | string | Observed type string; non-null in 13/13 rows read; example: not_open |
| `why` | string | Observed type string; non-null in 13/13 rows read; example: A personal Strategic Intelligence account was opened on 2026… |

## `footprint/memberships.jsonl`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-estate/footprint/memberships.jsonl.

| field | type | description |
|---|---|---|
| `_honesty_line` | string | Observed type string; non-null in 33/33 rows read; example: Participation is not endorsement, and a listing is not adopt… |
| `answer` | string | Observed type string; non-null in 11/33 rows read; example: No. Council of AI takes part in W3C Community Groups as a pa… |
| `check` | string | Observed type string; non-null in 24/33 rows read; example: {"expect": ["Templeman", "csoai"]} |
| `evidence` | string | Observed type string; non-null in 33/33 rows read; example: https://www.w3.org/community/aikr/participants |
| `evidence_kind` | string | Observed type string; non-null in 33/33 rows read; example: public_url |
| `group` | string | Observed type string; non-null in 33/33 rows read; example: standards |
| `id` | string | Observed type string; non-null in 33/33 rows read; example: w3c-aikr |
| `kind` | string | Observed type string; non-null in 33/33 rows read; example: participant |
| `org` | string | Observed type string; non-null in 33/33 rows read; example: W3C AI KR (Artificial Intelligence Knowledge Representation)… |
| `public_evidence` | boolean | Observed type boolean; non-null in 33/33 rows read; example: true |
| `question` | string | Observed type string; non-null in 11/33 rows read; example: Is Council of AI a W3C member? |
| `short` | string | Observed type string; non-null in 33/33 rows read; example: W3C AI KR CG |
| `since` | datetime | Observed type datetime; non-null in 32/33 rows read; example: 2026-09-22 |
| `since_basis` | string | Observed type string; non-null in 33/33 rows read; example: W3C Accounts Team notice: Nicholas Templeman became a partic… |
| `state` | string | Observed type string; non-null in 33/33 rows read; example: VERIFIED |
| `verified_on` | datetime | Observed type datetime; non-null in 33/33 rows read; example: 2026-09-22 |
| `what_it_does_not_prove` | string | Observed type string; non-null in 33/33 rows read; example: Council of AI is not a W3C Member. Community Groups are free… |
| `what_it_proves` | string | Observed type string; non-null in 33/33 rows read; example: Nicholas Templeman is listed on the group's public participa… |
| `deadline` | datetime | Observed type datetime; non-null in 1/33 rows read; example: 2026-10-19 |

## `harness/harness-manifest.jsonl`

| field | type | description |
|---|---|---|
| `from` | string | Observed type string; non-null in 17/17 rows read; example: scripts/runpod_gspc_worker.py |
| `published_as` | string | Observed type string; non-null in 17/17 rows read; example: harness/runpod_gspc_worker.py |
| `sha256` | string | Observed type string; non-null in 17/17 rows read; example: 88409f5f3239c89a495dc236567d9874d7987648bf28f48888582363bbcf… |

## `manifest.jsonl`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-estate/manifest.jsonl.

| field | type | description |
|---|---|---|
| `bytes` | integer | Observed type integer; non-null in 1605/1605 rows read; example: 18348 |
| `path` | string | Observed type string; non-null in 1605/1605 rows read; example: README.md |
| `sha256` | string | Observed type string; non-null in 1605/1605 rows read; example: 4fe60c56a0cd247993935035ce10a0fa01997d8a228cd99f762b9a2d0885… |

## `ontology/context.jsonld`

TODO(owner): fields not obtainable anonymously.


## `ontology/crosswalk.jsonl`

TODO(owner): fields not obtainable anonymously.


## `ontology/terms.jsonl`

TODO(owner): fields not obtainable anonymously.


## `populations/populations.jsonl`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-estate/populations/populations.jsonl.

| field | type | description |
|---|---|---|
| `as_of` | datetime | Observed type datetime; non-null in 10/10 rows read; example: 2026-09-16T12:06:54Z |
| `door` | url | Observed type url; non-null in 10/10 rows read; example: https://councilof.ai/api/pop/stablecoins |
| `http_status_without_payment` | integer | Observed type integer; non-null in 10/10 rows read; example: 402 |
| `id` | string | Observed type string; non-null in 10/10 rows read; example: stablecoins |
| `n` | integer | Observed type integer; non-null in 9/10 rows read; example: 425 |
| `n_unit` | string | Observed type string; non-null in 10/10 rows read; example: assets catalogued in the frozen universe (not supply, not a … |
| `note` | string | Observed type string; non-null in 10/10 rows read; example: The door answers 402 without payment and the free preview tr… |
| `reason` | string | Observed type string; non-null in 0/10 rows read |
| `source` | string | Observed type string; non-null in 10/10 rows read; example: ["/interop/stablecoin-corpus-index-2026-09-16.json"] |
| `state` | string | Observed type string; non-null in 10/10 rows read; example: INDEXED |
| `unmeasured` | string | Observed type string; non-null in 10/10 rows read; example: ["the daily x402 Bazaar conformance census (csoai.x402-bazaa… |

## `summary.json`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-estate/summary.json.

Top-level keys: `arena_rounds`, `bank_items_total`, `banks_resolvable`, `banks_total`, `board_lid`, `board_totals`, `built_at`, `card_corpora`, `corrections`, `evidence_files`, `footprint`, `mill_cards`, `ots`, `populations`, `repo_commit`, `schema`, `superseded_entries`.
Records under `populations`:

| field | type | description |
|---|---|---|
| `as_of` | datetime | Observed type datetime; non-null in 10/10 rows read; example: 2026-09-16T12:06:54Z |
| `id` | string | Observed type string; non-null in 10/10 rows read; example: stablecoins |
| `n` | integer | Observed type integer; non-null in 9/10 rows read; example: 425 |
| `state` | string | Observed type string; non-null in 10/10 rows read; example: INDEXED |
