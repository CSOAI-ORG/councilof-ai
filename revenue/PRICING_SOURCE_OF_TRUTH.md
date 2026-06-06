# MEOK/CSOAI — Pricing Single Source of Truth

**Last Updated:** 2026-05-21
**Authority:** This document overrides all other pricing docs. If any other file conflicts, THIS is correct.
**Source:** Live Stripe price IDs (verified 2026-05-21 against `mcp__stripe__list_prices`)
**Stripe mode:** ✅ LIVE (livemode=true). Balance: £0 available.

---

## Product line A — Per-MCP subscriptions

Customer subscribes to one specific MCP (e.g. EU AI Act Compliance).

| Tier    | Price       | Notes                                                            |
|---------|-------------|------------------------------------------------------------------|
| **Starter** | £29/mo  | Unlimited audits for that one MCP. HMAC-signed attestations. Email support. |
| **Pro**     | £79/mo  | Adds priority email support, monthly regulatory brief, custom-domain signing endpoint, 24h SLA on attestation requests. |

**Stripe price IDs (representative — same per-MCP across 38 MCPs):**
- EU AI Act Starter: `price_1TXaHqQvIueK5XpbcBjOjGyx` (£29) → product `prod_UWdV7ruC0v1vav`
- EU AI Act Pro: `price_1TXjTZQvIueK5XpbpOwFCjg6` (£79) → product `prod_UWn3mpbX5JR7Px`

**MCPs covered (38):** governance pack (10), a2a pack (6), trade pack (6), industry pack (9), cybersec pack (6), plus stand-alones (uk-ai-bill, cobol-bridge, watermarking-authenticity).

---

## Product line B — MCP subscription packs (bundle multiple MCPs)

Customer subscribes to a thematic bundle covering many MCPs.

| Pack    | Monthly | Annual (save ~17%) | Stripe Product   | Monthly Price ID                       |
|---------|---------|---------------------|------------------|----------------------------------------|
| **Core**       | £49/mo   | £470/yr  | `meok-core`        | `price_1TUKOtQvIueK5XpbLsnE5vJ5` |
| **Governance** | £149/mo  | £1,430/yr | `meok-governance`  | `price_1TUKOuQvIueK5XpbU2uVM87H` |
| **Security**   | £199/mo  | £1,910/yr | `meok-security`    | `price_1TUKOvQvIueK5XpbaANgKzER` |
| **Industry**   | £299/mo  | £2,870/yr | `meok-industry`    | `price_1TUKOwQvIueK5XpbM8AtgSxg` |
| **Defence**    | £499/mo  | £4,790/yr | `meok-defence`     | `price_1TUKOvQvIueK5Xpbx2PspAy6` |
| **COBOL Bridge Pro** | £199/mo | £1,910/yr | `cobol-bridge-pro` | `price_1TUKOwQvIueK5XpbVLs5ZbCU` |

### Target markets

| Tier | Who It's For |
|------|-------------|
| Core | Developers, startups, indie hackers — entry compliance |
| Governance | Enterprises, regulated industries, compliance teams |
| Security | Security teams, MSSPs, government |
| Industry | Infrastructure operators, utilities, regulators |
| Defence | Defence contractors, government agencies |
| COBOL Bridge Pro | Banks, insurance, government with COBOL systems |

---

## Product line C — Consumer companion AI (MEOK Sovereign)

Different product line — personal/family AI companion, **not** compliance MCPs.

| Tier       | Monthly | Annual    | Stripe Product           |
|------------|---------|-----------|--------------------------|
| **Explorer** | £0    | —         | (no Stripe — free tier)  |
| **BYOK**     | £5/mo  | —         | `prod_UMtUIhuvvkZT7k`    |
| **Sovereign** | £9/mo | £90/yr (save £18)  | `prod_UMtUnFkFbEVjrD`    |
| **Sovereign Pro** | £19/mo | £190/yr (save £38)  | (under Sovereign Annual) |
| **Family**   | £29/mo | £290/yr (save £58)  | `prod_UMtU2JtCzry0BC` / `prod_UMtUFh7ABnFmy8` |

These appear on `meok.ai/pricing` consumer-side. **Do not conflate with compliance Starter/Pro tiers** — different paywall, different audience.

---

## Product line D — One-time / fixed-scope services

