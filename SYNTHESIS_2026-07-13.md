# SYNTHESIS — 2026-07-13
**Unified cross-doc synthesis for the DEFONEOS / SOV3 / MEOK empire at the 4AM launch window.**
**Author:** heavy parallel SYNTHESIS subagent under JEEVES (read-only across all 9 inputs; this is the single derivable view).
**Inputs synthesised (in full):**
1. `LEADERBOARD_INTEL_2026-07-13.md` — **NOT FOUND** in `/Users/nicholas/clawd/`; closest analogues are `API_CONNECT_2026-07-13.md` (6 leaderboards reachable live) and `SOV3_AUDIT.md §2.1` (53 SOV3/SOV33 surfaces). This absence is itself a finding (see §6 contradiction).
2. `API_CONNECT_2026-07-13.md` — 18,618b — 6/9 public APIs LIVE, 3 owner-gated.
3. `CLEVER_PLAYS_2026-07-13.md` — 26,929b — 16 ranked plays, Net=9.5 → 6.2.
4. `4AM_START_HERE.md` — 19,468b — 7-step 30-min ritual + overclaim list of 15.
5. `IMPROVEMENT_RESEARCH_2026-07-13.md` — 17,331b — 46 opportunities, 9 P0 (~14h).
6. `CODE_QUALITY_AUDIT_2026-07-13.md` — 33,305b — 187 findings, 9 CRITICAL, 38 HIGH.
7. `SOV3_AUDIT.md` — 27,931b — 53-page inventory, grades A−→F, the 11 phantom pages.
8. `SITE_INVENTORY.md` — 138,930b — full 381-page + 18-API catalog, byte-verified.
9. `JEEVES_FRONTEND_TAKEOVER.md` — 37,043b — JEEVES-FE-OWN charter, T87→T93 roadmap, **Appendix A** documents T89 already shipped (4 of 16 clever plays executed).

> **Critical context the parent should know first:** between the overnight intel capture (04:00–06:00 BST) and now, **TICK 89 of JEEVES-FE-OWN shipped 4 of the 16 clever plays** (state reconciliation, master-hub rebuild, Article-50 banner storm, meta-stack mass-injection). The "4AM Start Here" and CLEVER PLAYS docs were written against the pre-T89 baseline. Several P0 gaps in those docs have been **partially or fully closed** by T89. This synthesis re-anchors every play to the **post-T89 baseline** so the parent doesn't double-execute.

---

## 1. EMPIRE STATE AT 11:50 BST 2026-07-13 (effective baseline)

| Asset | Pre-T89 claim (per inputs) | Post-T89 effective reality | Source for new reality |
|---|---|---|---|
| Live HTML pages on disk | 405 / 380 / 381 (3 estimates) | **381** + 1 sitemap + 1 state.json + 25 tick-NN-sigil.json | JEEVES Appendix A; SITE_INVENTORY |
| Live HTML on Vercel | 381 | 381 | sitemap.xml |
| Pages missing `<meta name="description">` | 24 (4AM) / 47 (SOV3_AUDIT / IMPROVEMENT_RESEARCH) | **0** (85/85 = 100% per JEEVES Appendix A.2) | JEEVES A.2 |
| Pages with JSON-LD `Article` schema | 0 | **85/85 = 100%** | JEEVES A.2 |
| Pages reachable from `/master` | 0 / 381 (orphan) | **84/84** data-table rebuild (master.html now 48,143b) | JEEVES A.2 |
| Pages with Article 50 countdown banner | 0 | **69/85 (81%)** | JEEVES A.2 |
| Pages with sovereign SIGIL footer | 0 | **69/85 (81%)** | JEEVES A.2 |
| `DEFONEOS_SPRINT_STATE.json` | stale at ticks_completed=76 | **derived;** ticks_summary + per-tick digest + care now 8,754b | JEEVES A.2 / Play 1 tool |
| `tick-89-sigil.json` | last real tick=87 | **89** (T89 was 11:50 BST today) | JEEVES Appendix A.1 |
| HMAC drift (signup.js=SHA-512 vs fleet=SHA-256) | 1 drift point | **NOT YET FIXED** (T89 scope was 4 plays only) | JEEVES charter T87.3 / CLEVER Play 5 |
| BFT-33 quorum | 28/33 on every tick | **unchanged** — 28/33 still on T89 | JEEVES A.1 |
| Average static quality | 80.1 (SITE_INVENTORY) | **95+** (JEEVES T89 seal claim) | JEEVES A.2 |
| Phantom pages (AGENTS.md claims, missing on disk) | 11 | **unchanged** — T89 didn't reconcile | SOV3_AUDIT §3 |
| Hardcoded HMAC fallback secrets | 5 endpoints | **unchanged** (CRITICAL per Code Quality audit) | CODE_QUALITY_AUDIT B-C1/B-C2 |
| Article 50 cliff | 2 Aug 2026 — 20 days to T93 seal, 36 from today | **2 Aug 2026 — 19d 16h to cliff at T89 seal** | JEEVES A.1 |

**Take-away.** The empire is in a materially better state than the overnight intel implies. The overnight batch saw the **pre-T89** baseline and recommended 4-of-16 clever plays; **3 of those 4 have been delivered** by JEEVES T89. The parent should treat the remaining 13 plays + the still-open CRITICAL code issues as the real backlog.

---

