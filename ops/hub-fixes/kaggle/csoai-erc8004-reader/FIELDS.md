# Field reference: nicktempleman/csoai-erc8004-reader

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `census_snapshot.json`

Top-level keys: `census`, `as_of`, `source`, `status`, `measured`, `totals`, `chains_indexed`, `chains_mainnet`, `chains_testnet`, `chains`, `caveat`.
Records under `chains`:

| field | type | description |
|---|---|---|
| `chain_id` | integer | Observed type integer; non-null in 62/62 rows read; example: 1 |
| `name` | string | Observed type string; non-null in 62/62 rows read; example: Ethereum Mainnet |
| `is_testnet` | boolean | Observed type boolean; non-null in 62/62 rows read; example: false |

## `erc8004_agents.jsonl`

| field | type | description |
|---|---|---|
| `agent_id` | string | Observed type string; non-null in 45/45 rows read; example: 1:0x8004a169fb4a3325136eb29fa0ceb6d2e539a432:50283 |
| `token_id` | string | Observed type string; non-null in 45/45 rows read; example: 50283 |
| `name` | string | Observed type string; non-null in 45/45 rows read; example: Agent #50283 |
| `chain_id` | integer | Observed type integer; non-null in 45/45 rows read; example: 1 |
| `endpoint_state` | string | Observed type string; non-null in 45/45 rows read; example: LIVE |
| `registry_address` | string | Observed type string; non-null in 45/45 rows read; example: 0x8004a169fb4a3325136eb29fa0ceb6d2e539a432 |
| `http_status` | string | Observed type string; non-null in 42/45 rows read; example: 200 |
| `as_of` | datetime | Observed type datetime; non-null in 45/45 rows read; example: 2026-09-01T05:35:13Z |

## `erc8004_live_atoms.json`

| field | type | description |
|---|---|---|
| `agent_id` | string | Observed type string; non-null in 25/25 rows read; example: 1:0x8004a169fb4a3325136eb29fa0ceb6d2e539a432:50283 |
| `chain_id` | integer | Observed type integer; non-null in 25/25 rows read; example: 1 |
| `token_id` | string | Observed type string; non-null in 25/25 rows read; example: 50283 |
| `reg_name` | string | Observed type string; non-null in 25/25 rows read; example: Agent #50283 |
| `endpoint` | url | Observed type url; non-null in 25/25 rows read; example: https://execution.market/workers/0xd5791860ca10a6f39749fb499… |
| `http` | integer | Observed type integer; non-null in 25/25 rows read; example: 200 |
| `token_uri_sha256` | string | Observed type string; non-null in 25/25 rows read; example: 7828bfc2340313be083d13b60f368fac08b15b2924586a2c631d8bcd6328… |
| `x402Support` | boolean | Observed type boolean; non-null in 25/25 rows read; example: false |

## `erc8004_live_filter_census.json`

Top-level keys: `census`, `as_of`, `source_urls`, `status`, `method`, `registry_totals`, `sample`, `rows`, `note`.
Records under `rows`:

| field | type | description |
|---|---|---|
| `agent_id` | string | Observed type string; non-null in 45/45 rows read; example: 1:0x8004a169fb4a3325136eb29fa0ceb6d2e539a432:50283 |
| `chain_id` | integer | Observed type integer; non-null in 45/45 rows read; example: 1 |
| `token_id` | string | Observed type string; non-null in 45/45 rows read; example: 50283 |
| `name` | string | Observed type string; non-null in 45/45 rows read; example: Agent #50283 |
| `total_feedbacks` | integer | Observed type integer; non-null in 45/45 rows read; example: 46 |
| `average_score` | numeric | Observed type numeric; non-null in 45/45 rows read; example: 0.0 |
| `is_verified` | boolean | Observed type boolean; non-null in 45/45 rows read; example: false |
| `x402_supported` | boolean | Observed type boolean; non-null in 45/45 rows read; example: false |
| `token_uri_sha256` | string | Observed type string; non-null in 45/45 rows read; example: 7828bfc2340313be083d13b60f368fac08b15b2924586a2c631d8bcd6328… |
| `token_uri_kind` | string | Observed type string; non-null in 45/45 rows read; example: https |
| `endpoint_from` | string | Observed type string; non-null in 20/45 rows read; example: tokenuri-http-fallback |
| `endpoint` | url | Observed type url; non-null in 42/45 rows read; example: https://execution.market/workers/0xd5791860ca10a6f39749fb499… |
| `state` | string | Observed type string; non-null in 45/45 rows read; example: LIVE |
| `http` | string | Observed type string; non-null in 42/45 rows read; example: 200 |
| `reg_name` | string | Observed type string; non-null in 32/45 rows read; example: tuff-monitor |
| `reason` | string | Observed type string; non-null in 3/45 rows read; example: no-endpoint |

## `ledger-card-erc8004-callable-unsigned.json`

Top-level keys: `schema`, `surface`, `subject`, `as_of`, `source_urls`, `payload`, `sha256`, `unmeasured`, `did`, `sig_ed25519`, `note`.


## `ledger-card-erc8004-callable.json`

Top-level keys: `as_of`, `did`, `payload`, `schema`, `sha256`, `sig_ed25519`, `surface`, `subject`, `source_urls`, `unmeasured`.


## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 10/10 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 9/10 rows read; example: 4301 |
| `sha` | string | Observed type string; non-null in 9/10 rows read; example: d59abe39b4b4210bed856112c2427f6d88e905bf |
| `ext` | string | Observed type string; non-null in 10/10 rows read; example: md |
| `url` | url | Observed type url; non-null in 10/10 rows read; example: https://huggingface.co/datasets/csoai/erc8004-reader/resolve… |
| `repo` | string | Observed type string; non-null in 10/10 rows read; example: csoai/erc8004-reader |
| `as_of` | datetime | Observed type datetime; non-null in 10/10 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 10/10 rows read; example: https://huggingface.co/api/datasets/csoai/erc8004-reader/tre… |

## `probes.json`

Top-level keys: `as_of`, `grammar`, `method`, `probes`, `registry`, `never`.
Records under `probes`:

| field | type | description |
|---|---|---|
| `token_id` | integer | Observed type integer; non-null in 3/3 rows read; example: 56249 |
| `name` | string | Observed type string; non-null in 3/3 rows read; example: AgentEcon |
| `chain_id` | integer | Observed type integer; non-null in 3/3 rows read; example: 8453 |
| `endpoint` | url | Observed type url; non-null in 3/3 rows read; example: https://econ.memoryapi.org |
| `http` | integer | Observed type integer; non-null in 3/3 rows read; example: 200 |
| `state` | string | Observed type string; non-null in 3/3 rows read; example: CALLABLE |
| `note` | string | Observed type string; non-null in 3/3 rows read; example: live JSON service descriptor v1.0.0; GET /x402/econ/inflatio… |

## `tokenuris.json`

Top-level keys: `25975`, `56260`, `56249`, `55985`, `82835`.

