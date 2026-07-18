# REMAINING WORK PLAN — Everything left to do
## To push 78/100 → 100/100

**Date:** 2026-05-13 | **Current MRR:** £0 | **Target:** all-channels-flowing

This document lists every remaining task across the portfolio, split by:
- **A** — what I (Claude) can do autonomously
- **B** — what needs Nick's hands (10 things, mostly logins / DNS / dashboards)

Total autonomous work: 47 tasks. Total Nick tasks: 11. Total time to 100/100: ~6h of Nick + ~3 days of compute.

---

## PART A — AUTONOMOUS WORK (Claude will execute)

### A1. PYPI + DISTRIBUTION (Layer 1: Awareness)

| # | Task | Effort | Output |
|---|------|--------|--------|
| 1 | Complete PyPI publish for 19 pending packages (smart_publish.sh in 62-min sleep, will resume) | running | All 38 governance/A2A/trade/cyber/industry MCPs live |
| 2 | Submit 23 new packages to official MCP Registry via mcp-publisher | 30 min | Listed on registry.modelcontextprotocol.io |
| 3 | Build + run Smithery batch submission (`smithery mcp publish` per package) | 20 min | Listed on smithery.ai |
| 4 | Build glama.json metadata for all 38 governance MCPs (Glama auto-indexes) | 15 min | Glama listings refresh within 24h |
| 5 | Build PulseMCP submission entries (JSON-LD format) | 10 min | Submit form ready to paste |
| 6 | Publish meok-setup CLI to npm (`npm publish`) | 5 min | `npx meok-setup` works anywhere |
| 7 | Update meok.ai/sitemap.xml to include all 38 governance MCP pages | 5 min | 72 → 110 URLs in sitemap |
| 8 | Build Show HN draft post + Hacker News submission template | 15 min | Ready to post when karma allows |
| 9 | Build Product Hunt launch assets (gallery images, copy, tagline) | 20 min | Ready to schedule |
| 10 | Draft Newsletter Issue #2 (governance digest, MEOK updates) | 15 min | Ready in `revenue/NEWSLETTER_ISSUE_02.md` |
| 11 | Build 3 v2 cold email templates with industry personalization | 20 min | Templates by vertical (fintech, medtech, edtech) |
| 12 | AEO content: add Q&A schema to top 10 MCP READMEs | 30 min | Better Perplexity/ChatGPT visibility |

**Subtotal: 12 tasks · ~3h of autonomous work · Pushes Layer 1 from 70 → 95**

### A2. CONTENT + DOCUMENTATION (Layer 2: Interest)

| # | Task | Effort | Output |
|---|------|--------|--------|
| 13 | Build interactive scorecard widget (Tailwind + Alpine.js) embeddable on meok.ai pages | 30 min | Live calculator on /eu-ai-act, /dora, /nis2 pages |
| 14 | Replace placeholder 0+ counters on meok.ai with live PyPI download API calls | 20 min | "7,505 downloads/mo" shows real-time |
| 15 | Build 5 case study templates ready to fill once first customer lands | 20 min | `revenue/CASE_STUDY_TEMPLATES/` |
| 16 | Add embedded code playground to each MCP page (Try this MCP in your browser) | 45 min | Visitors can test before installing |
| 17 | Build .mcpb bundles for top 5 governance MCPs (currently only EU-AI-Act has one) | 30 min | One-click Claude Desktop install for DORA/NIS2/CRA/bias/AI-BOM |
| 18 | Write blog post: "How we shipped 38 governance MCPs in 3 weeks" | 25 min | meok.ai/blog post, social proof |
| 19 | Write blog post: "EU AI Act Article 50 + C2PA + Sigstore = the watermarking moat" | 25 min | Technical authority + backlinks |
| 20 | Auto-generate manifest.json for top 10 .mcpb candidates | 15 min | Ready for next .mcpb build run |

**Subtotal: 8 tasks · ~3.5h · Pushes Layer 2 from 97 → 100**

