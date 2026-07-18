# HN / IndieHackers / Reddit Distribution Kit

Three pre-drafted posts for the 341-MCP launch. Pick ONE, customize the angle, hit submit.

---

## Post 1: Show HN — "I shipped 341 MCP servers for AI compliance in 90 days"

**Title:** Show HN: 341 MCP servers for AI agent compliance (EU AI Act, DORA, NIS2, …)

**Body:**

I built 341 MCP (Model Context Protocol) servers over 90 days. One per regulation, framework, or workflow that an AI agent might need to reference.

The idea: if you're building an AI agent that has to make a decision in the EU, you need to know what the actual EU AI Act says about that decision. Not a paraphrase, not a summary — the text. So I built MCPs that serve the real regulation text via FTS5 search.

**What works:**

- One server per regulation (EU AI Act, DORA, NIS2, CRA, GDPR, ISO 42001, …) — 14 of them, and another 30+ for industry verticals
- Deterministic: same input → same output, suitable for evidence packs and audits
- Audit-ready: hash-chained HMAC-signed audit log for every call (`agent-audit-logger-mcp`)
- Free tier: 200 calls/day on meok.ai without an API key
- PyPI: `pip install eu-ai-act-compliance-mcp` works

**The numbers:**

- 1,287 downloads/week for `eu-ai-act-compliance-mcp` (top of the fleet)
- 341 PyPI packages, 1,872 distinct tools across the fleet
- 36-node PBFT council substrate running on a separate VM, signs decisions with Ed25519

**What's hard:**

- The 2 August 2026 EU AI Act cliff is real. Practitioners are starting to scramble.
- No agent framework has shipped "compliance-first" as a first-class concern. I'm trying to.
- Phantoms on PyPI (3-script-bug cascade taught me to slow down before publishing 22 packages at once).

**Try it:**

```
pip install eu-ai-act-compliance-mcp
```

