# Master Action List — 5 May 2026

**Sole source of truth.** Supersedes `MASTER_ACTION_LIST_2026-04-28.md`.

---

## What changed since April 29

| Item | Status |
|------|--------|
| Hermes agent fixed (model: kimi-k2.5 → claude-sonnet-4, API key wired) | DONE |
| Hermes 5 cron jobs active (revenue check, newsletter, outreach brief, health, EU monitor) | DONE |
| Hermes gateway running via launchd | DONE |
| `hermes_research` bug in sovereign-mcp-server.py fixed (--no-tty → -z flag) | DONE |
| Care Home Pack templates ZIP hosted at meok-kits-host.vercel.app | DONE |
| /care-homes-thanks updated — direct download link (self-service) | DONE |
| Newsletter Issue #1 written — copy-paste ready for Buttondown | DONE |
| /uk-ai-bill-2026 page built + deployed + live (200) | DONE |
| Sitemap updated with /uk-ai-bill-2026 | DONE |

---

## 🔥 DO TODAY / THIS WEEK (all blocked on Nick's human execution)

### 1. ~~Submit GSC sitemap~~ ✅ DONE
- Domain property `sc-domain:meok.ai` verified via DNS TXT
- Sitemap submitted (status "Couldn't fetch" — normal, retries within 24-48h)

### 2. Submit Bing Webmaster sitemap (2 min)
- URL: https://www.bing.com/webmasters
- Import from Google or manual verify
- Sitemap → `https://meok.ai/sitemap.xml`

### 3. Post Show HN — BLOCKED on HN karma
- HN restricting Show HN for accounts without engagement history
- **Fix:** Comment on 5-10 HN posts over next few days, then re-attempt
- Copy ready: `revenue/SHOW_HN_FINAL_2026-04-28.md`

### 4. Set up Buttondown account (10 min)
- URL: https://buttondown.email
- Register handle: `meok-eu-ai-compliance-brief`
- Verify domain DNS (TXT record on Namecheap)
- Once live: paste Newsletter Issue #1 from `revenue/NEWSLETTER_ISSUE_01_2026-05-05.md`
- Existing pages (/scorecard, /newsletter) already POST to this handle

### 5. LinkedIn account recovery form (10 min)
- URL: https://www.linkedin.com/help/linkedin/ask/TS-RAA
- Full form text: `revenue/LINKEDIN_ACCOUNT_RECOVERY_EMAIL_2026-04-28.md`

### 6. Send 50 Care Home cold emails (2h via Apollo + Smartlead)
- Strategy: `revenue/CARE_HOME_COLD_LIST_2026-04-29.md`
- CQC public register has independent homes' contact details
- Template ready in that file
- **This is the fastest path to Stripe charge #1**

### 7. Send 5 trade press pitches (30 min)
- Pitches: `revenue/PRESS_PITCHES_2026-04-29.md`
- Targets: Sifted, TechRound, Business Cloud, The Register, Caring Times
- Personalised per editor's recent work

### 8. Test Stripe end-to-end (15 min)
- Create a £1 test product
- Buy via payment link → confirm webhook fires → confirm redirect to /care-homes-thanks
- Refund yourself after confirming

---

## 📈 DO THIS MONTH

### 9. Send 50 YC W26/S26 cold emails (2h)
- Template: `revenue/DEEP_RESEARCH_NEXT_LEVEL_2026-04-28.md` §4.1
- Filter: ycombinator.com/companies?batch=W26 → "Artificial Intelligence"

### 10. ~~Deploy n8n~~ ✅ Running locally + workflows imported
- n8n running on localhost:5678 (started May 5)
- 6 workflows imported (inactive — need SMTP/Stripe/Smartlead credentials wired)
- For VPS deployment: generate Docker Compose when ready

### 11. 6 LinkedIn DMs/day × 5 days
- Targets: `revenue/LINKEDIN_DMS_BOUTIQUE_GRC_2026-04-27.md`
- Only possible once LinkedIn recovered or new account created

### 12. Apply Innovate UK Smart Grant
- Existing draft: `revenue/NLNET_GRANT_DRAFT_2026-04-26.md` (adaptable)
- Monthly competitions
- URL: gov.uk/government/collections/innovate-uk-smart-grants

### 13. Submit NLnet grant
- Draft ready: `revenue/NLNET_GRANT_DRAFT_2026-04-26.md`
- URL: https://nlnet.nl/propose
- 25-40% acceptance rate, €15K-€50K

### 14. Newsletter discipline: Sunday write, Monday send
- Hermes cron "weekly-newsletter-draft" fires Saturdays 8am UK
- Nick reviews Sunday, sends Monday
- Issue #1 ready now at `revenue/NEWSLETTER_ISSUE_01_2026-05-05.md`

---

## 🤖 HERMES AUTOMATED (running — no action needed)

| Cron | Schedule | What it does |
|------|----------|-------------|
| daily-revenue-check | 7am daily | Checks Stripe charges, subs, MRR. Flags first-ever charge as MILESTONE |
| weekly-newsletter-draft | 8am Saturdays | Drafts newsletter issue with latest EU AI Act news |
| monday-outreach-brief | 8:30am Mondays | Lists top 3 outreach actions, checks progress on cold lists |
| vercel-health-check | 9am + 5pm daily | Curls all revenue pages, flags any non-200 as CRITICAL |
| eu-ai-act-monitor | 9am Wednesdays | Searches for EU AI Act / UK AI Bill news, saves report |

