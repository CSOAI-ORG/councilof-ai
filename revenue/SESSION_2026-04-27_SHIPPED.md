# 27 Apr session shipped log

## ✅ LIVE in production right now

| URL | What it is |
|---|---|
| [meok.ai/scorecard](https://meok.ai/scorecard) | EU AI Act readiness scorecard — 10Q lead magnet, captures email + posts to attestation API |
| [meok.ai/bias-detection](https://meok.ai/bias-detection) | New £299/mo Article 10 product page with comparison table |
| [biasdetectionof.ai](https://biasdetectionof.ai) | Now redirects to /bias-detection page with £299/mo CTA (was £79/mo Pro link) |
| [meok.ai/](https://meok.ai/) | Homepage now has free scorecard banner above compliance grid + £299/mo bias detection tile |
| [meok.ai/pricing](https://meok.ai/pricing) | £499/yr Indie tier removed (audit said it was dilutive) |

## ✅ Stripe product created
- Bias Detection: `prod_UPZLiBLGjHRxF8` · `price_1TQkCZQvIueK5Xpb9L7MlJKE` · £299/mo
- Payment link: https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K

## 📨 Drafts ready for Nick to send (paste-and-go)

1. [`OEM_OUTREACH_2026-04-27.md`](/Users/nicholas/clawd/revenue/OEM_OUTREACH_2026-04-27.md) — 5 white-label embedded-API outreach emails (Filigran, Trustcloud, Sprinto, MetaCompliance, Strike Graph). 30 min to send. EV: ~£24K/yr per close.
2. [`NIS2_DE_COLDMAIL_BATCH_2026-04-27.md`](/Users/nicholas/clawd/revenue/NIS2_DE_COLDMAIL_BATCH_2026-04-27.md) — German Mittelstand cold-email batch (English + German versions). 50 sends/day for 4 days = 1-2 sales realistic.

## 🔁 End-to-end smoke test PASSED

Scorecard → attestation API → cert issued → upgrade block returned ✅
- cert_id: MEOK-EUAIAC-3A7D9B30BFCE
- Email captured to Vercel logs as `[FREE_TIER_LEAD]` event
- meok_upgrade block includes Pro £79/mo + Enterprise £1,499/mo links

## ⏱️ The audit said this is the highest £/hr 7-day plan

Per the comprehensive audit, the floor case (P=20% on each) is £1,500-£2,500 cash + £400-£600 MRR by 30 July. Mid-case is £8K-£12K cash + £1,450 MRR. Three actions move the floor:

### Today (Mon 27 Apr) — Nick's actions
1. **List 3 domains on Sedo** — councilof.ai (£8K-£15K BIN), agisafe.ai (£8K-£15K), grabhire.ai (£5K-£10K). 60 min on sedo.com. One-shot capital potential £18K-£40K over 6-12mo.
2. **Send 5 OEM outreach emails** — copy from `OEM_OUTREACH_2026-04-27.md`. Send from `nicholas@csoai.org`. 30 min.
3. **Send first 50 NIS2-DE cold emails** — copy from `NIS2_DE_COLDMAIL_BATCH_2026-04-27.md`. 90 min. Get prospect list from LinkedIn Sales Nav trial or Hunter.io.

### Tomorrow
4. **Submit NLnet NGI Zero grant** — €30K (~£25.5K). Deadline 1 June. Application drafted.
5. **Comment on Risto Uuk EU AI Act Newsletter posts** — link `/consulting` page in comments. He has 53K subs. Expected 1 booked £950 day in 30-60 days.

### This weekend
6. **Cyber Essentials self-cert** — ~£300, 2 days. Unlocks G-Cloud 14 (still buyable through Oct 2026). Average G-Cloud SME contract is low five figures.

## 🚫 What I did NOT do (audit said defer)

- £499 Indie tier — REMOVED from pricing page (dilutive)
- £29 Starter tier consumer chatbot — left in place, separate product line
- YouTube content — deferred to Q3 2026 (need 1K subs first)
- SOV3 productized as £20-£50/mo — deferred (needs hosted infra Nick doesn't have yet)
- Maven/Teachable cohort — deferred (need 1K newsletter subs first)
- Mac App Store £99 desktop — deferred to Q4 2026
- 234-package fleet enterprise licence — deferred until first £10K reference customer

## 📊 Honest 90-day £ projection (probability-weighted)

| Channel | P(close) | £/mo or one-shot | EV |
|---|---|---|---|
| OEM white-label embedded API | 25% | £2,000/mo | £6,000 (3mo) |
| NIS2-DE cold email | 70% | £998-£2,495 one-shot | £1,200 |
| £950/day consulting (LinkedIn) | 60% | £950 one-shot | £570 |
| Bias detection £299/mo | 50% | £299/mo | £450 |
| Show HN drives kit purchases | 60% | £499-£1,996 | £750 |
| Sedo domain flips | 30% in 90d | £18K one-shot | £5,400 |
| NLnet grant | 45% | £25,500 (decision Q3) | n/a within 90d |
| Affiliate footer + Polar.sh + Gumroad | 70% | £350/mo | £735 |
| **Total weighted EV (90d cash)** | | | **~£15K** |

Floor (everything goes wrong): £1,500-£2,500 cash + £400/mo MRR.
Ceiling (everything lands): £18-£25K cash + £3-£4K/mo MRR.

The single biggest swing factor: **one** OEM outreach email landing.

## 🗒️ Open items for Nick

- [ ] Smithery: delete `csgaglobal/cobol-bridge` server at smithery.ai/servers/csgaglobal/cobol-bridge/settings/advanced
- [ ] Web3Forms dashboard: remove `james.castle@csga-global.org` CC config
- [ ] csga-global.org: check ownership/DNS, redirect/take down
- [ ] Sign back into MCPize via GitHub OAuth
- [ ] Set up Cal.com triage link (used in /consulting + /article-50-kit + /nis2-de-kit)
- [ ] LinkedIn account rebuild (deleted under James Castle's manipulation per memory)
- [ ] Stripe Partner program signup (for affiliate revenue)
- [ ] 1Password Partner signup (£125-£500/mo affiliate at 90d)

## 📁 Files in this session

- `/Users/nicholas/clawd/meok/ui/src/app/scorecard/page.tsx` (new)
- `/Users/nicholas/clawd/meok/ui/src/app/scorecard/scorecard-client.tsx` (new, 280 lines)
- `/Users/nicholas/clawd/meok/ui/src/app/bias-detection/page.tsx` (new)
- `/Users/nicholas/clawd/meok/ui/src/app/home-page-client.tsx` (modified — scorecard banner + bias tile)
- `/Users/nicholas/clawd/meok/ui/src/app/pricing/pricing-client.tsx` (modified — Indie tier removed)
- `/Users/nicholas/clawd/csoai-org/bias-detection.html` (modified — £299/mo CTA)
- `/Users/nicholas/clawd/csoai-org/vercel.json` (modified — host redirects instead of rewrites)
- `/Users/nicholas/clawd/revenue/OEM_OUTREACH_2026-04-27.md` (new)
- `/Users/nicholas/clawd/revenue/NIS2_DE_COLDMAIL_BATCH_2026-04-27.md` (new)