| Product                                  | Price   | Payment Link                                              |
|------------------------------------------|---------|-----------------------------------------------------------|
| EU AI Act Compliance Toolkit (£199 one-off) | £199    | https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K |
| EU AI Act Article 50 Watermarking Kit     | £99     | (linked from /article-50-kit)                              |
| Asimov V8 Robot CAD Pack                  | £29     | https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K |
| 48-Hour Compliance Assessment             | £5,000  | https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K |
| Founder Consulting Day                    | (POA)   | `prod_UTyztrgd2sreud`                                     |
| MEOK Compliance Pack (£49 monthly link)   | £49/mo  | https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K |
| Enterprise All Access (£499 monthly link) | £499/mo | https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K |
| Germany NIS2 BSI Register — Self-Serve    | £99     | (linked from /nis2-de-register)                            |
| Germany NIS2 BSI Register — Done-For-You  | £499    | (linked from /nis2-de-register)                            |
| MEOK Compliance Audit-Prep Bundle (2-day) | (POA)   | `prod_UPY4jXso47J2my`                                     |
| Care Home Compliance Pack (quarterly)     | £199/qtr | `prod_UQFFRPctk82oVe`                                    |

---

## Product line E — Verticals (separate sites)

| Product                | Price       | Site / Stripe Product       |
|-----------------------|-------------|------------------------------|
| LandLaw Pro           | £199/mo     | landlaw-ai · `prod_USKqGoqTjSE7Bd` |
| OptiMobile Pro        | (POA)       | optimobile-site · `prod_USKqwVulbNWN45` |
| MuckAway Pro          | (POA)       | (MEOK trade vertical) · `prod_USKqNzabycOBP3` |
| GrabHire Operator Pro | (POA)       | (MEOK trade vertical) · `prod_USKq0tMMJKnQWh` |
| PlantHire Pro         | (POA)       | (MEOK trade vertical) · `prod_USKqV0vVqWH0ro` |
| CommercialVehicle Fleet Pro | (POA) | `prod_USKqeLMSFk16WZ`        |
| FishKeeper AI Pro     | £4.99/mo    | `prod_UPeiiddZNN0ysd`        |
| KoiKeeper AI Pro      | £7.99/mo    | `prod_UPeinFan85GUEm`        |
| KoiKeeper AI Premium  | £19.99/mo   | `prod_UPeiBg5nCpXiSw`        |

> Trade verticals (muckaway, grabhire, planthire) are being rebranded **into MEOK umbrella**, not into LoopFactory (decision recorded 2026-05-21).

---

## Bias Detection (continuous monitoring product)

| Tier                 | Price        | Stripe Product       |
|----------------------|--------------|----------------------|
| MEOK Bias Detection  | £299/mo      | `prod_UPZLiBLGjHRxF8` |
| MEOK Bias Detection Annual | £2,990/yr (saves £598) | `prod_UPdKfr9Bn30AIo` |

---

## ProofOf.ai (attestation verification)

| Tier         | Price          | Stripe Product       |
|--------------|----------------|----------------------|
| Pro          | £99/mo         | `prod_UPdAivukVrgKPm` |
| Enterprise   | £499/mo        | `prod_UPdAH4VwJIJJqK` |
| Per-cert     | (POA)          | `prod_UTyz3LQaF8tILE` |

---

## Annual bundles (legacy promo)

| Bundle                              | Price            | Stripe Product       |
|-------------------------------------|------------------|----------------------|
| MEOK Compliance Pro (Annual)        | £790/yr (saves £158)  | `prod_UPdKzL7ijL0ft7` |
| MEOK Compliance Enterprise (Annual) | £14,990/yr (saves £2,998) | `prod_UPdK6mwQW2IKOQ` |

> Enterprise Annual at £14,990/yr **= £1,249/mo** monthly-equivalent. This is what some landing pages mis-quote as "£1,499/mo" — the canonical figure is £14,990/yr or POA monthly.

---

## Landing /pricing simplified trio (overlays the per-MCP and pack models)

A simplified three-card structure appears on `meok.ai/pricing` for compliance:

| Card        | Price                  | Stripe price ID                                  | Backing product           |
|-------------|------------------------|--------------------------------------------------|---------------------------|
| **Free**       | £0 (GitHub link)    | n/a                                              | MIT-licensed MCPs         |
| **Pro**        | £79/mo (£790/yr)    | `price_1TQNeiQvIueK5XpbFB6iSl7P` (Pro monthly £79) | "MEOK Compliance Pro" `prod_UPC2arbANYFYsH` |
| **Enterprise** | £1,499/mo (£14,990/yr) | `price_1TPGoQQvIueK5XpbgZHn4D48` (Enterprise Monthly £1,499 2026 reprice) | "MEOK Compliance Enterprise" |

