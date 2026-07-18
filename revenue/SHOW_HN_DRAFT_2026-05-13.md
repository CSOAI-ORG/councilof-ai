# Show HN Draft — Ready to post when karma allows

## Title (≤80 chars)

`Show HN: 38 MCP servers for EU AI Act / DORA / NIS2 compliance with signed attestations`

## URL

`https://meok.ai`

## Body

I built this because every team I talked to handling EU AI Act compliance was juggling PDF binders, Word checklists, and one-off spreadsheets — then losing nights when their auditor asked "how do I verify this artifact wasn't fabricated last week?"

What it is:

- 38 MCP servers covering EU AI Act, DORA, NIS2, CRA, GDPR, ISO 42001, FDA SaMD, MDR, Basel, MiFID II, MiCA, COPPA, FERPA, UK haulage, CHAS, NRSWA, MITRE ATT&CK/ATLAS, SLSA, Sigstore, and more.
- The flagship `eu-ai-act-compliance-mcp` (v1.4.0) ships with 410 verbatim articles from EUR-Lex Cellar API in SQLite FTS5. No LLM summarization — every quote is auditor-defensible.
- Every Pro audit emits an HMAC-SHA256 signed cert with a public verify URL. Your auditor can independently validate at `https://meok-attestation-api.vercel.app/verify` without ever contacting me.
- Free tier: 10 calls/day, no API key. Pro: £79/mo, unlimited + signed certs. Enterprise: £1,499/mo, white-label.

Architecture is intentionally boring: FastMCP, stdlib SQLite, HMAC signing on a tiny Vercel function. Daily sync from EUR-Lex Atom feed runs in GitHub Actions.

One-shot install via:

```
npx meok-setup --pack governance
```

That writes Claude Desktop / Cursor / Windsurf configs in one command for the whole pack.

I'd love feedback on:
1. Whether the verbatim-text approach actually clears the "fabricated artifact" auditor objection, or if I'm overestimating that worry
2. Coverage gaps you'd want next (most-asked so far: FedRAMP, ISO 27701, CIS Controls)
3. Whether the Pro pricing (£79/mo) feels right for a compliance team that already spends £40k+ on a single audit cycle

Repo: https://github.com/CSOAI-ORG (38 repos)
MCP Registry: https://registry.modelcontextprotocol.io (search "MEOK" or "CSOAI-ORG")
Glama directory: https://glama.ai/mcp/servers/CSOAI-ORG/eu-ai-act-compliance-mcp (auto-listed)

---

## Posting timing

Best windows for Show HN:
- Tuesday-Thursday
- 14:00-16:00 UTC (peak US east morning + EU lunch)
- Avoid Mondays (Show HN deluge) and Fridays/weekends (low traffic)

## Karma prerequisite

Show HN requires ~50 karma typically. To build karma:
- Comment thoughtfully on 5-10 governance/compliance/MCP-related posts over 1-2 weeks
- Don't shill MEOK in those comments — be genuinely helpful
- Karma builds from upvotes on your comments

## Pre-launch checklist

Before clicking "submit":
- [ ] meok.ai homepage loads in <2s
- [ ] councilof.ai catalogue page works
- [ ] At least one .mcpb desktop extension available for download
- [ ] `pip install eu-ai-act-compliance-mcp` actually works from clean env
- [ ] Stripe profile complete (HN people WILL try to buy)
- [ ] Twitter account ready to thread the launch
- [ ] You have 2-3h to monitor + reply to comments

## Reply template for common comments

**"How is this different from <competitor>?"**
> Three things specifically: (1) verbatim FTS5 over the canonical EUR-Lex text — no LLM hallucinations on the citations; (2) HMAC-signed certs with a public verify URL your auditor can hit without contacting us; (3) one CLI installs the whole governance pack across all major MCP clients. Happy to compare any specific feature.

**"Why MCP and not just a REST API?"**
> Because customers want to plug compliance into their AI agents. A REST API is fine for ops dashboards, but if the AI agent is the one drafting the FRIA/Annex IV doc, it needs MCP. Both modes work — there's a hosted endpoint at meok-attestation-api too.

**"Is this just a thin wrapper over an LLM?"**
> No. The compliance scoring + classification logic is rule-based (no LLM inference at runtime). The 410 articles come from EUR-Lex's canonical Cellar API. The LLM you ask "do this audit for me" is the customer's own (Claude, GPT, whatever). MEOK is the toolset, not the brain.

**"What about [open source competitor]?"**
> [Acknowledge openly], then differentiate. Ansvar has more raw text breadth, ArkForge has codebase scanning — MEOK's wedge is the attestation + cross-MCP architecture. We're aiming for the system-of-record role, not the analysis tool.

---

## Twitter thread (post simultaneously)

1. Just shipped 38 MCP servers for EU AI Act, DORA, NIS2, CRA, GDPR + cybersec on PyPI. Live on Show HN: [HN URL]

2. The flagship has 410 verbatim articles from EUR-Lex SPARQL endpoint in SQLite FTS5. Daily sync via GitHub Actions. Every quote is auditor-defensible — no LLM hallucinations on citations.

3. The whole architecture is stdlib + tiny Vercel functions. HMAC-SHA256 signing on the cert means any third party can verify without contacting MEOK. Trust through math, not through "trust me".

4. One install: `npx meok-setup --pack governance`. Writes Claude Desktop / Cursor / Windsurf configs in one shot. Free tier: 10 calls/day, no key.

5. Why I built this: every compliance team I spoke to was using PDF binders + Word docs and losing nights when auditors asked "how do I verify this artifact?" Now there's an answer.

6. Roadmap: FedRAMP, ISO 27701, CIS Controls, white-label Trust Centers, Notified Body partnership. If you're in compliance + AI and want early access, hello@meok.ai.

Built by @nicholastempleman in London. £79/mo Pro tier, £1499 Enterprise. https://meok.ai

---

## State (2026-05-14)

- ✅ 38 MCPs on PyPI (with HMAC-signed README ownership markers)
- ✅ 38 repos under github.com/CSOAI-ORG (all auto-listed at glama.ai/mcp/servers/CSOAI-ORG/<name>)
- ✅ `npx meok-setup@1.0.1` installs all 38 via packs
- ✅ Per-MCP detail pages at meok.ai/mcp/<slug>
- ✅ PRs queued to 8 awesome-mcp-servers lists (~100K combined stars: punkpeye, appcypher, wong2, TensorBlock, Pipedream, rohitg00, Puliczek, MobinX)
- ⏳ Awaiting Official MCP Registry publish (queued, watcher armed)
- ⏳ Smithery namespace + MCPize integration (Nick-only steps)
