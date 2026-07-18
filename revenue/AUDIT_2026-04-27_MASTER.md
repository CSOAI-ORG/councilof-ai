# Master audit — what shipped, what's still open — 27 Apr 2026

## ✅ SHIPPED THIS SESSION

### New pages live on meok.ai
- `/scorecard` — 10Q free lead-magnet → posts to attestation API ([live](https://meok.ai/scorecard))
- `/bias-detection` — £299/mo Article 10 product + new Stripe live ([live](https://meok.ai/bias-detection))
- `/vs-comp-ai` — competitive page intercepting Comp AI search overflow ([live](https://meok.ai/vs-comp-ai))
- `/trust` — buyer-grade trust center: live attestations + sub-processors + security practices ([live](https://meok.ai/trust))
- `/sub-processors` — redirects to /trust (canonical) ([live](https://meok.ai/sub-processors))
- `/refund` — plain-English per-product refund table — removes procurement objection on £4,950 + £999 products ([live](https://meok.ai/refund))

### Critical breakages fixed
- **cal.com 404 → mailto:** every "book a call" CTA across 7 pages was leaking to a 404 — replaced with mailto pre-fills opening user's mail client.
- **Indie tier removed from /pricing** — audit said dilutive between free + Pro, killed it.
- **biasdetectionof.ai CTA was £79/mo** (wrong) — now redirects to /bias-detection with £299/mo.

### SEO/AEO upgrades (live)
- **FAQPage JSON-LD** on `/article-50-kit` (6 questions covering Code of Practice 2-layer requirement, €15M fines, watermark survival)
- **FAQPage JSON-LD** on `/vs-comp-ai` (6 questions targeting "Comp AI EU AI Act" featured-snippet gap — zero commercial competition)
- **Product JSON-LD with Offer £999 GBP** on `/article-50-kit` — enables Google Merchant + AI Overview price extraction
- **Per-page OG tags** added to article-50-kit, audit-prep-bundle, nis2-de-kit (was inheriting homepage default — broken LinkedIn shares for £999-£4,950 buyers)
- **Title tag fix** on /vs-comp-ai (was 87 chars, truncated; now 60)

### Conversion / trust signals
- **Companies House 16939677** + Trust Center + Privacy + Terms in footers of audit-prep-bundle, bias-detection, vs-comp-ai
- **Refund link** prominently in audit-prep-bundle footer ("Refund: full pre-kickoff, 50% mid-engagement")
- **Homepage** — added /scorecard banner + /vs-comp-ai tile + /bias-detection tile
- **Visible FAQ accordions** on /article-50-kit + /vs-comp-ai (not just JSON-LD — reads on page too)

### Drafts ready to send (one-click pastes for you)
- `OEM_OUTREACH_2026-04-27.md` — 5 white-label embedded-API outreach emails (Filigran/Trustcloud/Sprinto/MetaCompliance/Strike Graph)
- `NIS2_DE_COLDMAIL_BATCH_2026-04-27.md` — 50 German Mittelstand cold emails (English + German)
- `RESEARCH_2026-04-27_DEEP.md` — 2 parallel research agents synthesis (AI agent monetization 2026 + recent OSS breakthroughs)
- `BLOCKERS_2026-04-27.md` — what's stopping me from doing more, ranked by £/min unblock

## ⚠️ OPEN — not blocking but high-value

### Quick-win SEO/AEO gaps (top 5 from audit, ~3 hours total)
1. **Homepage H1** is fragmented (4 competing title divs) — kills ranking — *10 min*
2. **Quiz/FAQPage schema on /scorecard** with all 10 questions visible to crawlers — *30 min*
3. **`SoftwareApplication` schema sitewide is wrong** for paid services — replace with `Service` + `Offer` on /audit-prep-bundle, /bias-detection, /nis2-de-kit, /consulting — *45 min*
4. **Compliance pricing tab on /pricing** — currently sells consumer chatbot tiers; B2B compliance buyer arrives + bounces — *60 min*
5. **Person + ProfessionalService schema on /consulting** with knowsAbout + sameAs — E-E-A-T signal for £950/day buyer — *20 min*

### Content gaps (from competitive audit)
- Article-by-article landing pages (Articles 9, 14, 26, 50) — high commercial-intent long-tail (1 day each, parallelisable)
- /vs-vanta, /vs-drata, /vs-holistic-ai, /vs-credo-ai (2hr per page)
- /case-studies (zero published — automatic disqualification for enterprise procurement)
- /docs developer surface (234 MCPs but no on-domain docs hub)
- Newsletter signup (Risto Uuk's EU AI Act Newsletter has 53K subs; MEOK has zero capture)
- Free tools: EU AI Act fine calculator, NIS2 entity classifier, FRIA generator (1 day each)

### Production issues
- **/blog returns 500** — Clerk middleware quirk on dev key in production. Different funnel (consumer chatbot blog), deprioritize but should fix.
- **/start CTA on homepage hero** sends compliance buyers to companion onboarding — wrong audience routing.

### What needs you (account-level credentials I cannot proxy)
1. **Send 5 OEM emails** from `nicholas@csoai.org` PrivateMail (Chrome extension permission prompt blocked browser-drive — unblock by clicking the Claude side-panel)
2. **Send 50 NIS2-DE coldmails** (same)
3. **List 3 domains on Sedo**: councilof.ai £8K-£15K BIN · agisafe.ai £8K-£15K · grabhire.ai £5K-£10K
4. **Submit NLnet grant** by 1 June 2026 (€50K cap, draft exists)
5. **Smithery delete** csgaglobal/cobol-bridge (destructive, your account)
6. **Web3Forms** remove james.castle CC config (server-side dashboard)
7. **LinkedIn rebuild** (deleted under James Castle's manipulation per memory — needs new account)

## 90-day £ projection (probability-weighted, this session's data)

Combining the master audit + monetization research + breakthroughs:

| Channel | EV (cash + MRR) | P(success) | Action required |
|---|---|---|---|
| OEM white-label outreach (1 close) | £24K/yr | 25% | You send 5 emails (drafted) |
| NIS2-DE coldmail (1-2 sales) | £998-£2.5K cash | 70% | You send 50 emails (drafted) |
| £950/day consulting (1 booked day) | £950 cash | 60% | LinkedIn rebuild + Risto Uuk newsletter comments |
| Bias Detection £299/mo (5-15 subs) | £1.5K-£4.5K MRR | 50% | /bias-detection page already live |
| Audit-Prep Bundle (1-2 sales) | £4.95K-£9.9K cash | 35% | /refund + /trust now live → procurement objection removed |
| Sedo domain flips | £18K-£40K capital | 30% within 90d | You list 3 domains |
| NLnet grant | €50K | 50% | You submit draft by 1 June |
| /vs-comp-ai SEO (Comp AI overflow) | £2K-£5K MRR | 60% | live now, FAQ schema indexed in 4-6 weeks |
| MCPize £79/£299 listing (matching AWS Security Auditor pattern $8.5K/mo) | £2K-£6K MRR | 30% | Need to publish + market |
| **Realistic 90-day cumulative** | **£12K-£35K cash + £1.5K-£3K MRR** | | |

The single biggest swing: one OEM outreach landing one £2K/mo deal moves the floor case to break-even. The drafts are ready — sending them is your highest £/minute action right now.

## What I learned about my own blockers (you asked)

1. **Chrome extension reliability is uneven** — same extension, 2 tabs, one (Gmail) responsive, one (PrivateMail OX webmail) hangs every operation. Heavy SPA pages with custom render trees seem to break the DOM walker. Workaround: prefer simpler webmail when both options exist.
2. **Send-as authentication is the real cold-email blocker** — even with browser drive working, sending B2B from `nicholastempleman@gmail.com` is bad practice (deliverability + professionalism). Need PrivateMail or Gmail Send-As alias.
3. **Destructive + account-level actions remain firmly user-side** — and this is correct. The £ cost of one wrong delete > £ saved by automation.
4. **Long research tasks should be subagents** — both deep-research agents returned in ~3 min. Doing equivalent foreground would consume my context window.
5. **Production deploys beat local preview** — each Vercel deploy is 60-90s, gives a real URL with real CDN behaviour. Default to `vercel deploy --prod` over `npm run dev` when project is wired.
6. **mailto: URL pre-fills are an underrated shipping tool** — turns 7 dead cal.com CTAs into 7 working email composers in one search-replace.
7. **`SoftwareApplication` schema is wrong for £4,950 services** — Google Merchant ignores it for paid services, so AI Overviews skip price extraction. Should be `Service` + `Offer`.
8. **OG metadata inheritance bug in Next.js App Router** — child pages without explicit `openGraph` block silently inherit root's, which means LinkedIn shares of /article-50-kit looked like the homepage. Always set per-page `openGraph` with `url` to override.
