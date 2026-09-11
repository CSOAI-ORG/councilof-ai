# TUI 2 — Financial Measurement Report
## Branch: `finance/full-spread-20260911`
## Generated: 2026-09-11T12:00Z
## Code revisions: evm-reader-0.1.1, xrpl-reader-0.1.1, stellar-reader-0.1.1, cross-chain-reader-0.1.0

---

## Classification

**425 assets, ~1,640 asset-chain entries, 211 chains = INDEXED.**
Source: DefiLlama stablecoins API snapshot 2026-09-11.

**15 contracts deep-measured across 3 chains (Ethereum, Base, Arbitrum) + 1 tokenized fund.**
Deep measurement covers a subset only. INDEXED ≠ MEASURED.

**Correction link for all records:** https://github.com/CSOAI-ORG/sovos-harness/issues/new?title=TUI2-correction

---

## Deep Measurement: EVM (Ethereum mainnet, block 25,953,883)

11 of 13 contracts measured via `totalSupply()`. RPC: `ethereum-rpc.publicnode.com` with failover.

| # | Symbol | Contract | Supply | % of Total | Raw Hash | State |
|---|--------|----------|--------|------------|----------|-------|
| 1 | USDT | `0xdAC1...ec7` | $88.31B | 48.1% | `sha256:8a3d4ea0...` | DEEP_MEASURED |
| 2 | USDC | `0xA0b8...B48` | $50.65B | 68.3% | `sha256:8341ba1e...` | DEEP_MEASURED |
| 3 | USDS | `0xdC03...84F` | $6.62B | 100% | `sha256:154420f1...` | DEEP_MEASURED |
| 4 | DAI | `0x6B17...d0F` | $4.59B | 96.2% | `sha256:28aaa9be...` | DEEP_MEASURED |
| 5 | USDe | `0x4c9E...8B3` | $4.60B | 100% | `sha256:92b93804...` | DEEP_MEASURED |
| 6 | crvUSD | `0xf939...b4E` | $2.10B | 100% | `sha256:571fff69...` | DEEP_MEASURED |
| 7 | PYUSD | `0x6c3e...0e8` | $1.71B | 62.0% | `sha256:131839ba...` | DEEP_MEASURED |
| 8 | RLUSD | `0x8292...7eD` | $1.37B | 57.2% | `sha256:d922f583...` | DEEP_MEASURED |
| 9 | GHO | `0x40D1...C2f` | $699.00M | 100% | `sha256:a9940aaa...` | DEEP_MEASURED |
| 10 | FRAX | `0x853d...99e` | $219.32M | 100% | `sha256:abf87dda...` | DEEP_MEASURED |
| 11 | USDD | `0x0C10...5c6` | $124.15M | 8.2% | `sha256:8358b5ac...` | DEEP_MEASURED |

**Failed (contracts return 0x — may have migrated):**
| Symbol | Contract | Error | State |
|--------|----------|-------|-------|
| FDUSD | `0xc5f0...D68` | Empty return | MEASUREMENT_FAILED |
| DOLA | `0x8653...71d` | Empty return | MEASUREMENT_FAILED |

---

## Deep Measurement: Cross-Chain (Base + Arbitrum)

| # | Symbol | Chain | Contract | Supply | Raw Hash | State |
|---|--------|-------|----------|--------|----------|-------|
| 12 | USDC | Base | `0x8335...2913` | $4.25B | `sha256:<evm-reader>` | DEEP_MEASURED |
| 13 | USDC | Arbitrum | `0xaf88...5831` | $2.72B | `sha256:<evm-reader>` | DEEP_MEASURED |
| 14 | USDT | Arbitrum | `0xFd08...bb9` | $807.39M | `sha256:<evm-reader>` | DEEP_MEASURED |

---

## Deep Measurement: Tokenized Funds

| # | Symbol | Chain | Label | Supply | State |
|---|--------|-------|-------|--------|-------|
| 15 | USDY | Ethereum | Ondo USDY | $1.03B | DEEP_MEASURED |

**Not measurable via totalSupply() (non-standard interface):**
| Symbol | Label | Error | State |
|--------|-------|-------|-------|
| BUIDL | BlackRock BUIDL | Empty return — security token | MEASUREMENT_FAILED |
| USDG | Global Dollar | Empty return — non-standard | MEASUREMENT_FAILED |
| USD1 | World Liberty Financial | Empty return — non-standard | MEASUREMENT_FAILED |

---

## RLUSD Cross-Chain Status

| Chain | Supply | Method | State |
|-------|--------|--------|-------|
| Ethereum | $1.37B | `totalSupply()` @ block 25,953,883 | DEEP_MEASURED |
| XRPL | $0 | `account_lines` — trust lines exist, all zero balance | NO_ISSUED_SUPPLY |
| Base | — | No contract found at ETH address on Base | NOT_DEPLOYED |

**DefiLlama reports:** $2.40B total ($1.37B Ethereum + $1.03B XRPL). Our XRPL measurement contradicts the $1.03B figure. DefiLlama's XRPL source is unverified.

---

## XRPL Measurement (ledger 106,911,542)

| Symbol | Issuer | Supply | Holders | State |
|--------|--------|--------|---------|-------|
| RLUSD | `rHb9C...wdtyTh` | $0 | 0 | NO_ISSUED_SUPPLY |
| USD (legacy) | `rHb9C...wdtyTh` | $1.00B | 6 | DEEP_MEASURED |

