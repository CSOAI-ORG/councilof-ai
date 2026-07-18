# Deep Research — Taking MEOK to the Next Level

**Date:** 2026-04-28
**Author:** Claude (autonomous strategy pass)
**Audience:** Nick — read this when sober and undistracted, with 45 minutes blocked.

This is not another content batch. This is the brutal pattern-match against where the money actually comes from in compliance SaaS / regulatory consulting at £0 ARR — and what's keeping you from it.

---

## 1. THE DIAGNOSIS — what's actually broken

You don't have a content problem. You have a **distribution problem dressed up as a content problem**.

**Surface inventory (verified live):**
- 100+ pages on meok.ai
- 23+ MIT MCPs on PyPI
- 15+ Stripe products spanning £49 → £14,990
- 4 deploy targets, all green
- HMAC-signed attestation API live
- Sitemap (119 URLs), robots.txt with AI crawler allowlist

**What's NOT happening:**
1. **Zero verified paid customers.** £0 ARR after months. Stripe dashboard is the only ground truth, not Google Analytics, not vanity metrics.
2. **Outreach written but not sent.** ~150 LinkedIn DMs, ~20 cold emails, 7 Reddit drafts, Show HN draft, NLnet grant draft — all in `/revenue/`, almost none actually fired.
3. **Sitemap not submitted to Google or Bing.** The single 5-minute task that unlocks indexing.
4. **Show HN never posted.** Highest-variance, lowest-cost distribution channel for a developer-tools-flavored product. Drafted multiple sessions, never posted.
5. **No social proof.** Zero case studies, zero quotes, zero "as featured in." For £4,950 audit bundles this is a gating problem.
6. **Pricing surface confusing.** £29 Starter, £49 SMB, £79 Pro, £99 Article-50 kit, £299/mo bias, £399/mo transparency, £499 NIS2-DE, £950/day, £1,499/mo Enterprise, £1,499 DORA-BE, £4,950 audit bundle. No buyer can navigate this.
7. **No retention loop.** Subscription products exist; no subscriber. The £79/mo tier doesn't have a clear "what do I get that I don't get free" answer that's worth £948/yr.
8. **No distribution channel of any kind.** Twitter: dormant. LinkedIn: not posting personal authority. Email list: doesn't exist. Discord/Slack community: doesn't exist. Newsletter: doesn't exist.

**The pattern:** every session ends with 5-10 new pages shipped. Not one new £ of revenue. The work feels like progress because pages go from non-existent to live. The work is not progress because pages with no traffic are inventory, not revenue.

---

## 2. THE BLUNT TRUTH

The next 30 days do NOT need:
- More pages
- More MCPs
- More articles
- More vs-comparison surfaces
- More countries / verticals
- More deeper FAQ schemas

The next 30 days need:
- **Send the outreach already written**
- **Post Show HN this week**
- **Submit the sitemap to GSC and Bing**
- **Get one paying customer**
- **Get one written testimonial / case study**
- **Cut Stripe SKUs from 15 to 5**

That is it. Everything else is procrastination dressed up as productivity.

---

## 3. CHANNEL ANALYSIS — ranked by £ per hour of effort

Rated 1-10 for: **Fit** (does this channel match buyer/product), **Speed** (days to first revenue), **Effort** (hours required), **Variance** (worst-case to best-case spread).

| Channel | Fit | Speed | Effort | Variance | Recommendation |
|---|---|---|---|---|---|
| **Cold email to specific buyer personas** | 9 | 7 | 4 | Mid | **DO THIS WEEK** |
| **Show HN post** | 9 | 9 | 2 | High | **DO THIS WEEK** |
| **LinkedIn DM to 30 boutique GRC firms** | 8 | 5 | 4 | Mid | **DO THIS WEEK** (drafts ready) |
| **Google Search Ads £500 test** | 7 | 8 | 3 | Mid | Week 2 |
| **Product Hunt launch (Tuesday)** | 6 | 8 | 4 | High | Week 2-3 |
| **Reddit drip** | 7 | 6 | 5 | Low | Week 2 onward, 1 post/day |
| **Partnership with notified body** | 9 | 3 | 6 | High | Month 2 |
| **Speaking at IAPP/AI4Europe** | 8 | 2 | 8 | Mid | Month 3+ (CFP cycles) |
| **Earned media (Sifted, The Register)** | 7 | 4 | 5 | High | Month 2 |
| **Newsletter "EU AI Compliance Brief"** | 9 | 3 | 7 | Low | Month 2 (compounding) |
| **Build Slack/Discord community** | 6 | 1 | 9 | Low | DON'T (not your strength) |
| **More SEO content** | 6 | 1 | 9 | Low | **STOP UNTIL £1K MRR** |