### A3. CONVERSION INFRASTRUCTURE (Layer 3)

| # | Task | Effort | Output |
|---|------|--------|--------|
| 21 | Wire Resend transactional email into meok-attestation-api `/provision` endpoint | 45 min | Welcome email auto-sends with API key after Stripe purchase |
| 22 | Wire Resend onboarding drip: day 1 (welcome), day 3 (use case), day 7 (case study), day 14 (upgrade reminder) | 60 min | 4-email sequence in Resend |
| 23 | Add `/dashboard` route to meok.ai for logged-in customer self-serve (usage stats, key rotation) | 90 min | Reduces support load |
| 24 | Create Stripe Annual product £790/yr (saves customers £158) | 5 min via Stripe MCP | Higher LTV, lower churn |
| 25 | Add upgrade CTA banner to MCP rate-limit error message (currently text-only) | 10 min | Better visual conversion |
| 26 | Build receipts/invoice branding via Stripe Branding API | 5 min | Pro look in customer inbox |
| 27 | Add `request_demo` tool to flagship MCPs (collects email → Hermes drips lead nurture) | 20 min | Capture warm leads in-tool |

**Subtotal: 7 tasks · ~3.5h · Pushes Layer 3 from 78 → 95 (capped at 95 until Nick finishes profile)**

### A4. RETENTION SYSTEMS (Layer 4)

| # | Task | Effort | Output |
|---|------|--------|--------|
| 28 | Wire welcome email auto-send (template ready in RETENTION_COPY_TEMPLATES.md) | 30 min | After Stripe webhook fires |
| 29 | Build customer success ping cron — 3-day / 14-day / 30-day "still useful?" emails | 45 min | Resend cron job |
| 30 | Build referral tracking endpoint: `/api/referral/<code>` records referrer + sends them 30% commission | 45 min | Auto-tracks via UTM parameter |
| 31 | Build feedback survey endpoint: `/api/feedback` collects 1-10 NPS after every signed cert | 20 min | NPS dashboard |
| 32 | Build cancellation reason → save-the-customer auto-trigger (when "too expensive" → email 50% off coupon) | 30 min | Stripe webhook listener |
| 33 | Build win-back cron: 30-day check on cancelled customers | 20 min | Resend cron |

**Subtotal: 6 tasks · ~3.5h · Pushes Layer 4 from 68 → 88 (90+ requires real customers to validate)**

### A5. INFRASTRUCTURE HARDENING (Layer 5)

| # | Task | Effort | Output |
|---|------|--------|--------|
| 34 | Standardize CI/CD: copy GitHub Actions template (lint + ast.parse + pytest) to all 38 governance pkgs | 30 min | Catch breaks before publish |
| 35 | Wire Slack alert webhook on meok-guardian.sh critical failure | 20 min | Get pinged when SOV3/MEOK_UI/MCP goes down |
| 36 | Deploy Cloudflare Worker hosted MCP endpoint at mcp.councilof.ai | 90 min | Remote streamable HTTP MCP (no pip install needed) |
| 37 | Configure backup destination: Backblaze B2 bucket + restore script | 45 min | Off-host backups for ~/.hermes + sov3 DB |
| 38 | Add OSSF Scorecard GitHub Action to all 38 governance pkgs | 20 min | Security health badge, supply chain signal |
| 39 | Add Sigstore/cosign signed releases workflow | 40 min | Verified releases (SLSA Level 2) |
| 40 | Add `mcp_resources` and `mcp_prompts` (beyond tools) to top 5 packages | 45 min | Full MCP protocol coverage |
| 41 | Build .well-known/mcp/server-card.json for all 38 packages (auto-discovery) | 20 min | Faster index by Glama/Smithery |
| 42 | Set up GitHub repos for missing per-package repos (some are local-only) | 30 min | Make every package's source publicly auditable |

**Subtotal: 9 tasks · ~5.5h · Pushes Layer 5 from 88 → 98**

### A6. ADJACENT STRATEGIC WORK (already on memory)

