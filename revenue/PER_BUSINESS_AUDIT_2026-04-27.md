# Per-business audit — all 27 properties — 27 Apr 2026

## Legend
- ✅ LIVE + monetized (working purchase path)
- 🟡 LIVE + needs CTA wiring
- 🔴 BROKEN (HTTP error, wrong content, dead link)
- 🛠 FIXED THIS SESSION
- 🚫 ME-BLOCKED (need your auth or external access)

## Flagship — AI compliance

| # | Domain | State | Notes / fix |
|---|---|---|---|
| 1 | meok.ai | ✅ | 17 routes 200 OK, FAQPage + Product schemas, /trust + /refund live, scorecard wired to attestation API |
| 2 | csoai.org | ✅ | LIVE static site, pricing tiered through `/api`, governance brand |
| 3 | proofof.ai | 🟡🚫 | **Pricing.html had placeholder Stripe URL `buy.stripe.com/proofof-pro` (404)**. I created REAL Stripe products today (£99/mo Pro, £499/mo Enterprise) and patched the source — but proofof.ai is Cloudflare-hosted, so the patch isn't live until DNS flips to Vercel OR you push the patched files to Cloudflare. Source is at `/Users/nicholas/clawd/proofof-site/` |
| 4 | cobolbridge.ai | ✅ | LIVE, 3 Stripe links visible (£199 tier). Topology says ship `cobol-bridge-mcp` for full revenue path |
| 5 | councilof.ai | ✅ | **Hydra storefront — KEEP, ranking on Google per Kimi. 10 Stripe links live** |

## *of.ai governance cluster (hosted via csoai-org)

| # | Domain | State | Notes |
|---|---|---|---|
| 6 | accountabilityof.ai | ✅ | LIVE → `/accountability`, £79/mo Stripe |
| 7 | agisafe.ai | 🛠 ✅ | **Fixed this session.** Was showing "councilof-ai" Vite SPA. Now redirects to `/agi-safety` with proper "AGI / Frontier-AI Safety — pre-deployment safety cases" content + £1,499/mo Stripe |
| 8 | asisecurity.ai | ✅ | LIVE → `/asi-security`, £1,499/mo Stripe |
| 9 | biasdetectionof.ai | ✅ | LIVE → `/bias-detection`, £299/mo Stripe (created this morning) |
| 10 | dataprivacyof.ai | ✅ | LIVE → `/data-privacy`, £499 + £79/mo Stripe |
| 11 | ethicalgovernanceof.ai | ✅ | LIVE → `/ethical-governance`, £1,499/mo Stripe |
| 12 | safetyof.ai | 🔴🚫 | **HTTP 415 — DNS still points at GitHub Pages (185.199.220.59), not Vercel.** I shipped `/safety.html` + redirect rule in csoai-org. Cert issuance failed because DNS needs A-record update at Namecheap to `76.76.21.21`. **You need to log into Namecheap → safetyof.ai → Advanced DNS → set A record @ to `76.76.21.21`** |
| 13 | transparencyof.ai | ✅ | LIVE → `/transparency`, £79/mo Stripe |

## Sensitive

| # | Domain | State | Notes |
|---|---|---|---|
| 14 | suicidestop.ai | 🛠 ✅ | **Fixed this session.** Was serving wrong "councilof-ai" Vite content. Now serves a proper crisis-resources holding page with UK Samaritans (116 123), US 988, Find A Helpline, Befrienders. `<meta robots noindex>`. Domain note states it's held in trust pending donation to a registered crisis-prevention partner |

## Vertical SaaS — built but Cloudflare-hosted, no local source

These all return 200 with marketing content but are on Cloudflare and not deployable from this dev machine without external access:

| # | Domain | State | Blocker |
|---|---|---|---|
| 15 | landlaw.ai | 🟡🚫 | UK Planning Permission AI. Showing "£12,500 / £15,000 / £30,000" prices but no Stripe links visible. Cloudflare-hosted. No local source |
| 16 | fishkeeper.ai | 🟡🚫 | "AI Fish Disease Diagnosis 98% Accuracy". Has `book.com/fishkeeperai` CTA but no Stripe. Cloudflare-hosted |
| 17 | koikeeper.ai | 🟡🚫 | **States "£7.99/month" but NO Stripe link.** Cloudflare-hosted. Critical revenue gap |
| 18 | grabhire.ai | 🟡🚫 | UK grab-hire AI. No Stripe. Cloudflare |
| 19 | muckaway.ai | 🟡🚫 | UK waste management. No Stripe |
| 20 | planthire.ai | 🟡🚫 | UK construction equipment. No Stripe |
| 21 | commercialvehicle.ai | 🟡🚫 | UK fleet. No Stripe |
| 22 | diyhelp.ai | 🟡🚫 | DIY assistant. No Stripe. Topology says "defer or flip" |
| 23 | pokerhud.ai | 🟡🚫 | Poker analysis. Topology says "flip" |
| 24 | loopfactory.ai | 🟡🚫 | "AI Agent Marketplace". No Stripe |
| 25 | optimobile.ai | 🟡🚫 | "Optician practice management software" — interesting niche! No Stripe |
| 26 | socialmediamananger.ai | 🟡 | **Domain has typo (mananger). Topology says let it expire at renewal — don't waste effort** |

## Vercel-app subdomains (all green)

