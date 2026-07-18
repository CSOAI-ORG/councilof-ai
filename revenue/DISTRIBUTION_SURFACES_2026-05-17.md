# 82 Distribution Surfaces — full enumeration
**Date:** 2026-05-17 · Compiled by deep-research agent

Every place an open-source compliance product should be listed, ranked by impact-per-minute.

---

## TOP 10 RANKED BY IMPACT-PER-MINUTE

1. **Publish 39 servers to Anthropic MCP Registry** — one script + GitHub OIDC, ~30min total. CANONICAL source every Claude/Cursor/Cline client mirrors. [registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io)
2. **Self-host /llms.txt + /llms-full.txt at meok.ai** ✅ — DONE 2026-05-17 (rewritten with full MCP catalog + 39 landing pages + Stripe deep-links). Live next deploy.
3. **Show HN Tuesday 14:00 UTC** — `revenue/SHOW_HN_POST_2026-05-17.md` ready. 5-50K visits possible in 24h.
4. **PR to wong2/awesome-mcp-servers + appcypher/awesome-mcp-servers** — 10 min each, permanent backlinks from top GH lists.
5. **Smithery.ai bulk publish** — `npx @smithery/cli publish` loop across 39 servers. Auto-feeds Cursor + Cline.
6. **6 "vs X" pSEO pages already live** (vanta, drata, sprinto, auditboard, credo-ai, holistic-ai, comp-ai, onetrust, servicenow-grc) ✅ — verified HTTP 200 all 9. Highest commercial-intent search terms.
7. **Edit Wikipedia "Artificial Intelligence Act" + "DORA" + "NIS2 Directive"** — one citation each, 30 min. Permanent training-data presence for every LLM.
8. **gov.uk Digital Marketplace G-Cloud 15 application** — 2h initial; opens £M of UK public-sector procurement.
9. **Add GitHub topics + SEO repo descriptions** to all 39 repos — 30 min batch script via `gh repo edit`.
10. **DEV.to article "I shipped 39 MCP servers for EU compliance"** — 45 min, evergreen SEO + cross-post to Hashnode/Medium.

---

## Category 1: MCP-specific registries (18 surfaces)

### High value (do this week)
- **Anthropic MCP Registry** · registry.modelcontextprotocol.io · OIDC API · ~10 min/server · free
- **mcp.so** · mcp.so/submit · form · 1-3 days · free · 200K+ MAU
- **Smithery.ai** · `npx @smithery/cli publish` · CLI · <1hr · free · Cursor/Cline auto-pull
- **Glama.ai** · auto-indexes GitHub w/ mcp.json · auto · 24h · free
- **Claude Code Plugin Directory** · claude.ai/plugins/submit · form · 7-21 days · free · DIRECT FUNNEL
- **Cursor MCP Marketplace** · cursor.com/mcp/submit · form · 3-7 days · free
- **Cline Extension Store** · github.com/cline/mcp-marketplace PR · PR · 2-10 days · free
- **awesome-mcp-servers (wong2)** · github.com/wong2/awesome-mcp-servers PR · 1-5 days · free
- **awesome-mcp-servers (appcypher)** · github.com/appcypher/awesome-mcp-servers PR · 1-7 days · free

### Medium value
- mcphub.io · mcpize · mcp-get.com · LangChain · LlamaHub · Continue.dev · PulseMCP · OpenTools

---

## Category 2: AEO surfaces (14)

### High value
- **Self-hosted /llms.txt + /llms-full.txt** ✅ DONE 2026-05-17
- **llmstxt.org directory** · PR · 1-3 days · free · canonical aggregator
- **Wikipedia citations** · edit EU AI Act + DORA + NIS2 articles · 30 min · permanent training presence
- **Stack Overflow** · answer Q's tagged eu-ai-act/dora/nis2 · instant · free · HIGH
- **r/MachineLearning [P] post** · Saturday weekly thread · HIGH
- **HuggingFace Spaces + Model Cards** · huggingface.co/new-space · HIGH (Claude crawls HF heavily)
- **GitHub awesome-* lists** · ~10 relevant lists in regtech/EU-AI-Act space
- **GitHub Topics on all 39 repos** · 30 min batch · HIGH

