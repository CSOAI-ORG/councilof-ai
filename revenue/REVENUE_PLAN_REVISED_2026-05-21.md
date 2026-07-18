# Revenue Plan — REVISED 2026-05-21

**Stripe state (just verified):** 0 customers · 0 subscriptions · 0 payment intents · 0 disputes. Pure £0 MRR after 4 weeks.

**Diagnosis:** Product is shipped, distribution is dead. The bottleneck is not what to sell or how to sell it — it's **getting any human to know we exist**.

## Honest framing — what changes today

The earlier MASTER_PLAN_2026-05-20.md said "build, then Show HN on June 3." That's still right for the headline event, but it's 13 days away and we've shipped enough product to start generating leads NOW. The revised plan front-loads attention work alongside the June 3 push.

## The 7 moves (this week)

### Move 1 — Make every shipped asset cross-promote every other asset (today, Claude executes)

- New page `meok.ai/anthropic-registry` listing all 22+ MCPs we have in the Registry today, with one-line `uvx` install + Stripe link. **Link-bait** for HN comments, Twitter mentions, Discord posts.
- Footer on every meok.ai page: "22+ MCPs now in Anthropic Registry — see them" → links to that page.
- Cross-MCP links in every README: "Sister MCPs" block (closes B5 portfolio-wide on the scorecard).

### Move 2 — Submit to every MCP directory (today, Claude executes)

- ✅ Anthropic Registry: 22 MCPs already in (14 added today)
- 🔜 Smithery.ai — submit top 14 flagships via smithery.yaml
- 🔜 Glama.ai — auto-indexes from GitHub repos with `glama.json` (most have it)
- ✅ mcp.so — issue #2170 already submitted (no engagement yet — Claude to bump it)

### Move 3 — Pre-stage 13 cold outreach messages (today, Claude writes; Nick fires Monday)

3a. **NIS2 DE (Mittelstand panic-buy) — 5 emails**
- Target: German CTOs/CISOs at 50+ employee firms missed the 6 March deadline
- Hook: "18,000 German firms missed the NIS2 deadline — here's the 30-minute fix"
- Lead: £49 self-serve / £999 done-for-you
- Velocity: highest right now (regulator activity increasing)

3b. **UK care homes (CQC compliance) — 5 emails**
- Target: independent care home operators
- Hook: "CQC inspection prep in a weekend, signed evidence pack included"
- Lead: £29/mo Care Home Compliance Pack
- Velocity: medium (Apollo template exists at `CARE_HOME_COLD_LIST_2026-04-29.md`)

3c. **EU AI Office / regulatory influencers — 3 LinkedIn DMs**
- Target: Risto Uuk (EU AI Office), Connor Dunlop, Casper Bowden equivalents
- Hook: "Open-source the EU AI Act compliance toolchain — would love your read"
- Lead: free for them, distribution amplifier
- Velocity: long-tail but highest leverage if any reply

### Move 4 — Hammer the funnel (today, Claude executes)

- Add UTM tracking to every Stripe link on every landing page (`?utm_source=<channel>&utm_campaign=may2026`)
- Add 1-tap Twitter share with @meok_ai mention from `/fine-calculator`, `/eu-ai-act`, `/catalogue`
- Verify /thanks renders the correct MCP for every slug (38 variants)
- Add email-capture footer ("Get the weekly EU AI compliance digest") to top lead-magnet pages

### Move 5 — Build the Anthropic Registry announcement page (today, Claude executes)

- `meok.ai/anthropic-registry`
- For each of 22 MCPs: one-line description + `uvx <name>-mcp` install + Stripe Starter buy link + Registry verify link
- Schema.org `WebApplication` JSON-LD per entry
- Trust badge cluster: Anthropic Registry · GitHub · PyPI · MIT · CSOAI LTD 16939677

### Move 6 — Social announcement push (Claude drafts; Nick fires within 24h)

