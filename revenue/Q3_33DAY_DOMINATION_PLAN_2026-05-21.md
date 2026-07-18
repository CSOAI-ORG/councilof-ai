# Q3 33-Day Domination Plan — 2026-05-21 → 2026-06-23

**Mandate:** all 47 MCPs everywhere · all flows tested · all outreach automated · all positioning 100/100 · no blockers · no excuses · no loops · pure polished perfection at the highest standards.

## The shape

| Phase | Days | Goal | Outcome metric |
|---|---|---|---|
| **P1 Foundation** | 1-5 | Backend gateway + Stripe Meter + E2E flow test | First end-to-end paid call works |
| **P2 Distribution** | 6-12 | All 47 in every directory · screenshots · branding | Each MCP discoverable from 8+ surfaces |
| **P3 Outreach Engine** | 13-19 | Automated daily outbound via Namecheap + Resend | 30 outbound/day on autopilot |
| **P4 Content + Viral** | 20-26 | Press, blog, Show HN, Discord, Reddit | 5,000+ first-week views |
| **P5 Defence + Scale** | 27-33 | Enterprise outbound + quarter close | First Defence-tier customer or signed POC |

## Phase 1 — Foundation (Days 1-5)

### Day 1 (today, 2026-05-21) — already shipped
- ✓ 47 MCPs published to Anthropic Registry
- ✓ /a2a · /governance · /cobol · /protocols substrate landing pages live
- ✓ 8 Stripe products + payment links (A2A, Governance, Cybersec, COBOL Pro, COBOL Annual, COBOL Defence, Universal PAYG, Universe)
- ✓ councilof.ai rebuilt as BFT Council Substrate
- ✓ CSGA-GLOBAL/cobol-bridge transferred to CSOAI-ORG/cobol-bridge-substrate
- ✓ Protocol Coverage + Universal PAYG block on all 47 README files (pushed to GitHub)

### Day 2 (Fri 22 May) — api.meok.ai gateway scaffold
Vercel project + DNS pointing api.meok.ai → meok-attestation-api (or new dedicated). Single Edge Function at `/v1/<slug>/<tool>` routing to underlying Python MCP. Bearer token check, quota counter, signed-attestation header. Stripe meter event emitter.

```bash
# Need to ship today after this plan commits:
mkdir -p ~/clawd/meok-api-gateway && cd ~/clawd/meok-api-gateway
npm init -y && npm install @vercel/sdk @modelcontextprotocol/sdk express
# Then write minimal Edge Function — handler.ts
# vercel link to new project, vercel domains add api.meok.ai
```

### Day 3 — Stripe Meter resource setup (browser-driven)
Stripe Dashboard → Billing → Meters → Create Meter "meok-mcp-call" → £0.0002 per call. Attach to Universal PAYG + A2A PAYG + COBOL prices for the post-included-tier overage. Wire `usage_record` API call into the gateway from Day 2.

### Day 4 — E2E test (free → starter → pro → substrate)
Run a real £29 Stripe purchase in test mode, verify `/thanks` redirect, attestation key delivery, MCP call lands in metering, customer downgrades / upgrades work. Document any breakage. Re-test after fix.

### Day 5 — Smithery + Glama + mcp.so directory blasts
- Smithery: submit 47 servers in batch via Smithery's submission API (or create-on-publish hook)
- Glama: GitHub repos already have glama.json — verify auto-indexing kicked in
- mcp.so: bump issue #2170 + submit 47 entries manually
- AwesomeML / awesome-llm / awesome-mcp-servers: 3 PRs ready (Nick clicks compare URLs)

## Phase 2 — Distribution (Days 6-12)

### Day 6-7 — Per-MCP screenshots + OG images
For each of 47 MCPs: 1 hero screenshot (terminal showing successful uvx + attestation) + 1 OG image (1200×630 brand-coloured). Auto-generate via Playwright + /api/og. Embed in each README.

### Day 8 — npm @meok-ai sweep
All 47 packages currently under csga_global on npm. Re-publish under @meok-ai scope (npm allows multi-publish). README badges updated.

### Day 9 — Anthropic Registry refresh (republish + remotes field)
Bump version → publish_all.sh on each MCP → all 47 land in Registry at current version with `remotes` field pointing to api.meok.ai.

