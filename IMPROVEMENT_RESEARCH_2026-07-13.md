# SOVEREIGN EMPIRE — IMPROVEMENT RESEARCH SWEEP
**Date:** 2026-07-13 (Mon) BST · **Analyst:** JEEVES research-analyst subagent
**Working dir:** `/Users/nicholas/clawd/` · **Mode:** read-only research
**Sources read:** `SOV3_AUDIT.md`, `SITE_INVENTORY.md` (830 lines), `CLAUDE_PATTERNS_LEARNED.md` (983 lines), `JEEVES_FRONTEND_TAKEOVER.md`, `AGENTS.md` (claim board, 61 entries), `DEFONEOS_SPRINT_STATE.json`, `tick-87-sigil.json`, + SOV-19 cross-reference (132 hits)

---

## 0. EXECUTIVE SUMMARY

The sovereign front-end is **live and structurally sound** — 381 pages, 18 routed APIs, all HTTP 200, byte-parity confirmed, avg static quality 80.1/100. The empire's problems are **not build problems, they are truth-and-polish problems.** Three systemic failures dominate every category:

1. **State-of-record lies.** `DEFONEOS_SPRINT_STATE.json` says `ticks_completed=76 / pages_live=34`; AGENTS.md claims tick 87 / 59 pages; the on-disk `tick-87-sigil.json` describes a *third* reality (SOV-SPACE-BUILD, not the proposal-pack bundle AGENTS.md claims for tick 87). **No two sources of truth agree.**
2. **Phantom deploys.** 11+ pages are "RELEASED" in AGENTS.md but absent from disk and sitemap. The ledger is detached from the filesystem.
3. **AEO blindness.** 47 of 53 SOV3/SOV33 surfaces lack `<meta name="description">` — the single highest-ROI revenue lever, because it gates AI-search citation (Google AI Overviews, Perplexity, Bing Copilot) 36 days before the Article 50 cliff.

**The good news:** every fix is reversible, scriptable, and needs zero architectural rework. This report enumerates **41 opportunities** across 7 categories. The critical path is **9 P0 items totaling ~14 hours** that lift the fleet from 80→95 and make the state trustworthy.

**Cross-reference verdicts:**
- **M4 / SOV-19:** the M4 build lane (`_m4/` 19 .py + 3 .sh) sealed at 95+ avg quality and handed off to JEEVES-FE-OWN on 2026-07-13 04:40. SOV-19 (`sov-19.html`, 18,359b, meta ✅, quality 91) is the defense + sovereign-cloud + 5-of-7 Shamir Custodian layer; the 57-charter universe (`defoneos-charter-universe.html`) claims 1,710/1,710 @ 100/100. **These are the crown assets — but their claim pages are orphaned from `/master` and under-cross-linked (0 inbound).**
- **TICK 86/87:** tick 86 (EXPANSION PHASE 7) shipped 3 bonus pages that are **phantom** (board-update/uk-sovereign-pitch/auditor-counter claimed but missing per SOV3_AUDIT §3.1 — though AGENTS.md tick-87 "regression-checked" board-update 17031 & auditor-counter 19418 as intact, another contradiction). **Tick 87 is doubly-forked:** AGENTS.md=proposal-pack bundle, disk sigil=sov-space.html. This fork must be reconciled before any tick 88.

---

## 1. FRONTEND

