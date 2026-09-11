# TUI 2 — Financial Coverage Machine Report
## Branch: `finance/full-spread-20260911`
## Generated: 2026-09-11 (v3-corrected)

---

## Coverage Denominators

| Metric | Value | State |
|--------|-------|-------|
| Total stablecoins indexed | **425** | INDEXED (DefiLlama live API) |
| Chains with active supply > $0 | **177** | INDEXED |
| Chains listed (incl. zero-supply) | **211** | INDEXED |
| Total supply | **$310.8B** | INDEXED |
| USD-pegged | 337 | INDEXED |
| Non-USD pegged | 88 | INDEXED |
| Canonical assets | 424 | INDEXED |
| Bridge wrappers | 1 | INDEXED (Binance Peg BUSD) |
| Deep measured (by DefiLlama ID) | **13 of 425** | DEEP_MEASURED |
| Deep measurement queue | **117** | QUEUED |
| Signed cards in public root | **167** | SIGNED |
| Historical signed corpus | **335** | SIGNED |

## Deep Measurement (13 assets, verified by DefiLlama ID)

| ID | Symbol | Name | Supply | Method |
|----|--------|------|--------|--------|
| 1 | USDT | Tether | $183.4B | DefiLlama per-chain |
| 2 | USDC | USD Coin | $74.2B | DefiLlama per-chain |
| 209 | USDS | Sky Dollar | $6.6B | DefiLlama per-chain |
| 5 | DAI | Dai | $4.8B | DefiLlama per-chain |
| 146 | USDe | Ethena USDe | $4.6B | DefiLlama per-chain |
| 120 | PYUSD | PayPal USD | $2.8B | DefiLlama per-chain |
| 250 | RLUSD | Ripple USD | $2.4B | Cross-chain (XRPL + ETH) |
| 14 | USDD | USDD | $1.5B | DefiLlama per-chain |
| 118 | GHO | GHO | $0.7B | DefiLlama per-chain |
| 119 | FDUSD | First Digital USD | $0.3B | DefiLlama per-chain |
| 110 | crvUSD | crvUSD | $0.2B | DefiLlama per-chain |
| 6 | FRAX | Frax | $0.2B | DefiLlama per-chain |
| 15 | DOLA | Dola | $0.1B | DefiLlama per-chain |

## XRPL Instruments (16)

Total: $1.21B, 86,897 holders. Measured 2026-09-07.
Top: RLUSD $1.03B, BBRL $116M, USDB $26M, EURCV $10M.

## SWIFT Cohort (26)

LIVE: 3 (HSBC, Standard Chartered, UOB). COMMITTED: 9. DISCOVERED: 14. MEASURED: 0.

## ISO 20022 (7 families, 25 message types, 0 implemented)

## Tokenized Funds (4, $8.3B+ AUM)

BENJI $700M+, BUIDL $2.76B, USYC $2.60B, USDY $2.22B.

## Anchor States (separate, not collapsed)

| Layer | Status |
|-------|--------|
| Card signature | UNSIGNED |
| Merkle-root | NOT_IN_ROOT |
| Rekor | WITNESSED (log index 2791822965) |
| OTS | STAMPED_PENDING_BITCOIN |
| Bitcoin | PENDING |
| Base EAS | READY_NOT_ANCHORED (~$0.01) |
| XRPL memo | READY_NOT_ANCHORED (~$0.00001) |

## Corrections (v1 → v3)

1. USDS symbol collision (5 projects share ticker) → keyed by DefiLlama ID
2. Wrong DefiLlama IDs in v1 → corrected to 1,2,5,6,14,15,110,118,119,120,146,209,250
3. Chain supply zeros → fixed `current.peggedUSD` parsing
4. "211 chains" → 177 with active supply

## Costs

Actual spend: **$0.00**. All via free APIs.

## Blockers

Signing key, root ceremony, RunPod GPU, owner approval for anchoring, OTS Bitcoin confirmation.

---

*SHA-256: f18ca6e3923bc35c3e47aa0bd4a3a57ca241fdaf22ac9e40cef4d1258c5a60f2*