### Day 10 — GitHub repo polish
- All 47 GitHub repos get banner image (SVG/PNG), social preview, complete topics list
- CONTRIBUTING + CODE_OF_CONDUCT + SECURITY across all (template copy)
- ISSUE_TEMPLATE + dependabot.yml standardised

### Day 11 — meok.ai SEO sweep
- Sitemap regenerated with all 47 MCP landing pages + /protocols + /a2a + /governance + /cobol + /os + /catalogue + /pricing + /about + /press
- robots.txt + llms.txt extended
- Bing IndexNow ping on every new page
- GSC sitemap re-submit

### Day 12 — Verify discoverability
- Search "EU AI Act compliance MCP" → MEOK in top 5
- Search "BFT council AI" → MEOK in top 3
- Search "COBOL Bridge MCP" → CSOAI-ORG repo + meok.ai/cobol in top 3
- If any miss: add internal backlinks, refresh sitemap, IndexNow ping again

## Phase 3 — Outreach Engine (Days 13-19)

### Day 13 — Namecheap email setup
Create dedicated outreach mailboxes:
- `nicholas@meok.ai` (already exists)
- `outreach@meok.ai` (NEW — bulk)
- `compliance@meok.ai` (NEW — replies route here)
- `sales@meok.ai` (NEW — high-intent)
SPF + DKIM + DMARC records on Namecheap DNS.

### Day 14 — Resend integration
Resend HTTP API with the `RESEND_API_KEY` already in Vercel env. Send rate: 10-15 outbound/day per address (= 30-45/day total) to stay under domain-reputation flags. Reply-handling routes to Inbox via mailgun/imap fetch.

### Day 15 — Prospect list build (4 streams)
1. **NIS2 DE Mittelstand** — 100 contacts via Apollo
2. **UK care homes** — 100 contacts via CQC public register
3. **EU bank CISOs** — 50 contacts via LinkedIn (post-recovery)
4. **AI startup CISOs/CTOs** — 100 contacts (Y Combinator + Antler + EU AI Office mailing list)
Total: 350 verified prospects.

### Day 16-19 — Outreach automation
Cron daily 09:00 BST: pull 30 prospects, generate personalised emails via existing templates in `revenue/SEND_THESE_MONDAY_2026-05-26.md` + `CARE_HOME_COLD_LIST_*` + `NIS2_DE_COLDMAIL_BATCH_*`. Resend send. Track open/click/reply via Resend webhooks. Drop into Notion-style pipeline.

## Phase 4 — Content + Viral (Days 20-26)

### Day 20 — Show HN execution (Tue 3 Jun 14:00 UTC was the planned date, may slip)
Submit the post draft at `revenue/SHOW_HN_POST_2026-06-03.md`. URL: meok.ai/os OR councilof.ai. Reply to comments within 60 min. Cross-post r/LocalLLaMA next day.

### Day 21 — First press release
"MEOK AI Labs publishes 47 compliance MCPs to Anthropic Registry" via EIN Newswire (£395). Includes Nick founder bio + link to meok.ai/press.

### Day 22-23 — Long-form content
2 Substack/Medium posts:
1. "Why we built a Byzantine Fault Tolerant council for AI compliance" (4,000 words)
2. "47 MCPs, 1 audit chain: how MEOK bridges 8 agent protocols" (3,000 words)

### Day 24 — LinkedIn restored (Nick action) + 7-post sequence drafted
Post cadence: 1/day × 7 days, each post pointing to different substrate / blog / proof point.

### Day 25 — Anthropic Discord + Slack communities
- Anthropic #showcase (drafted in `revenue/SOCIAL_ANNOUNCEMENTS_2026-05-21.md`)
- MCP community Slack (if exists)
- 3 EU compliance Slack channels (Privacy Pros, Cyber Security Pros, GRC Network)

### Day 26 — Trade press pitches
5 pitches drafted in `revenue/PRESS_PITCHES_2026-04-29.md`:
- The Stack (UK tech)
- Computing UK
- TechCrunch UK
- Heise (DE)
- Le Monde Informatique (FR)

