# M2 E2E Revenue Checklist — All Businesses
## Single Source of Truth | 2026-05-31
### 300+ GitHub repos | 21 domains | 28 PyPI packages | 20 Stripe products | £0 revenue

---

## HOW THIS WORKS

Each business below has an E2E pipeline:
```
Source (GitHub/Lovable) → Live Domain → Stripe Checkout → PyPI/npm → Revenue
```

**Status markers:**
- ✅ Done and verified
- ⏳ In progress
- ❌ Blocked (note why)
- ⬜ Not started

---

## 1. CSOAI.ORG — The Governance Institution

**Repos:** `CSOAI-ORG/csoai-org` (HTML), `CSOAI-ORG/csoai-dashboard` (TS)
**Domain:** csoai.org → www.csoai.org ✅ 200
**Stack:** 172-page static HTML on Vercel, React dashboard pending
**Revenue:** £1,499/mo Enterprise certification
**PyPI:** — | **npm:** — 

| Step | Status | Action |
|------|--------|--------|
| Domain live | ✅ | csoai.org 200 |
| Content (172 pages) | ✅ | Charter, frameworks, certify, ASTI all deployed |
| Stripe checkout wired | ⬜ | Need to add Payment Link to certify page |
| Certification flow | ⬜ | Buy → Stripe → issue CSOAI cert badge |
| Dashboard deploy | ⬜ | React dashboard at `app.csoai.org` — 178 TSX files built |
| Revenue | ❌ £0 | Need one enterprise certification sale |

---

## 2. COUNCILOF.AI — AI Governance SaaS

**Repos:** `CSOAI-ORG/councilof-ai` (TS/Next.js)
**Domain:** councilof.ai ✅ 200
**Stack:** Next.js 15 on Vercel, Stripe prices configured
**Revenue:** £79/mo Pro, £499/mo Enterprise
**PyPI:** — | **npm:** —

| Step | Status | Action |
|------|--------|--------|
| Domain live | ✅ | 200 OK |
| Pricing page exists | ✅ | Service tiers listed, but env vars not set |
| Stripe checkout wired | ✅ | Payment Link created: `buy.stripe.com/14A4gB...` |
| Pro tier active | ✅ | But not deployed — Vercel deploy blocked |
| Deploy updated pricing | ❌ | Vercel "Not authorized" — need token refresh |
| First customer | ❌ £0 | Need to sell 1 Enterprise seat (£499/mo) |

---

## 3. SAFETYOF.AI — AI Safety Compliance

**Repos:** `CSOAI-ORG/safetyofai` (TS/Next.js)
**Domain:** safetyofai.com (308 → works), safetyof.ai ✅ 200
**Stack:** Next.js 15 on Vercel
**Revenue:** £299/mo Full Compliance Audit
**PyPI:** — | **npm:** —

| Step | Status | Action |
|------|--------|--------|
| Domain live | ✅ | Both safetyofai.com and safetyof.ai work |
| Content | ✅ | Full site with pricing, scanner, dashboards |
| Free scan → Paid audit | ✅ | Payment Link: `buy.stripe.com/aFa14p...` |
| TypeScript build errors | ❌ | `npm run build` fails — need to fix before deploy |
| First audit sale | ❌ £0 | Need 1 sale at £299 |

---

## 4. PROOFOF.AI — Deepfake Detection

**Repos:** `CSOAI-ORG/proofof-ai` (TS), `CSOAI-ORG/proofof-ai-mcp` (Python)
**Domain:** proofof.ai → www.proofof.ai ✅ 200 (via redirect)
**Stack:** Cloudflare site
**Revenue:** £5/cert Pay-as-you-go, £199/mo Pro
**PyPI:** `proofof-ai-mcp` — ⚠️ NOT published | **npm:** —

