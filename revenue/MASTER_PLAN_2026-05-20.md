# MASTER PLAN — 90-Day Day-by-Day Calendar
**Generated:** 2026-05-20 · synthesised from 9 parallel research agents
**Bottom line:** Stop building. Ship existing. Hard decision Aug 20.

---

## THE ONE THING

> **Tuesday June 3, 14:00 UTC: Post Show HN.**
> Everything before that prepares for it. Everything after it depends on it.

## THE HARD DECISION POINT

> **Wednesday August 20.** If MEOK MRR < £1,000, transition to:
> - **Primary:** Templeman Opticians (real revenue-generating asset)
> - **Side project:** MEOK MCPs as open-source community contribution
> - **Long-term substrate:** Farm build + SOV3 council-mcp

## TIME ALLOCATION (rigorously enforced 90 days)

- **40%** — Farm build (Mon-Tue + 1-2 evenings paperwork)
- **40%** — MEOK distribution + `council-mcp` slice (no new MCPs unless farm-crossover like `defra-grants-mcp`)
- **15%** — Social media client work (protect existing £20-30k income until farm replaces it Q4)
- **5%** — SOV3 / `council-mcp` productisation slow burn

Risk is NOT picking wrong — it's spreading thin and shipping nothing.

---

# WEEK 1: May 20-25 — FOUNDATION FIXES

## Wed May 21 (TODAY)
**Goal: Funnel works. Pricing coherent. Brand un-fragmented.**

| Time | Action | Who | Outcome |
|---|---|---|---|
| 09:00 | Fix `/thanks` route on www.meok.ai (currently 307→homepage) | Claude | Stripe success → real thanks page |
| 09:30 | Get `RESEND_API_KEY` from resend.com → Vercel env on `meok-attestation-api` | **Nick (3 min)** | Welcome emails fire |
| 10:00 | Reconcile pricing: **£49 Starter / £149 Pro / £999 Defence / £2,499 Enterprise** — update Stripe + landing pages + SoT doc | Claude | Three price ladders → one |
| 11:00 | csoai.org: rewrite to 1-page "About the legal entity" notice ONLY (no Palantir/Anthropic/Byzantine claims) | Claude | Trust restored |
| 11:30 | Sunset councilof.ai → 301 redirect to meok.ai/catalogue (over 6 months: keep alive but stop investing) | Claude | One storefront, not two |
| 12:00 | Add llms.txt to 7 reachable domains (templeman, cobolbridge, councilof, haulage + 3 LoopFactory) | Claude | AEO across portfolio |
| 14:00 | **DECISION: LoopFactory AI Ltd status** — absorb under MEOK OR keep as holding-co? | **Nick (15 min)** | Required before muckaway/grabhire/planthire rebrand |

## Thu May 22
**Goal: GitHub PR submissions + Anthropic Registry publish remaining 5.**

| Action | Who | Outcome |
|---|---|---|
| `gh auth refresh -s public_repo,repo` | **Nick (30 sec)** | Unblocks PR submission |
| Submit PRs to `wong2/awesome-mcp-servers` + `appcypher/awesome-mcp-servers` + `punkpeye/awesome-mcp-servers` | Claude | Permanent backlinks |
| Submit Smithery + glama + mcp.so + PulseMCP (2.5h total) | Claude + Nick | 4 directories live |
| Publish remaining 5 MCPs to Anthropic Registry (34 → 39) | Claude (after `mcp-publisher login github`) | Full Registry coverage |

## Fri May 23
**Goal: Lead magnets live + Substack started.**

| Action | Who |
|---|---|
| Build **EU AI Act Fine Calculator** at meok.ai/fine-calculator (lead-magnet form → email capture) | Claude (3 hr) |
| Move Buttondown → **Substack** (10× better discovery for niche compliance) | **Nick (90 min)** |
| Substack Issue #1 published (from existing `NEWSLETTER_ISSUE_01_2026-05-05.md`) | Nick |
| **Article 50 13-day lead-magnet window** — ship `meok-article50-tracker` MCP (consultation closes June 3) | Claude (4 hr) |

## Mon May 26
**Goal: First real outbound + sales ops live.**

