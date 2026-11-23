# Field reference: nicktempleman/sovx-wrapped-asset-measurements

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `croissant.json`

Top-level keys: `@context`, `@type`, `conformsTo`, `name`, `description`, `license`, `url`, `creator`, `datePublished`, `version`, `citeAs`, `distribution`, `recordSet`.
Records under `distribution`:

| field | type | description |
|---|---|---|
| `@type` | string | Observed type string; non-null in 2/2 rows read; example: cr:FileObject |
| `@id` | string | Observed type string; non-null in 2/2 rows read; example: sovx_wrapper_pairs.csv |
| `name` | string | Observed type string; non-null in 2/2 rows read; example: sovx_wrapper_pairs.csv |
| `contentUrl` | string | Observed type string; non-null in 2/2 rows read; example: sovx_wrapper_pairs.csv |
| `encodingFormat` | string | Observed type string; non-null in 2/2 rows read; example: text/csv |
| `sha256` | string | Observed type string; non-null in 2/2 rows read; example: c6c13c19c627265a9b51392a21e492768fc897215c3c3629b3ac985b5d89… |

## `records/cross-ledger-xl-2026-09-29.json`

Top-level keys: `schema`, `date`, `as_of`, `started_at`, `finished_at`, `producer`, `what_this_is`, `measurement_only`, `selection`, `assets`, `deployments`, `parity`, `unmeasured_selected`, `uncheckable`, `evidence_kind_legend`, `consensus_check`, `totals_rule`, `files`, `changes`.
Records under `deployments`:

| field | type | description |
|---|---|---|
| `asset_key` | string | Observed type string; non-null in 125/125 rows read; example: benji |
| `product` | string | Observed type string; non-null in 125/125 rows read; example: BENJI |
| `ledger` | string | Observed type string; non-null in 125/125 rows read; example: stellar |
| `deployment_id` | string | Observed type string; non-null in 125/125 rows read; example: GBHNGLLIE3KWGKCHIKMHJ5HVZHYIK7WTBE4QF5PLAKL4CJGSEU7HZIW5 |
| `evidence_kind` | string | Observed type string; non-null in 125/125 rows read; example: OPERATOR_API |
| `supply_decimal` | string | Observed type string; non-null in 125/125 rows read; example: 426887944.6670195 |
| `height` | integer | Observed type integer; non-null in 124/125 rows read; example: 64673966 |
| `two_operators_agree` | string | Observed type string; non-null in 125/125 rows read; example: true |
| `header_hash_recomputed` | boolean | Observed type boolean; non-null in 86/125 rows read; example: true |
| `second_operator_same_block` | boolean | Observed type boolean; non-null in 72/125 rows read; example: true |
| `consensus_check` | string | Observed type string; non-null in 125/125 rows read; example: NOT_VALIDATOR_SIGNATURE_CHECKED |

## `records/evidence/buidl__ethereum.json`

Top-level keys: `schema`, `id`, `state`, `as_of`, `state_definition`, `caip19`, `same_contract_records`, `record`, `ledger`, `live_preview`, `token_list`, `note`.


## `records/evidence/cbbtc__base.json`

Top-level keys: `schema`, `id`, `state`, `as_of`, `state_definition`, `caip19`, `same_contract_records`, `record`, `ledger`, `live_preview`, `token_list`, `note`.


## `records/evidence/cbbtc__ethereum.json`

Top-level keys: `schema`, `id`, `state`, `as_of`, `state_definition`, `caip19`, `same_contract_records`, `record`, `ledger`, `live_preview`, `token_list`, `note`.


## `records/evidence/cbxrp__base.json`

Top-level keys: `schema`, `id`, `state`, `as_of`, `state_definition`, `caip19`, `same_contract_records`, `record`, `ledger`, `live_preview`, `token_list`, `note`.


## `records/evidence/dai__base.json`

Top-level keys: `schema`, `id`, `state`, `as_of`, `state_definition`, `caip19`, `same_contract_records`, `record`, `ledger`, `live_preview`, `token_list`, `note`.


## `records/evidence/dai__optimism.json`

