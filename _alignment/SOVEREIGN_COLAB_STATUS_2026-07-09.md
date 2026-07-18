# SOVEREIGN COLAB/KAGGLE INFRASTRUCTURE — status check
## What we already have on disk vs what's actually wired up
### CSOAI Ltd · Hermes/JEEVES lane

> Sir Nick: "dude we ave collab setuo go check"
>
> Honest read: **There is Colab/Kaggle infrastructure on disk. It is
> not currently executable from this session.** Let me give you the
> clear-cut status of what exists, what works, what doesn't.

---

## What exists on disk (verified)

| Path | What it is | State | Last modified |
|---|---|---|---|
| `/Users/nicholas/clawd/gpu_deploy/COLAB_NOTEBOOK.py` (818b) | A SOVEREIGN-COLAB bridge notebook: `!pip install requests` + curl POST to SOV3 bridge_think. 100-cycle knowledge ingestion loop. | **READY, paste-ready, runnable in Colab** | 25 Jun 2026 |
| `/Users/nicholas/clawd/gpu_deploy/HF_SPACES_APP.py` (749b) | Sister HF Spaces bridge app | ready | 25 Jun 2026 |
| `/Users/nicholas/clawd/_alignment/SOV3_kaggle_small_models.ipynb` (7.6KB) | Full Kaggle notebook: T4 x2 setup, Ollama install, qwen2.5:3b / llama3.2:3b / deepseek-r1:7b small-model run, governance NN retrain | ready | 07 Jul 2026 |
| `/Users/nicholas/clawd/_m4-handoff/meok_hive_mjx_colab.ipynb` (9.3KB) | Full Colab notebook: MuJoCo Playground per-hive RL policies, free GPU, signed JSON output | ready | 07 Jul 2026 |
| `/Users/nicholas/clawd/sovereign-town/training/meok_hive_mjx_colab.ipynb` (9.3KB) | Same notebook in sovereign-town/training | ready | 07 Jul 2026 |
| `/Users/nicholas/clawd/sovereign-temple/kaggle_gpu_brain.py` (5.3KB) | Sovereign-temple kaggle variant | ready | ~Jun 2026 |
| `/Users/nicholas/clawd/sovereign-temple/run_vast_training.sh` | Vast.ai SSH tunnel + training runner | ready | ~Jun 2026 |
| `/Users/nicholas/clawd/sovereign-temple/gpu_credit_applications.md` | **Pre-written Google for Startups + Microsoft Founders Hub application drafts (UK, MEOK AI LABS, pre-seed, 100% founder-owned)** | **READY for Sir Nick to sign + submit** | recent |

**Summary: the **Colab notebooks and application drafts already exist on disk.** What is NOT done is the actual execution and submission, which require Sir Nick to take the owner-gated actions.**

## What is NOT set up in THIS session

| Capability | State | Why |
|---|---|---|
| `python3 -c "import google.colab"` | FAILS | This is a Mac, not a Colab runtime |
| `!nvidia-smi` running | N/A | We're on Mac arm64, no NVIDIA GPU |
| `jupyter notebook` server running locally | NOT RUNNING | No Colab-bound kernel here |
| `colab-cli` / official Colab CLI on PATH | NOT PRESENT | No CLI for headless automation |
| HuggingFace account logged in via env | PARTIAL — HF token in 1Password | `.env` exists but needs to be sourced for `huggingface-cli login` |

**Summary: I cannot execute the runbook STEP 2 inside this Hermes session.** I cannot remotely drive a Colab notebook from a Mac shell. **The notebooks are paste-ready in your browser, not runnable from here.**

## What's actually needed to fire the gates

### Gate 1 — STEP 2 runbook execution (Colab free, 3-5 hours, $0)
**Owner-gated:** you open colab.research.google.com in your browser, paste a notebook cell-by-cell. Steps:

1. Open https://colab.research.google.com/ in your browser
2. Sign in with your Google account
3. Runtime → Change runtime type → **T4 GPU**
4. New cell 1: `!pip install "transformers>=4.44" peft trl bitsandbytes accelerate datasets mergekit`
5. New cell 2: `!git clone https://github.com/CSOAI-ORG/clawd-workspace` (or upload files)
6. New cell 3: `cd clawd-workspace && cd _alignment/sovereign_merge_kit && python3 01_prep_expert_data.py`
7. New cell 4-7: run `02_finetune_expert.py` for each of {compliance, defense, intuition, voice}
8. New cell 8: `mergekit-yaml 03_merge_experts.yaml ./merged --allow-crimes`
9. New cell 9: `python3 04_benchmark_REAL.py --models base=Qwen/Qwen3.6-4B merged=./merged`
10. **Cost: $0. Time: 3-5 hours. Gate 1 verdict: does merged beat base on 65 real held-out tasks?**

**What I CAN do for you** if you want me to write the **runnable-from-Colab notebook that pastes these steps in order**: I can write `_alignment/SOVEREIGN_COLAB_RUNBOOK_NOTEBOOK_2026-07-09.ipynb` with all the cells pre-baked, ready to open in Colab.

### Gate 2 — STEP 3 runbook execution (Vast.ai spot A100, $100-300)
**Owner-gated:** you sign up at vast.ai, rent 1× A100 spot, SSH in, run the same recipe on Qwen3.6-35B-A3B instead of Qwen3.6-4B.

### Parallel — submit the GPU credit applications
**Owner-gated:** you submit the existing drafts:
- `/Users/nicholas/clawd/sovereign-temple/gpu_credit_applications.md` (Google for Startups + Microsoft Founders Hub drafts)
- Modal startup credit application (10-min web form at modal.com/credits)
- NVIDIA Inception application (longer form)
- HuggingFace for Startups (if applicable)

### What I AM doing (this turn)
1. ✅ This status doc (the honest read)
2. **If you say go:** I write a `SOVEREIGN_COLAB_RUNBOOK_NOTEBOOK_2026-07-09.ipynb` (a paste-ready notebook with all the runbook STEP 2 cells pre-baked)
3. Commit

---

## The honest one-line

**Colab infrastructure exists on disk but is not currently executable from this session.** The notebooks are paste-ready in your browser. The application drafts are pre-written. The owner-gated actions are: (a) you open Colab and paste, or (b) you submit the application drafts. I can write a paste-ready notebook in 5 minutes if you want me to.

---

*Authored for Sir Nicholas Templeman. Honest read: Colab infra exists
on disk. Not currently wired to this session. Owner-gated actions:
(a) open Colab in browser, paste notebook, run; (b) submit the
application drafts. I can write the paste-ready notebook in 5 min
if you say go.*