These are **live, working Stripe prices** — confirmed 2026-05-21. The £1,499/mo is the "2026 reprice" tier (up from earlier values). Annual saving math: 12 × £1,499 = £17,988 − £14,990 = £2,998 ✓.

## Three pricing models run in parallel — KNOWN ISSUE

There are currently three concurrent pricing models live on the site/Stripe:

1. **Per-MCP** (Starter £29/Pro £79) — used by individual MCP product pages
2. **Bundled packs** (Core £49 → Defence £499) — referenced in this SoT, no current landing surface
3. **Simplified landing trio** (Free / Pro £79 / Enterprise £1,499) — what /pricing shows

This is genuinely confusing for buyers. **Action for Nick:** decide on ONE model. Recommendation per MASTER_PLAN_2026-05-20.md is to consolidate on per-MCP Starter/Pro + one Enterprise tier — drop the Core/Gov/Sec/Ind/Defence pack carousel since no landing surface references it.

## Confirmed-removed

| Item | Status |
|------|--------|
| £499 MEOK Indie | Removed 2026-04-27 per audit. Confirmed gone. |

---

## Rules

1. **NEVER change prices without updating this file FIRST.**
2. **All Stripe price IDs must match this document.**
3. **If Stripe dashboard differs from this file, Stripe is wrong — fix it.**
4. **Landing pages reference this file.** If a price appears in `pricing-client.tsx`, `councilof.ai`, `meok-compliance.vercel.app`, or any storefront and is NOT listed above, it must be removed or this doc updated.
5. **Verify quarterly** that Stripe list_prices output matches this doc.

---

## Pricing history

| Date | Change | Notes |
|------|--------|-------|
| 2026-04-26 | Initial Stripe setup | 58 products created |
| 2026-04-26 | Pricing pivot | Added Indie tier (£499/yr), split NIS2 |
| 2026-05-05 | Temporary price change | Changed to £79/£99/£149/£199 — REVERTED |
| 2026-05-07 | Restored original prices | Back to £49/£149/£199/£499/£299/£199 |
| 2026-05-21 | **SoT refresh** | Added per-MCP Starter/Pro section, called out legacy £999/£1,499 figures for removal, confirmed live mode + £0 balance against Stripe API. |

---

## Stripe mode status

- **Current Mode:** ✅ LIVE (verified via `mcp__stripe__retrieve_balance` 2026-05-21)
- **GBP Available:** £0
- **GBP Pending:** £0
- **Live Key Location:** `~/.secrets/stripe_live.env` (exports `STRIPE_LIVE_KEY`)

---

## ✅ CANONICAL LIVE BUY LINKS — 2026-06-06 (SUPERSEDES every `00wfZjcg…90K`-as-everything reference above)
All verified active on live Stripe this date. **Use ONLY these** across pages, READMEs, storefront.

| Product | Price | buy.stripe.com/… |
|---|---|---|
| Pro (per-MCP / Compliance) **+ LAUNCH50** | £79/mo → £39.50 (50% off 6mo) | `4gMfZja8seUWbEx1Uc8k915?prefilled_promo_code=LAUNCH50` |
| Pro (plain) | £79/mo | `00wfZjcgAeUW4c5cyQ8k90K` |
| Enterprise | £1,499/mo | `7sY5kF3K4cMObEx2Yg8k917` |
| NIS2-DE Self-Serve | £99 once | `9B6eVf6WgeUWfUN2Yg8k91e` |
| NIS2-DE Done-For-You | £499 once | `00waEZ80kaEG0ZTdCU8k91f` |
| Article-50 Watermarking Kit | £999 once | `aFa14pfsMcMOdMF0Q88k91g` |
| Audit-Prep Bundle (2-day) | £4,950 once | `eVq9AV94o6oq23XdCU8k91h` |
| Smoke Test | £1 once | `fZubJ36Wg8wy5g98iA8k91d` |
| Care Home Pack | £150/mo | `3cIaEZfsMcMO9wp7ew8k83F` |
| PAYG top-up £10 / £50 / £200 | once | `dRmbJ33K4bIK9wp6as8k91a` / `4gM9AVbcw14638156o8k91b` / `fZu9AV4O8fZ0gYRgP68k91c` |

**☠️ DEAD — NEVER USE (caused the £0 / mischarges):**
- `7sY00l6WgbIK0ZTfL28k90Q` → £999/mo COBOL (was mislabeled as £49–£1,499 across 5 pages)
- `eVq7sN6Wg9AC3812Yg8k90R` → £4,990/mo COBOL Defence (was mislabeled £399)
- `dRmcN75Sc…90U` → old £1 smoke (deactivated; replaced by `…91d`)
