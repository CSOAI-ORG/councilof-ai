# 🖥️➡️🧪 GPU ACCESS — everything Claude Science needs to connect (2026-07-14)
_From Fable to Claude Science. All free-GPU options, current, with exact connect steps. Web-verified 2026-07-14.
Honest: the GPU login itself is OWNER-gated (Nick signs in); you (sandboxed) write the notebooks/cells + I stage them._

## READY RIGHT NOW — the Kaggle notebook is live + GPU-armed
- **Notebook:** `notebooke3e821442d` (owner: nicktempleman). **GPU T4×2 ON, Internet ON, phone-verified.** 30 GPU-hr/week.
- **The one-cell combined runner (already pasted + running once):**
  `!curl -sL "https://gist.githubusercontent.com/CSOAI-ORG/2a3aa08d9d52c7452acec3d5afc6f1b6/raw/2898bb53fe3fd793cb03cb989b5e077b514e7450/sov33_kaggle_combined_CELL.py" -o c.py && python c.py`
  → writes `sov33_local_gsm8k.json` (capability) + `governed_robustness_results.json` (the #1 board, already reproduced 3.4× vs 1.0×).
- **Build cell for the trinity training:** `sov33_gpu_notebook_CELL.py` (same gist repo) — QLoRA the Qwen3 experts.

## FREE GPU PLATFORMS (ranked for our use) — verified July 2026
| platform | free GPU | quota | best for | connect |
|---|---|---|---|---|
| **Kaggle** ⭐ | T4×2 / P100 (16GB) | **~30 hr/week**, 9-hr sessions, **background exec** | our training + grading (ARMED) | kaggle.com → phone-verified ✅; notebook above |
| **Google Colab** | T4 (16GB) | ~15–30 GPU-hr/wk (unit system), 12-hr max, 90-min idle cut | quick runs | colab.research.google.com (Google login) |
| **Lightning AI** ⭐ | T4→L4→L40S→A100→H200 | **15 credits/mo ≈ 80 GPU-hr**, persistent Studio, 4-hr restart | bigger models (A100/H200!) | lightning.ai (login) — best free A100 access |
| **Paperspace Gradient** | M4000 (8GB) | 6-hr auto-shutdown, unlimited restarts | small experiments | paperspace.com (DigitalOcean login) |
| **HF Spaces ZeroGPU** | A100 slices | no CC needed, per-request | inference demos | huggingface.co/spaces (HF login) |
| **Modal** | — | $30 free credits/mo | batch jobs / fine-tune pipelines, no notebook UI | modal.com (`pip install modal`) |
| ⚠ **SageMaker Studio Lab** | — | closes new signups **2026-07-30** | (existing accounts only) | — |

## What YOU (Claude Science) can do vs what needs owner login
- **You (sandboxed):** author the training/eval notebooks + cells, define the recipe (base=Qwen3, config=12×4@nu0.7,
  distil target=DeepSeek-R1), write the QLoRA scripts. Push them to the shared repo / gist. I stage them.
- **Owner login (Nick, one action):** sign into Kaggle/Colab/Lightning; paste + run the cell. Kaggle is already
  phone-verified + armed, so Kaggle is the fastest path — the notebook + cell are waiting.
- **Neither of us can hold the login token** — that's the honest boundary (same as this whole session).

## The build recipe to run (from SOV33_GPU_BUILD_SPEC + trinity)
1. QLoRA fine-tune Qwen3-4B experts (compliance/defense/intuition/voice) on `expert_data/*.jsonl` — Kaggle T4 or Lightning A100.
2. Soup same-base pairs (MergeKit), stack **12×4@nu0.7** residual layers.
3. Distil DeepSeek-R1 reasoning into the small tier (intel: the new normal).
4. Wire V-JEPA2 for world perception (SOV333).
5. Grade GSM8K (solver-format) + governed-robustness → auto-wire canonical.

## TL;DR for Claude Science
**Kaggle is armed and fastest** (notebook `notebooke3e821442d`, GPU on, cell ready). For A100-scale, **Lightning AI**
(80 GPU-hr/mo free). Write the recipe; Nick does the one-click login+run. Everything staged in the gist + build spec.
