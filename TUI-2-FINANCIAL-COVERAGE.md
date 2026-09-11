# TUI-2 — Financial Coverage Machine Report

**Branch:** `finance/full-spread-20260911`
**Date:** 2026-09-11
**Source:** PR #1896 (merged) — `public/interop/stablecoin-universe-2026-09/`
**Source SHA-256:** `f8f3a1a2c309c570b8ae10c1f890690f9004493e2b57ab50bef9c43e9a8d1d86`
**Observed at:** `2026-09-11T08:19:34.591714+00:00`

---

## 1. Verified Counts

| Metric | Value | Verified |
|--------|-------|----------|
| Indexed assets | **425** | ✅ No duplicate IDs (425 unique) |
| Reported chains | **211** | ✅ Consistent across index.json and readiness.json |
| Chain deployments | **1,640** | ✅ Sum of per-asset deployment counts matches |
| Circulating (USD sum available) | $310.79B | ✅ From upstream `circulating.peggedUSD` fields |

### Peg Type Breakdown

| Peg Type | Count |
|----------|-------|
| peggedUSD | 337 |
| peggedEUR | 26 |
| peggedVAR | 10 |
| peggedGBP | 5 |
| peggedJPY | 5 |
| peggedCAD | 4 |
| peggedCHF | 4 |
| peggedAUD | 4 |
| peggedREAL | 4 |
| Other (18 types) | 26 |

### Peg Mechanism Breakdown

| Mechanism | Count |
|-----------|-------|
| crypto-backed | 252 |
| fiat-backed | 145 |
| algorithmic | 27 |
| crytpo-backed (typo in source) | 1 |

---

## 2. Readiness Truth Rules (verified applied)

All 5 truth rules are correctly enforced across all 425 assets:

1. **INDEXED ≠ MEASURED.** — 425 indexed, 1 deeply measured. No asset claims measurement from indexing alone. ✅
2. **Signed index commitment ≠ asset measurement signature.** — All 425 have `SIGNED_ROOT_INCLUDED_REKOR_WITNESSED_OTS_PENDING_BITCOIN` as index state; none conflate this with asset measurement. ✅
3. **Root inclusion ≠ external-chain anchor.** — 424 have `NO_ASSET_MEASUREMENT_ANCHOR`; only RLUSD has a real anchor state. ✅
4. **OTS pending ≠ Bitcoin timestamp.** — Index commitment correctly labeled `OTS_PENDING_BITCOIN`, not `BITCOIN_TIMESTAMPED`. ✅
5. **Generic protocol door ≠ asset-specific integration.** — All 425 have `GENERIC_CATALOG_ONLY_NO_ASSET_SKILL` for A2A discovery; zero claim asset-specific tools. ✅

---

## 3. Coverage Depth

| State | Count |
|-------|-------|
| Deeply measured assets | **1** (RLUSD, asset ID 250) |
| Unmeasured assets | **424** |
| Asset measurements Bitcoin-anchored via current root | 0 |
| Asset measurements current root included | 1 |
| Asset measurements Rekor-witnessed via root | 1 |
| Asset measurements signed | 1 |
| Asset-specific A2A skills | 0 |
| Asset-specific MCP tools | 0 |
| Asset-specific x402 doors | 0 |
| Asset-specific x402 settlements verified | 0 |

### Deep Measurement Queue

20 priority candidates seeded in `index.json` `deep_measurement_queue` (ordered by circulating value × chain count). Scheduling metadata only — not a risk/quality/compliance score.

---

## 4. Dedup Analysis

### 4a. Wrappers (1)

| ID | Name | Symbol | Note |
|----|------|--------|------|
| 153 | Binance Peg BUSD | BUSD | Binance-pegged version of BUSD on BSC; distinct from native BUSD (ID 4) |

### 4b. Bridges (1)

| ID | Name | Symbol | Note |
|----|------|--------|------|
| 439 | USDBridge | USDB | Cross-chain bridge wrapper |

### 4c. Alias / Symbol Collision Groups (54 groups)

54 symbol strings are shared by 2+ distinct assets. Key collision families:

| Symbol | # Assets | Examples |
|--------|----------|----------|
| USDS | 5 | Sky Dollar, SpiceUSD, Sperax USD, TheStandard USD, Sable Coin |
| FUSD | 5 | Fantom USD, FinChain Dollar, The Fedz FUSD, Fuse Dollar V3, fUSD |
| USDV | 4 | Valtorum USD, Solomon USDv, Verified USD, Delpho USDV |
| CASH | 4 | CASH, Opus CASH, Stabl.fi Cash, Phase Dollar |
| USDU | 4 | Unitas, Universal USD, USDU Finance, Uncap USD |
| USDA | 4 | Avalon USDa, AP USDA, Anzens USDA, Angle USDA |
| BUSD | 3 | Binance Peg BUSD, Binance USD, Bera USD |
| MUSD | 3 | Mezo USD, Metamask USD, mStable USD |
| USDB | 3 | USDBridge, USDB Blast, USD Balance |
| USDH | 3 | USDH Stablecoin, Hermetica USDh, USDH |
| USDR | 4 | Real USD, StablR USD, USDR, Rocky USDr |
| USDX | 3 | Hex Trust USDX, USDX, USDX Money USDX |

