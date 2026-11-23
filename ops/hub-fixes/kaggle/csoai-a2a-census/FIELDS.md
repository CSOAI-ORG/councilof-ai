# Field reference: nicktempleman/csoai-a2a-census

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `a2a_atoms.json`

| field | type | description |
|---|---|---|
| `surface` | string | Observed type string; non-null in 4/4 rows read; example: a2a:marketplace-operated-grid-planner |
| `seed` | url | Observed type url; non-null in 4/4 rows read; example: https://bnb-agent-marketplace-ruby.vercel.app/grid/.well-kno… |
| `card_url` | url | Observed type url; non-null in 4/4 rows read; example: https://bnb-agent-marketplace-ruby.vercel.app/grid/.well-kno… |
| `declared_name` | string | Observed type string; non-null in 4/4 rows read; example: marketplace-operated-grid-planner |
| `declared_url` | url | Observed type url; non-null in 4/4 rows read; example: https://bnb-agent-marketplace-ruby.vercel.app/api/sellers/gr… |
| `conformance` | string | Observed type string; non-null in 4/4 rows read; example: CONFORMANT |
| `v1_markers` | string | Observed type string; non-null in 4/4 rows read; example: ["protocolVersion", "preferredTransport"] |
| `skill_count` | integer | Observed type integer; non-null in 4/4 rows read; example: 3 |
| `capability_honesty_verdict` | string | Observed type string; non-null in 4/4 rows read; example: TRANSPORT_MISMATCH |

## `a2a_census.json`

Top-level keys: `census`, `as_of`, `status`, `method`, `citation_reported`, `conformance_spec`, `sample`, `results`.
Records under `results`:

| field | type | description |
|---|---|---|
| `seed` | url | Observed type url; non-null in 18/18 rows read; example: https://tephra.ai/.well-known/agent-card.json |
| `state` | string | Observed type string; non-null in 13/18 rows read; example: NO_CARD |
| `http` | integer | Observed type integer; non-null in 12/18 rows read; example: 200 |
| `card_url` | url | Observed type url; non-null in 5/18 rows read; example: https://bnb-agent-marketplace-ruby.vercel.app/grid/.well-kno… |
| `fields_present` | string | Observed type string; non-null in 5/18 rows read; example: ["name", "description", "url", "version", "capabilities", "d… |
| `fields_missing` | string | Observed type string; non-null in 5/18 rows read |
| `v1_markers` | string | Observed type string; non-null in 5/18 rows read; example: ["protocolVersion", "preferredTransport"] |
| `declared_name` | string | Observed type string; non-null in 5/18 rows read; example: marketplace-operated-grid-planner |
| `declared_url` | url | Observed type url; non-null in 5/18 rows read; example: https://bnb-agent-marketplace-ruby.vercel.app/api/sellers/gr… |
| `skill_count` | integer | Observed type integer; non-null in 5/18 rows read; example: 3 |
| `declared_streaming` | boolean | Observed type boolean; non-null in 5/18 rows read; example: false |
| `declared_push` | boolean | Observed type boolean; non-null in 5/18 rows read; example: false |
| `conformance` | string | Observed type string; non-null in 5/18 rows read; example: CONFORMANT |
| `capability_honesty` | string | Observed type string; non-null in 5/18 rows read; example: {"probe": "tasks/get(nonexistent-id)", "declares_a2a_jsonrpc… |
| `fetch_err` | string | Observed type string; non-null in 1/18 rows read; example: [Errno 8] nodename nor servname provided, or not k |

## `a2a_census.jsonl`

| field | type | description |
|---|---|---|
| `agent_name` | string | Observed type string; non-null in 5/18 rows read; example: marketplace-operated-grid-planner |
| `domain` | string | Observed type string; non-null in 18/18 rows read; example: tephra.ai |
| `seed` | url | Observed type url; non-null in 18/18 rows read; example: https://tephra.ai/.well-known/agent-card.json |
| `card_state` | string | Observed type string; non-null in 18/18 rows read; example: NO_CARD |
| `capability_honesty_verdict` | string | Observed type string; non-null in 5/18 rows read; example: TRANSPORT_MISMATCH |
| `skill_count` | integer | Observed type integer; non-null in 5/18 rows read; example: 3 |
| `as_of` | datetime | Observed type datetime; non-null in 18/18 rows read; example: 2026-09-01T05:39:07Z |

## `ledger-card-a2a-agent-unsigned.json`

Top-level keys: `schema`, `surface`, `subject`, `as_of`, `source_urls`, `payload`, `sha256`, `unmeasured`, `did`, `sig_ed25519`, `note`.


## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 6/6 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 5/6 rows read; example: 4217 |
| `sha` | string | Observed type string; non-null in 5/6 rows read; example: c9709ae28dc6045b3bbc59d833079b59d804cc33 |
| `ext` | string | Observed type string; non-null in 6/6 rows read; example: md |
| `url` | url | Observed type url; non-null in 6/6 rows read; example: https://huggingface.co/datasets/csoai/a2a-census/resolve/mai… |
| `repo` | string | Observed type string; non-null in 6/6 rows read; example: csoai/a2a-census |
| `as_of` | datetime | Observed type datetime; non-null in 6/6 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 6/6 rows read; example: https://huggingface.co/api/datasets/csoai/a2a-census/tree/ma… |
