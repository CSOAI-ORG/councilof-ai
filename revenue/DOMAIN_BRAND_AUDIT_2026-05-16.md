# Domain + Brand Audit — 2026-05-16

28 domains audited. 10 LIVE, 14 PARKED, 4 DEAD. 6 different palettes across LIVE sites = brand consistency failure.

## Status table

| # | Domain | Status | Bucket | Notes |
|---|---|---|---|---|
| 1 | meok.ai | 307 → www | LIVE | Vercel, hub |
| 2 | csoai.org | 307 → www | LIVE | AI safety org |
| 3 | templeman-opticians.com | 200 | LIVE | Heritage optical, mod 7 May |
| 4 | cobolbridge.ai | 307 → www | LIVE | Gradient hero only — needs real content |
| 5 | proofof.ai | 200 | LIVE | Deepfake detection |
| 6 | councilof.ai | 200 | LIVE | Governance storefront (flagship) |
| 7 | planthire.ai | 200 | LIVE | Thin |
| 8 | muckaway.ai | 200 | LIVE | Thin (high-intent traffic potential) |
| 9 | grabhire.ai | 200 | LIVE | Thin |
| 10 | biasdetectionof.ai | 307 → /bias-detection | LIVE | £299/mo product |
| 11 | haulage.app | 302 | PARKED | URL forward only |
| 12 | **optomobile.ai** | DNS fail | **DEAD** | Nameserver issue — fix Namecheap DNS |
| 13 | **agriculture-robotics.ai** | DNS fail | **DEAD** | Nameserver issue |
| 14-23 | asisecurity / landlaw / commercialvehicle / loopfactory / pokerhud / fishkeeper / diyhelp / accountabilityof / dataprivacyof / transparencyof / ethicalgovernanceof / suicidestop / socialmediamananger / optimobile / agisafe | 200 / 307 | PARKED | Placeholder |
| 24 | safetyof.ai | 404 | DEAD | Route missing |

**Counts:** 10 LIVE · 14 PARKED · 4 DEAD

## Brand consistency: FAIL

LIVE sites use **6 different palettes** across:
- meok.ai (multi-pastel #3B82F6/#7BC47F/#F472B6/#c9a84c)
- cobolbridge.ai (#667eea/#f093fb gradient)
- councilof.ai (#60A5FA/amber/slate, Inter)
- biasdetectionof.ai (Inter + JetBrains Mono)
- trade trio (planthire/muckaway/grabhire) render via JS — no shared tokens

No SVG logo lockup found anywhere. csoai-org has JPG hero art, not a system.

## Top 5 — impact per hour

| Rank | Domain | Why now | MCP anchor | Action |
|---|---|---|---|---|
| 1 | **muckaway.ai** | Skip-hire = high-intent transactional, UK SMB CPC £3-8 | skip-hire-ai | Quote-form, postcode→price calculator, £49/lead |
| 2 | **planthire.ai** | Plant operators search daily, recurring B2B | nrswa-ai, chas-elite-prep | Compliance-gated booking + CHAS scorecard |
| 3 | **councilof.ai** | Already has £29/£79 Stripe products live | 6 governance MCPs | Bias-detection upsell, /audit-prep funnel |
| 4 | **cobolbridge.ai** | Banking/insurance pay £200k+/yr for legacy migration | cobol-bridge | "Free COBOL scan" lead magnet → £999 audit upsell |
| 5 | **biasdetectionof.ai** | EU AI Act Art 10 forcing function | bias-detection | Add /pricing + checkout (£299/mo product already exists) |

## Brand kit MVP — 1-day ship

Package as `@meok/brand-kit` npm + Tailwind preset:

### Tokens
```yaml
colors:
  primary: "#3B82F6"   # Anchor blue
  accent:  "#c9a84c"   # Templeman gold (heritage tie-in)
  ink:     "#0F172A"   # Slate-900
  paper:   "#F8FAFC"   # Slate-50
  success: "#7BC47F"   # Soft green
  warning: "#FB923C"   # Orange
```

### Type scale
- **UI:** Inter (already on biasdetectionof.ai)
- **Code:** JetBrains Mono
- **Hero (family pages):** Fraunces (warmth for Templeman family business)

### Component shell
- `<MeokHeader/>` + `<MeokFooter/>` React module
- Deploy to `meok-brand-kit.vercel.app`
- Import via npm in top-5 sites

### Voice & tone (1-pager)
- **British English**
- "Compliance with care"
- No exclamation marks
- Evidence-first (lead with the regulation, not the marketing)

### Logo lockup
- SVG wordmark + monogram (commission Fiverr £80, OR adapt existing Asimov mark from `~/clawd/god-eye/assets/`)
- Square + horizontal variants
- Dark + light backgrounds

## Top 5 immediate actions (next 7 days)

1. **Fix optomobile.ai + agriculture-robotics.ai DNS** at Namecheap (10 min — high-priority since these are intended LIVE properties)
2. **Ship `@meok/brand-kit`** npm package with tokens + components (3h)
3. **Deploy brand kit to muckaway.ai + planthire.ai + grabhire.ai** as a single PR (3h, unifies 7 of 10 LIVE)
4. **Convert cobolbridge.ai hero to "free COBOL scan"** lead magnet → £999 audit (4h, the highest-margin domain we own)
5. **Add /pricing + checkout to biasdetectionof.ai** (1h — product exists, just needs UI wire-up)

## Files

- `~/clawd/domain-portfolio-audit.md` — agent's full curl output
- `~/clawd/revenue/playbook_2026-05-14/09_THE_FAMILY_ASSETS_INVENTORY.md` — full asset list
- `~/clawd/marketing-assets/` — existing brand fragments
