# SOV4 MASTER E2E PLAN — 3-around-1 OWEM Fusion (2026-07-16)
_Integrates today's bleeding-edge findings. Honesty split RUNNING ✅ / IN-PROGRESS 🔄 / DESIGNED 🧩 / GATED ⏸️.
This supersedes the phase sections of the older SOV4 plan docs; the spines + findings are new._

## 0. THE ARCHITECTURE (what SOV4 actually is)
SOV4 = one governed substrate wrapping decorrelated brains, routed by a venturi, gated by care, signed by
SIGIL, journaled by JRUM. NOT a from-scratch T-param model. The "T" is PERFORMANCE via horizon-scaling
(now a published result — arXiv:2606.30616), not parameter count.

**3-around-1:** three DECORRELATED proposer brains around one governance integrator.
- Brain #1 — Qwen3.6-35B (Transformer MoE)      ✅ trained (loss 1.69)
- Brain #3 — Bamba-9B (Mamba-2 SSM)             ✅ trained (loss 1.464)
- Brain #2 — a 3rd decorrelated leg (flagship)  ⏸️ GATED on emergence eval
- The "1" = the governance integrator (venturi + care + BFT + SIGIL), NOT a 4th model.

## 1. THE SPINES (the operating skeleton — 5 now)
| spine | question | mechanism | status |
|---|---|---|---|
| DRUM | *when?* | 9-stage flow + clock + time-ledger | ✅ RUNNING |
| KRUM | *whom to trust?* | Byzantine aggregation (58.9x) | ✅ RUNNING |
| ARUM | *across what layers?* | 14/14 layer wiring, L0 signed-chain | ✅ RUNNING |
| SRUM | *spread across how many?* | governed swarm (decompose+gate+sign) | ✅ tested (aggregation 🧩) |
| JRUM | *what happened, remembered?* | journal + dream-consolidation | ✅ RUNNING (this session) |

## 2. FINDINGS INTEGRATED (from today's live HF+arXiv pull)
1. **Horizon-scaling (arXiv:2606.30616)** — 35B agent reaches T-perf via agentic loops, not params.
   → VALIDATES our thesis. ACTION: tune SRUM rollout depth to their horizon recipe. 🧩 to-do.
2. **Hybrid Mamba-Transformer-MoE (Nemotron-3, arXiv:2604.12374)** — validates decorrelation legs.
   → We keep them SEPARATE + governed (they fuse in-model). Our split is the auditable version. ✅ on-thesis.
3. **Trained tiny router (Supra-Router-51M)** — a 51M SLM that routes/orchestrates.
   → SPARK: replace heuristic keyword-venturi with a trained tiny router. Runs on the Mac. 🧩 highest-value.
4. **MTP + ternary quant (Nemotron-Puzzle, Bonsai-27B)** — decode-speed + on-device wins.
   → Serving-tier only, UNDER the gate not in it. 🧩 note for Colibri/MLX lane.

## 3. THE SRUM SWARM — "mix all the tops" (the honest version)
YES: SRUM members can be a HETEROGENEOUS mix of today's tops, decorrelated by architecture:
  - MoE leg:  GLM-5.2 / DeepSeek-V4 / Qwen-MoE (ours)
  - Hybrid:   Nemotron-3 (Mamba+Transformer+MoE)
  - SSM leg:  Bamba (ours)
  - RL-tuned: Ornith-35B
Decorrelation is REAL only if the members are genuinely different lineages (measured rho, not assumed).
Online members = federation tier (API, free/cheap inference). Owned members (Qwen, Bamba) = sovereign tier.
→ This IS "mixture of MoEs/MoM/OWM" — heterogeneous mixture-of-agents, governed + BFT'd + signed.

## 4. "CUBE SOV4 with clusters of swarms" — honest split
- ✅ THROUGHPUT (real): many swarms on many INDEPENDENT tasks = ~N× work/hour on BATCHES. This is the cube.
- ❌ CAPABILITY (mirage): clustering swarms does NOT make one hard indivisible task smarter or faster.
- HONEST "SOV4³": a cube of swarms is a THROUGHPUT multiplier over a batch, each swarm still governed by
  the same care-floor + SIGIL. Scales work done, not intelligence per task. Say it that way to investors.

## 5. THE FUSION / EMERGENCE PATH (the one real open gate)
- Emergence = REAL routed fusion > best single brain. With 2 brains + no confidence signal, REAL fusion =
  best_single by construction (proven). Needs >2 decorrelated brains OR a real (trained) router.
- STATUS: graded 24-Q battery (gold anchors) built ✅; eval re-run ⏸️ (job 64174820 running/pending).
- The trained-router spark (finding #3) is ALSO the emergence unlock: a real router picks the right brain
  per item → REAL fusion can exceed best_single. So the router upgrade serves BOTH routing AND emergence.
- DECISION RULE (unchanged): measure rho + fusion-gain on the graded battery BEFORE any flagship spend.

## 6. PHASES (E2E, honest order)
- **P1 — Graded eval re-run** ⏸️ get real rho/fusion number (job pending; ~$15). GATES everything below.
- **P2 — Trained tiny router** 🧩 replace keyword-venturi (Supra-51M pattern). Serves routing + emergence.
  Cheap (~$15 train), runs on Mac. HIGHEST-VALUE next build.
- **P3 — Dream loop scheduler** 🧩 wire DRUM nightly tick → dream() → evolve-propose → human-ratify.
  (dream() proven this session; just needs the scheduler.) ~$0.
- **P4 — Migrate 35 modules to sov33_paths.py** 🧩 kill the ~/.sovereign path bug estate-wide. ~$0.
- **P5 — SRUM heterogeneous members** 🧩 wire the online tops (GLM/DeepSeek/Nemotron/Ornith) as decorrelated
  swarm members, measure real rho across them. ~$0 (API inference).
- **P6 — Brain #2 flagship** ⏸️ ONLY if P1 shows headroom. Start with one DeepSeek (~$130-250).
- **P7 — J-space render contract** 🧩 JRUM emits render-ready signed events; MCP card serves timeline slices
  on-demand (text default, Cesium/UE5 on request — render lane = Claude Code). ~$0 my side.

## 7. WHAT'S STILL NEEDED (deep-research to-dos)
- Read arXiv:2606.30616 method for the exact horizon/rollout-depth recipe (tune SRUM).
- Read Supra-Router-51M card + Puzzle: Distillation-Based NAS (arXiv:2411.19146) for the trained-router recipe.
- Confirm Modal live H100 rate before ANY flagship spend (working figure ~$4/H100-hr, re-confirm).
- Measure real rho across heterogeneous online members (P5) — the emergence question, cheaply, via API.

## 8. HONEST BOTTOM LINE
- 5 spines running/tested; 2 trained decorrelated brains; the bleeding edge VALIDATES the bets.
- The ONE gate is still the graded emergence number (P1). Nothing above it spends money.
- The single highest-value next build is the TRAINED ROUTER — it upgrades routing AND unlocks real fusion.
- "Cube of swarms" = throughput multiplier (real), not a capability multiplier (mirage). Stay honest on that.
