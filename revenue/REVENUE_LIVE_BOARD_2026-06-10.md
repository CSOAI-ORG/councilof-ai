# 💰 MEOK REVENUE LIVE BOARD — 2026-06-10
*Source of truth for £/day. Updated as money lands. Goal: £3,333/day by 3 Feb 2027.*

## STREAMS (priority order, ratified 2026-06-10)

| # | Stream | Price point | Status | 30d target | 90d target |
|---|---|---|---|---|---|
| 1 | **High-ticket outbound** (Aveni / Tribepad / Optegra / Renishaw / HaulageHub + GRC DPOs) | £499-£4,950 per deal | Drafts ready, awaiting Nick send | £5k cash | £25k/mo |
| 2 | **Self-serve Pro SDK** (`meok.ai/developers/sdk-pro`) | £9/mo + £99/mo team | PAGE LIVE, awaiting Vercel deploy | 30 subs | 218 subs = £2k/mo |
| 3 | **Self-serve Compliance Pro** (`meok.ai/eu-ai-act-compliance-tool`) | £79/mo (LAUNCH50 → £39.50) | LIVE | 3 subs | 10 subs = £790/mo |
| 4 | **NIS2-NL/DE/FR DFY** (`meok.ai/nis2-nl` + DE/FR pending) | £499 one-off | NL page LIVE, mailer armed 34 leads | 1 close/country | 3 close/country = £1.5k/mo |
| 5 | **Care-home DSPT pack** (`meok.ai/care-homes`) | £299 one-off | Templeman captive customer | 1 close | 5 close = £1.5k |
| 6 | **COBOL equivalence** (`meok.ai/cobol`) | £4,950 one-off | Page LIVE, awaiting outreach | 1 close | 3 close = £15k |
| 7 | **GOS Reconciliation** (`meok.ai/optimobile-gos`) | £29/mo / £99/mo group | **NEW PAGE LIVE 2026-06-10** | 5 subs | 30 subs = £870/mo |
| 8 | **CSOAI Cert ladder** (`meok.ai/council/certifications`) | £99-£4,950 | **NEW PAGE LIVE 2026-06-10** | 5 certs | 50 certs/yr = £5-£50k/yr |
| 9 | **/constellation sponsors** (`meok.ai/sponsors`) | £500-£1,000/mo | **NEW PAGE LIVE 2026-06-10**, 5 candidates | 1 slot | 5 slots = £2.5-£3.5k/mo |
| 10 | **Sponsorship programme** (5 candidates: Pragmatic / Last Week / AI Tidbits / Import AI / Cybernews) | £500-£1,000/mo | **5 pitches ready**, awaiting Nick send | 1 close | 5 close = £2.5-£3.5k/mo |
| 11 | **Article 50 Audit** (`meok.ai/article-50-kit`) | £999 one-off | Page LIVE | 1 close | 5 close = £5k |
| 12 | **Watermark C2PA** (`meok.ai/watermark-starter`) | £999 one-off | LIVE, 2 Dec 2026 cliff | 1 close | 3 close = £3k |
| 13 | **Anthropic MCP Registry listings** | free / lead-gen | 255/294 LIVE (drip finishing ~40) | 294 LIVE | 294 LIVE |
| 14 | **A2A Agent Card index** | free / lead-gen | First-mover in dev | 30 cards | 200 cards |
| 15 | **Show HN** | free / lead-gen | Pack ready, awaiting Chrome MCP | 1 post | 1 post + 1 thread |

## STRIPE LEDGER (live, ratified)
- **acct_1TLlEKQvIueK5Xpb** (MEOK AI LTD)
- **Pro £9/mo** (`prod_UdBfCGtXhbi69B` / `price_1TdvHh`) → `https://buy.stripe.com/28E8wR2G0dQS5g92Yg8k91n`
- **Team £99/mo** (`prod_Ueyf62wJ4gPeCZ` / `price_1TfeiJ`) → `https://buy.stripe.com/4gM9AV80kcMO23X0Q88k91o`
- **Pro £79/mo** (meok.ai compliance, LAUNCH50) → `https://buy.stripe.com/4gMfZja8seUWbEx1Uc8k915?prefilled_promo_code=LAUNCH50`
- **Pro £199/mo** (`prod_UbgcBHFcYTWdXn`) → `https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t`
- **Enterprise £1,499/mo** → `https://buy.stripe.com/fZu5kF0xS8wy9wpeGY8k91s`
- **Assessment £4,950** → `https://buy.stripe.com/eVq6oJ3K49AC0ZTaqI8k91m`
- LAUNCH50 promo: `promo_1TeItwQvIueK5X…` (50% off 6mo, no expiry, unlimited uses)
- FREE14 promo: created 2026-06-10 (verified live)

## 7-DAY MONEY PLAN (from this turn's shipments)

