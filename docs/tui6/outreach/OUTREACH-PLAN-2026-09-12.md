# TUI 6 Outreach — Open Distribution

**Date:** 2026-09-12  
**Status:** OPEN — messages prepared, channels ready, owner approval required before sending

## Three Offers (with Attribution IDs)

| Offer | ID | Free Door | Paid Step | Target |
|-------|-----|-----------|-----------|--------|
| Stablecoin Change & Corrections Feed | ATTR-stablecoin-corrections-feed-v1 | /api/gspc (free) | /api/eunomia-data (paid) | Data providers, risk firms |
| Regulation Deadline & Evidence Crosswalk | ATTR-regulation-crosswalk-v1 | /api/regulation (free) | /api/evidence-bundle (paid) | Compliance, auditors |
| MCP/A2A/x402 Trust Receipt | ATTR-mcp-trust-receipt-v1 | /mcp (free) | /api/request-attestation (paid) | Agent platforms, infra |

## Distribution Channels (Active)

| Channel | Status | URL | Verified |
|---------|--------|-----|----------|
| MCP Registry | LIVE | io.github.CSOAI-ORG/gspc | Yes |
| npm | LIVE | csoai-gspc-mcp | Yes |
| Smithery | LIVE | smithery.ai/server/csoai/gspc-mcp | Yes |
| Hugging Face | LIVE | huggingface.co/csoai | Yes |
| Kaggle | LIVE | nicktempleman/csoai-gspc-living-board | Yes |
| PayAPI Market | LIVE | payapi.market/api/council-of-ai-gspc-eu-evidence-feed | Yes |
| mcp.so | LIVE | mcp.so | Yes (PR #1931) |
| GitHub | LIVE | github.com/CSOAI-ORG | Yes |
| Zenodo | LIVE | DOI 10.5281/zenodo.21991104 | Yes |
| Website | LIVE | councilof.ai | Yes |
| RSS | LIVE | councilof.ai/feed.xml | Yes |
| sitemap | LIVE | councilof.ai/sitemap.xml | Yes |
| llms.txt | LIVE | councilof.ai/llms.txt | Yes |

## Outreach Messages (Evidence-First, Owner Approval Required)

### Message 1: Financial Data Providers (CoinGecko, DefiLlama, CCData, Kaiko, CoinMarketCap)

**Hook:** CSOAI now provides direct on-chain readers for major stablecoins with finalized block/ledger provenance. 425 assets indexed across 211 chains. 6 deep measurements with reproducible reader outputs.

**Evidence:** GET https://councilof.ai/api/gspc — 22 axes measured. GET https://councilof.ai/api/state — signed cards, root, corrections.

**Ask:** Review our stablecoin coverage data. Free verification at /gspc-verify. Paid evidence bundles available via x402.

### Message 2: Financial Risk (Chainalysis, Elliptic, Moody's, S&P, ComplyAdvantage)

**Hook:** Independent AI measurement body with 335 Ed25519-signed measurement cards, Rekor-witnessed Merkle root, and 20 regulation deadlines tracked. EU AI Act crosswalk covering 5 provision-level linkages.

**Evidence:** GET https://councilof.ai/api/regulation — 20 deadlines, signed. GET https://councilof.ai/api/corrections — 47 corrections, public.

**Ask:** Review our regulation crosswalk and stablecoin attestation evidence. Free: /api/regulation. Paid: /api/evidence-bundle.

### Message 3: Agent Infrastructure (Anthropic MCP, LangChain, Hugging Face, CrewAI)

**Hook:** CSOAI is the measurement and receipt layer for machine-to-machine commerce. 12 MCP tools, 7 A2A skills, x402 payment rail live on Base. Signed offer receipts. Free verification.

**Evidence:** POST https://councilof.ai/mcp — 12 tools. GET /.well-known/agent-card.json — 7 skills. GET /.well-known/x402.json — 9 resources.

**Ask:** Integrate CSOAI measurement into your agent stack. Free MCP tools. Paid evidence via x402.

## Revenue Gate

Scale a wedge only after:
- One attributable outside buyer plus repeat intent; OR
- Two written pilot acceptances at the stated price.

Current: 1 external payer, $0.02 USDC. No repeat buyers yet.

## Do Not

- Send bulk email
- Send automated DMs
- Submit to directories repeatedly
- Use promotional bot replies
- Invent download numbers or adoption claims