| # | Opportunity | Sev | Effort (h) | Impact | Concrete action |
|---|---|---|---:|---:|---|
| F1 | **47/53 SOV3/SOV33 pages missing `<meta name="description">`** | **P0** | 3 | 9 | Scripted PR: inject `description`+`keywords`+`canonical`+`og:image` from each page's `<h1>`/first `<p>`. Verify `grep -L '<meta name="description"'` returns 0. (SOV3_AUDIT §5.2.1, JEEVES charter TICK 87.2) |
| F2 | **Orphan `/master` — links to 0 of 381 pages** | **P0** | 2 | 8 | Rebuild `master.html` as 381-row hub: search input + filter chips (defoneos/SOV3/OOWM/mod) + auto-table from `sitemap.xml`. Exit: all 381 link-resolvable. (SITE_INVENTORY line 13, TICK 87.1) |
| F3 | **1,151 anchor-only `#` hrefs masquerading as nav** | P1 | 4 | 6 | Scripted replace with real router links; leave ≤50 intentional anchors. (SOV3_AUDIT §5.3 P3, TICK 88.2) |
| F4 | **No `<link rel="canonical">` on 381 pages → 308 chain wastes crawl budget** | P1 | 2 | 6 | Inject canonical trailing-slash URL on every page (scripted). (SOV3_AUDIT §5.3 P1, TICK 89.1) |
| F5 | **DASHBOARD.html signal-stack collapse (SIGIL=2 BFT=0 OWEM=1, quality 55–68)** | P1 | 1.5 | 5 | Add SIGIL chain + BFT-33 council status + OWEM grid; lift to "strong" signal. (SOV3_AUDIT §5.3 P1) |
| F6 | **SOV-19 & 57-charter crown pages under-cross-linked (0 inbound from master)** | P1 | 1 | 7 | Feature `sov-19.html`, `sov-18.html`, `defoneos-charter-universe.html` on rebuilt `/master` + SOVEREIGN-TRIAD footer badge. (TICK 91.1) |
| F7 | **Bare/low pages: SOV33_DECK (2,790b/45), SOV33_ONELINER (3,834b/45), SOV33_REALTIME (55)** | P2 | 3 | 4 | Expand to ≥10KB with sovereign signal stack, or fold into a parent hub. |
| F8 | **No SOVEREIGN-TRIAD cross-link — DEFONEOS/MEOK/SOV3 read as 4 separate sites** | P2 | 3 | 6 | Footer triad badge on all 381 pages (`data-sovereign-triad`). (TICK 91.1) |
| F9 | **223 unreviewed `defoneos-*.html` catalog pages (only 20 sampled live)** | P3 | 2 | 3 | Full byte-parity + HTTP sweep script over all 257 to close the audit gap. |

---

## 2. BACKEND

| # | Opportunity | Sev | Effort (h) | Impact | Concrete action |
|---|---|---|---:|---:|---|
| B1 | **HMAC drift: `signup.js`=SHA-512, `crown-rfq.js` + rest=SHA-256** on the crown surface investors see first | **P0** | 1 | 7 | Normalise `api/signup.js` to SHA-256 + JSDoc naming the convention. Exit: `grep -r "createHmac('sha512'" api/` = 0. (CLAUDE_PATTERNS §3.1, TICK 87.3) |
| B2 | **No `/api/*` served from static alias; `meok_localhost:3000` DOWN (RC=7)** | P1 | 2 | 6 | Document the runtime split (static=Vercel, live=`sov3 localhost:3101/mcp`) in DASHBOARD + `/api/sigil-status`; restart/health-check meok:3000. (SOV3_AUDIT §5.2.5) |
| B3 | **Ephemeral `/tmp/*.jsonl` persistence — signups lost on cold start** | P1 | 3 | 6 | Wire owner-cron sync of `/tmp/signups.jsonl` → durable store (Airtable/Sheets per §6.3); verify no data loss window. |
| B4 | **`/api/og-image` endpoint planned but not built (blocks social citation)** | P2 | 4 | 5 | Build OG renderer emitting per-slug cards; 47 key surfaces first. (TICK 91.4) |
| B5 | **Crown RFQ not verified end-to-end (form → SIGIL receipt → 24h SLA)** | P1 | 2 | 6 | `curl POST /api/crown-rfq` must return valid `full_sigil`; wire form + Director SLA. (TICK 92.3) |
| B6 | **18 endpoints — HONESTY-docstring coverage unverified** | P2 | 1 | 3 | `grep 'HONESTY:' api/*.js` must = 18; add missing. (CLAUDE_PATTERNS §7.6, TICK 88.4) |

---

## 3. OPS