These are **not duplicates** — each is a distinct protocol/issuer. The symbol collisions are an upstream DefiLlama characteristic; our index preserves them as-is without merging.

### 4d. Issuer Variant Groups (138 groups, 306 assets)

138 first-word issuer prefixes have >1 asset. Top families:

| Issuer Prefix | # Assets | Assets |
|---------------|----------|--------|
| Mento | 15 | Dollar, Real, GBP, PHP, CAD, AUD, COP, JPY, KES, ZAR, NGN, CHF, XOF, GHS, EUR |
| USD | 5 | USDC, CoinVertible, Somnia, Balance, Stable Colb |
| Frax | 3 | Frax, Frax USD, Frax Price Index |
| Quantoz | 3 | USDQ, EURD, EURQ |
| Parallel | 3 | USDp, USD, Parallel |
| ARYZE | 3 | eUSD, eEUR, eGBP |
| VNX | 3 | Swiss Franc, EURO, British Pound |
| Stable | 3 | Coin, Mint USD, Jack aUSD |
| Tether | 2 | Tether, Tether CNH |
| Ethena | 2 | USDe, USDtb |
| Ondo | 2 | US Dollar Yield, U.S. Dollar Token |
| Multipli | 2 | rwaUSDi, rwaUSD |
| Binance | 2 | Peg BUSD, USD |
| Asymmetry | 2 | USDaf V2, USDaf |

These are **legitimate multi-product issuers**, not dedup candidates.

---

## 5. Adjacent Interop Artifacts

### XRPL Attestation Specimens (9 unsigned cards)

Location: `public/interop/stablecoin-attestation-2026-09/`

| Card | Issuer | Tokens | Status |
|------|--------|--------|--------|
| rlusd-ripple | Ripple / Standard Custody | RLUSD | Unsigned specimen |
| circle-usdc-eurc | Circle | USDC, EURC | Unsigned specimen |
| gatehub | GateHub | — | Unsigned specimen |
| ousg-ondo | Ondo | OUSG | Unsigned specimen |
| palau-psc | Palau | PSC | Unsigned specimen |
| quantoz-eurq-usdq | Quantoz | EURQ, USDQ | Unsigned specimen |
| schuman-europ | Schuman | EUROP | Unsigned specimen |
| sg-forge-eurcv | SG Forge | EURCV | Unsigned specimen |
| braza-usdb-bbrl | Braza | USDB, BBRL | Unsigned specimen |

All 9 are **unsigned specimens** — `sig_ed25519: null` in the index. Not measurement evidence.

### ISO 20022

`public/interop/iso-20022.json` — present, schema `csoai.interop/0.1`, as_of 2026-09-04.

### SWIFT Instruments (3)

| File | Instrument | Priority |
|------|------------|----------|
| swift-mt103.json | Single Customer Credit Transfer | true |
| swift-mt202.json | General Financial Institution Transfer | false |
| swift-mt760.json | Guarantee / Standby LC | false |

### XRPL-SWIFT Coverage Leftover

`public/interop/coverage-xrpl-swift.json` — 6 XRPL issuers probed (RLUSD, OUSG, AAULF, TBILL, USDB, BBRL). Honest state: `measured: false, signed: false`. Live board: 22 axis · 22 measured · 0 unmeasured.

---

## 6. Remaining Gaps

1. **424/425 assets unmeasured.** Only RLUSD has a deep on-chain anchor. The other 424 are index-only observations.
2. **Zero asset-specific A2A skills, MCP tools, or x402 doors.** All 425 assets are cataloged under a generic protocol door — no per-asset integration exists.
3. **Zero Bitcoin-anchored measurements.** The single measured asset (RLUSD) is OTS-pending, not yet Bitcoin-timestamped.
4. **9 unsigned XRPL attestation specimens.** No card carries a signature. Measurement readiness, not measurement evidence.
5. **1 typo in source mechanism:** `crytpo-backed` (1 asset) — upstream DefiLlama data quality issue, preserved as-is.
6. **54 symbol collision groups.** Not a bug (different issuers/protocols), but a known upstream characteristic that complicates tooling lookups.

---

## 7. Honest Sentence

The stablecoin universe indexes 425 assets across 211 chains and 1,640 deployments from a frozen DefiLlama snapshot. One asset (RLUSD) is deeply measured and awaiting Bitcoin anchoring. The remaining 424 are indexed observations — they are cataloged, not measured. No asset has an A2A skill, MCP tool, or x402 door. A generic protocol door is labeled as a generic door; it is never presented as 425 separate integrations.