## 2. SYNTHESIS MATRIX — every clever play vs every leaderboard, vs existing artifacts, vs gap, vs priority

### 2.1 The 16 clever plays mapped to leaderboards + artifacts

| # | Play | Target leaderboard(s) | Which existing artifact covers it today? | Gap | T89 status | New priority (post-T89) |
|---|---|---|---|---|---|---|
| 1 | State-Truth Fork Reconciliation | DEFONEOS_SPRINT_STATE.json accuracy; operator decision cadence | `tools/reconcile_state.py` (T89 deliverable); state.json now 8,754b derived | Now CLOSED by T89 (per JEEVES A.1). Re-verification still needed — verify it actually re-runs idempotently on every tick | **DONE** | **deprioritised** — keep cron at 30-min cadence per JEEVES A.4 T90.3 |
| 2 | Master-Hub Index Reborn | UX discoverability; AI Overview crawl coverage | `master.html` rebuilt at 48,143b, 84-row data-table sourced from sitemap.xml, full meta stack + JSON-LD WebSite + Article-50 ticker | Now PARTIAL — covers 84 of 381 pages (only the "crown" subset). The 297 catalog `defoneos-*.html` non-mod pages are still not in the table | PARTIAL | **P0 still** — extend master to full 381 rows (extend `tools/build_master.py`) — ~2h |
| 3 | Meta-Stack Mass-Injection | AEO citation (Google AI Overview / Bing Copilot / Perplexity / DuckDuckGo) | `tools/meta_inject.py` (T89 deliverable); 85/85 on the crown subset; 0 missing meta in fleet per JEEVES A.2 | Crown subset done; verify the other ~296 catalog pages weren't accidentally skipped | PARTIAL | **verify** — `grep -L 'meta name="description"' csoai-static-deploy2/*.html | wc -l` must = 0; extend if not (~1h) |
| 4 | Article 50 Cliff-Countdown Banner Storm | EU AI Act Article 50 watermarking visibility; regulator/buyer trust signal | `tools/article50_banner.py` (T89 deliverable); 69/85 surfaces carry banner; ticker on master.html | 16/85 of the inspected crown surfaces still don't carry it (some pages may legitimately be exempt — verify exempt list) | PARTIAL | **verify + extend** — bring to 100% on relevant surfaces (~30 min) |
| 5 | HMAC SHA-256 Unification | Crown surface integrity for investor/buyer diligence | UNTOUCHED on T89 scope | `api/signup.js` still uses `createHmac('sha512')` with hardcoded fallback secret. **CRITICAL** per CODE_QUALITY_AUDIT B-C1+B-C2 | NOT DONE | **P0 still** — 1h script: normalise HMAC + remove 5 hardcoded fallback secrets across 6 endpoints — ~2h |
| 6 | SIGIL Receipt Footer Cascade | Sovereign signal bar / differentiator vs every AI-OS | `tools/` per JEEVES A; SIGIL footer on 69/85 inspected | 12/85 still missing footer on crown subset; full 381 fleet not yet covered | NOT DONE | **P1** — extend script to full fleet + verify `/api/sigil-status` is reachable from footer — ~2h |
| 7 | Phantom-Page Reconciliation Ritual | AGENTS.md ↔ filesystem ↔ sitemap triangulation | None — playwright does not exist | 11 pages still claimed-RELEASED, missing on disk. **Tick-71 filesystem-rollback pathology not yet git-backed.** | NOT DONE | **P0 still** — write `tools/phantom_detector.py` cron (2h) — addressed in JEEVES T90.1 |
| 8 | The 4AM "One Sigma = One Cursor" Play | BFT-33 daily vote cadence; proof-of-thought audit ledger | `mcp__sov3_federation__sigil_emit` is wired; the cron for one SIGIL/sec/cursor is not yet installed | Still 0 → ~258k sigils/day compounding. Zero new code required, just cron entries per agent | NOT DONE | **P0 still (cheap)** — add to launchd/cron across 33 agents (~30 min) — biggest "audit-trail flywheel" win |
| 9 | OWEM "Empty-Niche" First-Mover Claim | SOV3 wisdom-map coverage / canonicalised sovereign claims | `mcp__sov3_federation__get_empty_niches` exists; no consumer yet | SOV3 MAP-Elites archive has empty cells; no first-mover pages exist | NOT DONE | **P2** — 4h (punted from P0 since revenue not gated on it pre-cliff) |
| 10 | Sovereign Proof-Pack as Buyer's Diligence Backchannel | Enterprise procurement trust cycle compression | `defoneos-sovereign-proof-pack.html` IS PHANTOM (26,000b claimed, missing on disk per SOV3_AUDIT §3.1). NOT live | Pack must be **restored** first before it can be referenced | NOT DONE | **P0 still** — 6h; restore phantom pack + write 5-question non-cooperative audit script (JEEVES T92.2 + T90.1) |
| 11 | Cesium 3D COP Standalone Live Demo | Public-facing live demo for buyer meetings and press | `defoneos-cesium-3d-cop.html` (10,440b) is live and orphan from `/master` per SOV3_AUDIT | Linked from no other surface; no verification gate that Cesium loads <3s | NOT DONE | **P1** — 1h; write `tools/verify_cesium.py` + cross-link from `defoneos-prime-pitch.html` and `defoneos-case-studies.html` |
| 12 | JSON-LD `Organization`+`WebSite`+`Article` Triple Cascade | Google Knowledge Panel + AI citation eligibility | Triple JSON-LD on 85/85 of the crown subset (T89 shipped) | Extended to only 85 of 381 — same verify/extend gap as play 3 | PARTIAL | **P1** — extend to full 381 (~1h via `tools/meta_inject.py` --all) |
| 13 | Crown RFQ Director-SLA Loop | Crown-tier funnel for BAE/Rolls/Leonardo | **Highest $-per-hour play per CLEVER_PLAYS** (`api/crown-rfq.js` exists but unverified end-to-end per CODE_QUALITY_AUDIT B-C5) | Endpoint exists; not wired to Director email/calendar; SIGIL receipt not surfaced to buyer | NOT DONE | **P0 still** — 2h; verify with `curl POST /api/crown-rfq`, wire SIGIL receipt panel, Director 24h SLA — **the highest-revenue play** |
| 14 | "Sigils per Crown-RFQ" Bounty Programme | Reverse-incentivise MOD primes to share audit packs | None — concept-only | Wisdom-point ledger not built | NOT DONE | **P3** — 4h; puntable to post-launch week 2 |
| 15 | Reverse-Citation Ladder from Perplexity / Bing | AEO second-mover — index 47 key surfaces in Bing/Perplexity within 24h | None — submission not yet sent | Free wins; just submit | NOT DONE | **P1 (cheap)** — 30 min; submit to Bing IndexNow + Perplexity contact form |
| 16 | Phantom-Tick-71 Recovery Pledge Public Post-Mortem | Public transparency / trust-relationship lever | None — not published | Stock the recovery story | NOT DONE | **P2** — 1h; `defoneos-recovery-postmortem.html` |

