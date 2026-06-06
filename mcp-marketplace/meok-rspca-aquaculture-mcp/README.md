<div align="center">

# MEOK RSPCA Aquaculture MCP

**RSPCA Assured farmed trout + salmon welfare compliance — gap analysis, audit packs, signed attestations**

[![PyPI](https://img.shields.io/pypi/v/meok-rspca-aquaculture-mcp)](https://pypi.org/project/meok-rspca-aquaculture-mcp/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![MEOK AI Labs](https://img.shields.io/badge/MEOK_AI_Labs-MCP_Server-purple)](https://meok.ai)

</div>

## Why this exists

UK retailers — M&S, Waitrose, Tesco Finest, Sainsbury's Taste the Difference — gate premium farmed-fish lines on RSPCA Assured certification. ~290 UK trout farms and the salmon supply chain currently pay £800-£2,500/yr per site to human consultants for the same compliance pack, year after year. The standards are public; the assessment logic is consistent. That makes this work programmable.

This MCP wraps:
- **Farmed Rainbow Trout standard** — version 2025.07 (July 2025 refresh)
- **Farmed Atlantic Salmon standard** — version 2024.05 (May 2024 refresh, including the 300+ new clauses, mandatory CCTV at slaughter, cleaner-fish welfare equivalence, non-medicinal sea-lice treatment priority)

## Tools

| Tool | Description |
|------|-------------|
| `list_standards` | Enumerate all RSPCA Assured clauses for trout or salmon, with section breakdown. |
| `lookup_clause` | Fetch a single clause by ID (e.g. `T-B1`, `S-I1`) — requirement text, evidence list, severity. |
| `gap_analysis` | Run farm operating data against the live standard; returns pass/fail per clause, severity-weighted score, top-5 remediation priority. |
| `compliance_score` | One-shot headline score (0-100) + RSPCA banding (gold / silver / bronze / fail) for dashboard widgets. |
| `audit_evidence_pack` | Generate a markdown audit pack in the format RSPCA Assured field assessors expect — farm identity, gap list, signature blocks. |
| `welfare_attestation` | Produce a signed welfare-attestation fingerprint via meok-attestation-api. Retailers / certifiers verify at meok.ai/verify. |
| `list_versions` | Return current standard versions, clause counts, source URLs, refresh windows. |

## Installation

```bash
pip install meok-rspca-aquaculture-mcp
```

## Usage with Claude Desktop

Add to your Claude Desktop MCP config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "meok-rspca-aquaculture": {
      "command": "python",
      "args": ["-m", "meok_rspca_aquaculture_mcp.server"]
    }
  }
}
```

## Example — trout farm gap analysis

```python
gap_analysis(
    species="trout",
    farm_data={
        "stocking_density_kgm3": 28,
        "tank_type": "raceway",
        "ph": 7.2,
        "dissolved_oxygen_mgl": 8.1,
        "ammonia_mgl": 0.01,
        "nitrite_mgl": 0.05,
        "water_temp_c": 14,
        "mortality_pct_day": 0.12,
        "has_vhp": True,
        "has_cctv_at_slaughter": True,
        "has_welfare_officer": True,
        "antibiotic_use_mg_pcu": 22,
    }
)
```

Returns: severity-weighted score, list of failing clauses, top-5 remediation priority. Feed the same `farm_data` into `audit_evidence_pack` to get a markdown pack ready to print and hand to the RSPCA assessor.

## Pricing

| Tier | Price | What you get |
|------|-------|--------------|
| Free | £0 | 30 calls/hour. List + lookup + score. No attestation. |
| Pro | £499/mo | Unlimited. Full gap analysis + audit pack + signed welfare attestations + attestation-api integration. |
| Enterprise | Custom | Pro + multi-site dashboard + RSPCA refresh-notification webhooks + dedicated assessor onboarding pack. |

Subscribe — £499/mo: [buy.stripe.com](https://buy.stripe.com/8x28wR0xS7su23X7ew8k90z)

## License

MIT © MEOK AI Labs

<!-- meok-moat-footer-v1 -->
---

## Pairs with MEOK Aquaculture Suite

This MCP slots into the wider MEOK aquaculture stack:

- **meok-asc-rspca-crosswalk-mcp** (£999/mo flagship) — One audit pack satisfies ASC + RSPCA + GlobalG.A.P. IFA Aquaculture v6. For Sainsbury's / Co-op 100% ASC commitments.
- **meok-uk-fhi-mcp** (£79/mo) — CEFAS Form AW1 lifecycle + APHA fish movements + Environment Agency discharge consents + IPAFFS imports.
- **meok-soil-assoc-organic-aqua-mcp** (£499/mo) — Soil Association GB Aquaculture 2026 standard + WOAH Aquatic Code Section 7 crosswalk.
- **meok-aquaponics-monitor-mcp** (£29/£79/mo) — Unified sensor schema across Atlas Scientific, Whitebox Tentacle, Seneye, GHL ProfiLux, Bluelab.
- **meok-laia-aquatic-mcp** (£29/mo) — England Animal Activities Licensing for ornamental and koi retailers.

```bash
# One-shot install of the aquaculture pack
npx meok-setup --pack aquaculture
```

→ Full catalogue: [meok.ai/aquaculture](https://meok.ai/aquaculture)
→ MEOK AI Labs: [meok.ai](https://meok.ai)

<!-- BUY-LADDER:START -->

## Get started

- **Free** — 30 calls/hour, no card. List standards, lookup clauses, headline score.
- **Pro £499/mo** — full gap analysis + audit-ready RSPCA evidence pack + signed welfare attestations → **[Subscribe](https://buy.stripe.com/8x28wR0xS7su23X7ew8k90z)**
- **Not ready to subscribe?** 30-min review of your RSPCA Assured setup — [book a call](mailto:nicholas@meok.ai?subject=RSPCA%20Aquaculture%20compliance%20review)

Verify any signed welfare attestation at <https://meok.ai/verify>.

<!-- BUY-LADDER:END -->

