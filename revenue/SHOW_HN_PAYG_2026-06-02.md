# Show HN draft — PAYG across 7 compliance MCPs (FINAL)

## Title (max 80 chars)

**Show HN: Pay-per-call EU compliance MCPs — £0.05/call, citation graph, FTS5**

(Alt: "Show HN: 7 EU compliance MCPs with universal pay-per-call (£0.05/call)")

## Url field

`https://pypi.org/project/eu-ai-act-compliance-mcp/`

(HN-recommended pattern: link to the project, not a marketing page.)

## Body

I run MEOK AI Labs — a small UK shop building MCP servers for EU regulatory compliance (EU AI Act, DORA, NIS2, CRA, CSRD, GDPR, ISO 42001). Today we shipped a universal pay-per-call layer across all 7 of them.

### Why it exists

Until last week, every install of these MCPs hit one of two walls:

1. **Free tier rate limit** (10 calls/day) — fine for testing, blocking for actual audits.
2. **£149-£999/mo subscription** to lift the cap — too much commitment for a one-off Annex IV doc generation or a single DORA incident report.

Two-thirds of the people emailing us asked "can I just pay per use?" — so we shipped it.

### How it works

```bash
export MEOK_PAYG_KEY="topup_xxxxxxxx"        # one-time setup
pip install -U eu-ai-act-compliance-mcp      # or any of the 6 siblings

# Every tool call now deducts £0.05 from your balance.
# When balance hits zero, the tool returns a top-up URL.
# Same token works across all 7 compliance MCPs.
```

The token lives in `~/.meok/payg_balance.json` (client-side, single-machine, server-side balance tracking in the works for fleet deployments). Default rate is £0.05/call, overridable via `MEOK_PAYG_RATE_GBP`.

USDC on Base L2 is also accepted via `MEOK_X402_RECEIVER` for agent-driven workflows that don't want to deal with Stripe.

### What's covered

| MCP | Latest | What it does |
|---|---|---|
| eu-ai-act-compliance-mcp | 1.7.0 | EU AI Act + 6-reg FTS5 search over 404 EUR-Lex articles + ISO 42001 crosswalk |
| dora-compliance-mcp | 1.4.0 | DORA pillars audit, RTS-compliant T+4h/T+72h/T+1mo incident templates |
| nis2-compliance-mcp | 1.3.0 | NIS2 entity classification, Article 21 audit, Article 23 incident reporting |
| cra-compliance-mcp | 1.3.0 | Cyber Resilience Act conformity, SBOM, vulnerability handling |
| csrd-compliance-mcp | 1.3.0 | Corporate Sustainability Reporting Directive scoping + assurance |
| gdpr-compliance-ai-mcp | 1.1.0 | GDPR DPIA + Article 33/34 breach reporting + lawful-basis classifier |
| iso-42001-ai-mcp | 1.1.0 | ISO/IEC 42001 AI Management System gap analysis |

All MIT-licensed. Source on GitHub. The compliance text is verbatim from publications.europa.eu Cellar (SPARQL-synced daily), so every quote is auditor-defensible.

### Architecture (FYI for the curious)

- **EUR-Lex SPARQL** → SQLite FTS5 → MCP tool. Daily sync via GitHub Actions, 7 consecutive successful runs as of today. ~400 articles across 6 regulations, every snippet carries a canonical EUR-Lex deep link.
- **Shared `auth_middleware.py`** does PAYG tier resolution before subscription fallback. ~80 LOC, all MCPs import it. PAYG balance file lives at `~/.meok/payg_balance.json` (single-machine; server-side balance for fleets is the next thing).
- **HMAC-SHA256 signed attestations** for compliance evidence — verifier hosted at `meok-attestation-api.vercel.app/verify`.
- **NEW (1.8.0):** `cross_references_for_article(regulation, article_number)` returns the full citation graph in one call — e.g. asking about GDPR Art 33 surfaces every article across all 6 regs that cites it (NIS2 Art 35, CSRD Art 29, etc.), each with a snippet and EUR-Lex deep link.

### Cost transparency

- **£0.05/call** is roughly cost + a thin margin. We considered free-with-attribution but compliance buyers actively distrust free.
- Bulk top-up tiers (£10 / £50 / £200) at councilof.ai/payg.
- The compliance text database is permanently free (MIT) — PAYG only gates the tools.

### What it's good for / not good for

**Good for:**
- One-off Annex IV documentation generation
- Pre-submission DORA incident report drafting
- ISO 42001 audit prep (the crosswalk tool maps your AIMS evidence to AI Act articles)
- AI agents that need compliance lookups but can't justify £149/mo

**Not good for:**
- Real-time critical-path compliance (use the £199/mo tier — guaranteed SLAs)
- Anything mission-critical without your own attestation key (Pro tier handles that)

### Asks

1. Honest feedback on the £0.05/call default — is that the right number for your team?
2. What other regulations should be next? (Asked-for so far: MiCA, NIST AI RMF, UK AI Bill, SEC cyber disclosure)
3. Anyone running fleet-scale agent workflows and want server-side balance tracking?

Repos: github.com/CSOAI-ORG/eu-ai-act-compliance-mcp (and the other 6 — same org)

Happy to answer questions / take complaints / quote articles back at you with FTS5 highlight markers.

---

## Posting checklist

- [ ] Wait until Tuesday or Wednesday 14:00-16:00 UTC (HN peak engagement)
- [ ] Don't link to a paid landing as the primary CTA — link to the GitHub org
- [ ] Be ready to answer in the first 90 min (HN ranking depends on early engagement)
- [ ] Have a pinned reply ready with the FTS5 + signed-attestation architecture deep-dive
- [ ] Don't argue with skeptics about pricing — let them try the free tier

## Why this works on HN

- Concrete code-first hook (`MEOK_PAYG_KEY` env var → working install)
- Real numbers (£0.05/call, 404 articles, 6 regulations, 7 MCPs)
- Honest "good for / not good for" section
- USDC option for the crypto-adjacent crowd
- Asks for feedback, not signups

## Why this might fail

- "Yet another compliance vendor" is a tired category
- £0.05/call may read as "too cheap to be real" or "still too expensive for hobbyists"
- HN's anti-pay-walling bias if the post reads as sales

Mitigation: lead with the technical architecture (SPARQL → FTS5), not the pricing.
