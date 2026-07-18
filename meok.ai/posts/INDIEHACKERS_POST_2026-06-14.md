# IndieHackers post — 2026-06-14

## Title
Solo founder shipped 340+ compliance MCP servers. 60 days to EU AI Act cliff. Here's what I learned shipping regulation-as-code.

## Body
**TL;DR**: I'm Nick, solo founder of MEOK AI Labs. I spent 8 months building a fleet of 340+ standalone MCP servers — one per regulation. EU AI Act (410 articles), DORA, NIS2, CRA, GDPR, ISO 42001, SOC 2, HIPAA, FDA, MDR. All on PyPI, all MIT, all OpenSSF-wired.

**Why I'm posting here**: this is a founder build story, not a launch announcement. I want to share what I learned shipping solo, the revenue model, the brutalist approach to "one server per regulation," and what I'd do differently.

**The pitch in one line**: every AI agent will need a compliance layer by August 2 2026 (EU AI Act Article 50 cliff). I built the layer. It's a fleet of small packages, not a monolith.

**The origin story (the abridged version)**:
- May 2025: I started shipping a single MCP server for EU AI Act.
- June 2025: realised one server can't cover 410 articles.
- July 2025: shipped the `eu-ai-act-compliance-mcp` package with FTS5 over the actual EUR-Lex text.
- August 2025: customers kept asking for DORA, NIS2, CRA, GDPR, ISO 42001, SOC 2, HIPAA, FDA, MDR. So I built one server each.
- Dec 2025: 50 servers, 0 customers. Started learning the difference between "regulation-as-code" and "compliance theater."
- Jan 2026: pivoted to hash-chained audit trails + pay-as-you-go metering at proofof.ai/verify.
- Mar 2026: 200 servers. Stripe went live. £0 first 3 months.
- May 2026: 280 servers. UK Companies House 16939677. First £9 Sovereign subscriber.
- June 2026: 340 servers. 5,000+ PyPI downloads/week. **This is where I am now.**

**The five things I learned shipping solo**:
1. **One server per regulation beats one monolith**. Agents install only what they need. Versioning, security audit, and updates are independent. If Article 27 FRIA changes, you bump one package.
2. **The actual regulation text matters**. Every other compliance tool I tried was a ChatGPT prompt wrapped in a paywall. Anchoring to the EUR-Lex / FDA / NIST actual text is the moat.
3. **Hash-chained audit trails are a product feature**, not a compliance chore. Auditors and CISOs pay for verifiable proof, not for promises.
4. **The EU AI Act cliff is a forcing function**. 60 days out from Article 50 (transparency/watermarking). Every EU AI vendor needs a story by Aug 2.
5. **OpenSSF Best Practices badge is a sales tool**. The scorecard isn't just security theater — procurement teams use it.

**The revenue model** (in the open):
- Sovereign: £9/mo — 200 free verify calls/day
- Pro: £19/mo — 2,000 verify calls/day + multi-agent
- Family: £29/mo — team workspace
- Article 50 Kit: £999 — one-time, EU AI Act compliance package
- LAUNCH50: £499 — first 50 customers
- Quick Kit: £9 — sample
- Audit-Prep: £4,950 — pre-audit bundle
- Watchdog Cert: £4,950 — ongoing certification

**The numbers** (honest, not aspirational):
- 340+ servers
- 5,000+ PyPI downloads/week
- 0 customers paying > £0 last 24h
- 0 MRR so far
- 50+ public repos on CSOAI-ORG

**What I'd do differently**:
- I waited too long to start charging. £0 → £9 is harder than £0 → free → £9.
- I over-engineered the keystone. The meok-attestation-api is great but the value is in the packages, not the signing engine.
- I should have started the marketing in March, not June. The cliff is unforgiving.

**What's next**:
- Article 50 Kit — sales page is live at meok.ai/article-50-kit (£999)
- 19 GRC DPO cold emails queued
- Show HN post ready to fire
- Reddit r/MCPservers post ready to fire
- Full distribution kit in `meok.ai/posts/`

**Ask**:
- If you ship to EU customers, [try the EU AI Act MCP](https://pypi.org/project/eu-ai-act-compliance-mcp/) — it's MIT, free forever for the read path.
- If you want to chat about solo founder + compliance + MCP, my email's in the profile.
- Roast me on the pricing. I can take it.

— Nick, Yorkshire UK
UK Companies House: 16939677
Site: meok.ai
GitHub: github.com/CSOAI-ORG