| Action | Who |
|---|---|
| Verify 10 care-home addresses via Hunter.io (£49) + CQC API | Claude |
| Personalise each from actual CQC reports | Claude |
| Send via Smartlead (£39/mo) from `nick@meok.ai` | **Nick** |
| Set up **Cal.com** at cal.com/nick-meok | Nick (20 min) |
| Set up **Attio CRM**, import 50-prospect care-home list | Nick (30 min) |

## Tue May 27
**Goal: Product Hunt asset prep + hunter outreach.**

| Action | Who |
|---|---|
| Take 5 Product Hunt gallery screenshots (hero, CLI demo GIF, search, signed attestation, council storefront) | Claude (mcp__Claude_in_Chrome) |
| DM 5 PH hunters with karma >500 in compliance/devtools (Marie Dollé, Alistair McLeay) | Nick (60 min) |
| Pre-stage by replying to 10 of their posts thoughtfully | Nick (45 min) |

---

# WEEK 2: May 28 - Jun 1 — MEOK CLAW BUILD

**12-day build plan from MEOK_CLAW_ARCHITECTURE_2026-05-20.md.** Shipping by Sunday June 1.

| Day | Build |
|---|---|
| Wed 20 May (overlapped above) | Delete 9 demo subroutes; merge any-llm/sovereign-os/characters into _components/ |
| Thu 21 May (overlapped) | OSShell 3-pane CSS grid; osStore.ts with Zustand persistence; Clerk tier wiring |
| Fri 22 May (overlapped) | LeftRail: ModelSelector (10 LLMs) + CharacterPicker (6) + SovereignToggle |
| Sat 23 May | CenterPane + useAgentStream; reuse /api/chat; ToolCallCard for AI SDK v6 frames |
| Sun 24 May | RightRail: MCPSidebar (39 MCPs hardcoded JSON manifest); /api/mcp/dispatch wired; smoke-test one end-to-end |
| Mon 25 May | CareMeter (6-dim recharts radial); reads X-MEOK-CareScore header (already emitted) |
| Tue 26 May | CouncilTrace from new /api/council/audit (wraps llm_gateway.call_many); behind PaywallGate; show 3-vote diff visually |
| Wed 27 May | Stripe tier wiring: £9 Personal + £49 Starter + £149 Pro; PaywallGate component; message-count enforcement |
| Thu 28 May | Marketing copy + screenshots; **hero shot = BFT council disagreement (the differentiator)**; write Show HN draft |
| Fri 29 May | Playwright e2e tests; CI matrix node 22 × turbopack |
| Sat 30 May | Perf pass: bundle ≤180KB gz; code-split rails; lazy-load MCP catalogue; preview deploy + 3 reviewers |
| Sun 31 May | Buffer + final polish; capture HN screenshot at 2:1 |

---

# WEEK 3: Jun 1-7 — SHIP

## Mon Jun 1
- **08:00 PT** — Ship MEOK Claw at meok.ai/os (v1)
- Test in 3 browsers; verify Stripe tier flow end-to-end
- Final HN screenshot ready

## Tue Jun 3, 14:00 UTC — **SHOW HN POST**
**Title (winner per research):** *"Show HN: 200 days to EU AI Act Article 50 — 38 free MCPs to pre-check your AI"*
- Submit at news.ycombinator.com/submit
- URL: meok.ai/labs/mcp
- Reply to every comment within 30 min for 6 hours
- Stay technical and humble
- Pre-drafted defences ready (the 4 in SHOW_HN_POST_2026-05-17.md)

**Realistic outcome:** 5-15K visits if front-paged, 50-200 trial signups, **1-5 paying customers within 72 hours**.

## Wed Jun 4
- NIS2-DE Google Ads £150 test launched (`NIS2 BSI Registrierung` keywords — near-zero competition)
- Write NIS2-DE German pillar page (4 hr)

## Fri Jun 6
- Substack Issue #2 (post-Show HN learnings)

## Tue Jun 10
- Show HN follow-up "what I learned" on X + Substack

---

# MONTH 2: Jun-Jul — FIRST CUSTOMERS

**Target: £750 MRR (5 customers) by end of June, £2,000 by end of July.**