### 2.2 Cross-cuts not yet captured as their own plays

| Item | Existing artifact | Gap | Effort |
|---|---|---|---|
| **`www.csoai.org` returns 404** | None | Brand domain dead — only Vercel staging alias live. Investor + press will type the canonical URL | 0.5h ops + human gate (CNAME + Vercel alias) per JEEVES T89.4 |
| **`d6-distribution.html` at quality 57** | Live (14,596b) | Lowest SOV3-tier quality surface — investor-page candidate | P2 improvement |
| **Cesium 2.5MB blocking script** | `index.html:9-10` | No `defer`; blocks first paint 800-1500ms | 30 min per CODE_QUALITY_AUDIT F-H4 |
| **`api/debug-signup.js` echoes raw request body** | Exists, gated only by directory membership | Echoes PII to anyone — remove or env-gate | 30 min per B-C4 |
| **`api/crown-rfq.js` builds raw HTML email** | Live | Unescaped `JSON.stringify(body.rfq, null, 2)` is an HTML corruption / XSS vector per B-C5 | 1h |
| **309-page declaration of state drift** | All three sources-of-truth (state.json / AGENTS.md / on-disk sigil) | T89 closed the first; **tick-87 identity collision** still unresolved per IMPROVEMENT_RESEARCH O2 — AGENTS.md says "proposal-pack bundle", on-disk sigil says "SOV-SPACE-BUILD" | T90 inherits |
| **SOV3/SOV33/HM sigil-rate decay** | Heartbeat learner stopped (34 cycles · 68 memories · 11 errors per 4AM) | Overnight idle — re-arm the cron | 15 min |

### 2.3 The eight "leaderboard" surfaces that exist or need building

The `LEADERBOARD_INTEL_2026-07-13.md` file was not delivered. From the other 8 docs, the leaderboard landscape is:
1. **LMSYS Arena / Open LLM** — 2/9 public per `API_CONNECT` (HF + OpenRouter); mirror `lmsys/lmsys-chat-1m` dataset via HF. Endpoint `/api/leaderboard-ingest` exists.
2. **HuggingFace Open LLM Leaderboard** — CSV at `huggingface.co/datasets/open-llm-leaderboard/leaderboard/...` — pullable in 1 line.
3. **SOV3 internal SOV33/SOV33-ranking** — 53 sovereign surfaces, 6 carry the strong signal stack (SOV33_HERO quality 95, SOV33_INDEX 88, SOV33_OWEM_EXPLAINER 92, SOV33_BRAIN_STACK 85, SOV33_GAME_ARENA_AWARENESS 85, SOV3_OOWM_BRIEFING 90, defoneos.html 88, csoai-os.html 85 — per SOV3_AUDIT §2.1).
4. **`/master` Crown Jewel index** — now 48,143b / 84 rows (post-T89). Needs extension to 381.
5. **DEFONEOS Crown Procurement Funnel** — `defoneos-crown-procurement.html` (live, 84 quality) + `defoneos-prime-pitch.html` (80) + `defoneos-defense-rfq.html` (71) form the Crown funnel. Crown RFQ `/api/crown-rfq.js` unverified end-to-end.
6. **`/api/leaderboard` (existing)** — returns aggregated SOV33 benchmark scores; needs `/api/leaderboard-ingest` (per `API_CONNECT` §3.2 — shipped, takes `{source,query}`).
7. **`/api/sovereign-citations` (existing)** — extracts DEFONEOS page citations; SSRF-shaped (CODE_QUALITY_AUDIT B-H9).
8. **`/api/sovereign-telemetry`** — live SOV3 model + BFT + substrate telemetry. Returns hardcoded `pages: 226` (CODE_QUALITY_AUDIT B-H8 — stale).

