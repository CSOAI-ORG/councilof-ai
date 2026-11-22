# Field reference: nicktempleman/csoai-gspc-genai-mil-notices

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `1fdd479f7a183bd8.json`

Top-level keys: `card`, `proof`.


## `264fce096a099155.json`

Top-level keys: `card`, `proof`.


## `3437376d1e53b688.json`

Top-level keys: `card`, `proof`.


## `467faee5cc8824d3.json`

Top-level keys: `card`, `proof`.


## `5afa72ee3675e7a3.json`

Top-level keys: `card`, `proof`.


## `8d876a2dba25a755.json`

Top-level keys: `card`, `proof`.


## `cafaceb39684ee2e.json`

Top-level keys: `card`, `proof`.


## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 14/14 rows read; example: 1fdd479f7a183bd8.json |
| `bytes` | integer | Observed type integer; non-null in 13/14 rows read; example: 2858 |
| `sha` | string | Observed type string; non-null in 13/14 rows read; example: 64e22136bbb012e166ea71eeab2c3e075f95fc2a |
| `ext` | string | Observed type string; non-null in 14/14 rows read; example: json |
| `url` | url | Observed type url; non-null in 14/14 rows read; example: https://huggingface.co/datasets/csoai/gspc-genai-mil-notices… |
| `repo` | string | Observed type string; non-null in 14/14 rows read; example: csoai/gspc-genai-mil-notices |
| `as_of` | datetime | Observed type datetime; non-null in 14/14 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 14/14 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-genai-mil-not… |

## `nist-airmf-gspc-crosswalk.json`

Top-level keys: `kind`, `schema`, `title`, `as_of`, `status`, `not_a_legal_determination`, `not_a_certification`, `not_a_conformity_assessment`, `disclaimer`, `context`, `gspc_axes`, `crosswalk`, `honesty`, `source_urls`.
Records under `crosswalk`:

| field | type | description |
|---|---|---|
| `nist_function` | string | Observed type string; non-null in 4/4 rows read; example: GOVERN |
| `outcome` | string | Observed type string; non-null in 4/4 rows read; example: Policies, accountability, and oversight structures for AI ri… |
| `gspc_axes` | string | Observed type string; non-null in 4/4 rows read; example: ["governance", "art5-safeguard", "openness"] |
| `evidence` | string | Observed type string; non-null in 4/4 rows read; example: Signed governance-axis cards + openness (documentation/trans… |
| `coverage` | string | Observed type string; non-null in 4/4 rows read; example: PARTIAL - GSPC measures model behaviour, not the deployer's … |

## `verify-genai.json`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 7/7 rows read; example: 1fdd479f7a183bd8.json |
| `subject` | string | Observed type string; non-null in 7/7 rows read; example: GenAI.mil: 3 frontier vendors on IL5 (31 Aug 2026 War Dept r… |
| `surface` | string | Observed type string; non-null in 7/7 rows read; example: public.notice |
| `status` | string | Observed type string; non-null in 7/7 rows read; example: UNMEASURED |
| `sha_ok` | boolean | Observed type boolean; non-null in 7/7 rows read; example: true |
| `board` | string | Observed type string; non-null in 7/7 rows read; example: VALID |
| `card` | string | Observed type string; non-null in 7/7 rows read; example: InvalidSignature |
| `intern_as_measured` | boolean | Observed type boolean; non-null in 7/7 rows read; example: false |
| `not_a_measurement` | boolean | Observed type boolean; non-null in 1/7 rows read; example: true |