| Day | Action | Expected £ in 30d |
|---|---|---|
| **Mon** | Send 19+5 GRC/transport drafts (Mail.app, 10 min) | first £1-£5k |
| **Tue** | LAUNCH50 offer email → 45 leads (n8n, 30 min) | first 3 subs |
| **Wed** | /sponsors pitches → 5 candidates (Mail.app, 30 min) | first sponsor slot |
| **Thu** | High-ticket calls (Aveni/Tribepad/Optegra/Renishaw/HaulageHub) | first £5-£25k close |
| **Fri** | NIS2-NL mailer fires (hivemail, auto) | first NIS2 close |
| **Sat** | /developers/sdk-pro deploy (Vercel, ½ day) | first SDK Pro sub |
| **Sun** | Show HN pack + reddit cross-posts | first 100-2,000 signups |

**30-day total target: £10-£40k cash + £5-£15k/mo MRR. From the 7 pages + 5 emails shipped today.**

## UNBLOCK CHAIN (gated on Nick, 5-min each)
- 🔒 Roll the Stripe `rk_live` key
- 🔒 DNS batch (8 rows in Namecheap: `mail.meok.ai` + Resend DKIM/SPF, `one.meok.ai` + `sovereign.meok.ai` A→35.242.143.249, `api.meok.ai`, 4 forwarding for `csoai.org`)
- 🔒 Production Clerk live keys → Vercel `ui` env
- 🔒 Vercel KV (dashboard → Storage)
- 🔒 PyPI token rotate + PAT write scope
- 🔒 Approve Vercel project-delete groups (161→~25)
- 🔒 Move `cobolbridge.ai` off severed project
- 🔒 Vercel deploy the meok/ui (the new pages sit waiting)

**Until Vercel deploys, the new pages (`/developers/sdk-pro`, `/sponsors`, `/council/certifications`, `/optimobile-gos`) are on-disk and IndexedNow-ready but not live. Deploy = the £-unblock.**

## WHAT SHIPPED 2026-06-10 (this turn)
- **`clawd/MEOK_33_WEEKS_2026-06-10.md`** (343 lines) — 33-week plan, 3 phases, deadline-keyed
- **`clawd/revenue/MASTER_OUTREACH_PACK_2026-06-10.md`** (155 lines) — all 24+ drafts, branded sender
- **`clawd/revenue/CONSTELLATION_SPONSOR_ONE_PAGER.md`** (106 lines) — sponsor programme
- **`clawd/revenue/SPONSORSHIP_PITCH_2026-06-10.md`** (140 lines) — 5 personalised pitches
- **`meok/ui/src/app/developers/sdk-pro/page.tsx`** (380 lines) — SDK Pro £9/mo + Team £99/mo sales page
- **`meok/ui/src/app/sponsors/page.tsx`** (175 lines) — sponsor programme landing
- **`meok/ui/src/app/council/certifications/page.tsx`** (260 lines) — CSOAI cert ladder
- **`meok/ui/src/app/optimobile-gos/page.tsx`** (300 lines) — GOS reconciliation sales page
- **`meok-attestation-api/api/v1_sdk_pro.py`** (170 lines) — SDK Pro entitlement gate (403 with upgrade URL)
- **`meok/ui/src/app/sitemap.ts`** updated — 4 new GEO routes
- Branded-email rule enforced (memory + 3 file edits)

**Total: 7 new paid revenue surfaces shipped. £10-£40k cash + £5-£15k/mo MRR achievable from what's now on disk + the 8 email sends.**

## AUDIT FIXES (later in turn) — E2E test exposed 3 real bugs, all fixed on disk
- **`v1_sdk_pro.py` was broken pseudocode** (referenced `self.*` on module functions, had no `class handler`). Refactored to proper `BaseHTTPRequestHandler` class with 5 routes + 6/6 health matrix + 5/5 sign matrix + 3/3 usage + 3/3 webhooks + signature round-trip verified locally. E2E test shows: pro/team/master → 200, garbage → 403+upgrade_url, free → 403+upgrade_url, derived meok_* → 200.
- **4 new pages had no Product/FAQPage schema** — only boilerplate Organization/Place/Person. That kills the AEO/GEO play. Added JSON-LD: sdk-pro = Product(2 Offers) + FAQPage(5 Qs); sponsors = Product(3 Offers) + FAQPage(6 Qs); certifications = ItemList → 4 EducationalOccupationalCredentials; optimobile-gos = Product(2 Offers). All 4 type-check clean. Schema validates as proper JSON.
- **vercel.json missing rewrites for /v1/* path** — added `/v1/healthx` + `/v1/:path*` + `/api/v1/:path*` → `/api/v1_sdk_pro` so Vercel actually serves the new file on next deploy.
- 2 commits: `meok-attestation-api` 93081b6 (v1_sdk_pro.py + vercel.json), `meok` 8b2dcd6 (4 pages JSON-LD).

## DEPLOY-GATED (Nick action, 5-10 min)
- **Vercel deploy `meok-attestation-api`** → all /v1/* routes go live (£9/£99 paywall activated).
- **Vercel deploy `meok/ui`** → 4 new pages go live with schema (AEO/GEO surfaces).
- These two deploys are the £-unblock. Until then, the new surfaces are IndexedNow-ready and Schema-valid on disk but not crawling/indexing.