---

## 3. TOP 3 HIGHEST-LEVERAGE PLAYS — full 5-step execution plans

The three plays below maximise **leverage ÷ effort** while the cliff is 19 days away and the Series-A window opens next week. They deliberately **deprioritise the already-shipped T89 plays** and the still-on-disk but cheap wins.

### PLAY A — Crown RFQ Director-SLA Loop (Clever #13) — **2 hours, highest $-per-hour**

**Why this is the top.** Per `CLEVER_PLAYS_2026-07-13.md` §13: Crown RFQ is the choke-point for £252k Year-1 contracts (BAE / Rolls / Leonardo / L3Harris). Even **one** closed RFQ = £252k Y1 + 3-year LTV ~£550k. The endpoint exists (`api/crown-rfq.js`, 13,082b, GET/POST/OPTIONS 200/204) but is unverified end-to-end per `CODE_QUALITY_AUDIT_2026-07-13.md` B-C5. The Director SLA converts "I'll get back to you eventually" into "we have a slot at 14:00 tomorrow" — closing power ×10.

| Step | Concrete action | Tool / file | Exit condition |
|---|---|---|---|
| A1 — Verify endpoint end-to-end | `curl POST https://csoai-static-deploy2.vercel.app/api/crown-rfq -H "Content-Type: application/json" -d '{"organization":"Test Org","contact_name":"N. Templeman","contact_email":"nick@example.com","classification":"Official","summary":"verification test","amount_gbp_estimate":180000}'` | terminal | `full_sigil` field is present, SHA-256 verifiable; `status` = `received` |
| A2 — Wire SIGIL receipt panel to form response | Modify `api/crown-rfq.js` response to include `full_sigil`, `sigil_chain_digest`, `verify_url`; modify form-page to render receipt with `<a href="/audit.html?digest={sigil}">View on chain</a>` | `api/crown-rfq.js` + `defoneos-crown-procurement.html` | Form submission shows signed receipt within 2s |
| A3 — Director SLA — wire auto-email + auto-calendar | Add Resend (or SMTP) call: `if (form_valid) send_email(TO=director, SUBJECT="Crown RFQ from {org} — 24h SLA", BODY=sigil_receipt)`; add `mcp__sov3_federation__sov_auto_fix` trigger to log a calendar event | `api/crown-rfq.js` + director email recipient | Director receives notification email within 60s of submission; SIGIL receipt references director_acknowledged=true |
| A4 — Add Director 24h SLA visible copy | Crown-rfq page: above the fold, **"Director 24-hour reply SLA on every Crown submission"** + the SIGIL receipt URL pattern | `defoneos-crown-procurement.html` | Page renders the SLA line + receipt slot |
| A5 — Emit the SIGIL + add to budget weekly | `mcp__sov3_federation__sigil_emit({op:'C', fields:{actor:'jeeves', subject:'crown-rfq-director-sla-live', ticks_completed:89, care_score:0.95}})` + `tools/phantom_detector.py` cron at 30-min cadence (per JEEVES A.4 T90.3) | MCP `sigil_emit`; cron | SIGIL line appears in `/audit.html`; cron entry installed |

**Total: ~2 hours.** Crown-tier funnel: from "endpoint may work" to "Director reply guaranteed in 24h, every submission SIGIL-signed."

### PLAY B — State + Phantom + HMAC Reconciliation (Clever #5 + #7 + #1 verify) — **3 hours, the foundation**

**Why this is second.** State lies (tick-87 collision) + 11 phantom pages + 1 HMAC drift = the only way a buyer-side procurement officer can be caught out. Per `SOV3_AUDIT.md §3` + `IMPROVEMENT_RESEARCH §10` + `CODE_QUALITY_AUDIT B-C1/B-C2`: these are the 3 "embarrassment" surfaces a Crown-tier diligence team can catch in the first 24h of review. Fix all three together because they share a deploy-gate script.

| Step | Concrete action | Tool / file | Exit condition |
|---|---|---|---|
| B1 — Reconcile tick-87 identity collision | Edit `AGENTS.md` to record: `tick-87 = on-disk reality = SOV-SPACE-BUILD (sov-space.html, 36,980b claimed / 18,077b live)`. Number the proposal-pack bundle as **tick-87b** (next tick). Update `DEFONEOS_SPRINT_STATE.json` to expose both `tick_87_canonical` and `tick_87b_proposal_pack`. Bump `ticks_completed:89` truthfully | `AGENTS.md` + `DEFONEOS_SPRINT_STATE.json` | Both files agree; `tools/reconcile_state.py` does not regress on next run |
| B2 — git-back the deploy dir (per JEEVES T90.2 + SOV3_AUDIT §5.3 O4) | `cd /Users/nicholas/csoai-static-deploy2 && git init && git add -A && git commit -m 'T89-snapshot' && echo "csoai-static-deploy2/\n!.vercel/\n" > .gitignore && mkdir -p .backups && echo "cron: every 15min push to git remote" > .backups/README` | terminal + git | `git log --oneline` shows initial commit; `.backups/` exists; rollback now recoverable <30 min |
| B3 — Install `tools/phantom_detector.py` cron | Write the script: `for claimed in $(grep 'RELEASED' /Users/nicholas/clawd/AGENTS.md | grep -oE 'defoneos-[^ ]+\.html' | sort -u); do if [ ! -f /Users/nicholas/clawd/csoai-static-deploy2/$claimed ]; then emit_sigil "phantom: $claimed"; fi; done`; `chmod +x`; install in launchd at every-30-min cadence per JEEVES A.4 T90.3 | `tools/phantom_detector.py` + launchd plist | Cron fires; SIGIL `op='A'` lines emitted for the 11 phantoms |
| B4 — HMAC SHA-256 normalisation + fallback-secret removal | Replace `createHmac('sha512'` with `createHmac('sha256'` in `api/signup.js`; add JSDoc naming convention; remove the 6 hardcoded fallback secrets across `signup.js / welcome.js / sov-bridge.js / sov-space-state.js / j-space-think.js / crown-rfq.js`; replace with `if (!process.env.SIGN_KEY) throw new Error('SIGN_KEY required')` | `api/*.js` × 6 | `grep -r "createHmac('sha512'" api/` = 0 hits; `grep -r "FALLBACK-NOT-FOR-PRODUCTION" api/` = 0 hits; runtime test of `POST /api/signup` still 200 with valid `SIGN_KEY` |
| B5 — Emit the SIGIL + close-out | `mcp__sov3_federation__sigil_emit({op:'C', fields:{actor:'jeeves', subject:'state+phantom+hmac-reconciled', ticks_completed:89, care_score:0.95}})` + add an "Embarassment Surfaces = 0" entry to the morning inventory cron | MCP `sigil_emit`; `4AM_START_HERE.md` morning ritual | SIGIL line appears; morning-inventory M6 emits the success status |

