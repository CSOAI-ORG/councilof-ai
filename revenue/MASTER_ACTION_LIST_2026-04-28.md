# Master Action List — 28 April 2026

**Sole source of truth.** All other /revenue/ files reference back here. Updated as items move between sections.

---

## 🔥 DO TODAY (high leverage, ~2 hours total)

### 1. Submit GSC sitemap (3 min) — your auth required
- URL: https://search.google.com/search-console
- Add property `https://meok.ai` if not already there
- Sitemaps → Add → `sitemap.xml`
- Detailed steps: `revenue/GSC_BING_INDEXNOW_INSTRUCTIONS_2026-04-28.md`

### 2. Submit Bing sitemap (2 min) — your auth required
- URL: https://www.bing.com/webmasters
- Add site, verify (can import from Google), sitemap → `https://meok.ai/sitemap.xml`

### 3. Send 6 LinkedIn DMs from Tier 1 list (45 min)
- File: `revenue/LINKEDIN_DMS_BOUTIQUE_GRC_2026-04-27.md` (Tier 1 lists 8 boutique GRC firms)
- Stagger: 6 today, 6 tomorrow, etc.
- DO NOT exceed 10 connection-requests/day (LinkedIn velocity ban)

### 4. Submit LinkedIn account recovery form (10 min)
- URL: https://www.linkedin.com/help/linkedin/ask/TS-RAA
- Full form text in `revenue/LINKEDIN_ACCOUNT_RECOVERY_EMAIL_2026-04-28.md`
- After submission: wait 5 business days, then escalate via privacy@linkedin.com

### 5. Post Show HN — Tuesday or Wednesday 7-9am UK
- URL: https://news.ycombinator.com/submit
- Full text: `revenue/SHOW_HN_FINAL_2026-04-28.md` (title + URL + first comment)
- Stay at keyboard for first 30 min to reply to comments

---

## 🏗 DO THIS WEEK (medium leverage)

### 6. `gh auth refresh -s public_repo,repo` (30 sec)
- Unblocks awesome-mcp-servers PRs to wong2/appcypher repos
- Then I can autonomously submit PRs

### 7. Set up Buttondown account (10 min)
- URL: https://buttondown.email
- Create newsletter handle: `meok-eu-ai-compliance-brief`
- Domain verify (DNS TXT on Namecheap, ~10 min propagation)
- Once live, the `/scorecard` and `/newsletter` pages auto-capture subscribers
- Drip sequence ready in `revenue/SCORECARD_DRIP_SEQUENCE_2026-04-28.md` — paste 4 emails into Buttondown automation

### 8. Test Stripe end-to-end with £1 test product (15 min)
- Create a £1 test product in Stripe
- Buy it through the buy.stripe.com link to confirm webhook fires
- Verify fulfillment email arrives
- After test: refund yourself

### 9. Reddit drip (1 hr/day, 7 days)
- File: `revenue/REDDIT_CROSSPOSTS_2026-04-27.md`
- 1 post/day, max 4 subs/day
- Stay at keyboard for first 30 min to reply

### 10. Send 5 Notified Body cold emails (30 min)
- Targets: BSI, TÜV, DEKRA, Eurofins, Bureau Veritas
- Template in `revenue/DEEP_RESEARCH_NEXT_LEVEL_2026-04-28.md` §4.5

### 11. Send 50 YC W26 founder cold emails (2 hr)
- Filter: https://www.ycombinator.com/companies?batch=W26 → "Artificial Intelligence"
- Template in `revenue/DEEP_RESEARCH_NEXT_LEVEL_2026-04-28.md` §4.1

---

## 📈 DO THIS MONTH (compounding distribution)

### 12. Apply for Innovate UK Smart Grants
- URL: gov.uk/government/collections/innovate-uk-smart-grants
- Next deadline: monthly. Check current.

### 13. NLnet grant submission (already drafted)
- File: `revenue/NLNET_GRANT_DRAFT_2026-04-26.md`
- Submit at https://nlnet.nl/propose

### 14. Speaking proposals (3 events)
- IAPP Europe Data Protection Congress (Brussels, November) — CFP usually open July
- AI4Europe (Paris) — CFP varies
- CogX (London) — CFP typically March

### 15. Newsletter discipline
- Sunday write, Monday 8am UK send
- Issue 1 should land Monday after Buttondown is live
- 90 min/week ongoing

### 16. Design partner hunt (2 weeks of warm-intro work)
- Target 5 candidates: pre-IPO scale-ups in EU with AI exposure
- Offer: 50% off audit-prep bundle + free year Pro + co-marketing
- Goal: 1 testimonial + 1 case study by end of Q2

