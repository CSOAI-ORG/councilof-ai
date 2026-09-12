# TUI 2 — Financial Coverage Machine Report
## Branch: `finance/full-spread-20260911`
## Generated: 2026-09-11 (v3-corrected)

## Coverage

| Metric | Value | State |
|--------|-------|-------|
| Stablecoins indexed | 425 | INDEXED |
| Chains with active supply | 177 | INDEXED |
| Total supply | $310.8B | INDEXED |
| USD-pegged | 337 | INDEXED |
| Deep measured (by ID) | 13 of 425 | DEEP_MEASURED |
| Deep measurement queue | 117 | QUEUED |
| Signed cards in public root | 167 | SIGNED |
| Historical signed corpus | 335 | SIGNED |

## Deep Measured (13, by DefiLlama ID)

USDT(1), USDC(2), USDS(209), DAI(5), USDe(146), PYUSD(120), RLUSD(250), USDD(14), GHO(118), FDUSD(119), crvUSD(110), FRAX(6), DOLA(15)

## XRPL: 16 instruments, $1.21B, 86,897 holders

## SWIFT: 26 institutions (3 LIVE, 9 COMMITTED, 14 DISCOVERED, 0 MEASURED)

## ISO 20022: 7 families, 25 message types, 0 implemented

## Tokenized Funds: 4 (BENJI, BUIDL, USYC, USDY — $8.3B+ AUM)

## Anchor States (separate)

Card: UNSIGNED | Root: NOT_IN_ROOT | Rekor: WITNESSED (2791822965) | OTS: STAMPED_PENDING_BITCOIN | Bitcoin: PENDING | Base EAS: READY_NOT_ANCHORED | XRPL memo: READY_NOT_ANCHORED

## Corrections (v1→v3)

1. USDS symbol collision (5 projects) → keyed by DefiLlama ID
2. Wrong DefiLlama IDs → corrected
3. Chain supply zeros → fixed current.peggedUSD parsing
4. "211 chains" → 177 with active supply

## Costs: $0.00

## Blockers

Signing key, root ceremony, RunPod GPU, owner approval for anchoring, OTS Bitcoin confirmation.

---

*SHA-256: ea952d4e34ea40ea9daf0b14f1876d516afebc1af4f72682370a593ffca34a66*