**Top 3 picks for next 7 days:** cold email + Show HN + LinkedIn DMs. All three have drafts already written. Total execution time: ~6 hours of YOUR time. Worst case: nothing happens. Best case: 1-3 paid customers + Show HN traffic spike.

---

## 4. SPECIFIC TACTICS YOU HAVEN'T TRIED

These are concrete, not aspirational. Each one I'll give: **what**, **why**, **how**, **time**, **expected outcome**.

### 4.1 — Sell to YC W26 / S26 batches directly
- **What:** Filter YC company directory for AI / AI-adjacent products, EU exposure. Cold email YC founders directly.
- **Why:** YC founders are well-funded, decision-makers, and disproportionately ship to EU. They face Article 50 + Article 4 immediately. Many will pay £79/mo without thinking.
- **How:** Open https://www.ycombinator.com/companies?batch=W26 → filter "Artificial Intelligence" → cold-email pattern "Hi {name}, fellow founder. We built MEOK because we got tired of telling YC peers 'no we can't do EU AI Act ourselves'. Quick question — are you shipping to EU customers yet? Free 30-min if useful."
- **Time:** 2 hours (50 emails)
- **Expected:** 5-15% reply rate (YC peers reply to YC peers); 2-4 paid signups in 30 days

### 4.2 — Listing on each MCP marketplace, not just MCPize
- **What:** Submit MEOK MCPs to: official Anthropic Registry (DONE), MCPize (pending), Smithery, Glama.ai, MCP Market, mcp.so, awesome-mcp-servers (GitHub).
- **Why:** Each marketplace = ~50-500 weekly developer impressions. 5 listings × 500 weekly = 2,500 weekly = ~10K monthly developer eyeballs.
- **How:** Each marketplace has different submission. MCPize is a web form (15 min). Smithery requires HTTP MCP (skip — ours are stdio). Glama scrapes GitHub (just star + topic-tag). awesome-mcp-servers is a PR.
- **Time:** 4 hours total
- **Expected:** ~100 weekly clicks to PyPI pages, ~10/week Pro tier signup conversations

### 4.3 — Productize the SCORECARD as a lead magnet email sequence
- **What:** Anyone who runs /scorecard → captures email → 7-day drip sequence → pitches /audit-prep-bundle.
- **Why:** Right now scorecard runs and produces a signed PDF. There's no email capture, no follow-up, no upsell sequence. You're throwing away your highest-intent prospects.
- **How:** Add `<input email>` to scorecard before showing result. Save to mailchimp/buttondown free tier (or `meok-attestation-api`). Drip 1: result + sample audit-bundle artifact (day 0). Drip 2: case-study-style "what we usually find when bundling" (day 2). Drip 3: ladder pitch — Article 50 kit £99 / audit bundle £4,950 / consulting £950/day (day 4). Drip 4: testimonial / urgency (day 7).
- **Time:** 6 hours to wire (capture form + 4 emails + scheduler)
- **Expected:** Scorecard runs ~3-15/week organically right now. Capturing 50% of those = 1.5-7 emails/week into nurture = 1-3 paid customers/quarter from existing organic traffic alone.

### 4.4 — Buy / barter case study from one paying customer
- **What:** Offer FIRST 3 paying customers free year of Pro tier in exchange for a 200-word testimonial + logo permission. Even if "customers" are friends-of-friends or warm intros.
- **Why:** Case studies are the bottleneck for £4,950 sales. Without a single one, the sales gap to mid-market is structural.
- **How:** Ask Innovate UK contacts, AI startup founders Nick already knows, ex-CSGA contacts (severed but real), London AI scene people. Even 1 testimonial in 30 days unblocks the next 6 months of outbound sales.
- **Time:** Week of warm-intro work
- **Expected:** 1-3 testimonials by end of month → unlocks all higher-ACV pricing tiers