Top-level keys: `schema`, `id`, `state`, `as_of`, `state_definition`, `caip19`, `same_contract_records`, `record`, `ledger`, `live_preview`, `token_list`, `note`.


## `records/evidence/dai__polygon.json`

Top-level keys: `schema`, `id`, `state`, `as_of`, `state_definition`, `caip19`, `same_contract_records`, `record`, `ledger`, `live_preview`, `token_list`, `note`.


## `records/evidence/fxrp__flare.json`

Top-level keys: `schema`, `id`, `state`, `as_of`, `state_definition`, `caip19`, `same_contract_records`, `record`, `ledger`, `live_preview`, `token_list`, `note`.


## `records/evidence/jpmd__base.json`

Top-level keys: `schema`, `id`, `state`, `as_of`, `state_definition`, `caip19`, `same_contract_records`, `record`, `ledger`, `live_preview`, `token_list`, `note`.


## `records/evidence/usdbc__base.json`

Top-level keys: `schema`, `id`, `state`, `as_of`, `state_definition`, `caip19`, `same_contract_records`, `record`, `ledger`, `live_preview`, `token_list`, `note`.


## `records/evidence/usdc.e__arbitrum.json`

Top-level keys: `schema`, `id`, `state`, `as_of`, `state_definition`, `caip19`, `same_contract_records`, `record`, `ledger`, `live_preview`, `token_list`, `note`.


## `records/evidence/usdc.e__optimism.json`

Top-level keys: `schema`, `id`, `state`, `as_of`, `state_definition`, `caip19`, `same_contract_records`, `record`, `ledger`, `live_preview`, `token_list`, `note`.


## `records/evidence/usdc.e__polygon.json`

Top-level keys: `schema`, `id`, `state`, `as_of`, `state_definition`, `caip19`, `same_contract_records`, `record`, `ledger`, `live_preview`, `token_list`, `note`.


## `records/evidence/usdc__arbitrum.json`

Top-level keys: `schema`, `id`, `state`, `as_of`, `state_definition`, `caip19`, `same_contract_records`, `record`, `ledger`, `live_preview`, `token_list`, `note`.


## `records/evidence/usdc__base.json`

Top-level keys: `schema`, `id`, `state`, `as_of`, `state_definition`, `caip19`, `same_contract_records`, `record`, `ledger`, `live_preview`, `token_list`, `note`.


## `records/evidence/usdc__zksync-era.json`

Top-level keys: `schema`, `id`, `state`, `as_of`, `state_definition`, `caip19`, `same_contract_records`, `record`, `ledger`, `live_preview`, `token_list`, `note`.


## `records/evidence/usdt0__arbitrum.json`

Top-level keys: `schema`, `id`, `state`, `as_of`, `state_definition`, `caip19`, `same_contract_records`, `record`, `ledger`, `live_preview`, `token_list`, `note`.


## `records/evidence/usdt0__optimism.json`

Top-level keys: `schema`, `id`, `state`, `as_of`, `state_definition`, `caip19`, `same_contract_records`, `record`, `ledger`, `live_preview`, `token_list`, `note`.


## `records/evidence/usdt__arbitrum.json`

Top-level keys: `schema`, `id`, `state`, `as_of`, `state_definition`, `caip19`, `same_contract_records`, `record`, `ledger`, `live_preview`, `token_list`, `note`.


## `records/evidence/usdt__optimism.json`

Top-level keys: `schema`, `id`, `state`, `as_of`, `state_definition`, `caip19`, `same_contract_records`, `record`, `ledger`, `live_preview`, `token_list`, `note`.


## `records/evidence/usdt__polygon.json`

Top-level keys: `schema`, `id`, `state`, `as_of`, `state_definition`, `caip19`, `same_contract_records`, `record`, `ledger`, `live_preview`, `token_list`, `note`.


## `records/evidence/wbtc__ethereum.json`

Top-level keys: `schema`, `id`, `state`, `as_of`, `state_definition`, `caip19`, `same_contract_records`, `record`, `ledger`, `live_preview`, `token_list`, `note`.


## `records/evidence/weth__arbitrum.json`

