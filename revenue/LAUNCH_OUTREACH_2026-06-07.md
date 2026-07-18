# MEOK Launch Outreach Pack — 2026-06-07

Paste-ready content for the launch sprint. **Send from `nicholas@csoai.org` (MEOK AI Labs / CSOAI LTD, CH 16939677) — BRANDED EMAIL, NOT Gmail.** Use Mail.app (one-off) or `hive-mailer` (25/day from `hello@mail.meok.ai`, reply-to `nicholas@csoai.org`) or n8n (large personalised merges). The "Gmail drafts" line is deprecated — branded email is the rule.

---

## 1. Show HN draft

**Title:** Show HN: Haulage.app — 32 MCP servers for trade compliance + EU AI Act bridge

**URL:** https://haulage.app

**Body:**

Hi HN — I'm Nick (CSOAI LTD, London). I've been building MEOK AI Labs as the compliance + AI-governance attestation layer for global trade.

Today I'm shipping Haulage.app — an umbrella for 32 PyPI-published Model Context Protocol servers covering trade-compliance regulators across 9 jurisdictions and 4 modes (road, air, sea, rail).

**Why it matters:**

- Every tool result is HMAC-SHA256 signed → independent verifier endpoint at meok-attestation-api.vercel.app/verify
- One install of `meok-haulage-governance-bridge-mcp` auto-crosswalks every signed attestation to EU AI Act Annex III, UK AI Bill Article 22c, NIST AI RMF, and ISO/IEC 42001
- All MCPs MIT-licensed, on PyPI, available via `pip install`
- 14 locales (incl. RTL Arabic + simplified Chinese + Hindi + Japanese)
- Signed audit ledger live at `/api/audit` (HMAC chain re-verifiable)
- Webhooks: subscribe/unsubscribe/list with signed payload delivery
- ACP server endpoint for agent-to-agent compliance signing
- Python + TypeScript + Go SDKs · CLI · VS Code extension · Slack + Teams apps · Anthropic Skill + ChatGPT GPT + Microsoft Copilot manifests

**LIVE on PyPI today (7 MCPs):**

```
pip install meok-tacho-audit-mcp        # DVSA OCRS 90-day forecast + Smart Tachograph 2
pip install meok-bs7121-mcp             # Crane/hiab lift plan + LOLER + CPA triage
pip install meok-vehicle-handover-mcp   # Pre-delivery inspection chain
pip install meok-ev-recall-transport-mcp # UN R100/R136 EV battery transport
pip install haulage-uk-compliance-mcp   # DVSA, tachograph, drivers' hours
pip install skip-hire-ai-mcp            # Waste-carrier reg, EWC codes
pip install nrswa-ai-mcp                # S50 licence, S74 overrun
```

**5-minute quickstart:** https://haulage.app/docs/quickstart

**Honest about scope:** 25 MCPs are wheel-built + queued (PyPI new-account quota); 7 are pip-installable today. The signing + verifier infra is live and battle-tested. Solo founder, building in public.

Feedback / RFCs / "this is wrong" / "you missed regulator X" — all welcome here or nicholas@meok.ai.

**Links:**
- Site: https://haulage.app
- OpenAPI 3.1: https://meok-attestation-api.vercel.app/openapi.json
- Swagger UI: https://meok-attestation-api.vercel.app/docs
- Catalogue JSON: https://haulage.app/catalogue.json
- Trust + signing details: https://haulage.app/trust
- Governance bridge: https://haulage.app/governance
- Source: github.com/CSOAI-ORG

---

## 2. LinkedIn launch post

🚀 Today I shipped haulage.app — and it's bigger than the URL suggests.

32 MCP (Model Context Protocol) servers for trade compliance, every one shipping HMAC-signed attestations that auto-crosswalk to the EU AI Act + UK AI Bill + NIST AI RMF + ISO 42001.

Why does this matter?

Three things collided in 2026:

→ EU AI Act high-risk obligations on AI used inside transport / logistics decisions (Annex III delayed to Dec 2027, but watermarking duties hit Nov 2026)

→ UK AI Bill Article 22c — automated decision-making notice + opt-out duties for any operator using AI for routing, pricing or recruitment

→ Smart Tachograph 2 retrofit deadline — July 2026 for cross-border road haulage

The existing fleet TMS / telematics / compliance-admin tools (Mandata, Microlise, FleetCheck, Vanta) cover their corner well — but none ship cryptographically-signed compliance attestations or bridge to AI governance frameworks.

That's the gap haulage.app fills.

🟢 7 MCPs are pip-installable today (DVSA, tachograph, BS 7121, EV recall, FORS-prep, skip-hire, NRSWA)
🟡 25 more wheel-built + queued for PyPI (rate-limited new-account batch — releasing 5/day this week)

Every result you get from a MEOK MCP is signed. Every signature is publicly verifiable at meok-attestation-api.vercel.app/verify — no API key, no install needed. Auditors / regulators / customers verify your compliance chain from their own machine.

