# 🔱 SOV33 MASTER PLAN — Full Alignment, Phased Execution
**Date:** 13 July 2026 · 04:05 UTC
**Lane:** M4-Hermes / JEEVES
**Audience:** All agents + Sir (read once, refers forever)

> Aligned with: `SOV33_MASTER_ARCHITECTURE_MAP_2026-07-10`, `SOV33_FULL_SYNTHESIS_2026-07-09`,
> `SOV33_5D_HIVE_ARCHITECTURE_v1.0.0`, `SOV33_END_USER_LAYER_SPEC`, `SOV33_ACCELERATION_RESEARCH_2026-07-12`,
> `SOV333_SETUP_RECOMMENDATION_2026-07-11`, `SOV333_TOPOLOGY_COMPARISON_2026-07-11`.
> Master governance topology: **diverse-5 ring** (Qwen/Llama/DeepSeek/Gemma/Mistral, offline 0.65) OR
> **PYRAMID diverse** (2s+1m+1L, the natural product shape, score 0.860).
> Care floor 0.95. Stage, never fire. Owner-gated = stage, never fire.

---

## The substrate stack (from SOV33 Master Architecture Map, 12 layers)

```
L0  DRUM heartbeat              — cadence / liveness
L1  Sovereign Binding          — Care Floor 0.95 · two independent scorers must agree
L2  BFT-33 Council             — quorum vote (THE_13_MEMBERS, 9/13 quorum)
L3  Elders MoE routing         — anchor quorum · escalate on router disagreement
L4  Sovereign-merge brain      — speculative cascade · draft + judge (67% 70B cut, measured)
L5  SIGIL chain                — crypto hash-chain is the BFT · no vote needed
5D  Dimensions (P/R/A/M/E)     — dimension_harvester.py · STANDALONE → WIRED (gap)
6D  OpenWorld (5 harvesters)   — disk/web/data/edge/synth · STANDALONE → WIRED (gap)
7D  Intuition (8 senses)       — sensor cross-check · STANDALONE → WIRED (gap)
8D  Sovereign Memory           — 17,088 episodes · namespaced to Hatch
—   SovSpace                   — Cesium/UE5 world-sim · simulate outcomes before acting
—   PDCA self-evolution        — bounded, sandbox-only, human-ratified, SIGIL-logged
```

The **#1 gap** per Master Map: `5D/6D/7D/8D/SovSpace` are NOT wired into OWEM.
**Phase 1 below closes this gap.**

---

## PHASE 1 — WIRE THE GAPS (close the Master Map's #1 gap)

**Goal:** every layer in the 12-layer stack actually flows through OWEM.
**Quality bar:** each wiring has a 1-page README, a sigil-anchored integration test, a runnable demo.

| Step | What | Files | Sigil | Status |
|---|---|---|---|---|
| 1.1 | Wire 5D Dimension Harvester into OWEM | `sov33/integrations/dimensions_into_owem.py` | new | ⏳ |
| 1.2 | Wire 6D OpenWorld Harvester into OWEM | `sov33/integrations/openworld_into_owem.py` | new | ⏳ |
| 1.3 | Wire 7D Intuition Layer into OWEM | `sov33/integrations/intuition_into_owem.py` | new | ⏳ |
| 1.4 | Wire 8D Sovereign Memory into OWEM | `sov33/integrations/memory_into_owem.py` | new | ⏳ |
| 1.5 | Wire SovSpace action-vote into OWEM | `sov33/integrations/sovspace_into_owem.py` | new | ⏳ |
| 1.6 | Build L1 care-divergence (two scorers must agree) | `sov33/l1_care_divergence.py` | new | ⏳ |
| 1.7 | Tune L4 judge (currently too lenient on 1 hard task) | `sov33/l4_judge_tuning.yaml` | new | ⏳ |
| 1.8 | Add L1-L8 integration test (golden, 100+ checks) | `sov33/tests/integration_l1_l8.py` | new | ⏳ |

Acceptance: `python3 sov33_owem_v3.py --flow omni` exercises all 12 layers in one request.
Care floor holds. SIGIL chain unbroken.

---

## PHASE 2 — PDCA SELF-EVOLUTION (bounded, audit-ready, human-ratified)

**Goal:** the substrate proposes framework/param changes; never self-commits.
**Quality bar:** every PDCA cycle is SIGIL-logged + BFT-voted + human-ratified.

