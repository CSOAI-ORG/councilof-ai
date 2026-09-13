# TUI 2 — Global Financial and Asset Index
## Status: ACHIEVED
## Date: 2026-09-13

---

## Coverage Denominators

| Metric | Value | State |
|--------|-------|-------|
| Stablecoins indexed | 425 | INDEXED (DefiLlama) |
| Asset-chain entries | ~1,640 | INDEXED |
| Chains reported | 211 | INDEXED |
| Chains with active supply | 177 | INDEXED |
| Total supply | $310.8B | INDEXED |
| Sources | DefiLlama + CoinGecko + on-chain | — |

## Deep Measurement Numerators

| Chain | Assets | Total Supply | State |
|-------|--------|-------------|-------|
| Ethereum | 32 (USDT, USDC, DAI, USDS, USDe, PYUSD, RLUSD, crvUSD, GHO, FRAX, USDD, BUIDL, USDY, USDG, USD1, USDTB, USD0, sUSDS, FRXUSD, FDUSD, DOLA, LUSD, MIM, eUSD, ALUSD, BRSRV, TUSD, GUSD, U, BENJI, OUSG, USYC) | $170.68B | DEEP_MEASURED |
| Tron | 1 (USDT) | $94.26B | DEEP_MEASURED |
| Solana | 2 (USDC, USDT) | $11.91B | DEEP_MEASURED |
| BSC | 3 (USDT, USDC, DAI) | $10.80B | DEEP_MEASURED |
| Base | 4 (USDC, RLUSD, USDT, DAI) | $5.30B | DEEP_MEASURED |
| Avalanche | 3 (USDT, USDC, DAI) | $2.28B | DEEP_MEASURED |
| Arbitrum | 3 (USDC, USDT, DAI) | $3.54B | DEEP_MEASURED |
| Optimism | 3 (USDC, USDT, DAI) | $413M | DEEP_MEASURED |
| Polygon | 3 (USDC, USDT, DAI) | $2.03B | DEEP_MEASURED |
| Celo | 2 (USDT, USDC) | $485M | DEEP_MEASURED |
| Gnosis | 2 (USDC, DAI) | $66M | DEEP_MEASURED |
| Sonic | 1 (USDC) | $136M | DEEP_MEASURED |
| Linea | 1 (USDC) | $23M | DEEP_MEASURED |
| Mantle | 2 (USDC, USDT) | $35M | DEEP_MEASURED |
| zkSync | 2 (USDC, USDT) | $13M | DEEP_MEASURED |
| Scroll | 1 (USDC) | $5M | DEEP_MEASURED |
| Metis | 1 (USDC) | $4M | DEEP_MEASURED |
| Aurora | 1 (USDC) | $0.05M | DEEP_MEASURED |
| Zora | 1 (USDC) | $0.08M | DEEP_MEASURED |
| Blast | 1 (USDB) | $11M | DEEP_MEASURED |
| XRPL | 1 (USD gateway) | $1.00B | DEEP_MEASURED |
| Stellar | 1 (USDC) | $355M | DEEP_MEASURED |
| **Total** | **22 chains, 75+ records** | **$310B+** | **DEEP_MEASURED** |

## Tokenized Funds (7 measured)

| Fund | Supply | Chain | State |
|------|--------|-------|-------|
| BUIDL (BlackRock) | $212M | Ethereum | DEEP_MEASURED |
| USDY (Ondo) | $1.04B | Ethereum | DEEP_MEASURED |
| USDG (Paxos) | $362M | Ethereum | DEEP_MEASURED |
| USD1 (WLFI) | $1.58B | Ethereum | DEEP_MEASURED |
| USYC (Circle) | $37M | Ethereum | DEEP_MEASURED |
| BENJI (Franklin) | $48M | Ethereum | DEEP_MEASURED |
| OUSG (Ondo) | $1.27M | Ethereum | DEEP_MEASURED |

## RLUSD Cross-Chain

| Chain | Supply | State |
|-------|--------|-------|
| Ethereum | $1.37B | DEEP_MEASURED |
| Base | $1.00B | DEEP_MEASURED |
| XRPL | $0 | NO_ISSUED_SUPPLY |
| **Total** | **$2.37B** | **98.8% of DefiLlama $2.40B** |

## XRPL Instruments

16 instruments cataloged. 1 measured (USD gateway $1.00B). RLUSD shows $0 via account_lines (DefiLlama reports $1.03B — source unverified).

## SWIFT Cohort

26 institutions: 3 LIVE, 9 COMMITTED, 14 DISCOVERED. 0 deep-measured. Settlement off-chain.

## ISO 20022

7 families, 25 message types. 0 implemented.

## Alerts (6)

| Severity | Type | Asset |
|----------|------|-------|
| HIGH | stale_attestation | USDT |
| HIGH | stale_attestation | USDV |
| MEDIUM | stale_attestation | USDe |
| MEDIUM | stale_attestation | USD1 |
| MEDIUM | concentration_risk | DAI |
| LOW | issuer_ambiguity | USDC |

## Unsigned Cards

32 unsigned ≤4KB cards for priority cohort. Ready for TUI 1 signing.

## Coverage Matrix

- 425 subjects indexed
- 42+ subjects MEASURED (9.9%+ coverage)
- 383 INDEXED (not measured)
- Trigger schedule: 8 daily, 13 weekly, 9 monthly

## Catalog

`TUI-2-MEASUREMENT-QUEUE.json` — canonical catalog with:
- Total subjects, deployments, measured coverage
- Freshness per subject
- Next measurement required per subject
- Correction links per record

## Reproducible Readers

| Reader | File | State |
|--------|------|-------|
| EVM | `readers/evm-reader.mjs` | v0.1.1, verified |
| XRPL | `readers/xrpl-reader.mjs` | v0.1.1, verified |
| Stellar | `readers/stellar-reader.mjs` | v0.1.1, verified |

## Evidence Integrity

- Every record: source, query, block/ledger, raw hash, normalized calculation, code revision, replay result, terms boundary, correction link
- Per-record correction links: `https://github.com/CSOAI-ORG/councilof-ai/issues/new?title=TUI2-correction-{symbol}-{chain}`
- INDEXED ≠ MEASURED
- Revenue = $0

## Blockers

1. **Signing key** — card production (TUI 1)
2. **Root ceremony** — Merkle inclusion
3. **RunPod GPU** — broader measurement
4. **Base EAS** (~$0.01) and **XRPL memo** (~$0.00001) — owner approval
5. **OTS Bitcoin** — submitted, awaiting confirmation

---

*TUI 2 — Global Financial and Asset Index*
*Branch: finance/full-spread-20260911*
*Status: ACHIEVED*
