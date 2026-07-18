---
# Drop this into the meok.ai Next.js app as `app/aquaculture/page.mdx`
# or paste into the existing landing-page system. Hero copy is tuned for
# UK trout/salmon farm operators and ASC/RSPCA-gated suppliers.
title: "Aquaculture compliance, automated — RSPCA, ASC, GlobalG.A.P., CEFAS in one MCP stack"
description: "UK fish farms pay £800-£2,500/yr to human consultants for compliance packs. MEOK turns RSPCA Assured + ASC + GlobalG.A.P. + CEFAS + APHA + Environment Agency into one programmable surface. £79/mo to £999/mo."
canonical: https://meok.ai/aquaculture
schema:
  type: Service
  provider: MEOK AI Labs
  serviceType: Aquaculture Compliance Software
  areaServed: United Kingdom
---

# Aquaculture compliance, programmable.

## The 290-farm problem nobody is solving

There are ~290 UK trout farms. ~50 active salmon sites. ~83 ASC-certified UK farms (Oct 2025, +15% YoY). Thousands of LAIA-licensed ornamental retailers.

**Sainsbury's = 100% ASC.** **Co-op = 100% ASC by 2027.** **Tesco Finest, M&S, Waitrose = RSPCA Assured floor for premium farmed fish lines.**

Every one of those farms today pays £800-£2,500/year to a human consultant for a compliance pack — most of it the same evidence rewritten in three different formats for three different schemes. The standards are public. The assessment logic is consistent. **It is programmable.**

MEOK Aquaculture Suite is that program.

## The stack

| Product | What it does | Price |
|---------|-------------|-------|
| **meok-uk-fhi** | CEFAS Form AW1 (APB authorisation), APHA fish movements + IPAFFS imports, Environment Agency Site/Supplier/Bespoke EPR discharge/Abstraction permits, AAHR 2009 listed-disease notifications (KHV, ISA, IHN, VHS, SVC). Renewal calendar built-in. | **£79/mo** |
| **meok-rspca-aquaculture** | RSPCA Assured farmed trout (2025.07 refresh) + Atlantic salmon (2024.05 refresh — 300+ new clauses, mandatory CCTV at slaughter, cleaner-fish welfare, non-medicinal sea-lice). Gap analysis on your operating data. Audit-ready evidence pack for your assessor. Signed welfare attestation. | **£499/mo** |
| **meok-asc-rspca-crosswalk** | One evidence pack satisfies ASC + RSPCA + GlobalG.A.P. IFA Aquaculture v6. For farms supplying multiple retail channels. The flagship. | **£999/mo** |
| **meok-soil-assoc-organic-aqua** | Soil Association GB Aquaculture 2026 standard + WOAH Aquatic Code Section 7 welfare crosswalk. *Ships within 30 days of new standard publication.* | **£499/mo** |
| **meok-aquaponics-monitor** | Unified sensor schema — Atlas Scientific EZO, Whitebox Tentacle, Seneye, GHL ProfiLux, Bluelab, DFRobot. Species safe-range gates. Care-membrane-gated actuation. | **£29-£79/mo** |

## Bundles

| Bundle | Price | For |
|--------|-------|-----|
| Aquaculture Starter | **£79/mo** | UK FHI + LAIA. Small single-site UK fish farm. |
| Aquaculture Pro | **£499/mo** | Starter + RSPCA Assured + Soil Association. Single-scheme UK farm. |
| Aquaculture Enterprise | **£999/mo** | Pro + ASC-RSPCA-GG.A.P. Crosswalk. Multi-scheme retail-supplying farm. |

## How it works

1. **Connect your operating data** — water chemistry log, mortality records, movement docs, treatment register. Manual upload, CSV, or live via `meok-aquaponics-monitor-mcp`.
2. **Run gap analysis** against the live RSPCA / ASC / GG.A.P. / EA / CEFAS standards. Severity-weighted score. Top-5 remediation list.
3. **Generate audit pack** — markdown / PDF in the format your assessor expects, with signature blocks. Verified by signed attestation fingerprint that retailers can check at `meok.ai/verify`.
4. **Maintain calendar** — renewal warnings, monthly discharge returns, OWI audit reminders, AMU returns.

## Why MEOK and not a consultant

| Consultant | MEOK |
|------------|------|
| £800-£2,500/yr per site | £79-£999/mo, scales with sites |
| Annual audit + ad-hoc calls | Continuous; standard refresh = same-day update |
| Output: PDF pack in their format | Output: signed attestation + machine-verifiable + retailer-ready |
| Single-scheme expertise | RSPCA + ASC + GG.A.P. + CEFAS + EA + APHA in one tool |
| You compile evidence | We aggregate from your sensors + records automatically |
| No after-hours response | Live API + MCP server on your stack |

## What's underneath

- **A signed attestation chain.** Every pack carries a SHA-256 fingerprint; verify at `meok.ai/verify`. Built on `meok-attestation-api.vercel.app` — the same trust spine behind our DORA, NIS2, EU AI Act, ISO 42001 compliance MCPs.
- **Care membrane.** Every actuation (a dose pump, a feed-schedule change, a euthanasia decision) passes through Sovereign Temple's care validation layer before firing on live animals. This is fish welfare as substrate physics, not as an afterthought.
- **Open hardware option.** **MEOK PondSense v1.0** ships as the reference sensor rig — fork of OSHWA-certified Whitebox Labs Tentacle T1 MkII baseboard, IP67 PA12-CF printed enclosure. Hardware £180-£550 + 1yr Pro subscription bundled.

## Partnership credibility

- University of Stirling Institute of Aquaculture — welfare-indicator toolboxes integration (in discussion)
- OATA (Ornamental Aquatic Trade Association) — distribution channel for LAIA Aquatic MCP
- CEFAS Aquaculture Production Database — data licence and publishing-layer pitch

## Get started

- **[Start free trial — meok.ai/pricing](https://meok.ai/pricing)** — 10 free calls/day per MCP, no card.
- **[Talk to Nick — 15-min discovery call](mailto:nicholas@meok.ai?subject=Aquaculture%20discovery%20call)** — no pitch, walkthrough of where you currently lose hours to compliance.
- **[Full catalogue — meok.ai/catalogue](https://meok.ai/catalogue)** — 250+ MEOK MCPs across aquaculture, optometry, finance, AI safety governance.

---

*MEOK AI Labs · Built in the UK. The OS layer for regulated AI.*