| # | Opportunity | Sev | Effort (h) | Impact | Concrete action |
|---|---|---|---:|---:|---|
| O1 | **THREE-WAY state fork: state.json (tick 76/34pp) ≠ AGENTS.md (tick 87/59pp) ≠ tick-87-sigil.json (SOV-SPACE-BUILD)** | **P0** | 0.5 | 9 | Refresh `DEFONEOS_SPRINT_STATE.json` to real tick, pages_live, sigil digest, ISO timestamp. Single source of truth. (SOV3_AUDIT §5.2.3, TICK 87.4) |
| O2 | **tick-87 identity collision: AGENTS.md=proposal-pack bundle vs disk sigil=sov-space.html** | **P0** | 1 | 8 | Reconcile the two tick-87 records: pick canonical deliverable, re-number the other, re-emit one clean sigil. Blocks all future ticks. |
| O3 | **11 phantom pages "RELEASED" but absent from disk+sitemap** | **P0** | 2 | 8 | Restore the 11 OR downgrade AGENTS.md claims to ASPIRATIONAL so operators don't read a lie. (SOV3_AUDIT §3, TICK 90.1) |
| O4 | **Deploy dir NOT git-backed — tick-71 halt was a filesystem rollback with no recovery** | **P0** | 1.5 | 9 | `git init` `csoai-static-deploy2/` + first commit + `.backups/` mirror + hardened `.gitignore` + cron. Rollback recoverable <30min. (TICK 90.2) |
| O5 | **No post-deploy verification gate — ticks marked complete without proof** | P1 | 2 | 7 | Script: every claimed page must exist on disk AND in sitemap AND HTTP 200 before sigil emit. Gate all future ticks. (SOV3_AUDIT §7.1, TICK 90.3) |
| O6 | **No continuous drift monitor (audit was a one-shot 10-min manual run)** | P1 | 2 | 6 | 30-min cron: `diff sitemap.xml <(curl live/sitemap.xml)`; alert on drift. (SOV3_AUDIT §7.8) |
| O7 | **`_alignment/` frozen — only 2 of 400 docs dated today; activity stalled since tick 83** | P2 | 1 | 3 | Confirm sibling lanes idle-by-design vs stalled; log status in state.json. |
| O8 | **Byte mismatches AGENTS.md vs live (evidence-pack 21,175→21,006; sov-space 36,980→18,077)** | P2 | 1 | 4 | Reconcile claimed vs actual bytes; treat live-disk as truth, correct ledger. |

---

## 4. REVENUE

| # | Opportunity | Sev | Effort (h) | Impact | Concrete action |
|---|---|---|---:|---:|---|
| R1 | **AEO citation gap (F1) directly gates AI-search revenue 36 days before Article 50 cliff (2 Aug 2026)** | **P0** | — | 10 | (Same fix as F1) — this is the revenue framing: meta stack = citability = inbound. Highest $-impact single lever. |
| R2 | **Investor pack scattered, not a one-click tour; 3 investor pages phantom** | P1 | 3 | 8 | Build `/investors` hub aggregating deck/onepager/thesis/seriesa/term-sheet/proof-pack; restore phantoms. (TICK 92.1–92.2) |
| R3 | **Crown RFQ (highest-value tier: BAE/Rolls/Leonardo) not live end-to-end** | P1 | 2 | 8 | (B5) Make Crown RFQ the most-polished form; Director 24h SLA. Investors + primes see it first. |
| R4 | **CTA cascade missing on 363 pages (only funnel pages have persona→tier→Stripe)** | P1 | 4 | 7 | Scripted persona-aware tier grid injection; `grep DEFAULT_TIER_BY_PERSONA` ≥363. (CLAUDE_PATTERNS §6, TICK 88.1) |
| R5 | **Signup→welcome auto-flow not wired on ~80 form pages** | P2 | 3 | 6 | Every form POSTs `/api/signup` (or crown-rfq) + renders SIGIL receipt panel. (TICK 88.3) |
| R6 | **`www.csoai.org` returns 404 — brand domain dead, only staging alias live** | P1 | 0.5 | 7 | Human gate: create CNAME + Vercel alias. (SOV3_AUDIT §5.2.7, TICK 89.4) — flagged in state.json human_gates. |
| R7 | **11 MOD/DASA/NATO human-gate applications DRAFT-READY but unsent** | P1 | — | 8 | Owner-gated: Nick presses send on DASA/DIANA/UKDI/AISI drafts + DSP/Cyber-Essentials/SC registrations. (state.json human_gates) |

---

## 5. COMPLIANCE