Then add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "eu-ai-act-compliance": {
      "command": "uvx",
      "args": ["eu-ai-act-compliance-mcp"]
    }
  }
}
```

Then ask Claude: "Classify this AI system: an EU healthcare diagnostic tool that triages radiology images."

It will return a structured `{risk_class, articles, evidence_required, obligations}` with the actual Article 5 + Annex III text cited.

**Honest about the limits:**

These are tooling, not legal advice. For final compliance, consult counsel in your jurisdiction. The MCPs are deterministic lookups; the human judgment is still yours.

Repo: [github.com/CSOAI-ORG](https://github.com/CSOAI-ORG)
PyPI: [pypi.org/user/MEOK-AI-Labs](https://pypi.org/user/MEOK-AI-Labs/)
Site: [meok.ai](https://meok.ai)

Happy to answer questions. If you have a regulation I should add, tell me.

---

## Post 2: IndieHackers — "Solo founder, 90 days, 341 MCPs, $X MRR"

**Title:** Solo founder hit 341 MCPs and X MRR in 90 days. Here's the play-by-play.

**Body:**

[Short-form, founder-to-founder. The story angle is: how a solo founder in Yorkshire built a 341-package compliance stack in 90 days.]

I'm Nick. I run MEOK AI Labs, a one-person company in Yorkshire, UK. 8 malamutes, koi pond, a workshop barn full of servers.

90 days ago I shipped my first MCP. Today I have 341 on PyPI. Here's what happened.

**The idea**

AI agents need to make decisions that comply with regulations. The default — call OpenAI and ask it what EU AI Act says — gives you a *plausible* answer, not a *correct* one. I built MCPs that serve the actual regulation text.

**The play-by-play**

Week 1-2: Built the first 14 compliance MCPs (EU AI Act, DORA, NIS2, CRA, GDPR, ISO 42001, …). GEO-rich PyPI descriptions. Publicly indexed.

Week 3-4: Added 30 industry-vertical MCPs (haulage, care homes, aquaponics, …). Cross-link each one to the compliance MCPs above it.

Week 5-8: Filled out to 200+ packages. Built the audit-logger MCP (hash-chained). Built the council substrate (36-node PBFT).

Week 9-12: Hit 341 packages. Wired the metering endpoint (`/verify`). Built the PhantomCheck panel. Hired no one.

**The numbers (live, today)**

- 1,287 downloads/week for the top package
- 341 PyPI packages, 1,872 tools
- 0 marketing budget, 0 paid acquisition
- All growth is PyPI search ranking + GitHub awesome lists + organic SEO

**The mistakes I made**

- Burned 2 weeks on a phantom-publish script with 3 bugs (silent-skip + capture_output=True + log-then-lie). Lost 22 packages to a per-PROJECT PyPI throttle. Lesson: verify scripts on 3 items before running on N.
- The "100/100 mass downloads" target was a vibe, not a metric. Realistic ceiling for a solo founder at 90 days: 1-3k/wk per top-10 package, 6-month compounding.
- 192 npm packages got squatted on `csga_global` (long story — severed brand, dead name). The fix is one 30-second password change. Still haven't done it.

**The plan for the next 90 days**

- Hit 2k/wk per top-10 package by 1 Aug 2026 (1 month before EU AI Act cliff)
- Submit to Apify MCP store (5,000+ actors indexed, pay-as-you-go)
- Get a backlink from OWASP, NIST, IAPP, ENISA
- Maybe hire #1

Ask me anything.

---

## Post 3: r/MCPservers / r/LocalLLaMA — "How I structured 341 MCPs as a compliance stack"

**Title:** How I structured 341 MCPs as a compliance stack (with the tradeoffs)

**Body:**

After building ~30 MCPs I realized I was building them in isolation. So I made a deliberate decision: one MCP per regulation, with cross-links to industry verticals above and audit primitives below.

**The stack (top to bottom):**

1. **Regulation MCPs** (14 packages) — `eu-ai-act-compliance-mcp`, `dora-compliance-mcp`, etc. Reference the actual regulation text from EUR-Lex / NIST / FDA via FTS5 search.
2. **Industry vertical MCPs** (30+ packages) — `haulage-uk-compliance-mcp`, `care-home-cqc-mcp`, `fda-samd-mcp`, etc. Reference regulation MCPs above them.
3. **Governance + audit MCPs** (10 packages) — `agent-audit-logger-mcp`, `ai-bom-mcp`, `explainability-report-mcp`, `bias-detection-mcp`. Cross-cutting, called by everything.
4. **Infrastructure MCPs** (5 packages) — `meok-council`, `sovereign-temple`, `meok-sdk-py`, `agent-mcp-router-mcp`, `meok-attestation-verify`. Provide substrate, routing, identity.

**The tradeoffs:**

- 341 packages is a LOT. PyPI ranking rewards focus, not breadth. The top-10 packages get 90% of downloads; the bottom-200 get <5/wk each.
- Maintenance is real. Every regulation update (and there are many) requires a wheel republish.
- "One per regulation" is the right abstraction at the regulation level but wrong at the article level. Article-level granularity would be 410 EU AI Act articles × 14 regulations = ~5,800 packages. That's a PyPI account ban waiting to happen.

**The lesson:**

The MCP protocol is the right primitive for "AI agent references real-world text" — but the *namespace* matters. If I'd called them all "compliance-mcp" with article-level tools, I'd have 5,800 tools in one package. Instead I have 341 packages, each with 5-20 tools. The tool count is the limit; the package count is just discovery.

**Question for the community:**

Anyone else doing "one MCP per regulation"? Or is the conventional wisdom to put all 410 EU AI Act articles into one big `eu-ai-act-mcp` with 410 tools? What's the right cardinality?

---

## Distribution checklist

For each post, follow up within 1 hour with substantive comments. Don't shill — actually engage.

| Channel | Format | Best time (UK) | Expected traffic |
|---------|--------|----------------|------------------|
| Show HN | Post 1 | Tue/Wed 14:00 BST | 2-10k visitors in 24h, 200-1k new users |
| IndieHackers | Post 2 | Thu 09:00 BST | 1-3k visitors, 50-200 new followers |
| r/MCPservers | Post 3 | Sat 16:00 BST | 1-5k visitors, 10-50 package installs |
| r/LocalLLaMA | Post 3 (variant) | Sat 16:00 BST | 5-20k visitors, 100-1k installs |
| r/MachineLearning | Post 3 (variant) | Sun 14:00 BST | 10-50k visitors, 500-5k installs |
| Hacker Newsletter | Submit Post 1 | Sun evening | 50-200k subscribers |

## Reply templates

**"How do you make money?"**

> Free tier (200/day) is enough for hobby + individual use. Paid tier is $29/mo (50k calls/day + audit ledger + priority support). MEOK is a UK Ltd — no investor, no ad-driven incentives. The model is: pay for the product or build it yourself, but the compliance evidence is the same.

**"Is this just a wrapper around ChatGPT?"**

> No. The MCPs are deterministic. They serve the actual EUR-Lex / NIST / FDA text via FTS5. Same query → same answer, every time. ChatGPT gives you a paraphrase. The MCP gives you the regulation with article IDs.

**"Why so many packages?"**

> Cardinality tradeoff. 341 packages × 5-20 tools = 1,872 tools, but each is in a focused namespace. If I put all 410 EU AI Act articles in one package with 410 tools, every agent would have to load all 410 just to ask about Article 9. Splitting them lets agents install only what they need.

**"What about the EU AI Act 2 Aug 2026 cliff?"**

> That's why I built the top-14 compliance MCPs first. 1,287 downloads/week for the top one is the metric I watch. Goal is 2k/wk per top-10 by 1 Aug 2026.

**"Is this legal advice?"**

> No. Tooling, not legal advice. Each guide and each MCP tool says this in the footer. For final compliance decisions, consult qualified counsel in your jurisdiction.

---

*Built by MEOK AI Labs · 2026-06-13 · distribution kit v1*