### Medium value
- HuggingFace papers · Quora topics · r/compliance · r/legalbusiness · r/EuropeanUnion · r/SaaS · r/CareUK

---

## Category 3: Product/Startup directories (13)

### High value
- **Hacker News Show HN** ✅ READY
- **Product Hunt** · Tue/Wed 12:01am PT launch · planned post-HN
- **AlternativeTo "AI Tools"** · alternativeto.net/software/new · HIGH SEO

### Medium
- Indie Hackers · Sifted (EU tech press) · BetaList ($129 fast) · Fazier · Toolify ($49 priority)
- There's An AI For That · FutureTools · AI Library · AI Search Buddy

---

## Category 4: B2B / compliance directories (12)

### Highest for UK gov revenue
- **gov.uk Digital Marketplace G-Cloud 15** · 2h initial · 60-120 days review · FREE · £M public sector

### High
- **G2** · 7-21 days · buyer-intent searches
- **Capterra** · 7-14 days · Gartner-owned trust
- **Crunchbase** · 3-7 days · every investor checks
- **GetApp / Software Advice** · auto from Capterra
- **TrustRadius** · 14-21 days

### Medium
- GovTech directory · ComplianceAI · EU Digital SME Alliance · EU TED tenders

---

## Category 5: Developer attention (10)

### High
- **DEV.to** · #mcp #compliance #opensource · HIGH SEO + community
- **Lobste.rs** · invite-only · quality dev crowd
- **Substack** · own newsletter for direct list-building
- **HN main feed** · Ask HN evergreen

### Medium
- Hashnode · Medium publications · GitHub Discussions · Mastodon (fosstodon)

---

## Category 6: Programmatic SEO + backlinks (15)

### Highest (already done) ✅
- /vs-vanta, /vs-drata, /vs-sprinto, /vs-auditboard, /vs-credo-ai, /vs-holistic-ai, /vs-comp-ai, /vs-onetrust, /vs-servicenow-grc — ALL HTTP 200

### High value adds
- SaaSworthy · Crozdesk · Slashdot Software · SaaSHub · StackShare
- AlternativeTo (add to each competitor's "alternatives" page)
- BuiltWith profile claim (passive, free)

---

## Outstanding execution plan (autonomous + Nick-action split)

### Claude autonomous (this turn or next 24h):
1. ✅ Rewritten /llms.txt + /llms-full.txt (commit + deploy needed)
2. Build `batch_registry_submit.py` — auto-submit 39 MCPs to: Anthropic Registry (when mcp-publisher re-auth), mcp.so, smithery, glama
3. Build `add_github_topics.sh` — `gh repo edit --add-topic` for all 39 repos
4. Generate DEV.to article + Hashnode + Medium variants from existing content
5. Draft Wikipedia citation edits for EU AI Act / DORA / NIS2 articles (Nick must submit — needs Wikipedia account)
6. Draft AlternativeTo / G2 / Capterra / Crunchbase submission emails

### Nick actions (priority order):
1. Show HN Tue 14:00 UTC (5 min)
2. Send the 9 cold emails (1-2h)
3. mcp-publisher login github (1 min) → unlocks Claude registry batch
4. Sign up DeepSeek + Gemini + Grok + Qwen + MiniMax (15 min)
5. Anthropic billing top-up (3 min)
6. G2 + Capterra + Crunchbase + AlternativeTo profile creation (30 min total)
7. Wikipedia + Quora + Stack Overflow profile (~ free, ongoing)
8. gov.uk Digital Marketplace registration (2h, but £M ceiling)
9. Product Hunt launch (post-HN success — Tue/Wed 12:01am PT)
10. LinkedIn account recovery (10 min unblocks 80+ drafted DMs)

---

*Generated 2026-05-17 by deep-research agent. Update as items complete.*
