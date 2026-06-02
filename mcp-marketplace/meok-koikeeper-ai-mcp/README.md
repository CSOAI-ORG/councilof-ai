<div align="center">

# MEOK KoiKeeper AI MCP

**Koi-pond MCP companion — varieties, diseases, seasonal feeding, winter prep. Powers koikeeper.ai.**

[![PyPI](https://img.shields.io/pypi/v/meok-koikeeper-ai-mcp)](https://pypi.org/project/meok-koikeeper-ai-mcp/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![MEOK AI Labs](https://img.shields.io/badge/MEOK_AI_Labs-MCP_Server-purple)](https://meok.ai)

</div>

## Why this exists

Koi keepers operate under a different rulebook to aquarium fish: bigger ponds, longer-lived fish (30-70 years), specialist disease list including **KHV (notifiable under AAHR 2009)** and Carp Edema Virus, and a feeding regime entirely gated on water temperature. This MCP is the koi-pond companion to `meok-fishkeeper-ai-mcp` and the brain behind `koikeeper.ai`.

## Tools

| Tool | Description |
|------|-------------|
| `identify_koi` | Look up koi by variety name (Kohaku, Sanke, Showa, Tancho, Asagi, Shusui, Bekko, Utsurimono, Goshiki, Ogon, Kumonryu, Doitsu Kohaku, Ginrin Kohaku, Chagoi) or by physical description. |
| `pond_stocking` | Pond stocking calc — 1000 L per adult koi rule adjusted for filtration, UV, aeration. |
| `seasonal_feeding` | Temperature-gated feed schedule — wheatgerm at 8-14°C, growth at 14-20°C, **NO FOOD below 4°C**. |
| `diagnose_koi_disease` | Diagnose by symptoms + temp window. Flags KHV as notifiable + provides CEFAS contact. |
| `winter_prep_checklist` | September → February UK winter-prep checklist (netting, aeration, salt overwinter). |
| `list_varieties` | All supported varieties + group classification. |

## Installation

```bash
pip install meok-koikeeper-ai-mcp
```

## Usage with Claude Desktop

```json
{
  "mcpServers": {
    "meok-koikeeper-ai": {
      "command": "python",
      "args": ["-m", "meok_koikeeper_ai_mcp.server"]
    }
  }
}
```

## Pricing (consumer ladder — match koikeeper.ai Stripe)

| Tier | Price | What you get |
|------|-------|--------------|
| Free | £0 | 30 calls/hour. Identify + variety lookup. |
| Pro | £7.99/mo | Unlimited variety/disease lookups + seasonal feeding + winter prep. |
| Premium | £19.99/mo | Pro + multi-pond profiles + KHV/disease early-warning push + private vet referral. |

[koikeeper.ai](https://koikeeper.ai)

## License

MIT © MEOK AI Labs

<!-- meok-moat-footer-v1 -->
---

## Pairs with MEOK Aquatic Suite

- **meok-fishkeeper-ai-mcp** — tropical/marine/coldwater aquarium companion
- **meok-aquaponics-monitor-mcp** (£29-£79/mo) — Sensor layer for koi-pond chemistry (pH/DO/NH3/NO2/NO3/temp)
- **meok-laia-aquatic-mcp** (£29/mo) — England Animal Activities Licensing for koi dealers + breeders
- **meok-uk-fhi-mcp** (£79/mo) — Step up to commercial-scale carp/koi compliance (KHV notification, EA permits)

→ Full catalogue: [meok.ai/aquaponics](https://meok.ai/aquaponics)

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