First 10 customers on the Pro tier get 50% off the first 6 months with code LAUNCH50.

Same-day onboarding from me directly: nicholas@meok.ai

🔗 https://haulage.app
🔗 https://haulage.app/docs/quickstart (5 min)
🔗 https://haulage.app/trust (how the signing works)

#EUAIAct #UKAIBill #TransportCompliance #DVSA #MCP #ModelContextProtocol #FleetCompliance

---

## 3. wong2/awesome-mcp-servers PR

Repo: https://github.com/wong2/awesome-mcp-servers

PR title: `Add 7 MEOK trade-compliance MCP servers under Business / Compliance`

PR body:

```markdown
## What

Adding 7 MEOK AI Labs trade-compliance MCPs to the Business / Compliance section.

Each is published on PyPI (verified via `pip index versions`), MIT-licensed, and ships
HMAC-SHA256 signed attestations independently verifiable at a public endpoint.

## Entries

- **[meok-tacho-audit-mcp](https://pypi.org/project/meok-tacho-audit-mcp/)** — UK DVSA OCRS 90-day forecast + Smart Tachograph 2 (Jul 2026) + Public Inquiry brief
- **[meok-bs7121-mcp](https://pypi.org/project/meok-bs7121-mcp/)** — Crane / hiab lift plan compliance + LOLER scheduling
- **[meok-vehicle-handover-mcp](https://pypi.org/project/meok-vehicle-handover-mcp/)** — Pre-delivery inspection + handover chain
- **[meok-ev-recall-transport-mcp](https://pypi.org/project/meok-ev-recall-transport-mcp/)** — UN R100/R136 EV battery + recall transport
- **[haulage-uk-compliance-mcp](https://pypi.org/project/haulage-uk-compliance-mcp/)** — DVSA, tachograph, drivers' hours, road-user levy
- **[skip-hire-ai-mcp](https://pypi.org/project/skip-hire-ai-mcp/)** — Waste-carrier reg, EWC codes, consignment notes, duty-of-care
- **[nrswa-ai-mcp](https://pypi.org/project/nrswa-ai-mcp/)** — S50 licence, works classification, S74 overrun, noticing timeline

## Why these belong here

- All MCP-protocol servers (FastMCP / Python)
- All MIT-licensed open source
- All PyPI-published (verified via `pip index versions <name>`)
- All emit signed attestations for audit-trail evidence
- Cover a category (physical-trade / transport compliance) not currently represented

## Sponsor

MEOK AI Labs / CSOAI LTD — Companies House 16939677
GitHub: github.com/CSOAI-ORG
Site: https://haulage.app
```

---

## 4. mcp.so submission queue

Use the issue-based submission flow at https://github.com/chatmcp/mcp.so/issues:

```yaml
# For each of the 7 LIVE MCPs:
name: meok-<slug>
title: <Human title>
description: <Tagline from haulage.app/catalogue.json>
github_url: https://github.com/CSOAI-ORG/meok-<slug>
pypi_url: https://pypi.org/project/meok-<slug>-mcp/
install: pip install meok-<slug>-mcp
category: business-applications
tags: [trade-compliance, hmac-signed, mcp, meok, haulage]
authors:
  - name: Nicholas Templeman
    email: nicholas@meok.ai
```

---

## 5. Outbound emails (5 drafts — BRANDED sender `nicholas@csoai.org`, NOT Gmail)

All drafts addressed to `nicholas@csoai.org` (MEOK AI Labs / CSOAI LTD, UK CH 16939677). The canonical master pack is `revenue/MASTER_OUTREACH_PACK_2026-06-10.md` — use that. Update `To:` per recipient before sending.

1. **Transport consultancy** — DVSA-OCRS-focused
2. **FORS auditor** — Bronze/Silver/Gold dossier offer
3. **UK fleet operator (mid-market, 25-100 trucks)** — Smart Tachograph 2 hook
4. **Crane / hiab operator** — BS 7121 + CPA Contract-Lift triage
5. **Cold-chain pharma operator** — GDP audit-pack offer

---

## Send order (recommended)

1. **wong2 PR first** — landed merge gives social proof for HN post
2. **mcp.so issues** — 7 issues, takes 20 min
3. **Show HN** — peak time Tue/Wed 9am PT (5pm UK)
4. **LinkedIn post** — same morning as Show HN
5. **Cold emails** — staggered throughout the week (1-2/day to avoid spam tag)

---

## Tracking

Set up Vercel Analytics goals:
- Source = HN → `/docs/quickstart` views
- Source = LinkedIn → `/pricing` views
- Source = wong2 awesome list → `/mcps` views
- LAUNCH50 promo code use → checkout completion (Stripe)

If <5 paying customers in 14 days, pivot to "7 live signed attestation tools, 25 launching weekly" messaging — leaner story, less ambiguity.
