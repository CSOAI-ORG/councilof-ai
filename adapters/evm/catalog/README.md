# EVM catalog clusters — Stage 3 breadth stubs (NEXT_300 #303–308)

**Posture:** REPORTED / contact-only · **not MEASURED** · `measured_score: null` · no signing.

These JSON manifests enumerate **public artifact URLs** for catalog breadth. They are **not** a unified on-chain registry — full Ondo ticker→hash lists do not exist in one public source (see `docs/EAT_DSH_ALIGNMENT.md`).

## Batches

| Move | File | Cluster | Contents |
|------|------|---------|----------|
| #303 | `ondo-stocks-batch-a.json` | Ondo Stocks | Flagship tickers A–M |
| #304 | `ondo-stocks-batch-b.json` | Ondo Stocks | Flagship tickers N–Z + ETFs |
| #305 | `securitize-batch-a.json` | Securitize DS | Marquee funds + credit feeders |
| #306 | `securitize-batch-b.json` | Securitize DS | Additional DS tokens (TBD contracts) |
| #307 | `backed-batch-a.json` | Backed bTokens | Seed equities A–M |
| #308 | `backed-batch-b.json` | Backed xStocks | Seed equities N–Z + ETFs |

## Rules

1. Every row cites a **public** primary page or explorer — never invent AUM as MEASURED.
2. `public_id: null` means **re-verify on Etherscan** before attach; do not guess contracts.
3. Wilson / signed cards require frozen bank + custody + counsel — not these stubs.
4. Slugs align with `client/src/data/rwaAttestationTargets.ts` when a seed row exists.

## Usage

```bash
npx tsx adapters/evm/catalog/index.ts ondo-stocks-batch-a
npx tsx adapters/evm/catalog/index.ts securitize-batch-a
```

Crosswalk: `docs/STAGE3_CATALOG_CLUSTERS.md` · matrix: `docs/RWA_CONTACT_MATRIX.md`
