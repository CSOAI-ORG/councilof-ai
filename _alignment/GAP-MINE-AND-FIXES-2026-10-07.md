# GAP MINE + WORKED FIXES — 2026-10-07 (JEEVES, mined from pod/ledgers/Downloads/live)
# Source-of-truth inputs: MEOK-MAKE-MONEY-READOUT, DEMAND-LEDGER, STATUS-mass-index, DEPLOY-BREAKGLASS,
# ALIGNMENT_2026-08-24 (fleet), SCITT-Interop-Report rev7, CPU pod audit-20261006, live curl probes.

## THE MINED GAPS (ranked by what blocks forward motion)

### G1 — SCITT DOI freeze blocked on Nick (TIME-CRITICAL, hidden gate)
- rev7 freeze pack: every named person must answer in writing before deposit (§6.6).
- Nick = named in Rows 1–3 (Vaara/Cedulon/EMILIA runs) + NC5 ruling + Item 10.
- Open ask to him: the Cedulon findings archive link is wrong; he owes the archived copy of his
  25 Aug 2026 17:31 UTC findings message + its correct permanent link.
- **FIX WORKED:** freeze-answer draft written → `docs/outreach/drafts/SCITT-FREEZE-ANSWER-DRAFT-2026-10-07.md`.
  OWNER SENDS with the archived message attached. Nothing else needed — deposit proceeds.

### G2 — The 23 Claude-Science tools are GONE (flywheel dead)
- Verified absent in 4 homes: ~/clawd/_alignment/sovereign_merge_kit (empty), pod _mac_migration
  2026-10-02+05, /workspace/_eat, ~/.claude-science. = data loss in the Oct mac-migration.
- Only partial cousins on pod: _eat/gm/scripts/{merge_me,emit_sov_signal,check_hx_plugin_sovx_convergence}.py.
- **FIX WORKED:** rebuild from the transcript spec table (present in the 16-session record): 23 tools
  with named purposes. Rebuild order (CPU-safe first): sov33_dataset_license → breadcrumbs_impl →
  dare_ties_impl → multi_merge_n_into_1 → multi_merge_eval → merge_sweep_local → cap_benchmark →
  sov33_staging_pair → sov33_reflection_loop → sov33_oversight_eye → cot_reasoning_owem →
  linear_attn_kernel → sov1_venturi → sov33_7planet_router → sov33_planet_memory_bridge →
  sov33_planet_upgrade → hetero_arch_fusion_design → sov4_owem → sov4_swarm_build_loop →
  train_new_clans (GPU-gated last) + tierbench_lite (GPU-gated). Then the e2e pipeline over them.
- GATE: CPU writer pod at load 150 — queue only, or stand up a box first (owner call).

### G3 — Promo window leak (4 DAYS LEFT, ends 2026-10-11)
- Art 50 $0.01 → $25 on 11 Oct. /pay page: x402 rails present but ZERO promo/price surfacing
  (verified live: no 0.01/promo/price text). Buyers landing today see no reason to act now.
- **FIX WORKED:** add promo band to /pay + home CTA ("$0.01 until 11 Oct, then $25") in the
  councilof-ai repo, land via the normal GHA deploy path (never master push — hard bound).
- OWNER or deploy-lane executes the PR; the copy is 10 lines.

### G4 — 4 outreach drafts unsent since Oct 3 (revenue gate)
- drafts/: CLOSE-B1-AI-TAP-form-packet (blocked on reCAPTCHA — owner browser), CLOSE-B2-CIRCLE-scope-reply,
  CLOSE-B3-SELECTHub-intro-reply, PRODUCT-HUNT-DAY-OF-KIT-2026-10-06 (STALE — the 6 Oct date passed).
- Doctrine: warm replies = draft only, owner sends. B2/B3 are 5-min sends each.
- **FIX WORKED:** PH kit marked stale (or fires as "a day late" first-comment — owner ruling); B2/B3 go out today.

### G5 — 3 branches unmerged 7 weeks on csoai-static-deploy2
- f/breach-fix-apex-llms (59dbb27a), f/scoreboard-public-names (dd5edf78), feat-work (6828a0a0,
  registry city-3d → remotes normalization = the one possibly-unique asset).
- Live site already clean (0 breach-hits) — most content superseded by the Sep naming-kill.
- **FIX WORKED:** diff registry/scoreboard bits vs current; merge-if-unique else archive branches
  with receipt. 30-min lane job.

### G6 — GPU capacity = 0
- All GPU pods dead (3090/A100s gone). Only CPU writer (load 150). G2's GPU half + any bench work homeless.
- **FIX:** owner decision — stand up 1 GPU pod (~$0.40/hr 3090-class) or authorize CPU-only slow runs.

## NOT MISSING (verified healthy — don't re-work)
- Live site: csoai.org + councilof.ai CLEAN (0 lock-hits, new title live) · agent-card.json real JSON
  · security.txt + llm-policy.txt real · deploy.yml a1-fix LANDED (L108) · break-glass closed
  · x402 rail LIVE ($0.02 settled, 1 non-self payer — honest count) · verify endpoints free forever
  · mass-index wave done (29 indexed) · first-screen/trust fixes have Playwright receipts on pod.

## EXECUTION QUEUE (per owner go)
1. SCITT freeze answer (owner sends — draft ready)
2. 23-tool rebuild batch (CPU-safe tier first) + e2e pipeline
3. /pay + home promo band PR (4-day clock)
4. B2/B3 sends (owner, 10 min total)
5. Branch debt diff + close-out (receipt)
6. GPU pod decision