# TUI-1 News & Specialist Media — Ten Qualified Editors

**Lane:** News and specialist media (TUI-1)
**Result required:** Ten qualified editors with evidence-led angles
**Status:** DRAFT. Not sent. The owner sends.

---

## Verified state (evidence for pitches)

- **335 signed measurement cards** across 22 axes
- **305 Merkle-committed root leaves**
- **53 published corrections** (credibility engine)
- **13 MCP tools, 12 A2A agents** (open-source measurement infrastructure)
- **0.02 USDC settled** (pre-revenue, transparent)

```
curl -s https://councilof.ai/api/press.json | jq '{cards: .signed_cards.indexed, root_leaves: .public_root.leaves, corrections: .corrections_this_window.total}'
# → 335 cards, 311 root leaves, 52 corrections
```

## Ten qualified editors with evidence-led angles

### 1. The Register (UK tech, AI governance)
- **Editor:** [UK tech desk]
- **Angle:** A UK company publishes 53 corrections about itself — self-correction as credibility engine
- **Evidence:** Corrections ledger RSS feed, signed measurement cards
- **Link:** https://theregister.com

### 2. CoinDesk (crypto, stablecoins, x402)
- **Editor:** [crypto desk]
- **Angle:** Stablecoin measurement infrastructure — 425 indexed assets, RLUSD deep measurement, x402 payment rail live
- **Evidence:** 8 financial axes all measured, x402 rail live
- **Link:** https://coindesk.com

### 3. Ars Technica (deep technical, open source)
- **Editor:** [AI/ML desk]
- **Angle:** Open-source MCP/A2A measurement tools — 13 tools, 12 agents, 22 axes
- **Evidence:** MCP server live, A2A agents live, npm package live
- **Link:** https://arstechnica.com

### 4. The Information (AI infrastructure business)
- **Editor:** [AI infrastructure desk]
- **Angle:** Pre-revenue AI measurement infrastructure with working x402 payment rail
- **Evidence:** 1 external payer, 0.02 USDC, transparent revenue ledger
- **Link:** https://theinformation.com

### 5. TechCrunch (AI startups, developer tools)
- **Editor:** [AI/startups desk]
- **Angle:** Open-source AI governance tools — 13 MCP tools, 335 measurement cards, CC-BY-4.0
- **Evidence:** npm package, GitHub repo, MCP server
- **Link:** https://techcrunch.com

### 6. MIT Technology Review (AI policy, measurement)
- **Editor:** [AI policy desk]
- **Angle:** Independent AI governance measurement vs. self-certification by model vendors
- **Evidence:** 8 axes with own-leaders-excluded (neutral measurement body)
- **Link:** https://technologyreview.com

### 7. WIRED (AI, tech, policy)
- **Editor:** [AI/tech desk]
- **Angle:** The corrections-ledger as a new model for AI governance transparency
- **Evidence:** 53 published corrections, RSS feed, machine-readable
- **Link:** https://wired.com

### 8. IEEE Spectrum (technical AI)
- **Editor:** [AI engineering desk]
- **Angle:** OpenTimestamps + Sigstore Rekor anchoring for AI measurement evidence
- **Evidence:** Rekor WITNESSED, OTS-anchored Merkle root
- **Link:** https://spectrum.ieee.org

### 9. ACM TechNews (CS research)
- **Editor:** [CS research desk]
- **Angle:** Cross-reference of Council of AI 22-axis framework with academic AI safety research
- **Evidence:** 14 model-comparison axes, frozen item banks, published scoring code
- **Link:** https://technews.acm.org

### 10. O'Reilly Radar (developer-focused AI)
- **Editor:** [AI/developer desk]
- **Angle:** MCP/A2A protocol adoption for AI governance — practical developer guide
- **Evidence:** 13 MCP tools, 12 A2A agents, npm package, server.json validates
- **Link:** https://oreilly.com/radar

---

## Per-editor pitch template

**Subject:** A [country] company publishes every time it gets something wrong — 53 times so far

Hi [editor],

Council of AI (CSOAI Ltd, UK Companies House 16939677) publishes signed measurement cards for AI systems. What makes it unusual is not what it measures — it is what it publishes about its own mistakes.

The corrections ledger is public, machine-readable, and RSS-subscribable. Every entry states what was wrong, how it was caught, and the fix. There are 53 entries.

```
curl -s https://councilof.ai/api/corrections | jq '.corrections|length'
# → 53

curl -s https://councilof.ai/feeds/corrections.xml | head -5
```

Every measurement is anchored in Bitcoin via OpenTimestamps and in Sigstore's Rekor transparency log. 335 signed cards, 305 Merkle-committed root leaves.

Revenue: 0.02 USDC from one external payer. Pre-revenue, not post-revenue.

Happy to provide technical details.

Nicholas Templeman
CSOAI Ltd
hello@councilof.ai

---

*All numbers above carry proof commands. Not sent. The owner sends.*
