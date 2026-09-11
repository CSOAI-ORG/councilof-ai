# TUI-2 — Financial Coverage Machine Report

**Branch:** `finance/full-spread-20260911`
**Generated:** 2026-09-11T14:30:00Z
**Source:** `public/interop/stablecoin-universe-2026-09/` (commit b284d3cc)
**Source SHA-256:** `f8f3a1a2c309c570b8ae10c1f890690f9004493e2b57ab50bef9c43e9a8d1d86`
**Observed at:** `2026-09-11T08:19:34.591714+00:00`
**Canonical authority:** https://councilof.ai/api/state

---

## Verified Counts (all from committed artifacts)

| Metric | Value | Source | State |
|--------|-------|--------|-------|
| Indexed assets | 425 | index.json | VERIFIED |
| Chain deployments | 1,640 | index.json | VERIFIED |
| Distinct chains | 211 | index.json | VERIFIED |
| Circulating USD | $310.79B | index.json | VERIFIED |
| Deep measurement queue | 20 | readiness.json | VERIFIED |
| Deeply measured | 0 | readiness.json | HONEST |
| Evidence state | INDEXED (all 425) | index.json | VERIFIED |
| Measurement state | UNMEASURED (all 425) | index.json | HONEST |
| Anchor state | UNANCHORED (all 425) | index.json | HONEST |

## Top 20 Assets by Supply (USD)

| # | Symbol | Name | Supply | Priority Score | Measurement |
|---|--------|------|--------|----------------|-------------|
| 1 | USDT | Tether | $183.5B | 1,954 | UNMEASURED |
| 2 | USDC | USD Coin | $74.2B | 2,072 | UNMEASURED |
| 3 | USDS | Sky Dollar | $6.6B | 355 | UNMEASURED |
| 4 | DAI | Dai | $4.8B | 753 | UNMEASURED |
| 5 | USDe | Ethena USDe | $4.5B | 570 | UNMEASURED |
| 6 | USD1 | World Liberty Financial USD | $4.3B | 336 | UNMEASURED |
| 7 | USDG | Global Dollar | $3.2B | 299 | UNMEASURED |
| 8 | PYUSD | PayPal USD | $2.8B | 419 | UNMEASURED |
| 9 | BUIDL | BlackRock USD | $2.8B | 309 | UNMEASURED |
| 10 | USYC | Circle USYC | $2.6B | 246 | UNMEASURED |
| 11 | RLUSD | Ripple USD | $2.4B | 241 | UNMEASURED |
| 12 | USDY | Ondo US Dollar Yield | $2.2B | 377 | UNMEASURED |
| 13 | USDD | USDD | $1.5B | 237 | UNMEASURED |
| 14 | USDGO | USDGO | $1.4B | 203 | UNMEASURED |
| 15 | U | United Stables | $1.3B | 229 | UNMEASURED |
| 16 | USDf | Falcon USD | $1.2B | 205 | UNMEASURED |
| 17 | GHO | GHO | $0.7B | 183 | UNMEASURED |
| 18 | USD0 | Usual USD | $0.5B | 173 | UNMEASURED |
| 19 | USDTB | Ethena USDtb | $0.5B | 172 | UNMEASURED |
| 20 | YLDS | YLDS | $0.5B | 171 | UNMEASURED |

## Measurement State Summary

| State | Count | % |
|-------|-------|---|
| UNMEASURED | 425 | 100% |
| INDEXED | 425 | 100% |
| UNANCHORED | 425 | 100% |

**Honest statement:** All 425 assets are INDEXED from DefiLlama. Zero have been deeply measured. The20-item deep measurement queue from readiness.json represents prioritized candidates, not completed measurements.

## Deep Measurement Prioritization (supply × chain risk × attestation gaps)

Priority is computed from: circulating USD, chain deployment count, evidence state, and anchor state. The top5 candidates for deep measurement are:

| Priority | Asset | Supply | Chains | Rationale |
|----------|-------|--------|--------|-----------|
| 1 | USDC | $74.2B | 155 | Highest priority score (2,072). Circle attestation API available. Multi-chain. |
| 2 | USDT | $183.5B | 130 | Largest supply. Tether attestation page. Highest systemic risk. |
| 3 | DAI | $4.8B | 49 | Crypto-backed, MakerDAO on-chain proof. Moderate supply, high chain count. |
| 4 | USDe | $4.5B | 31 | Ethena protocol, growing fast. On-chain reserve verification possible. |
| 5 | RLUSD | $2.4B | 2 | Ripple USD on XRPL + Ethereum. XRPL trust line verification available. |

## XRPL Instruments (17 cards)

| Card | Location | State |
|------|----------|-------|
| RLUSD | public/interop/cards/xrpl/xrpl-asset-state-rlusd.json | COUNTED |
| EUR.BS | public/interop/cards/xrpl/xrpl-asset-state-eur-bs.json | COUNTED |
| USDQ | public/interop/cards/xrpl/xrpl-asset-state-usdq.json | COUNTED |
| EURQ | public/interop/cards/xrpl/xrpl-asset-state-eurq.json | COUNTED |
| EURCV | public/interop/cards/xrpl/xrpl-asset-state-eurcv.json | COUNTED |
| USDC | public/interop/cards/xrpl/xrpl-asset-state-usdc.json | COUNTED |
| USDB | public/interop/cards/xrpl/xrpl-asset-state-usdb.json | COUNTED |
| USD-GH | public/interop/cards/xrpl/xrpl-asset-state-usd-gh.json | COUNTED |
| BBRL | public/interop/cards/xrpl/xrpl-asset-state-bbrl.json | COUNTED |
| EUR-GH | public/interop/cards/xrpl/xrpl-asset-state-eur-gh.json | COUNTED |
| GBP-GH | public/interop/cards/xrpl/xrpl-asset-state-gbp-gh.json | COUNTED |
| EUR-P | public/interop/cards/xrpl/xrpl-asset-state-eur-p.json | COUNTED |
| OUSG | public/interop/cards/xrpl/xrpl-asset-state-ousg.json | COUNTED |
| +4 more | public/interop/cards/xrpl/ | COUNTED |

## SWIFT Census

- Location: `public/interop/swift-census-2026-09/`
- State: CATALOGUED
- 26-institution census prepared

## ISO 20022

- Location: `public/interop/iso-20022.json`
- State: CATALOGUED

## What This Does NOT Claim

1. **NOT "425 measured"** — 425 INDEXED, 0 deeply measured
2. **NOT "fully cross-chain verified"** — Chain deployments are listed, not independently verified
3. **NOT "proof of reserves"** — No asset has a verified proof-of-reserves attestation
4. **NOT "compliant"** — Regulatory references are informational, not compliance certifications

## Remaining Blockers

1. Deep measurement requires on-chain RPC access for each asset/chain pair
2. RLUSD (XRPL) needs XRPL node access for trust-line verification
3. USDC/USDT need attestation API integration
4. Compute budget for 425 assets × 211 chains = ~89,675 verification calls
5. All assets remain UNANCHORED (no Base EAS or XRPL memo anchors)
