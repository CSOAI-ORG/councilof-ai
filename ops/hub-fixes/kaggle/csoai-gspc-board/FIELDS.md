# Field reference: nicktempleman/csoai-gspc-board

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `axis-register.json`

Top-level keys: `schema`, `issuer`, `served_from`, `gspc_registry_axes`, `of_14`, `counting_rule`, `axes`, `note`.
Records under `axes`:

| field | type | description |
|---|---|---|
| `axis` | string | Stable measurement axis identifier (Observed type string; non-null in 13/13 rows read; example: gov) |
| `scored_items` | integer | Observed type integer; non-null in 13/13 rows read; example: 237 |
| `models` | integer | Observed type integer; non-null in 13/13 rows read; example: 19 |
| `majority_baseline` | numeric | Observed type numeric; non-null in 13/13 rows read; example: 0.2911 |
| `status` | string | Published measurement state; unmeasured is an explicit gap (Observed type string; non-null in 13/13 rows read; example: MEASURED) |

## `board-axes.json`

Top-level keys: `schema`, `as_of`, `issuer`, `axes_total`, `axes_measured`, `axes_unmeasured`, `axes_with_hub_dataset`, `counting_rule`, `supersedes`, `not_to_be_confused_with`, `id_vocabulary`, `provenance`, `axes`, `never`.
Records under `axes`:

| field | type | description |
|---|---|---|
| `axis` | string | Stable measurement axis identifier (Observed type string; non-null in 23/23 rows read; example: governance) |
| `status` | string | Published measurement state; unmeasured is an explicit gap (Observed type string; non-null in 23/23 rows read; example: MEASURED) |
| `bench` | string | Observed type string; non-null in 23/23 rows read; example: GovBench |
| `task` | string | Observed type string; non-null in 23/23 rows read; example: EU AI Act risk-tier classification |
| `n` | integer | Published count for that axis; inspect its method before comparing counts (Observed type integer; non-null in 23/23 rows read; example: 237) |
| `dataset` | string | Source dataset identifier, when available (Observed type string; non-null in 22/23 rows read; example: csoai/gspc-gov) |

## `board.csv`

| field | type | description |
|---|---|---|
| `axis` | string | Stable measurement axis identifier (Observed type string; non-null in 23/23 rows read; example: governance) |
| `family` | string | Group of related axes (Observed type string; non-null in 23/23 rows read; example: gspc) |
| `kind` | string | Evidence type, such as model comparison, deterministic facts or declared slot (Observed type string; non-null in 23/23 rows read; example: model-comparison) |
| `status` | string | Published measurement state; unmeasured is an explicit gap (Observed type string; non-null in 23/23 rows read; example: MEASURED) |
| `n` | integer | Published count for that axis; inspect its method before comparing counts (Observed type integer; non-null in 23/23 rows read; example: 237) |
| `accuracy` | numeric | Observed type numeric; non-null in 3/23 rows read; example: 0.944 |
| `separation` | string | Statistical separation state, when applicable (Observed type string; non-null in 14/23 rows read; example: UNTESTED) |
| `leader` | string | Publicly displayable leader field, when available; it is not proof of a separated win (Observed type string; non-null in 3/23 rows read; example: gemma3:12b (base model)) |
| `bench` | string | Observed type string; non-null in 23/23 rows read; example: GovBench |

## `board.json`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-board/board.json.

Top-level keys: `schema`, `issuer`, `doi`, `doi_note`, `doi_status`, `doi_status_note`, `doi_status_since`, `doi_status_url`, `doi_alternative`, `measured_on`, `note`, `state_enum`, `totals`, `peritem_rows`, `bank_host`, `banked_axes`, `banked_axes_resolvable`, `banked_axes_unresolvable`, `bank_note`, `measurement_time_contract`, `axes`, `measured_in_lane`, `domains`, `limitations`, `public_model_identifier_policy`, `site_attestation`.
Records under `axes`:

