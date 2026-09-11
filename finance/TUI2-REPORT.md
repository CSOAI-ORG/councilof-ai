# TUI 2 — Financial Coverage Machine Report
## Branch: `finance/full-spread-20260911`
## Generated: 2026-09-11 (v3-corrected)

---

## Coverage Denominators

| Metric | Value | State |
|--------|-------|-------|
| Total stablecoins indexed | **425** | INDEXED (DefiLlama live API, 2026-09-11) |
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

| ID | Symbol | Name | Supply | Chain | Method |
|----|--------|------|--------|-------|--------|
| 1 | USDT | Tether | $183.4B | 130 chains | DefiLlama chainCirculating |
| 2 | USDC | USD Coin | $74.2B | 155 chains | DefiLlama chainCirculating |
| 209 | USDS | Sky Dollar | $6.6B | 7 chains | DefiLlama chainCirculating |
| 5 | DAI | Dai | $4.8B | 49 chains | DefiLlama chainCirculating |
| 146 | USDe | Ethena USDe | $4.6B | 31 chains | DefiLlama chainCirculating |
| 120 | PYUSD | PayPal USD | $2.8B | 19 chains | DefiLlama chainCirculating |
| 250 | RLUSD | Ripple USD | $2.4B | 2 chains | Cross-chain: XRPL $1.03B + ETH $1.37B |
| 14 | USDD | USDD | $1.5B | 4 chains | DefiLlama chainCirculating |
| 118 | GHO | GHO | $0.7B | 2 chains | DefiLlama chainCirculating |
| 119 | FDUSD | First Digital USD | $0.3B | 2 chains | DefiLlama chainCirculating |
| 110 | crvUSD | crvUSD | $0.2B | 4 chains | DefiLlama chainCirculating |
| 6 | FRAX | Frax | $0.2B | 14 chains | DefiLlama chainCirculating |
| 15 | DOLA | Dola | $0.1B | 5 chains | DefiLlama chainCirculating |

**Coverage:** 13/425 = 3.1%. Deep measurement incomplete.

## XRPL Instruments (16)

Total: $1.21B across 86,897 holders. Measured 2026-09-07.

| Symbol | Issuer | Supply | Holders |
|--------|--------|--------|---------|
| RLUSD | Ripple | $1.03B | 41,200 |
| BBRL | Braza Bank | $116.0M | 40 |
| USDB | Braza Bank | $26.0M | 60 |
| EURCV | Société Générale-FORGE | $10.0M | 120 |
| USD.bs | Bitstamp | $8.0M | 7,314 |
| EUR.bs | Bitstamp | $5.0M | 430 |
| USD.gh | GateHub | $4.9M | 19,800 |
| USDC | Circle | $4.3M | 80 |
| EUR.gh | GateHub | $1.7M | 9,400 |
| EURQ | Quantoz | $1.0M | 2 |
| USDQ | Quantoz | $1.0M | 1 |
| OUSG | Ondo Finance | $1.7M | 50 |
| GBP.gh | GateHub | $199K | 2,400 |
| EURØP | Schuman Financial | $340K | 310 |
| PSC | Republic of Palau | $14.6K | 90 |
| XAU.gh | GateHub | $4.1K | 5,600 |

## SWIFT Cohort (26)

| Status | Count | Names |
|--------|-------|-------|
| LIVE | 3 | HSBC, Standard Chartered, UOB |
| COMMITTED | 9 | JPMorgan, Deutsche Bank, Natwest, +6 |
| DISCOVERED | 14 | Citi, BNY, BNP Paribas, ANZ, +10 |
| MEASURED | 0 | Census only. Settlement still off-chain. |

## ISO 20022 Families (7, 25 message types)

| Family | Messages | Implemented |
|--------|----------|-------------|
| pacs (Clearing & Settlement) | 4 | 0 |
| pain (Payment Initiation) | 4 | 0 |
| camt (Cash Management) | 3 | 0 |
| sese (Securities Settlement) | 3 | 0 |
| seev (Securities Events) | 4 | 0 |
| reda (Reference Data) | 2 | 0 |
| auth (Authorization) | 2 | 0 |

## Tokenized Funds (4, $8.3B+ AUM)

| Fund | AUM | Chains | Measured |
|------|-----|--------|----------|
| Franklin Templeton BENJI | $700M+ | 7 | No |
| BlackRock BUIDL | $2.76B | 2 | No |
| Circle USYC | $2.60B | 2 | No |
| Ondo USDY | $2.22B | 16 | No |

## Top 15 Chains (by asset count)

