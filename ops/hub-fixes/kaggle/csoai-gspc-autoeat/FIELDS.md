# Field reference: nicktempleman/csoai-gspc-autoeat

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `cards-compact.json`

Top-level keys: `autoeat.hf.newmodels`, `autoeat.mcp.registry`, `autoeat.erc8004.newagents`, `autoeat.xrpl.accounts`.


## `ledger-card-autoeat-erc8004-newagents.json`

Top-level keys: `as_of`, `did`, `payload`, `schema`, `sha256`, `sig_ed25519`, `surface`, `subject`, `source_urls`, `unmeasured`.


## `ledger-card-autoeat-hf-newmodels.json`

Top-level keys: `as_of`, `did`, `payload`, `schema`, `sha256`, `sig_ed25519`, `surface`, `subject`, `source_urls`, `unmeasured`.


## `ledger-card-autoeat-hf-spaces.json`

Top-level keys: `as_of`, `did`, `payload`, `schema`, `sha256`, `sig_ed25519`, `surface`, `subject`, `source_urls`, `unmeasured`.


## `ledger-card-autoeat-mcp-registry.json`

Top-level keys: `as_of`, `did`, `payload`, `schema`, `sha256`, `sig_ed25519`, `surface`, `subject`, `source_urls`, `unmeasured`.


## `ledger-card-autoeat-npm-registry.json`

Top-level keys: `as_of`, `did`, `payload`, `schema`, `sha256`, `sig_ed25519`, `surface`, `subject`, `source_urls`, `unmeasured`.


## `ledger-card-autoeat-xrpl-accounts.json`

Top-level keys: `as_of`, `did`, `payload`, `schema`, `sha256`, `sig_ed25519`, `surface`, `subject`, `source_urls`, `unmeasured`.


## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 16/16 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 15/16 rows read; example: 1286 |
| `sha` | string | Observed type string; non-null in 15/16 rows read; example: 60412fdf2a820913cdba55a8ca537d00b3c44e83 |
| `ext` | string | Observed type string; non-null in 16/16 rows read; example: md |
| `url` | url | Observed type url; non-null in 16/16 rows read; example: https://huggingface.co/datasets/csoai/gspc-autoeat/resolve/m… |
| `repo` | string | Observed type string; non-null in 16/16 rows read; example: csoai/gspc-autoeat |
| `as_of` | datetime | Observed type datetime; non-null in 16/16 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 16/16 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-autoeat/tree/… |

## `probed.json`


## `queue.jsonl`

| field | type | description |
|---|---|---|
| `as_of` | datetime | Observed type datetime; non-null in 5000/5000 rows read; example: 2026-09-01T06:07:57Z |
| `id` | string | Observed type string; non-null in 5000/5000 rows read; example: PrinceAlhassanNasamu/tekyerema-asr-ctc-twi-v2 |
| `kind` | string | Observed type string; non-null in 5000/5000 rows read; example: hf-model |
| `meta` | string | Observed type string; non-null in 5000/5000 rows read; example: {"pipeline_tag": null, "sha": null} |
| `source` | string | Observed type string; non-null in 5000/5000 rows read; example: huggingface.co/api/models |
| `status` | string | Observed type string; non-null in 5000/5000 rows read; example: DISCOVERED |

## `status.json`

Top-level keys: `loop`, `as_of`, `queue_discovered_total`, `discovered_by_kind`, `probed_total`, `staged_live_of_probed`, `atoms_staged`, `surfaces_staged`, `last_signed_batch`, `invariant`.


## `verify-autoeat.json`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 6/6 rows read; example: ledger-card-autoeat-erc8004-newagents.json |
| `surface` | string | Observed type string; non-null in 6/6 rows read; example: autoeat.erc8004.newagents |
| `did` | string | Observed type string; non-null in 6/6 rows read; example: did:web:csoai.org#board-attestation-1 |
| `sha_ok` | boolean | Observed type boolean; non-null in 6/6 rows read; example: true |
| `board` | string | Observed type string; non-null in 6/6 rows read; example: VALID |
| `card` | string | Observed type string; non-null in 6/6 rows read; example: InvalidSignature |
| `auto_measured` | boolean | Observed type boolean; non-null in 6/6 rows read; example: false |
| `intern_as_measured` | boolean | Observed type boolean; non-null in 6/6 rows read; example: false |

## `verify-interop.json`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 7/7 rows read; example: ledger-card-autoeat-hf-newmodels.json |
| `surface` | string | Observed type string; non-null in 7/7 rows read; example: autoeat.hf.newmodels |
| `did` | string | Observed type string; non-null in 7/7 rows read; example: did:web:csoai.org#board-attestation-1 |
| `auto_measured` | boolean | Observed type boolean; non-null in 4/7 rows read; example: false |
| `card_attestation_1` | string | Observed type string; non-null in 7/7 rows read; example: {"verdict": "INVALID", "reason": "InvalidSignature"} |
| `board_attestation_1` | string | Observed type string; non-null in 7/7 rows read; example: {"verdict": "INVALID", "reason": "InvalidSignature"} |
| `intern_as_measured` | boolean | Observed type boolean; non-null in 7/7 rows read; example: false |

## `verify-resign.json`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 2/2 rows read; example: ledger-card-autoeat-hf-newmodels.json |
| `surface` | string | Observed type string; non-null in 2/2 rows read; example: autoeat.hf.newmodels |
| `did` | string | Observed type string; non-null in 2/2 rows read; example: did:web:csoai.org#board-attestation-1 |
| `sha_ok` | boolean | Observed type boolean; non-null in 2/2 rows read; example: true |
| `board_attestation_1` | string | Observed type string; non-null in 2/2 rows read; example: InvalidSignature |
| `card_attestation_1` | string | Observed type string; non-null in 2/2 rows read; example: InvalidSignature |
| `auto_measured` | boolean | Observed type boolean; non-null in 2/2 rows read; example: false |
| `intern_as_measured` | boolean | Observed type boolean; non-null in 2/2 rows read; example: false |
