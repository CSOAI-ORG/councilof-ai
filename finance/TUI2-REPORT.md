# TUI-2 v2: Financial Coverage Machine — Rebuild Report

**Date:** 2026-10-07  
**Branch:** `finance/full-spread-20260911`  
**Commit:** Oct 7 rebuild (honest state correction)

---

## Current Financial Coverage State

### Stablecoin Universe

| Metric | Count | Source |
|--------|-------|--------|
| **Indexed assets** | 425 | `public/interop/stablecoin-universe-2026-09/index.json` |
| **Deep-measured assets** | 6 | On-chain reader outputs (EVM batch + XRPL + Stellar) |
| **Chains covered** | 211 | DeFi Llama stablecoin index |
| **Chain deployments** | 1,640 | DeFi Llama stablecoin index |
| **Circulating USD (indexed)** | ~$310.8B | Sum of upstream `circulating_usd` fields (index observation, not deep measurement) |

**Critical distinction:** 425 assets are **indexed** (catalogued from DeFi Llama with priority scoring). Only 6 have been **deep-measured** via on-chain readers that produce signed, replayable evidence. These are not the same number and must never be conflated.

### Deep-Measured Assets (6 total, 3 chains)

| Asset | Chain | Reader | Supply | Queried |
|-------|-------|--------|--------|---------|
| USDC | Ethereum (EVM) | `evm-erc20-reader.mjs@1.0.0` | 50,638,314,395.92 | 2026-09-11T13:00:56Z |
| USDT | Ethereum (EVM) | `evm-erc20-reader.mjs@1.0.0` | 88,306,028,997.33 | 2026-09-11T13:00:56Z |
| DAI | Ethereum (EVM) | `evm-erc20-reader.mjs@1.0.0` | 4,595,327,079.70 | 2026-09-11T13:00:57Z |
| RLUSD | XRPL | `xrpl-trustline-reader.mjs@1.0.0` | 60,496,192.87 | 2026-09-11T12:45:32Z |
| USDC (Stellar) | Stellar | `stellar-asset-reader.mjs@1.0.0` | 421,769,351,032.54 (authorized) | 2026-09-11T13:04:20Z |
| GateHub | XRPL | Attestation probe only | UNCHECKABLE | 2026-09-02 |

### Coverage Register

| Chain | Instruments Indexed | Measured | Declared/Not-Located |
|-------|-------------------|----------|---------------------|
| **XRPL** | 16 | 6 | 10 |
| **EVM/EAS** | 2 | 3 (contracts) | — |
| **Total** | 18 | 6 | 10 |

### Stablecoin Attestation Pack (`stablecoin-attestation-2026-09`)

9 attestation cards probed against GENIUS Act §4(a)(3) and MiCA Art 54:

| Issuer | Tokens | Status | Cadence | Examiner |
|--------|--------|--------|---------|----------|
| Ripple (RLUSD) | RLUSD | PROBED | monthly | Deloitte |
| Circle | USDC, EURC | PROBED | monthly | Deloitte & Touche |
| Ondo Finance | OUSG | PROBED | daily (3rd-party admin) | linked attestation reports |
| Braza | USDB, BBRL | PROBED | monthly | Big Four (underway) |
| SG-FORGE | EURCV | PROBED | daily | not named |
| Quantoz | EURQ, USDQ | PROBED | continuous dashboard | not named |
| GateHub | USD.gh, EUR.gh | UNCHECKABLE | — | — |
| Schuman Financial | EURØP | PROBED | quarterly | KPMG |
| Republic of Palau | PSC | UNCHECKABLE | — | — |

---

## What Each Surface Needs

### 1. Stablecoin Universe (indexed → deep-measured)
- **Gap:** 419 of 425 assets have no deep measurement
- **Next:** Run on-chain readers against the top-20 deep measurement queue: USDT, USDC, USDS, DAI, USDe, USD1, USDG, PYUSD, BUIDL, USYC, RLUSD, USDY, USDD, USDGO, U, USDf, GHO, USD0, USDTB, YLDS
- **Blocker:** Reader infrastructure exists (EVM, XRPL, Stellar) but needs execution at scale

### 2. Coverage Register (18 indexed → more measured)
- **Gap:** 10 XRPL instruments declared but not located
- **Next:** Locate public addresses for Aviva, DCP, EURCV, JMWH and run XRPL reader
- **Blocker:** Some issuers don't publish on-chain addresses publicly

### 3. Attestation Pack (9 cards, all unsigned)
- **Gap:** GateHub and Palau PSC are UNCHECKABLE
- **Next:** Re-probe GateHub (SPA shell issue) and Palau (captcha); sign verified cards
- **Blocker:** GateHub renders attestation text client-side only; Palau gov site behind captcha

### 4. Deep Measurement Queue
- **Queue:** 20 assets prioritized by `priority_score` (circulating USD × chain count)
- **Status:** All 20 are UNMEASURED and UNROOTED
- **Next:** Execute readers, produce signed measurement capsules, anchor to public root

---

## Blockers

| Blocker | Severity | Status |
|---------|----------|--------|
| Deep measurement incomplete (6/425) | HIGH | 419 assets need reader execution |
| Zenodo DOI blocked since Sep 29 | HIGH | Cannot mint DOI for frozen provisions |
| Base EAS anchoring | MEDIUM | NOT_YET — attestation pipeline not wired |
| XRPL memo anchoring | MEDIUM | NOT_YET — memo pipeline not wired |
| OTS Bitcoin confirmation | LOW | STAMPED_PENDING_BITCOIN (not confirmed) |
| GateHub/Palau UNCHECKABLE | LOW | SPA rendering + captcha barriers |

---

## Integrity Invariants

- Never claim 425 deep measurements — only 6 deep-measured
- Never convert INDEXED into MEASURED
- Never describe OTS as Bitcoin-confirmed — it is STAMPED_PENDING_BITCOIN
- Never count internal purchases as customer revenue
- Indexed circulating USD is an upstream observation, not a CSOAI measurement