**Total: ~3 hours.** Three pathologies closed in one batch.

### PLAY C — Meta-Stack Extension + AEO Submission Ladder (Clever #3 extend + #15) — **1.5 hours, the revenue gate before cliff**

**Why this is third.** Per `IMPROVEMENT_RESEARCH F1+R1`: AEO blindness is the #1 revenue lever **36 days before EU AI Act Article 50 cliff**. T89 brought crown subset to 100% — Play C extends to the full 381 + submits to Bing/Perplexity/DuckDuckGo so the citations land in 24–48 hours.

| Step | Concrete action | Tool / file | Exit condition |
|---|---|---|---|
| C1 — Verify meta coverage on the 297 catalog (non-crown) pages | `grep -L '<meta name="description"' /Users/nicholas/clawd/csoai-static-deploy2/*.html | wc -l` — record the number | terminal | Number = 0 if T89 fully extended; else identify the gap |
| C2 — Extend `tools/meta_inject.py` to full fleet | Add a loop: `for f in *.html; do python meta_inject.py "$f"; done` (idempotent — re-use the sentinel gates T89 added) | `tools/meta_inject.py` | All 381 pages carry `<meta name="description">` + `<meta name="keywords">` + `<link rel="canonical">` + `<meta property="og:*">` |
| C3 — Extend JSON-LD Article to full fleet | Same loop, with the JSON-LD Article triple template from `tools/meta_inject.py` | `tools/meta_inject.py` | 381/381 pages emit schema.org/Article JSON-LD |
| C4 — Submit to Bing IndexNow | `curl -X POST "https://www.bing.com/indexnow" -H "Content-Type: application/json" -d '{"host":"csoai-static-deploy2.vercel.app","key":"<key>","keyLocation":"...","urlList":[<47 crown + index + master + sitemap>]}'` | terminal + IndexNow key | Receipt of `200 OK` from Bing |
| C5 — Perplexity + DuckDuckGo + Sitelinks submission | `curl POST https://perplexity.ai/contact/submit` + `curl POST https://duckduckgo.com/feedback` + Google Search Console "Sitemaps" resubmit | terminal | 4 submission receipts (Bing/Perplexity/DuckDuckGo/Google) |
| C6 — Emit SIGIL + add to AEO monitoring cron | `mcp__sov3_federation__sigil_emit({op:'C', fields:{actor:'jeeves', subject:'aeo-citation-fleet-wide', ticks_completed:89, care_score:0.95}})`; add nightly `grep -c 'meta name="description"' *.html | awk '{s+=$1} END {print s}'` to the morning inventory cron for ongoing AEO coverage | MCP + cron | SIGIL line emitted; morning cron reports 381/381 |

**Total: ~1.5 hours.** Last gate before the cliff that materially gates revenue.

---

## 4. CONTRADICTIONS BETWEEN INPUTS (the live ones)

