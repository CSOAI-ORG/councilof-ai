# Stablecoin universe — frozen 2026-09-11

This release indexes the full public DefiLlama stablecoin response observed at
`2026-09-11T08:19:34.591714+00:00`.

- 425 upstream asset identifiers
- 211 reported chains
- 1,640 asset/chain entries
- $310,786,569,942.87 summed from available upstream `circulating.peggedUSD` fields
- $289,226,295,636.38 across the first ten rows after value ordering

`source.json` contains the frozen upstream bytes. Its SHA-256 is
`f8f3a1a2c309c570b8ae10c1f890690f9004493e2b57ab50bef9c43e9a8d1d86`.
`index.json` is the normalized discovery index.
`readiness.json` is the machine-readable evidence-status view. It gives every
asset the same status contract for source, chain deployments, measurement
depth, freshness, signature, root inclusion, external witness state,
correction lineage, and A2A/MCP/x402 discovery. A generic door is labeled as a
generic door; it is never presented as 425 separate integrations.

Every row is labeled `INDEXED`, `UNMEASURED`, `UNSIGNED`, `UNROOTED`, and
`UNANCHORED`. These labels prevent registry metadata from being presented as an
independent chain measurement. RLUSD's separately published evidence is the
current deeply measured cross-chain asset.

Rebuild the normalized file from frozen bytes:

```sh
python3 scripts/freeze_stablecoin_index.py \
  --offline \
  --raw public/interop/stablecoin-universe-2026-09/source.json \
  --output /tmp/stablecoin-index.json \
  --observed-at 2026-09-11T08:19:34.591714+00:00
cmp /tmp/stablecoin-index.json public/interop/stablecoin-universe-2026-09/index.json

python3 scripts/build_stablecoin_readiness.py
python3 scripts/check_stablecoin_readiness.py
```

The priority score chooses the first 20 candidates for deeper work using only
reported circulating value and chain count. It is scheduling metadata, not a
risk, quality, safety, compliance, or investment score.
