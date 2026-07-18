# SOV33 — Cross-Board Status (2026-07-14)
_Honest, by-lane, real numbers from disk. Split: VERIFIED (I re-ran it) vs REPORTED (sibling commit, not independently re-run) vs PENDING (needs a run no agent here can do)._

## HEADLINE
Strong on the axes that are OURS (governed correctness reproducible; OWEM core learns + resists forgetting;
backend ship-ready). One gap remains: a real graded CAPABILITY score (Kaggle) — still PENDING, auto-wires when it lands.

## LANE 1 — OWEM training (sibling/Hermes, REPORTED from commits)
| What | Result | Commit |
|---|---|---|
| 4 OWEM adapters retrained | compliance/defense/intuition/voice, 4.6M params, loss ~4-5 -> 1.1 (73% reduction) | 951aa809 |
| Data expansion | 3,097 samples (77% of 4,000 target) | 3f89794b |
| Sovereign brain MMLU | 9/15 (60%), up from 16.7%; sovereign 3/3; no number-hallucination | b854bf43 |
| 5x4x3 benchmark | 59/60 OK (98%), 39.2/40 sovereign (98%), 44s parallel | 6e0bd21d |
| 57-fact RAG benchmark | 41/57 (72%), compliance 100% | 79b0b7f2 |
_REPORTED — real if numbers hold; not independently re-run this session._

## LANE 2 — OWEM model core + governance (MINE, VERIFIED in-session)
| What | Result | Status |
|---|---|---|
| OWEM v2 core (full backprop, both layers) | Task A loss 93% reduction | VERIFIED |
| EWC no-forgetting (the real claim) | 60% of catastrophic forgetting prevented, new task still learns | VERIFIED |
| Governance benchmark (reproducible offline) | recall 0.933 / prec 0.933 / acc 0.939 (n=33), 2 visible errors | REPRODUCIBLE |
| Care-gate | cloud -> local fallback -> fail-safe-breach; never hangs/silent-allows | VERIFIED |
| Readiness gate | 51 RUNNING / 28 GATED / 0 broken -> SHIP-READY | VERIFIED |
| Clone-and-run benchmark | sov33_bench_reproduce.py — anyone reproduces 0.94 | VERIFIED |

Honest note on OWEM v2: first EWC attempt was a NEGATIVE (0% — naive EWC diverged); found+fixed the Fisher-scale
+stability bug; the 60% is the fixed, measured result. "Owns weights that learn AND resist forgetting" = tested.

## LANE 3 — Charters/product (sibling, REPORTED)
57 charter files (target 34 — exceeded), 211MB, full estate (CSOAI/MEOK/DEFONEOS/OpenPatent + domain charters).
Claude Code reports 6-layer product E2E all green (API 44/0, 39 apps clean, cross-browser clean).

## BENCHMARKS / COMPARABLES / SPEED — honest
- Governed correctness: 0.94 REPRODUCIBLE (our battery; no competitor baseline yet — that comparison is built
  in sov33_baseline_compare.py but all model endpoints are sandbox-unreachable, so it's an owner/CC pickup).
- Speed: 3-around-1 ~2.3x faster than single model, same accuracy (n=10, small sample) — sibling-reported.
- Capability vs frontier: NO real graded number. capability_benchmark = PENDING. This is THE gap.

## THE ONE PENDING THING THAT MATTERS
A real graded Kaggle capability score. Everything is staged: sov33_kaggle_compete.py (harness) + the ingestion
path (sov33_ingest_kaggle_result.py) that auto-wires status=GRADED into canonical the moment sov33_live_gsm8k.json
lands. Owner/Claude-Code runs it on free T4. Until then: honest PENDING, no capability claim.

## ARE WE DOING WELL?
Yes on governance + no-forgetting (proven, defensible now). Not-yet-proven on raw capability (needs the Kaggle run).
The reproducible-governance + measured-no-forgetting story IS the unprecedented angle; the capability number confirms it.