| # | Opportunity | Sev | Effort (h) | Impact | Concrete action |
|---|---|---|---:|---:|---|
| C1 | **Article 50 watermarking cliff 2 Aug 2026 (~20 days from final seal) — countdown banner not on all compliance pages** | P1 | 1.5 | 7 | Inject cliff-countdown banner on every EU-AI-Act/compliance page. (CLAUDE_PATTERNS §7.3, House Rule 13) |
| C2 | **No JSON-LD Organization+WebSite+Article on root or long-form pages** | P1 | 2 | 6 | Add schema.org triple → Google Knowledge Panel + AI-cite eligibility. (CLAUDE_PATTERNS §7.4, TICK 87.5/91) |
| C3 | **SIGIL receipt footer dropped on most pages — the #1 differentiator vs every AI-OS pitch** | P1 | 2 | 7 | "Last SIGIL signed" footer linked to `/audit` on all 381. (SOV3_AUDIT §5.3 P1, TICK 87.6) |
| C4 | **57-charter universe claims 1,710/1,710 @ 100/100 — unverified against live checks** | P2 | 2 | 5 | Replay charter checks; confirm claim or downgrade. Crown asset integrity. |
| C5 | **OSCAL SSP/assessment-results present but not surfaced from `/master` or `/api/oscal`** | P2 | 1.5 | 4 | Link `sovereign-charters/oscal/*.json` from compliance hub + verify `/api/oscal` GET. |
| C6 | **Care-score floor (0.93–0.96) asserted per tick but no automated care-validation gate** | P3 | 2 | 3 | Wire `validate_care` into post-deploy gate (O5). |

---

## 6. UX

| # | Opportunity | Sev | Effort (h) | Impact | Concrete action |
|---|---|---|---:|---:|---|
| U1 | **No single front door — 381 pages, 0 discoverable from `/master`** | P0 | — | 8 | (F2) Master hub is the UX keystone: search + filter + tier group. |
| U2 | **3 brand palettes (DEFONEOS/SOV33/MEOK) risk cross-contamination** | P2 | 2 | 4 | Audit palette-token bleed; enforce per-surface `:root` isolation. (CLAUDE_PATTERNS §2.1 House Rule 1) |
| U3 | **Convention drift: alert-and-block vs inline-visible form validation coexist** | P3 | 3 | 3 | Normalise to inline-visible-state validation across forms. (CLAUDE_PATTERNS §3.3) |
| U4 | **No visible "you are here" / breadcrumb on deep pages** | P2 | 2 | 4 | Add JSON-LD BreadcrumbList + visual breadcrumb on 47 long-form pages. (TICK 89.3) |
| U5 | **Mobile: responsive collapse present at 768px but unverified on 381 pages** | P3 | 2 | 3 | Spot-check top-20 at ≤768px; fix nav-link hide + CTA stacking regressions. |

---

## 7. PERFORMANCE

| # | Opportunity | Sev | Effort (h) | Impact | Concrete action |
|---|---|---|---:|---:|---|
| P1 | **No PageSpeed/Core-Web-Vitals baseline (LCP/FID/CLS) on top surfaces** | P2 | 1 | 5 | Run PSI on SOV33_HERO/INDEX/defoneos/csoai-os; record baseline. (SOV3_AUDIT §5.3 P2) |
| P2 | **308 redirect chain (`/x.html`→`/x`) costs a round-trip on every page** | P1 | 1 | 5 | Confirm `vercel.json cleanUrls:false` (tick-85 fix) so `.html` returns 200 directly; kill redundant 308s. (TICK 89.2) |
| P3 | **Google Fonts CDN blocking (Inter + Space Grotesk) — no preload/subset** | P2 | 1.5 | 4 | `preconnect` present; add `font-display:swap` + subset; consider self-host. |
| P4 | **Large uncompressed pages (glossary 61KB, crosswalks 52KB, audit-pack 52KB)** | P3 | 2 | 3 | Verify Vercel gzip/brotli; lazy-load heavy tables/diagrams. |
| P5 | **No image optimization pipeline (og:image + diagrams will be raw PNG)** | P3 | 2 | 3 | When B4 lands, emit WebP/AVIF at responsive sizes. |

---

## 8. PRIORITY-RANKED CRITICAL PATH (P0 first)

The 9 P0 items — do these before anything else. ~14 hours total, lifts fleet 80→95 and makes state trustworthy:

1. **O1** — Refresh `DEFONEOS_SPRINT_STATE.json` to ground truth (0.5h) — *unblocks every next-action decision.*
2. **O2** — Reconcile the tick-87 identity collision (1h) — *blocks all future ticks.*
3. **O4** — git-back the deploy dir (1.5h) — *prevents the next tick-71-class data loss.*
4. **O3** — Restore-or-downgrade the 11 phantom pages (2h) — *stops the ledger lying.*
5. **F1 / R1** — Inject meta stack on 47 pages (3h) — *the single highest revenue+AEO lever, 36d before cliff.*
6. **F2 / U1** — Rebuild `/master` as 381-row hub (2h) — *the discoverability keystone.*
7. **B1** — Normalise HMAC to SHA-256 (1h) — *crown-surface integrity investors see first.*