| Chain | Assets | Top 3 by Supply |
|-------|--------|-----------------|
| Ethereum | 168 | USDT($73.7B), USDC($47.2B), USDS($6.5B) |
| Arbitrum | 68 | USDC($2.3B), USDT($807M), PYUSD($302M) |
| BSC | 65 | USDT($9.2B), USYC($2.6B), USDC($1.6B) |
| Base | 57 | USDC($4.3B), USDe($351M), rwaUSDi($147M) |
| Solana | 51 | USDC($7.0B), USDT($2.7B), USDGO($1.4B) |
| Polygon | 43 | USDC($1.8B), USDT($770M), DAI($491M) |
| Avalanche | 41 | BUIDL($565M), USDC($431M), USDT($292M) |
| OP Mainnet | 38 | USDT($242M), USDC($180M), BUIDL($26M) |
| Monad | 20 | USDC($242M), AUSD($174M), rwaUSDi($100M) |
| Hyperliquid L1 | 19 | USDC($6.8B), USDT($86M), FEUSD($10M) |
| Fantom | 16 | USDC($181M), USDT($83M), DAI($35M) |
| Tron | 14 | USDT($92.3B), USDD($1.2B), TUSD($168M) |
| ZKsync Era | 14 | USDC($34M), USDT($2.4M), zkUSD($1.2M) |
| Berachain | 13 | USDT($44M), USDe($12M), BUSD($7M) |
| Sonic | 13 | USDC($133M), FRXUSD($1M), USSD($1M) |

## Attestation Gaps

| Coin | ID | Supply | Gap | Severity |
|------|-----|--------|-----|----------|
| USDT | 1 | $183.4B | KPMG full audit announced Aug 2026, text UNPUBLISHED | HIGH |
| USDe | 146 | $4.6B | Custodian attestations ~3 months stale | MEDIUM |
| USDV | 185 | $100M | Zero published attestation EVER | HIGH |
| USDC | 2 | $74.2B | Deloitte monthly + daily BlackRock CUSIP filings | LOW |
| RLUSD | 250 | $2.4B | Deep measured cross-chain | LOW |

## Anchor States (separate, not collapsed)

| Layer | Status | Detail |
|-------|--------|--------|
| Card signature | UNSIGNED | Signing key needed (TUI 5) |
| Merkle-root inclusion | NOT_IN_ROOT | Root ceremony needed |
| Rekor witness | WITNESSED | Log index 2791822965 |
| OTS submission | STAMPED_PENDING_BITCOIN | Submitted to 2 calendars |
| Bitcoin confirmation | PENDING | Awaiting confirmation |
| Base EAS | READY_NOT_ANCHORED | ~$0.01 cost, owner-gated |
| XRPL memo | READY_NOT_ANCHORED | ~$0.00001 cost, owner-gated |

## Corrections Applied (v1→v3)

1. ❌ v1: deep_measured=17 (USDS symbol collision matched 5 projects) → ✅ v3: **13** (keyed by DefiLlama ID)
2. ❌ v1: Used wrong DefiLlama IDs (10,8,12,24,252,253,50) → ✅ v3: Correct IDs (1,2,5,6,14,15,110,118,119,120,146,209,250)
3. ❌ v1: Chain supply all zeros (parsed wrong nesting level) → ✅ v3: Correct chain supply from `current.peggedUSD`
4. ❌ v1: "211 chains" without qualification → ✅ v3: **177 chains with active supply**, 211 listed total

## Claims NOT Made

- ❌ 425 deep measurements (only 13 of 425)
- ❌ "All measured" or "fully anchored"
- ❌ Revenue from x402 offers
- ❌ OTS "Bitcoin confirmed" (status: STAMPED_PENDING_BITCOIN)
- ❌ Base EAS or XRPL memo anchored (status: READY_NOT_ANCHORED)

## Costs

- **Actual spend:** $0.00 (all via free APIs: DefiLlama, public Ethereum RPC, XRPL ledger)
- **Funding source:** N/A (zero cost)
- **Future costs:** Base EAS ~$0.01, XRPL memo ~$0.00001 (owner-gated)

## Remaining Blockers

1. **Signing key** — needed for card production (TUI 5 territory)
2. **Root ceremony** — needed for Merkle inclusion
3. **RunPod GPU** — needed for broader measurement harness
4. **Owner approval** — Base EAS and XRPL memo anchoring
5. **OTS Bitcoin confirmation** — submitted, awaiting
6. **412 assets** remain INDEXED only (117 in queue, 295 low-priority)

---

*v3-corrected — SHA-256: e8c4238cc3b61ace327694e1efcbeb7d8d4f373e03d854b755e1c66d04e0d1b7*
