# Stage 3 catalog clusters (NEXT_300 #303–308)

**Status:** ✅ catalog stubs shipped — unsigned REPORTED manifests only. Mainnet signed cards remain blocked on custody + counsel (#169–181, #294).

Six JSON batches under `adapters/evm/catalog/` enumerate public artifact URLs for EVM catalog breadth. **No MEASURED scores.** Contracts with `public_id: null` must be re-verified on Etherscan before any attach.

## Register

| Move | Cluster | Batch | File | Entries | Status |
|------|---------|-------|------|---------|--------|
| 303 | Ondo Stocks | A | `ondo-stocks-batch-a.json` | 6 flagship tickers | ✅ stub |
| 304 | Ondo Stocks | B | `ondo-stocks-batch-b.json` | 6 tickers + ETFs | ✅ stub |
| 305 | Securitize DS | A | `securitize-batch-a.json` | 4 marquee funds | ✅ stub |
| 306 | Securitize DS | B | `securitize-batch-b.json` | 3 + expand slot | ✅ stub |
| 307 | Backed bTokens | A | `backed-batch-a.json` | 4 seed equities | ✅ stub |
| 308 | Backed xStocks | B | `backed-batch-b.json` | 3 + expand slot | ✅ stub |

## Doctrine

- Full Ondo ticker→hash list is **not** one public registry — cite dated primary pages only.
- Securitize / Backed clusters expand per verified contract after counsel clearance.
- Wilson applies only on frozen banks — not on live catalog churn.
- JMWH remains **demo-only** — never in mainnet catalog attach set.

## Verify locally

```bash
npx tsx adapters/evm/catalog/index.ts ondo-stocks-batch-a
npx tsx adapters/evm/catalog/index.ts securitize-batch-a
npx tsx adapters/evm/catalog/index.ts backed-batch-a
```

Crosswalk: `docs/STAGE3_CLEAN_PLAY_REFRESHES.md` · `client/src/data/rwaAttestationTargets.ts` (`RWA_EVM_CATALOG_CLUSTERS`)

JSON Schema: `public/.well-known/schemas/evm-catalog-cluster.schema.json` · lint: `npm run lint:evm-catalog`