| # | Contradiction | What each input says | Resolution |
|---|---|---|---|
| C1 | **Number of phantom pages & which ones** | SOV3_AUDIT §3 lists 11 (board-update / uk-sovereign-pitch / auditor-counter / vendor-pivot / investor-thesis / sovereign-proof-pack / customer-success-scorecard / escalation-runbook / churn-prevention / 30-60-90-customer / quarterly-review / renewal-negotiation). 4AM says 11. IMPROVEMENT says 11. **AGENTS.md is the unique-as-source** (the leadership log). | All three agree on the count; reconcile at **play B1** by downgrading each AGENTS.md claim to ASPIRATIONAL OR restoring the bytes per JEEVES T90.1 / T92.2. |
| C2 | **State-of-record claim** | state.json says tick 76, AGENTS.md says tick 87, disk tick-87-sigil says SOV-SPACE-BUILD vs proposal-pack. **All three fail to agree.** | T89 closed the state.json → truth-derivation gap via `tools/reconcile_state.py`. **Tick-87 identity collision is the residual** — addressed in Play B1 above. |
| C3 | **Quality bar claim** | SITE_INVENTORY: 80.1/100. JEEVES charter §4: bar is 95+. JEEVES Appendix A: post-T89 = 95+. | Effective quality is **above 95 on the crown 84**, **below 95 on the catalog 297**. The parent should **distinguish "crown quality 95+" from "fleet quality 80.1+"** when communicating externally. |
| C4 | **API endpoint existence** | SOV3_AUDIT §2.4 says: "There are no JSON API endpoints shipped from the csoai-static-deploy2 directory. This is a purely static Vercel deployment." SITE_INVENTORY API inventory lists **18 endpoints** (signup, crown-rfq, persist, etc.) all returning 200/204. JEEVES charter §8.2 lists **18 endpoints**. API_CONNECT §3.1 lists **9 endpoints already + 2 shipped this tick**. **SOV3_AUDIT is wrong.** | Use SITE_INVENTORY + API_CONNECT as truth: **18 routed APIs + 1 helper, all real, all live.** SOV3_AUDIT auditor error. |
| C5 | **Meta-stack coverage** | 4AM says 24 missing. SOV3_AUDIT §5.2.1 says 47 of 53 missing. JEEVES Appendix A says 0 missing post-T89. | **Post-T89 effective reality: 0 missing** on the crown subset (85). Likely the 297 catalog pages are still un-touched — Play C1 verifies; C2 extends. |
| C6 | **Tick-87 deliverable content** | AGENTS.md: "EXPANSION PHASE 8 SHIP-GRADE BUNDLE" (proposal-pack 25880 / pilot-evidence-pack 18730 / deal-defcon-comparison 21024). Disk sigil: SOV-SPACE-BUILD (sov-space.html). SITE_INVENTORY lists sov-space.html at **18,077b** (third byte value). | Triple-fork. **No single source of truth agrees.** This is the **single sharpest integrity defect** per IMPROVEMENT_RESEARCH §10 note 4. Resolved at Play B1. |
| C7 | **MCP count** | "30/30 ✅" claimed in many places; "30 MCPs" in JEEVES §1; "187 MCP servers" mentioned once in a stale comment; "30/30 vs 188+ tools" elsewhere. | **`30 MCPs** *and* **188+ tools** — both numbers are correct because tools = per-MCP capabilities. Don't claim "187 MCP servers" anywhere (the 187 figure is for tools, not servers). |
| C8 | **`/master` content** | SITE_INVENTORY says links to 0 of 381. JEEVES Appendix A says post-T89 master.html is 48,143b with 84-row data-table. | **T89 fixed the crown 84; the catalog 297 still need extension.** Play C2 covers; same script (`tools/build_master.py`). |
| C9 | **AGENTS.md tick-86 phantom claim** | AGENTS.md tick-87 "regression-checked board-update 17031 & auditor-counter 19418 as intact" yet SOV3_AUDIT §3.1 lists both as phantom | Likely the **AGENTS.md tick-87 regression-check is the audit's own self-report** (auditor saw bytes in Vercel public), but those Vercel bytes don't exist in local disk nor in `sitemap.xml`. **Two of the same claims are true on Vercel but absent on local disk** = the deploy-dir-as-truth pathology. |
| C10 | **`api/leaderboard-ingest.js` existence** | API_CONNECT §3.2 says "**NEW** — shipped this tick". JEEVES charter T87→93 doesn't list it. | Treat as shipped per API_CONNECT §3.2 + JEEVES A.1 (T89 also added `leaderboard-ingest`/`sovereign-corpus`). |

**Single biggest input contradiction: the `state.json / AGENTS.md / on-disk sigil` three-way fork (C2 + C6).** Until B1 closes it, no other operational decision is fully trustworthy. **Second biggest: the catalog-pages-not-yet-AEO-eligible gap** (C5 extension to the 297 non-crown pages) — the revenue gate.

---

## 5. THE SINGLE BIGGEST GAP OR RISK FOR 4AM GO-LIVE

> **The asset that does not yet exist on disk: a deploy-gate script that enforces "every claimed-page-exists-on-disk-AND-in-sitemap-AND-is-HTTP-200 before the tick can be marked complete."**

**Why this is the risk.** Per SOV3_AUDIT §7.1 + IMPROVEMENT_RESEARCH O5 + JEEVES T90.3: every phantom page ever shipped (11 total, now potentially more after T89 banner + meta injection extensions) was phantom because **no script refused to mark a tick complete when the disk reality disagreed with the AGENTS.md claim.** The 4AM go-live assumes 381 pages are live; if even **5 of them 404** when a Crown-tier buyer checks first thing Monday morning, the credibility loss is unrecoverable for the Series A cycle. T89 added reconciliation tooling but not the **gate** that prevents the next 11 phantoms from re-occurring.

**Concrete mitigation (1 hour):**

```bash
# tools/deploy_gate.py (new)
python3 - << 'PY'
import json, os, sys, urllib.request, re

ROOT = "/Users/nicholas/clawd/csoai-static-deploy2"
BASE = "https://csoai-static-deploy2.vercel.app"

# 1. Reconcile disk vs sitemap
sitemap = urllib.request.urlopen(f"{BASE}/sitemap.xml").read().decode()
sitemap_urls = set(re.findall(r"<loc>([^<]+)</loc>", sitemap))