| Step | Status | Action |
|------|--------|--------|
| Domain live | ✅ | 200 OK |
| Content | ✅ | Full site with pricing, verify, demo |
| Stripe products | ✅ | £5/cert + £199/mo prices configured |
| Stripe checkout wired | ⬜ | Need to add buy button to pricing page |
| PyPI publish | ⬜ | proofof-ai-mcp not on PyPI |
| First sale | ❌ £0 | |

---

## 5. DIYHELP.AI — DIY Assistant (LOVELABLE)

**Repos:** `CSOAI-ORG/diyhelp` (GH, M4 source pushed)
**Domain:** diyhelp.ai ❌ 000
**Stack:** Next.js 15 on Lovable
**Revenue:** Lead gen → upsell
**PyPI:** — | **npm:** — | **Lovable:** ✅ Project exists

| Step | Status | Action |
|------|--------|--------|
| Lovable project | ✅ | "diy-smart-guide" exists |
| GitHub repo | ✅ | `CSOAI-ORG/diyhelp` with M4 source |
| Domain live | ❌ 000 | Needs Lovable deploy + DNS |
| Connect Lovable to GH | ⬜ | Need Lovable GitHub App on CSOAI-ORG |
| Strip checkout | ⬜ | Add after deploy |
| Revenue | ❌ £0 | |

---

## 6. LOOPFACTORY.AI — Creative Loop Marketplace (LOVELABLE)

**Repos:** `CSOAI-ORG/loopfactory` (GH, M4 source pushed)
**Domain:** loopfactory.ai ❌ 000
**Stack:** Next.js 15 on Lovable
**Revenue:** Marketplace commissions
**PyPI:** — | **npm:** —

| Step | Status | Action |
|------|--------|--------|
| Lovable project | ✅ | "loopfactoryai" exists |
| GitHub repo | ✅ | `CSOAI-ORG/loopfactory` with M4 source |
| Domain live | ❌ 000 | Needs Lovable deploy |
| Connect to GH | ⬜ | GH App install needed |
| Marketplace scaffold | ✅ | Next.js scaffold in `clawd/loopfactory-marketplace/` |
| Revenue | ❌ £0 | |

---

## 7. POKERHUD.AI — Poker Analytics (LOVELABLE)

**Repos:** `CSOAI-ORG/pokerhud` (GH, M4 source pushed)
**Domain:** pokerhud.ai ❌ 000
**Stack:** Next.js 15 on Lovable
**Revenue:** Freemium → £9/mo Pro
**PyPI:** — | **npm:** —

| Step | Status | Action |
|------|--------|--------|
| Lovable project | ✅ | "learn-poker-smart" exists |
| GitHub repo | ✅ | `CSOAI-ORG/pokerhud` with M4 source |
| Domain live | ❌ 000 | Needs Lovable deploy |
| Content | ✅ | Metadata already has correct brand |
| Revenue | ❌ £0 | |

---

## 8. SUICIDESTOP.AI — Crisis Support (NON-COMMERCIAL TRUST)

**Repos:** `CSOAI-ORG/suicidestop` (GH, M4 source pushed)
**Domain:** suicidestop.ai ✅ 200
**Stack:** Next.js 15 on Vercel
**Revenue:** NON-COMMERCIAL — Held in trust
**PyPI:** — | **npm:** —

| Step | Status | Action |
|------|--------|--------|
| Domain live | ✅ | 200 OK |
| GitHub repo | ✅ | Source on GH |
| Content | ✅ | Crisis page live |
| Monetize | ❌ NEVER | Trust-held non-commercial domain |

---

## 9. FISHKEEPER.AI — Aquaponics AI (LOVELABLE)

**Repos:** `CSOAI-ORG/fishkeeper` (GH, M4 source pushed)
**Domain:** fishkeeper.ai ✅ 307 → www.fishkeeper.ai ✅ 200 → meok.ai redirect
**Stack:** Next.js/Lovable
**Revenue:** Redirect to meok.ai
**PyPI:** `fishkeeper-ai-mcp` exists | **npm:** —