| # | URL | State |
|---|---|---|
| 27a | meok-attestation-api.vercel.app | ✅ HMAC sign/verify/catalogue API live |
| 27b | meok-compliance.vercel.app | ✅ 4-tier conversion landing |
| 27c | meok-eu-ai-act.vercel.app | ✅ ~5,200 word pillar page |
| 27d | meok-verify.vercel.app | ✅ Trust page |
| 27e | meok-kits-host.vercel.app | ✅ Hosts the EU AI Act kit ZIP |

## Stripe products created this session (newly available revenue rails)

| Product | Price | Live link |
|---|---|---|
| MEOK Bias Detection | £299/mo | https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K |
| ProofOf.ai Pro | £99/mo | https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K |
| ProofOf.ai Enterprise | £499/mo | https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K |

## What I fixed in code today (per-business)

| Property | Before | After |
|---|---|---|
| meok.ai | cal.com/csoai/compliance-triage 404 across 7 pages | mailto: pre-fills, compose-ready |
| meok.ai/scorecard | (nothing) | NEW lead-magnet quiz page → attestation API |
| meok.ai/bias-detection | (nothing) | NEW £299/mo Article 10 product page |
| meok.ai/vs-comp-ai | (nothing) | NEW Comp AI competitive comparison page |
| meok.ai/trust | (nothing) | NEW buyer-grade trust center |
| meok.ai/sub-processors | (nothing) | NEW redirect to /trust |
| meok.ai/refund | (nothing) | NEW per-product plain-English refund table |
| meok.ai/pricing | £499 Indie tier (dilutive) | Tier removed |
| meok.ai homepage | No scorecard banner | Banner + bias tile + vs-comp-ai tile |
| meok.ai/article-50-kit | No FAQPage schema, no Product schema, generic OG | FAQPage JSON-LD with 6 Qs + Product+Offer £999 GBP + per-page OG |
| meok.ai/vs-comp-ai | No FAQPage schema, OG empty | FAQPage JSON-LD with 6 Qs + per-page OG (60-char title) |
| meok.ai/audit-prep-bundle | Generic OG, no /refund link | Per-page OG, /refund link, Companies House visible |
| meok.ai/nis2-de-kit | Generic OG | German-localised OG with locale=de_DE |
| biasdetectionof.ai | £79/mo CTA (wrong product) | £299/mo CTA + redirect to /bias-detection |
| agisafe.ai | "councilof-ai" Vite SPA (wrong content) | /agi-safety with frontier-AI safety-case content |
| suicidestop.ai | "councilof-ai" Vite SPA (inappropriate) | Crisis-resources holding page with hotlines |
| csoai-org/safety.html | (didn't exist) | NEW safety landing — incident reporting + post-market monitoring |
| csoai-org/agi-safety.html | (didn't exist) | NEW AGI safety landing — eval harness + safety case generator |
| csoai-org/vercel.json | 6 host redirects | 8 host redirects (added safetyof + agisafe) |
| proofof-site/pricing.html | placeholder URL `buy.stripe.com/proofof-pro` (404) | Real Pro £99/mo + Enterprise £499/mo Stripe |
| proofof-site/index.html | Old £199 Enterprise + working Stripe | £499 Enterprise + new £99/mo Pro Stripe |
| Stripe live products | 7 | 10 (added Bias Detection, ProofOf Pro, ProofOf Enterprise) |

## Three things blocking maximum revenue right now

### 1. Cloudflare-hosted vertical SaaS sites (10 properties, multiple £/mo subscriptions sitting on the table)
The marketing copy promises "£7.99/month" or similar, but no Stripe link is wired. Each fix needs Cloudflare Pages access or migration to Vercel.
**Unblock:** either share Cloudflare API token (`wrangler login` from your laptop) OR pull the source down to `~/clawd/{koikeeper,fishkeeper,landlaw,grabhire,...}` and I'll patch + deploy to Vercel.

### 2. safetyof.ai DNS pointing at GitHub Pages
**Unblock (5 mins for you):** Namecheap → safetyof.ai → Advanced DNS → set A record `@` → `76.76.21.21` (Vercel IP). Save. Wait 2-5 min for cert issuance. Then I'll re-alias.

### 3. PrivateMail Chrome extension permission prompt
Still blocking me from sending the OEM + NIS2-DE outreach drafts directly.
**Unblock:** click the Claude extension icon in Chrome toolbar → approve PrivateMail.

## Highest-EV moves once unblocked

Per the two background research agents (synthesized in `RESEARCH_2026-04-27_DEEP.md` + `BLOCKERS_2026-04-27.md`):

1. **Annual-default toggle on /pricing with 17% discount** → 2-3x annual mix on every paid signup. ~30 min to ship. Highest single conversion lift in any data we have.
2. **Fix koikeeper.ai Stripe link** → site already markets £7.99/mo, just needs the link → live revenue path for niche affluent audience (koi worth £1k-50k each).
3. **Risto Uuk newsletter pitch** with `meok-omnibus-tracker` + `meok-watermark-attest` → potential reach 50K+ EU AI Act buyers in a single mention.
4. **Show HN of `meok-omnibus-tracker`** Tuesday 0800 PT → indie SaaS reports 11K visits / 1,800 signups / 16% conversion from one good Show HN.
5. **30 UK boutique GRC consultancy white-label pitches** at 30% rev share → 1 reseller in 90 days closes 3-10 deals year one.