---

## ✅ DONE THIS SESSION (autonomous, no Nick auth)

| Item | Where |
|---|---|
| `/blog` 500 fix → 200 OK | meok.ai/blog (live) |
| IndexNow key generated + 42 URLs pushed to Bing/Yandex (HTTP 202) | done autonomously |
| GitHub topic-tags on 10 MCP repos for Glama.ai auto-scrape | done autonomously |
| Stripe consolidation: 453 → 80 active products (373 archived) | done autonomously |
| Updated "23+ MCPs" → "31+ MCPs" across 3 meok.ai pages | done autonomously |
| Hero SSR fix: removed `useState(null)` early-return that hid compliance grid from crawlers | done autonomously, deploying |
| 5 new pages: /newsletter /partners /scorecard/embed /scorecard-buttondown /case-studies (already had) | live |
| 4-email drip sequence ready for Buttondown | `revenue/SCORECARD_DRIP_SEQUENCE_2026-04-28.md` |
| Show HN copy-paste-ready | `revenue/SHOW_HN_FINAL_2026-04-28.md` |
| GSC + Bing + IndexNow instructions | `revenue/GSC_BING_INDEXNOW_INSTRUCTIONS_2026-04-28.md` |
| LinkedIn recovery 3-step plan | `revenue/LINKEDIN_ACCOUNT_RECOVERY_EMAIL_2026-04-28.md` |
| Master rundown audit | `revenue/RUNDOWN_AUDIT_2026-04-28.md` |
| Deep research strategy | `revenue/DEEP_RESEARCH_NEXT_LEVEL_2026-04-28.md` |
| LinkedIn DMs to 30 boutique GRC firms drafted | `revenue/LINKEDIN_DMS_BOUTIQUE_GRC_2026-04-27.md` |
| Reddit drafts for 7 posts | `revenue/REDDIT_CROSSPOSTS_2026-04-27.md` |

---

## 🚧 BLOCKED ON (something else, can't unblock unilaterally)

### proofof.ai DNS migration
- DNS still on Cloudflare
- Needs your Cloudflare account access
- Then we can swap DNS to Vercel (10 min once unblocked)

### Anthropic MCP Registry: 21 packages missing
- Need to publish 21 non-`meok-*`-prefixed packages to Registry under `io.github.CSOAI-ORG/{name}`
- I CAN do this autonomously — just confirm you want me to (yes implies the next session does it)

### LinkedIn data restoration
- Pending your form submission + their response
- Realistic outcome: GDPR Article 15 response confirming data was deleted (60-80% probability)
- Full restoration <5% if >30 days since deletion

---

## 📊 Weekly KPIs to track (every Sunday)

| KPI | Target by 30 May | Tracking method |
|---|---|---|
| Stripe charges (any) | 1 | `stripe charges list` |
| Newsletter subscribers | 25 | Buttondown dashboard |
| GSC indexed pages | 50 | GSC → Pages → Indexed |
| Bing indexed pages | 30 | Bing Webmaster |
| LinkedIn DM replies | 5 | manual count |
| Show HN front page hit | 1 successful | HN analytics |
| Design partner conversations | 2 | calendar events |
| Newsletter issues sent | 4 | Buttondown |

---

## 🔴 CRITICAL — single highest-leverage move

**If you only do ONE thing this week, post Show HN Tuesday or Wednesday 7-9am UK.**

5 minutes of work. Highest variance of any distribution channel. Single front-page hit drives 5K-50K visitors + Perplexity + ChatGPT citations for months.

`revenue/SHOW_HN_FINAL_2026-04-28.md` has the title, URL, and first comment ready. Just paste and submit.

After Show HN, the next compounding move is the Buttondown newsletter — every week of issue 1, 2, 3 is one more rung up the SEO + authority ladder.

---

## NOT WORTH DOING

These look productive but have low ROI right now. Skip them until £1K MRR:

- More vs-comparison pages (we have 9, sufficient)
- More EU AI Act article pages (we have 12, sufficient)
- More vertical landing pages (we have 7, sufficient)
- More SEO content (existing 100+ pages need to rank first; new content doesn't help)
- New countries / NIS2 variants (Germany kit isn't selling yet; build France/Italy after Germany sells)
- New MCPs (we have 31+ on PyPI, only 8 in Registry — fix the gap, don't widen it)
- More Stripe products (just consolidated 453→80, don't add)
- Slack/Discord community (no audience to seed it; newsletter first)
- Twitter automation (no follower base; manual is fine)
