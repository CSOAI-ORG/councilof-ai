# TUI 6 — Targeted Contacts (15 prepared, 0 sent)

**Status:** PREPARED_FOR_REVIEW — none sent without owner action-time approval.
**Date:** 2026-09-11

## Classification

| Class | Count | Description |
|-------|-------|-------------|
| Financial risk/compliance | 5 | Stablecoin issuers, compliance teams, risk desks |
| Data/infrastructure | 5 | Data platforms, index providers, research orgs |
| Agent infrastructure | 5 | MCP/A2A ecosystem, agent builders, protocol teams |

## Attribution IDs

Each contact has a unique attribution ID for tracking in `settlement-attribution.json`.

---

## Financial Risk / Compliance (5)

### FIN-001: Chainalysis Research Team
- **Why:** They publish stablecoin transparency reports. Our 425-asset index with 1,640 chain deployments is directly relevant to their coverage.
- **Evidence:** 425 indexed stablecoins, signed measurement cards, public Merkle root
- **Approach:** Evidence-first: "We maintain a continuously updated index of 425 stablecoins across 211 chains with signed, reproducible measurement cards. Sharing in case useful for your transparency research."
- **Channel:** Research team contact form
- **Attribution ID:** `fin-001-chainalysis-research`

### FIN-002: Circle (USDC) Compliance
- **Why:** USDC is top-2 by supply in our index. We can provide signed attestation evidence for USDC deployments.
- **Evidence:** USDC indexed across all deployments, measurement queue position #1
- **Approach:** "We index USDC across [N] chains with signed measurement cards. Our regulatory crosswalk maps to EU AI Act provisions. Would a signed evidence pack be useful for your compliance documentation?"
- **Channel:** Compliance team email
- **Attribution ID:** `fin-002-circle-compliance`

### FIN-003: Tether Transparency Team
- **Why:** USDT is #1 by supply. We have chain deployment data that complements their attestation reports.
- **Evidence:** USDT indexed across all deployments, measurement queue position #2
- **Approach:** Same pattern as FIN-002, evidence-first
- **Channel:** Transparency team contact
- **Attribution ID:** `fin-003-tether-transparency`

### FIN-004: FCA Innovation Team
- **Why:** UK regulator. Our regulatory crosswalk covers UK DRCF principles alongside EU AI Act. CSOAI is a UK company (16939677).
- **Evidence:** East-west crosswalk (4 regimes), 417 frozen provisions, BSI ART/1 seat application pending
- **Approach:** "CSOAI Ltd (UK 16939677) maintains a signed measurement infrastructure for AI governance. We map to DRCF principles and EU AI Act. Sharing our crosswalk for your reference."
- **Channel:** FCA Innovation Hub
- **Attribution ID:** `fin-004-fca-innovation`

### FIN-005: CoinGecko / CoinMarketCap Research
- **Why:** Data platforms that list stablecoins. Our 425-asset index with chain deployment granularity exceeds most public lists.
- **Evidence:** 425 stablecoins, 1,640 deployments, 211 chains, $310.79B circulating
- **Approach:** "We maintain a stablecoin index with signed measurement cards covering 425 assets across 211 chains. Would you like access to our canonical deployment graph?"
- **Channel:** Research/data partnership contact
- **Attribution ID:** `fin-005-coingecko-research`

---

## Data / Infrastructure (5)

### DAT-001: Hugging Face Datasets Team
- **Why:** We host csoai/gspc-board on HF. They may be interested in the signed measurement format as a dataset pattern.
- **Evidence:** Live HF dataset, 335 signed cards, reproducible snapshot
- **Approach:** "Our dataset contains Ed25519-signed AI measurement cards with Merkle root inclusion proofs. Would a blog post about signed dataset patterns be interesting?"
- **Channel:** HF community/Discord
- **Attribution ID:** `dat-001-huggingface-datasets`

### DAT-002: Kaggle Datasets Team
- **Why:** Kaggle currently has no verified CSOAI dataset. Need to publish or explicitly leave out.
- **Evidence:** Reproducibility asset prepared
- **Approach:** Publish one canonical dataset (the 425-asset stablecoin index) or the GSPC board snapshot
- **Channel:** Kaggle dataset upload
- **Attribution ID:** `dat-002-kaggle-dataset`