| # | Task | Effort | Output |
|---|------|--------|--------|
| 43 | Build optomobile.ai MCP suite: GOS-claim-validator + MHRA-SaMD + dispense-check | 90 min | 3 optometry-vertical MCPs |
| 44 | Build templeman-opticians.com MCP suite: care-home-cqc + domiciliary-care + dispense-record | 90 min | 3 optical/care MCPs |
| 45 | Build industry domain hubs: medtech.meok.ai + fintech.meok.ai + cybersec.meok.ai + kidsai.meok.ai | 4×30 min | 4 vertical SEO landing pages |
| 46 | Build the CobolBridge mainframe-modernization deeper logic (currently scaffold v1.0) | 90 min | Real COBOL parser + business-rule extractor |
| 47 | Submit all governance MCPs to OpenSSF Scorecard | 30 min | Public security health rating |

**Subtotal: 5 tasks · ~7h · Layer 1+2 boost, opens new revenue verticals**

---

## PART A — TOTAL AUTONOMOUS PLAN

| Bucket | Tasks | Effort | Score impact |
|--------|-------|--------|--------------|
| A1 — PyPI + distribution | 12 | ~3h | Layer 1: 70 → 95 |
| A2 — Content/docs | 8 | ~3.5h | Layer 2: 97 → 100 |
| A3 — Conversion infra | 7 | ~3.5h | Layer 3: 78 → 95 (cap) |
| A4 — Retention systems | 6 | ~3.5h | Layer 4: 68 → 88 |
| A5 — Infra hardening | 9 | ~5.5h | Layer 5: 88 → 98 |
| A6 — Adjacent strategic | 5 | ~7h | Open new verticals |
| **TOTAL** | **47** | **~26h compute** | **78 → 95** |

If I work through everything in Part A, the score reaches **95/100 without Nick lifting a finger**. The cap to 100 is Part B.

---

## PART B — NICK'S HANDS REQUIRED (12 tasks, ~6h total)

### B1. CRITICAL REVENUE UNBLOCKERS (do FIRST)

| # | Task | Time | Outcome |
|---|------|------|---------|
| 1 | **Complete Stripe profile** — follow `revenue/STRIPE_COMPLETE_PROFILE_NICK.md` (12 steps) | 30 min | Bank verified, payouts unlocked |
| 2 | **Test purchase** — buy your own £1 test product, confirm webhook + welcome email + API key arrival | 15 min | Proves funnel end-to-end |
| 3 | **MCPize founding member registration** — 80% rev share, deadline June 10 | 30 min | Featured marketplace placement |

### B2. DOMAIN + DNS FIXES

| # | Task | Time | Outcome |
|---|------|------|---------|
| 4 | **Namecheap DNS for haulage.app** — A-record `@ → 76.76.21.21` (or change to ns1.vercel-dns.com / ns2.vercel-dns.com) | 5 min | haulage.app goes from 000 → 200 |
| 5 | **Fix optomobile.ai DNS** — check Vercel deployment + DNS, currently 000 | 10 min | Site live |
| 6 | **Fix safetyof.ai DNS** — currently 000 | 10 min | Site live |
| 7 | **Fix templeman-opticians.com 403** — Cloudflare WAF likely blocking | 10 min | Site accessible to public |

### B3. AWARENESS / DISTRIBUTION

| # | Task | Time | Outcome |
|---|------|------|---------|
| 8 | **LinkedIn account recovery** — email at `revenue/LINKEDIN_ACCOUNT_RECOVERY_EMAIL_2026-04-28.md` | 10 min | Unblocks 80 drafted DMs |
| 9 | **Buttondown newsletter signup** — issue #1 ready to send | 5 min | Email list captured |
| 10 | **Bing Webmaster import** — bing.com/webmasters, "import from Google", submit sitemap | 5 min | Bing indexing starts |
| 11 | **Send 50 care home cold emails** — Apollo + Smartlead, list at `revenue/CARE_HOME_COLD_LIST_2026-04-29.md` | 2h | First inbound revenue calls |
| 12 | **Send 5 trade press pitches** — drafts at `revenue/PRESS_PITCHES_2026-04-29.md` | 30 min | Backlinks + brand authority |