| Step | Status | Action |
|------|--------|--------|
| Lovable project | ✅ | "fishkeeperai" exists |
| GitHub repo | ✅ | Source on GH |
| Domain | ✅ | Working but just redirects |
| MCP published | ⬜ | `fishkeeper-ai-mcp` code exists |
| Revenue | ❌ £0 | Redirect — no monetization |

---

## 10. KOIKEEPER.AI — Pond Keeper AI (LOVELABLE)

**Repos:** `CSOAI-ORG/koikeeper` (GH, M4 source pushed)
**Domain:** koikeeper.ai ✅ 307 → www.koikeeper.ai ✅ 200 → meok.ai redirect
**Stack:** Next.js/Lovable
**Revenue:** Redirect to meok.ai

| Step | Status | Action |
|------|--------|--------|
| Lovable project | ✅ | "koi-keeper-ai" exists |
| GitHub repo | ✅ | Source on GH |
| Domain | ✅ | Working but just redirects |
| Revenue | ❌ £0 | |

---

## 11. TEMPLEMAN-OPTIANS.COM — Real Business

**Repos:** `CSOAI-ORG/templeman-opticians-site`
**Domain:** templeman-opticians.com ✅ 200
**Stack:** cPanel hosting, HTML/CSS
**Revenue:** £2,500-5,000/mo (real optician business)

| Step | Status | Action |
|------|--------|--------|
| Domain live | ✅ | 200, indexed, real business |
| Revenue | ✅ | Real £2.5-5K/mo — the ONLY revenue today |
| GitHub backup | ✅ | Repo exists |
| SEO | ✅ | Top of local search for Essex |
| Action | ⬜ | Keep running — don't break! |

---

## 12. TRADE TRIO — Planthire/Muckaway/GrabHire/Haulage

**Repos:** Various mcp repos
**Domains:** planthire.ai ✅ 200, muckaway.ai ✅ 200, haulage.app ✅ 200, grabhire.ai ✅ 200
**Stack:** Cloudflare-hosted
**Revenue:** Lead gen (currently £0)

| Step | Status | Action |
|------|--------|--------|
| planthire.ai | ✅ 200 | Live, needs monetization |
| muckaway.ai | ✅ 200 | Live, needs monetization |
| haulage.app | ✅ 200 | Live |
| grabhire.ai | ✅ 200 | Live |
| MCP servers | ✅ | `planthire-ai-mcp`, `muckaway-ai-mcp` exist in repo |
| Stripe checkout | ⬜ | Need pricing page + buy button |
| Revenue | ❌ £0 | All live but no payments |

---

## 13. COBOL BRIDGE — Enterprise Legacy Modernization

**Repos:** `CSOAI-ORG/cobol-bridge`, `CSOAI-ORG/cobol-bridge-mcp`, `CSOAI-ORG/cobol-bridge-substrate`
**Domain:** cobolbridge.ai ✅ 307 → www.cobolbridge.ai ✅ 200
**Stack:** Vercel
**Revenue:** £199/mo Pro, £999/mo Enterprise
**PyPI:** — | **npm:** —

| Step | Status | Action |
|------|--------|--------|
| Domain live | ✅ | Working |
| Content | ✅ | Landing page up |
| Stripe products | ✅ | £199/mo, £999/mo, £4,990/mo prices configured |
| Checkout wired | ⬜ | Need to add buy buttons |
| Revenue | ❌ £0 | |

---

## 14. INDUSTRIAL DOMAINS

**Repos:** `CSOAI-ORG/industrial-domains`, `CSOAI-ORG/industrial-hire-ai`
**Domains:** industrial-domains.com ❌ 000, industrial-hire-ai.com ❌ 000, asisecurity-portal.com ❌ 000
**Stack:** Next.js on Vercel
**Revenue:** Lead gen → B2B SaaS

