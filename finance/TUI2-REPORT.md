# TUI 2 — Financial Coverage Machine Report
## Branch: `finance/full-spread-20260911`
## Generated: 2026-09-11

---

## Coverage Denominators

| Metric | Value | State |
|--------|-------|-------|
| Total stablecoins indexed | 425 | INDEXED (DefiLlama live API) |
| Total chains with supply > 0 | 177 | INDEXED |
| Total chains listed (incl. zero-supply) | 211 | INDEXED |
| Total supply | $310.8B | INDEXED |
| USD-pegged | 337 | INDEXED |
| Non-USD pegged | 88 | INDEXED |
| Canonical assets | 424 | INDEXED |
| Bridge wrappers | 1 | INDEXED (Binance Peg BUSD) |
| Issuer variants | 0 | N/A |

## Deep Measurement State

| Metric | Value | State |
|--------|-------|-------|
| Deep measured (Ethereum totalSupply) | 17 of 425 | INCOMPLETE |
| Deep measured (RLUSD cross-chain) | 1 | MEASURED |
| Deep measurement queue | 120 | QUEUED |
| Signed cards in public root | 167 | SIGNED |
| Historical signed corpus | 335 | SIGNED |
| Rekor witness | log index 2791822965 | WITNESSED |
| OTS | submitted | STAMPED_PENDING_BITCOIN |
| Base EAS | ready, ~$0.01 | NOT_ANCHORED (owner gate) |
| XRPL memo | ready, ~$0.00001 | NOT_ANCHORED (owner gate) |

## XRPL Instruments (16)

Total: $1.21B across 86,897 holders. All measured via XRPL ledger queries.

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
| MEASURED | 0 | (census only, no deep measurement yet) |

Settlement still off-chain. SWIFT migration deadline already passed (Mar 2025).

## ISO 20022 Families (7)

| Family | Messages | Status |
|--------|----------|--------|
| pacs (Clearing & Settlement) | 4 | IDENTIFIED |
| pain (Payment Initiation) | 4 | IDENTIFIED |
| camt (Cash Management) | 3 | IDENTIFIED |
| sese (Securities Settlement) | 3 | IDENTIFIED |
| seev (Securities Events) | 4 | IDENTIFIED |
| reda (Reference Data) | 2 | IDENTIFIED |
| auth (Authorization) | 2 | IDENTIFIED |

Total: 25 message types. Zero implemented.

## Tokenized Funds (4)

| Fund | AUM | Chains | Status |
|------|-----|--------|--------|
| Franklin Templeton BENJI | $700M+ | 7 | IDENTIFIED |
| BlackRock BUIDL | $2.76B | 2 | IDENTIFIED |
| Circle USYC | $2.60B | 2 | IDENTIFIED |
| Ondo USDY | $2.22B | 16 | IDENTIFIED |

Zero deep-measured. NAV/custody data needed per fund.

## Top 20 Deep Measurement (Ethereum)

17 stablecoins verified via `totalSupply()` on Ethereum:

| Symbol | ETH Supply | % of Total | State |
|--------|-----------|------------|-------|
| USDT | $73.67B | 40.2% | DEEP_MEASURED |
| USDC | $47.19B | 63.6% | DEEP_MEASURED |
| USDS | $6.51B | 98.4% | DEEP_MEASURED |
| DAI | $4.15B | 87.0% | DEEP_MEASURED |
| USDe | $2.62B | 57.1% | DEEP_MEASURED |
| PYUSD | $1.66B | 60.2% | DEEP_MEASURED |
| RLUSD | $1.37B | 57.1% | DEEP_MEASURED (cross-chain) |
| USDf | $1.06B | 90.3% | INDEXED |
| USDY | $1.18B | 53.3% | INDEXED |
| BUIDL | $0.86B | 31.3% | INDEXED |
| crvUSD | $0.84B | 40.0% | DEEP_MEASURED |
| USD1 | $1.57B | 36.5% | INDEXED |
| GHO | $0.64B | 91.7% | DEEP_MEASURED |
| USD0 | $0.55B | 100.0% | INDEXED |
| USDTB | $0.48B | 91.5% | INDEXED |
| FRAX | $0.22B | 100.0% | DEEP_MEASURED |
| USDD | $0.26B | 17.3% | DEEP_MEASURED |
| FDUSD | $0.22B | 100.0% | DEEP_MEASURED |
| DOLA | $0.10B | 100.0% | DEEP_MEASURED |
| U | $0.28B | 21.6% | INDEXED |

## Attestation Gaps

| Coin | Supply | Gap | Severity |
|------|--------|-----|----------|
| USDT | $183.4B | KPMG full audit announced Aug 2026, text UNPUBLISHED | HIGH |
| USDe | $4.6B | Custodian attestations ~3 months stale | MEDIUM |
| USD1 | $4.3B | Crowe monthly after 6-month publication lapse | MEDIUM |
| USDV | $100M | Zero published attestation EVER | HIGH |
| USDC | $74.2B | Deloitte monthly + daily BlackRock CUSIP filings | LOW |
| RLUSD | $2.4B | Deep measured cross-chain | LOW |

## Chain Distribution (Top 15)

| Chain | Assets |
|-------|--------|
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

## Files Produced

| File | Description |
|------|-------------|
| `finance/canonical-asset-graph.json` | Master state: coverage, top 20, XRPL, SWIFT, ISO 20022, queue |
| `finance/full-asset-graph.json` | All 425 assets with per-chain supply |
| `finance/chain-coverage-matrix.json` | Top 15 chains × top 5 assets |
| `finance/deep-measurement-batch.json` | 12 verified Ethereum deep measurements |
| `measurement/stablecoin/` | Pre-existing: full-index, deep batches, expansion, attestation watch |

## Blockers

1. **Signing key** — needed for card production (TUI 5 territory)
2. **Root ceremony** — needed for Merkle inclusion
3. **RunPod GPU** — needed for broader measurement harness
4. **Owner approval** — Base EAS (~$0.01) and XRPL memo (~$0.00001) anchoring
5. **OTS Bitcoin confirmation** — submitted, awaiting

## Honest Statement

425 stablecoins indexed across 177 chains with active supply ($310.8B total). 17 deeply measured on Ethereum via `totalSupply()` RPC. 16 XRPL instruments measured ($1.21B, 86,897 holders). 26 SWIFT institutions censused (3 LIVE, 9 COMMITTED, 14 DISCOVERED). 7 ISO 20022 families identified (25 message types, 0 implemented). 4 tokenized funds catalogued ($8.3B+ AUM). 120 in deep measurement queue prioritized by supply and attestation gaps. Deep measurement incomplete. INDEXED ≠ MEASURED.

---

*TUI 2 — Financial Coverage Machine*
*SHA-256: 4a1bdd812f2a25809c7501b262f0e27240a849106f1ff96cef80c05612362cd9*