**Then P1 wave (~28h):** F3, F4, F5, F6, B2, B3, B5, O5, O6, R2, R3, R4, R6, C1, C2, C3, P2 — the CTA cascade, canonical cleanup, investor hub, Crown RFQ live, SIGIL footers, cliff banners, post-deploy gate.

---

## 9. IMPACT × EFFORT QUADRANT (top movers)

**Quick wins (high impact, low effort ≤2h):** O1, R6, B1, F6, O2, F4, C1, P2
**Big bets (high impact, higher effort):** F1/R1, F2/U1, O3, O4, R2, R4, R3
**Fill-ins (low effort, modest impact):** B6, O7, U2, P1, P3
**Deprioritize (low impact):** F9, U3, U5, P4, P5, C6

---

## 10. CROSS-REFERENCE NOTES (M4 SOV-19 + TICK 86/87)

- **M4 lane** (`_m4/` 19 .py + 3 .sh; `M4_LANE_EXIT_CHECKLIST.md` 15,610b) is the owner-driven build lane that produced the 380 HTML files and sealed at 95+ avg. It handed JEEVES-FE-OWN full ownership 2026-07-13 04:40 with **no architectural rework required** — the remaining work is polish + AEO + canonical (per JEEVES charter §10.2).
- **SOV-19** = defense + sovereign-cloud + 5-of-7 Shamir Custodian layer. `sov-19.html` (18,359b, meta ✅, quality 91) is live and healthy; `sov-18.html` (45,251b, quality 94) is the all-in-one tab. **Both are crown assets orphaned from `/master`** — F6 fixes their discoverability. The 57-charter universe (`defoneos-charter-universe.html`, "M4-ALIGN-BUILDER soxoj SOV-19 sibling lane", 1,710/1,710 @ 100/100) is the compliance backbone but its claim is unverified (C4).
- **TICK 86** (EXPANSION PHASE 7) — claimed 3 bonus + 3 phantom pages. SOV3_AUDIT flags board-update/uk-sovereign-pitch/auditor-counter as phantom; yet AGENTS.md tick-87 "regression-checked board-update 17031 & auditor-counter 19418 intact." **Contradiction unresolved → O3 must verify on disk.**
- **TICK 87** — **forked identity.** AGENTS.md RELEASED = "EXPANSION PHASE 8 SHIP-GRADE BUNDLE" (proposal-pack 25,880b / pilot-evidence-pack 18,730b / deal-defcon-comparison 21,024b, 59 pages). On-disk `tick-87-sigil.json` = "SOV-SPACE-BUILD" (sov-space.html, 36,980b). SITE_INVENTORY lists `sov-space.html` at **18,077b** (quality 99) — a third byte value. **This triple-fork (O2) is the sharpest single integrity defect in the sweep** and must be reconciled before tick 88 opens.
- **JEEVES charter** already maps most fixes to a 7-tick roadmap (TICK 87→93, seal 2026-07-19 23:59). This research confirms that roadmap's targets and adds the tick-87-fork reconciliation (O2) as a **new blocker not in the charter** — the charter assumes tick 87 = master+meta+HMAC, but the disk shows tick 87 was consumed by sov-space.html instead.

---

## 11. TALLY

| Category | Opportunities | P0 | P1 | P2 | P3 |
|---|---:|---:|---:|---:|---:|
| FRONTEND | 9 | 2 | 4 | 2 | 1 |
| BACKEND | 6 | 1 | 3 | 2 | 0 |
| OPS | 8 | 4 | 2 | 2 | 0 |
| REVENUE | 7 | 1 | 5 | 1 | 0 |
| COMPLIANCE | 6 | 0 | 3 | 2 | 1 |
| UX | 5 | 1* | 0 | 2 | 2 |
| PERFORMANCE | 5 | 0 | 1 | 3 | 1 |
| **TOTAL** | **46** | **9** | **18** | **14** | **5** |

*(U1 is the same fix as F2; counted once in the P0 critical path.)*

**Highest-leverage move:** reconcile the three-way state fork (O1+O2+O3+O4 = ~5h) so the empire stops lying to its own operators — *then* ship the meta stack (F1/R1) for the AEO revenue before the 2 Aug Article 50 cliff.

---
**Report end.** 46 opportunities, 9 P0. The build is done; the truth layer and the AEO layer are the remaining 5%.
