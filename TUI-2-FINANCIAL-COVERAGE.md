# TUI-2 — Financial Coverage Machine Report

**Branch:** `tui2/stablecoin-lane-2026-09-12`
**Generated:** 2026-09-12T12:25:00Z (figures from tui2-measurements/tui2-cohort-2026-09-12.json)
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
| Deeply measured (signed+rooted) | 1 (RLUSD) | readiness.json / public root | VERIFIED |
| Deep readings 2026-09-12 (unsigned, staged) | 11 subjects / 21 chain readings | tui2-measurements/tui2-cohort-2026-09-12.json | VERIFIED |
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
| INDEXED | 425 | 100% |
| UNMEASURED (frozen index rows) | 425 | 100% |
| Deep reading 2026-09-12, unsigned staged | 11 | 2.6% |
| Signed + in current root | 1 (RLUSD) | 0.2% |
| UNANCHORED (asset measurements) | 425 | 100% |

**Honest statement:** All 425 assets are INDEXED from DefiLlama; the frozen 2026-09-11 index rows all say UNMEASURED because the index froze at discovery time (CONTRAD-001 resolved: live per-subject states live in `public/interop/coverage-register.json`). On 2026-09-12 the priority cohort (RLUSD, USDT, USDC, USDS, DAI, USDe, USD1, EURCV, USDV, PYUSD, FDUSD) received direct on-chain supply readings — 21 subject×chain records, EVM `symbol()`/`decimals()` verified, XRPL `gateway_balances`, Stellar Horizon — staged as unsigned card-v0 atoms in `public/interop/stablecoin-cohort-2026-09/`. Signed stays 1 until GHA signs post-merge.

## 2026-09-12 Cohort Readings (keyless, £0)

| Subject | Chain | Reading | Block/Ledger | Observed (UTC) |
|---------|-------|---------|--------------|----------------|
| USDT | Ethereum | 88,305,985,017.33 totalSupply | 25961213 | 12:04 |
| USDC | Ethereum | 50,409,552,504.83 | 25961213 | 12:04 |
| USDC | Base | 4,274,546,563.04 | 51212670 | 12:04 |
| USDC | XRPL | 4,394,436.35 obligations | 106934560 | 12:06 |
| USDC | Stellar | 309,692,310.10 authorized | 64393517 | 12:14 |
| USDS | Ethereum | 6,671,571,131.26 | 25961213 | 12:04 |
| USDS | Base | 2,644,564.07 | 51212701 | 12:06 |
| DAI | Ethereum | 4,576,925,215.88 | 25961213 | 12:04 |
| USDe | Ethereum | 4,601,019,096.38 | 25961213 | 12:04 |
| USDe | Base | 352,210,381.03 | 51212709 | 12:06 |
| USD1 | Ethereum | 1,572,859,958.77 | 25961214 | 12:04 |
| PYUSD | Ethereum | 1,722,317,126.71 | 25961214 | 12:04 |
| PYUSD | Stellar | 3,148,554.57 authorized | 64393517 | 12:14 |
| FDUSD | Ethereum | 219,667,267.10 | 25961214 | 12:04 |
| EURCV | Ethereum | 137,618,715.41 | 25961214 | 12:04 |
| EURCV | XRPL | 10,000,000 obligations | 106934560 | 12:06 |
| EURCV | Stellar | 15,030,600 authorized | 64393517 | 12:14 |
| USDV (Verified USD, id 143) | Ethereum | 153,080.26 | 25961214 | 12:04 |
| USDV (Valtorum, id 398) | XRPL | 76,771,000.00 obligations | 106934578 | 12:07 |
| RLUSD | Ethereum | 1,369,732,627.86 | 25961208 | 12:03 |
| RLUSD | XRPL | 1,053,014,745.15 obligations | 106934514 | 12:03 |

RLUSD same-session frame (both chains seconds apart, 12:03Z): `docs/tui2/rlusd-sametime-frame-2026-09-12.json`. The XRPL paged `account_lines` sum (60.49M) disagrees with `gateway_balances` obligations (1,053.01M, three endpoints agree) — public-cluster pagination silently truncates; both readings are preserved in the frame file.

Endpoint honesty: `eth.llamarpc.com` (the EVM reader's compiled-in default) returned HTTP 525 at observation time; Ethereum readings used `ethereum-rpc.publicnode.com` via the reader's new `EVM_RPC_ETHEREUM` override, with the substitution and the 525 probe recorded inside each record.

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

1. **NOT "425 measured"** — 425 INDEXED, 12 with deep on-chain readings (1 signed+rooted, 11 unsigned-staged), 413 UNMEASURED
2. **NOT "fully cross-chain verified"** — Chain deployments are listed, not independently verified
3. **NOT "proof of reserves"** — No asset has a verified proof-of-reserves attestation
4. **NOT "compliant"** — Regulatory references are informational, not compliance certifications

## Remaining Blockers

1. Deep measurement requires on-chain RPC access for each asset/chain pair
2. RLUSD (XRPL) needs XRPL node access for trust-line verification
3. USDC/USDT need attestation API integration
4. Compute budget for 425 assets × 211 chains = ~89,675 verification calls
5. All assets remain UNANCHORED (no Base EAS or XRPL memo anchors)
