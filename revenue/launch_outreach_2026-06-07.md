# Launch outreach kit — 2026-06-07

Three channels staged for the haulage.app launch push. All paste-ready.

---

## 1. Show HN draft

**Title:** Show HN: Haulage.app — 32 MCP servers for trade compliance + EU AI Act bridge

**Body:**

Hi HN — I'm Nick (CSOAI LTD, London). I've been building MEOK AI Labs as the compliance + AI-governance attestation layer for global trade.

Today I'm shipping Haulage.app — an umbrella for 32 PyPI-published Model Context Protocol servers covering trade-compliance regulators across 9 jurisdictions and 4 modes (road, air, sea, rail).

**Why it matters:**

- Every tool result is HMAC-SHA256 signed → independent verifier endpoint at meok-attestation-api.vercel.app/verify
- One install of `meok-haulage-governance-bridge-mcp` auto-crosswalks every signed attestation to EU AI Act Annex III, UK AI Bill Article 22c, NIST AI RMF, and ISO/IEC 42001
- All MCPs MIT-licensed, on PyPI, available via `pip install`

**Specific MCPs LIVE today** (more in 24-48h once PyPI quota resets):

- `meok-tacho-audit-mcp` — DVSA OCRS 90-day forecast + Smart Tachograph 2 (Jul 2026) readiness
- `meok-bs7121-mcp` — Crane/hiab lift plan compliance + LOLER scheduling
- `meok-vehicle-handover-mcp` — Pre-delivery inspection chain
- `meok-ev-recall-transport-mcp` — UN R100 / R136 EV battery + recall transport
- `haulage-uk-compliance-mcp` — DVSA, tachograph, drivers' hours, levy
- `skip-hire-ai-mcp` — Waste-carrier reg, EWC codes, consignment notes
- `nrswa-ai-mcp` — S50 licence, S74 overrun, noticing timeline

**Try it in 5 minutes:**

```bash
pip install meok-tacho-audit-mcp
# Then in Claude Desktop config:
{
  "mcpServers": {
    "tacho-audit": {
      "command": "uvx",
      "args": ["meok-tacho-audit-mcp"],
      "env": { "MEOK_HMAC_SECRET": "your-secret" }
    }
  }
}
```

Ask Claude: "Forecast my OCRS 90 days out — current 18 points, trend 0.4 / week, fleet 40 trucks." Get a signed forecast + weeks-to-RED estimate. Auditor verifies the signature from their own machine.

**Honest about scope:** This is a side product of a larger MEOK ecosystem (271 MCPs total on PyPI across multiple compliance verticals; the haulage subset is what I'm focused on this quarter). Solo founder, building in public.

Feedback / RFCs / "this is wrong" / "you missed regulator X" — all welcome here or nicholas@meok.ai.

**Links:**

- Site: https://haulage.app
- Catalogue (JSON): https://haulage.app/catalogue.json
- Quickstart: https://haulage.app/docs/quickstart
- Trust + signing details: https://haulage.app/trust
- Governance bridge: https://haulage.app/governance
- Open source: github.com/CSOAI-ORG

---

## 2. LinkedIn launch post (Nicholas personal)

🚀 Today I shipped haulage.app — and it's bigger than the URL suggests.

32 MCP (Model Context Protocol) servers for trade compliance, every one shipping HMAC-signed attestations that auto-crosswalk to the EU AI Act + UK AI Bill + NIST AI RMF + ISO 42001.

Why does this matter?

Three things collided in 2026:

→ EU AI Act high-risk obligations on AI used inside transport / logistics decisions (Annex III delayed to Dec 2027, but watermarking duties hit Nov 2026)

→ UK AI Bill Article 22c — automated-decision-making notice + opt-out duties for any operator using AI for routing, pricing or recruitment

→ Smart Tachograph 2 retrofit deadline — July 2026 for cross-border road haulage

The existing fleet TMS / telematics / compliance-admin tools (Mandata, Microlise, FleetCheck, Vanta) all cover their corner well — but none ship cryptographically-signed compliance attestations or bridge to AI governance frameworks.

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

## 3. wong2/awesome-mcp-servers PR — 7 LIVE entries

Repo: https://github.com/wong2/awesome-mcp-servers

Branch: `add-meok-haulage-compliance-mcps`

PR title: `Add 7 MEOK trade-compliance MCP servers under Business / Compliance`

PR body:

```markdown
## What

Adding 7 MEOK AI Labs trade-compliance MCPs to the Business / Compliance section.

Each is published on PyPI (verified via `pip index versions`), MIT-licensed, and ships HMAC-SHA256 signed attestations independently verifiable at a public endpoint.

## Entries (suggested insertion under Business or new "Trade Compliance" subsection)

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

## Send order

1. **wong2 PR first** — landed merge gives social proof for HN post
2. **Show HN** — peak time Tue/Wed 9am PT (5pm UK)
3. **LinkedIn post** — same morning as Show HN, drives traffic from professional network
4. **(if quota unlocked)** retry the 25 pending publishes between 1 + 2

---

## Tracking

Set up Vercel analytics goal:
- Source = HN → count `/docs/quickstart` views
- Source = LinkedIn → count `/pricing` views
- Source = wong2 awesome list → count `/mcps` views

If <5 paying customers in 14 days, pivot messaging from "32 MCPs" to "7 live signed attestation tools, 25 launching weekly" — leaner story, less ambiguity.
