# Field reference: nicktempleman/csoai-wrapped-asset-parity

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `records.jsonl`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/wrapped-asset-parity/records.jsonl.

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 24/24 rows read; example: usdc.e:arbitrum |
| `wrapped_chain` | string | Observed type string; non-null in 24/24 rows read; example: arbitrum |
| `wrapped_symbol` | string | Observed type string; non-null in 24/24 rows read; example: USDC.e |
| `wrapped_address` | string | Observed type string; non-null in 24/24 rows read; example: 0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8 |
| `canonical_chain` | string | Observed type string; non-null in 24/24 rows read; example: ethereum |
| `canonical_symbol` | string | Observed type string; non-null in 24/24 rows read; example: USDC |
| `backing_model` | string | Observed type string; non-null in 24/24 rows read; example: escrow |
| `escrow` | string | Observed type string; non-null in 11/24 rows read; example: 0xcEe284F754E854890e311e3280b767F80797180d |
| `state` | string | Observed type string; non-null in 24/24 rows read; example: ESCROW_PARITY_READ |
| `wrapped_total_supply` | string | Observed type string; non-null in 22/24 rows read; example: 48331267.900248 |
| `escrow_balance` | string | Observed type string; non-null in 8/24 rows read; example: 52238762.917301 |
| `escrow_over_wrapped` | string | Observed type string; non-null in 8/24 rows read; example: 1.080848 |
| `wrapped_block` | integer | Observed type integer; non-null in 24/24 rows read; example: 505048166 |
| `canonical_block` | integer | Observed type integer; non-null in 16/24 rows read; example: 25975142 |
| `as_of` | datetime | Observed type datetime; non-null in 24/24 rows read; example: 2026-09-14T10:51:51.468Z |
| `note` | string | Observed type string; non-null in 15/24 rows read; example: Tether issues USDT natively on Arbitrum since 2025; the gate… |

## `wrapped-asset-parity.json`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/wrapped-asset-parity/wrapped-asset-parity.json.

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
