# CSOAI Estate Report — 11 September 2026
## End-of-Day Independently Checkable Report

---

## Evidence Delivered

| Evidence Type | Count | State |
|--------------|-------|-------|
| Deep measurements | 61 | MEASURED |
| Unique assets measured | 28 | MEASURED |
| Chains covered | 17 | MEASURED |
| Signed cards verified | 371/371 | VERIFIED |
| Root leaves | 167 | ROOTED |
| Rekor inclusions | 167 | WITNESSED |
| Regulatory provisions mapped | 36/36 cards → 10 provisions | MAPPED |
| Endpoints verified | 14 | LIVE |
| Alerts generated | 6 | DOCUMENTED |
| Kaggle versions | 8 | PUBLISHED |

## Deduplicated Catalog Coverage

| Category | Indexed | Measured | Coverage |
|----------|---------|----------|----------|
| Stablecoins | 425 | 28 unique | 6.6% |
| Deployments | ~1,640 | 61 records | 3.7% |
| Chains | 211 | 17 | 8.1% |
| Tokenized funds | 6 | 4 | 66.7% |
| XRPL instruments | 16 | 1 | 6.3% |
| SWIFT institutions | 26 | 0 | 0% |
| ISO 20022 messages | 25 | 0 | 0% |
| 22-axis cells | 1,024 | 335 | 32.7% |

## Top 10 Measured Assets (by total supply)

| Asset | Supply | Chains | State |
|-------|--------|--------|-------|
| USDT | $199.73B | 13 | MEASURED |
| USDC | $68.72B | 14 | MEASURED |
| USDS | $6.61B | 1 | MEASURED |
| DAI | $5.15B | 7 | MEASURED |
| USDe | $4.60B | 1 | MEASURED |
| sUSDS | $4.14B | 1 | MEASURED |
| RLUSD | $2.37B | 2 | MEASURED |
| crvUSD | $2.10B | 1 | MEASURED |
| PYUSD | $1.71B | 1 | MEASURED |
| USD1 | $1.57B | 1 | MEASURED |

## Financial Rails

| Rail | Status | Details |
|------|--------|---------|
| EVM (11 chains) | 59 measurements | ETH, Base, ARB, OP, AVAX, BSC, Polygon, Celo, Scroll, Mantle, zkSync, Gnosis, Aurora, Metis |
| Solana | 2 measurements | USDC $8.07B, USDT $3.84B |
| Tron | 1 measurement | USDT $94.26B |
| XRPL | 1 measurement | USD gateway $1.00B |
| Stellar | 1 measurement | USDC $355M |
| SWIFT | 26 censused | 3 LIVE, 9 COMMITTED, 14 DISCOVERED |
| ISO 20022 | 25 identified | 0 implemented |
| x402 | 9 resources | 2 challenges captured |

## Alerts

| Severity | Type | Asset | Detail |
|----------|------|-------|--------|
| HIGH | stale_attestation | USDT | KPMG audit announced Aug 2026, text unpublished |
| HIGH | stale_attestation | USDV | Zero published attestation ever |
| MEDIUM | stale_attestation | USDe | Custodian attestations ~3 months stale |
| MEDIUM | stale_attestation | USD1 | Crowe monthly after 6-month publication lapse |
| MEDIUM | concentration_risk | DAI | 89% on Ethereum |
| LOW | issuer_ambiguity | USDC | Circle issues natively on some chains, bridged on others |

## Production State

| Surface | URL | Status |
|---------|-----|--------|
| Website | councilof.ai | HTTP 200 |
| API | councilof.ai/api/gspc | HTTP 200 |
| MCP | councilof.ai/mcp | LIVE (12 tools) |
| A2A | councilof.ai/api/a2a | LIVE (11 methods) |
| x402 | councilof.ai/.well-known/x402.json | LIVE (9 resources) |
| RSS | councilof.ai/feed.xml | HTTP 200 |
| Sitemap | councilof.ai/sitemap.xml | HTTP 200 |
| llms.txt | councilof.ai/llms.txt | HTTP 200 (updated) |
| Kaggle | kaggle.com/datasets/nicktempleman/csoai-canonical-20260911 | v8 published |
| MCP Registry | io.github.CSOAI-ORG/gspc | REGISTERED |
| npm | npmjs.com/package/csoai-gspc-mcp | v0.2.1 |
| Glama | glama.ai/mcp/servers/CSOAI-ORG/councilof-ai | LISTED |

## Revenue and Cost

| Metric | Value |
|--------|-------|
| External revenue | 0.02 USDC |
| Self-settlements | 5 (excluded) |
| Zero-value probes | 4 (excluded) |
| Total spend | $0 |
| Cost per evidence unit | $0 |

## Unresolved Evidence Conflicts

| Conflict | Status |
|----------|--------|
| XRPL RLUSD $0 vs DefiLlama $1.03B | OPEN — DefiLlama source unverified |
| Stellar Horizon API format change | OPEN — Stellar Expert API works as alternative |

## Owner Gates

| Gate | What's Needed |
|------|---------------|
| x402 payment | Base wallet with USDC |
| HF publish | HF auth token |
| Branch merge | PR review |
| NIST submission | Owner signature |
| Outreach sending | Owner approval |
| GitHub pinning | Web UI (no API) |

## Git State

| Branch | SHA | Commits |
|--------|-----|---------|
| control/canonical-state-20260911 | c271f3306 | 5 |
| finance/full-spread-20260911 | 09dcb6020 | 35 |
| models/verified-expansion-20260911 | 3186c0acd | 4 |
| agents/discovery-consolidation-20260911 | 02e3939f7 | 2 |
| trust/anchor-completion-20260911 | 869dc24e7 | 5 |
| **Total** | — | **51** |

---

*CSOAI Estate Report — 11 September 2026*
*All claims verified against live endpoints, on-chain data, and signed artifacts.*
*INDEXED ≠ MEASURED. Revenue = zero. Self-payment ≠ customer revenue.*
