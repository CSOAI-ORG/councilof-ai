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

[Sign up at meok.ai/pricing](https://meok.ai/pricing)

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

## 💸 Try MEOK in 30 seconds — instant buy ladder

| Tier | Price | What you get | Stripe |
|---|---|---|---|
| Smoke test | **£1** | Signed sample MCP-Hardening report + Article 50 PDF | <https://buy.stripe.com/dRmcN75ScdQS7oh1Uc8k90U> |
| Quick Kit | **£9** | EU AI Act Article 50 implementation guide (C2PA + EU-Icon) | <https://buy.stripe.com/cNi00la8s1460ZT0Q88k90V> |
| Founder Call | **£29** | 30-min 1-on-1 with the founder | <https://buy.stripe.com/8x228ta8s6oqbExaqI8k90W> |

> Refundable. UK Stripe — VAT-clean. Builds on the 81-MCP MEOK fleet.
> Verify any signed report at <https://meok.ai/verify>.

<!-- BUY-LADDER:END -->