### B4. OPTIONAL UPGRADES (skip if time-constrained)

- `gh auth refresh -s public_repo,repo` then I can submit PRs to 3 awesome-mcp-servers lists
- Connect Resend / SendGrid account (free tier) so I can wire transactional emails (Task A21)

---

## PART C — SEQUENCED EXECUTION ORDER

The order matters because dependencies cascade. Here's the optimal sequence:

### Phase 0 — Right now (Nick: 30 min)
1. **Nick: Stripe profile completion** (Task B1)

### Phase 1 — Next 24h (Claude autonomous, parallel)
2. Wait for PyPI rate-limit reset, publish 19 packages (Task A1)
3. Submit all 38 packages to MCP Registry + Smithery + Glama (Tasks A2-A5)
4. Standardize CI/CD across repos (Task A34)
5. Build manifest.json + glama.json batch (Tasks A41, A4)
6. Build interactive scorecard widget (Task A13)
7. Live counters on meok.ai homepage (Task A14)

### Phase 2 — Days 2-3 (Claude autonomous)
8. Wire transactional email infrastructure (Tasks A21-A22, A28) — assumes Nick adds Resend API key
9. Build customer dashboard (Task A23)
10. Deploy Cloudflare Worker hosted MCP endpoint (Task A36)
11. Build optomobile.ai + templeman-opticians.com MCP suites (Tasks A43-A44)
12. Build 4 industry domain hubs (Task A45)

### Phase 3 — Day 3+ (Nick + Claude)
13. **Nick: B2-B3 tasks** (DNS fixes + LinkedIn + Buttondown + cold emails)
14. Claude: submit Show HN, Product Hunt, awesome-list PRs
15. Claude: blog post drumbeat starts (Hermes already drafting daily)
16. Claude: build retention cron systems (Tasks A29-A33)

### Phase 4 — Days 7-30 (compounding)
17. First customers land → case studies write themselves
18. Hermes daily content publishes
19. Backlinks accumulate
20. Score reaches 90+

---

## PART D — WHAT YOU SHOULD DO RIGHT NOW

**Option 1: Maximum impact (recommended)**
- Open `revenue/STRIPE_COMPLETE_PROFILE_NICK.md`
- Spend 30 min in Stripe Dashboard following the 12 steps
- Reply with "Stripe done"
- I run Phase 1 + Phase 2 (28 tasks, all autonomous) over the next 24-48h

**Option 2: Maximum coverage**
- Approve me to execute Part A in full (47 tasks, ~26h compute time)
- I report back when score hits 95/100
- You then do Part B at your pace

**Option 3: Pick specific tasks**
- Tell me which subset to do first
- e.g. "just do A1 + A3 + A5" = PyPI publish + conversion infra + infra hardening

Let me know which option you want and I'll proceed.

---

## SCORE PROJECTION

| Time | What's done | Score |
|------|-------------|-------|
| Now | 78 (baseline post fixes) | 78 |
| +30 min (Nick Stripe) | Conversion 78 → 95 | 82 |
| +24h (Claude Phase 1) | Awareness 70 → 95, Interest 97 → 100, Infra 88 → 95 | 89 |
| +48h (Claude Phase 2) | Retention 68 → 88, Conversion 95 → 98 | 93 |
| +7 days (Nick traffic + Claude content) | First 3 customers, awareness peaks | 95 |
| +30 days (compounding) | Testimonials, real reviews, MRR proves retention | 97-99 |
| +90 days (SaaS metrics stable) | Mature retention curves, churn data | 100 |

**Reaching exactly 100/100 requires 60-90 days of customer data.** The infrastructure can be 100 within 48h. The customer-data layer takes weeks of real usage to mature.

---

*Document end · MEOK AI Labs · 2026-05-13*