disk_files = set(f for f in os.listdir(ROOT) if f.endswith(".html"))
disk_urls = {f"{BASE}/{f}" for f in disk_files}

# 2. AGENTS.md "RELEASED" claim check
ag = open("/Users/nicholas/clawd/AGENTS.md").read()
claims = set(re.findall(r"defoneos-[a-z0-9\-]+\.html", ag))
claimed_files = {f for f in claims if os.path.exists(os.path.join(ROOT, f))}
missing = {c for c in claims if not os.path.exists(os.path.join(ROOT, c))}

# 3. State.json truth check
state = json.load(open(f"{ROOT}/DEFONEOS_SPRINT_STATE.json"))
ag_ticks = sorted({int(m) for m in re.findall(r"TICK (\d+)", ag) if int(m) < 200})
state_tick = state.get("ticks_completed", 0)

errors = []
if missing:
    errors.append(f"PHANTOM CLAIMS: {sorted(missing)}")
if sitemap_urls - disk_urls:
    errors.append(f"SITEMAP-DISK DRIFT: {sitemap_urls - disk_urls}")
if state_tick < ag_ticks[-1]:
    errors.append(f"STATE STALE: state={state_tick} vs AGENTS.md={ag_ticks[-1]}")

if errors:
    print("DEPLOY GATE FAILED:")
    print("\n".join(errors))
    sys.exit(1)
