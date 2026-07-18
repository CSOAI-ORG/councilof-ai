# Session deliverables — 2026-05-21 (Thursday)

**Revenue state:** still £0 in Stripe at session start. All changes today push **demand-generation surface area**, not new products — because product is fine, attention is the constraint.

## Week 1 MASTER_PLAN execution (shipped today)

| # | Deliverable | Status | Live URL |
|---|---|---|---|
| 1 | /thanks SSR fix (split server + client) | ✅ live | meok.ai/thanks |
| 2 | Pricing SoT refresh against live Stripe | ✅ committed | revenue/PRICING_SOURCE_OF_TRUTH.md |
| 3 | csoai.org → 1-page legal-entity notice | ✅ live | csoai.org |
| 4 | councilof.ai → 301 to meok.ai/catalogue | ✅ live | councilof.ai |
| 5 | llms.txt + JSON-LD on 6 reachable domains | ✅ live | meok / csoai / templeman / haulage / grabhire / cobolbridge |
| 6 | 3 awesome-mcp PR branches pushed | ✅ branches ready | CSOAI-ORG forks (Nick clicks compare URLs) |
| 7 | 14 MCPs published to Anthropic Registry | ✅ live | registry.modelcontextprotocol.io (total 47 CSOAI-ORG) |
| 8 | MCP toolchain (5 scripts + 100-pt scorecard) | ✅ committed | mcp-marketplace/_template/scripts/ |
| 9 | Show HN post draft | ✅ ready | revenue/SHOW_HN_POST_2026-06-03.md |
| 10 | muckaway / grabhire LoopFactory → MEOK | ✅ live | muckaway-site.vercel.app · grabhire.ai |
| 11 | MEOK Claw /os 3-pane shell scaffold | ✅ live | meok.ai/os (Day 2 of 12) |
| 12 | Portfolio scorecard run (266 MCPs) | ✅ committed | revenue/PORTFOLIO_SCORECARD_2026-05-21.md |

## Revised revenue plan moves (shipped today)

| # | Deliverable | Status |
|---|---|---|
| 1 | Revised 7-move revenue plan | ✅ revenue/REVENUE_PLAN_REVISED_2026-05-21.md |
| 2 | /anthropic-registry public announcement page (47 MCPs) | ✅ live meok.ai/anthropic-registry |
| 3 | 13 pre-staged cold outreach messages (5 NIS2 DE + 5 care + 3 DM) | ✅ revenue/SEND_THESE_MONDAY_2026-05-26.md |
| 4 | Social announcement copy (Twitter + LinkedIn + Discord) | ✅ revenue/SOCIAL_ANNOUNCEMENTS_2026-05-21.md |
| 5 | Sister MCPs cross-link block on 16 flagship READMEs (pushed) | ✅ live on GitHub |
| 6 | EmailCapture component + wired on /fine-calculator + /anthropic-registry | ✅ deploying |
| 7 | Smithery + Glama submissions | ◐ partial — files present, Smithery needs auth submission (Nick) |

## What's live and shippable for Show HN (June 3)

- meok.ai/os — 3-pane shell skeleton, ship target Sun June 1 (Days 3-7 to wire)
- meok.ai/anthropic-registry — 47-MCP catalogue with Stripe CTAs + JSON-LD + Twitter share
- meok.ai/fine-calculator — EU AI Act €35M/€15M/€7.5M penalty calculator + lead magnet
- meok.ai/thanks — SSR'd post-purchase landing per-MCP
- meok.ai/catalogue, /pricing, /audit-prep-bundle — existing pages
- All 47 MCPs in Anthropic Registry · 247 PyPI packages · 16 with Sister MCPs cross-link

## Nick's manual checklist (Monday 26 May, ~80 mins)

- [ ] **09:00 BST** — Send 5 NIS2 DE cold emails (template ready, just fill prospects)
- [ ] **11:00 BST** — Send 5 UK care home cold emails (template + CQC public register URL ready)
- [ ] **14:00 BST** — 3 LinkedIn DMs (Risto Uuk / Connor Dunlop / Daniel Leufer)
- [ ] Tweet from @meok_ai (280-char copy ready)
- [ ] Anthropic Discord #showcase post (4-paragraph copy ready)
- [ ] Click 3 compare URLs to open awesome-mcp PRs (revenue/AWESOME_MCP_PR_LINKS_2026-05-21.md)
- [ ] Buttondown signup (2 min)
- [ ] LinkedIn account recovery (form ready: revenue/LINKEDIN_ACCOUNT_RECOVERY_EMAIL_2026-04-28.md)
- [ ] Sun 1 Jun — final smoke test of meok.ai/os
- [ ] Tue 3 Jun 14:00 UTC — Submit Show HN per revenue/SHOW_HN_POST_2026-06-03.md
- [ ] **Ongoing** — Reply to every inbox signal within 24h

## Realistic 14-day revenue EV

| Channel | Realistic outcome |
|---|---|
| Cold outreach (10 emails) | 1 reply, £49-£999 closed |
| Twitter + Discord announcement | 50-500 visits, 0-1 conversion |
| /anthropic-registry organic | 100-500 visits/week, 1-3 starter signups |
| awesome-mcp PRs merged | 2K-10K visits/month over time |
| Show HN June 3 (if top-10) | 5K-30K visits, 5-15 conversions |
| **Weighted 14-day EV** | **£200-£500 cash + £30-£90 MRR start** |

Infinitely larger than £0. Tracks against MASTER_PLAN Aug 20 hard-decision cliff.

## What's still blocked (waiting on Nick)

- Buttondown not signed up (newsletter can't actually send yet — EmailCapture forms-only)
- LinkedIn deleted (3 DMs can't fire until recovered OR sent via email backup)
- Apollo not set up (NIS2 + care home cold outreach quality limited by manual prospect research)
- 3 PyPI republishes needed for `ai-incident-reporting / dora-nis2-crosswalk / watermarking-authenticity` ownership tag propagation (then they publish to Registry too)
- 5 MCPs need first PyPI publish (`mitre-attack / mitre-atlas / slsa-supply-chain / sigstore-cosign / cisa-kev`)

## Hard decision triggers (per MASTER_PLAN)

| Week ending | MRR target | Status today |
|---|---|---|
| 2026-05-28 | £30/mo | £0, on watch |
| 2026-06-04 (post-HN) | £200/mo | depends on HN landing |
| 2026-08-20 | £1K+ sustained | if miss → MEOK to OSS side, Templeman + farm primary |