### 4.5 — Aggressive partnership letter to 5 Notified Bodies
- **What:** Direct outreach to UK + EU Notified Bodies for AI Act conformity assessment (BSI, TÜV, DEKRA, Eurofins, Mendix, Bureau Veritas).
- **Why:** Notified Bodies need PRE-BUILT evidence packs from clients. Right now they get bespoke documentation. MEOK ships standardized signed evidence packs they can ingest. They become referral channel.
- **How:** Email pattern: "Hi {NB compliance lead}, I run MEOK AI Labs (UK Companies House 16939677). We ship pre-built EU AI Act evidence packs that arrive in your conformity-assessment process already standardized. Quick 20-min call to see if reduced friction is interesting?"
- **Time:** 3 hours (5 emails + research)
- **Expected:** 1-2 NBs reply curious. Even one referral relationship = 5-20 leads per quarter at £4,950 each.

### 4.6 — Innovate UK + Horizon Europe grant applications
- **What:** Apply for Innovate UK's "Smart Grants" + Horizon Europe Cluster 4 (Digital, Industry, Space — AI module) for "EU regulatory automation tooling for SMEs."
- **Why:** Both have explicit funding lines for compliance/AI tooling at SME scale. Innovate UK Smart Grants up to £500K, Horizon Europe up to €2M consortium.
- **How:** Smart Grants close monthly; next deadline check at gov.uk. Horizon Europe Cluster 4 calls in autumn 2026.
- **Time:** 30-60 hours per application (substantial)
- **Expected:** 5-10% acceptance rate. £100K-£500K cash if accepted, in addition to revenue.

### 4.7 — "EU AI Compliance Brief" weekly newsletter
- **What:** 1-page weekly email summarizing: this week's regulatory news, one practical tip, one paid resource link.
- **Why:** Compounding distribution. Newsletter subscribers convert to customers at 5-15× the rate of cold traffic. After 6 months at 50 subs/week growth = 1,200 subs = ~30-100 paying customers if conversion holds.
- **How:** Buttondown.email free tier. Substack also fine. Write Sunday → ship Monday morning UK 8:00.
- **Time:** 90 min/week ongoing
- **Expected:** First 3 months you have <100 subscribers and feel pointless. Months 4-12 it becomes a moat.

### 4.8 — Speaking circuit pitch
- **What:** Submit speaker proposals to IAPP Europe Data Protection Congress (Brussels, November), AI4Europe (Paris), CogX (London), London AI Summit, Web Summit (Lisbon), TechBBQ (Copenhagen).
- **Why:** Speaking establishes authority. Even an unsuccessful CFP gets your name on the radar. Successful talks drive 10-100 inbound leads each.
- **How:** Each event has a Call for Papers. Topic: "Surviving the EU AI Act as an SME — what 100 companies got wrong." 3-paragraph abstract + bio.
- **Time:** 2 hours per submission, 6 events = 12 hours
- **Expected:** 1-2 acceptances. Each talk = 50-200 inbound leads.

### 4.9 — Lock in 1-2 enterprise design partners at discount in exchange for case study + co-marketing
- **What:** Offer 2 mid-market companies your full audit-prep bundle FREE in exchange for: (a) public case study, (b) joint webinar, (c) intro to 3 peers.
- **Why:** Trades short-term cash for long-term trust + leads. Two design partners can drive 10× their value via referral.
- **How:** Target: pre-IPO scale-ups in EU with AI exposure. London AI scene Nick already knows. Berlin + Paris AI startups via cold email.
- **Time:** 4 weeks of warm-intro work
- **Expected:** If 1 lands → unlocks £100K+ in downstream sales over 12 months.

### 4.10 — Switch SCORECARD to embed widget — distributed via partnerships
- **What:** Make /scorecard available as embed-script (single-line `<script>` tag) so partner sites (consultancies, MSPs, Notified Bodies, lawyer blogs) can host it on their pages, branded as "EU AI Act Readiness — powered by MEOK".
- **Why:** Distribution = scorecard lives on 50 partner sites instead of 1. Each embed = constant lead-capture surface. White-label with revenue share to partners.
- **How:** Wrap the scorecard as iframe / web-component. Add `?utm_source=partner-X` parameter for attribution. Pay 30% revenue share on conversions.
- **Time:** 2 days engineering + outreach
- **Expected:** 5-10 partners in first quarter. Each partner site = 5-50 scorecard runs/month = 1-5 paid converts/quarter.

---

## 5. PRICING / POSITIONING — radical simplification

Current: 15+ Stripe products. Buyer paralysis.

Proposed:

| Tier | Price | Audience | What you actually get |
|---|---|---|---|
| **Free** | £0 | Solo dev / small SaaS | Full /scorecard + /fine-calc + 23 MIT MCPs + signed attestations (rate-limited) |
| **Pro** | £79/mo | AI startup / SME | Unlimited rate-limited attestations + private MCPs + remote signing + monthly EU compliance digest |
| **Audit-Prep** | £4,950 once | Mid-market 50-200 ppl | 14-day delivered: full evidence pack EU AI Act + DORA + NIS2 + CRA + signed verifier |
| **Enterprise** | £1,499/mo | 200+ ppl, regulated | Pro + dedicated Slack + custom MCPs + monthly review + co-branded scorecard |
| **Consulting** | £950/day | Specialist need | Contracted blocks; minimum 5-day engagement |

**Kill or roll into Pro:**
- £29 Starter (no buyer needs this when Free covers it)
- £49 SMB (same)
- £99 Article 50 kit (roll into Pro as included template)
- £299/mo bias (roll into Enterprise as included)
- £399/mo transparency (roll into Enterprise as included)
- £499 NIS2-DE (kill or move to country-specific consulting)
- £1,499 DORA-BE (kill or move to consulting)

**Result:** 5 Stripe products instead of 15. Each one obvious to its buyer. Clear ladder.

---

## 6. THE 30-DAY PLAN

### Week 1 (this week)
- **Mon:** Send 6 LinkedIn DMs (Tier 1 list from `LINKEDIN_DMS_BOUTIQUE_GRC_2026-04-27.md`)
- **Tue 8am UK:** Post Show HN with `SHOW_HN_2026-04-27.md` draft
- **Tue:** Submit sitemap to GSC + Bing + IndexNow (10 min)
- **Wed:** Send 6 LinkedIn DMs (next 6 from Tier 1)
- **Thu:** Submit MEOK MCPs to MCPize (web form, 15 min × 5 = 75 min)
- **Fri:** Send 6 LinkedIn DMs + 1 Reddit post (r/cybersecurity)

### Week 2
- **Mon:** Send 6 LinkedIn DMs (Tier 2 list)
- **Tue:** Post Product Hunt — coordinate with Show HN echo
- **Wed:** Send 6 LinkedIn DMs (Tier 2 cont)
- **Thu:** Cold-email 50 YC W26 founders (template in §4.1)
- **Fri:** Cold-email 5 Notified Bodies (template in §4.5)

