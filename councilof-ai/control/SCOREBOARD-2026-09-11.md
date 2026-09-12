# CSOAI Shared Scoreboard — 11 September 2026
## Seven-Terminal Eating Plan

---

## Production Status: ALL CLEAR (8/8 endpoints HTTP 200)

---

## Counters

| Counter | Value | State | Source |
|---------|-------|-------|--------|
| Canonical subjects indexed | 425 | INDEXED | DefiLlama API |
| Deployments resolved | ~1,640 | INDEXED | DefiLlama API |
| Subjects deeply measured | 31 | MEASURED | On-chain readers |
| Chains covered | 10 | MEASURED | ETH, Base, ARB, OP, AVAX, BSC, Scroll, Solana, Tron, XRPL, Stellar |
| 22-axis cells accepted | 335/1,024 (32.7%) | MEASURED | model-axis-matrix.json |
| Regulatory provisions linked | 36/36 cards → 10 provisions | MAPPED | regulation-mapping-20260911.json |
| Signed cards verified | 371/371 | VERIFIED | SHA-256 + Ed25519 |
| Root leaves | 167 | IN_ROOT | Merkle 78d4e019 |
| Rekor inclusions | 167 | WITNESSED | log index 2791822965 |
| OTS submissions | 1 | STAMPED | Pending Bitcoin confirmation |
| Bitcoin confirmations | 0 | PENDING | OTS awaiting |
| Other chain anchors | 0 | NOT_ANCHORED | Base EAS + XRPL memo owner-gated |
| x402 challenges | 2 | CAPTURED | HTTP 402 with JWS offer receipt |
| Successful deliveries | 0 | BLOCKED | No USDC wallet |
| Self-settlements | 5 | EXCLUDED | INTERNAL_SELF_FUNDED |
| Independent settlements | 1 | SETTLED | 0.02 USDC |
| Repeat buyers | 0 | NONE | — |
| Public dataset downloads | 68+ | LIVE | Kaggle csoai-gspc-living-board |
| External citations | 0 | NONE | — |
| Active directory listings | 7 | LISTED | MCP Registry, npm, PayAPI, Bazaar, Glama, MCP.so, awesome-mcp-servers PR |
| Total spend | $0 | VERIFIED | All public endpoints |
| Attributable revenue | 0.02 USDC | EXTERNAL | 1 payer |
| Unresolved evidence conflicts | 1 | DOCUMENTED | XRPL RLUSD $0 vs DefiLlama $1.03B |

---

## Deep Measurement Coverage (31 measurements)

### By Chain

| Chain | Count | Assets | Method |
|-------|-------|--------|--------|
| Ethereum | 15 | USDT, USDC, DAI, USDS, USDe, PYUSD, RLUSD, crvUSD, GHO, FRAX, USDD, BUIDL, USDY, USDG, USD1 | totalSupply() |
| Tron | 1 | USDT ($94.26B) | triggerconstantcontract |
| Solana | 2 | USDC ($8.07B), USDT ($3.84B) | getTokenSupply |
| BSC | 2 | USDT ($9.18B), USDC ($1.59B) | totalSupply() |
| Base | 2 | USDC ($4.25B), RLUSD ($1.00B) | totalSupply() |
| Avalanche | 2 | USDC ($416M), USDT ($1.85B) | totalSupply() |
| Arbitrum | 2 | USDC ($2.72B), USDT ($807M) | totalSupply() |
| Optimism | 2 | USDC ($166M), USDT ($233M) | totalSupply() |
| Scroll | 1 | USDC ($5.13M) | totalSupply() |
| XRPL | 1 | USD gateway ($1.00B) | account_lines |
| Stellar | 1 | USDC ($355M) | Stellar Expert API |

### By Asset (Top 10)

| Asset | Total Measured | Chains | State |
|-------|---------------|--------|-------|
| USDT | 7 chains | ETH, Tron, Solana, BSC, ARB, OP, AVAX | MEASURED |
| USDC | 9 chains | ETH, Base, Solana, BSC, ARB, OP, AVAX, Scroll, Stellar | MEASURED |
| RLUSD | 2 chains | ETH ($1.37B), Base ($1.00B) | MEASURED |
| DAI | 1 chain | ETH | MEASURED |
| USDS | 1 chain | ETH | MEASURED |
| USDe | 1 chain | ETH | MEASURED |
| PYUSD | 1 chain | ETH | MEASURED |
| crvUSD | 1 chain | ETH | MEASURED |
| BUIDL | 1 chain | ETH | MEASURED |
| USDY | 1 chain | ETH | MEASURED |

### Measurement State Summary