| Step | Status | Action |
|------|--------|--------|
| GitHub repos | ✅ | Source on GH |
| Domains live | ❌ All 000 | Need deploy — Vercel blocked |
| Content | ✅ | Source code exists |
| Revenue | ❌ £0 | |

---

## 15. OPTOMOBILE.AI — Optician SaaS

**Repos:** Not created
**Domain:** optomobile.ai ❌ 000 (no DNS records)
**Stack:** None deployed
**Revenue:** £99/mo SaaS (projected)

| Step | Status | Action |
|------|--------|--------|
| Lovable project | ✅ | "optimobileai" and "optimobile-lovable-ai" both exist (36 total) |
| GitHub repo | ⬜ | Not created |
| DNS | ❌ | No A records at Namecheap |
| Content | ⬜ | Nothing deployed |
| Revenue | ❌ £0 | |

---

## 16. MCP MARKETPLACE — The Product Engine

**Repos:** 250+ MCP server repos in `CSOAI-ORG/*`
**PyPI:** 28 published, 10,330 dl/mo
**Revenue:** Free 10/day → Pro £79-£499/mo

| Step | Status | Action |
|------|--------|--------|
| Repos on GH | ✅ | 250+ MCP server repos |
| Built on disk (M4) | ✅ | 345 servers in `clawd/mcp-marketplace/` |
| Published to PyPI | ✅ 28/345 | Only 8% published |
| Top 4 have Pro auth | ✅ | Updated today with license check |
| License API running | ✅ | Port 3106 on M4 |
| Stripe → License webhook | ⬜ | Need Cloudflare DNS for `license.csoai.org` |
| Publish remaining 317 | ⬜ | 317 servers sitting on disk, not on PyPI |
| Revenue | ❌ £0 | 10K dl/mo, 0 conversions |

---

## 17. LIB2B — Protocol SDK

**Repos:** `CSOAI-ORG/lib2b`
**npm:** `csoai-lib2b@0.1.0` published
**Revenue:** SDK adoption → enterprise sales

| Step | Status | Action |
|------|--------|--------|
| Repo on GH | ✅ | TypeScript SDK |
| npm published | ✅ | `npm install csoai-lib2b` works |
| Python SDK | ✅ | `python/lib2b/` in repo |
| Go SDK | ✅ | `go/lib2b/` in repo |
| README fixed | ✅ | npm install command correct |
| Adoption | ❌ 0 downloads | Need to promote |
| Revenue | ❌ £0 | |

---

## 18. PHASE 4: GRANTS

| Grant | Amount | Deadline | Status |
|-------|--------|----------|--------|
| ADOPT Fund Round 7 | £100,000 | **3 June 2026 (2 days!)** | ⬜ Needs browser submission |
| Innovate UK AgriScale | £375,000 | **3 June 2026 (2 days!)** | ⬜ Needs browser submission |
| DSIT AI Assurance | £500,000 | TBD | ⬜ Ready to submit |
| NLnet NGI Zero | €50,000 | TBD | ⬜ Ready to submit |
| NLnet NGI Zero (2nd) | €50,000 | TBD | ⬜ Ready to submit |
| **Total pipeline** | **£1,075,000** | | |

---

## REVENUE BOTTLENECK MAP

```
PyPI downloads:  10,330/mo ──→ 0% convert ──→ £0
Live domains:   14/21        ──→ 0% have checkout ──→ £0
Stripe products: 20          ──→ 0% have buy button ──→ £0
GitHub repos:   300+         ──→ 0% monetized ──→ £0
Lovable projects: 36         ──→ 0% connected to GH ──→ £0
```

## THE ONE THING THAT MATTERS

**Sell one £1,499/mo enterprise certification.** 

That's it. One sale funds the entire operation for a month. Everything else is infrastructure.

---

*This document lives at `M2-E2E-REVENUE-CHECKLIST.md` in clawd-workspace.*
*Updated: 2026-05-31 15:14 BST*