- 280-char Twitter from @meok_ai
- 1,200-char LinkedIn post (when account recovered)
- Anthropic Discord #showcase post (4 paragraphs)
- 1 r/LocalLLaMA post drafted but **HOLD until Show HN Tue Jun 3** (don't waste the slot)

### Move 7 — Show HN final pre-launch (next week, Claude + Nick)

- Build out the MEOK Claw shell to a demoable state (Days 3-7 per architecture)
- Pre-stage hero screenshot
- Post Tuesday 3 June 14:00 UTC per `SHOW_HN_POST_2026-06-03.md`

## Conversion assumptions (so we know what's working)

| Channel | Volume | Conversion | Realistic 14-day £ |
|---|---|---|---|
| NIS2 DE cold (5/day × 14 = 70) | 70 | 1-2% | £49-£999 ×0.5-1.5 = **£25-£1.5K** |
| Care home cold (5/day × 14 = 70) | 70 | 1% | £29 ×0.7 = **£20/mo MRR start** |
| Twitter + Discord announcement | 50-500 visits | 0.5% | £29-£79 ×0.5 = **£15-£40** |
| /anthropic-registry organic | 100-500 visits | 1% | £29-£79 ×2 = **£60-£150 MRR start** |
| awesome-mcp PRs (if merged) | 2K-10K visits/month | 0.1% | £29-£79 ×2-10 = **£60-£800** |
| Show HN June 3 (if top-10) | 5K-30K visits | 0.3% | £29-£79 ×15-90 = **£450-£7K** |

**Realistic 14-day weighted EV: £600-£2,500 (mostly one-time + start of MRR)**

The point of this plan is NOT precision — it's directional. The realistic outcome is £200-£500 cash + £30-£60/mo MRR start. That's still **infinitely larger than £0**.

## Hard-decision triggers

Per MASTER_PLAN, hard decision Aug 20 if MRR <£1K. Track weekly:

| Week ending | MRR target | If miss |
|---|---|---|
| 2026-05-28 | £30/mo | Continue plan, no pivot |
| 2026-06-04 (post-HN) | £200/mo | Continue plan |
| 2026-06-11 | £400/mo | Continue, double down |
| 2026-06-18 | £700/mo | Continue |
| 2026-06-25 | £1.1K/mo | On track for Aug 20 cliff |
| 2026-08-20 | £1K+ MRR sustained | else → Templeman/farm primary, MEOK OSS side |

## Nick's manual checklist (max 4 hours total this week)

- [ ] Mon 26 May AM: Send 5 NIS2 DE cold emails (from pre-staged doc)
- [ ] Mon 26 May PM: Send 5 care home cold emails
- [ ] Tue 27 May: Send 3 influencer LinkedIn DMs (if account recovered) or via email
- [ ] Tue 27 May: Tweet from @meok_ai (use draft Claude provides)
- [ ] Wed 28 May: Anthropic Discord #showcase post (use draft)
- [ ] Thu 29 May: Buttondown signup (2 mins, tab already open)
- [ ] Fri 30 May: Open 3 awesome-mcp PRs from `revenue/AWESOME_MCP_PR_LINKS_2026-05-21.md`
- [ ] Sun 1 Jun: Pre-flight Show HN — final smoke test of meok.ai/os shell
- [ ] Tue 3 Jun 14:00 UTC: Submit Show HN per `SHOW_HN_POST_2026-06-03.md`
- [ ] Ongoing: Reply to every Stripe / form / email signal within 24h

## What Claude executes autonomously TODAY

In priority order:

1. Build meok.ai/anthropic-registry page (45 min)
2. Pre-stage the 13 cold outreach messages (60 min)
3. Add UTM tracking to all Stripe links + Twitter share buttons (30 min)
4. Submit smithery.yaml for top 14 flagships (45 min)
5. Add Sister MCPs cross-link block to 14 flagship READMEs (30 min)
6. Draft Twitter + LinkedIn + Discord announcement copy (15 min)
7. Add email-capture footer to top lead magnets (30 min)

**Total: ~4.5 hours of autonomous work today.**

Each one moves real revenue probability, none requires Nick's hands.