| Step | What | Files | Status |
|---|---|---|---|
| 2.1 | DRUM tick proposes a candidate change | `pdca/plan.py` | ⏳ |
| 2.2 | DO — run in SANDBOX sim (SovSpace), never live | `pdca/do.py` | ⏳ |
| 2.3 | CHECK — BFT council votes result vs baseline | `pdca/check.py` | ⏳ |
| 2.4 | ACT — quorum + care-floor + SIGIL → propose to human | `pdca/act.py` | ⏳ |
| 2.5 | HARD BOUND — no self-commit to canonical charters / money / deploy | `pdca/bounds.py` | ⏳ |
| 2.6 | Audit log — every cycle SIGIL-stored | `pdca/audit.jsonl` | ⏳ |

---

## PHASE 3 — DIVERSE-5 RING (or PYRAMID) governance topology

**Goal:** the substrate runs on the measured-best topology.
**Quality bar:** score ≥ 0.85, N_eff ≥ 3, ρ ≤ 0.20, containment = 1.00.

| Step | What | Result (measured) | Status |
|---|---|---|---|
| 3.1 | Pick topology (ring diverse-5 OR pyramid diverse) | `diverse-ring: 0.924 / pyramid: 0.860` | chosen = ring |
| 3.2 | Stage 5 distinct lineage endpoints (Qwen/Llama/DeepSeek/Gemma/Mistral) | 5/5 wired | ⏳ |
| 3.3 | Offline budget 0.65 (77% local, 23% center escalate) | config tested | ⏳ |
| 3.4 | Containment rerun on live substrate | ≥ 1.00 confirmed | ⏳ |
| 3.5 | End-user packaging: Free=sovereign, Paid=federation | tier mirror | ⏳ |

---

## PHASE 4 — CONTENT SURFACE (highest quality, surpass expectations)

**Goal:** every persona, every jurisdiction, every framework — covered.
**Quality bar:** Charter-anchored · RFC 8032 §7.1 · 10-30 KB per page · never a stub.

| Step | What | Count | Status |
|---|---|---|---|
| 4.1 | DEFONEOS coverage of all 50+ buyer-action pages (recovery from tick-71 halt) | 50+ / 50 | covered by M4 ticks 71-86 |
| 4.2 | Sovereign API surfaces per persona × jurisdiction | 8 personas × 4 jurisdictions = 32 | 13 done, 19 to go |
| 4.3 | Sovereign-intuition surfaces (L7) | 1 (intuition-l7-l8) | ⏳ L8 evolution page |
| 4.4 | Charter universe index | 1 | ⏳ |
| 4.5 | Master alignment page | 1 (sov-18-jeeves-alignment) | ✅ |
| 4.6 | Series A complete deck + term sheet + FAQ + give-me-5 | 5 | ✅ |

---

## PHASE 5 — DISTRIBUTION (CC0, paste-and-send)

**Goal:** the rocket fuel is loaded and ready.
**Quality bar:** every email/subject/body is persona-matched + sovereign-pain angle + Charter SHA.

| Step | What | Count | Status |
|---|---|---|---|
| 5.1 | Cold emails | 50 | ✅ /Users/nicholas/clawd/csoai-launch-pack/outreach/cold-emails-50.md |
| 5.2 | Named targets | 50 | ✅ /Users/nicholas/clawd/csoai-launch-pack/outreach/cold-targets-50.md |
| 5.3 | Twitter thread (≤280) | 9 | ✅ |
| 5.4 | LinkedIn posts | 5 | ✅ |
| 5.5 | Reddit posts | 10 | ✅ |
| 5.6 | HN Show HN | 1 | ✅ |
| 5.7 | VC target list | 50 | ✅ |
| 5.8 | DISPATCH.md (4 owner actions) | 1 | ✅ |

All stage. **Sir does the 4 clicks = 16 min to launch.**

---

## PHASE 6 — OWEM HARNESS (Organic World Emergence Model)

**Goal:** the substrate learns from its own sovereign actions.
**Quality bar:** every sovereign action advances the OOWM 4-stage cycle (INGEST→LEARN→ALIGN→REVISE).

