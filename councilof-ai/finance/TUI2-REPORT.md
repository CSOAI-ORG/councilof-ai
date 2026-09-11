# TUI 2 — Financial Measurement Report
## Branch: `finance/full-spread-20260911`
## Generated: 2026-09-11T11:35Z
## Code revision: evm-reader-0.1.1, xrpl-reader-0.1.1, stellar-reader-0.1.1

---

## Classification

**425 assets, ~1,640 asset-chain entries, 211 chains = INDEXED.**
Source: DefiLlama stablecoins API snapshot 2026-09-11.

Deep measurement covers a subset only. INDEXED ≠ MEASURED.

---

## Deep Measurement: EVM (Ethereum mainnet)

11 of 13 contracts measured via `totalSupply()` at block **25,953,883** (2026-09-11T11:32Z).
RPC: `ethereum-rpc.publicnode.com` with4-endpoint failover.

| # | Symbol | Contract | Supply (ETH) | Supply Display | % of Total | State |
|---|--------|----------|-------------|----------------|------------|-------|
| 1 | USDT | `0xdAC17F958D2...ec7` | 88,306,028,997 | $88.31B | 48.1% | DEEP_MEASURED |
| 2 | USDC | `0xA0b86991c62...B48` | 50,653,995,950 | $50.65B | 68.3% | DEEP_MEASURED |
| 3 | USDS | `0xdC035D45d97...84F` | 6,617,397,971 | $6.62B | 100% | DEEP_MEASURED |
| 4 | DAI | `0x6B175474E89...d0F` | 4,585,771,782 | $4.59B | 96.2% | DEEP_MEASURED |
| 5 | USDe | `0x4c9EDD5852c...8B3` | 4,601,732,685 | $4.60B | 100% | DEEP_MEASURED |
| 6 | crvUSD | `0xf939E0A03FB...b4E` | 2,104,809,205 | $2.10B | 100% | DEEP_MEASURED |
| 7 | PYUSD | `0x6c3ea903640...0e8` | 1,710,484,566 | $1.71B | 62.0% | DEEP_MEASURED |
| 8 | RLUSD | `0x8292Bb45bf1...7eD` | 1,373,732,628 | $1.37B | 57.2% | DEEP_MEASURED |
| 9 | GHO | `0x40D16FC0246...C2f` | 699,000,000 | $699.00M | 100% | DEEP_MEASURED |
| 10 | FRAX | `0x853d955aCEf...99e` | 219,320,046 | $219.32M | 100% | DEEP_MEASURED |
| 11 | USDD | `0x0C10bF8FcB7...5c6` | 124,146,228 | $124.15M | 8.2% | DEEP_MEASURED |

**Failed:**
| Symbol | Contract | Error | State |
|--------|----------|-------|-------|
| FDUSD | `0xc5f0f7b66764...D68` | `0x` return (contract may have migrated/been paused) | MEASUREMENT_FAILED |
| DOLA | `0x865377367054...71d` | `0x` return (contract may have migrated/been paused) | MEASUREMENT_FAILED |

**Key: these are Ethereum-only totals.** USDT total supply is $183.5B across 130 chains; $88.3B is the Ethereum slice.

---

## Deep Measurement: XRPL

Queried `xrplcluster.com` validated ledger **106,911,542** (2026-09-11T11:32Z).

| Symbol | Issuer | Supply | Holders | State |
|--------|--------|--------|---------|-------|
| RLUSD | `rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh` | $0 | 0 | NO_ISSUED_SUPPLY |
| USD (gateway) | `rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh` | $1.00B | 6 | DEEP_MEASURED |

**Correction from prior report:** The prior report claimed "$1.03B RLUSD, 41,200 holders" on XRPL. This was incorrect.
- RLUSD trust lines exist (6 lines) but all show zero balance on the issuer side.
- The $1.00B figure is for legacy USD IOUs, not RLUSD.
- RLUSD's $2.40B total supply (per DefiLlama) is concentrated on Ethereum ($1.37B measured) and possibly Base.
- XRPL RLUSD supply could not be verified via `account_lines`.

---

## Deep Measurement: Stellar

Queried Stellar Horizon (ledger **64,377,572**, 2026-09-11T11:32Z).

