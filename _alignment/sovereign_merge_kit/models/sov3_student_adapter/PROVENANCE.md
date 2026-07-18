# SOV3 student adapter — provenance (MEOK-SOV3 / Science lane)

## What this is
LoRA adapter, base **Qwen/Qwen2.5-0.5B-Instruct**, trained 2026-07-15 on Modal A100 (free tier).
- Corpus: **113 pairs** — `expert_data/sovereign_distilled.jsonl` (EU AI Act-grounded distillation).
- Final train loss **1.5130** (3 epochs). Weights verified: 336 tensors, **0 NaN**, max|w| 0.0377.
- Held-out eval: **base 0/3 → tuned 3/3** law-citations on 3 unseen governance prompts (`eval_scorecard.json`).

## NOT a duplicate of the Claude-Code SOV3
Earlier this session I wrongly called this a duplicate of Claude Code's SOV3 and proposed retiring it.
**Retracted.** CC's SOV3 uses the **1,289-row merged corpus** (commit 360b3fe37) — same base, DIFFERENT
(≈11×) corpus. These are two distinct students:
- THIS one (113-pair): smaller data, **has a measured held-out scorecard** (0→3/3).
- CC's (1,289-row): larger data, **not yet eval'd on this battery**.

## Correct next step
Eval BOTH on the same held-out governance battery; keep the winner. Do not retire either until measured.