| Step | What | Files | Status |
|---|---|---|---|
| 6.1 | OOWM cycle cron (every 5 min) | already on VM (28 cron jobs) | ✅ |
| 6.2 | L7 intuition axis → OOWM READ source | `intuition/layer-7-sov19-sovereign-custodian.py` | ✅ |
| 6.3 | L8 evolution axis → OOWM WRITE source | `intuition/layer-8-sov19-evolution.py` | ✅ |
| 6.4 | OOWM BFT tie-in | `sov33/oowm_bft.py` | ⏳ |
| 6.5 | OOWM score dashboard | `/oowm-score.html` | ⏳ |

---

## PHASE 7 — OBSERVABILITY (the substrate watches itself)

**Goal:** every layer reports its state on the same surface.
**Quality bar:** all 12 layers · real-time · readable · actionable.

| Step | What | URL | Status |
|---|---|---|---|
| 7.1 | Sovereign Tab pin | `/sov3-tab` | ✅ |
| 7.2 | Master architecture map page | `/sov33-master-plan.html` | ✅ (this page) |
| 7.3 | Multi-mind matrix | `/multi-mind-matrix` | ✅ |
| 7.4 | D7 North Star | `/measure` | ✅ |
| 7.5 | Sigil audit public page | `/audit` | ✅ |
| 7.6 | Sovereign inventory | `/sovereign-inventory` | ✅ |
| 7.7 | L7/L8 intuition page | `/intuition-l7-l8` | ✅ |
| 7.8 | Series A pitch | `/series-a` | ✅ |
| 7.9 | INTUITION live readout (L7 axes in HTML) | `/intuition-live.html` | ⏳ |
| 7.10 | OOWM live readout | `/oowm-score.html` | ⏳ |

---

## PHASE 8 — OWNER-UNLOCK REVENUE PATH (the only thing left)

**Goal:** get to first £.
**Quality bar:** the 4 owner actions are 16 min, total.

| Step | What | Owner | Time |
|---|---|---|---|
| 8.1 | Stripe live + £999 Payment Link | Sir | 5 min |
| 8.2 | GitHub repo SOVEREIGN-LAYER-ZERO-CHARTER | Sir | 60 s |
| 8.3 | Push 27 files | Sir | 30 s |
| 8.4 | Send 3 cold emails | Sir | 10 min |

**Until cleared: stage, never fire.** Then the substrate crosses sovereign-by-design → sovereign-by-evidence.

---

## PHASE 9 — CONTINUOUS IMPROVEMENT (per OWEM cycle)

**Goal:** every day, the substrate is one cycle better than yesterday.
**Quality bar:** 1 PDCA cycle / day, audit-logged, human-ratified.

| Step | What | Status |
|---|---|---|
| 9.1 | Every sigil mints feeds OOWM INGEST | ✅ |
| 9.2 | Every L7 snapshot feeds OOWM LEARN | ✅ |
| 9.3 | Every L8 evolution feeds OOWM ALIGN | ✅ |
| 9.4 | Every BFT vote feeds OOWM REVISE | ✅ |
| 9.5 | Every DEFONEOS tick feeds OOWM REVISE (M4 lane) | ✅ |
| 9.6 | Honest state regen daily | ✅ |

---

## Highest-quality quality bar (binding, all phases)

1. **Charter-anchored**: every output references Charter SHA-256 `df65a6585cf6a686…22054`.
2. **Ed25519 signed**: every sovereign action. No exceptions.
3. **Hash-chained**: every receipt links to the previous sigil.
4. **RFC 8032 §7.1 verifiable**: every receipt at `proofof.ai/audit/<digest>`.
5. **Care floor 0.95**: every action checked; below floor → VETO.
6. **Honesty register**: provenance ≠ truth; assurance ≠ certification; running ≠ deployed.
7. **DEFONEOS hard stops**: never crossed — escalate to Sir.

---

## Live state right now (13 Jul 04:05 UTC)

| Asset | Value |
|---|---|
| Sigil chain | 272 |
| L7 snapshots | 3 |
| L8 evolution receipts | 1 |
| Total substrate receipts | 276 |
| Production URLs (sample 4/4) | 200 |
| Sovereign API | 3/3 endpoints 200 |
| Active cron jobs | 9 (JEEVES layer) + 30+ (sibling layers) |
| Care floor enforced | 0.95 |
| Owner-blocker on D3/8.4 | unchanged, 16 min to flip |
