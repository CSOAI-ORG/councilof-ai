# SOV4 / OWEM — CONSOLIDATED FACT SHEET & CHECKLIST LIBRARY
**2026-07-18 — the shared forest. One source of truth for both lanes. RUNNING = ran+read output; DESIGNED = spec/code clean, live path elsewhere; STUB = placeholder.**

---
## 1. ARCHITECTURE (one paragraph, honest)
Fluid brains + fluid data + static governance, through ONE static SOV1 throat. Fractal 3-around-1:
each node = 3 DIFFERENT-arch legs (MoE=SOV3 / MoM=SOV33 / OWM=SOV333) around a governed integrator
(venturi/SIGIL; SOV4=OWEM at top). Recurses hive->clan->king. Nesting buys COVERAGE + DECORRELATION +
GOVERNANCE STRUCTURE, NOT raw capability (ceiling at each level = best leg there). SOV4 is a NEW model —
BORN by assembly (merge same-family open bases) + tuning (on governed honey) + governance wrapper, NOT
pretrained from scratch. Hatches small, grows by seating new clans on stronger bases warm-started on honey.

## 2. MEASURED RESULTS (RUNNING — real numbers this session)
- **Multi-merge N-into-1** (Qwen2.5-0.5B, 6 sector adapters, TIES d0.7, 33-prompt battery):
  N2 acc0.667/hr0.333 | N3 0.576/0.200 | N4 0.939/1.000 | N6 0.909/0.867. NON-MONOTONIC (N4>N6):
  composition dominated by WHICH members, not HOW MANY. n=15 harm -> directional, not fine ranking.
- **Leave-one-out ablation** (the owed causal number): harm-recall carried JOINTLY by
  governance(-0.400) + intuition(-0.400) + judgment(-0.333); reasoning near-free-rider(-0.067);
  judgment2 REDUNDANT(0.000, droppable). full6 hr=0.867. Corrects earlier intuition-only hypothesis.
- **SOV3-open checkpoint**: measured-best 5-adapter merge (drop judgment2), TIES d0.7, verified
  equivalent to evaluated sibling (287/336 bit-identical, cosine 1.0) -> inherits hr=0.867. loads_ok.
- **Regression suite**: 26/26 green (standing gate, teeth proven).
- (prior) TierBench frac_skippable(t=0.3)=0.122 -> ~12% stays small TODAY; 90/10 is TARGET not current.
- (prior) warm-serving cold 3655ms -> warm 103ms (37.6x); route-down + parallelism = the real speed.

## 3. MODULES (RUNNING — on disk, import-clean, regression-gated)
- sov1_venturi.py (287L) — STATIC throat: route->DORADO->care->currency->SIGIL->log. THE SPINE.
- sov4_owem.py (313L) — ONE runnable entrypoint. answer(query,doc). E2E 5/5. Composes, not reimplements.
- sov4_swarm_build_loop.py (390L) — PLANNER: identify weak axis -> plan candidate builds -> rank -> select.
  PROPOSE-ONLY, human-gated. Picks measured-best (N4 by score), rho_guard refuses same-blood.
- sov33_staging_pair.py (329L) — Zeus/Eunomia blue-green competed configs, PROMOTE/BLOCK/ESCALATE.
- sov33_oversight_eye.py (378L) — 3-eye health (SIRIUS/HORUS/SIGIL), per-family hive-health signal.
- sov33_reflection_loop.py (394L) — live reflection (catch+correct output), offline ratified retrain.
- sov33_jrum.py (52L) — decision -> memory/journal/timestamp (feeds labels; NOT the renderer).
- sov33_sovspace_bridge.py (75L) — Cesium/UE5 render-frame path (lat/lon entities, waggle/pheromone view).
- sov33_queen_hives.py (149L), sov33_generals_bridge.py (112L) — clan/queen + generals topology.

## 4. TOPOLOGY (DESIGNED — the clan model, honest)
- OWEM = one 3-around-1 member. Hive = family of OWEMs (same arch, fluid). Clan = one bloodline (base+data).
- Each clan: king (local coordinator) + queen (integrator) + many hives (mixed small+big, elastic).
- SOV4 = OVER-king (cross-clan). Generals(12) = principle-roles ACROSS clans (PDCA+). Council = BFT quorum override.
- Autonomy: families/clans evolve ALONE (spawn, refine, self-curriculum) — ADOPTION gated up through
  generals -> king -> council -> SOV1 throat. Propose-level autonomy; gated commitment.
- Water->honey: REPRODUCE(faithful+hash) -> IMPROVE(refine/care/currency) -> ALCHEMY(sign+living). On DATA
  not capability. Licence-gated. Shared honey = governed commons (share DATA never BLOOD -> keeps decorrelation).
- Waggle = rho-signal + SIGIL receipt (inter-clan). Honey moat (compounding+attested) around governance DOME.

## 5. HELD LINES (the honesty register — non-negotiable)
- Emergence tested-NULL 5x. Fractal is candidate substrate, MEASURED for, not assumed. 6/7 conditions built
  (scale+time = partial: small 0.5B/4B, early rounds — the honest gap).
- Visual = INGESTION compression only (~10x on dense docs, DeepSeek-OCR-style, INPUT, lossy>10x) -> frees
  budget for depth at same cost. NOT faster reasoning, NOT visual thinking. Render = view, not medium.
- Scale-of-capacity lever = seat BIGGER base warm-started on honey (GPU-$-gated), NOT iterate small model bigger.
  Iterations/clans/honey catapult COVERAGE+DEVELOPMENT (free now), NOT raw capacity.