---

## Stellar Measurement (ledger 64,377,572)

| Symbol | Issuer | Holders | State |
|--------|--------|---------|-------|
| USDC | Circle | 0 | NO_HOLDERS_FOUND |
| EURC | Circle | 0 | NO_HOLDERS_FOUND |
| USBDC | (unknown) | — | UNMEASURED |

---

## DefiLlama Cross-Reference (Top 20)

| # | Symbol | Circulating | Chains | Our Meas. | Coverage |
|---|--------|------------|--------|-----------|----------|
| 1 | USDT | $183.46B | 130 | $88.31B ETH + $807M ARB | Partial (2/130 chains) |
| 2 | USDC | $74.17B | 155 | $50.65B ETH + $4.25B Base + $2.72B ARB | Partial (3/155) |
| 3 | USDS | $6.62B | 7 | $6.62B ETH | Exact (ETH 100%) |
| 4 | DAI | $4.77B | 49 | $4.59B ETH | ETH ~96% |
| 5 | USDe | $4.60B | 31 | $4.60B ETH | Exact (ETH 100%) |
| 6 | USD1 | $4.29B | 8 | — | INDEXED only |
| 7 | USDG | $3.24B | 6 | — | INDEXED only |
| 8 | PYUSD | $2.76B | 19 | $1.71B ETH | ETH ~62% |
| 9 | BUIDL | $2.76B | 8 | — | INDEXED (security token) |
| 10 | USYC | $2.60B | 2 | — | INDEXED only |
| 11 | RLUSD | $2.40B | 2 | $1.37B ETH | ETH ~57% |
| 12 | USDY | $2.22B | 16 | $1.03B ETH | ETH ~46% |
| 13 | USDD | $1.51B | 4 | $124.15M ETH | ETH ~8% |
| 14 | USDGO | $1.38B | 1 | — | INDEXED only |
| 15 | U | $1.28B | 4 | — | INDEXED only |
| 16 | USDf | $1.18B | 2 | — | INDEXED only |
| 17 | GHO | $0.70B | 2 | $699.00M ETH | Exact |
| 18 | USD0 | $0.55B | 2 | — | INDEXED only |
| 19 | USDTB | $0.53B | 2 | — | INDEXED only |
| 20 | YLDS | $0.53B | 2 | — | INDEXED only |

---

## SWIFT Cohort (26)

| Status | Count |
|--------|-------|
| LIVE | 3 (HSBC, Standard Chartered, UOB) |
| COMMITTED | 9 |
| DISCOVERED | 14 |
| MEASURED | 0 |

---

## ISO 20022 Families (7)

25 message types identified. Zero implemented.

---

## Attestation Gaps

| Coin | Supply | Gap | Severity |
|------|--------|-----|----------|
| USDT | $183.5B | KPMG audit announced Aug 2026, text unpublished | HIGH |
| USDe | $4.6B | Custodian attestations ~3 months stale | MEDIUM |
| USD1 | $4.3B | Crowe monthly after 6-month publication lapse | MEDIUM |
| USDV | $100M | Zero published attestation ever | HIGH |

---

## Corrections from Prior Report

1. **XRPL RLUSD:** Prior "$1.03B, 41,200 holders" → corrected to "$0, 0 holders." Legacy USD IOUs were confused with RLUSD.
2. **Deep measurement count:** Prior 17 → corrected to 15 (FDUSD/DOLA failed; cross-chain adds4).
3. **Tokenized funds:** BUIDL/USDG/USD1 cannot be measured via standard totalSupply(). Only USDY works.

---

## Honest Statement

425 stablecoins indexed across 211 chains ($310.8B total). 15 deep-measured across Ethereum (11), Base (1), Arbitrum (2), and 1 tokenized fund (USDY). XRPL: RLUSD shows zero active supply; legacy USD gateway $1.00B. Stellar: no holders found. Deep measurement incomplete. INDEXED ≠ MEASURED.

---

## Files Produced

| File | Description |
|------|-------------|
| `readers/evm-reader.mjs` | Reproducible EVM totalSupply() reader |
| `readers/xrpl-reader.mjs` | Reproducible XRPL account_lines reader |
| `readers/stellar-reader.mjs` | Reproducible Stellar Horizon reader |
| `finance/evm-measurement-2026-09-11.json` | 11 Ethereum measurements |
| `finance/xrpl-measurement-2026-09-11.json` | XRPL measurements |
| `finance/stellar-measurement-2026-09-11.json` | Stellar measurements |
| `finance/cross-chain-measurement-2026-09-11.json` | 6 cross-chain + tokenized fund attempts |
| `finance/defillama-index-snapshot-2026-09-11.json` | DefiLlama top-20 |

---

## Blockers

1. **Signing key** — card production (TUI 5)
2. **Root ceremony** — Merkle inclusion
3. **RunPod GPU** — broader measurement
4. **Owner approval** — Base EAS ($0.01), XRPL memo ($0.00001)
5. **OTS Bitcoin confirmation** — submitted, awaiting
6. **BUIDL/USDG/USD1** — non-standard token interfaces; need ABI-specific calls
7. **Stellar Horizon API** — format change; no holders returned
8. **XRPL RLUSD** — DefiLlama reports $1.03B but ledger shows $0

---

*TUI 2 — Financial Measurement | Branch: finance/full-spread-20260911*
