# Show HN: I built 211 MCP servers for EU AI Act compliance — pip install and go

**Title (60 chars):** Show HN: 211 MCP servers for EU AI Act compliance (99 days to Aug 2)

**Target:** news.ycombinator.com/submit → also cross-post to dev.to, LinkedIn, r/ClaudeAI, r/MachineLearning

**URL:** https://meok.ai (or the eu-ai-act checker once custom domain is live)

---

## Body

99 days out from the EU AI Act enforcement date (2 August 2026), I realised the hardest part of compliance isn't knowing what to do — it's knowing *which* of your AI systems actually needs it, which articles apply, and generating the paperwork. So I spent six months building MCP (Model Context Protocol) servers that do it automatically.

### The problem

If you run an AI system that serves EU users, on 2 August 2026 you're exposed to penalties up to **€35 million or 7% of global turnover** under the AI Act. A high-risk system (Annex III — hiring, credit scoring, healthcare, education, law enforcement) needs:

- Conformity assessment (Article 43)
- Risk management system (Article 9)
- Data governance (Article 10)
- Technical documentation (Article 11)
- Record-keeping / logging (Article 12)
- Transparency obligations (Article 13)
- Human oversight mechanism (Article 14)
- Accuracy, robustness, cybersecurity (Article 15)
- Post-market monitoring (Article 61)

Most of these are checklists, audit logs, and signed evidence trails. Exactly the kind of thing an LLM agent with the right tools can do in minutes.

### What I shipped

**211 MCP servers** on PyPI, all under MIT. Each one handles a specific regulation, framework, or control. Flagship ones:

```
pip install eu-ai-act-compliance-mcp        # risk classification + article-by-article audit
pip install iso-42001-ai-mcp                # ISO 42001 AIMS controls + Annex A gap analysis
pip install csoai-governance-crosswalk-mcp  # map controls across 13 frameworks at once
pip install ai-self-audit-mcp               # AI agents audit their own compliance + sign certs
pip install hipaa-compliance-mcp            # PHI detection + BAA tracking
pip install gdpr-compliance-ai-mcp          # DPIA + Article 22/30 automation
pip install soc2-compliance-ai-mcp          # Type II evidence automation
pip install risk-assessment-ai-mcp          # NIST AI RMF-aligned risk register
pip install meok-governance-engine-mcp      # orchestrator across all of the above
```

Plug any of these into Claude Desktop / Claude Code / Cursor / Cline and the agent can run compliance workflows as first-class tools.

### What it actually does, end to end

1. Agent calls `classify_risk(system_description)` — returns Annex I/III/limited/minimal + cited article
2. Agent calls `audit_articles(system_description, articles=["9","10","11","12","13","14","15"])` — returns per-article pass/fail + evidence gaps
3. Agent calls `generate_annex_iv_doc(system)` — spits a draft Article 11 technical documentation pack
4. Agent calls `get_certificate(system_name, evidence_hash)` — returns a signed compliance certificate for the audit trail

All 211 servers share a tier-auth middleware (free tier + £49/mo pro + £499/mo enterprise via Stripe) so you can meter if you want, or run locally for free.

### Why MCP and not a SaaS

Because compliance tools always end up needing to touch private data, and regulated teams can't send their AI system descriptions + training data to a third-party SaaS without making the compliance problem worse. MCP lets the tools run inside whatever agent stack the customer already trusts — Claude Desktop, Cline, Zed, their own Anthropic API app. I get paid for tooling, not for being yet another data processor.

### Stack

- Python + FastMCP
- SQLite for audit trails
- Stripe-webhook → tier unlock (free limits without a key)
- Deployed via PyPI / uv / pip, a few also on Smithery and Glama
- ~200 are wrapped with auto-generated OpenAPI too for non-MCP use

### Useful things I found while building

- The AI Act text is 144 pages but every high-risk obligation reduces to 7 decision trees and 2 document templates. Once you model those as tools, every article audit is basically the same code.
- Article 10 (data governance) is 80% of what actually breaks in audits — everyone's training data lineage is a mess.
- Claude (and GPT-4o, Gemini) are *really* good at running these audits once the MCP tool surface exists. The bottleneck was never the LLM — it was not having verbs for the agent to call.

### Call for help

If you're at a GRC consultancy doing EU AI Act work or an AI company racing the 2 August deadline, I'd love to hear what's missing. I've got 103 days and 211 servers — what's the one thing I could add that would unblock your audit?

Repo / docs: https://meok.ai  
PyPI: https://pypi.org/user/MEOK_AI_Labs/  
Free checker: https://meok.ai/check (no signup)  
Paid 48-h assessment: https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K

— Nicholas, MEOK AI Labs (UK, solo)
