---
title: "I built 38 MCP servers for EU AI Act compliance — here's what I learned"
published: false
description: "How one solo founder shipped 38 Model Context Protocol servers covering EU AI Act, DORA, NIS2, CRA, GDPR, and more — with cryptographically signed attestations."
tags: mcp, ai-governance, eu-ai-act, compliance, devtools
cover_image: https://meok.ai/og-image.png
---

# I built 38 MCP servers for EU AI Act compliance — here's what I learned

The EU AI Act has **7 concurrent regulatory cliff dates** between November 2026 and December 2027. Article 50 watermarking obligations kick in **2 December 2026** — that's 173 days from today. DORA is already in effect. NIS2 transposition deadlines are passing. CRA Annex IV requirements are live.

If you're shipping AI features into European markets, you need compliance tooling that works **today**, not in 18 months.

So I built it.

## What are MCP servers?

[Model Context Protocol](https://modelcontextprotocol.io) servers are standardized tool interfaces that AI agents (Claude, GPT, Cursor, Windsurf, etc.) can call directly. Think of them as **APIs for AI compliance** — your agent asks a question, gets a structured answer, and can act on it.

## The 38 governance MCP servers

I couldn't find a single tool that did **active compliance checking** (not just reference lookup) across EU regulations. So I built one for each major framework:

| # | Server | Regulation | Downloads/mo |
|---|--------|-----------|--------------|
| 1 | eu-ai-act-compliance-mcp | Reg (EU) 2024/1689 | 1,327 |
| 2 | bias-detection-mcp | Art 10 | 1,196 |
| 3 | ai-bom-mcp | Multi-reg | 1,034 |
| 4 | dora-compliance-mcp | Reg (EU) 2022/2554 | 842 |
| 5 | nis2-compliance-mcp | Dir (EU) 2022/2555 | 812 |
| 6 | cra-compliance-mcp | Reg (EU) 2024/2847 | 765 |
| 7-38 | + 31 more | DORA×NIS2, GDPR, UK AI Bill, MiCA, MiFID II, Basel III, HIPAA, SOC2, ISO 42001, NIST, etc. | ~2,500 |

**7,505 monthly downloads. 87 tools. All MIT-licensed.**

Unique feature: every Pro/Enterprise audit emits a **cryptographic HMAC-SHA256 attestation** with a public verification URL. Your auditor can verify the document hasn't been tampered with — without ever contacting us.

## How to use it

```bash
# Install everything in one command
npx meok-setup --pack governance

# Or install individual servers
pip install eu-ai-act-compliance-mcp

# Quick scan — no API key needed
# Just ask your AI agent:
"Classify this AI system under the EU AI Act: [description]"

# Full audit with signed attestation (Pro tier)
"Run a 42-point EU AI Act audit and generate a signed attestation"
```

## What I learned building 38 compliance MCPs

### 1. The regulation landscape is fragmented on purpose

Each EU regulation has its own risk taxonomy, reporting requirements, and penalty structures. DORA has 5 pillars. NIS2 has 10 Article 21 measures. The AI Act has a 4-tier risk classification. CRA has Annex IV essential requirements.

They don't overlap much — they **compound**. A bank using AI for credit scoring simultaneously falls under:
- EU AI Act (high-risk system)
- DORA (ICT resilience)
- NIS2 (essential entity)
- MiFID II (algorithmic trading)
- GDPR Article 22 (automated decision-making)

That's why we built crosswalk servers like `dora-nis2-crosswalk-mcp` that map compliance across frameworks.

### 2. FTS5 > LLM for regulation text

For the EU AI Act server, I loaded 410 articles from EUR-Lex into SQLite FTS5. When a user asks "What does Article 10 say about bias testing?", the server does a **full-text search** against the verbatim regulation text — not an LLM summary.

This matters because LLM summaries of legal text are **not auditor-defensible**. An auditor can verify that the article text matches EUR-Lex exactly. They can't verify what GPT hallucinated.

### 3. Attestations are the moat

There are compliance tools (Ansvar Systems has 61 EU regulations). There are scanning tools (ArkForge scans codebases for AI Act violations).

Nobody else does **cryptographic attestations with public verify URLs**.

This is the Vanta Trust Center pattern: the customer shares the attestation with their auditor, the auditor verifies it independently, and that audit process pulls them back to re-run monthly. Churn protection built into the compliance workflow.

### 4. Free tier matters more than you'd think

10 calls/day per MCP, no API key required. This isn't generosity — it's distribution. Every free-tier user who integrates our MCPs into their development workflow is a potential convert when their compliance needs exceed 10 calls/day.

### 5. The deadline is real

€34.7 million in AI Act fines were issued in May 2026. Article 50 watermarking compliance is mandatory by December 2, 2026. The market is moving from "we should probably start thinking about this" to "we need this yesterday."

## What's next

- Containerized self-hosted attestation API (for orgs that can't use external services)
- Ed25519 rotating key registry for stronger attestation signatures
- 4-language documentation (French, German, Italian, Spanish)
- Country-specific law packs (Germany, Netherlands, UK, France)

## Try it

```bash
pip install eu-ai-act-compliance-mcp
```

Or install the full governance pack:

```bash
npx meok-setup --pack governance
```

Free tier: 10 calls/day, no API key.
Pro tier: £79/mo, unlimited + signed attestations.

---

*Built by [MEOK AI Labs](https://meok.ai) in London. 38 governance MCP servers, all MIT-licensed. [GitHub](https://github.com/meok-ai-labs) | [PyPI](https://pypi.org/user/MEOK_AI_Labs/) | [Attestation API](https://meok-attestation-api.vercel.app)*