| Symbol | Issuer | Holders | State |
|--------|--------|---------|-------|
| USDC | `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3THOJXX4ER6K2MFIRPA` | 0 | NO_HOLDERS_FOUND |
| EURC | `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3THOJXX4ER6K2MFIRPA` | 0 | NO_HOLDERS_FOUND |
| USBDC | (unknown) | — | UNMEASURED |

**Note:** Horizon `/accounts?asset=CODE:ISSUER` returned no results for Circle's Stellar issuer. The API format may have changed, or Circle's Stellar accounts use a different mechanism. USBDC remains UNMEASURED until issuer account independently identified.

---

## DefiLlama Cross-Reference (Top 20 by circulating supply)

| # | Symbol | Circulating | Chains | Our ETH Meas. | Match? |
|---|--------|------------|--------|---------------|--------|
| 1 | USDT | $183.46B | 130 | $88.31B | ✓ (ETH subset) |
| 2 | USDC | $74.17B | 155 | $50.65B | ✓ (ETH subset) |
| 3 | USDS | $6.62B | 7 | $6.62B | ✓ (exact) |
| 4 | DAI | $4.77B | 49 | $4.59B | ✓ (ETH ~96%) |
| 5 | USDe | $4.60B | 31 | $4.60B | ✓ (exact) |
| 6 | USD1 | $4.29B | 8 | — | INDEXED only |
| 7 | USDG | $3.24B | 6 | — | INDEXED only |
| 8 | PYUSD | $2.76B | 19 | $1.71B | ✓ (ETH ~62%) |
| 9 | BUIDL | $2.76B | 8 | — | INDEXED only (tokenized fund) |
| 10 | USYC | $2.60B | 2 | — | INDEXED only (tokenized fund) |
| 11 | RLUSD | $2.40B | 2 | $1.37B | ✓ (ETH ~57%) |
| 12 | USDY | $2.22B | 16 | — | INDEXED only |
| 13 | USDD | $1.51B | 4 | $124.15M | ✓ (ETH ~8%) |
| 14 | USDGO | $1.38B | 1 | — | INDEXED only |
| 15 | U | $1.28B | 4 | — | INDEXED only |
| 16 | USDf | $1.18B | 2 | — | INDEXED only |
| 17 | GHO | $0.70B | 2 | $699.00M | ✓ (exact) |
| 18 | USD0 | $0.55B | 2 | — | INDEXED only |
| 19 | USDTB | $0.53B | 2 | — | INDEXED only |
| 20 | YLDS | $0.53B | 2 | — | INDEXED only |

---

## RLUSD Cross-Chain Deep Measurement

RLUSD is deployed on Ethereum and possibly Base/XRPL per DefiLlama (2 chains, $2.40B total).

| Chain | Supply | Measurement State | Source |
|-------|--------|-------------------|--------|
| Ethereum | $1.37B | DEEP_MEASURED | `totalSupply()` @ block 25,953,883 |
| Base | unknown | INDEXED only | DefiLlama reports Base deployment; reader needs Base RPC test |
| XRPL | $0 | NO_ISSUED_SUPPLY | `account_lines` shows zero balances |

**Remaining RLUSD work:** Test Base `totalSupply()` for the RLUSD contract. The DefiLlama-reported $2.40B minus $1.37B Ethereum = ~$1.03B presumably on Base or other chains.

---

## Tokenized Funds (4)

| Fund | AUM (DefiLlama) | Chains | Deep Measured | State |
|------|-----------------|--------|---------------|-------|
| BlackRock BUIDL | $2.76B | 8 | No | INDEXED |
| Circle USYC | $2.60B | 2 | No | INDEXED |
| Ondo USDY | $2.22B | 16 | No | INDEXED |
| Franklin Templeton BENJI | (not in DefiLlama top) | 7 | No | INDEXED |

Zero tokenized funds deep-measured. NAV/custody data required per fund.

---

## SWIFT Cohort (26)

| Status | Count |
|--------|-------|
| LIVE | 3 (HSBC, Standard Chartered, UOB) |
| COMMITTED | 9 (JPMorgan, Deutsche Bank, Natwest, +6) |
| DISCOVERED | 14 (Citi, BNY, BNP Paribas, ANZ, +10) |
| MEASURED | 0 |

Settlement still off-chain. SWIFT migration deadline passed (Mar 2025).

---

## ISO 20022 Families (7)

