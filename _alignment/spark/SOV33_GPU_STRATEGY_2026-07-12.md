# 🜏 SOV33 Cloud GPU Strategy — 12 Jul 2026
## Stop crashing Mac. Move heavy work to GPU clouds.

## What happened

This morning's training + GGUF conversion + mlx-lm attempts killed the MacBook:
- Trainer: 60-80s/iter × 200 iters = 1h 7m at 87% CPU
- GGUF convert: 2.4GB model load + quantize = several minutes CPU
- mlx-lm: failed but tried
- Multiple background processes accumulated, Mac crashed/overheated

**Lesson: Heavy work (training, quantization, big inference) belongs on cloud GPU, NOT the Mac.**

## Cloud GPU paths that work TODAY

### 1. **Colab (free, fastest to start)** ⭐ RECOMMENDED

| Property | Value |
|---|---|
| Cost | £0 (free tier) |
| GPU | T4 (16GB VRAM) |
| Speed vs Mac M4 | 8-10× faster |
| Setup | Paste 1 cell into Colab, upload 1 file |
| Time budget | 4-12 hrs/day (re-attach if needed) |

**Script ready**: `SOV33_SELFCONTAINED_COLAB.py` (54 lines, single-cell)
**4-expert variant**: `SOV33_FOUR_EXPERT_COLAB.py` (builds compliance + defense + intuition + voice)

### 2. **Kaggle Notebooks (free, more quota)**

| Property | Value |
|---|---|
| Cost | £0 |
| GPU | T4 ×2 or P100 (30h/week) |
| Speed vs Mac | 10-15× faster |
| Quota | 30h/week free |

### 3. **Oracle GenAI (already configured)**

| Property | Value |
|---|---|
| Cost | $0.0001/tok on llama-70b (cheap) |
| Speed | Inference only (no training) |
| Config | `~/.oci/config` already set up |
| Use | Use trained sovereign brain for cheap inference |

### 4. **GCP VM (meok-backend)**

| Property | Value |
|---|---|
| Status | ❌ DOWN (timed out 30s) |
| When alive | Cheapest CPU option, run cron jobs there |

## What goes where (the right division of labor)

| Work type | Best location | Why |
|---|---|---|
| **Training (LoRA, full fine-tune)** | **Colab / Kaggle T4** | GPU 10× faster, free |
| **Quantization to GGUF Q4** | Colab (also runs llama.cpp) | CPU-bound on Mac, GPU faster |
| **Inference on trained model** | Oracle GenAI (cloud) or Ollama (Mac) | Both work, cloud = $ but free on llama-70b tier |
| **Growth controller + cron** | **GCP VM** (when alive) | Survives reboot, always-on |
| **NN retrain on sovereign corpus** | Mac M4 (small models) or Colab (bigger) | Small = Mac OK |
| **OWEM world model step** | Mac (it's small, <1s) | Fast enough |
| **EWC continual learning** | Mac (Fisher on small NN planets) | Fast enough |

## One-click Colab command (to give Nick)

```bash
# Step 1: Open Colab in browser
# https://colab.research.google.com/

# Step 2: Paste this into ONE cell:
import urllib.request
url = "https://raw.githubusercontent.com/CSOAI-ORG/clawd-workspace/m4-handoff-2026-06-24/_alignment/sovereign_merge_kit/SOV33_SELFCONTAINED_COLAB.py"
urllib.request.urlretrieve(url, "/content/sov33.py")
exec(open("/content/sov33.py").read())

# Step 3: Upload expert_data/compliance.jsonl (200 samples, 1.2MB)
# Step 4: Wait 1-2 hrs for training
# Step 5: Download adapter_model.safetensors (168MB) to ~/.sovereign/models/
```

## For 4 experts at once:

```bash
# Same as above but use SOV33_FOUR_EXPERT_COLAB.py
# Trains all 4 experts in sequence: compliance → defense → intuition → voice
# ~2-4 hours on T4
# Output: 4 LoRA adapters ready for sovereign merge
```

## Tonight's overnight plan (cloud-first)

| Hour | Action | Where |
|---|---|---|
| 18:00 | Push compliance.jsonl to Colab, train compliance-2 | Colab T4 |
| 19:30 | Train defense expert on Colab | Colab T4 |
| 21:00 | Train intuition expert | Colab T4 |
| 22:30 | Train voice expert | Colab T4 |
| 00:00 | Download all 4 adapters to Mac | Mac (receive) |
| 01:00 | Run 4-expert merge locally | Mac (small, OK) |
| 02:00 | Quantize to GGUF Q4 on Colab | Colab (faster) |
| 03:00 | Drop GGUF into Ollama, run battery | Mac (inference) |
| 04:00 | Overnight cron: OWEM + growth + label | Mac (light) |

## Honesty check

- I ran too much heavy work on Mac today. That was wrong. Moving forward:
  - **Training** → cloud GPU
  - **Big inference** → cloud GPU or Oracle GenAI
  - **Small / interactive** → Mac OK
  - **Cron / overnight** → GCP VM (when alive) or Mac (light tasks)
- The Mac is the orchestrator, not the engine. Don't run llama.cpp on it for 600MB+ models.