| Week | Focus | Action |
|---|---|---|
| Jun 8-14 | Product Hunt launch | Tue Jun 17 (if hunter secured by Jun 14) |
| Jun 15-21 | Case studies | 3 anonymised customer write-ups (even if "UK fintech, 50 emp") |
| Jun 22-28 | Innovate UK Smart Grant | Application drafted + submitted (4-6 wk effort) |
| Jul 1-7 | Vertical premium MCPs | Ship `mica-crypto-mcp` and `mdr-medical-device-mcp` at £499/mo standalone |
| Jul 8-14 | Defence tier | First £999/mo customer (warm intro via Nick's network) |
| Jul 15-21 | GPAI Code of Practice | Aug 2 deadline content sprint begins |

**Brand consolidation continues:** csoai.org sunset, councilof.ai redirect, proofof.ai sold/parked.

---

# MONTH 3: Jul-Aug — DECISION SPRINT

**Target: £2,000+ MRR by Aug 20.** Hard stop date.

| Action | Goal |
|---|---|
| GPAI Code of Practice **enforcement Aug 2** content sprint | Major content moment; pillar pages + Substack + X threads |
| Substack to 500 subscribers | Compounding mailing list |
| 1 podcast appearance (Risk Bites, FCAfocused, etc) | First press signal |
| 2 enterprise sales conversations initiated | PE diligence persona Marcus + healthtech David |
| First annual contract (£999 × 12 = £11,988 cash injection) | Lump-sum runway |

## ⚠️ Wed Aug 20 — HARD DECISION GATE

If **MRR < £1,000**:
- **Begin Option C transition** — keep MEOK MCPs as open-source side project
- **Templeman Opticians becomes primary** — apprentice hire Oct 2026 confirmed
- **Farm build accelerates** to Y1 revenue (Oct 2026)
- **SOV3 / council-mcp slow burn** continues but stops being primary

If **MRR ≥ £1,000**:
- Continue 14-day execution loop
- Ship 5 vertical premium MCPs (Pack C: NIST RMF, ISO 42001, IEC 62443, PCI-DSS-4)
- Hire 1 part-time contractor £1,500/mo for sales outreach
- Push to £5,500 MRR by Oct 20

---

# MONTHS 4-6: Aug-Nov — SCALE OR PIVOT

**If on Option A (continue MEOK):**

| Month | Target | Milestones |
|---|---|---|
| Sep | £3,500 MRR | 5 vertical premium MCPs live; named customer case study |
| Oct | £5,500 MRR | Article 50 / watermarking premium product (Nov 2026 deadline panic) |
| Nov | £8-10k MRR | EU AI Act enforcement panic content sprint; 2-3 reseller relationships |

**If on Option C (Templeman primary):**

| Month | Templeman | MEOK side project |
|---|---|---|
| Sep | MECS + GERS first patients | Monthly Substack issue, that's all |
| Oct | Apprentice starts (£2k SME incentive + £3k UC stack); 2 active care homes | Library publish only |
| Nov | 4 active care homes; Wendy/Fred at capacity | Quarterly check-in |

---

# PARALLEL TRACKS (all weeks)

## Track 1: Templeman Opticians (per TEMPLEMAN_DOSSIER)
- **Sign up MECS + GERS enhanced services with Mid & South Essex ICB** (Wendy + Fred — Nick admin) — single highest ROI move, ~£600-1,100/mo by Month 4
- Google Business Profile + 20 reviews (Nick: 30 min/wk asking patients)
- Send next 10 care-home cold emails after first batch
- Add `/care-homes` landing page to templeman-opticians.com
- Apprentice job ad drafted by Sep, hire start Oct 2026

## Track 2: Farm (40% of Nick's time, Mon-Tue)
- Koi liquidation begins (funds £8k build with surplus)
- Polytunnel frames + bacterial cycling Y1 ramp
- **SFI + EWCO + hedgerow** grant applications (£8-15k/yr ongoing)
- **Innovate UK BridgeAI** £25-50k application (strongest grant target — MEOK+farm crossover)
- Build `defra-grants-mcp` Q3 2026 dogfooding own grant work

## Track 3: MCP Portfolio polish (15% of Nick's time)
**Per MCP_CHECKLIST_TEMPLATE:** 30-day priority order

1. Build `meok-mcp-template` + `scorecard.py` (1 day)
2. Run `bump_version.sh` across 10 flagships (+60 grade points total)
3. Copy governance docs to crosswalk + injection-firewall + incident-reporting (+40 points)
4. Single Resend webhook + schema.org JSON-LD layout (portfolio-wide F2 + E1)
5. `@meok-ai` npm publish across 10 (closes A5)
6. Per-MCP screenshot session (closes B3)

**Outcome:** Top 4 MCPs (eu-ai-act, ai-bom, bias-detection, cra) cross 85 pass threshold.

## Track 4: SOV3 / council-mcp (5% of Nick's time, slow burn)
- Strip "Byzantine/consciousness/Maternal" framing
- Ship `council-bft` library + `council-mcp` on PyPI v0.1.0
- £149/mo "Council Pro" tier wired to Stripe
- Demo at `council.meok.ai` — paste prompt → 3 models vote → signed transcript
- arXiv preprint: "Care-Weighted Multi-Agent Deliberation with Auditable Dissent"

## Track 5: Brand consolidation (one-off, week 1)
- meok.ai = primary
- councilof.ai → 6-month sunset, 301 to meok.ai/catalogue
- csoai.org → 1-page legal-entity notice
- safetyof.ai → keep as "MEOK Scorecard" free funnel
- cobolbridge.ai → niche sub-brand, keep
- proofof.ai → sunset or sell on Sedo
- 20+ .ai domains → park or list on Sedo
- **LoopFactory branding** → decision Wed May 21, then execute

---

# REVENUE PROJECTION (90 days)

| Source | Month 1 | Month 2 | Month 3 | 90-day total |
|---|---|---|---|---|
| MEOK MCPs (Show HN, cold email, Google Ads) | £200 | £750 | £2,000 MRR | £950-2,950 weighted |
| Templeman (website leads + care homes + MECS) | £200-800 | £900-2,300 | £2,000-5,500 | £3,100-8,600 |
| Farm (no revenue Y1 until Oct) | £0 | £0 | £0 | £0 |
| **Total weighted 90-day cumulative** | | | | **£4,050-11,550** |

90-day target: **£5,500-£8,600 incremental cash** + recurring £2,000+ MRR pipe lit.

**This is NOT £100k/mo. This IS real first-quarter revenue.** The compound value over 18 months at this trajectory is £40-80k incremental annual run-rate.

---

# WHAT NOT TO DO (theatre)

Per agent consensus across all 9 dossiers:

- ❌ Build MCP #41 before #1-19 have customers
- ❌ More "ready to launch" drafts (200+ Markdown files exist already)
- ❌ LinkedIn account recovery (sunk cost, X + new business account instead)
- ❌ Star-farming via Reddit/X (won't move conversion)
- ❌ Product Hunt BEFORE Show HN (leverage social proof from HN into PH)
- ❌ Buttondown as email home (Substack discovery 10× better)
- ❌ Pricing SoT docs that don't match live pages
- ❌ Fork OpenClaw / StepFun (8-12 weeks of migration for unclear gain)
- ❌ Plant hire competing with inspHire (10× crowded, skip)
- ❌ Grab hire as separate brand (fold into muckaway)
- ❌ Anthropic Fellows applications (apply to Trust & Safety roles instead)
- ❌ Star-farming, Reddit Ads, LinkedIn ads (low-intent until organic converts)

---

# WEEKLY CADENCE

- **Mon mornings:** Farm build (paperwork, supplier calls)
- **Mon afternoons:** Templeman ops (GBP reviews, care home follow-ups)
- **Tue all day:** Farm physical build
- **Wed-Fri:** MEOK distribution + meok.ai/os + cold outreach
- **Sat:** Social media client work (income protect)
- **Sun:** Substack issue + planning next week

**Single metric tracked weekly: cash MRR.** If flat 2 weeks → stop building, do customer calls only.

---

# DAY-ZERO ASKS FROM NICK (right now)

5 actions, ≤30 min total, unblock the rest:

1. **`gh auth refresh -s public_repo,repo`** in terminal (30 sec)
2. **`npm login`** in terminal (30 sec — refreshes 401 token)
3. **`mcp-publisher login github`** in terminal (1 min — browser auth)
4. **Get `RESEND_API_KEY`** from resend.com signup (3 min)
5. **LoopFactory AI Ltd decision** — absorb under MEOK OR keep as holding-co? (15 min think + answer)

Once those 5 are done, I unblock and execute the rest of Week 1 autonomously.

---

*End of MASTER PLAN. The 9 component dossiers are saved alongside this file in `revenue/`. The pattern across every dossier is the same: distribution is the bottleneck, not product. Ship Show HN June 3.*