## Phase 5 — Defence + Scale (Days 27-33)

### Day 27 — 5 Defence-tier outbound (£4,990/mo each)
- UK MoD ITAR/JSP-512 contact (existing target)
- AWS Public Sector EMEA
- Singapore GovTech
- Norwegian DSO (defence supplier)
- One tier-1 EU bank CISO

### Day 28-29 — Bid response / POC scoping
For any responses from Day 27, scope a 30-day POC at £4,990/mo with breakout to £14,990/mo or £25K/mo for multi-BU.

### Day 30 — MoE positioning landing
`/moe` — "Mixture of Experts for AI Compliance". Position the 47 MCPs as compliance domain experts that the BFT Council routes between. AEO-friendly framing because "Mixture of Experts" is a known LLM architecture term — connecting MEOK to that mental model.

### Day 31 — Q3 numbers retrospective
- New customers
- New MRR
- Pipeline value
- Cost (Vercel + Stripe fees + Resend + tooling)
- Net cash position
- Decision: continue MEOK as primary, or pivot per MASTER_PLAN Aug-20 cliff?

### Day 32-33 — Q4 plan
Based on Day 31 numbers: prioritise Q4 build (more MCPs · enterprise sales · platform).

## Cross-cutting workstreams (continuous)

### Daily checkpoints (every day for 33 days)
- 1 git commit minimum (proof-of-output for portfolio attribution)
- 1 outreach batch sent
- 1 reply within 24h to every inbound

### Weekly checkpoints (every Sunday)
- Stripe MRR check
- Search rank check for top 5 queries
- Outbound conversion rate review
- Pipeline qualification

## Targets

| Metric | Day-33 target | Stretch |
|---|---|---|
| MRR | £3,000 | £8,000 |
| Cash one-time | £500 | £5,000 |
| New paying customers | 5 | 15 |
| Show HN front page | yes | top 5 |
| Substack/Medium followers | 100 | 500 |
| GitHub stars (CSOAI-ORG flagship) | 25 | 100 |
| Twitter @meok_ai followers | 200 | 1,000 |
| Active outreach mailboxes | 4 | 6 |
| Outbound emails sent | 800 | 1,500 |
| Inbound replies | 25 | 100 |
| Defence-tier POCs in pipeline | 1 | 3 |

## Blockers Claude cannot remove (Nick actions only)

1. **api.meok.ai gateway backend build** — Claude can scaffold; the production runtime container is Nick's call (2-3 days dev work)
2. **Stripe Dashboard Meter setup** — needs Nick in Stripe UI (15 min)
3. **LinkedIn account recovery** — form drafted, Nick submits
4. **Namecheap email + DKIM/SPF/DMARC** — Nick does DNS records (30 min)
5. **Apollo or Hunter.io seat (£40-£75/mo)** — for prospect-list building
6. **Press release distribution payment** — £395 per release × 5
7. **Substack account setup** — 5 min

If any of 1-7 doesn't happen, downgrade the relevant phase but the plan still ships. The core (47 MCPs polished + 8 substrates + 4 outreach channels) lands regardless.

## What this means

The first 5 days are pure technical execution (gateway · meter · directories). Days 6-12 are visibility (screenshots · SEO · GitHub polish). Days 13-19 are outbound machine setup. Days 20-26 are content + virality. Days 27-33 are enterprise + close.

By Day 33 we'll have:
- 47 MCPs that any agent dev can find in 10 different places
- 4 outreach channels running daily without Nick touching them
- 5 substrate landing pages + 1 BFT Council home (councilof.ai)
- 8 live Stripe products + 1 metered tier accepting per-call
- A press archive showing months of consistent output
- A portfolio attribution surface (meok.ai/about + /press + GitHub README) that surfaces Nick's real work everywhere search engines + LLMs look

That's "100/100 polished perfection". Real revenue follows real attention.

If MRR <£1K by Day 33 (Aug 20 hard-decision cliff per MASTER_PLAN), the plan still pivots cleanly: MEOK becomes a respected OSS side project, Templeman Opticians + farm become primary, but the 33-day output remains as portfolio evidence regardless of next-quarter outcome.

**No blockers. No excuses. No loops. Q3 executed.**