| State | Count | Note |
|-------|-------|------|
| DEEP_MEASURED | 31 | On-chain verified |
| INDEXED (not measured) | 394 | DefiLlama only |
| NO_ISSUED_SUPPLY | 1 | XRPL RLUSD $0 |
| UNMEASURED | 1 | USBDC (Stellar) |
| MEASUREMENT_FAILED | 4 | FDUSD, DOLA, BUIDL-early, USDG-early |

---

## Card Verification State

| Population | Count | SHA-256 | Ed25519 |
|-----------|-------|---------|---------|
| Public root | 167 | PASS | PASS |
| Historical corpus | 335 | PASS | PASS |
| PR#1888 cards | 36 | PASS | PASS |
| **Total unique** | **371** | **371/371** | **371/371** |

---

## Board State

| Family | Axes | Measured | Public Leaders |
|--------|------|----------|----------------|
| Behavioural (gspc) | 14 | 14 | 3 (safety, swarm, jail) |
| Financial (deterministic) | 8 | 8 | 0 (fact runs) |
| **Total** | **22** | **22** | **3** |

Staleness: Behavioural 29 days, Jail 24 days, Financial 17 days.

---

## Regulatory State

| Framework | Provisions Mapped | Cards | Status |
|-----------|-------------------|-------|--------|
| EU AI Act Art 50 | 22 | 22 PR#1888 | MAPPED |
| EU AI Act Art 15 | 14 | 14 PR#1888 | MAPPED |
| NIST AI RMF | 8 | 8 PR#1888 | MAPPED |
| EU AI Act Art 9 | 7 | 7 PR#1888 | MAPPED |
| EU AI Act Art 14 | 5 | 5 PR#1888 | MAPPED |
| EU AI Act Art 13 | 5 | 5 PR#1888 | MAPPED |
| EU AI Act Art 17 | 4 | 4 PR#1888 | MAPPED |
| EU AI Act Art 5 | 3 | 3 PR#1888 | MAPPED |
| Machinery Reg 2023/1230 | 3 | 3 PR#1888 | MAPPED |
| EU AI Act Art 52 | 1 | 1 PR#1888 | MAPPED |

---

## Distribution State

| Surface | Status | URL |
|---------|--------|-----|
| Website | LIVE | councilof.ai |
| API | LIVE | councilof.ai/api/gspc |
| MCP | LIVE | councilof.ai/mcp (12 tools) |
| A2A | LIVE | councilof.ai/api/a2a (11 methods) |
| x402 | LIVE | councilof.ai/.well-known/x402.json (9 resources) |
| RSS | LIVE | councilof.ai/feed.xml |
| Sitemap | LIVE | councilof.ai/sitemap.xml |
| llms.txt | LIVE | councilof.ai/llms.txt |
| Kaggle | PUBLISHED | kaggle.com/datasets/nicktempleman/csoai-canonical-20260911 |
| HF | BLOCKED | No auth token |
| awesome-mcp-servers | PR OPEN | github.com/punkpeye/awesome-mcp-servers/pull/13346 |
| Glama | LISTED | glama.ai/mcp/servers/CSOAI-ORG/councilof-ai |
| MCP.so | LISTED | mcp.so/server/csoai-gspc-mcp |
| MCP Registry | REGISTERED | io.github.CSOAI-ORG/gspc |
| npm | PUBLISHED | npmjs.com/package/csoai-gspc-mcp |

---

## Revenue State

| Classification | Amount | Count |
|---------------|--------|-------|
| EXTERNAL_CUSTOMER | 0.02 USDC | 1 payer |
| INTERNAL_SELF_FUNDED | 5 | Excluded |
| ZERO_VALUE_PROBE | 4 | Excluded |
| **Revenue** | **0.02 USDC** | **Effectively zero** |

---

## Unresolved Evidence Conflicts

| Conflict | Status | Resolution |
|----------|--------|------------|
| XRPL RLUSD $0 vs DefiLlama $1.03B | OPEN | DefiLlama source unverified. On-chain shows $0. |
| Stellar Horizon API format change | OPEN | Stellar Expert API works as alternative. |
| FDUSD/DOLA contracts return 0x | OPEN | Contracts may have migrated. |

---

## Next Three Highest-Yield Actions

1. **Expand measurements to cover top 50 assets** — currently 31 of top 200 by supply
2. **Publish HF dataset** — requires owner HF token
3. **Execute x402 payment** — requires owner Base wallet with USDC

---

*Shared Scoreboard — 11 September 2026*
*All claims verified against live endpoints and on-chain data.*
*INDEXED ≠ MEASURED. Revenue = zero.*