| field | type | description |
|---|---|---|
| `axis` | string | Stable measurement axis identifier (Observed type string; non-null in 34/34 rows read; example: governance) |
| `family` | string | Group of related axes (Observed type string; non-null in 34/34 rows read; example: gspc) |
| `kind` | string | Evidence type, such as model comparison, deterministic facts or declared slot (Observed type string; non-null in 34/34 rows read; example: model-comparison) |
| `bench` | string | Observed type string; non-null in 34/34 rows read; example: GovBench |
| `task` | string | Observed type string; non-null in 34/34 rows read; example: EU AI Act risk-tier classification |
| `n` | integer | Published count for that axis; inspect its method before comparing counts (Observed type integer; non-null in 34/34 rows read; example: 237) |
| `separation` | string | Statistical separation state, when applicable (Observed type string; non-null in 14/34 rows read; example: TIE) |
| `separation_basis` | string | Observed type string; non-null in 14/34 rows read; example: Exact McNemar between the top two base models on the publish… |
| `fleet_mean` | numeric | Observed type numeric; non-null in 13/34 rows read; example: 0.49 |
| `mean_harm` | numeric | Observed type numeric; non-null in 12/34 rows read; example: 0.51 |
| `cvar05_harm` | numeric | Observed type numeric; non-null in 2/34 rows read; example: 0.8728 |
| `status` | string | Published measurement state; unmeasured is an explicit gap (Observed type string; non-null in 34/34 rows read; example: MEASURED) |
| `dataset` | string | Source dataset identifier, when available (Observed type string; non-null in 22/34 rows read; example: csoai/gspc-gov) |
| `colour` | string | Observed type string; non-null in 34/34 rows read; example: #34d399 |
| `hue` | integer | Observed type integer; non-null in 34/34 rows read; example: 152 |
| `method_status` | string | Observed type string; non-null in 34/34 rows read; example: meets-rule |
| `historical_measurement_record` | string | Observed type string; non-null in 11/34 rows read; example: {"state": "SUPERSEDED_FOR_PUBLIC_RANKING", "scope": "ORIGINA… |
| `leader` | string | Publicly displayable leader field, when available; it is not proof of a separated win (Observed type string; non-null in 9/34 rows read; example: mistral:7b (base model)) |
| `accuracy` | numeric | Observed type numeric; non-null in 9/34 rows read; example: 0.5865 |
| `interval` | string | Observed type string; non-null in 8/34 rows read; example: [0.523, 0.647] |
| `separation_p` | numeric | Observed type numeric; non-null in 7/34 rows read; example: 0.3787 |
| `separation_method` | string | Observed type string; non-null in 8/34 rows read; example: Exact McNemar on the discordant items, leader vs the best ba… |
| `separation_sentence` | string | Observed type string; non-null in 7/34 rows read; example: No model separated from the next best on this axis (exact Mc… |
| `separation_evidence` | string | Observed type string; non-null in 8/34 rows read; example: {"source": "https://huggingface.co/datasets/csoai/gspc-perit… |
| `peritem_file_sha256` | string | Observed type string; non-null in 13/34 rows read; example: 3a1d3193d3651448dd311efe4c7efcbdffb19e07fba06c15e628b844bfbf… |
| `leader_source` | string | Observed type string; non-null in 7/34 rows read; example: per-item rows |
| `leader_card_state` | string | Observed type string; non-null in 7/34 rows read; example: CARD_RECORDS_A_DIFFERENT_MEASUREMENT |
| `leader_card_note` | string | Observed type string; non-null in 7/34 rows read; example: leader shown from per-item rows; no signed per-model card ye… |
| `leader_card` | string | Observed type string; non-null in 3/34 rows read; example: cfba2ad1aaf8c3586d692a3b1f138f5e86f2adb0ac84f49353482c6fe864… |
| `leader_card_url` | string | Observed type string; non-null in 3/34 rows read; example: /signed/cards/cfba2ad1aaf8c3586d692a3b1f138f5e86f2adb0ac84f4… |
| `note` | string | Observed type string; non-null in 34/34 rows read; example: No model separated from the next best on this axis (exact Mc… |
| `distinct_items` | integer | Observed type integer; non-null in 14/34 rows read; example: 237 |
| `distinct_items_source` | string | Observed type string; non-null in 14/34 rows read; example: distinct item ids in the published per-item rows (peritem_go… |
| `mde` | string | Observed type string; non-null in 14/34 rows read; example: {"value": 0.138, "state": "MEASURED", "unit": "accuracy diff… |
| `measurement_time` | string | Observed type string; non-null in 34/34 rows read; example: {"state": "DAY", "precision": "day", "observed_on": "2026-08… |
| `dataset_url` | url | Observed type url; non-null in 22/34 rows read; example: https://huggingface.co/datasets/csoai/gspc-gov |
| `macro_f1` | numeric | Observed type numeric; non-null in 1/34 rows read; example: 0.944 |
| `unparsed_rate` | numeric | Observed type numeric; non-null in 1/34 rows read; example: 0.0541 |
| `excluded_leader` | string | Observed type string; non-null in 3/34 rows read; example: llama3.2:3b (base model) |
| `public_leader_state` | string | Observed type string; non-null in 5/34 rows read; example: NO_SIGNED_CARD |
| `excluded_note` | string | Observed type string; non-null in 5/34 rows read; example: This axis named an external base model as the point-leader b… |
| `separation_untested_reason` | string | Observed type string; non-null in 6/34 rows read; example: The published rows give TIE (exact McNemar p=0.5811, n=33), … |
| `separation_untested_reason_code` | string | Observed type string; non-null in 7/34 rows read; example: NO_SIGNED_CARD_FOR_AXIS |
| `n_note` | string | Observed type string; non-null in 7/34 rows read; example: 200 bank records, one exact-duplicate pair → 199 unique scor… |
| `separation_n_note` | string | Observed type string; non-null in 1/34 rows read; example: The test counts 200 rows per model over 199 distinct paired … |
| `accuracy_is` | string | Observed type string; non-null in 1/34 rows read; example: point estimate from the signed qwen2.5:7b candidate card b44… |
| `quotable_models` | string | Observed type string; non-null in 1/34 rows read; example: ["qwen2.5:0.5b-instruct", "CSOAI-owned specialist 8", "qwen2… |
| `quotable_note` | string | Observed type string; non-null in 1/34 rows read; example: 7 models x >=30 usable gold-bank rows (68-71 each, of 27 dis… |
| `fleet` | string | Observed type string; non-null in 1/34 rows read; example: 7 models (4 base + 2 of our own council models + 1 base vari… |
| `per_model` | string | Observed type string; non-null in 1/34 rows read; example: {"qwen3:4b": {"n": 68, "quotable": true, "tp": 6, "fp": 0, "… |
| `dataset_note` | string | Observed type string; non-null in 3/34 rows read; example: Frozen 71-row gold bank (27 distinct inputs), published on H… |
| `null_grammar` | string | Observed type string; non-null in 1/34 rows read; example: In per_model, null and 0.0 mean different things and are nev… |
| `interval_prompt_level` | string | Observed type string; non-null in 1/34 rows read; example: {"label": "DERIVED, UNSIGNED: prompt-level (cluster-aware) r… |
| `n_unit` | string | Observed type string; non-null in 19/34 rows read; example: tool-call servers probed |
| `facts_as_of` | datetime | Observed type datetime; non-null in 20/34 rows read; example: 2026-09-22T05:43:05Z |
| `evidence_url` | string | Observed type string; non-null in 20/34 rows read; example: /interop/effect-binding-server-probe-2026-09-22.signed.json |
| `run_attestation` | string | Observed type string; non-null in 19/34 rows read; example: ED25519_SIGNED |
| `coverage` | string | Observed type string; non-null in 2/34 rows read; example: 261 of 600 servers tried, from a population of 20,992 third-… |
| `coverage_note` | string | Observed type string; non-null in 2/34 rows read; example: The verdict population is biased toward servers that answer … |
| `carrier` | string | Observed type string; non-null in 1/34 rows read; example: attestation carrier is DEVNET; the facts are read from MAINN… |
| `facts_status` | string | Observed type string; non-null in 8/34 rows read; example: MEASURED |
| `applies_to` | string | Observed type string; non-null in 11/34 rows read; example: ai-labs |
| `method` | string | Observed type string; non-null in 11/34 rows read; example: scripts/subject-axis/subject-axis-live-run.mjs |
| `method_sha` | string | Observed type string; non-null in 11/34 rows read; example: 1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5… |
| `rate` | numeric | Observed type numeric; non-null in 10/34 rows read; example: 0.7027 |
| `rate_scale` | string | Observed type string; non-null in 10/34 rows read; example: fraction |
| `rate_rule` | string | Observed type string; non-null in 10/34 rows read; example: presence of at least 3 of 5 declared classes |
| `bank` | string | Observed type string; non-null in 11/34 rows read; example: interop/axis-banks/lab-practice-20261102.json |
| `bank_sha256` | string | Observed type string; non-null in 11/34 rows read; example: b96d0879876f0e405a27a350dde8e0f5d2737e9b69876c4b3287951a69c3… |
| `frame_sha256` | string | Observed type string; non-null in 10/34 rows read; example: 7f3c3c9843b8f6451e925e326dfef24ffd3c328e5e1d19cdb25efa7d0f0c… |
| `per_outcome` | string | Observed type string; non-null in 1/34 rows read; example: {"UNCHANGED": 12, "CHANGED": 110, "WITHDRAWN": 52, "UNREACHA… |

## `board.jsonl`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-board/board.jsonl.

| field | type | description |
|---|---|---|
| `axis` | string | Stable measurement axis identifier (Observed type string; non-null in 34/34 rows read; example: governance) |
| `family` | string | Group of related axes (Observed type string; non-null in 34/34 rows read; example: gspc) |
| `kind` | string | Evidence type, such as model comparison, deterministic facts or declared slot (Observed type string; non-null in 34/34 rows read; example: model-comparison) |
| `status` | string | Published measurement state; unmeasured is an explicit gap (Observed type string; non-null in 34/34 rows read; example: MEASURED) |
| `n` | integer | Published count for that axis; inspect its method before comparing counts (Observed type integer; non-null in 34/34 rows read; example: 237) |
| `separation` | string | Statistical separation state, when applicable (Observed type string; non-null in 14/34 rows read; example: TIE) |
| `leader` | string | Publicly displayable leader field, when available; it is not proof of a separated win (Observed type string; non-null in 34/34 rows read; example: mistral:7b (base model)) |
| `dataset` | string | Source dataset identifier, when available (Observed type string; non-null in 22/34 rows read; example: csoai/gspc-gov) |

## `board.parquet`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-board/board.parquet.

| field | type | description |
|---|---|---|
| `axis` | string | Stable measurement axis identifier (Observed type string; non-null in 34/34 rows read; example: governance) |
| `family` | string | Group of related axes (Observed type string; non-null in 34/34 rows read; example: gspc) |
| `kind` | string | Evidence type, such as model comparison, deterministic facts or declared slot (Observed type string; non-null in 34/34 rows read; example: model-comparison) |
| `status` | string | Published measurement state; unmeasured is an explicit gap (Observed type string; non-null in 34/34 rows read; example: MEASURED) |
| `n` | integer | Published count for that axis; inspect its method before comparing counts (Observed type integer; non-null in 34/34 rows read; example: 237) |
| `separation` | string | Statistical separation state, when applicable (Observed type string; non-null in 14/34 rows read; example: TIE) |
| `leader` | string | Publicly displayable leader field, when available; it is not proof of a separated win (Observed type string; non-null in 34/34 rows read; example: mistral:7b (base model)) |
| `dataset` | string | Source dataset identifier, when available (Observed type string; non-null in 22/34 rows read; example: csoai/gspc-gov) |

## `board.parquet.json`

| field | type | description |
|---|---|---|
| `axis` | string | Stable measurement axis identifier (Observed type string; non-null in 14/14 rows read; example: governance) |
| `bench` | string | Observed type string; non-null in 14/14 rows read; example: GovBench |
| `status` | string | Published measurement state; unmeasured is an explicit gap (Observed type string; non-null in 14/14 rows read; example: MEASURED) |
| `n` | integer | Published count for that axis; inspect its method before comparing counts (Observed type integer; non-null in 14/14 rows read; example: 237) |
| `separation` | string | Statistical separation state, when applicable (Observed type string; non-null in 14/14 rows read; example: SEPARATED) |
| `leader` | string | Publicly displayable leader field, when available; it is not proof of a separated win (Observed type string; non-null in 14/14 rows read; example: council-embodiment-v3-light (council specialist)) |
| `elo` | string | Observed type string; non-null in 0/14 rows read |
| `wilson_ci` | string | Observed type string; non-null in 0/14 rows read |

## `docs/MCP-2026-07-28-NEGATIVE-READBACK-2026-09-25/invalid-readonly-arguments-request.json`

Top-level keys: `jsonrpc`, `id`, `method`, `params`.


## `docs/MCP-2026-07-28-NEGATIVE-READBACK-2026-09-25/observations.json`

| field | type | description |
|---|---|---|
| `case` | string | Observed type string; non-null in 4/4 rows read; example: unknown-tool |
| `observed_at_utc` | datetime | Observed type datetime; non-null in 4/4 rows read; example: 2026-09-25T09:03:45.321589+00:00 |
| `curl_exit` | integer | Observed type integer; non-null in 4/4 rows read; example: 0 |
| `http_status` | string | Observed type string; non-null in 4/4 rows read; example: 200 |
| `request_sha256` | string | Observed type string; non-null in 4/4 rows read; example: 1b588f9073a3f65fb54ddaaa3123d6472ce10431329454612b795537ac95… |
| `headers_sha256` | string | Observed type string; non-null in 4/4 rows read; example: 0136b81468c9e19b8a7484b246a46bf26ae2fd654cbe4b39c33f3be3e844… |
| `body_sha256` | string | Observed type string; non-null in 4/4 rows read; example: a0d35f8277d908f5fa3128378c4003624574b700c028bb0824955bd2412a… |
| `request_path` | string | Observed type string; non-null in 4/4 rows read; example: unknown-tool-request.json |
| `headers_path` | string | Observed type string; non-null in 4/4 rows read; example: unknown-tool-headers.txt |
| `body_path` | string | Observed type string; non-null in 4/4 rows read; example: unknown-tool-body.bin |
| `jsonrpc_error_code` | integer | Observed type integer; non-null in 3/4 rows read; example: -32602 |
| `jsonrpc_error_message` | string | Observed type string; non-null in 3/4 rows read; example: Tool nonexistent_read_only_probe_20260925 not found |
| `tool_isError` | boolean | Observed type boolean; non-null in 1/4 rows read; example: true |

## `docs/MCP-2026-07-28-NEGATIVE-READBACK-2026-09-25/unknown-method-request.json`

Top-level keys: `jsonrpc`, `id`, `method`, `params`.


## `docs/MCP-2026-07-28-NEGATIVE-READBACK-2026-09-25/unknown-tool-request.json`

Top-level keys: `jsonrpc`, `id`, `method`, `params`.


## `docs/MCP-2026-07-28-NEGATIVE-READBACK-2026-09-25/unsupported-version-request.json`

Top-level keys: `jsonrpc`, `id`, `method`, `params`.


## `docs/MCP-CONFORMANCE-INITIALIZE-2026-09-25.json`

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 1/1 rows read; example: server-initialize |
| `name` | string | Observed type string; non-null in 1/1 rows read; example: ServerInitialize |
| `description` | string | Observed type string; non-null in 1/1 rows read; example: Server responds to initialize request with valid structure |
| `status` | string | Published measurement state; unmeasured is an explicit gap (Observed type string; non-null in 1/1 rows read; example: SUCCESS) |
| `timestamp` | datetime | Observed type datetime; non-null in 1/1 rows read; example: 2026-09-25T08:00:03.903Z |
| `specReferences` | string | Observed type string; non-null in 1/1 rows read; example: [{"id": "MCP-Initialize", "url": "https://modelcontextprotoc… |
| `details` | string | Observed type string; non-null in 1/1 rows read; example: {"serverUrl": "https://councilof.ai/mcp", "connected": true} |

## `docs/MCP-CONFORMANCE-PING-2026-09-25.json`

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 1/1 rows read; example: ping |
| `name` | string | Observed type string; non-null in 1/1 rows read; example: Ping |
| `description` | string | Observed type string; non-null in 1/1 rows read; example: Server responds to ping requests |
| `status` | string | Published measurement state; unmeasured is an explicit gap (Observed type string; non-null in 1/1 rows read; example: SUCCESS) |
| `timestamp` | datetime | Observed type datetime; non-null in 1/1 rows read; example: 2026-09-25T08:00:27.512Z |
| `specReferences` | string | Observed type string; non-null in 1/1 rows read; example: [{"id": "MCP-Ping", "url": "https://modelcontextprotocol.io/… |
| `details` | string | Observed type string; non-null in 1/1 rows read; example: {"result": {}} |

## `docs/MCP-CONFORMANCE-TOOLS-LIST-2026-09-25.json`

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 1/1 rows read; example: tools-list |
| `name` | string | Observed type string; non-null in 1/1 rows read; example: ToolsList |
| `description` | string | Observed type string; non-null in 1/1 rows read; example: Server lists available tools with valid structure |
| `status` | string | Published measurement state; unmeasured is an explicit gap (Observed type string; non-null in 1/1 rows read; example: SUCCESS) |
| `timestamp` | datetime | Observed type datetime; non-null in 1/1 rows read; example: 2026-09-25T08:00:29.765Z |
| `specReferences` | string | Observed type string; non-null in 1/1 rows read; example: [{"id": "MCP-Tools-List", "url": "https://modelcontextprotoc… |
| `details` | string | Observed type string; non-null in 1/1 rows read; example: {"toolCount": 13, "tools": ["board_totals", "get_axis", "ver… |

## `docs/MCP_2026_07_BOARD_TOTALS_BODY.json`

Top-level keys: `result`, `jsonrpc`, `id`.


## `docs/MCP_2026_07_BOARD_TOTALS_REQUEST.json`

Top-level keys: `jsonrpc`, `id`, `method`, `params`.


## `docs/MCP_2026_07_DISCOVER_REQUEST.json`

Top-level keys: `jsonrpc`, `id`, `method`, `params`.


## `docs/MCP_2026_07_TOOLS_LIST_BODY.json`

Top-level keys: `result`, `jsonrpc`, `id`.


## `docs/MCP_2026_07_TOOLS_LIST_REQUEST.json`

Top-level keys: `jsonrpc`, `id`, `method`, `params`.


## `docs/desnz-energy-agent-evidence-2026-09-25/synthetic-case.json`

Top-level keys: `schema`, `state`, `source`, `source_questions`, `signature`, `anchor`, `system_limit_abs_mw`, `events`, `expected`.
Records under `events`:

| field | type | description |
|---|---|---|
| `event_id` | string | Observed type string; non-null in 2/2 rows read; example: E1 |
| `actor` | string | Observed type string; non-null in 2/2 rows read; example: synthetic-storage-A |
| `authority` | string | Observed type string; non-null in 2/2 rows read; example: TEST_ONLY |
| `scope` | string | Observed type string; non-null in 2/2 rows read; example: fictional-zone-1 |
| `proposed_delta_mw` | integer | Observed type integer; non-null in 2/2 rows read; example: 3 |
| `local_limit_abs_mw` | integer | Observed type integer; non-null in 2/2 rows read; example: 4 |
| `local_decision` | string | Observed type string; non-null in 2/2 rows read; example: ACCEPT |
| `prev_event_sha256` | string | Observed type string; non-null in 2/2 rows read; example: GENESIS |
| `event_sha256` | string | Observed type string; non-null in 2/2 rows read; example: c56d553a354d707cb90042207aa43eae981e234dff36635447b55750bf5a… |

## `docs/opensharing-eval-profile-2026-09-25/CASES.jsonl`

| field | type | description |
|---|---|---|
| `case_id` | string | Observed type string; non-null in 3/3 rows read; example: fictional-listing-only |
| `input` | string | Observed type string; non-null in 3/3 rows read; example: {"scenario": "A fictional catalogue lists an evaluation asse… |
| `expected_evidence_state` | string | Observed type string; non-null in 3/3 rows read; example: DISCOVERED |
| `expected_measurement_admission` | boolean | Observed type boolean; non-null in 3/3 rows read; example: false |

## `docs/opensharing-eval-profile-2026-09-25/PROFILE.json`

Top-level keys: `title`, `status`, `open_sharing_context`, `asset`, `evaluation`, `generation`, `rights`, `distribution_boundary`, `claim`, `evidence_envelope`.


## `docs/opensharing-eval-profile-2026-09-25/SOURCE_READS.json`

Top-level keys: `read_date_utc`, `official_repository`, `commit`, `source_file_sha256`, `interpretation`.


## `docs/opensharing-eval-profile-2026-09-25/VALIDATION.json`

Top-level keys: `cases_sha256`, `results`.


## `docs/opensharing-eval-profile-2026-09-25/evidence-envelope-v0.1.json`

Top-level keys: `$schema`, `$id`, `title`, `description`, `type`, `additionalProperties`, `required`, `properties`.


## `docs/opensharing-eval-profile-2026-09-25/fixtures/reject-listing-as-trust.json`

Top-level keys: `title`, `status`, `open_sharing_context`, `asset`, `evaluation`, `generation`, `rights`, `distribution_boundary`, `claim`, `evidence_envelope`.


## `docs/opensharing-eval-profile-2026-09-25/fixtures/reject-missing-source-digest.json`

Top-level keys: `title`, `status`, `open_sharing_context`, `asset`, `evaluation`, `generation`, `rights`, `distribution_boundary`, `claim`, `evidence_envelope`.


## `evidence/x402/attribution-boundary-20260928/MANIFEST.json`

Top-level keys: `schema`, `state`, `files`, `verification`, `signature`, `bitcoin_anchor`, `limits`.


## `evidence/x402/attribution-boundary-20260928/summary.json`

Top-level keys: `schema`, `observed_date`, `external_display`, `bounded_chain_comparison`, `csoai_settlement_canon`, `limits`.


## `evidence/x402/attribution-boundary-20260928/transfers.json`

Top-level keys: `schema`, `chain`, `payTo`, `asset`, `cutoff`, `source`, `rows`.
Records under `rows`:

| field | type | description |
|---|---|---|
| `timestamp` | datetime | Observed type datetime; non-null in 49/49 rows read; example: 2026-09-22T13:36:21.000000Z |
| `transaction_hash` | string | Observed type string; non-null in 49/49 rows read; example: 0x36afada8c91e2557933d999837b7d27522d3d602ee5ef0d06bd339e799… |
| `log_index` | integer | Observed type integer; non-null in 49/49 rows read; example: 333 |
| `from` | string | Observed type string; non-null in 49/49 rows read; example: 0x212686404a7d1e1fd88f35ed6200c3af7a78ae31 |
| `to` | string | Observed type string; non-null in 49/49 rows read; example: 0x212686404a7d1e1fd88f35ed6200c3af7a78ae31 |
| `asset` | string | Observed type string; non-null in 49/49 rows read; example: 0x833589fcd6edb6e08f4c7c32d4f71b54bda02913 |
| `amount_atomic` | integer | Observed type integer; non-null in 49/49 rows read; example: 10000 |

## `evidence/x402/cdp-bazaar-discovery-2026-09-24.json`

Top-level keys: `schema`, `observed_at`, `url`, `http_status`, `body_sha256`, `payTo`, `resource_count`, `pagination`, `meaning`.


## `evidence/x402/cdp-door-validation-2026-09-24.json`

Top-level keys: `schema`, `observed_at`, `source_manifest`, `source_manifest_sha256`, `validator`, `paid_calls_or_settlements`, `meaning`, `results`.
Records under `results`:

| field | type | description |
|---|---|---|
| `resource` | url | Observed type url; non-null in 20/20 rows read; example: https://councilof.ai/api/request-attestation?subject=model-o… |
| `validator_http_status` | string | Observed type string; non-null in 20/20 rows read; example: 200 |
| `response_sha256` | string | Observed type string; non-null in 20/20 rows read; example: 185bc433210035815f0766305a84cd365c906c2cd32f105d8a427bf8d8d7… |
| `valid` | boolean | Observed type boolean; non-null in 20/20 rows read; example: true |
| `simulation_outcome` | string | Observed type string; non-null in 20/20 rows read; example: accepted |
| `required_failures` | string | Observed type string; non-null in 20/20 rows read |
| `advisory_failures` | string | Observed type string; non-null in 20/20 rows read |

## `evidence/x402/door-census-2026-09-25/door-census.json`

Top-level keys: `counts`, `interpretation_limits`, `kind`, `method`, `observed_at`, `payai_catalog_rows`, `rows`, `schema`, `sources`.
Records under `rows`:

| field | type | description |
|---|---|---|
| `asset_contract` | string | Observed type string; non-null in 21/21 rows read; example: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 |
| `cdp_validator_failed_checks` | string | Observed type string; non-null in 21/21 rows read; example: ["accepts[0].amount"] |
| `cdp_validator_http` | integer | Observed type integer; non-null in 21/21 rows read; example: 200 |
| `cdp_validator_index` | string | Observed type string; non-null in 0/21 rows read |
| `cdp_validator_simulation_outcome` | string | Observed type string; non-null in 21/21 rows read; example: accepted |
| `cdp_validator_valid` | boolean | Observed type boolean; non-null in 21/21 rows read; example: false |
| `challenge_http` | integer | Observed type integer; non-null in 21/21 rows read; example: 402 |
| `http_method` | string | Observed type string; non-null in 21/21 rows read; example: GET |
| `network` | string | Observed type string; non-null in 21/21 rows read; example: eip155:8453 |
| `pay_to` | string | Observed type string; non-null in 21/21 rows read; example: 0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31 |
| `payai_exact_last_probe_http` | integer | Observed type integer; non-null in 1/21 rows read; example: 402 |
| `payai_exact_last_updated` | datetime | Observed type datetime; non-null in 1/21 rows read; example: 2026-09-24T13:01:01.339Z |
| `payai_exact_listed` | boolean | Observed type boolean; non-null in 1/21 rows read; example: true |
| `payai_exact_listing_status_http` | integer | Observed type integer; non-null in 21/21 rows read; example: 200 |
| `payment_requirement_count` | integer | Observed type integer; non-null in 21/21 rows read; example: 1 |
| `python_urllib_observed_http` | integer | Observed type integer; non-null in 21/21 rows read; example: 403 |
| `quoted_atomic_amount` | string | Observed type string; non-null in 21/21 rows read; example: 0 |
| `resource_url` | url | Observed type url; non-null in 21/21 rows read; example: https://councilof.ai/api/free-door |

## `examples/discriminating-power-v1/FILES.sha256.json`

Top-level keys: `interactive.html`, `test_demo.py`, `demo.py`, `PROVENANCE.json`, `README.md`, `METHOD_NOTE.md`, `VALIDATION.json`, `fixtures/single-answer-bank.json`, `fixtures/no-control.json`, `fixtures/with-control.json`, `controls/admissible-wrong-answer.json`.


## `examples/discriminating-power-v1/PROVENANCE.json`

Top-level keys: `schema`, `name`, `version`, `date`, `synthetic`, `model_runs`, `signed`, `anchored`, `standards_conformance_claim`, `origin_case`, `scope`, `licence`, `ai_assistance_disclosed`.


## `examples/discriminating-power-v1/VALIDATION.json`

Top-level keys: `schema`, `checked_at`, `unit_tests_passed`, `python_command_exit`, `generated_html_browser_checks_passed`, `browser_context`, `viewports`, `limitations`, `status`.


## `examples/discriminating-power-v1/control-example/FILES.sha256.json`

TODO(owner): fields not obtainable anonymously.


## `examples/discriminating-power-v1/control-example/PROVENANCE.json`

TODO(owner): fields not obtainable anonymously.


## `examples/discriminating-power-v1/control-example/VALIDATION.json`

TODO(owner): fields not obtainable anonymously.


## `examples/discriminating-power-v1/control-example/controls/admissible-wrong-answer.json`

Top-level keys: `synthetic`, `check_sha256`, `input_role`, `answer`, `expected`, `observed`.


## `examples/discriminating-power-v1/control-example/fixtures/no-control.json`

Top-level keys: `schema`, `synthetic`, `subject`, `check`, `check_sha256`, `attempts`, `rollup`, `discrimination`.
Records under `attempts`:

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 1/1 rows read; example: demo-001 |
| `answer` | string | Observed type string; non-null in 1/1 rows read; example: B |
| `outcome` | string | Observed type string; non-null in 1/1 rows read; example: PASS |

## `examples/discriminating-power-v1/control-example/fixtures/single-answer-bank.json`

Top-level keys: `schema`, `synthetic`, `subject`, `check`, `check_sha256`, `attempts`, `rollup`, `discrimination`.
Records under `attempts`:

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 1/1 rows read; example: demo-001 |
| `answer` | string | Observed type string; non-null in 1/1 rows read; example: B |
| `outcome` | string | Observed type string; non-null in 1/1 rows read; example: PASS |

## `examples/discriminating-power-v1/control-example/fixtures/with-control.json`

Top-level keys: `schema`, `synthetic`, `subject`, `check`, `check_sha256`, `attempts`, `rollup`, `discrimination`.
Records under `attempts`:

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 1/1 rows read; example: demo-001 |
| `answer` | string | Observed type string; non-null in 1/1 rows read; example: B |
| `outcome` | string | Observed type string; non-null in 1/1 rows read; example: PASS |

## `examples/discriminating-power-v1/controls/admissible-wrong-answer.json`

TODO(owner): fields not obtainable anonymously.


## `examples/discriminating-power-v1/fixtures/no-control.json`

TODO(owner): fields not obtainable anonymously.


## `examples/discriminating-power-v1/fixtures/single-answer-bank.json`

TODO(owner): fields not obtainable anonymously.


## `examples/discriminating-power-v1/fixtures/with-control.json`

TODO(owner): fields not obtainable anonymously.


## `examples/evidence-directory-2026-09-18/FILES.sha256.json`

Top-level keys: `schema`, `scope`, `files`.


## `examples/evidence-directory-2026-09-18/sources.json`

Top-level keys: `schema`, `prepared_at`, `source_review_as_of`, `title`, `publisher`, `canonical_site`, `type`, `licence`, `free_public_verification`, `sources`, `examples`, `scope_limits`, `amendments`.
Records under `sources`:

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 6/6 rows read; example: sec-edgar |
| `title` | string | Observed type string; non-null in 6/6 rows read; example: SEC EDGAR public data APIs |
| `kind` | string | Evidence type, such as model comparison, deterministic facts or declared slot (Observed type string; non-null in 6/6 rows read; example: PUBLIC_ENTITY_FILING_DATA) |
| `source` | string | Observed type string; non-null in 6/6 rows read; example: {"authority": "ORIGINAL_PUBLISHER", "url": "https://www.sec.… |
| `applicable_constructs` | string | Observed type string; non-null in 6/6 rows read; example: ["actor_identity", "disclosure", "provenance", "change"] |
| `limits` | string | Observed type string; non-null in 6/6 rows read; example: ["Not the authenticated EDGAR filing API.", "CIK identifies … |
| `states` | string | Observed type string; non-null in 6/6 rows read; example: {"admission": "REFERENCE_ONLY_NOT_RUNTIME_ADMISSION", "execu… |
| `access_licence` | string | Observed type string; non-null in 6/6 rows read; example: {"access": "PUBLIC_READING", "redistribution": "LINK_ONLY; o… |

## `examples/layer0-a2a-boundary-2026-09-25/A2A-LAYER0-RAW-2026-09-25.jsonl`

| field | type | description |
|---|---|---|
| `name` | string | Observed type string; non-null in 4/4 rows read; example: safe_public_board_question |
| `protocol_version_header` | string | Observed type string; non-null in 4/4 rows read; example: 1.0 |
| `endpoint` | url | Observed type url; non-null in 4/4 rows read; example: https://councilof.ai/api/a2a |
| `request` | string | Observed type string; non-null in 4/4 rows read; example: {"jsonrpc": "2.0", "id": "csoai-readonly-probe-1", "method":… |
| `response_http` | integer | Observed type integer; non-null in 4/4 rows read; example: 200 |
| `response_content_type` | string | Observed type string; non-null in 4/4 rows read; example: application/json; charset=utf-8 |
| `response_raw_utf8` | string | Observed type string; non-null in 4/4 rows read; example: {
  "jsonrpc": "2.0",
  "id": "csoai-readonly-probe-1",
  "e… |
| `response_sha256` | string | Observed type string; non-null in 4/4 rows read; example: 69dcfd51d2e1cc3c2515aae86e9bae9c9baa82cb428c9b350452e1ed982d… |

## `examples/layer0-a2a-boundary-2026-09-25/A2A-LAYER0-RECEIPT-2026-09-25.json`

Top-level keys: `schema`, `as_of`, `card_url`, `card_sha256`, `raw_sha256`, `case_count`, `case_names`, `expected`, `scope`.


## `examples/layer0-a2a-boundary-2026-09-25/agent-card.json`

Top-level keys: `name`, `description`, `version`, `provider`, `supportedInterfaces`, `documentationUrl`, `iconUrl`, `capabilities`, `defaultInputModes`, `defaultOutputModes`, `skills`, `catalogUrl`, `doi`, `explicitly_not`.
Records under `skills`:

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 8/8 rows read; example: gspc-board |
| `name` | string | Observed type string; non-null in 8/8 rows read; example: Signed GSPC Board |
| `description` | string | Observed type string; non-null in 8/8 rows read; example: SendMessage answers with the live board: totals.lid verbatim… |
| `tags` | string | Observed type string; non-null in 8/8 rows read; example: ["measurement", "governance", "verification"] |
| `examples` | string | Observed type string; non-null in 8/8 rows read; example: ["SendMessage with Part.data {\"skill\":\"gspc-board\",\"inp… |

## `examples/layer0-mcp-catalog-2026-09-24/LAYER0-MCP-CATALOG-BITCOIN-ANCHOR-VERIFICATION-2026-09-25.json`

Top-level keys: `schema`, `observed_at_utc`, `state`, `raw_public_url`, `raw_sha256`, `raw_bytes`, `ots_sha256`, `earliest_block_height`, `existence_no_later_than_block_time_utc`, `paths`, `limits`.
Records under `paths`:

| field | type | description |
|---|---|---|
| `height` | integer | Observed type integer; non-null in 4/4 rows read; example: 968433 |
| `block_hash` | string | Observed type string; non-null in 4/4 rows read; example: 00000000000000000001d88fef070a61dd1d20a013a3c5ae3a914e0c1dec… |
| `block_time_utc` | datetime | Observed type datetime; non-null in 4/4 rows read; example: 2026-09-24T18:02:02+00:00 |
| `ots_message_hex` | string | Observed type string; non-null in 4/4 rows read; example: 4c7cc16b3a00031bf0edfea855e6fa5e0290c17f9c4cfc0a20fa0a52a8eb… |
| `two_explorers_agree` | boolean | Observed type boolean; non-null in 4/4 rows read; example: true |
| `header_pow_target_match` | boolean | Observed type boolean; non-null in 4/4 rows read; example: true |
| `merkle_match` | boolean | Observed type boolean; non-null in 4/4 rows read; example: true |

## `examples/layer0-mcp-catalog-2026-09-24/LAYER0-MCP-CATALOG-RAW-2026-09-24.jsonl`

| field | type | description |
|---|---|---|
| `case` | string | Observed type string; non-null in 27/27 rows read; example: inventory |
| `observed_at_utc` | datetime | Observed type datetime; non-null in 27/27 rows read; example: 2026-09-24T17:16:01.701091+00:00 |
| `url` | url | Observed type url; non-null in 27/27 rows read; example: https://councilof.ai/mcp |
| `http` | integer | Observed type integer; non-null in 27/27 rows read; example: 200 |
| `content_type` | string | Observed type string; non-null in 27/27 rows read; example: text/event-stream |
| `request_sha256` | string | Observed type string; non-null in 27/27 rows read; example: 17b0e4fe8898d0f7b668dd1437d3078266e8d170bc490ebbb012e2bbbcd7… |
| `request_b64` | string | Observed type string; non-null in 27/27 rows read; example: eyJqc29ucnBjIjoiMi4wIiwiaWQiOjEsIm1ldGhvZCI6InRvb2xzL2xpc3Qi… |
| `response_sha256` | string | Observed type string; non-null in 27/27 rows read; example: 4799f262aae3a825be4411a13a5b0f145043520ba532d020d5015f976012… |
| `response_b64` | string | Observed type string; non-null in 27/27 rows read; example: ZXZlbnQ6IG1lc3NhZ2UKZGF0YTogeyJyZXN1bHQiOnsidG9vbHMiOlt7Im5h… |

## `examples/layer0-mcp-catalog-2026-09-24/LAYER0-MCP-CATALOG-RECEIPT-2026-09-24.json`

Top-level keys: `schema`, `state`, `observed_at_utc`, `target`, `raw_sha256`, `case_count`, `tool_count`, `observations`, `scope`, `limits`.


## `examples/layer0-mcp-input-boundary-2026-09-24/LAYER0-MCP-INPUT-BOUNDARY-BITCOIN-ANCHOR-VERIFICATION-2026-09-25.json`

Top-level keys: `schema`, `observed_at_utc`, `state`, `raw_public_url`, `raw_sha256`, `raw_bytes`, `ots_sha256`, `earliest_block_height`, `existence_no_later_than_block_time_utc`, `paths`, `limits`.
Records under `paths`:

| field | type | description |
|---|---|---|
| `height` | integer | Observed type integer; non-null in 4/4 rows read; example: 968433 |
| `block_hash` | string | Observed type string; non-null in 4/4 rows read; example: 00000000000000000001d88fef070a61dd1d20a013a3c5ae3a914e0c1dec… |
| `block_time_utc` | datetime | Observed type datetime; non-null in 4/4 rows read; example: 2026-09-24T18:02:02+00:00 |
| `ots_message_hex` | string | Observed type string; non-null in 4/4 rows read; example: 4c7cc16b3a00031bf0edfea855e6fa5e0290c17f9c4cfc0a20fa0a52a8eb… |
| `two_explorers_agree` | boolean | Observed type boolean; non-null in 4/4 rows read; example: true |
| `header_pow_target_match` | boolean | Observed type boolean; non-null in 4/4 rows read; example: true |
| `merkle_match` | boolean | Observed type boolean; non-null in 4/4 rows read; example: true |

## `examples/layer0-mcp-input-boundary-2026-09-24/LAYER0-MCP-INPUT-BOUNDARY-RAW-2026-09-24.jsonl`

| field | type | description |
|---|---|---|
| `case` | string | Observed type string; non-null in 5/5 rows read; example: schema |
| `observed_at_utc` | datetime | Observed type datetime; non-null in 5/5 rows read; example: 2026-09-24T17:01:01.012692+00:00 |
| `url` | url | Observed type url; non-null in 5/5 rows read; example: https://councilof.ai/mcp |
| `http` | integer | Observed type integer; non-null in 5/5 rows read; example: 200 |
| `content_type` | string | Observed type string; non-null in 5/5 rows read; example: text/event-stream |
| `request_sha256` | string | Observed type string; non-null in 5/5 rows read; example: 17b0e4fe8898d0f7b668dd1437d3078266e8d170bc490ebbb012e2bbbcd7… |
| `request_b64` | string | Observed type string; non-null in 5/5 rows read; example: eyJqc29ucnBjIjoiMi4wIiwiaWQiOjEsIm1ldGhvZCI6InRvb2xzL2xpc3Qi… |
| `response_sha256` | string | Observed type string; non-null in 5/5 rows read; example: 4799f262aae3a825be4411a13a5b0f145043520ba532d020d5015f976012… |
| `response_b64` | string | Observed type string; non-null in 5/5 rows read; example: ZXZlbnQ6IG1lc3NhZ2UKZGF0YTogeyJyZXN1bHQiOnsidG9vbHMiOlt7Im5h… |

## `examples/layer0-mcp-input-boundary-2026-09-24/LAYER0-MCP-INPUT-BOUNDARY-RECEIPT-2026-09-24.json`

Top-level keys: `schema`, `state`, `observed_at_utc`, `target`, `raw_sha256`, `case_count`, `controls`, `scope`, `limit`.


## `examples/lfx-openbmc-observation-20260928/openbmc-observation.json`

Top-level keys: `bitcoin_anchor`, `gspc_state`, `observation`, `projection`, `schema`, `signature`.


## `examples/offline-snapshot-replay-v1/KIT_MANIFEST.json`

Top-level keys: `schema`, `created_at`, `files`, `new_evaluations`, `network_during_checker_execution`, `signature_state`.


## `examples/offline-snapshot-replay-v1/REPLAY_RESULTS.json`

Top-level keys: `schema`, `checked_at`, `source_revisions`, `all_eight_source_files_byte_identical`, `replays`, `software_tests`, `notebook_code_cell_executed_locally`, `notebook_cloud_executed`, `socket_connections_blocked_during_replay`, `new_measurements`, `new_signatures`, `new_payments`, `licensing_changed`.


## `examples/offline-snapshot-replay-v1/SOURCE_READS.json`

Top-level keys: `schema`, `checked_at`, `hf_commit`, `kaggle_version`, `files`, `new_publications`, `new_measurements`, `licenses_changed`.
Records under `files`:

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 8/8 rows read; example: README.md |
| `source_url` | url | Observed type url; non-null in 8/8 rows read; example: https://huggingface.co/datasets/csoai/gspc-board/resolve/e4c… |
| `bytes` | integer | Observed type integer; non-null in 8/8 rows read; example: 11214 |
| `sha256` | string | Observed type string; non-null in 8/8 rows read; example: e8ebd7675c0fd3a599b944aed2ec0c945cf03dcf13a4210a8fc11423833d… |
| `matches_kaggle_bytes` | boolean | Observed type boolean; non-null in 8/8 rows read; example: true |

## `examples/offline-snapshot-replay-v1/snapshot-replay-kit/KIT_MANIFEST.json`

TODO(owner): fields not obtainable anonymously.


## `examples/offline-snapshot-replay-v1/snapshot-replay-kit/REPLAY_RESULTS.json`

TODO(owner): fields not obtainable anonymously.


## `examples/offline-snapshot-replay-v1/snapshot-replay-kit/SOURCE_READS.json`

TODO(owner): fields not obtainable anonymously.


## `examples/offline-snapshot-replay-v1/snapshot-replay-kit/fixture/SNAPSHOT.json`

TODO(owner): fields not obtainable anonymously.


## `examples/offline-snapshot-replay-v1/snapshot-replay-kit/fixture/board.json`

TODO(owner): fields not obtainable anonymously.


## `examples/offline-snapshot-replay-v1/snapshot-replay-kit/fixture/gspc-axes.csv`

TODO(owner): fields not obtainable anonymously.


## `examples/offline-snapshot-replay-v1/snapshot-replay-kit/fixture/gspc-axes.jsonl`

TODO(owner): fields not obtainable anonymously.


## `examples/offline-snapshot-replay-v1/snapshot-replay-kit/fixture/manifest.jsonl`

TODO(owner): fields not obtainable anonymously.


## `examples/offline-snapshot-replay-v1/snapshot-replay-kit/fixture/root.json`

TODO(owner): fields not obtainable anonymously.


## `examples/open-stack-integration-candidate-20260928/integrations/openshell-gspc/toolset.json`

TODO(owner): fields not obtainable anonymously.


## `examples/open-stack-integration-candidate-20260928/measurement/crosswalk/sources/osaia-safe.json`

TODO(owner): fields not obtainable anonymously.


## `examples/open-stack-integration-candidate-20260928/packaging/lfx-gspc/PACKAGE-MANIFEST.json`

TODO(owner): fields not obtainable anonymously.


## `examples/open-stack-integration-candidate-20260928/packaging/lfx-gspc/lfx-onboarding.json`

TODO(owner): fields not obtainable anonymously.


## `examples/open-stack-integration-candidate-20260928/packaging/lfx-gspc/sbom.spdx.json`

TODO(owner): fields not obtainable anonymously.


## `examples/open-stack-source-watch-20260928-v2/source-watch/MANIFEST.json`

TODO(owner): fields not obtainable anonymously.


## `examples/open-stack-source-watch-20260928-v2/source-watch/live-first.json`

TODO(owner): fields not obtainable anonymously.


## `examples/open-stack-source-watch-20260928-v2/source-watch/live-second.json`

TODO(owner): fields not obtainable anonymously.


## `examples/open-stack-source-watch-20260928-v2/source-watch/live-third.json`

TODO(owner): fields not obtainable anonymously.


## `examples/open-stack-source-watch-20260928-v2/source-watch/profiles.json`

TODO(owner): fields not obtainable anonymously.


## `examples/open-stack-source-watch-20260928-v2/source-watch/sources.json`

TODO(owner): fields not obtainable anonymously.


## `examples/open-stack-source-watch-20260928/source-watch/MANIFEST.json`

TODO(owner): fields not obtainable anonymously.


## `examples/open-stack-source-watch-20260928/source-watch/live-first.json`

TODO(owner): fields not obtainable anonymously.


## `examples/open-stack-source-watch-20260928/source-watch/live-second.json`

TODO(owner): fields not obtainable anonymously.


## `examples/open-stack-source-watch-20260928/source-watch/live-third.json`

TODO(owner): fields not obtainable anonymously.


## `examples/open-stack-source-watch-20260928/source-watch/profiles.json`

TODO(owner): fields not obtainable anonymously.


## `examples/open-stack-source-watch-20260928/source-watch/sources.json`

TODO(owner): fields not obtainable anonymously.


## `examples/openlineage-evidence-replay-v1/CSOAI_OpenLineage_Delivery_2026-09-25/DELIVERY_MANIFEST.json`

Top-level keys: `boundary`, `files`, `schema`.


## `examples/openlineage-evidence-replay-v1/CSOAI_OpenLineage_Delivery_2026-09-25/OpenLineage-2-0-2.json`

Top-level keys: `$schema`, `$id`, `$defs`, `oneOf`.
Records under `oneOf`:

| field | type | description |
|---|---|---|
| `$ref` | string | Observed type string; non-null in 3/3 rows read; example: #/$defs/RunEvent |

## `examples/openlineage-evidence-replay-v1/CSOAI_OpenLineage_Delivery_2026-09-25/SOURCE_READS.json`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 3/3 rows read; example: OpenLineage-2-0-2.json |
| `url` | url | Observed type url; non-null in 3/3 rows read; example: https://openlineage.io/spec/2-0-2/OpenLineage.json |
| `sha256` | string | Observed type string; non-null in 3/3 rows read; example: 69f68bee00b9beac88a87059c0102410e7bb05f3f43c46d02a0409831ece… |
| `bytes` | integer | Observed type integer; non-null in 3/3 rows read; example: 9155 |
| `observed_at` | datetime | Observed type datetime; non-null in 3/3 rows read; example: 2026-09-25T09:00:04.000983+00:00 |
| `prior_pin_matched` | boolean | Observed type boolean; non-null in 3/3 rows read; example: false |

## `examples/openlineage-evidence-replay-v1/CSOAI_OpenLineage_Delivery_2026-09-25/deepagents-events.json`

| field | type | description |
|---|---|---|
| `eventTime` | datetime | Observed type datetime; non-null in 2/2 rows read; example: 2026-09-25T09:01:29.755893+00:00 |
| `eventType` | string | Observed type string; non-null in 2/2 rows read; example: START |
| `inputs` | string | Observed type string; non-null in 2/2 rows read; example: [{"name": "ac1d136daf1ef9f9f9be571b4e6210042800dd63263bf3e4b… |
| `job` | string | Observed type string; non-null in 2/2 rows read; example: {"name": "retained-evidence-projection", "namespace": "urn:c… |
| `outputs` | string | Observed type string; non-null in 2/2 rows read; example: [{"name": "c323ea98b3858ac9cb677687d28a070835972e391050eb98f… |
| `producer` | string | Observed type string; non-null in 2/2 rows read; example: urn:csoai:adapter:retained-evidence-openlineage:0.1 |
| `run` | string | Observed type string; non-null in 2/2 rows read; example: {"facets": {"csoai_evidence": {"_producer": "urn:csoai:adapt… |
| `schemaURL` | url | Observed type url; non-null in 2/2 rows read; example: https://openlineage.io/spec/2-0-2/OpenLineage.json#/$defs/Ru… |

## `examples/openlineage-evidence-replay-v1/CSOAI_OpenLineage_Delivery_2026-09-25/deepagents.json`

TODO(owner): fields not obtainable anonymously.


## `examples/openlineage-evidence-replay-v1/CSOAI_OpenLineage_Delivery_2026-09-25/facet-schema.json`

Top-level keys: `$id`, `$schema`, `additionalProperties`, `properties`, `required`, `type`.


## `examples/openlineage-evidence-replay-v1/CSOAI_OpenLineage_Delivery_2026-09-25/pydantic-ai-events.json`

| field | type | description |
|---|---|---|
| `eventTime` | datetime | Observed type datetime; non-null in 2/2 rows read; example: 2026-09-25T09:01:29.758884+00:00 |
| `eventType` | string | Observed type string; non-null in 2/2 rows read; example: START |
| `inputs` | string | Observed type string; non-null in 2/2 rows read; example: [{"name": "5723a65bf7f6e879eb519d94d1b71e1dddb39d96d29895d25… |
| `job` | string | Observed type string; non-null in 2/2 rows read; example: {"name": "retained-evidence-projection", "namespace": "urn:c… |
| `outputs` | string | Observed type string; non-null in 2/2 rows read; example: [{"name": "a49efafadfda872adca30147d520defd689ac23ddbb4b4908… |
| `producer` | string | Observed type string; non-null in 2/2 rows read; example: urn:csoai:adapter:retained-evidence-openlineage:0.1 |
| `run` | string | Observed type string; non-null in 2/2 rows read; example: {"facets": {"csoai_evidence": {"_producer": "urn:csoai:adapt… |
| `schemaURL` | url | Observed type url; non-null in 2/2 rows read; example: https://openlineage.io/spec/2-0-2/OpenLineage.json#/$defs/Ru… |

## `examples/openlineage-evidence-replay-v1/CSOAI_OpenLineage_Delivery_2026-09-25/pydantic-ai.json`

TODO(owner): fields not obtainable anonymously.


## `examples/openlineage-evidence-replay-v1/kit/DELIVERY_MANIFEST.json`

TODO(owner): fields not obtainable anonymously.


## `examples/openlineage-evidence-replay-v1/kit/OpenLineage-2-0-2.json`

TODO(owner): fields not obtainable anonymously.


## `examples/openlineage-evidence-replay-v1/kit/SOURCE_READS.json`

TODO(owner): fields not obtainable anonymously.


## `examples/openlineage-evidence-replay-v1/kit/deepagents-events.json`

TODO(owner): fields not obtainable anonymously.


## `examples/openlineage-evidence-replay-v1/kit/deepagents.json`

Top-level keys: `checked_at`, `claim_boundary`, `controls`, `customer_acceptance`, `delta`, `inputs`, `method`, `new_board_scores`, `payments`, `question`, `release_checks`, `schema`, `source_dependency_alignment`, `state`.
Records under `controls`:

| field | type | description |
|---|---|---|
| `inner_control_changed_member` | string | Observed type string; non-null in 2/2 rows read; example: deepagents/__init__.py |
| `inner_control_outer_pin_intentionally_changed` | boolean | Observed type boolean; non-null in 2/2 rows read; example: true |
| `inner_tamper_rejected` | boolean | Observed type boolean; non-null in 2/2 rows read; example: true |
| `original_bytes_modified` | boolean | Observed type boolean; non-null in 2/2 rows read; example: false |
| `outer_tamper_rejected` | boolean | Observed type boolean; non-null in 2/2 rows read; example: true |
| `positive_state` | string | Observed type string; non-null in 2/2 rows read; example: PINNED_ARCHIVE_RECORDS_VERIFIED |
| `schema` | string | Observed type string; non-null in 2/2 rows read; example: csoai.release-control-results/1.0 |
| `vendor_code_executed` | boolean | Observed type boolean; non-null in 2/2 rows read; example: false |

## `examples/openlineage-evidence-replay-v1/kit/facet-schema.json`

TODO(owner): fields not obtainable anonymously.


## `examples/openlineage-evidence-replay-v1/kit/pydantic-ai-events.json`

TODO(owner): fields not obtainable anonymously.


## `examples/openlineage-evidence-replay-v1/kit/pydantic-ai.json`

Top-level keys: `checked_at`, `claim_boundary`, `controls`, `customer_acceptance`, `delta`, `inputs`, `method`, `new_board_scores`, `payments`, `question`, `release_checks`, `schema`, `source_dependency_alignment`, `state`.
Records under `controls`:

| field | type | description |
|---|---|---|
| `inner_control_changed_member` | string | Observed type string; non-null in 2/2 rows read; example: pydantic_ai-2.49.0.dist-info/METADATA |
| `inner_control_outer_pin_intentionally_changed` | boolean | Observed type boolean; non-null in 2/2 rows read; example: true |
| `inner_tamper_rejected` | boolean | Observed type boolean; non-null in 2/2 rows read; example: true |
| `original_bytes_modified` | boolean | Observed type boolean; non-null in 2/2 rows read; example: false |
| `outer_tamper_rejected` | boolean | Observed type boolean; non-null in 2/2 rows read; example: true |
| `positive_state` | string | Observed type string; non-null in 2/2 rows read; example: PINNED_ARCHIVE_RECORDS_VERIFIED |
| `schema` | string | Observed type string; non-null in 2/2 rows read; example: csoai.release-control-results/1.0 |
| `vendor_code_executed` | boolean | Observed type boolean; non-null in 2/2 rows read; example: false |

## `examples/release-delta-replay-v1/DELIVERY_MANIFEST.json`

Top-level keys: `built_at`, `files`, `new_model_runs`, `new_payments`, `original_inputs_sha256`, `original_result_sha256`, `private_customer_records`, `schema`, `unsigned`, `vendor_archives_included`.


## `examples/release-delta-replay-v1/WORK_REQUESTS.json`

Top-level keys: `requests`, `schema`, `submitted`.
Records under `requests`:

| field | type | description |
|---|---|---|
| `after_revision` | string | Observed type string; non-null in 2/2 rows read; example: 0.7.19 |
| `before_revision` | string | Observed type string; non-null in 2/2 rows read; example: 0.7.18 |
| `buyer` | string | Observed type string; non-null in 0/2 rows read |
| `execution_authority` | boolean | Observed type boolean; non-null in 2/2 rows read; example: false |
| `payment` | string | Observed type string; non-null in 0/2 rows read |
| `price` | string | Observed type string; non-null in 0/2 rows read |
| `question` | string | Observed type string; non-null in 2/2 rows read; example: In an explicitly authorised local fixture, do the changed fi… |
| `regulatory_certification` | boolean | Observed type boolean; non-null in 2/2 rows read; example: false |
| `request_id` | string | Observed type string; non-null in 2/2 rows read; example: ras-draft:10363e12a74f91765b710cb96127f8e1b69108541834af3015… |
| `required_inputs` | string | Observed type string; non-null in 2/2 rows read; example: ["authorised deployment/fixture", "frozen environment and de… |
| `runtime_answer` | string | Observed type string; non-null in 2/2 rows read; example: UNMEASURED |
| `schema` | string | Observed type string; non-null in 2/2 rows read; example: csoai.ras-followup-scope/1.0 |
| `source_report_sha256` | string | Observed type string; non-null in 2/2 rows read; example: ac1d136daf1ef9f9f9be571b4e6210042800dd63263bf3e4b4e37d6dd5c2… |
| `state` | string | Observed type string; non-null in 2/2 rows read; example: UNSENT_SCOPE_DRAFT |
| `subject` | string | Observed type string; non-null in 2/2 rows read; example: deepagents |

## `examples/release-delta-replay-v1/catalogue.json`

Top-level keys: `new_payments`, `new_signatures`, `reports`, `routing_is_not_authority`, `schema`.
Records under `reports`:

| field | type | description |
|---|---|---|
| `after` | string | Observed type string; non-null in 2/2 rows read; example: 0.7.19 |
| `before` | string | Observed type string; non-null in 2/2 rows read; example: 0.7.18 |
| `completed_question` | string | Observed type string; non-null in 2/2 rows read; example: Which exact retained files and declared dependencies changed… |
| `new_question_id` | string | Observed type string; non-null in 2/2 rows read; example: ras-draft:10363e12a74f91765b710cb96127f8e1b69108541834af3015… |
| `observed_at` | datetime | Observed type datetime; non-null in 2/2 rows read; example: 2026-09-25T05:19:45.012983+00:00 |
| `report` | string | Observed type string; non-null in 2/2 rows read; example: reports/deepagents.json |
| `report_sha256` | string | Observed type string; non-null in 2/2 rows read; example: ac1d136daf1ef9f9f9be571b4e6210042800dd63263bf3e4b4e37d6dd5c2… |
| `runtime_status` | string | Observed type string; non-null in 2/2 rows read; example: UNMEASURED |
| `subject` | string | Observed type string; non-null in 2/2 rows read; example: deepagents |

## `examples/release-delta-replay-v1/release-delta-replay-kit/DELIVERY_MANIFEST.json`

TODO(owner): fields not obtainable anonymously.


## `examples/release-delta-replay-v1/release-delta-replay-kit/WORK_REQUESTS.json`

TODO(owner): fields not obtainable anonymously.


## `examples/release-delta-replay-v1/release-delta-replay-kit/catalogue.json`

TODO(owner): fields not obtainable anonymously.


## `examples/release-delta-replay-v1/release-delta-replay-kit/reports/deepagents.json`

TODO(owner): fields not obtainable anonymously.


## `examples/release-delta-replay-v1/release-delta-replay-kit/reports/pydantic-ai.json`

TODO(owner): fields not obtainable anonymously.


## `examples/release-delta-replay-v1/release-delta-replay-kit/source/DELTA_PIN.json`

Top-level keys: `schema`, `manifest_sha256`, `trust`.


## `examples/release-delta-replay-v1/release-delta-replay-kit/source/RELEASE_DELTA_INPUTS.json`

Top-level keys: `schema`, `source`, `plan`.
Records under `plan`:

| field | type | description |
|---|---|---|
| `name` | string | Observed type string; non-null in 2/2 rows read; example: deepagents |
| `versions` | string | Observed type string; non-null in 2/2 rows read; example: [{"version": "0.7.18", "source_sha256": "a46e29f801aff8a3b2b… |

## `examples/release-delta-replay-v1/release-delta-replay-kit/source/RELEASE_DELTA_RESULT.json`

Top-level keys: `acquisition`, `artifact_bytes_verified`, `checked_at`, `completed_scope`, `files`, `input_sha256`, `new_model_measurements`, `new_signatures`, `payments`, `publicly_published`, `reports`, `runtime_network_calls`, `schema`, `state`, `vendor_code_executed`, `vendor_installations`.
Records under `acquisition`:

| field | type | description |
|---|---|---|
| `bytes` | integer | Observed type integer; non-null in 4/4 rows read; example: 335603 |
| `checked_at` | datetime | Observed type datetime; non-null in 4/4 rows read; example: 2026-09-25T05:19:44.936941+00:00 |
| `sha256` | string | Observed type string; non-null in 4/4 rows read; example: f3a9a4087609ea7dc8a49e31098eae79f7d791ac580be57fbebbca17931d… |
| `state` | string | Observed type string; non-null in 4/4 rows read; example: RETAINED_BYTES_REUSED |
| `url` | url | Observed type url; non-null in 4/4 rows read; example: https://files.pythonhosted.org/packages/65/45/f0ac4aaf69d308… |

## `examples/release-delta-replay-v1/reports/deepagents.json`

Top-level keys: `checked_at`, `claim_boundary`, `controls`, `customer_acceptance`, `delta`, `inputs`, `method`, `new_board_scores`, `payments`, `question`, `release_checks`, `schema`, `source_dependency_alignment`, `state`.
Records under `controls`:

| field | type | description |
|---|---|---|
| `inner_control_changed_member` | string | Observed type string; non-null in 2/2 rows read; example: deepagents/__init__.py |
| `inner_control_outer_pin_intentionally_changed` | boolean | Observed type boolean; non-null in 2/2 rows read; example: true |
| `inner_tamper_rejected` | boolean | Observed type boolean; non-null in 2/2 rows read; example: true |
| `original_bytes_modified` | boolean | Observed type boolean; non-null in 2/2 rows read; example: false |
| `outer_tamper_rejected` | boolean | Observed type boolean; non-null in 2/2 rows read; example: true |
| `positive_state` | string | Observed type string; non-null in 2/2 rows read; example: PINNED_ARCHIVE_RECORDS_VERIFIED |
| `schema` | string | Observed type string; non-null in 2/2 rows read; example: csoai.release-control-results/1.0 |
| `vendor_code_executed` | boolean | Observed type boolean; non-null in 2/2 rows read; example: false |

## `examples/release-delta-replay-v1/reports/pydantic-ai.json`

Top-level keys: `checked_at`, `claim_boundary`, `controls`, `customer_acceptance`, `delta`, `inputs`, `method`, `new_board_scores`, `payments`, `question`, `release_checks`, `schema`, `source_dependency_alignment`, `state`.
Records under `controls`:

| field | type | description |
|---|---|---|
| `inner_control_changed_member` | string | Observed type string; non-null in 2/2 rows read; example: pydantic_ai-2.49.0.dist-info/METADATA |
| `inner_control_outer_pin_intentionally_changed` | boolean | Observed type boolean; non-null in 2/2 rows read; example: true |
| `inner_tamper_rejected` | boolean | Observed type boolean; non-null in 2/2 rows read; example: true |
| `original_bytes_modified` | boolean | Observed type boolean; non-null in 2/2 rows read; example: false |
| `outer_tamper_rejected` | boolean | Observed type boolean; non-null in 2/2 rows read; example: true |
| `positive_state` | string | Observed type string; non-null in 2/2 rows read; example: PINNED_ARCHIVE_RECORDS_VERIFIED |
| `schema` | string | Observed type string; non-null in 2/2 rows read; example: csoai.release-control-results/1.0 |
| `vendor_code_executed` | boolean | Observed type boolean; non-null in 2/2 rows read; example: false |

## `examples/release-delta-replay-v1/source/DELTA_PIN.json`

TODO(owner): fields not obtainable anonymously.


## `examples/release-delta-replay-v1/source/RELEASE_DELTA_INPUTS.json`

TODO(owner): fields not obtainable anonymously.


## `examples/release-delta-replay-v1/source/RELEASE_DELTA_RESULT.json`

TODO(owner): fields not obtainable anonymously.


## `examples/release-record-replay-v1/DELIVERY_MANIFEST.json`

Top-level keys: `built_at`, `files`, `original_local_manifest_sha256`, `private_candidates_included`, `schema`, `third_party_archives_included`, `unsigned`.


## `examples/release-record-replay-v1/EXPECTED_RELEASES.json`

Top-level keys: `schema`, `releases`, `third_party_wheels_included`, `download_is_not_installation`.
Records under `releases`:

| field | type | description |
|---|---|---|
| `bytes` | integer | Observed type integer; non-null in 3/3 rows read; example: 255110 |
| `filename` | string | Observed type string; non-null in 3/3 rows read; example: a2a_sdk-1.1.5-py3-none-any.whl |
| `name` | string | Observed type string; non-null in 3/3 rows read; example: a2a-sdk |
| `sha256` | string | Observed type string; non-null in 3/3 rows read; example: c1d63d36b79a097c62dd9be001fce21d5939f5a811a9c5afd0ba8082f13f… |
| `version` | string | Observed type string; non-null in 3/3 rows read; example: 1.1.5 |
| `source_url` | url | Observed type url; non-null in 3/3 rows read; example: https://files.pythonhosted.org/packages/0b/91/087e4281bae91e… |
| `source_metadata_url` | url | Observed type url; non-null in 3/3 rows read; example: https://pypi.org/pypi/a2a-sdk/json |
| `source_metadata_sha256` | string | Observed type string; non-null in 3/3 rows read; example: f13f78e1186a370e0fb7dc9e6e31add43709dad49a238d1cde2abca34e68… |

## `examples/release-record-replay-v1/release-record-replay-kit/DELIVERY_MANIFEST.json`

TODO(owner): fields not obtainable anonymously.


## `examples/release-record-replay-v1/release-record-replay-kit/EXPECTED_RELEASES.json`

TODO(owner): fields not obtainable anonymously.


## `examples/release-record-replay-v1/release-record-replay-kit/results/dependency-graph.json`

Top-level keys: `edges`, `nodes`, `schema_id`.
Records under `edges`:

| field | type | description |
|---|---|---|
| `evidence_ids` | string | Observed type string; non-null in 36/36 rows read |
| `metadata` | string | Observed type string; non-null in 36/36 rows read |
| `propagation` | string | Observed type string; non-null in 36/36 rows read; example: source_to_target |
| `relation` | string | Observed type string; non-null in 36/36 rows read; example: supports |
| `source_id` | string | Observed type string; non-null in 36/36 rows read; example: source:strands-harness:71823660f2f730fd4962a50d504468c4ec056… |
| `target_id` | string | Observed type string; non-null in 36/36 rows read; example: report:418e0b7fa437900a9b63932291c9724a34a01174db508f1153c1c… |

## `examples/release-record-replay-v1/release-record-replay-kit/results/impact-controls.json`

Top-level keys: `canonical_graph_mutated`, `cases`, `original_dependencies_changed`, `schema`, `scope`, `state`.
Records under `cases`:

| field | type | description |
|---|---|---|
| `affected_deliveries` | string | Observed type string; non-null in 4/4 rows read; example: ["delivery:418e0b7fa437900a9b63932291c9724a34a01174db508f115… |
| `changed_dependency` | string | Observed type string; non-null in 4/4 rows read; example: artifact:strands-harness:0d9ab3d81edaf340962f2fc4e22f11d645c… |
| `delivery_state_on_change` | string | Observed type string; non-null in 4/4 rows read; example: HOLD_UNTIL_RECHECKED |
| `synthetic_change_only` | boolean | Observed type boolean; non-null in 4/4 rows read; example: true |
| `unrelated_deliveries_held` | boolean | Observed type boolean; non-null in 3/4 rows read; example: false |

## `examples/release-record-replay-v1/release-record-replay-kit/results/policy.json`

Top-level keys: `allowed_record_hashes`, `archive_policy`, `limits`, `profile`, `wheel_major_version`.


## `examples/release-record-replay-v1/release-record-replay-kit/results/reports/a2a-sdk.json`

Top-level keys: `commercial`, `evidence`, `evidence_content_id`, `freshness`, `gspc_board_promotions`, `limitation`, `new_model_evaluations`, `new_roots`, `new_signatures`, `observed_at`, `operator_scope`, `question`, `report_id`, `request_id`, `route`, `schema`, `source`, `state`, `subject`.


## `examples/release-record-replay-v1/release-record-replay-kit/results/reports/langgraph.json`

Top-level keys: `commercial`, `evidence`, `evidence_content_id`, `freshness`, `gspc_board_promotions`, `limitation`, `new_model_evaluations`, `new_roots`, `new_signatures`, `observed_at`, `operator_scope`, `question`, `report_id`, `request_id`, `route`, `schema`, `source`, `state`, `subject`.


## `examples/release-record-replay-v1/release-record-replay-kit/results/reports/strands-harness.json`

Top-level keys: `commercial`, `evidence`, `evidence_content_id`, `freshness`, `gspc_board_promotions`, `limitation`, `new_model_evaluations`, `new_roots`, `new_signatures`, `observed_at`, `operator_scope`, `question`, `report_id`, `request_id`, `route`, `schema`, `source`, `state`, `subject`.


## `examples/release-record-replay-v1/release-record-replay-kit/results/summary.json`

Top-level keys: `as_of`, `fingerprint`, `graph_scope`, `graph_summary`, `hive_catalogue`, `internal_files_hash_verified`, `method`, `new_board_scores`, `new_model_runs`, `new_signatures`, `payments`, `publication_note`, `publications_this_run`, `qualified_buyers`, `registry_content_id`, `report_refs`, `reports`, `route_contract_sha256`, `schema`, `source_requests`, `source_run_id`, `states`.
Records under `report_refs`:

| field | type | description |
|---|---|---|
| `name` | string | Observed type string; non-null in 3/3 rows read; example: strands-harness |
| `path` | string | Observed type string; non-null in 3/3 rows read; example: reports/strands-harness.json |
| `report_id` | string | Observed type string; non-null in 3/3 rows read; example: 418e0b7fa437900a9b63932291c9724a34a01174db508f1153c1cbd099ec… |

## `examples/release-record-replay-v1/results/dependency-graph.json`

TODO(owner): fields not obtainable anonymously.


## `examples/release-record-replay-v1/results/impact-controls.json`

TODO(owner): fields not obtainable anonymously.


## `examples/release-record-replay-v1/results/policy.json`

TODO(owner): fields not obtainable anonymously.


## `examples/release-record-replay-v1/results/reports/a2a-sdk.json`

TODO(owner): fields not obtainable anonymously.


## `examples/release-record-replay-v1/results/reports/langgraph.json`

TODO(owner): fields not obtainable anonymously.


## `examples/release-record-replay-v1/results/reports/strands-harness.json`

TODO(owner): fields not obtainable anonymously.


## `examples/release-record-replay-v1/results/summary.json`

TODO(owner): fields not obtainable anonymously.


## `examples/verifier-walkthrough-2026-09-18/EVIDENCE.json`

Top-level keys: `schema`, `created_at`, `recorded_at`, `recording_complete_at`, `duration_seconds`, `video_sha256`, `original_card_source`, `original_card_created`, `original_input_sha256`, `altered_input_sha256`, `observations`, `source_recheck`, `limits`, `authority`, `recording_method`, `license`, `attribution`.
Records under `observations`:

| field | type | description |
|---|---|---|
| `action` | string | Observed type string; non-null in 2/2 rows read; example: original-card-verified |
| `at` | datetime | Observed type datetime; non-null in 2/2 rows read; example: 2026-09-18T06:04:20.060Z |
| `text` | string | Observed type string; non-null in 2/2 rows read; example: ✓ VERIFIED — this record reproduces its own id and its signa… |

## `examples/verifier-walkthrough-2026-09-18/FILES.sha256.json`

Top-level keys: `schema`, `files`, `note`.


## `examples/verifier-walkthrough-2026-09-18/historical-card.json`

Top-level keys: `alg`, `body`, `id`, `preimage_rule`, `pubkey`, `signature`.


## `examples/x402-live-index-reconciliation-20260928/MANIFEST.json`

Top-level keys: `files`, `limits`, `schema`, `state`.


## `examples/x402-live-index-reconciliation-20260928/live.json`

Top-level keys: `comparisons`, `limits`, `observed_at`, `payment_sent`, `schema`, `settlement_observed`, `source`, `status`.
Records under `comparisons`:

| field | type | description |
|---|---|---|
| `challenge_sha256` | string | Observed type string; non-null in 6/6 rows read; example: e6dd1f7dd74c8a4c832b7d9bac3708f6a2068cd42a688791ee99e2cde69f… |
| `comparison` | string | Observed type string; non-null in 6/6 rows read; example: {"differences": {}, "indexed_amount_atomic": "0", "live_amou… |
| `door` | string | Observed type string; non-null in 6/6 rows read; example: free-door |
| `http_status` | integer | Observed type integer; non-null in 6/6 rows read; example: 402 |
| `listed` | boolean | Observed type boolean; non-null in 6/6 rows read; example: true |
| `listing_last_updated` | datetime | Observed type datetime; non-null in 6/6 rows read; example: 2026-09-24T13:01:01.339Z |
| `url` | url | Observed type url; non-null in 6/6 rows read; example: https://councilof.ai/api/free-door |

## `gspc-board.jsonl`

| field | type | description |
|---|---|---|
| `axis` | string | Stable measurement axis identifier (Observed type string; non-null in 10/10 rows read; example: bond-router) |
| `labels` | string | Observed type string; non-null in 10/10 rows read; example: ["ATTESTABLE", "PARTIAL", "NOT_ATTESTABLE"] |
| `n` | integer | Published count for that axis; inspect its method before comparing counts (Observed type integer; non-null in 10/10 rows read; example: 12) |
| `strong_acc` | numeric | Observed type numeric; non-null in 10/10 rows read; example: 1.0 |
| `strong_ci` | string | Observed type string; non-null in 10/10 rows read; example: [0.758, 1.0] |
| `baseline_acc` | numeric | Observed type numeric; non-null in 10/10 rows read; example: 0.583 |
| `baseline_ci` | string | Observed type string; non-null in 10/10 rows read; example: [0.32, 0.807] |
| `status` | string | Published measurement state; unmeasured is an explicit gap (Observed type string; non-null in 10/10 rows read; example: MEASURED) |

## `history/pre-sync-2026-09-24/board.json`

Top-level keys: `schema`, `issuer`, `doi`, `doi_note`, `measured_on`, `note`, `totals`, `axes`, `measured_in_lane`, `domains`, `limitations`, `site_attestation`.
Records under `axes`:

| field | type | description |
|---|---|---|
| `axis` | string | Stable measurement axis identifier (Observed type string; non-null in 14/14 rows read; example: governance) |
| `bench` | string | Observed type string; non-null in 14/14 rows read; example: GovBench |
| `task` | string | Observed type string; non-null in 14/14 rows read; example: EU AI Act risk-tier classification |
| `n` | integer | Published count for that axis; inspect its method before comparing counts (Observed type integer; non-null in 14/14 rows read; example: 237) |
| `accuracy` | numeric | Observed type numeric; non-null in 14/14 rows read; example: 0.7 |
| `leader` | string | Publicly displayable leader field, when available; it is not proof of a separated win (Observed type string; non-null in 14/14 rows read; example: council-embodiment-v3-light (council specialist)) |
| `separation` | string | Statistical separation state, when applicable (Observed type string; non-null in 14/14 rows read; example: SEPARATED) |
| `separation_p` | numeric | Observed type numeric; non-null in 12/14 rows read; example: 0.0086 |
| `interval` | string | Observed type string; non-null in 12/14 rows read; example: [0.639, 0.755] |
| `fleet_mean` | numeric | Observed type numeric; non-null in 13/14 rows read; example: 0.49 |
| `mean_harm` | numeric | Observed type numeric; non-null in 12/14 rows read; example: 0.51 |
| `cvar05_harm` | numeric | Observed type numeric; non-null in 2/14 rows read; example: 0.8728 |
| `macro_f1` | numeric | Observed type numeric; non-null in 12/14 rows read; example: 0.705 |
| `unparsed_rate` | numeric | Observed type numeric; non-null in 12/14 rows read; example: 0.0386 |
| `status` | string | Published measurement state; unmeasured is an explicit gap (Observed type string; non-null in 14/14 rows read; example: MEASURED) |
| `dataset` | string | Source dataset identifier, when available (Observed type string; non-null in 14/14 rows read; example: csoai/gspc-gov) |
| `colour` | string | Observed type string; non-null in 14/14 rows read; example: #34d399 |
| `hue` | integer | Observed type integer; non-null in 14/14 rows read; example: 152 |
| `note` | string | Observed type string; non-null in 14/14 rows read; example: v2 bank: 237 public items (+102 held back privately), import… |
| `n_note` | string | Observed type string; non-null in 3/14 rows read; example: 200 bank records, one exact-duplicate pair → 199 unique scor… |
| `accuracy_is` | string | Observed type string; non-null in 1/14 rows read; example: 95% Wilson LOWER BOUND — a conservative floor, not the point… |
| `separation_basis` | string | Observed type string; non-null in 1/14 rows read; example: 95% Wilson non-overlap: leader lower bound 0.384 clears runn… |
| `fleet` | string | Observed type string; non-null in 1/14 rows read; example: 7 models (4 base + 2 council fine-tunes + 1 base variant) — … |
| `per_model` | string | Observed type string; non-null in 1/14 rows read; example: {"qwen3:4b": {"tp": 6, "fp": 0, "tn": 30, "fn": 32, "precisi… |

## `history/pre-sync-2026-09-24/living-board.json`

Top-level keys: `schema`, `issuer`, `doi`, `doi_note`, `measured_on`, `note`, `totals`, `bank_host`, `banked_axes`, `banked_axes_resolvable`, `banked_axes_unresolvable`, `bank_note`, `axes`, `measured_in_lane`, `domains`, `limitations`, `site_attestation`.
Records under `axes`:

| field | type | description |
|---|---|---|
| `axis` | string | Stable measurement axis identifier (Observed type string; non-null in 22/22 rows read; example: governance) |
| `family` | string | Group of related axes (Observed type string; non-null in 22/22 rows read; example: gspc) |
| `kind` | string | Evidence type, such as model comparison, deterministic facts or declared slot (Observed type string; non-null in 22/22 rows read; example: model-comparison) |
| `bench` | string | Observed type string; non-null in 22/22 rows read; example: GovBench |
| `task` | string | Observed type string; non-null in 22/22 rows read; example: EU AI Act risk-tier classification |
| `n` | integer | Published count for that axis; inspect its method before comparing counts (Observed type integer; non-null in 22/22 rows read; example: 237) |
| `accuracy` | numeric | Observed type numeric; non-null in 14/22 rows read; example: 0.7 |
| `leader` | string | Publicly displayable leader field, when available; it is not proof of a separated win (Observed type string; non-null in 14/22 rows read; example: council-embodiment-v3-light (council specialist)) |
| `separation` | string | Statistical separation state, when applicable (Observed type string; non-null in 14/22 rows read; example: SEPARATED) |
| `separation_p` | numeric | Observed type numeric; non-null in 12/22 rows read; example: 0.0086 |
| `interval` | string | Observed type string; non-null in 13/22 rows read; example: [0.639, 0.755] |
| `fleet_mean` | numeric | Observed type numeric; non-null in 13/22 rows read; example: 0.49 |
| `mean_harm` | numeric | Observed type numeric; non-null in 12/22 rows read; example: 0.51 |
| `cvar05_harm` | numeric | Observed type numeric; non-null in 2/22 rows read; example: 0.8728 |
| `macro_f1` | numeric | Observed type numeric; non-null in 12/22 rows read; example: 0.705 |
| `unparsed_rate` | numeric | Observed type numeric; non-null in 12/22 rows read; example: 0.0386 |
| `status` | string | Published measurement state; unmeasured is an explicit gap (Observed type string; non-null in 22/22 rows read; example: MEASURED) |
| `dataset` | string | Source dataset identifier, when available (Observed type string; non-null in 14/22 rows read; example: csoai/gspc-gov) |
| `colour` | string | Observed type string; non-null in 22/22 rows read; example: #34d399 |
| `hue` | integer | Observed type integer; non-null in 22/22 rows read; example: 152 |
| `note` | string | Observed type string; non-null in 22/22 rows read; example: v2 bank: 237 public items (+102 held back privately), import… |
| `dataset_url` | url | Observed type url; non-null in 14/22 rows read; example: https://huggingface.co/datasets/csoai/gspc-gov |
| `n_note` | string | Observed type string; non-null in 4/22 rows read; example: 200 bank records, one exact-duplicate pair → 199 unique scor… |
| `accuracy_is` | string | Observed type string; non-null in 1/22 rows read; example: 95% Wilson LOWER BOUND — a conservative floor, not the point… |
| `separation_basis` | string | Observed type string; non-null in 1/22 rows read; example: 95% Wilson non-overlap: leader lower bound 0.384 clears runn… |
| `separation_method` | string | Observed type string; non-null in 1/22 rows read; example: Wilson 95% interval over n=71 items tested against the fleet… |
| `separation_evidence` | string | Observed type string; non-null in 1/22 rows read; example: {"leader": "qwen2.5:0.5b-instruct", "leader_acc": 0.5915, "w… |
| `quotable_models` | string | Observed type string; non-null in 1/22 rows read; example: ["qwen2.5:0.5b-instruct", "council-safe", "qwen2.5:7b", "mis… |
| `quotable_note` | string | Observed type string; non-null in 1/22 rows read; example: 7 models x >=30 usable gold-bank items (68-71 each); per-mod… |
| `fleet` | string | Observed type string; non-null in 1/22 rows read; example: 7 models (4 base + 2 council fine-tunes + 1 base variant) — … |
| `per_model` | string | Observed type string; non-null in 1/22 rows read; example: {"qwen3:4b": {"n": 68, "quotable": true, "tp": 6, "fp": 0, "… |
| `dataset_note` | string | Observed type string; non-null in 1/22 rows read; example: Frozen 71-cell gold bank, published on HuggingFace 2026-08-2… |
| `null_grammar` | string | Observed type string; non-null in 1/22 rows read; example: In per_model, null and 0.0 mean different things and are nev… |
| `n_unit` | string | Observed type string; non-null in 8/22 rows read; example: issuer accounts (not bank items) |
| `evidence_url` | string | Observed type string; non-null in 7/22 rows read; example: /interop/financial-measure-run-v2.json |
| `coverage` | string | Observed type string; non-null in 1/22 rows read; example: 6 of the 16 instruments named in the registry |
| `coverage_note` | string | Observed type string; non-null in 1/22 rows read; example: The registry NAMES 16 instruments and this axis COVERS 6. Th… |
| `carrier` | string | Observed type string; non-null in 1/22 rows read; example: attestation carrier is DEVNET; the facts are read from MAINN… |

## `internance/otel.json`

Top-level keys: `schema`, `writes_board`, `collector`, `otlp`, `gen_ai_spans`, `otel_trace_id`, `otel_trace_hash`, `honesty`.


## `internance/pqc.json`

Top-level keys: `schema`, `writes_board`, `kind`, `not_an_axis`, `as_of`, `continuity_axis`, `estate_signatures`, `honesty`, `live`.


## `internance/trace.json`

Top-level keys: `schema`, `kind`, `writes_board`, `claims`, `honesty`, `emitter`.


## `internance/xrpl-16.json`

Top-level keys: `schema`, `kind`, `writes_board`, `as_of`, `honesty`, `counts`, `rows`.
Records under `rows`:

| field | type | description |
|---|---|---|
| `name` | string | Observed type string; non-null in 16/16 rows read; example: RLUSD |
| `locate` | string | Observed type string; non-null in 16/16 rows read; example: located |
| `r_address` | string | Observed type string; non-null in 9/16 rows read; example: rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De |
| `control_facts` | string | Observed type string; non-null in 16/16 rows read; example: MEASURED |
| `source` | string | Observed type string; non-null in 9/16 rows read; example: rwa-registry + /api/xrpl + financial-measure-run-v2 |

## `living-board.json`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-board/living-board.json.

Top-level keys: `schema`, `issuer`, `doi`, `doi_note`, `doi_status`, `doi_status_note`, `doi_status_since`, `doi_status_url`, `doi_alternative`, `measured_on`, `note`, `state_enum`, `totals`, `peritem_rows`, `bank_host`, `banked_axes`, `banked_axes_resolvable`, `banked_axes_unresolvable`, `bank_note`, `measurement_time_contract`, `axes`, `measured_in_lane`, `domains`, `limitations`, `public_model_identifier_policy`, `site_attestation`.
Records under `axes`:

| field | type | description |
|---|---|---|
| `axis` | string | Stable measurement axis identifier (Observed type string; non-null in 34/34 rows read; example: governance) |
| `family` | string | Group of related axes (Observed type string; non-null in 34/34 rows read; example: gspc) |
| `kind` | string | Evidence type, such as model comparison, deterministic facts or declared slot (Observed type string; non-null in 34/34 rows read; example: model-comparison) |
| `bench` | string | Observed type string; non-null in 34/34 rows read; example: GovBench |
| `task` | string | Observed type string; non-null in 34/34 rows read; example: EU AI Act risk-tier classification |
| `n` | integer | Published count for that axis; inspect its method before comparing counts (Observed type integer; non-null in 34/34 rows read; example: 237) |
| `separation` | string | Statistical separation state, when applicable (Observed type string; non-null in 14/34 rows read; example: TIE) |
| `separation_basis` | string | Observed type string; non-null in 14/34 rows read; example: Exact McNemar between the top two base models on the publish… |
| `fleet_mean` | numeric | Observed type numeric; non-null in 13/34 rows read; example: 0.49 |
| `mean_harm` | numeric | Observed type numeric; non-null in 12/34 rows read; example: 0.51 |
| `cvar05_harm` | numeric | Observed type numeric; non-null in 2/34 rows read; example: 0.8728 |
| `status` | string | Published measurement state; unmeasured is an explicit gap (Observed type string; non-null in 34/34 rows read; example: MEASURED) |
| `dataset` | string | Source dataset identifier, when available (Observed type string; non-null in 22/34 rows read; example: csoai/gspc-gov) |
| `colour` | string | Observed type string; non-null in 34/34 rows read; example: #34d399 |
| `hue` | integer | Observed type integer; non-null in 34/34 rows read; example: 152 |
| `method_status` | string | Observed type string; non-null in 34/34 rows read; example: meets-rule |
| `historical_measurement_record` | string | Observed type string; non-null in 11/34 rows read; example: {"state": "SUPERSEDED_FOR_PUBLIC_RANKING", "scope": "ORIGINA… |
| `leader` | string | Publicly displayable leader field, when available; it is not proof of a separated win (Observed type string; non-null in 9/34 rows read; example: mistral:7b (base model)) |
| `accuracy` | numeric | Observed type numeric; non-null in 9/34 rows read; example: 0.5865 |
| `interval` | string | Observed type string; non-null in 8/34 rows read; example: [0.523, 0.647] |
| `separation_p` | numeric | Observed type numeric; non-null in 7/34 rows read; example: 0.3787 |
| `separation_method` | string | Observed type string; non-null in 8/34 rows read; example: Exact McNemar on the discordant items, leader vs the best ba… |
| `separation_sentence` | string | Observed type string; non-null in 7/34 rows read; example: No model separated from the next best on this axis (exact Mc… |
| `separation_evidence` | string | Observed type string; non-null in 8/34 rows read; example: {"source": "https://huggingface.co/datasets/csoai/gspc-perit… |
| `peritem_file_sha256` | string | Observed type string; non-null in 13/34 rows read; example: 3a1d3193d3651448dd311efe4c7efcbdffb19e07fba06c15e628b844bfbf… |
| `leader_source` | string | Observed type string; non-null in 7/34 rows read; example: per-item rows |
| `leader_card_state` | string | Observed type string; non-null in 7/34 rows read; example: CARD_RECORDS_A_DIFFERENT_MEASUREMENT |
| `leader_card_note` | string | Observed type string; non-null in 7/34 rows read; example: leader shown from per-item rows; no signed per-model card ye… |
| `leader_card` | string | Observed type string; non-null in 3/34 rows read; example: cfba2ad1aaf8c3586d692a3b1f138f5e86f2adb0ac84f49353482c6fe864… |
| `leader_card_url` | string | Observed type string; non-null in 3/34 rows read; example: /signed/cards/cfba2ad1aaf8c3586d692a3b1f138f5e86f2adb0ac84f4… |
| `note` | string | Observed type string; non-null in 34/34 rows read; example: No model separated from the next best on this axis (exact Mc… |
| `distinct_items` | integer | Observed type integer; non-null in 14/34 rows read; example: 237 |
| `distinct_items_source` | string | Observed type string; non-null in 14/34 rows read; example: distinct item ids in the published per-item rows (peritem_go… |
| `mde` | string | Observed type string; non-null in 14/34 rows read; example: {"value": 0.138, "state": "MEASURED", "unit": "accuracy diff… |
| `measurement_time` | string | Observed type string; non-null in 34/34 rows read; example: {"state": "DAY", "precision": "day", "observed_on": "2026-08… |
| `dataset_url` | url | Observed type url; non-null in 22/34 rows read; example: https://huggingface.co/datasets/csoai/gspc-gov |
| `macro_f1` | numeric | Observed type numeric; non-null in 1/34 rows read; example: 0.944 |
| `unparsed_rate` | numeric | Observed type numeric; non-null in 1/34 rows read; example: 0.0541 |
| `excluded_leader` | string | Observed type string; non-null in 3/34 rows read; example: llama3.2:3b (base model) |
| `public_leader_state` | string | Observed type string; non-null in 5/34 rows read; example: NO_SIGNED_CARD |
| `excluded_note` | string | Observed type string; non-null in 5/34 rows read; example: This axis named an external base model as the point-leader b… |
| `separation_untested_reason` | string | Observed type string; non-null in 6/34 rows read; example: The published rows give TIE (exact McNemar p=0.5811, n=33), … |
| `separation_untested_reason_code` | string | Observed type string; non-null in 7/34 rows read; example: NO_SIGNED_CARD_FOR_AXIS |
| `n_note` | string | Observed type string; non-null in 7/34 rows read; example: 200 bank records, one exact-duplicate pair → 199 unique scor… |
| `separation_n_note` | string | Observed type string; non-null in 1/34 rows read; example: The test counts 200 rows per model over 199 distinct paired … |
| `accuracy_is` | string | Observed type string; non-null in 1/34 rows read; example: point estimate from the signed qwen2.5:7b candidate card b44… |
| `quotable_models` | string | Observed type string; non-null in 1/34 rows read; example: ["qwen2.5:0.5b-instruct", "CSOAI-owned specialist 8", "qwen2… |
| `quotable_note` | string | Observed type string; non-null in 1/34 rows read; example: 7 models x >=30 usable gold-bank rows (68-71 each, of 27 dis… |
| `fleet` | string | Observed type string; non-null in 1/34 rows read; example: 7 models (4 base + 2 of our own council models + 1 base vari… |
| `per_model` | string | Observed type string; non-null in 1/34 rows read; example: {"qwen3:4b": {"n": 68, "quotable": true, "tp": 6, "fp": 0, "… |
| `dataset_note` | string | Observed type string; non-null in 3/34 rows read; example: Frozen 71-row gold bank (27 distinct inputs), published on H… |
| `null_grammar` | string | Observed type string; non-null in 1/34 rows read; example: In per_model, null and 0.0 mean different things and are nev… |
| `interval_prompt_level` | string | Observed type string; non-null in 1/34 rows read; example: {"label": "DERIVED, UNSIGNED: prompt-level (cluster-aware) r… |
| `n_unit` | string | Observed type string; non-null in 19/34 rows read; example: tool-call servers probed |
| `facts_as_of` | datetime | Observed type datetime; non-null in 20/34 rows read; example: 2026-09-22T05:43:05Z |
| `evidence_url` | string | Observed type string; non-null in 20/34 rows read; example: /interop/effect-binding-server-probe-2026-09-22.signed.json |
| `run_attestation` | string | Observed type string; non-null in 19/34 rows read; example: ED25519_SIGNED |
| `coverage` | string | Observed type string; non-null in 2/34 rows read; example: 261 of 600 servers tried, from a population of 20,992 third-… |
| `coverage_note` | string | Observed type string; non-null in 2/34 rows read; example: The verdict population is biased toward servers that answer … |
| `carrier` | string | Observed type string; non-null in 1/34 rows read; example: attestation carrier is DEVNET; the facts are read from MAINN… |
| `facts_status` | string | Observed type string; non-null in 8/34 rows read; example: MEASURED |
| `applies_to` | string | Observed type string; non-null in 11/34 rows read; example: ai-labs |
| `method` | string | Observed type string; non-null in 11/34 rows read; example: scripts/subject-axis/subject-axis-live-run.mjs |
| `method_sha` | string | Observed type string; non-null in 11/34 rows read; example: 1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5… |
| `rate` | numeric | Observed type numeric; non-null in 10/34 rows read; example: 0.7027 |
| `rate_scale` | string | Observed type string; non-null in 10/34 rows read; example: fraction |
| `rate_rule` | string | Observed type string; non-null in 10/34 rows read; example: presence of at least 3 of 5 declared classes |
| `bank` | string | Observed type string; non-null in 11/34 rows read; example: interop/axis-banks/lab-practice-20261102.json |
| `bank_sha256` | string | Observed type string; non-null in 11/34 rows read; example: b96d0879876f0e405a27a350dde8e0f5d2737e9b69876c4b3287951a69c3… |
| `frame_sha256` | string | Observed type string; non-null in 10/34 rows read; example: 7f3c3c9843b8f6451e925e326dfef24ffd3c328e5e1d19cdb25efa7d0f0c… |
| `per_outcome` | string | Observed type string; non-null in 1/34 rows read; example: {"UNCHANGED": 12, "CHANGED": 110, "WITHDRAWN": 52, "UNREACHA… |

## `manifest.jsonl`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-board/manifest.jsonl.

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 182/182 rows read; example: .gitattributes |
| `bytes` | integer | Observed type integer; non-null in 182/182 rows read; example: 2504 |
| `sha256` | string | Observed type string; non-null in 182/182 rows read; example: 9e75dd981de037ec3769f24f790e126bc5a160b6871f510214e68dc70649… |
| `blob_id` | string | Observed type string; non-null in 170/182 rows read; example: bed0738c7eeb449bca98b5d2f33c89a1ee56349a |
| `url` | url | Observed type url; non-null in 182/182 rows read; example: https://huggingface.co/datasets/csoai/gspc-board/resolve/ff4… |
| `source_commit` | string | Observed type string; non-null in 182/182 rows read; example: ff45ff16ce6c686738a47f080d216d2ae62574ff |
| `as_of` | datetime | Observed type datetime; non-null in 182/182 rows read; example: 2026-09-25T05:45:36Z |
| `as_of_basis` | string | Observed type string; non-null in 22/182 rows read; example: Inventory observation of this pinned file; not a measurement… |

## `releases/2026-09-18/legacy-card-replay/PROVENANCE.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/REPLAY-RESULT.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/00a5218048b4ff922c9793e5d155c7c62b4be5a84de3f09e16af3df59445b3c9.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/015263052086c35d1a74fdd04eea5e517a4fba78a226b1508abe41736c2079b0.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/017eac8596472a43ef61328bdbf7a32a8860e41947c4f2663efbd98b7ba21b1e.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/01c2f3c124a84e8f62a6f1bf1c6a35103c23e58c67ec7757fd3e3e543d058038.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/01c4c15d529ceb2f6b4529e9f5c44438a1aa2ac61f066b3a35b840bf98380813.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/049aa144e67d457561c4e1321c1ff49e95f72a08f7420c930dfdc59c690d2a7e.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/04b974b24e8ec6c43d4efa35f76ac87903bdfe35768a6d51c256f1770861e468.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/0629dabf9966d7bc0173611aa4444468fd90b4566aa7f2ebc7f543cdb20ad37d.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/06a5f3a80a9d95fa88e303480bdcc09d69dd3c4014c4e204744a5695db537f62.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/071ae943f63f1cc4ff949a0be28da136987f09c2c172367514b38db0d00713d4.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/0761402b746bd26c2652a9a45d6301bde91ddc1307a4517c29634800e6d80850.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/079cb17611c010b49933fb09bba60217bbf63292c33908e9125863a0923e49cc.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/0b316629e65c0a4bfa9b4c04d1bcfc5f113970d46c6c0afb3a8986b9b38d4666.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/0bc6d06da274db2ee5095500638902b3cbea13457e1195afa4be0ed600ee5906.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/0ce4561fdf9fdffabc2f5d4969ded7edaddef8ed2a031940c9ab8b8d7de0b311.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/0cf0371f83d27eac9ee0ac6fca38b1c37f7cbab53ff02636edea4a37a369d475.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/0d994dbf3abb467000bba84339b3a07b96fb026457f70d2e60420af3eb6e46c2.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/0db9c146ab2c5488a83946529e6c527d4ad9e98418c29f341e3be3ee6100b996.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/0dc8b7ef05fd1c2b4584079ce99a12d24b157d2f2683cffce763377dd88c7213.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/0f3255b855d40813456bf6a73a430a2fd9132dfb0192c3dc6310d81943e23e39.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/0fe8b5bd1fcb91af048ed1666867408b2a2455198b3ba78f3433a9896f7daa26.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/1390baba7c0507ddd6ec85088b3a9763c1b7d929aa01ca298414478ff90b356d.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/1396875231dcf6ae2d6387485a41f8c216ebc05a6e9b62c57c93797789d5fd87.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/14704f0d9f1ee8f7dd472421732ef36c4f84d7ad8e5bfe3f917cccfbcf45235e.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/149ae1cc5beced568497a1738f61a521b95ee4ff4ccc6df9c65477ae62b56cf5.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/15946fce1c8726459d9598523d32403d0b70e75fd9afe6068cd0701b00413320.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/1655f3b2de29530964ed3cbdbab6dabf2dbd8eae86be7e7ca5d2a67bb4ddf585.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/1741a3cc33e488ed05534158e8fceb93e28374b8ef142ff125e93a64565c13df.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/177955c6947764db3682dc7ca9deac06c89abca3477e5e272bf615f9c31c994e.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/17f99dc0542bae532c084ff939505b11122b243e8d4a80afecce6c616d0f6a2a.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/185812db8d32ace100a2634a1102b1545099037a6879de6b76c9561766f1b3c6.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/1a2e39a3cd8a84a2e78256eab5bbf446d34ae3c66ffdc180d4636cc940418d7b.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/1b3aa73e39e55de836f4cccfc4085c8928f6f151ee60602640debabb7b2ce4b9.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/1c2e6364bb721cb14cfcf9cea9dc3e7bea7af968cc8c5c0f17f1d24ec01623e6.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/1e2e7c3f9c3758d99068bd99a5026964e7f01bb6dd94ed8e79d40d616b40475d.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/1e337166933c9e076c6ad0f5418e5838f9290132106ab27453d2c0daf30c01dc.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/1e74505674ce91c5642e24a8efaac0c75e41ddde573a242182e8daf325da6a15.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/1e772582aba999cada11df195acde19fc604113b2a0fe85b4b9f7d66a4ef95e3.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/1f613ac5091170cbec545488f53dcd61134b06c566018de52e47d157480abbe5.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/1fbfe12ad5a7f68145cdcc8a435112f6191ddda94a181a60914498c3ac7d912f.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/2073ab3d7d8d1cd330e4eb25789886da3dc932f16f96b47c69cf807e7f202c21.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/2088a8238eee5fdd56c4fdf2b786708dc9d67058183beeee6d9f392bf087d282.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/20e237dc6a278a4c95827e598e50f4d391e3be63de89cea35d39a1c5ee61c289.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/20fe2b73ac55aaf49e6bdb7bf59378375802ecd0436d881c18142ab5f698f658.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/21ab0898a601ef785650b6a799a335544e7a11595951481839f49d354975430c.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/223878d7e559ed735acc8797166c850e8179d3471067c24533494b3905bc9ded.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/229ee794eb46e74edde2667e5a0b274f053fc08ba14f708dac1042e2c6cf87c0.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/239443d8633a7a3d0f602abdddbdc5266770f2a4456875917b65628d998b62ea.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/242dd99f7e9f4c2af2269747ced68360498aedfadf981341b7e839cf53c63df6.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/24c34bec128e434bdd45ad5dea033da5d656cbf956c6a6b54caf3e8b774794b8.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/279d602347f2eeef6cfafc36488a329ea991ec2973c312d82dcb037d182e480c.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/27b12158388dc993d2878487a64569903a673482f49969a3ef808678e2a76ecb.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/2820aa929f4640c1ab47f85c4eb03451cbda1906d34f90f70c5f35c5edc76467.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/29a5b81b898ea75a7740b3f6da822967f0e06671da03bb5a53b83e27883ba76d.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/29e71f0a6061e1272fe4540459162e29432991cac26d659d733cdcc674c2c0c8.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/29e7d0813735fb3ecb85ff35f9e96308158c6005f9a84c5b10293ee20d03e33d.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/2aba0727a9b6c79a4c0bbd19c8edd2a01230e8d7083f6bd389cebe84c6fd2a17.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/2ac59e2bd0f87389700cbbb30527bf8382af8656581f4cf06203d5d140d18218.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/2af237728c0e16630d018101cd25c470c6886e8d2669e0c5e4852acaf375da62.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/2afb768b7835fd1be9e083da2621b4093a059a994c55b3cc934c9ec847f0f734.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/2b8c2d18a0862d11861054954166d1ff6f164cbd9e1b5b3bb8162a3b7baa3590.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/2c364e51cedbcecb6adff5b0faf8307886170babe7274ce500b007d6a92d382f.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/2ce5114442aa85d7d321a76d395ab89f8eebe0277a36af164efa5c985a92e0e8.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/2e60794c5664b950e3b7193883e6079dbed8e80c9da29ceec28cfe25633e2170.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/2edea8ad9b058dba3be314c32ae48e425ee5fb028ed01c09cc2612ae0e64c225.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/2f12b70215cba09bcf3972a18e004ec72d785ab8f7e9c5d63c27f565646fe908.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/3011c3873bb018cdc9ecbad58f136e0fd3e12898adbaa107a27e8038c16bdf6c.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/30d86609e50d82ecf7527feb27f83bbc64190bc4ea32c4dcf3d6f07a07addec4.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/312abd1af18322d209994a0cf806eab4200558ffaacc2b35370b3cc23e217b06.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/31bcd0b2f21af1fb22cd4d74aeb392870bd068b0b507eb59dd366ae4d1504c5d.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/32df7c2b25d7306e30efdfc25a6d2a1c17a951071e2567e19db475b86214b17d.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/33a397b36386e2c082a4ab1cdc5a2f2f74e059bce88ddd765b1f44cb4b25958a.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/351a77a636e76785bd3a4a895d6ffa50d50c320671116716f245dfccfb56e8ff.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/35a0db5b9f8c98869c007576e554df254bdc7579c6dd55f2da399be936b5a771.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/35a4eb2b69dfe03fad8aa082a6ab0845f506d03218ea3c1bece93337cb427bca.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/361f6db9f34c4eb35107be15bdc19e1ec8c5420db9d2d8919d90dbd47ffb7207.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/38045d9402835b423ec960fa8062ce23d6ee17455b7333da4a0fca3c60b7eabe.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/3967363771397caa47462a84e54977d933603ae36a967826b3c62ae22c363563.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/3aa5262df762ab836044fdab0eae1d947c20da9647d7047d0c13dc01171fb4cb.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/3b594bdbcd997fba1ec0ce0136514ad42880cb1233e775d2c4aad33d5d1fa937.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/3bdb7a0cb51da3338da99c0319e88a9ed3258532a7880b620da520ffe74f3bd1.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/3cc7a3caa1a9cb2f04efe93d8ab966ed8ab648309743d0466dbf60ceb709aa23.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/3d02498e860d4ecf1fdf16373f95fdd5fd05b6e7833791ebce83668bab4256b3.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/3eaa0c2779e78cd8948d7c00bd1ff2bd4cf7958a58f80ca8a3d13d4b2305e813.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/3f5a4f97b0fbec903d3f2d826e0fdb25fc57308db8533cd0c378b3d9b94e2f2e.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/3f697f6969568d92e569774b4aba78a4bb6d153443f7ff674a64b2dcde6d177a.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/3fd869fce60a5e89a4d8d27290414c662e6c32ed7beaf3a9905e00b5f6c6cbf9.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/4297a8b47e3c4a9b4644a2d90dadc7bc36ed92d3380e9c0c68eb95bd7af4890c.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/42a7240ad8a1d0ae6658a9cde947e273a79f0c2462900269a5de8235522606c8.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/435d9c5df4697efb4b39305473cb1289f517f5d2be8cc35953897c4ab1a7fa68.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/45724650575f8f40363728b42c54c5683fffab59a10d65e2991b666ba4d4a813.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/459f98159b09d3cd79c33a58157b02c467e990b4be514ba8bef3dd32598f3cb4.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/45a32fb5d5845a41e8641e0d64d3fe091232f7a496a66613b8d69c1585a349fd.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/46305c10be50fad864218157b248d7976cfaaca788d8f5a0b01d57b74dacec62.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/467551cdf679d0652d3fec078cd764174af8e8ce70c44d9051e201304b6909f7.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/47917b11b2b6cb0e1d36701715c8b665c5e58a0d558fe0286d9e298ae35815fe.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/48cc8dfab382d38d23e1167bff2576c64cad76e324ada51734ab0e6edd56bb39.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/49196caeba7592579c2ace80a854f14ff8c10d762813fa8834f6e7a4bed84e5d.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/4a3326585bd9c70dabf5b2e43b0b784e12d85fb90fef9dfc8c1d84fe6695bc83.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/4a5e6043f41a0bde44c1a745cfe8661b12788c658a3545df524052359fa66487.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/4a6a0f9850d5555e14865eb8270165f7cfb17a714bc0654d4916cd49fdf956a1.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/4a7e0b4a83f6dd2a7b3946bacc34be2d4a1639fa17d0fe452b2edf44d7eb4cef.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/4a9d74d40d87f26d8e957e4f0d1f693bba4622ff34e4840e87bb67c4c48c7b74.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/4b53148f3a743ae1e81d910d057acc8492321f6c632771215ac36523578df516.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/4b633b7ff828dd918bedfe42ab5a6beec69f3744cb56d795c173b962913dcefd.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/4bb360d00fa503592fd003729d74fcb825cb413b3ff70b4db9677fd3c6f088da.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/4c452e7b745cbb6df4c4211dedf9dc2d3f7221004a4f6785c4cd223d9adb1107.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/4c8129059f5f3131e7d2d74b47ba391e8db6f9344e773b1f306e2c7d6cc1ba6c.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/4cf1745607b0759f5c419c3b04e83104b0dbdf23824b45c8359d67f9e7a58747.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/4cfbc0f290f3029064664811260b07ffabee67087cf7e50e6e75c59f88599776.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/4d83bb7dfedb6dfee7e4aa4ad4845673d9508cc8fa8fd56875f7ea04c08aac42.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/4d960dc2bacf3a4d6abe2cceb097e45d6ba75bc486114961b54c43679bf0c7c7.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/4eb8ffdb407800ec5ff64bfdd8c5e3359ae06c2381190edb52bd543ab8c540c9.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/4f64a740658884284a237caa7a45e6648d931e2a16a9a568f7af7b3207135358.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/4f9f171cd14b6733f74d97159b386b2527bb2d03b7ec412ec2808986a5bbbb3b.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/504ccbb22948bb498b971e9c7a1ae6649f72919ad5d85455856a288e53e8e8e0.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/514d4057ecb48743f8dfb59b53cfdfbede721531eb58206adb33f7ffc3fd9425.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/519cc296e47057d8dd14bb2aa2b56024f2f1d69c9669f50e8922c8fa1e186c31.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/522a12e784470ccc91b778317a796781660688e5e325c82187894c03dd4ea9af.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/52f557e05ed8b8f1491841b3693af7d7ed4433950daf30708cecd1fe7862e37e.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/5327f30b4857d8fd31e55bdd8b764406922624fa23e38eaf25b3cd5e32d78def.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/53bf3e8b0e9806f7057d2e7e05c63dde7428ffc965f1043f93631aaa60153ccf.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/5449f85b5d39af3e7cdd0b4437e0522344559df1f577023ca81d8e96d673095d.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/56209f8a717a2fe36cfe6dee2a7ee021ae633c551231d029f22416eec9a5ba89.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/568134d2d71478fbb699760c1bc0f4cf47920caf823e320e26b7df0a16666d6f.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/5756982cf8e16adbe44a28a1f1cfb813feb35917908c5ae0de65d67499615bcc.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/58bd1deacf1422a805816242176ae63e688307ee767cc384e44a96fac114a5f1.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/58e14409596b5a745edf2c67123888208d9cb6c79d7872832eb421b0c1339145.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/5af24d8ed1e9c3abe3d6e3c49bf1b22972fb62cb8fb8abc4782e930a5bf16f63.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/5bbcd8686af4ea670fc8b28f4955864d4adea615b107bbad12484100b58b367f.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/5c1362e6aa63d345162a64c8c2b146176dd28d37a8722dcce8fb8e02ee6421fe.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/5c8f891f94bb144845d8bec87dd689ef1c1c284d58602765646e0e21e5226188.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/5d1fbda3bfe8355763dead612726a0a17c2e9a68ba780b6842c4d84e52c5feb1.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/5d7baf6bb095f3014cbdbe658b97451f17f6acde23d562b3649db82e22d3b5c7.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/5dfe7d868d252689ff4d5eabb9cad17587f797ddbd8fce26a63b7f5227c29373.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/5f546a727f1600a0c006f2dece51f6e39a1886fc201b15adc1a1fee2269b83b1.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/5f9ea3e964a9cad3e85fb51c4453c4d5c89208584825b3f17e9a9fc32346830b.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/612d1f5ba92962e414c76271c0a271e9d2eb5d69204360ae62cee7f4792d1404.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/6171fc15c50ad03aef84309ffe505ba38d43f7f56232af48796d184bbfc5566c.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/62123d93724144cdfec5497af3984fa22d8ce749a4f2d0710b774c6614d8ed72.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/62183c2ff91701a63d8377034c8e136028fd443bc51740769dbabcab05c16eda.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/6432fbbebaddc0e4931e9b10b551a8b4e90d823a05714438b55635a6b2af0723.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/648618b3c4e6c7847eb0d6d7052e94a0c49de6b985830677b8337e1b5a2f470f.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/64d5fc96a698b83d6b7c0125e0c2c7a57e087f97ed09a90e504d90b4aeaf768b.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/65266d2ea832a3d8c7a24dbed84d66e023bc1197d6cb1e0481feebe367ff8cb1.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/65b4d4c09828ca8c9ed55d6772fd0b1e42b87c678ca9caa2b53d07f202188280.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/66856aca4a1f9390f0f51d89b8b96d984ab902852ed77b0254730758260ad1da.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/688a30e266f0a1ae007e0ff1e23915e283ed6e10eed25a8f54db2b5bc25cb71e.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/68dccabc4bdf6ab4d6332804fcfc5fb0aa23a0cd803ea2306c63fab86f585bec.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/6b8b417eb80ea0c731f720360e3d12e08ca1e0a4f88bff0ce3b549da2cc30e6b.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/6e17125268db92eb706b898ad5088353e1619ba10a2c696443dbb6950cb40364.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/70676b498f9419d9e0b393f4a064860115962be05fbb88d6b02cb3136a854061.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/719e122506ffbc49184a2b5f1c67f75985749e90ead9cb96e9f991b8bf1e7410.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/71e1509b8195711d24cb7b2cdd69ae42ed8f80cc91ea262292e32589b6c9947d.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/72bb793031ae4ab19f9e24f056441ca412dc3834fe5d0a61e6749c85b45eee6c.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/72f7b2c8a4e23d7687a2592888655cfbea20d9c08a429d91d61050cce4541b49.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/7365312ab58b6d2b0427c3cb823527ae0eaf72a4afcc1c81018466261e722cf0.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/738f0ba070d985f3015df9b60631e15901934d985d8321d8e7e840ffb634a676.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/75c0f83d849121a8bf43306d10591cbba15465816e7364438af25a5d0401ac3d.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/7637dab24d3ec4274249008e57ac632c93e2d3b10f8a8428138a12023cbcb41a.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/7659f039f37e5b204913bbb9f089ef8a19152d2d1ae42fefbff7a42a1f1e8b33.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/76a1d3e23494015d61f15e629696b2b75e4887778d289af8677687023a45d9bf.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/7703e66781360bea814f3589f566e85fc45298a45d25b0376f3ccab827627e4a.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/77d52bb2fad1da8aaf27ac3e1edc4826875d83ca950bfd928af4aa5732074fdd.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/78ca73da4697e4733a3e1f67b10e34d78c3ee762dd2b9f9528325dfdac840b3c.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/79159bae8feedf33b837612e985d9f252af348fd7d857f210ce7388e0a1d3b88.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/7afd981583afc41922731424ea2d9c33a9ae5ba9d542aab6af2efd86c4d6b09a.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/7d46de050d42ffaf2cc639001f42d27a14dedb7bb8af29ca7b304166d32f789e.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/7e486879495b1cce3af1a83a586779b0247ccb7a83623ff3f3aa04765bebf2e4.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/8311df2f6ac3f72e992d4a03ac0672208511e232959843c126a303b120589204.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/83600fb2b4fb8d759c6b05dc2c442a37f093d00c5762a857459990ec4a0d3568.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/8412ad023f82a9bb9fb429cddfe68513a124f7d0632887594819fc987e195e35.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/844b13f5441cff9d54e5f4bcaa5da247ea174fc110fa4bca572def420d6a504d.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/8498769cfac3484aba7ce0292082b6317c2e7aa0740dc3ea86d6aff868fef68c.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/851e263754518e692655902debb727d26c7a4e14b5fe6c6382a480b96f6b1a35.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/8591fdc18b6b7cbd0513c3306d59bc6624f4e93bcafe2ce4326691a2a79ad891.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/86132b9cf97fb20a8952dc7afead69d993e9282ebf03698f441f1a98d902253e.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/868be20dfa33f6771277f14954dc5e52bf84dd5641ee921b836d505df2a90123.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/86c4f6116a7a71d6a1b5b594f7a991fba18ae66d4be95934595eada358789150.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/884091003fe168764cb955a394fa48343c0ed934df8d68d485f6156a32993945.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/887362d940e9673a478447a0f7a05f492108ac7899b3577dcc99e39dae5c4adb.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/88e6cf395264bed388e1249f64a08dab73795410347601fc9f9353c6aada34fc.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/8971bcd9b00b206d6d369848dcf610c9e17948b1b33756a223f6fe1135392cc0.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/8a23cd9d29771a9067226006a1c4b3d88660775d0d44d048bd24cd150cdc8139.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/8a4e8ee9f032aecbc8cfe5c42be9350d7b368872e0015b0ebaf116c34da20818.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/8af24e9e1c07918c46b6911c19320b87058be9453a4bcf598599c80a85668211.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/8b3d291763561e3f66adf6a9941f2ade8adf7b2fd856f237241354d3b4e1aed7.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/8ca6eec018a1a9aae3800ae66a083fa484d55281a9cc15cdbc1530cf68cd936e.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/8d1acd27b3655f7e04f5836053657ff2979522dfd7e73a8cc436995f36bc0146.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/8d3f2298bc26b1dce0e175446fde2f910e7123bcd9f63099b589bd8515e7de7d.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/8f55e463d73917d2a1c10dea041db0a57fbfb2dba622b8e9a9705429fde4b886.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/8fbf552908b905f6ec6fcc1c04e1b30cbcdd8ae5d9434acdd7cfff00b5337509.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/8fc4e0934c91222ad247179af099d09c455afaf742a1ecd534cd7156781e871c.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/903907ad452f601394cfd5105e13e5a61dbf702fe93339293ce6f39af91f0e21.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/907088a3e6bd3445cbea66e53d75aba05e1bc940dba71935e0909a963597a552.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/90a65078b0df005bdb7f26592d163618bbb1a1b5a048594d975144b3d382a7ac.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/90cab46c01db0da9ce80dff89d86c549242ac768114655595868c58d36a1598a.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/912f9be0b90406125115f1c1f3406a6a17568f2db54bd2954d9583094a82dd05.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/91f79a794f610ab7bb41a8242e8a6b6f9059397c2eecae995e7802565d0c0e78.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/922159fdf82bad971a04ae1477a85888740facb7119a1e5dbc64cdc9cd5057c4.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/9244084999a43e5718ec6c2dc327f0b943f71216b92051bb4a3c2dad803c1827.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/934d21b94bb149b2900464f2ec2a95b9312d54f9638852e2fb840bca672df4e0.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/9420d602aa3df4d195ecf08e3bbeee330b31a62e2de832e1eb23c64dc794163a.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/9429a158e1c8fb5ae887611d075a4129306ae7dd9cbac4e148e51903031f94c1.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/94b8831311c24df5e7d93e1f1dc989d24639bbe64abc4034a51d78a0306508e1.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/950c9f430bb53f713039bfa1450f23048aa2001345da81f0f0b541407a0c3a75.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/965a314c37adfaa813e8bedf16e23d365505a3c93223db1140c2d9d4a63c8ca3.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/97407fb8c436b8385fd28c8f7bc263608807b55d59ae39631ca9d3c127d4c42e.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/977f1f3d044f989fe7af17f4b912f7d75c31704cafb59f77f81555a848f8b1a4.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/97df7c8d3f062f5c32198482340a1a7f2cde9306b8560274d5fda108dee9fc6b.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/98195a492ed700a49b3f0bb0b486632d18320de40cedd4a48392db6486b5ed4e.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/98899112b5fd37120883f4e93cfc51a555718d9a62b01126f19cfb2b260e89d5.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/98bb03c554ba14dd9234c3d4ec6d5c20748983668e6672f733bb5749b4fe94ee.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/9a45f78d418ac2f35cbbe5d5b9724cbecdf8b1de12b5660fe1dab1ff98f1aa8c.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/9b5ffb530f5e1cabbcde1041fc69e3d2e699fcb79ef848957d1a3f1d12e19636.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/9c343315b278a562686e71c75758fde5c757293b7dcaf2e6bb197e9b14b8465a.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/9ca8f2174f8eb1c44cf2f6289f0111df45f48d9b5238a4bddeae3342c23ac630.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/9cdb866792a7e64d734ca85f55366620ff09c4a6cf89a22794ed0fa2a9a97b93.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/9ced28fec63b6e799bc45bb3e2e672ec5b8ba2bdb0b35920aae601651565ba0c.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/9d1c0952620a0d1d721a665308af4573391d4346ba2911fb88e7fb14751e9908.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/9d45f49ae8ead2995291b453dcd64a4fa3d2bf0f2cef7b108058888a137834f9.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/9e4db8a75256c56f2383ea601c163f3762899ace17cf53cdd9c1668070ee293d.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/9e51e3abdb4a69519a0103f3a5b30eedb89a4ce36fc714b813d5ad4f0ab1f68d.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/9f549125f8f207777112661a46e20a5ef5decdf69b19583d11a2212542adbe88.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/a072263fe05036fb40a8efd52e87b2ea48773a545e69407a7ad616ddb4b4a50a.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/a0dc1db7ba9c75e52253f4c9c62f7adf1fa71d6fcc5aa511ae17a6eff799faf8.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/a14dfc583db23cc6ef6ab50b269c5dcd4f7aaf7fd25441c8b64ca7f59bb12068.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/a270b32c79c67ebe778ca2eb83726bdd51d8e3aa0bf5ac42b56cc3b3bd36f794.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/a2b217ca5141dd531038a8652562204065537bd34c4f6dcc4689cfd847bae5e7.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/a2ea5eb36b83dad2185f9c3731c05cd537a865991678d35ebbdc9f713abe283e.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/a2fa10dd947029178a9ad18a035b3510f800d61d35845d77b5016f3d5890bb55.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/a31be261cd078a7b5eb42dae5e3b6794c996efc83be20dbe5df7448c4a5c7bbe.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/a38316158f8c59380275313e1769feb749199756e1a67013bfb647f68328d4c2.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/a3a488954cafd57d200a65017e3c840b9583d917f48866667c4d3dd786556011.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/a3c7a995d28f573daf45505f0bb5b8dda2352aaa2e8819107ffcc18fb68bb4b0.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/a5d3febc7470d379b29fa40272d880fd8291dd9f81991d39d4ec72eab086850b.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/a5e2dc5e86437a4e684b2ae47c88be847f5febee108930e888fbd7ec27d4c4ec.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/a88f74b6aff12441b7991884ba95a5509b0dfa32b1d41815d0299f3af7566024.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/a8d59ff636083d515aad8a405eeff4be22a5908b52eb8b4ae413c31a41d5098b.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/a984cfb7eb14b6d8851bd9e69be6b86fccbcf9900877e1304dedff8f5a54579c.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/aa8abca221fa7fd8886d5f3800b5ffa70645af58c5cd30e147405ba7defd1f63.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/aaab2caa1a77fd8a3e6ae43625e7b922522b087c68ed54d643122c17d2bfd741.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/aae2fa76ee7b7a20421e33f394edc223d7ffe12f308539a4843f2f35fb1d9fe6.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/ab20a48716e67ebaf7351d35fa9f248e84596cd0612f82b08c9b06f0e0cec455.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/abb7150f242321eb9a31b87ecf34d76af4e7227ac620d3673527325709ae1351.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/abdf7c8ebf272688fa5f54f28d4ac1dab566539aedd9ae75b4d13d026d756ef2.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/ac05a5e119ca3c683acefbee3d290d8c0fce75c5af0be02048123838ad221504.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/ac7a3847c4cb0931780a65bd996ec47557dd78ef859f8c0b6c85bee6e73d6912.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/acec0ee7b86c1385e0455660ea1f2f23bfccc904a1b68308263a5e2eb982fa57.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/acf6bf0356123632758bf6c98c83d81c7a8392c3b111b311317c516cc65133a4.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/aeb69795e94d9414268bdf2be8a87b4f85f15c2ca1a9049949927bff20245fde.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/af649576659be1b196d0b7f274a3b42dc5e9a295707b4edef447e49983ec147b.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/af97e2a2ba3b4b09ff87498ce2bbdcd1a4917c15d65da56a0aa44e312f7ed00c.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/authority-did.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/b196283cc7b4c71dfaa5baf39c74fa71ebdebb6a4a5cd3296fc3536a5659c7bd.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/b2fc10cb6134c37a618ab5d08d026db3a00444779d6f4969e766bdf2384541a7.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/b42c8f0331cbc213726791dad2bc193bcc9d7b31eac3baf48b4a19cfc37f28b5.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/b44335819f7720966b41e2ee26f5798892b0eb8d2571c71e0c9090506f1ff823.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/b4acb9eb0755611947402872c36b533f85555fdfad1101f97a76e0d4b1ed6678.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/b56ec64b9d0a824905a56cf7ef99b95c1ae4976d398859e0e8a271e37a6dca1d.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/b660602ba67010b2697e919e704e7e85c31859e92f2c8a9573279915b8a4fab7.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/b754300b65bdf3b17a208bf05a0c3c66a3692f5e9a23f3f80febfcb2535a7ebc.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/b77fde240e060ab02670c6b3bac7729da56c8f74d990a3ea4db04630b553d7b2.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/b7feb68e1bab3763c01714c34406da8941199f4f669ec9b7f4e7f216f4a5e191.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/b80ee9672819e228c53ef16d63744c81e1f72cb44fe25cb4eb0a5568deb9bea8.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/b97d11d5fba6e633a40ff9ee0c4603784ee4c0ac633f1c0bf1dd737b0da494e0.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/bc87590c5c45e25b416a3f64e5b499dcfec273bca076d35d2f04a0d9e558fbad.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/bdda87864d193bf0d8e5eee0b7e874b3354daa71decf1e0defbab85d121f3011.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/be3a35cf9c55c032cbbdb29413295c08fb19b28d92ec44b6742f937c470e1878.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/be8cbf4482a12408ca4000acede3ff7fadd6345b4a27a77e90e1465e76377d98.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/c0155cbd1fd1786c3e95d87b7d6575cc9502bb287eac002b169fc8cd95b30529.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/c0ea986c6354fbb3f5f223abd7e9eea91ad173030dc00d7a43ee4490c4ce1749.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/c14e8a400dc80506f984e3057ff6908bfa1b85ede7ab41762d3377be5c727180.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/c1e04a76b3054661054a7a317c0ff5a3d1eabd9883a54856f299983d188e14b0.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/c3be7b095029076863133572c8eb71077ff3e157f74a47da6149b6f28e7c4196.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/c3e19a7ded75fd928128d44231d7d237c0f20b3df4c9b92b1bb61ba4f15c9c85.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/c42bda59a7df7627956f385401f5f94c8e71046c6eee11a1d9573d478f7d0a37.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/c52a8e0043256f9f0eae93e3d709309251a5469f95765b7c2fa527bc0cb60dce.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/c5b4d27f302b1d655f906b3360b32f301f99e10b4430d35f1efb5ceada342ea6.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/c5ed9722949d019b77d8752f2be255acd53165ccabbc6bbf56243cd3ecd7bbca.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/c683e3e8ceb3723969a4b2e91b6c69ab7a74a8621b79c54d16a5da19c34fd70d.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/c8aaa340050f72385dcd98ae060108a43b17f799a2ade794c4a9fee0277cbfda.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/c9a2a68c809477f2e47e573d97de42713bf8d79176d045000fde92e25236257d.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/cbe0139cecae3712cbc7bc68653856c1f28663ad9b319fe04f0da0134f890864.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/cc4aa43e1515e9a6906a6a0457700c104ece367909bf2823aefc2763b7bde99c.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/ce0f47973e207eb1c15d162bca83df764f7a5beb8355c1754aa7124451d8bfe9.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/ce4924c60ee1751147c4c05448396cbe784ddd448f15f26ff540360583752e58.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/cf6372c07c984a2fbd0614c13a1fa0c35e0d457fa192c75313b126e990460f46.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/cf9c7ebd0c3b0a9c8cb6e9f134d40c8951ad27449ab9fa466799a24daa5f6784.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/cfba2ad1aaf8c3586d692a3b1f138f5e86f2adb0ac84f49353482c6fe8640b73.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/cfe8f5313863ed1be3f38b3784b81b8cc53ac1ab214b42b626b42d27720b84cc.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/cff1aaf070acb97c224177809856bc20310f4958eb44bdffab7d4b04836535f4.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/d17478c0f0b45ab364fa8fa47e4ca601ee34b787b899875f6e4738c65c0f5566.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/d2785c1a875bc71db65e1f9caf8591e2f76d84ee6afc992ef9a832d2566dba5c.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/d353007a873ad527cb39e99ef2ac8a77e0fe917f1affe124b0aa379c51c427e0.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/d5bf9ca1663e8c0f14ede9542ae99547bcd181872f467de11f59401f4c94ba3a.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/d763b9bc29f699445f827e7c074265fc16862b5b26c6f0ce740cca7153f76426.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/d790f6af4d2e36fb65cc24d2a97128c14c320786ec5851932f936eca74283b34.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/d8309ff1a04267716ded34f99d262b2ebe4ceac09ab799c443654b1fb1b69325.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/d8e57e6e2d951ac74d7179c4d769b9d73f66aa4830925e8a8d8b9fc61aeeabc4.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/d9884cec397c923bb8c5f538a59f8ab1bd1aca917c370619d73c80a4b689fdbc.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/da966a91cb7e1e17eb0ce004801eab7f70d68f9b789c45b2acc528c9ee5654e6.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/dc5a58838f690074daa309aa841b9f6a9c77ee1ea61138be434d9b987c478fdb.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/dc75d03721a61470614d45b61f14ad60a1ecd6f61e12dc0aaab23578d22a89d8.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/dd09f682075fba0936c904bbbda9a448e575275934d4ec2e3dc54476f76cbcb5.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/ddd530215d04f5391ccf170da8178c105dd2244fca5cd5446553a6be1e50cf6e.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/df55ff377d74691b6d37a3d6283d26af2696dc50f108e4de575d80962a390693.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/e254a8f6918dca1b4f64a16d26d5d2052b9862b6ed2450c13f35b0e3a9daf756.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/e547de8885ad0f4da53dac6257e3c7c9e89ee18013b1f04ed9582861abee5dc3.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/e5b5ec5f0d5b7f4d772276d11197f9cd22b339f287bc0bc61ea784749bd8100f.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/e88529007f329f333ba07b945d2aaf4be213867ae2f642ea52fd0d095186b8f2.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/e9dfb663c9156e6540da491d87e21a061c25271ee9ff9f8a563126af784fe34d.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/ea109e668ae5acbda9297f7fa335874bb5101ffd6a7bed51c9f24f9e116a7eb9.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/eb9c45816edd670bc3aafeff001f983b1d503ccd0cec432ba19b3bbe936ace36.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/ecab28b1d2d1d3d82192270906b9d8f45afc753612cddcf7757ed7b25414234b.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/eeb12ba044e7d474b92ed5c379cafba5005a7e8f720ed8cd52e5a92ed1435536.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/eecd8624fe5a42fa398b1b2277a1e68641c020062bdea0c826dceb3b318f1f29.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/f30bbdc98ca55e4691f8f42613f81c095561d6c6cd0e04fce7d6e7d7eed7c9a6.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/f398a1a2abf8efbd18c5a62344e39448accc785c61c9a7a8756a3d51a351d535.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/f3ea0fe7c3cbab21ff6c99bc790a4278c33db59fcbe29a25f650794ec983fe6c.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/f3eef2c73c1f7f47115e8d9655bd9156da72c3dbbc16d31bfb085ba3b82624c4.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/f48e88bb336b76588334c694b1331b2e4de122e528baf6f00b8ebf65867a7fbf.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/f53c08ff3f71257c0a7ed07cf8ae8da266bc4a75057729fb0a27907029827b23.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/f5812fb53e6fa84da94b316d86f99132ff78642515c9027f94232cabb6f65d0e.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/f60108cff1d81ff9d86653ae37d9f145fdb098847907fc5b4ad7bb6556e91286.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/f6658fefa53df420a408ca7248926364ae24f8d8c74085583e246bc567461e7d.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/f8454649ad7814a313b6001297f8103d6246bd31f1e65f74f7c39ff9b9e58eda.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/f99095aa712b7d4353c706145b87970e18f95e8631a4329e206cb09d83c9140b.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/f9c87505f0780c54360038081f4330a4fe0aec5dc6eeb5f0384eef28cf8b14d6.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/f9ce2fc1f2ae85eec6e61a8f3b703838a70f74a66e9af8995ccfdc07a5b1cc88.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/fa2b3a1763bc07a97a52f5c0ea98ebb704ff66d5163e973e32761375979f9cff.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/fc49622924ae05221d07d55ec04a2190965ef8d071a5f02b945e3f4400eb1983.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/fdb2a676a2d5027ba8d845fd3ac73dc00fe83073ec5078f5d89551d99ad062c7.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/fe8f09365fc702e65bedbb261349d6d1f838fd1252772b0a81d56f21fe98d039.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/ffcac15c00fd9735d0f933d6560484b540852a026715d9cc33229764c2a6cb23.json`

TODO(owner): fields not obtainable anonymously.


## `releases/2026-09-18/legacy-card-replay/evidence/raw/index.json`

TODO(owner): fields not obtainable anonymously.


## `snapshot/SNAPSHOT.json`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-board/snapshot/SNAPSHOT.json.

Top-level keys: `kind`, `as_of`, `read_at`, `lid`, `board_url`, `root_url`, `board_sha256`, `board_content_sha256`, `root_sha256`, `merkle_root`, `card_count`, `did_intended`, `board_signer`, `fingerprint`, `fingerprint_rule`, `counts`, `banks`, `did_keys`, `generator`, `note`.
Records under `banks`:

| field | type | description |
|---|---|---|
| `axis` | string | Stable measurement axis identifier (Observed type string; non-null in 34/34 rows read; example: governance) |
| `dataset` | string | Source dataset identifier, when available (Observed type string; non-null in 22/34 rows read; example: csoai/gspc-gov) |
| `expected_short` | string | Observed type string; non-null in 13/34 rows read; example: gov |
| `items_url` | url | Observed type url; non-null in 22/34 rows read; example: https://huggingface.co/datasets/csoai/gspc-gov/resolve/main/… |
| `bank_state` | string | Observed type string; non-null in 34/34 rows read; example: ITEMS_JSONL |
| `bank_rows` | integer | Observed type integer; non-null in 13/34 rows read; example: 237 |
| `bank_canary_rows` | integer | Observed type integer; non-null in 13/34 rows read; example: 1 |
| `slug_matches_map` | boolean | Observed type boolean; non-null in 13/34 rows read; example: true |

## `snapshot/board.json`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-board/snapshot/board.json.

Top-level keys: `schema`, `issuer`, `doi`, `doi_note`, `doi_status`, `doi_status_note`, `doi_status_since`, `doi_status_url`, `doi_alternative`, `measured_on`, `note`, `state_enum`, `totals`, `peritem_rows`, `bank_host`, `banked_axes`, `banked_axes_resolvable`, `banked_axes_unresolvable`, `bank_note`, `measurement_time_contract`, `axes`, `measured_in_lane`, `domains`, `limitations`, `public_model_identifier_policy`, `site_attestation`.
Records under `axes`:

| field | type | description |
|---|---|---|
| `axis` | string | Stable measurement axis identifier (Observed type string; non-null in 34/34 rows read; example: governance) |
| `family` | string | Group of related axes (Observed type string; non-null in 34/34 rows read; example: gspc) |
| `kind` | string | Evidence type, such as model comparison, deterministic facts or declared slot (Observed type string; non-null in 34/34 rows read; example: model-comparison) |
| `bench` | string | Observed type string; non-null in 34/34 rows read; example: GovBench |
| `task` | string | Observed type string; non-null in 34/34 rows read; example: EU AI Act risk-tier classification |
| `n` | integer | Published count for that axis; inspect its method before comparing counts (Observed type integer; non-null in 34/34 rows read; example: 237) |
| `separation` | string | Statistical separation state, when applicable (Observed type string; non-null in 14/34 rows read; example: TIE) |
| `separation_basis` | string | Observed type string; non-null in 14/34 rows read; example: Exact McNemar between the top two base models on the publish… |
| `fleet_mean` | numeric | Observed type numeric; non-null in 13/34 rows read; example: 0.49 |
| `mean_harm` | numeric | Observed type numeric; non-null in 12/34 rows read; example: 0.51 |
| `cvar05_harm` | numeric | Observed type numeric; non-null in 2/34 rows read; example: 0.8728 |
| `status` | string | Published measurement state; unmeasured is an explicit gap (Observed type string; non-null in 34/34 rows read; example: MEASURED) |
| `dataset` | string | Source dataset identifier, when available (Observed type string; non-null in 22/34 rows read; example: csoai/gspc-gov) |
| `colour` | string | Observed type string; non-null in 34/34 rows read; example: #34d399 |
| `hue` | integer | Observed type integer; non-null in 34/34 rows read; example: 152 |
| `method_status` | string | Observed type string; non-null in 34/34 rows read; example: meets-rule |
| `historical_measurement_record` | string | Observed type string; non-null in 11/34 rows read; example: {"state": "SUPERSEDED_FOR_PUBLIC_RANKING", "scope": "ORIGINA… |
| `leader` | string | Publicly displayable leader field, when available; it is not proof of a separated win (Observed type string; non-null in 9/34 rows read; example: mistral:7b (base model)) |
| `accuracy` | numeric | Observed type numeric; non-null in 9/34 rows read; example: 0.5865 |
| `interval` | string | Observed type string; non-null in 8/34 rows read; example: [0.523, 0.647] |
| `separation_p` | numeric | Observed type numeric; non-null in 7/34 rows read; example: 0.3787 |
| `separation_method` | string | Observed type string; non-null in 8/34 rows read; example: Exact McNemar on the discordant items, leader vs the best ba… |
| `separation_sentence` | string | Observed type string; non-null in 7/34 rows read; example: No model separated from the next best on this axis (exact Mc… |
| `separation_evidence` | string | Observed type string; non-null in 8/34 rows read; example: {"source": "https://huggingface.co/datasets/csoai/gspc-perit… |
| `peritem_file_sha256` | string | Observed type string; non-null in 13/34 rows read; example: 3a1d3193d3651448dd311efe4c7efcbdffb19e07fba06c15e628b844bfbf… |
| `leader_source` | string | Observed type string; non-null in 7/34 rows read; example: per-item rows |
| `leader_card_state` | string | Observed type string; non-null in 7/34 rows read; example: CARD_RECORDS_A_DIFFERENT_MEASUREMENT |
| `leader_card_note` | string | Observed type string; non-null in 7/34 rows read; example: leader shown from per-item rows; no signed per-model card ye… |
| `leader_card` | string | Observed type string; non-null in 3/34 rows read; example: cfba2ad1aaf8c3586d692a3b1f138f5e86f2adb0ac84f49353482c6fe864… |
| `leader_card_url` | string | Observed type string; non-null in 3/34 rows read; example: /signed/cards/cfba2ad1aaf8c3586d692a3b1f138f5e86f2adb0ac84f4… |
| `note` | string | Observed type string; non-null in 34/34 rows read; example: No model separated from the next best on this axis (exact Mc… |
| `distinct_items` | integer | Observed type integer; non-null in 14/34 rows read; example: 237 |
| `distinct_items_source` | string | Observed type string; non-null in 14/34 rows read; example: distinct item ids in the published per-item rows (peritem_go… |
| `mde` | string | Observed type string; non-null in 14/34 rows read; example: {"value": 0.138, "state": "MEASURED", "unit": "accuracy diff… |
| `measurement_time` | string | Observed type string; non-null in 34/34 rows read; example: {"state": "DAY", "precision": "day", "observed_on": "2026-08… |
| `dataset_url` | url | Observed type url; non-null in 22/34 rows read; example: https://huggingface.co/datasets/csoai/gspc-gov |
| `macro_f1` | numeric | Observed type numeric; non-null in 1/34 rows read; example: 0.944 |
| `unparsed_rate` | numeric | Observed type numeric; non-null in 1/34 rows read; example: 0.0541 |
| `excluded_leader` | string | Observed type string; non-null in 3/34 rows read; example: llama3.2:3b (base model) |
| `public_leader_state` | string | Observed type string; non-null in 5/34 rows read; example: NO_SIGNED_CARD |
| `excluded_note` | string | Observed type string; non-null in 5/34 rows read; example: This axis named an external base model as the point-leader b… |
| `separation_untested_reason` | string | Observed type string; non-null in 6/34 rows read; example: The published rows give TIE (exact McNemar p=0.5811, n=33), … |
| `separation_untested_reason_code` | string | Observed type string; non-null in 7/34 rows read; example: NO_SIGNED_CARD_FOR_AXIS |
| `n_note` | string | Observed type string; non-null in 7/34 rows read; example: 200 bank records, one exact-duplicate pair → 199 unique scor… |
| `separation_n_note` | string | Observed type string; non-null in 1/34 rows read; example: The test counts 200 rows per model over 199 distinct paired … |
| `accuracy_is` | string | Observed type string; non-null in 1/34 rows read; example: point estimate from the signed qwen2.5:7b candidate card b44… |
| `quotable_models` | string | Observed type string; non-null in 1/34 rows read; example: ["qwen2.5:0.5b-instruct", "CSOAI-owned specialist 8", "qwen2… |
| `quotable_note` | string | Observed type string; non-null in 1/34 rows read; example: 7 models x >=30 usable gold-bank rows (68-71 each, of 27 dis… |
| `fleet` | string | Observed type string; non-null in 1/34 rows read; example: 7 models (4 base + 2 of our own council models + 1 base vari… |
| `per_model` | string | Observed type string; non-null in 1/34 rows read; example: {"qwen3:4b": {"n": 68, "quotable": true, "tp": 6, "fp": 0, "… |
| `dataset_note` | string | Observed type string; non-null in 3/34 rows read; example: Frozen 71-row gold bank (27 distinct inputs), published on H… |
| `null_grammar` | string | Observed type string; non-null in 1/34 rows read; example: In per_model, null and 0.0 mean different things and are nev… |
| `interval_prompt_level` | string | Observed type string; non-null in 1/34 rows read; example: {"label": "DERIVED, UNSIGNED: prompt-level (cluster-aware) r… |
| `n_unit` | string | Observed type string; non-null in 19/34 rows read; example: tool-call servers probed |
| `facts_as_of` | datetime | Observed type datetime; non-null in 20/34 rows read; example: 2026-09-22T05:43:05Z |
| `evidence_url` | string | Observed type string; non-null in 20/34 rows read; example: /interop/effect-binding-server-probe-2026-09-22.signed.json |
| `run_attestation` | string | Observed type string; non-null in 19/34 rows read; example: ED25519_SIGNED |
| `coverage` | string | Observed type string; non-null in 2/34 rows read; example: 261 of 600 servers tried, from a population of 20,992 third-… |
| `coverage_note` | string | Observed type string; non-null in 2/34 rows read; example: The verdict population is biased toward servers that answer … |
| `carrier` | string | Observed type string; non-null in 1/34 rows read; example: attestation carrier is DEVNET; the facts are read from MAINN… |
| `facts_status` | string | Observed type string; non-null in 8/34 rows read; example: MEASURED |
| `applies_to` | string | Observed type string; non-null in 11/34 rows read; example: ai-labs |
| `method` | string | Observed type string; non-null in 11/34 rows read; example: scripts/subject-axis/subject-axis-live-run.mjs |
| `method_sha` | string | Observed type string; non-null in 11/34 rows read; example: 1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5… |
| `rate` | numeric | Observed type numeric; non-null in 10/34 rows read; example: 0.7027 |
| `rate_scale` | string | Observed type string; non-null in 10/34 rows read; example: fraction |
| `rate_rule` | string | Observed type string; non-null in 10/34 rows read; example: presence of at least 3 of 5 declared classes |
| `bank` | string | Observed type string; non-null in 11/34 rows read; example: interop/axis-banks/lab-practice-20261102.json |
| `bank_sha256` | string | Observed type string; non-null in 11/34 rows read; example: b96d0879876f0e405a27a350dde8e0f5d2737e9b69876c4b3287951a69c3… |
| `frame_sha256` | string | Observed type string; non-null in 10/34 rows read; example: 7f3c3c9843b8f6451e925e326dfef24ffd3c328e5e1d19cdb25efa7d0f0c… |
| `per_outcome` | string | Observed type string; non-null in 1/34 rows read; example: {"UNCHANGED": 12, "CHANGED": 110, "WITHDRAWN": 52, "UNREACHA… |

## `snapshot/gspc-axes.csv`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-board/snapshot/gspc-axes.csv.

| field | type | description |
|---|---|---|
| `axis` | string | Stable measurement axis identifier (Observed type string; non-null in 34/34 rows read; example: governance) |
| `family` | string | Group of related axes (Observed type string; non-null in 34/34 rows read; example: gspc) |
| `kind` | string | Evidence type, such as model comparison, deterministic facts or declared slot (Observed type string; non-null in 34/34 rows read; example: model-comparison) |
| `bench` | string | Observed type string; non-null in 34/34 rows read; example: GovBench |
| `task` | string | Observed type string; non-null in 34/34 rows read; example: EU AI Act risk-tier classification |
| `n` | integer | Published count for that axis; inspect its method before comparing counts (Observed type integer; non-null in 34/34 rows read; example: 237) |
| `status` | string | Published measurement state; unmeasured is an explicit gap (Observed type string; non-null in 34/34 rows read; example: MEASURED) |
| `separation` | string | Statistical separation state, when applicable (Observed type string; non-null in 14/34 rows read; example: TIE) |
| `public_leader_state` | string | Observed type string; non-null in 5/34 rows read; example: NO_SIGNED_CARD |
| `leader` | string | Publicly displayable leader field, when available; it is not proof of a separated win (Observed type string; non-null in 9/34 rows read; example: mistral:7b (base model)) |
| `accuracy` | numeric | Observed type numeric; non-null in 9/34 rows read; example: 0.5865 |
| `fleet_mean` | numeric | Observed type numeric; non-null in 13/34 rows read; example: 0.49 |
| `dataset` | string | Source dataset identifier, when available (Observed type string; non-null in 22/34 rows read; example: csoai/gspc-gov) |
| `dataset_url` | url | Observed type url; non-null in 22/34 rows read; example: https://huggingface.co/datasets/csoai/gspc-gov |
| `bank_state` | string | Observed type string; non-null in 34/34 rows read; example: ITEMS_JSONL |
| `bank_rows` | integer | Observed type integer; non-null in 13/34 rows read; example: 237 |

## `snapshot/gspc-axes.jsonl`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-board/snapshot/gspc-axes.jsonl.

| field | type | description |
|---|---|---|
| `axis` | string | Stable measurement axis identifier (Observed type string; non-null in 34/34 rows read; example: governance) |
| `family` | string | Group of related axes (Observed type string; non-null in 34/34 rows read; example: gspc) |
| `kind` | string | Evidence type, such as model comparison, deterministic facts or declared slot (Observed type string; non-null in 34/34 rows read; example: model-comparison) |
| `bench` | string | Observed type string; non-null in 34/34 rows read; example: GovBench |
| `task` | string | Observed type string; non-null in 34/34 rows read; example: EU AI Act risk-tier classification |
| `n` | integer | Published count for that axis; inspect its method before comparing counts (Observed type integer; non-null in 34/34 rows read; example: 237) |
| `status` | string | Published measurement state; unmeasured is an explicit gap (Observed type string; non-null in 34/34 rows read; example: MEASURED) |
| `separation` | string | Statistical separation state, when applicable (Observed type string; non-null in 14/34 rows read; example: TIE) |
| `public_leader_state` | string | Observed type string; non-null in 5/34 rows read; example: NO_SIGNED_CARD |
| `leader` | string | Publicly displayable leader field, when available; it is not proof of a separated win (Observed type string; non-null in 9/34 rows read; example: mistral:7b (base model)) |
| `accuracy` | numeric | Observed type numeric; non-null in 9/34 rows read; example: 0.5865 |
| `fleet_mean` | numeric | Observed type numeric; non-null in 13/34 rows read; example: 0.49 |
| `dataset` | string | Source dataset identifier, when available (Observed type string; non-null in 22/34 rows read; example: csoai/gspc-gov) |
| `dataset_url` | url | Observed type url; non-null in 22/34 rows read; example: https://huggingface.co/datasets/csoai/gspc-gov |
| `bank_state` | string | Observed type string; non-null in 34/34 rows read; example: ITEMS_JSONL |
| `bank_rows` | integer | Observed type integer; non-null in 13/34 rows read; example: 237 |

## `snapshot/manifest.jsonl`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-board/snapshot/manifest.jsonl.

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 7/7 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 7/7 rows read; example: 13398 |
| `sha256` | string | Observed type string; non-null in 7/7 rows read; example: f36a40a40b8c5768bbd7432ed5b6578c3a4de9a239bea5563751a02ba3c8… |

## `snapshot/root.json`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-board/snapshot/root.json.

Top-level keys: `as_of`, `card_count`, `card_sha256`, `did_intended`, `kind`, `leaf_definition`, `node_definition`, `tree_caveat`, `language`, `merkle_root`, `note`, `schema`, `sources`, `xrpl_asset_count_attempted`, `xrpl_basket_merkle`, `xrpl_fi_assetCount`, `xrpl_fi_updatedAt`, `sig_ed25519`, `sig_preimage`.


## `unmeasured.parquet`

| field | type | description |
|---|---|---|
| `axis` | string | Stable measurement axis identifier (Observed type string; non-null in 0/0 rows read) |
| `bench` | string | Observed type string; non-null in 0/0 rows read |
| `status` | string | Published measurement state; unmeasured is an explicit gap (Observed type string; non-null in 0/0 rows read) |
| `n` | integer | Published count for that axis; inspect its method before comparing counts (Observed type integer; non-null in 0/0 rows read) |
| `accuracy` | numeric | Observed type numeric; non-null in 0/0 rows read |
| `interval_lo` | numeric | Observed type numeric; non-null in 0/0 rows read |
| `interval_hi` | numeric | Observed type numeric; non-null in 0/0 rows read |
| `separation` | string | Statistical separation state, when applicable (Observed type string; non-null in 0/0 rows read) |
| `fleet_mean` | numeric | Observed type numeric; non-null in 0/0 rows read |
| `dataset` | string | Source dataset identifier, when available (Observed type string; non-null in 0/0 rows read) |
| `as_of` | string | Observed type string; non-null in 0/0 rows read |
