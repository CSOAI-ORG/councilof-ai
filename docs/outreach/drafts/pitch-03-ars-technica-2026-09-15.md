# Editor Pitch 3: Ars Technica — "MCP tools for AI governance, open source"

**Status: DRAFT. Not sent. The owner sends.**
**Target:** Ars Technica — deep technical, developer tools, open source
**Angle:** Open-source MCP/A2A measurement infrastructure, developer-facing
**Verified:** All numbers carry proof commands.

---

**Subject line:** 13 MCP tools, 12 A2A agents, 22 axes — open-source AI measurement you can verify yourself

Hi [editor],

Council of AI publishes open-source measurement tools for AI systems through three protocol surfaces: MCP (Model Context Protocol), A2A (Agent-to-Agent), and x402 (pay-per-request USDC). All artifacts are CC-BY-4.0 licensed.

```
curl -s https://councilof.ai/.well-known/mcp.json | jq .measured
# → 13 tools (9 free, 4 metered)

curl -s https://councilof.ai/.well-known/agents/index.json | jq .count
# → 12 A2A agent cards
```

The measurement covers 22 axes (governance, safety, provenance, continuity, and 18 more) with 335 signed measurement cards. Every card is signed under a DID (`did:web:csoai.org#board-attestation-1`), anchored in Bitcoin via OpenTimestamps, and committed to a Merkle root.

```
curl -s https://councilof.ai/api/press.json | jq '{cards: .signed_cards.indexed, root_leaves: .public_root.leaves, corrections: .corrections_this_window.total}'
```

The developer story: you can add `npx -y csoai-gspc-mcp` to any MCP client and get the measurement tools. The A2A cards are discoverable at `/.well-known/agents/`. The x402 rail charges USDC on Base for evidence bundles — verification is free.

The GitHub repo is public. The verification tool (`gspc-verify.mjs`) runs offline and produces a three-state verdict: VALID, INVALID, or UNCHECKABLE.

```
curl -s https://councilof.ai/signed/verify-card.mjs | head -5
# → the same verifier we run
```

Revenue is 0.02 USDC from one external payer. The company is pre-revenue and states this explicitly.

Happy to provide a technical walkthrough or access to the measurement methodology.

Nicholas Templeman
CSOAI Ltd
hello@councilof.ai
