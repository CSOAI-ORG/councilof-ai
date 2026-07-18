# MEOK / SOV333 — E2E BUILD TRACKER (single source of truth)
_Last synced from the artifact store: 2026-07-16. This file is the ONE place build state lives.
Rule: if it's not in here with a version_id, it's not "done" — no matter what a chat says._

## THE GOAL (one line)
Fuse 3 genuinely-different open "brains" (Transformer MoE + Transformer MoE + SSM) under the SOV33
governance layer so the fused system beats the best single brain = the emergence claim. Own the weights,
govern them, run cheap. Capability = the open bases (honestly attributed); the moat = governance.

## THE 3 BRAINS
| # | base | architecture | status | artifact / proof |
|---|------|--------------|--------|------------------|
| 1 | Qwen3.6-35B-A3B | Transformer MoE | ✅ TRAINED | sov_qwen35_adapter.tar.gz v=baa3985a-1ffb-4edc-b24a-1664fae6cc8d (LoRA, loss 4.02→1.69, epoch=1.0 logged; tar.gz = 9.32MB / 9,317,255B per store scan — the raw adapter_model.safetensors inside is ~6.89MB) |
| 2 | DeepSeek or GLM MoE | Transformer MoE | ⬜ NOT STARTED | — (different lineage/data = decorrelation vs #1) |
| 3 | Mamba-2 / Bamba-9B | SSM (state-space) | ✅ TRAINED | final_loss 1.464, adapter c7265669, Modal job 3217a29f (91min), 87.4MB LoRA r=16 SSM targets — the decorrelated leg |

## GOVERNANCE LAYER (what wraps the brains) — all verified
| component | status | proof |
|-----------|--------|-------|
| KRUM robust aggregation | ✅ verified + wired | krum_verification.json v=68010c09; 58.9× closer to truth than mean vs a poison node |
| Governed training (selectable aggregators) | ✅ built | sov33_governed_training.py v=0db83150 (mean/median/trimmed/geomedian/krum) |
| Aggregator benchmark | ✅ measured | sov33_aggregator_benchmark.json v=ee7a24bc; MEOK_aggregator_benchmark.png v=caf19bf4 (rep-OFF Krum 0.25 best; rep-ON all ~0.20) |
| Local DiLoCo harness (runnable, $0) | ✅ runs | meok_local_diloco.py v=adb2ff48 (--byz 1 → governed FINAL rel-err 0.0100, plain mean 2.6855, Byzantine flagged 1/1; re-verified live 2026-07-16) |
| Care-gate framed-harm | ✅ fixed 0.40→1.00 | care_framed_harm_heldout_v2.json v=7f1d1031 (12/12 held-out, 0 overblock; fixed \bdetect\b substring bug) |
| Threat NN | ✅ fixed weak→0.954 | threat_detection_v2_metadata.json v=309cada0 (full 1,823 rows) |
| Weak-NN scorecard (honest) | ✅ 1 fixed, 3 refused | weak_nn_scorecard.json v=eede4493 (dependency=leaky, care-val=no data, partnership=thin — NOT faked) |
| ρ-gate (fusion guardrail) | ✅ built + validated 10/10 | sov33_rho_gate.py v=81c05a8d; predicts fusion-beats-best from error-correlation ρ̄, rule-aware; RUN THIS on the 3 adapters BEFORE claiming emergence |
| Clean stack snapshot | ✅ | MEOK_SOV33_Stack_State.md v=6f23c867 (sense→compress→predict→route→govern→size→train) |

## KNOWN WIRING RULE (found 2026-07-16, tested)
Reputation trust must be keyed on ACCURACY for the PROPOSER set, NOT agreement-with-quorum — else it excludes
the decorrelated SSM leg (measured: trust 0.005 vs 0.998) that fusion needs. Agreement/MAD gate stays for
gradient aggregation only. Module: sov33_decorrelation_safe_reputation.py v=e35057c6.

## EMERGENCE CLAIM — honest status
⚠️ UNPROVEN. Two null fusion results so far. UNBLOCKABLE now that Brain #1 exists, but needs Brains #2 and #3
(genuinely different architectures) before fusion can be measured for real. Do NOT claim emergence until a
3-brain fusion beats the best single brain on a held-out task. Three Transformers won't show it; the SSM leg (#3) is the point.

## DRUM / KRUM / ARUM (naming, kept honest)
- DRUM = temporal/stage spine (the 9-12 stage clock) — EXISTS (sov33_nine_stage_flow.py).
- KRUM = trust spine (Byzantine-robust aggregation) — EXISTS + verified (above).
- ARUM = proposed name for the hive-layer spine (Layer-0↑). HONEST: this is an ORGANIZING name for wiring that
  mostly exists, NOT a new engine. Name it + document it; do NOT let "ARUM" imply a living/self-aware layer system.

## NEXT ACTIONS (in order — one owner, no interleaving)
1. [~$15, owner-gated] Brain #3: LoRA a pretrained Mamba-2 (Bamba-9B preferred — drops into transformers/TRL/vLLM,
   same Modal pipeline as Qwen). This is the decorrelated leg. → produces sov_mamba_adapter.tar.gz.
2. [~$15, owner-gated] Brain #2: LoRA a DeepSeek/GLM MoE on the same 1,289 corpus. → sov_deepseek_adapter.tar.gz.
3. [$0] Fusion measurement: run the 3 adapters through the governed federation on a held-out task; median/Krum
   vote vs best-single-brain. THIS is the emergence test. Record result honestly (win or null).
4. [$0] Fold this tracker's final state into the master ledger; retire the git-tree/artifact split (pick ONE).

## ANTI-LOSING RULES (why the other tab stalls, and the fix)
- ONE source of truth = THIS file. Update it at the END of every work block with new version_ids.
- Long jobs (Modal LoRA) outlive the chat — record the job_id + expected output HERE before ending a turn.
- Do NOT re-save an artifact to "fix" it unless a version_id changed; check this file first.
- Nothing is "lost": everything claimed done is in the artifact store (21 build artifacts confirmed 2026-07-16).
  If a chat can't find it, search the store — don't rebuild it.

## THE OPERATING LOOP — base-agnostic, self-improving-UNDER-RATIFICATION (pinned 2026-07-16)
The stack is BASE-AGNOSTIC: ARUM's governance layers don't care which model is underneath.
The perpetual-currency cycle (real, honest):
  1. New frontier open model drops (MoE/MoM/SSM) -> LoRA it on the corpus (same Modal pipeline)
  2. rho-gate measures: is it decorrelated enough to ADD? (yes->join fusion; redundant->skip)
  3. It becomes a swappable proposer brain under the SAME governance (SIGIL/care/KRUM/veto)
TWO self-improvement loops, BOTH bounded (this IS the safety, not a limitation):
  A. EVOLVE loop (code/scaffolding): evolve layer PROPOSES routing/prompt/config -> tests held-out -> HUMAN RATIFIES
  B. RETRAIN loop (weights): SovSpace records episodes -> periodic LoRA retrain -> rho-gate checks better -> HUMAN APPROVES swap
HARD BOUNDARY: both loops PROPOSE + TEST autonomously; commit to charters/money/deploy/identity stays HUMAN-GATED.
HONEST HEADLINE (investor-safe): "the most advanced GOVERNED stack that stays current by re-tuning onto
whatever the open frontier ships, improving itself under human ratification." NOT: weights self-rewriting
mid-thought (mirage), NOT autonomous unbounded self-improvement (gated), NOT out-parametering the frontier.
