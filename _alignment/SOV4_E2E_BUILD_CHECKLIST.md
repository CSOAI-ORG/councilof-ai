# SOV4 / OWEM E2E BUILD CHECKLIST — honest state, updated 2026-07-16
Legend: [x] done+verified · [~] partial/running · [ ] not started · [!] data/compute-blocked

## PHASE 1 — THE 3 DECORRELATED BRAINS (for real fusion)
Emergence needs genuinely DIFFERENT architectures, not 3 fine-tunes of one base.
- [x] Brain #1 — Qwen3.6-35B-A3B (Transformer MoE, Apache-2.0)
      LoRA on 1,289-corpus, loss 4.02->1.69, adapter saved (art baa3985a). Job a7b261a7 SUCCESS.
- [~] Brain #3 — Mamba-2 / Bamba-9B (State-Space, hybrid) — FIRING THIS SESSION
      Real pretrained SSM base (fundamentally different substrate = the decorrelation fusion needs).
      Same Modal pipeline, ~$15-20. NOTE: on-disk sov33_mamba2*.py are TOY untrained stubs, not this.
- [ ] Brain #2 — DeepSeek-V4-Flash or GLM (Transformer MoE, different lineage)
      Different training data/lineage from Qwen. Same pipeline. ~$30-60 (158B) or single-GPU if smaller.

## PHASE 2 — FUSION + EMERGENCE (the actual open question)
- [ ] Wire the 3 trained brains into sov33_moa_fusion.py as real proposers (not Claude stand-ins)
- [ ] Run held-out battery: fused vs each single brain (the honest emergence test)
- [ ] VERDICT gate: only claim emergence if fused > best single (2 prior null results: -0.05, TIE)
- [ ] If null again: report honestly, don't fake. Decorrelation is the hypothesis, not a guarantee.

## PHASE 3 — GOVERNANCE SPINES (DRUM / KRUM / ARUM)
- [x] DRUM — 9/12-stage flow + clock (sov33_nine_stage_flow.py, Holy Grail Charter)
- [x] KRUM — Byzantine-robust aggregator, verified 58.9x vs mean (sov33_governed_training.py, commit fcd98e5a9)
- [ ] ARUM — name+wire the Layer-0->7 hive layers as one legible "awareness" spine (organization, NOT new capability)
- [ ] Fill the 12-stage alphabet with the real frameworks (map each stage -> module on disk)

## PHASE 4 — CARE GATE + NN PLANETS (safety layer)
- [x] Care-gate framed-harm 0.40->1.00 (12/12 fresh held-out, 0 overblock, 6/6 regression) commit 51210168d
- [x] Threat NN weak->0.954 held-out (n=456) vs 0.548 baseline, commit 4bfb35a
- [!] Dependency NN — data leakage-contaminated (source predicts label) — DATA-BLOCKED, not shipped
- [!] Care-validation NN — zero labeled data on disk — DATA-BLOCKED
- [!] Partnership NN — only 50 thinly-labeled rows — DATA-BLOCKED
- [x] Strong NNs (creativity/care-pattern/relationship 0.75-0.80) — already good

## PHASE 5 — DISTRIBUTED TRAINING (the cheap-power play)
- [~] Governed DiLoCo — KRUM aggregator + reputation validated in sim (sibling lane)
- [ ] Local 2-process DiLoCo proof ($0, on M2) — de-risk step before any GPU spend
- [ ] Honest ceiling: ~10B params demonstrated for decentralized; NOT 1T-from-scratch

## PHASE 6 — SERVE + PROVE
- [ ] Governed OpenAI-compatible shim serving the 3 brains + fusion (sov_openai_shim.py exists)
- [ ] One end-to-end request: venturi-route -> 3 brains -> care-gate -> KRUM/vote -> SIGIL sign
- [ ] Honest scorecard: RUNNING vs DESIGNED vs STUB for every claim

## HONEST BLOCKERS (not faked)
- Emergence unproven until 3 decorrelated brains exist + measured
- Brain #2 needs GPU spend (~$30-60)
- 3 weak NNs need real labeled data (not method-blocked, data-blocked)
- 1T self-host infeasible; API-call flagships instead