### Week 3
- **Mon:** Wire scorecard email-capture + 4-day drip sequence
- **Tue:** Reduce Stripe products from 15 → 5 (per §5)
- **Wed:** Submit speaker proposals to 3 events (IAPP, AI4Europe, CogX)
- **Thu:** Reach out to 5 design-partner candidates
- **Fri:** First newsletter issue ("EU AI Compliance Brief" #1)

### Week 4
- **Mon:** Apply for Innovate UK Smart Grants
- **Tue:** Begin embed-widget engineering for scorecard
- **Wed:** Newsletter issue #2
- **Thu:** Cold-email 50 more YC W26/S26 founders
- **Fri:** Review week-by-week Stripe revenue + iterate

**Required from Nick:** ~6 hours/week of HUMAN execution (sending, posting, replying). Not building. Not writing more pages. Sending.

---

## 7. WHAT TO STOP DOING

I (Claude) have spent ~30 hours this session shipping pages. Honestly: most of those pages are not the bottleneck. **The bottleneck is human distribution.**

Stop:
- Building more vs-X comparison pages (we have 9, that's enough)
- Building more EU AI Act article pages (we have 12, that's enough)
- Building more vertical landing pages (we have 7, sufficient for 1Q)
- Drafting more outreach without sending the existing drafts
- Writing more blog posts before the existing ones are indexed and getting traffic
- Adding more Stripe products (consolidate, don't expand)

Start:
- Sending what's drafted
- Posting Show HN
- Submitting sitemaps
- Email capture on scorecard
- Pricing simplification
- Newsletter discipline

---

## 8. FINANCIAL CALIBRATION

**Realistic 30-day outcomes if you execute the 30-day plan above (not aspiration, calibration):**

| Outcome | Probability | Revenue impact |
|---|---|---|
| 0 paid customers | 25% | £0 |
| 1-2 Pro tier signups (£79/mo) | 35% | £158-£316 |
| 3-5 Pro signups + 1 Audit bundle | 25% | £237-£395 + £4,950 = £5K |
| Show HN front page hit (1 of 30 days) | 30% | drives ↑ to next tier |
| 1 design partner signed | 20% | £0 cash, +£100K LTV |
| Speaking proposal accepted | 30% | £0 immediate, +50-200 leads in Q3 |
| Innovate UK grant won | 5% | £100K-£500K cash |

**Expected value:** £1.5K - £8K cash in next 30 days, ~£200-£800 MRR added. Plus 1-2 design partners / NB partnerships in the pipeline that compound.

**Compare to:** £0 forever if you keep building pages instead of selling.

---

## 9. THE ANTI-PORTFOLIO — what NOT to do

- **DON'T** build more compliance frameworks for non-EU jurisdictions until EU is profitable. Singapore PDPA, India DPDP, California CPPA — interesting but distractions.
- **DON'T** add personal AI / character / sovereign-OS surface to compliance landing pages. The personal AI is a separate product that confuses compliance buyers.
- **DON'T** rebuild the homepage again. It's fine.
- **DON'T** offer free 1-hour consultations to anyone. Free 30-min for qualified leads only.
- **DON'T** chase Innovate UK / Horizon Europe before sending the cold emails. Grants are 6-12 month timelines; emails close in days.
- **DON'T** build a Slack community. You don't have the audience to seed it. Newsletter first, community second.
- **DON'T** apologize in cold outreach. "Hey sorry to bother you" = automatic delete. Lead with: are you shipping to EU? yes? we should talk. that's it.
- **DON'T** keep iterating SEO content. The pages we have will rank in 60-180 days. New pages don't accelerate that.

---

## 10. ONE-LINER

**You're not £0 ARR because the product is bad. You're £0 ARR because nobody knows you exist. Stop building. Start telling.**

---

## Appendix A — what's already drafted, ready to send

| Asset | File | Status | Time to send |
|---|---|---|---|
| 30 LinkedIn DMs | `LINKEDIN_DMS_BOUTIQUE_GRC_2026-04-27.md` | drafted, never sent | 2h over 5 days |
| 7 Reddit cross-posts | `REDDIT_CROSSPOSTS_2026-04-27.md` | drafted, never sent | 1h over 7 days |
| Show HN | `SHOW_HN_2026-04-27.md` + `SHOW_HN_DRAFT_2026-04-26.md` | drafted, never posted | 5 min |
| Risto Uuk outreach | `RISTO_UUK_OUTREACH_2026-04-27.md` | drafted | 5 min |
| 5 Sedo listings | `SEDO_LISTINGS_2026-04-27.md` | drafted | 30 min |
| NIS2-DE coldmail batch | `NIS2_DE_COLDMAIL_BATCH_2026-04-27.md` | drafted | 1h |
| OEM outreach (5/5 sent ✓) | `OEM_OUTREACH_2026-04-27.md` | DONE | n/a |
| GSC / Bing / IndexNow | `SEARCH_CONSOLE_SUBMISSION_2026-04-27.md` | instructions ready | 15 min |
| MCPize submissions | `MCPIZE_SUPPORT_EMAIL_2026-04-26.md` | instructions ready | 75 min |
| NLnet grant | `NLNET_GRANT_DRAFT_2026-04-26.md` | drafted | 2h to refine + submit |

**Total time to send EVERY drafted asset: ~10 hours across 1-2 weeks.**
**Cost in cash: £0.**
**Likely revenue impact: £158-£5,000+ in 30 days.**

---

## Appendix B — what I'm going to ship next autonomously (without auth)

If you want me to keep building while you handle the human-execution side:

1. **Email capture form on /scorecard** — wire it to a basic JSON file or webhook. (3 hr coding)
2. **4-email drip sequence** for scorecard runners. (2 hr writing + 1 hr scheduler)
3. **Embed widget version of /scorecard** for partner sites. (4 hr engineering)
4. **Stripe consolidation** — archive 10 SKUs, leave 5 clean ones. (1 hr)
5. **Newsletter MVP page** — `/newsletter` landing page + Buttondown integration. (2 hr)
6. **`/case-studies` placeholder** — shell page ready for first testimonial. (1 hr)

Pick which of these you want me to do next. I'd recommend #1 + #5 first — they capture leads from existing traffic while you do the human-execution side.

---

**End of deep research. Read it twice. Then go send LinkedIn DMs.**