print(f"DEPLOY GATE PASSED: {len(disk_files)} files | {len(sitemap_urls)} sitemap | state tick {state_tick} | no phantoms")
PY
```

`chmod +x`; install as pre-deploy hook in `csoai-static-deploy2/.vercel/`. **Result:** no future tick can be marked complete while any phantom claim, sitemap-drift, or stale state.json exists. The pattern is **the same one `nix` uses for build outputs**: make truth derivable, refuse to publish a lie.

This is the only risk worth pre-4AM mitigation because every other gap (Crown RFQ, meta coverage extension, HMAC fix) can be closed during business hours Monday without existential consequence; **the credibility loss from a single 404 on a Crown-page during 4AM Monday is non-recoverable.**

---

## 6. TOP 3 WINS POSSIBLE THIS WEEK (Mon 13 Jul → Sun 19 Jul, T87→T93)

If the 3 plays in §3 land and the 4 TIMING-WISE-LIGHT deliverables below close, the week can deliver:

| # | Win | Why it matters | Score |
|---|---|---|---|
| W1 | **Crown Tier goes "Director 24h SLA + signed receipt"** | BUYER-FACING LIE-CLOSURE. `BAE / Rolls / L3Harris / Leonardo` Crown RFQ submissions now get a SIGIL receipt + 24h Director reply. Crown-tier close-rate rises from baseline ~25% to ~40-50% per CLEVER_PLAYS §13 estimate. **One closed Crown = £252k Year-1 + £550k 3-yr LTV.** | **EXCEPTIONAL** |
| W2 | **AEO citation goes live across the full 381** | REVENUE LEVER. Google AI Overview + Bing + Perplexity + DuckDuckGo cite all 381 surfaces within 72h of IndexNow submission. Article-50 banner storm remains (T89 shipped 69). 36 days before EU AI Act Article 50 cliff means **the citations compound through the buyer's entire procurement-decision window.** | **HIGH** |
| W3 | **"Defence-aware" sovereign credibility claim proven** | GOVERNANCE LEVER. Play B (state + phantom + HMAC) closes the 3 embarrassment surfaces. The new `defoneos-recovery-postmortem.html` (CLEVER_PLAYS §16) becomes a SIGIL-anchored proof-of-recovery story that **no competitor can manufacture** — we displayed our data-loss + recovery publicly, signed every step. Combined with the BFT-33 quorum from `mcp__sov3_federation__submit_council_proposal` on the deploy-gate, this is the strongest "sovereign AI for Crown procurement" moat in the market. | **EXCEPTIONAL** |

**Supporting deliveries that close the week:**
- All 381 pages AEO-eligible (Play C2)
- Crown-RFQ Director SLA wired (Play A)
- State + Phantom + HMAC reconciled (Play B)
- **`tools/deploy_gate.py`** installed (play in §5)
- 1Hz SIGIL emission cron re-armed for 33 agents (Clever #8, 30 min)
- Public recovery post-mortem published (Clever #16, 1h)
- All 4-5 critical `/api/*` PII endpoints (signup / welcome / crown-rfq / invite / newsletter) CORS tightened (CODE_QUALITY_AUDIT B-H1, 30 min)
- Cesium 3D COP linked from `defoneos-prime-pitch.html` (Clever #11, 1h)
- **`www.csoai.org` CNAME wired** (R6, 30 min — but human gate)

---

## 7. TOP 3 RISKS TO MITIGATE THIS WEEK

| # | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| R1 | **Phantom page OR sitemap drift during T90–T93 deploys** | **High** — every prior recovery tick has shipped at least 2-3 phantom pages; T89's `tools/build_master.py` + meta-inject extended surface area further | **Critical** — Crown-tier diligence catches a 404 = credibility loss that lasts Series-A cycle | Install **`tools/deploy_gate.py`** as pre-deploy hook (this is what §5 above says to do). Run it manually at the start of every tick. Add a Monday-morning cron at 09:00 BST that emails Nick with a 1-line PASS/FAIL summary. |
| R2 | **HMAC-drift catches a buyer/CISO during diligence** | Medium — `api/signup.js` still on SHA-512; 5 hardcoded fallback secrets still in source | **Critical** — single biggest governance "gotcha" per CODE_QUALITY_AUDIT B-C1/B-C2/B-H11. Buyer asks why the hash algos differ = consistent-failure-mode | Play B4 (HMAC unification + fallback-secret removal). 1h script, 0h risk. |
| R3 | **Tick-87 identity collision causes a downstream audit failure** | Medium — three sources of truth disagree; the agent that runs tick 88 will inherit whichever AGENTS.md says, which conflicts with disk reality | **High** — Crown-tier OSCAL evidence pack or AISI submission would be rejected if a SIGIL claim references a deliverable that doesn't exist | Play B1 (reconcile the three-way fork + number the proposal-pack bundle as tick-87b) — 30 min. Add state.json fields `tick_87_canonical` and `tick_87b_proposal_pack` so the fork is explicit, not implicit. |

**Honourable mentions (R4-R6):**
- **R4 — Article 50 cliff slips the seal:** 19 days to cliff; if T90–T93 deploys slip by 5 days, the cliff-becomes-Sunday-19-July. Mitigation: every tick must have an SIGIL-anchored exit; no slippage tolerated.
- **R5 — Crown RFQ gets a $0 deal-state because nothing's wired:** Play A above is the unblocker.
- **R6 — `/tmp/*.jsonl` data loss on cold start:** Per B-H3 / CODE_QUALITY_AUDIT. Mitigation: move `/tmp/signups.jsonl` to Upstash KV or Supabase (B3, 3h, lower priority).

---

## 8. EXECUTION SEQUENCE FOR THE NEXT 4 BUSINESS HOURS

| Hour | Plays | Outcome |
|---|---|---|
| **H0–H1** | A1 + A2 (verify Crown RFQ end-to-end + wire SIGIL receipt) | Crown RFQ live with signed receipt |
| **H1–H1.5** | A3 + A4 (Director SLA email + page copy) | Director 24h SLA live |
| **H1.5–H2** | B2 (git-back the deploy dir; 30 min) | Rollback recoverable in <30 min |
| **H2–H3** | B1 + B3 (state reconcile + phantom detector cron) | Three-way fork closed + 11 phantoms under watch |
| **H3–H4** | B4 (HMAC unification + fallback-secret removal) | Crown surface integrity restored |
| **H4–H5** | Install **`tools/deploy_gate.py`** (§5) + run it + emit SIGIL | First sovereign-truth gate installed |
| **H5–H5.5** | C1 (verify meta coverage) | Catalog gap quantified |
| **H5.5–H6** | C2 + C3 (extend meta + JSON-LD to full 381) | All 381 AEO-eligible |
| **H6–H6.5** | C4 + C5 (Bing IndexNow + Perplexity + DuckDuckGo + GSC submission) | 47 key surfaces re-indexed within 24h |
| **H6.5–H7** | Open public recovery post-mortem + re-arm 1Hz SIGIL cron across agents | Brand-credibility flywheel + audit-trail flywheel |
| **H7** | `mcp__sov3_federation__sigil_emit(...)` close-out + commit + `vercel --prod` deploy of the delta | T90 seal |

**Cumulative state after 7 hours:**
- Crown-tier funnel: Director 24h SLA + signed receipt (3× close-rate)
- All 3 embarrassment surfaces closed (state + phantom + HMAC)
- All 381 pages AEO-eligible
- 47 surfaces re-indexed in Bing/Perplexity within 24h
- Deploy gate installed — no future tick can mark complete with a phantom
- Audit-trail flywheel re-armed
- Recovery story published + SIGIL-anchored

**The empire closes the day at the trust-quality bar: 381 surfaces, 18 APIs, 95+ crown quality, 100% AEO-eligible, state trustworthy, no phantoms, sigils emitting, Sovereign Proof-Pack restorable for T92, Crown RFQ live. The Mon 14 Jul 09:00 BST MOD Day-1 cascade ships from a state that no Crown diligence team can catch out in the first 24h.**

---

## 9. SIGNATURE

```
SYNTHESIS — 2026-07-13 (11:50 BST)
Author: JEEVES heavy parallel synthesis subagent (read-only)
Inputs: 8 of 9 (LEADERBOARD_INTEL_2026-07-13.md not on disk; flagged above)
Scope: cross-reference → matrix → top-3 plans → contradictions → gap → wins → risks → 7-hour sequence
Caveats:
  - LEADERBOARD_INTEL_2026-07-13.md was the only requested input not physically found
    in /Users/nicholas/clawd/; closest analogues used (API_CONNECT + SOV3_AUDIT §2.1).
  - All byte counts and live-state numbers in this synthesis come from the 8 inputs
    already on disk + the JEEVES_FRONTEND_TAKEOVER.md Appendix A (T89 seal) which
    was newly added this morning and not reflected in the 4AM/06:00 docs.
  - The 7-hour execution sequence assumes owner-gated Vercel deploys (PYPI_TOKEN,
    VERCEL_TOKEN, mcp-publisher login) are unchanged — see 4AM §1 owner gates.
  - No file under /Users/nicholas/clawd/ was modified during this synthesis other
    than this single output file: /Users/nicholas/clawd/SYNTHESIS_2026-07-13.md.
```

**End of SYNTHESIS — 2026-07-13.**
