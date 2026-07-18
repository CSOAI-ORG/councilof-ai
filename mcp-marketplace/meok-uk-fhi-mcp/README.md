<!-- mcp-name: io.github.CSOAI-ORG/meok-uk-fhi-mcp -->
[![MCP Scorecard: 84/100](https://img.shields.io/badge/proofof.ai-84%2F100-5b21b6)](https://proofof.ai/scorecard/meok-uk-fhi-mcp.html)

<div align="center">

# MEOK UK FHI MCP

**The UK aquaculture regulatory stack — CEFAS + APHA + Environment Agency, in one MCP**

[![PyPI](https://img.shields.io/pypi/v/meok-uk-fhi-mcp)](https://pypi.org/project/meok-uk-fhi-mcp/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![MEOK AI Labs](https://img.shields.io/badge/MEOK_AI_Labs-MCP_Server-purple)](https://meok.ai)

</div>

## Why this exists

Every UK fish farm in England and Wales needs:
- A CEFAS-issued Aquaculture Production Business authorisation (Form AW1)
- Environment Agency Site Permit (Keeping and Introduction of Fish Regs 2015) for any stocking
- Environment Agency Bespoke EPR discharge permit for >5 t/yr production
- Environment Agency Abstraction Licence if drawing >20 m³/day
- APHA movement docs for every live transfer
- IPAFFS pre-notifications for any imports
- Notifications within 24 hours for KHV / ISA / IHN / VHS / SVC and other AAHR 2009 listed diseases

Today this is tracked on spreadsheets, in inboxes, and by retained consultants at £800-£2,500/yr per site. This MCP turns the whole stack into a single programmable surface.

## Tools

| Tool | Description |
|------|-------------|
| `list_permits` | List permits relevant to a species / activity (production, stocking, import, discharge, abstraction, movement). |
| `generate_aw1` | Pre-fill CEFAS Form AW1 — Aquaculture Production Business authorisation. Validates required fields. |
| `discharge_consent_check` | Test BOD / NH3-N / suspended-solids readings against EA EPR consent limits per receiving-water type. Returns monthly-return template. |
| `movement_document` | Issue an APHA-shaped fish movement document with auditable fingerprint and 3-year retention rule. |
| `ipaffs_check` | Pre-flight IPAFFS CHED-A pre-notification check for live-aquatic imports. |
| `disease_notification_check` | Determine notification window and mandatory actions for AAHR 2009 listed diseases (KHV, ISA, IHN, VHS, SVC, BKD, IPN, EHN, GS, OsHV-1). |
| `compliance_calendar` | Build a 12-month forward calendar of discharge returns, OWI audits, abstraction-renewal warnings, IPAFFS reviews. |
| `list_diseases` | Enumerate the UK listed-disease register. |

## Installation

```bash
pip install meok-uk-fhi-mcp
```

## Usage with Claude Desktop

```json
{
  "mcpServers": {
    "meok-uk-fhi": {
      "command": "python",
      "args": ["-m", "meok_uk_fhi_mcp.server"]
    }
  }
}
```

## Pricing

| Tier | Price | What you get |
|------|-------|--------------|
| Free | £0 | 30 calls/hour. Lookup tools only. |
| Pro | £79/mo | Unlimited. Full AW1 / IPAFFS / movement-doc generation + compliance calendar + signed audit fingerprints. |
| Enterprise | Custom | Pro + multi-site dashboard + auto-submission webhooks. |

[Subscribe — £79/mo](https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t)

## License

MIT © MEOK AI Labs

<!-- meok-moat-footer-v1 -->
---

## Pairs with MEOK Aquaculture Suite

- **meok-rspca-aquaculture-mcp** (£499/mo) — RSPCA Assured trout (2025.07) + salmon (2024.05) welfare moat.
- **meok-asc-rspca-crosswalk-mcp** (£999/mo flagship) — Single audit pack satisfies ASC + RSPCA + GlobalG.A.P. IFA Aquaculture v6.
- **meok-soil-assoc-organic-aqua-mcp** (£499/mo) — Soil Association GB Aquaculture 2026 + WOAH Sec 7.
- **meok-aquaponics-monitor-mcp** (£29/£79/mo) — Atlas Scientific / Whitebox Tentacle / Seneye / GHL ProfiLux / Bluelab unified sensor schema.
- **meok-laia-aquatic-mcp** (£29/mo) — England Animal Activities Licensing for ornamental + koi retailers.

→ Full catalogue: [meok.ai/aquaculture](https://meok.ai/aquaculture)
→ MEOK AI Labs: [meok.ai](https://meok.ai)

<!-- BUY-LADDER:START -->

## Get started

- **Free** — 30 calls/hour, no card. Permit lookup + listed-disease register.
- **Pro £79/mo** — AW1 / IPAFFS / movement-doc generation + 12-month compliance calendar + signed audit fingerprints → **[Subscribe](https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t)**
- **Not ready to subscribe?** 30-min review of your CEFAS / EA / APHA setup — [book a call](mailto:nicholas@meok.ai?subject=UK%20FHI%20compliance%20review)

Verify any signed audit fingerprint at <https://meok.ai/verify>.

<!-- BUY-LADDER:END -->

