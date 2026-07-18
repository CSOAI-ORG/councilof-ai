<!-- MEOK_SOV3 free-compute survey — 2026-07-07 — web-verified, mapped to SOV3³ needs -->

# Free GPU & Token Options for SOV3³ (verified 2026-07-07)

**Honest framing first.** SOV3³'s anchor is **qwen3:30b-a3b** — a 30B-parameter MoE. Even
at 4-bit it needs ~18-24GB VRAM just to load, more for context. That rules OUT every
16GB free notebook tier for the 30B. Free tiers CAN run the smaller estate models
(qwen2.5:3b / llama3.2:3b / deepseek-r1:7b, the governance NNs, BGE-M3 embeddings) and
short fine-tunes. Split accordingly.

## A. Standing free GPU tiers (no card, recurring) — good for the SMALL models

| Platform | GPU | Free allowance | Fits SOV3³? |
|---|---|---|---|
| **Kaggle** | P100 16GB, or 2×T4 (32GB combined), TPU v5e-8 | ~30 GPU-h/week, 9-12h sessions, **background execution**, 20GB persistent | ✅ Best free pick. 2×T4=32GB can *just* hold a 4-bit 30B; comfortably runs 3B/7B + NN training |
| **Google Colab (free)** | T4 16GB | ~15-30 GPU-h/week (unpublished, demand-based), 12h cap, dies ~90min idle | ✅ small models only; 16GB won't hold the 30B |
| **Lightning AI** | T4→L40S/A100/H200 (interruptible) | 15 credits/mo ≈ ~80 GPU-h on cheap GPUs, 50GB, 4h manual restart | ✅ can reach A100 briefly → 30B inference in short bursts |
| **HF ZeroGPU / Saturn / Paperspace** | A100-slice / T4 / M4000-8GB | request-capped / ~30h / 6h | partial — ZeroGPU good for Spaces demos |
| **Oracle Always Free** | A10 (Ampere A1) | truly free-forever, limited | ✅ A10 24GB → can hold a 4-bit 30B for light inference |

## B. Signup credits (card, expiring) — for a real 30B burst on A100/H100

| Program | Credit | Reaches GPU? |
|---|---|---|
| **Google Cloud** | $300 / 90d | only after converting to paid billing (your meok-498012 could use this) |
| **Azure** | $200 / 30d | GPU quota often refused on new accounts |
| **Oracle** | $300 / 30d | yes, reaches GPU |
| **Modal** | recurring low-tens-of-$/mo free allotment | ✅ H100 ~$3.95/h, A100 ~$2.80/h, zero idle cost — **best fit for bursty SOV3 inference** |
| **RunPod / Vast.ai** | $5-10 signup (RunPod) | A100 from ~$0.20/h spot; Vast RTX 3090 from ~$0.07/h |

## C. Startup/research programs (zero equity) — the real runway

- **NVIDIA Inception** — free, no equity, **prerequisite** for the big partner credits below. Join first.
- **Nebius AI Lift** (via Inception) — up to **$150,000**, bills at neocloud (not hyperscaler) rates → the largest real-value pool; anchor heavy training here.
- **AWS Activate** — up to **$200,000** (~29,000 H100-h at list). Note: AWS closes NEW-customer signup **2026-07-30** — register before then if wanted.
- **Microsoft for Startups**, **DigitalOcean Hatch**, **Google for Startups** (your MEOK_GOOGLE_STARTUPS_APPLICATION.md already targets this → converts the paid GCP VM to credits).

## D. Free/cheap TOKEN (API) options — for the cloud ensemble brains
SOV3³'s cloud ensemble (GLM/Claude/Groq) needs API tokens, not GPUs:
- **Groq** — free tier, very fast inference on open models (Llama/Qwen/Mixtral) — good for the speed lane.
- **Google AI Studio (Gemini)** — generous free tier; already wired as the "right brain" on the VM.
- **OpenRouter** — free-tier routing to several open models; single key, many models.
- **GitHub Models** — free access to frontier + open models via your existing GitHub token.

## Recommendation for SOV3³ (grounded in the estate's actual state)
1. **Now, free, small models:** run the 3B/7B brains + governance-NN training on **Kaggle** (2×T4, background exec) — closest to a standing GPU, no card.
2. **30B bursts:** **Modal** — zero-idle, per-second A100/H100, matches SOV3's bursty inference better than a 24/7 notebook. Its recurring free allotment covers experimentation.
3. **Real runway:** join **NVIDIA Inception** (free, no equity) → apply **Nebius AI Lift**; separately push the **Google for Startups** application you already drafted to convert meok-backend's paid Spot VM to credits.
4. **Tokens:** **Groq** (speed) + **Gemini free** (already live) + **GitHub Models** (frontier, existing token) for the cloud ensemble — no new spend.

> Free-tier specifics (hours, GPU models) shift with demand; figures verified 2026-07-07 from current comparisons. Re-check before committing a workload.
