# Field reference: nicktempleman/csoai-gspc-cards-records

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `benchmark-quality-feed.json`

Top-level keys: `schema`, `generated`, `doctrine`, `criteria`, `max_score`, `records`.
Records under `records`:

| field | type | description |
|---|---|---|
| `schema` | string | Observed type string; non-null in 6/6 rows read; example: csoai.benchmark-quality/0.1 |
| `record_type` | string | Observed type string; non-null in 6/6 rows read; example: measured-current-state |
| `not_a_certification` | boolean | Observed type boolean; non-null in 6/6 rows read; example: true |
| `endorsement` | string | Observed type string; non-null in 6/6 rows read; example: none |
| `authored_by` | string | Observed type string; non-null in 6/6 rows read; example: did:web:csoai.org |
| `benchmark` | string | Observed type string; non-null in 6/6 rows read; example: MMLU |
| `owner` | string | Observed type string; non-null in 6/6 rows read; example: UC Berkeley / 2020 |
| `url` | url | Observed type url; non-null in 6/6 rows read; example: https://paperswithcode.com/dataset/mmlu |
| `license` | string | Observed type string; non-null in 6/6 rows read; example: MIT (dataset) |
| `as_of` | datetime | Observed type datetime; non-null in 6/6 rows read; example: 2026-08-21 |
| `solicited` | boolean | Observed type boolean; non-null in 6/6 rows read; example: false |
| `party_participated` | boolean | Observed type boolean; non-null in 6/6 rows read; example: false |
| `access` | string | Observed type string; non-null in 6/6 rows read; example: public_artifacts_only |
| `score` | numeric | Observed type numeric; non-null in 6/6 rows read; example: 23.2 |
| `max_score` | numeric | Observed type numeric; non-null in 6/6 rows read; example: 42.0 |
| `score_pct` | numeric | Observed type numeric; non-null in 6/6 rows read; example: 55.3 |
| `checks` | string | Observed type string; non-null in 6/6 rows read; example: {"canary_string": {"max": 2, "got": 0.0, "desc": "Canary str… |
| `notes` | string | Observed type string; non-null in 6/6 rows read; example: Widely memorized; MMLU-Redux found 6.49% item errors; useful… |
| `content_id` | string | Observed type string; non-null in 6/6 rows read; example: db06eb90e89694c68b7c9cb1d120cea5add9ee912f7e45df2766ee92de23… |
| `prev` | string | Observed type string; non-null in 5/6 rows read; example: db06eb90e89694c68b7c9cb1d120cea5add9ee912f7e45df2766ee92de23… |
| `pubkey` | string | Observed type string; non-null in 6/6 rows read; example: 348f273d8525e9d663dd288c679e58b7e4c914a935be4bf7767d1c3985d6… |
| `signature` | string | Observed type string; non-null in 6/6 rows read; example: 1GkRMDVPQsZklU8KdMzJtNSbFM+vGCvvRu6hTDqtgbjFm2rXiANGjoec409h… |

## `corrections-feed.json`

Top-level keys: `schema`, `generated`, `doctrine`, `note`, `corrections`.
Records under `corrections`:

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 10/10 rows read; example: CORR-001 |
| `title` | string | Observed type string; non-null in 10/10 rows read; example: Axis-count drift — '16 axes' served publicly |
| `what_was_wrong` | string | Observed type string; non-null in 10/10 rows read; example: An internal signed artifact carried '16 axes'; the live API … |
| `how_caught` | string | Observed type string; non-null in 10/10 rows read; example: End-user probe of councilof.ai/api/gspc against the canon re… |
| `fix` | string | Observed type string; non-null in 10/10 rows read; example: Public copy holds 13-of-14 everywhere; the 16-axis artifact … |
| `status` | string | Observed type string; non-null in 10/10 rows read; example: resolved |
| `date` | datetime | Observed type datetime; non-null in 10/10 rows read; example: 2026-08-19 |
| `tags` | string | Observed type string; non-null in 10/10 rows read; example: ["canon", "axis-count", "api"] |
| `evidence` | string | Observed type string; non-null in 9/10 rows read; example: verified live: /api/gspc totals.axes=14, measured_axes=13, p… |

## `estate-board.json`

Top-level keys: `schema`, `board_stamp`, `measured_period`, `grading`, `n_per_cell`, `models`, `banks`, `note`, `cells`.


## `evidence-reports.json`

Top-level keys: `schema`, `generated`, `doctrine`, `note`, `reports`.
Records under `reports`:

| field | type | description |
|---|---|---|
| `agent` | string | Observed type string; non-null in 3/3 rows read; example: qwen2.5:7b |
| `role` | string | Observed type string; non-null in 3/3 rows read; example: open-weight model · governance knowledge |
| `as_of` | datetime | Observed type datetime; non-null in 3/3 rows read; example: 2026-08-19 |
| `cells` | string | Observed type string; non-null in 3/3 rows read; example: [{"axis": "care", "value": 0.535, "n": 199, "ci95": [0.47, 0… |
| `headline` | string | Observed type string; non-null in 3/3 rows read; example: 13 of 14 axes quotable · deterministic exact-label grading ·… |
| `evidence_chain` | string | Observed type string; non-null in 3/3 rows read; example: board chain 14/14 verified · cards Ed25519-signed |

## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 12/12 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 11/12 rows read; example: 1809 |
| `sha` | string | Observed type string; non-null in 11/12 rows read; example: 7c232bc5e0d25483fb607c1fa1b4ff2c457c9a1b |
| `ext` | string | Observed type string; non-null in 12/12 rows read; example: md |
| `url` | url | Observed type url; non-null in 12/12 rows read; example: https://huggingface.co/datasets/csoai/signed-measurement-rec… |
| `repo` | string | Observed type string; non-null in 12/12 rows read; example: csoai/signed-measurement-records |
| `as_of` | datetime | Observed type datetime; non-null in 12/12 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 12/12 rows read; example: https://huggingface.co/api/datasets/csoai/signed-measurement… |

## `opensource-stack.json`

Top-level keys: `schema`, `generated`, `doctrine`, `note`, `packages`.
Records under `packages`:

| field | type | description |
|---|---|---|
| `name` | string | Observed type string; non-null in 3/3 rows read; example: inspect-signed-receipt |
| `version` | string | Observed type string; non-null in 3/3 rows read; example: 0.1.0 |
| `repo` | url | Observed type url; non-null in 3/3 rows read; example: https://github.com/CSOAI-ORG/inspect-signed-receipt |
| `license` | string | Observed type string; non-null in 3/3 rows read; example: MIT |
| `what` | string | Observed type string; non-null in 3/3 rows read; example: Ed25519-signed, hash-chained measurement receipts for Inspec… |
| `why` | string | Observed type string; non-null in 3/3 rows read; example: Inspect is the standard eval framework across UK AISI, US CA… |
| `receipt_schema` | string | Observed type string; non-null in 3/3 rows read; example: csoai.measurement-receipt/0.1 |
| `verified` | string | Observed type string; non-null in 3/3 rows read; example: real Inspect eval -> canonical EvalLog (RFC 8785) -> Ed25519… |
| `honest_unsigned` | boolean | Observed type boolean; non-null in 3/3 rows read; example: true |

## `orbital-ai-record.json`

Top-level keys: `schema`, `generated`, `doctrine`, `note`, `gap`, `records`.
Records under `records`:

| field | type | description |
|---|---|---|
| `subject` | string | Observed type string; non-null in 5/5 rows read; example: Starcloud-1 |
| `class` | string | Observed type string; non-null in 5/5 rows read; example: orbital-data-centre |
| `claim` | string | Observed type string; non-null in 5/5 rows read; example: First data-centre-class NVIDIA H100 in orbit; ran Gemma + tr… |
| `deployed` | boolean | Observed type boolean; non-null in 5/5 rows read; example: true |
| `independent_verification` | string | Observed type string; non-null in 5/5 rows read; example: launch + orbit independently trackable; in-orbit training re… |
| `orbit_km` | string | Observed type string; non-null in 5/5 rows read; example: 325 |
| `power_kw` | string | Observed type string; non-null in 5/5 rows read; example: single-digit (test article) |
| `predicates` | string | Observed type string; non-null in 5/5 rows read; example: {"deployment_verifiable": true, "behaviour_self_reported": t… |
| `content_id` | string | Observed type string; non-null in 5/5 rows read; example: 8686520eb34499c9caa7e5a1d2727a366bc94577eb72a83401d53f347c1c… |
| `prev` | string | Observed type string; non-null in 4/5 rows read; example: 8686520eb34499c9caa7e5a1d2727a366bc94577eb72a83401d53f347c1c… |
| `pubkey` | string | Observed type string; non-null in 5/5 rows read; example: 348f273d8525e9d663dd288c679e58b7e4c914a935be4bf7767d1c3985d6… |
| `signature` | string | Observed type string; non-null in 5/5 rows read; example: iV1zJZWS8jymy4OGjzMINQlsv1YNINxV4kouNA6lrrOMfWkSGaGmasZDWV0U… |

## `regulation-feed.json`

Top-level keys: `schema`, `generated`, `doctrine`, `note`, `regulations`, `count`, `last_updated`.
Records under `regulations`:

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 19/19 rows read; example: REG-019 |
| `title` | string | Observed type string; non-null in 19/19 rows read; example: FDA QMSR + PCCP — medical device AI total-product-lifecycle |
| `instrument` | string | Observed type string; non-null in 19/19 rows read; example: FDA QMSR (in force 2 Feb 2026) + PCCP (final Aug 2025) |
| `celex` | string | Observed type string; non-null in 13/19 rows read; example: FDA-QMSR |
| `date` | datetime | Observed type datetime; non-null in 19/19 rows read; example: 2026-02-02 |
| `effective` | boolean | Observed type boolean; non-null in 19/19 rows read; example: true |
| `what` | string | Observed type string; non-null in 19/19 rows read; example: Quality Management System Regulation in force; Predetermined… |
| `why_it_matters` | string | Observed type string; non-null in 19/19 rows read; example: Medical is accredited and crowded — explicit do-not-build; t… |
| `status` | string | Observed type string; non-null in 19/19 rows read; example: in-force |
| `tags` | string | Observed type string; non-null in 19/19 rows read; example: ["fda", "medical", "pccp"] |
| `penalty_exposure` | string | Observed type string; non-null in 19/19 rows read; example: FDA enforcement regime |
| `underwriting_use` | string | Observed type string; non-null in 19/19 rows read; example: {"composable": true, "basis": "complement only", "re_verify"… |
| `correction_ref` | string | Observed type string; non-null in 1/19 rows read; example: CORR-010 |

## `regulatory-deadline-record.json`

Top-level keys: `schema`, `generated`, `doctrine`, `note`, `records`.
Records under `records`:

| field | type | description |
|---|---|---|
| `schema` | string | Observed type string; non-null in 19/19 rows read; example: csoai.regulatory-deadline-record/0.1 |
| `record_type` | string | Observed type string; non-null in 19/19 rows read; example: regime-process-fact |
| `not_a_certification` | boolean | Observed type boolean; non-null in 19/19 rows read; example: true |
| `endorsement` | string | Observed type string; non-null in 19/19 rows read; example: none |
| `authored_by` | string | Observed type string; non-null in 19/19 rows read; example: did:web:csoai.org |
| `regime` | string | Observed type string; non-null in 19/19 rows read; example: FDA QMSR + PCCP — medical device AI total-product-lifecycle |
| `instrument` | string | Observed type string; non-null in 19/19 rows read; example: FDA QMSR (in force 2 Feb 2026) + PCCP (final Aug 2025) |
| `celex` | string | Observed type string; non-null in 19/19 rows read; example: FDA-QMSR |
| `stated_deadline` | datetime | Observed type datetime; non-null in 19/19 rows read; example: 2026-02-02 |
| `deadline_status` | string | Observed type string; non-null in 19/19 rows read; example: held |
| `current_status` | string | Observed type string; non-null in 19/19 rows read; example: in-force |
| `legal_basis` | string | Observed type string; non-null in 19/19 rows read; example: FDA QMSR (in force 2 Feb 2026) + PCCP (final Aug 2025) |
| `source` | string | Observed type string; non-null in 19/19 rows read; example: public legal register (CELEX FDA-QMSR) |
| `as_of` | datetime | Observed type datetime; non-null in 19/19 rows read; example: 2026-08-21 |
| `solicited` | boolean | Observed type boolean; non-null in 19/19 rows read; example: false |
| `party_participated` | boolean | Observed type boolean; non-null in 19/19 rows read; example: false |
| `access` | string | Observed type string; non-null in 19/19 rows read; example: public_artifacts_only |
| `content_id` | string | Observed type string; non-null in 19/19 rows read; example: 1fde160744342a0cd05b3cb68d51c21f3cda3d605c7bded3fd16f9b0da34… |
| `prev` | string | Observed type string; non-null in 18/19 rows read; example: 1fde160744342a0cd05b3cb68d51c21f3cda3d605c7bded3fd16f9b0da34… |
| `pubkey` | string | Observed type string; non-null in 19/19 rows read; example: 348f273d8525e9d663dd288c679e58b7e4c914a935be4bf7767d1c3985d6… |
| `signature` | string | Observed type string; non-null in 19/19 rows read; example: Ftx3sueCcDdeqfcTQiZw2ZwPHSvHuwkY8vjPmY/jJ+vCpz1k8T4FktpNvV7J… |
