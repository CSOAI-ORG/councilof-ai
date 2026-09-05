# Franklin BENJI per-chain on-chain supply (2026-09)

**Unsigned** · `writes_board: false` · surface `benji.onchain.supply` · **not** MEASURED · **not** AUM.

Issuer states **1 BENJI = 1 share of FOBXX**; on-chain is a **secondary** register to the transfer agent's books. Every card therefore carries:

```
unmeasured = ["primary_register_reconciliation"]
```

## Chains (9)

| Chain | Status | Contract / issuer | totalSupply (BENJI units) |
| --- | --- | --- | --- |
| Stellar | DISCOVERED | `GBHNGLLIE3KWGKCHIKMHJ5HVZHYIK7WTBE4QF5PLAKL4CJGSEU7HZIW5` | 447966470.9497616 |
| Ethereum | DISCOVERED | `0x3DDc84940Ab509C11B20B76B466933f40b750dc9` | 48099752.286024417481679295 |
| Polygon | DISCOVERED | `0x408A634B8a8f0dE729B48574a3a7Ec3fE820B00A` | 32133268.426128809533454758 |
| Arbitrum | DISCOVERED | `0xB9e4765BCE2609bC1949592059B17Ea72fEe6C6A` | 47841844.669865952634343475 |
| Base | DISCOVERED | `0x60CfC2b186a4CF647486e42c42B11cC6D571d1E4` | 59584102.332446749667500804 |
| Avalanche | DISCOVERED | `0xE08b4c1005603427420e64252a8b120cacE4D122` | 34231383.654052522372342291 |
| Aptos | DISCOVERED | `0x7b5e9cac3433e9202f28527f707c89e1e47b19de2c33e4db9521a63ad219b739` | 19673206.526646601 |
| Solana | DISCOVERED | `5Tu84fKBpe9vfXeotjvfvWdWbAjy3hqsExvuHgFqFxA1` | 355.994303631 |
| BNB | UNCHECKABLE | `None` | — |

## UNCHECKABLE
- **BNB** — issuer DevHub lists **iBENJI** on BNB Smart Chain, not BENJI/FOBXX. On-chain probe of `0x3d0a…` returns `symbol=iBENJI` / Institutional Liquidity Fund. No BENJI fund-token address found → UNCHECKABLE (do not publish iBENJI supply as BENJI AUM).

## Hard stops
- Never invent AUM / platform totals.
- `sig_ed25519: null` (NO_LAPTOP_SIGN).
- Do not touch `card_index`, wrangler, or stamp MEASURED.
- Addresses taken from issuer [benji-contracts](https://digitalassets.franklintempleton.com/benji/benji-contracts/) page only.