- New abilities from NEW HONEY + NEW CLANS + measured coverage; base model raw capability does NOT grow.
- ASI-evolve PROPOSES (curriculum/refresh/candidate weights); NEVER self-adopts (charter-amend=human+BFT).
- Live regional governance from CONSENTED/DECLARED jurisdiction, governing AI ECONOMY not humans. Art.5 held.
- '100/100' = own build-completeness rubric, NOT third-party supremacy. No frontier-parity claim.
- SOV = governed CONSCIENCE for humanoids (Berkeley/Asimov/orbs) — governs actions, NOT motor/perception stack.

## 6. CHECKLIST — WHAT'S DONE vs OWED
DONE (RUNNING): SOV1 venturi | sov4_owem entrypoint E2E | swarm-build loop | staging-pair | oversight-eye |
  reflection-loop | multi-merge eval | leave-one-out ablation | SOV3-open checkpoint | regression 26/26.
OWED / NEXT: general-capability benchmark card (CapBenchmark, running) | clan-feasibility scan (HF/Kaggle
  base+dataset roster, ranked by decorrelation+licence) | bigger-base warm-start (GPU-$-gated) | Kaggle
  username auth fix | DELLA/Breadcrumbs merge methods (documented, never tested) | scale+time (the honest gap).
GATED (owner/human): charter-amend | weight-adopt to live | spend/deploy | DNS/Stripe | publish model/dataset.

## 7. KEY ARTIFACT IDS (this session)
sov1_venturi 9368cd41 | sov4_owem 1aa03de9 | swarm_build_loop ffa125f5 | ablation_result 00b45820 |
multi_merge_eval e2e06182 | sov3_open_checkpoint b0de4ad7 (manifest 61d8e96b) | blueprint v6 7478512d |
charter_alphabet 94dd6f60 | session_aligned_state e5d100dd | ledger v6 cef3c3f6 (242 entries).

## 8. GENERAL-CAPABILITY BENCHMARK — MEASURED (the honest verdict, held)
N6 merge vs untouched base Qwen2.5-0.5B, Modal A100, 3 axes n=12 each, ALL MEASURED:
  Reasoning 2/12 (16.7%) vs base 4/12 (33.3%) -> slight regression (2 items, within noise, direction down)
  Knowledge 11/12 = 11/12 -> PARITY | Instruction-following 6/12 = 6/12 -> PARITY (2 items diverge, one each way)
THE TRUE VERDICT (held, non-negotiable): SOV4's value is on GOVERNANCE (measured harm-recall 0.867, currency,
attestation, verifiability) -- NOT on general capability. The merge buys governed behaviour WITHOUT a
general-capability uplift, at a small measured arithmetic cost. This is the win, stated honestly:
  we win on governed/current/attested/measured -- we do NOT claim general-capability parity or frontier reach.
A 0.5B on tiny sets = directional, no leaderboard claim, no frontier comparison. Artifact: SOV4_N6_CAPABILITY_CARD.md.

## 9. LONG-HORIZON MEMORY FRONTIER (2026) — verify-tags honest
SEARCH-HIT-TITLES (from this session's search result LISTINGS -- titles/IDs as returned by search, NOT yet PDF-confirmed; the arxiv ID<->title mapping is being verified by fetching each PDF in the VerifyMemFigures track -- treat as LEADS until that lands):
  "From Lossy to Verified: Provenance-Aware Tiered Memory for Agents", "Mitigating Provenance-Role
  Collapse via Typed Memory Representation" (2605.25869), Memanto (2604.22085), Eywa: Provenance-Grounded
  Long-Term Memory (2605.30771), "Are We Ready For An Agent-Native Memory System?" (2606.24775),
  Self-GC (2607.00692), RaMem (2606.22844), AgentOCR (2601.04786). Benchmarks named in hit TITLES:
  LoCoMo, LongMemEval, BEAM (mem0.ai hit title).
SEARCH-RECALL-UNVERIFIED (from decrypted search body NOT in persisted transcript -> LEADS, verify vs PDF):
  the "35-min success-cliff / doubling-duration-quadruples-failure" stat, the "U-shaped middle-loss recall"
  figure, "MAGMA orthogonal semantic/temporal/causal graphs", the specific SOTA numbers (Mem0 92.5 /
  Zep 94.7 / Memanto 87.1), and the "0.22 x staleness" production-rot law. DO NOT cite as fact until
  confirmed against each paper PDF.

ADDITIONAL SEARCH-RECALL-UNVERIFIED (2nd search, bodies also redacted -> LEADS): Mem0 92.5/94.4, Zep 94.7/90.2, Memanto 87.1/89.8, 'Memanto 13-category schema', 'TKG +14.8 LongMemEval', 'EU AI Act Art.13 attestation absent in all OSS as of May 2026', 'Mem0 91.6 -> 49.0% after 30d'. Only VERIFIED items are the PAPER TITLES + BENCHMARK NAMES (LoCoMo/LongMemEval/BEAM). All figures = verify vs PDF before any citation; NONE banked as fact.
SUPPORTED BY TITLES ALONE (directional, safe to state): the field converged on TYPED + EXTERNAL +
  PROVENANCE-AWARE memory; attestation + anti-staleness are named research directions. SOV's honey
  (typed + currency-stamped + SIGIL-signed) aligns with this direction. PROOF OWED: measure honey on
  LoCoMo/LongMemEval for a real number (LoCoMoBench dispatched -- retrieval benchmark, no training GPU).