### DAT-003: DefiLlama Team
- **Why:** Our stablecoin index derives from their API. Proper attribution and potential data partnership.
- **Evidence:** Index source: DefiLlama stablecoins API, source SHA-256 recorded
- **Approach:** "We built a signed measurement layer on top of your stablecoin index API. Proper attribution included. Would you like to see how we handle data provenance?"
- **Channel:** Discord/Twitter
- **Attribution ID:** `dat-003-defillama-attribution`

### DAT-004: Electric Capital / Developer Report
- **Why:** They track crypto ecosystem health. Our 211-chain stablecoin coverage is relevant data.
- **Evidence:** 211 chains, 425 stablecoins, chain deployment graph
- **Approach:** Share the index as reference data for their developer ecosystem reports
- **Channel:** Research team
- **Attribution ID:** `dat-004-electric-capital`

### DAT-005: NIST AI RMF Community of Interest
- **Why:** Open docket for Trustworthy AI in Critical Infrastructure profile. Our crosswalk maps all 4 NIST functions to GSPC axes.
- **Evidence:** NIST AI RMF crosswalk, 36 signed cards mapped to GOVERN/MAP/MEASURE/MANAGE
- **Approach:** Submit evidence-led mapping as community contribution (owner gate for submission)
- **Channel:** NIST mailing list / community Slack
- **Attribution ID:** `dat-005-nist-airmf-community`

---

## Agent Infrastructure (5)

### AGT-001: Anthropic MCP Team
- **Why:** MCP protocol maintainers. Our MCP server (12 tools, 8 free + 4 paid) is one of the few with x402 payment integration.
- **Evidence:** MCP Registry entry, 12-tool manifest, A2A parity, x402 self-test
- **Approach:** "Our MCP server implements x402 payment gating alongside standard free tools. Sharing the implementation pattern in case useful for the ecosystem."
- **Channel:** MCP Discord / GitHub
- **Attribution ID:** `agt-001-anthropic-mcp`

### AGT-002: Google A2A Team
- **Why:** A2A protocol maintainers. We have 7/7 A2A skill parity with MCP tools.
- **Evidence:** 12 A2A agent cards, skill parity confirmed
- **Approach:** "We've published A2A agent cards for all 12 MCP tools with full skill parity. Would a case study on MCP-to-A2A parity be useful?"
- **Channel:** A2A GitHub / Discord
- **Attribution ID:** `agt-002-google-a2a`

### AGT-003: Stripe Agent Toolkit Team
- **Why:** They're building agent payment infrastructure. Our x402 implementation is an alternative pattern.
- **Evidence:** x402 offer receipts, signed JWS EdDSA, 0.01 USDC pricing
- **Approach:** Not competitive — complementary. "We use x402 for micropayment-gated measurement data. Different approach to the same problem."
- **Channel:** Developer relations
- **Attribution ID:** `agt-003-stripe-agents`

### AGT-004: LangChain / LangSmith Team
- **Why:** Agent observability. Our signed measurement cards are a form of agent evidence.
- **Evidence:** Ed25519-signed cards, Merkle root, Rekor witness
- **Approach:** "We've built a signed evidence layer for AI measurement that could complement agent observability. Interested in exploring integration?"
- **Channel:** Discord / partnership
- **Attribution ID:** `agt-004-langchain-observability`

### AGT-005: Cloudflare Workers AI Team
- **Why:** They run AI inference at the edge. Our measurement infrastructure could evaluate their hosted models.
- **Evidence:** GSPC harness measures 155 models across 14 axes
- **Approach:** "We can measure Cloudflare Workers AI models on our 14-axis GSPC framework. Would signed measurement cards for your hosted models be useful?"
- **Channel:** Developer relations
- **Attribution ID:** `agt-005-cloudflare-ai`

---

## Tracking Fields per Contact

Each contact, when sent, must be logged with:
- `attribution_id`: unique identifier
- `sent_at`: ISO timestamp
- `channel`: exact channel used
- `evidence_cited`: which evidence was referenced
- `reply_received`: boolean + timestamp
- `sample_requested`: boolean
- `price_accepted`: boolean
- `settlement_type`: EXTERNAL_CUSTOMER / INTERNAL_SELF_FUNDED / ZERO_VALUE_PROBE / UNKNOWN
- `repeat_intent`: boolean

## Current State

| Metric | Count |
|--------|-------|
| Contacts prepared | 15 |
| Contacts sent | 0 |
| Replies received | 0 |
| Samples requested | 0 |
| Prices accepted | 0 |
| Paid pilots | 0 |
| External revenue | $0.00 |
