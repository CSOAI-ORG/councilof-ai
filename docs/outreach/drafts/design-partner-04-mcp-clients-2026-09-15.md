# Design Partner Approach 4: MCP Client Developers — "AI governance tools for your users"

**Status: DRAFT. Not sent. The owner sends.**
**Target:** MCP client developers (Cursor, Windsurf, Claude Desktop, Cline, Continue)
**Angle:** AI governance measurement tools available through MCP
**Verified:** All numbers carry proof commands.

---

**Subject line:** 13 MCP tools for AI governance — add measurement to your MCP client

Hi [team],

Council of AI publishes 13 MCP tools for AI governance measurement. Your users can add them to any MCP client with one line:

```
npx -y csoai-gspc-mcp
```

```
curl -s https://councilof.ai/.well-known/mcp.json | jq .measured
# → 13 tools (9 free, 4 metered)
```

**What we offer as a design partner:**

1. **9 free tools** — board totals, axis lookup, card verification, root inspection, inclusion proof. Your users get AI governance measurement for free.

2. **4 metered tools** — commission cards, Article 50 marking evidence, RWA evidence, receipt batches. x402 USDC on Base.

3. **A2A agent cards** — 12 discoverable agents at `/.well-known/agents/`. Your users' agents can discover and use our measurement tools.

```
curl -s https://councilof.ai/.well-known/agents/index.json | jq .count
# → 12
```

4. **Open source** — CC-BY-4.0. GitHub repo is public.

**What this is NOT:**

- Not a partnership announcement
- Not a certification
- Not a grade for sale — verification is free

Revenue: 0.02 USDC from one external payer. Pre-revenue.

Happy to provide integration examples or a demo.

Nicholas Templeman
CSOAI Ltd
hello@councilof.ai
