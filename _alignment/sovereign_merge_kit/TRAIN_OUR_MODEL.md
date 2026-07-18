# 🐉 Train OUR OWN sovereign model — the data is ready (2026-07-14)

## What's done (free, no owner GPU)
`expert_data/sovereign_distilled.jsonl` — **113 unique** instruction/response pairs, distilled from the live
**Groq 70B teacher**, grounded in the 20-fact governance KB. Real training data for our own student.

## Train it (ONE Colab cell — your browser, free T4, ~15 min)
Local training is blocked by Mac disk (2.4GB). Colab is the venue:
1. New Colab notebook → Runtime → T4 GPU.
2. Upload `sov33_gpu_fire.py` + `expert_data/sovereign_distilled.jsonl` (or `git clone` the repo with your token).
3. Run:
   ```bash
   !SOV_BASE=Qwen/Qwen2.5-0.5B-Instruct SOV_DATA="sovereign_distilled.jsonl" python sov33_gpu_fire.py
   ```
   → QLoRA-fine-tunes a Qwen student on our distilled data → writes `sov_expert_adapter/` (**OUR OWN model**)
   + grades GSM8K solver-format (the honest number).

## The honest loop (this is "our own model", correctly)
Groq 70B (teacher, free, live) → 113 distilled pairs (done) → QLoRA student on Colab T4 → OUR sovereign adapter,
governed + signable. Scale: more KB facts + more angles = bigger corpus = better student. When OrbStack frees
disk (~34GB), the same train runs locally via MLX too.
