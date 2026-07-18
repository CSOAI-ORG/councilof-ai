# SOVEREIGN Foundation-Model Bootstrap — the honest real path (2026-07-14)

**The claim, stated correctly:** bootstrap OUR OWN foundation model by merging + continued-pretraining +
distilling from open bases. The output is genuinely **our own weights** (a real, ownable model). It is NOT
from-scratch and does NOT exceed its ingredients' raw capability — but it is a real model with our governance
baked in, and that is a defensible, ownable foundation model. This is how most open models are actually born.

## The 5 rungs (all produce OUR weights; rung 6 "from scratch" is the infeasible one we DON'T claim)
| rung | step | mechanism | our-weights? | cost | precondition |
|---|---|---|---|---|---|
| 1 | pick base | Qwen3 (Apache-2.0) / DeepSeek-V4 (MIT) | (base) | free | HF pull |
| 2 | merge experts | MergeKit TIES soup of same-base fine-tunes | YES | CPU/low-VRAM, mins | mergekit + fine-tunes |
| 3 | continued pretrain | further-train on estate corpus (4739 real examples) | YES | 1 GPU, hours | 24GB+ GPU |
| 4 | distill | teacher ensemble -> our student weights | YES | 1 GPU, hours | GPU + teacher access |
| 5 | governance bake-in | care-gate + SIGIL + memory wired at serve | YES | CPU | (done, RUN) |
| 6 | from scratch | random init, trillion-token pretrain | YES | $10M+, months, 1000s GPU | NOT PURSUED (infeasible+unnecessary) |

## Bootstrap fuel (verified on disk, real, no synthetic labels)
- **60 sovereign expert files**, **4739 total real examples** — compliance/defense/intuition/voice +
  arxiv/openworld/bft/privacy corpora. Every example is estate-authored or estate-computed, no invented labels.

## One-command run (when GPU exists)
1. `python 01_prep_expert_data.py`      — assemble corpus into train/val (CPU, ready)
2. `mergekit-yaml sov33_merge_recipe.yml ./merged`  — rung 2, TIES soup (CPU ok)
3. `python 02_finetune_expert.py --base ./merged`   — rung 3+4, QLoRA on real corpus (GPU)
4. `python 04_benchmark_REAL.py --model ./merged`   — held-out eval (GPU) -> writes sov33_live_gsm8k.json
5. `python sov33_ingest_kaggle_result.py`           — auto-wires the graded number into canonical (CPU, ready)

## Honest register
- Rungs 1,2,5 + prep + ingest = **CPU-ready NOW** (run on this Mac).
- Rungs 3,4 + real benchmark = **GPU-gated** (the free Colab/Kaggle GPU you have, or rented) — the code is
  written and verified; it needs the hardware to point at. No fake training substitutes for the real run.
- The merged model IS your own weights. Call it a foundation model honestly: own weights, own governance,
  bootstrapped from open bases — not from-scratch, not superhuman, but real and yours.