25 message types across 7 families (pacs, pain, camt, sese, seev, reda, auth). Zero implemented.

---

## Chain Distribution (Top 15)

| Chain | Assets Indexed |
|-------|---------------|
| Ethereum | 234 |
| Arbitrum | 84 |
| BSC | 84 |
| Base | 81 |
| Solana | 71 |
| Polygon | 85 |
| Avalanche | 54 |
| OP Mainnet | 51 |
| Monad | 26 |
| Celo | 24 |
| Gnosis | 21 |
| Fantom | 20 |
| Hyperliquid L1 | 20 |
| Tron | 19 |
| ZKsync Era | 17 |

---

## Attestation Gaps

| Coin | Supply | Gap | Severity |
|------|--------|-----|----------|
| USDT | $183.5B | KPMG audit announced Aug 2026, text unpublished | HIGH |
| USDe | $4.6B | Custodian attestations ~3 months stale | MEDIUM |
| USD1 | $4.3B | Crowe monthly after 6-month publication lapse | MEDIUM |
| USDV | $100M | Zero published attestation ever | HIGH |
| USDC | $74.2B | Deloitte monthly + daily BlackRock CUSIP filings | LOW |
| RLUSD | $2.4B | Deep measured on Ethereum; XRPL/other chains unmeasured | MEDIUM |

---

## Corrections from Prior Report

1. **XRPL RLUSD:** Prior report claimed "$1.03B, 41,200 holders." Corrected to "$0, 0 holders" — RLUSD trust lines exist but show zero balance. The $1.00B figure was legacy USD IOUs, not RLUSD.
2. **Total chains:** Prior report listed 177 chains with supply. DefiLlama data confirms 211 chains listed (177 with active supply).
3. **Deep measurement count:** Prior report claimed17. Corrected to 11 (FDUSD and DOLA failed; prior count may have included additional chains not measured here).
4. **FDUSD/DOLA:** Contract `totalSupply()` returns `0x` (empty). Contracts may have been migrated, paused, or upgraded. Not counted as measured.

---

## Honest Statement

425 stablecoins indexed across 211 chains ($310.8B total, DefiLlama). 11 deeply measured on Ethereum via `totalSupply()` at block 25,953,883. XRPL: 1 instrument measured ($1.00B legacy USD), RLUSD XRPL shows zero active supply. Stellar: no holders found for Circle USDC/EURC; USBDC unmeasured. 4 tokenized funds catalogued ($8.3B+ AUM), zero deep-measured. SWIFT: 26 institutions censused, zero deep-measured. ISO 20022: 25 message types identified, zero implemented. Deep measurement incomplete. INDEXED ≠ MEASURED.

---

## Blockers

1. **Signing key** — needed for card production (TUI 5 territory)
2. **Root ceremony** — needed for Merkle inclusion
3. **RunPod GPU** — needed for broader measurement harness
4. **Owner approval** — Base EAS (~$0.01) and XRPL memo (~$0.00001) anchoring
5. **OTS Bitcoin confirmation** — submitted, awaiting
6. **FDUSD/DOLA contracts** — need investigation (possibly migrated)
7. **Stellar Horizon API** — `/accounts?asset=` returns empty; format may have changed
8. **Base RPC** — RLUSD Base deployment not yet measured

## Files Produced

| File | Description |
|------|-------------|
| `readers/evm-reader.mjs` | Reproducible EVM totalSupply() reader |
| `readers/xrpl-reader.mjs` | Reproducible XRPL account_lines reader |
| `readers/stellar-reader.mjs` | Reproducible Stellar Horizon reader |
| `finance/evm-measurement-2026-09-11.json` | 11 Ethereum deep measurements |
| `finance/xrpl-measurement-2026-09-11.json` | XRPL measurement (1 measured, 1 no supply) |
| `finance/stellar-measurement-2026-09-11.json` | Stellar measurement (no holders found) |
| `finance/defillama-index-snapshot-2026-09-11.json` | DefiLlama top-20 snapshot |
| `finance/canonical-asset-graph.json` | Master state (from prior commit) |
| `finance/full-asset-graph.json` | All 425 assets with per-chain supply |
| `finance/TUI2-REPORT.md` | This report |

---

*TUI 2 — Financial Measurement*
*Branch: `finance/full-spread-20260911`*
*SHA-256 of this report: computed at commit time*