Top-level keys: `schema`, `id`, `state`, `as_of`, `state_definition`, `caip19`, `same_contract_records`, `record`, `ledger`, `live_preview`, `token_list`, `note`.


## `records/evidence/wxrp__ethereum.json`

Top-level keys: `schema`, `id`, `state`, `as_of`, `state_definition`, `caip19`, `same_contract_records`, `record`, `ledger`, `live_preview`, `token_list`, `note`.


## `records/measured-wrappers.tokenlist.json`

Top-level keys: `name`, `timestamp`, `version`, `keywords`, `tags`, `tokens`.
Records under `tokens`:

| field | type | description |
|---|---|---|
| `chainId` | integer | Observed type integer; non-null in 21/21 rows read; example: 1 |
| `address` | string | Observed type string; non-null in 21/21 rows read; example: 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599 |
| `name` | string | Observed type string; non-null in 21/21 rows read; example: WBTC on ethereum |
| `symbol` | string | Observed type string; non-null in 21/21 rows read; example: WBTC |
| `decimals` | integer | Observed type integer; non-null in 21/21 rows read; example: 8 |
| `tags` | string | Observed type string; non-null in 21/21 rows read; example: ["listed", "custodial"] |
| `extensions` | string | Observed type string; non-null in 21/21 rows read; example: {"state": "INDEXED_CUSTODIAL", "as_of": "2026-09-14T10:51:51… |

## `records/wrapped-asset-parity-2026-09-14.json`

Top-level keys: `schema`, `reader_revision`, `as_of`, `attests`, `states`, `terms_boundary`, `correction_link`, `license`, `pins`, `counts`, `records`, `profile_rule`, `documentary`.
Records under `records`:

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 24/24 rows read; example: usdc.e:arbitrum |
| `wrapped` | string | Observed type string; non-null in 24/24 rows read; example: {"chain": "arbitrum", "symbol": "USDC.e", "address": "0xFF97… |
| `canonical` | string | Observed type string; non-null in 24/24 rows read; example: {"chain": "ethereum", "symbol": "USDC", "address": "0xA0b869… |
| `backing_model` | string | Observed type string; non-null in 24/24 rows read; example: escrow |
| `escrow` | string | Observed type string; non-null in 11/24 rows read; example: 0xcEe284F754E854890e311e3280b767F80797180d |
| `escrow_name` | string | Observed type string; non-null in 11/24 rows read; example: Arbitrum One ERC-20 gateway escrow |
| `note` | string | Observed type string; non-null in 15/24 rows read; example: Tether issues USDT natively on Arbitrum since 2025; the gate… |
| `reads` | string | Observed type string; non-null in 24/24 rows read; example: {"wrapped_total_supply": {"query": "totalSupply()", "raw": "… |
| `state` | string | Observed type string; non-null in 24/24 rows read; example: ESCROW_PARITY_READ |
| `error` | string | Observed type string; non-null in 2/24 rows read; example: empty eth_call result from 0x82aF49448D82B08cD7C12Be3B9395C0… |
| `escrow_over_wrapped` | string | Observed type string; non-null in 8/24 rows read; example: 1.080848 |
| `profile` | string | Observed type string; non-null in 13/24 rows read; example: {"issuer": "third-party bridged USDC on arbitrum (canonical … |

## `sovx_wrapper_pairs.csv`

| field | type | description |
|---|---|---|
| `record_id` | string | Observed type string; non-null in 24/24 rows read; example: usdc.e:arbitrum |
| `caip19` | string | Observed type string; non-null in 24/24 rows read; example: eip155:42161/erc20:0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC… |
| `chain` | string | Observed type string; non-null in 24/24 rows read; example: arbitrum |
| `chain_id` | integer | Observed type integer; non-null in 24/24 rows read; example: 42161 |
| `symbol` | string | Observed type string; non-null in 24/24 rows read; example: USDC.e |
| `state` | string | Observed type string; non-null in 24/24 rows read; example: ESCROW_PARITY_READ |
| `as_of` | datetime | Observed type datetime; non-null in 24/24 rows read; example: 2026-09-14T10:51:51.468Z |
| `block` | integer | Observed type integer; non-null in 24/24 rows read; example: 505048166 |
| `block_hash` | string | Observed type string; non-null in 24/24 rows read; example: 0xb8795eb49da592664b08eced27415a63314f4f25a6a0f52e5651147934… |
| `canonical_chain` | string | Observed type string; non-null in 24/24 rows read; example: ethereum |
| `canonical_block` | integer | Observed type integer; non-null in 16/24 rows read; example: 25975142 |
| `backing_model` | string | Observed type string; non-null in 24/24 rows read; example: escrow |
| `escrow_over_wrapped` | numeric | Observed type numeric; non-null in 8/24 rows read; example: 1.080848 |
| `wrapped_total_supply` | numeric | Observed type numeric; non-null in 22/24 rows read; example: 48331267.900248 |
| `escrow_balance` | numeric | Observed type numeric; non-null in 8/24 rows read; example: 52238762.917301 |
| `evidence_url` | url | Observed type url; non-null in 24/24 rows read; example: https://councilof.ai/w/usdc.e:arbitrum |
| `ledger_url` | url | Observed type url; non-null in 24/24 rows read; example: https://councilof.ai/interop/wrapped-asset-parity-2026-09-14… |
| `record_sha256` | string | Observed type string; non-null in 24/24 rows read; example: 003fdc36efa89e60005db8c5a1e52388c3dc3e497ec5418e9d22a55a7845… |
| `evidence_sha256` | string | Observed type string; non-null in 24/24 rows read; example: 50d076b79eb19512418f617ad57b9ba007b2b422ed045d360298c651981a… |

## `sovx_wrapper_pairs.parquet`

| field | type | description |
|---|---|---|
| `record_id` | string | Observed type string; non-null in 24/24 rows read; example: usdc.e:arbitrum |
| `caip19` | string | Observed type string; non-null in 24/24 rows read; example: eip155:42161/erc20:0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC… |
| `chain` | string | Observed type string; non-null in 24/24 rows read; example: arbitrum |
| `chain_id` | integer | Observed type integer; non-null in 24/24 rows read; example: 42161 |
| `symbol` | string | Observed type string; non-null in 24/24 rows read; example: USDC.e |
| `state` | string | Observed type string; non-null in 24/24 rows read; example: ESCROW_PARITY_READ |
| `as_of` | datetime | Observed type datetime; non-null in 24/24 rows read; example: 2026-09-14T10:51:51.468Z |
| `block` | integer | Observed type integer; non-null in 24/24 rows read; example: 505048166 |
| `block_hash` | string | Observed type string; non-null in 24/24 rows read; example: 0xb8795eb49da592664b08eced27415a63314f4f25a6a0f52e5651147934… |
| `canonical_chain` | string | Observed type string; non-null in 24/24 rows read; example: ethereum |
| `canonical_block` | integer | Observed type integer; non-null in 16/24 rows read; example: 25975142 |
| `backing_model` | string | Observed type string; non-null in 24/24 rows read; example: escrow |
| `escrow_over_wrapped` | string | Observed type string; non-null in 8/24 rows read; example: 1.080848 |
| `wrapped_total_supply` | string | Observed type string; non-null in 22/24 rows read; example: 48331267.900248 |
| `escrow_balance` | string | Observed type string; non-null in 8/24 rows read; example: 52238762.917301 |
| `evidence_url` | url | Observed type url; non-null in 24/24 rows read; example: https://councilof.ai/w/usdc.e:arbitrum |
| `ledger_url` | url | Observed type url; non-null in 24/24 rows read; example: https://councilof.ai/interop/wrapped-asset-parity-2026-09-14… |
| `record_sha256` | string | Observed type string; non-null in 24/24 rows read; example: 003fdc36efa89e60005db8c5a1e52388c3dc3e497ec5418e9d22a55a7845… |
| `evidence_sha256` | string | Observed type string; non-null in 24/24 rows read; example: 50d076b79eb19512418f617ad57b9ba007b2b422ed045d360298c651981a… |
