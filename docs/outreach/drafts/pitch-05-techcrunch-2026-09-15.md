# Editor Pitch 5: TechCrunch — "Open-source AI governance tools"

**Status: DRAFT. Not sent. The owner sends.**
**Target:** TechCrunch — AI startups, developer tools, open source
**Angle:** Open-source AI governance measurement, developer adoption story
**Verified:** All numbers carry proof commands.

---

**Subject line:** A UK startup built open-source AI governance tools — 13 MCP tools, 335 measurement cards, 53 self-corrections

Hi [editor],

Council of AI (CSOAI Ltd, UK) has built an open-source AI governance measurement platform. The tools are available through MCP (Model Context Protocol), A2A (Agent-to-Agent), and x402 (pay-per-request USDC on Base).

```
curl -s https://councilof.ai/.well-known/mcp.json | jq .measured
# → 13 tools (9 free, 4 metered)

curl -s https://councilof.ai/.well-known/agents/index.json | jq .count
# → 12 A2A agent cards
```

The platform measures AI systems across 22 axes and publishes signed measurement cards. There are 335 cards in the index, 305 committed to a Merkle root anchored in Bitcoin.

The most interesting angle for TechCrunch: the corrections ledger. The company publishes every time it gets something wrong — 53 times so far. This is unusual for a measurement body.

```
curl -s https://councilof.ai/api/corrections | jq '.corrections|length'
# → 53

curl -s https://councilof.ai/feeds/corrections.xml | head -5
# → RSS feed
```

Revenue: 0.02 USDC from one external payer. Pre-revenue, not post-revenue. The company states this explicitly and excludes self-settlements from the count.

```
curl -s https://councilof.ai/api/press.json | jq .commercial_evidence
```

The GitHub repo is public. All artifacts are CC-BY-4.0. Verification is free and needs no account.

Happy to provide a demo or access to the measurement methodology.

Nicholas Templeman
CSOAI Ltd
hello@councilof.ai