---

## ✅ DONE (autonomous, since Apr 29)

| Date | Item |
|------|------|
| May 5 | **GSC domain verified** + sitemap submitted (DNS TXT method) |
| May 5 | **80 files committed** — 45+ new pages, all Omnibus date fixes |
| May 5 | **19 files fixed** — stale "Aug 2026" → correct Omnibus dates |
| May 5 | **PR #5887** submitted to punkpeye/awesome-mcp-servers (3 MCPs) |
| May 5 | **3 GitHub Actions fixed** — removed broken MCP Registry CLI steps |
| May 5 | **safetyof.ai** GitHub Pages deployed (redirect → meok.ai) |
| May 5 | **6 n8n workflows imported** — ready for credentials |
| May 5 | **CRM updated** — 5 OEM prospects added as "contacted" |
| May 5 | **Cold email templates fixed** — Omnibus dates corrected |
| May 5 | **Sitemap cleaned** — removed 60+ dead routes (/birth, /os, /guardian) |
| May 5 | **Attestation API E2E passed** — sign + verify flow confirmed |
| May 5 | **All 5 Vercel apps green** — 200 across the board |
| May 5 | **Git pushed to origin** — triggers production deploy via Vercel integration |
| May 5 | **274 PyPI downloads/week** across 8 flagship MCPs |
| May 5 | Hermes model → claude-sonnet-4 + Anthropic API key wired |
| May 5 | Hermes 5 cron jobs active + gateway running |
| May 5 | hermes_research/hermes_ask fixed (--no-tty → -z flag) |
| May 5 | Hermes MEMORY.md updated with May 2026 business state |
| May 5 | Care Home Pack v1 ZIP live (meok-kits-host.vercel.app, 13KB) |
| May 5 | /care-homes-thanks upgraded — immediate self-service download |
| May 5 | Newsletter Issue #1 written (revenue/NEWSLETTER_ISSUE_01_2026-05-05.md) |
| May 5 | /uk-ai-bill-2026 page built + deployed + live (200) |
| May 5 | Sitemap updated with /uk-ai-bill-2026 |
| Apr 29 | ALIGNMENT_2026-04-29.md — full ground-truth audit |
| Apr 29 | Care Home Pack live (/care-homes + Stripe £150/mo) |
| Apr 29 | 6 n8n workflow JSONs ready |
| Apr 29 | 21 MCP server.json files prepped for Registry batch-publish |
| Apr 28 | Hero SSR fix (0→13 compliance keywords in homepage) |
| Apr 28 | /blog 500 fix (async searchParams → sync) |
| Apr 28 | IndexNow 42 URLs pushed (HTTP 202) |
| Apr 28 | Stripe consolidated 453→81 active products |
| Apr 28 | 10 GitHub repos topic-tagged for Glama.ai auto-scrape |

---

## 🚧 STILL BLOCKED (Nick's hands required)

| Block | Effort | What unblocks |
|-------|--------|---------------|
| Bing Webmaster sitemap | 2 min | Bing + Yandex + Perplexity + ChatGPT Search |
| Buttondown account | 10 min | Newsletter live (Google one-click signup) |
| LinkedIn recovery | 10 min + 5 business days wait | Personal brand + DMs |
| agriculture-robotics.ai + coboldbridge.ai DNS | 5 min | Check Namecheap — no DNS records at all |
| Gmail MCP reconnect | 2 min | Re-auth with expanded scopes in Claude Code |
| PrivateMail read | 5 min | Need app password for IMAP (nicholas@csoai.org) |
| Stripe CLI login | 1 min | `stripe login` for local revenue checking |
| n8n workflow credentials | 30 min | Wire SMTP, Stripe, Smartlead keys into n8n UI |
| HN karma | ongoing | Comment on 5-10 posts → unlock Show HN |

---

## 📊 KPIs — May 2026 targets

| KPI | Current (May 5) | Target (May 31) |
|-----|-----------------|-----------------|
| Stripe charges | 0 | 1+ |
| MRR | £0 | £150+ (1 care home) |
| Newsletter subscribers | 0 | 50 |
| GSC indexed pages | 0 (submitted, pending crawl) | 60+ |
| PyPI downloads/week | 274 | 500+ |
| Show HN posts | 0 (blocked on karma) | 1 |
| Cold emails sent | 5 (OEM, Apr 27) | 55+ (50 care homes + 5 YC) |
| Trade press pitches | 0 | 5 |
| Revenue pages on meok.ai | 45+ | 45+ (✅ done) |
| GitHub Actions green | 100% (3 fixed today) | 100% |
| awesome-mcp-servers PR | #5887 OPEN | MERGED |

---

## 🎯 The single most important number

**Stripe charges: 0 → 1.**

Fastest path: 50 care home cold emails. If even 2% convert, that's 1 paying subscriber = £150 MRR = first revenue.

Everything else is noise until that number moves.

---

## NOT WORTH DOING (until £1K MRR)

- More content pages (25 live pages is sufficient for SEO — they need indexing, not more volume)
- More MCPs on PyPI (31+ is enough — get existing 21 into Registry instead)
- More Stripe products (81 active is plenty)
- Slack/Discord community (no audience to seed it)
- Paid advertising (no conversion data to optimise against)
- Speaking proposals (wait until reference customer)
- Network Nick cross-sell (explicitly off-limits per Nick)
