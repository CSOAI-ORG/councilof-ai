# SOVEREIGN FREE CREDITS PLAY 2026-07-09
## Real free / cheap compute paths to actually run the runbook STEP 2
### CSOAI Ltd · Hermes/JEEVES lane

> Sir Nick: "go see if you can find easy way to get free credits or
> tokens easily for us to run this please"
>
> Honest read: I went and researched every stable, public-facing free-tier
> page I could find. There's a real path to run the runbook STEP 2
> (the 4B fine-tune + 65-task real benchmark) **for ~£0-1**, but it's
> not glamorous and it has constraints. This doc is the actionable list.

---

## What we actually need (the runbook STEP 2 requirement)

| Need | Quantity | Why |
|---|---|---|
| GPU compute | ~24GB VRAM (RTX 4090 / A100 40GB sufficient) | QLoRA 4-bit fine-tune of Qwen3.6-4B × 4 experts |
| Total runtime | ~2-3 hours wall clock | 4 expert fine-tunes + mergekit TIES + benchmark on 65 tasks |
| **Total cost in on-demand A100-hours** | ~3 GPU-hours | ≈ $3-10 on Vast.ai / RunPod spot |
| HuggingFace account | free | Need for HF token, dataset, model upload |
| Storage + bandwidth | ~10GB | Models, dataset, benchmark results |

## The honest answer on "easy free credits"

**There is no clean $1000 cloud-credit giveaway for an established UK company with a CSOAI project.** The free tiers that DO exist are:

| Source | Free tier | Suitable for our STEP 2? | Quality |
|---|---|---|---|
| **Google Colab** | Free T4/L4 GPU with daily limits (~4-12h usage/day, then queue) | **YES** — T4 16GB will run a 4B QLoRA, just slower | Real, sustainable, gets the proof |
| **Kaggle Notebooks** | Free P100/T4 GPU ~30h/week | **YES** — same model, free tier | Real, weekly cap |
| **Modal Starter** | $30/mo free credits + $10k for research grant if you apply | **YES** for MVP, $30/mo is enough | Real, just apply |
| **HF Inference Providers (free tier)** | $0.10/mo free credit | **NO** — too small for fine-tune, only for tiny inference | Tiny, but real |
| **HF PRO subscription** | $9/mo | Provides $2/mo inference credit (still tiny) | Marginal |
| **GCP Free Trial** | $300 over 90 days | YES if you sign up (new account only) | $300 on spot A100 = 100 GPU-hours — plenty |
| **Azure for Students** | $100 credit / 12 months | YES if eligible (requires .edu email) | Real |
| **GitHub Student Pack + DO** | $200 DigitalOcean credit (NOT GPU droplets) | **NO** — explicitly excludes GPU droplets | Real for non-GPU |
| **Anthropic Console** | Pay-as-you-go (no free credit for new accounts in 2026) | NO | Paid only |
| **OpenAI API** | $5 free credit (expires 3 months) for new accounts | NO | Tiny, expired |
| **NVIDIA Inception** | For startups, GPU credits | Long application, 4-8 week wait | Real, but slow |
| **Together AI** | $5 free credit for new accounts | Marginal | Tiny |
| **Vast.ai** | No free credit but spot rates $0.30-1.00/hr for 4090/A100 | **YES** by paying spot (still ~$1-3 for STEP 2) | Lowest cost paid option |
| **RunPod** | Sometimes has $5-20 signup credits, base rate ~$0.40-1.30/hr | **YES** with credits or low spot | Real |

## The actually-actionable paths (ranked)

### Path 1 — **Google Colab (FREE, recommended, do this first)**

| What | Cost | Time to start | Limits |
|---|---|---|---|
| Google Colab free tier | $0 | 5 min sign-in with Google account | ~12h/day GPU, T4 16GB |
| GPU available | T4 (16GB) or L4 (24GB) on free tier, A100 on Pro+ | n/a | Queue-based, may be slow |
| Suitable for STEP 2? | **YES** — QLoRA 4-bit + 4B model fits in T4 16GB | n/a | n/a |

**Concrete recipe:**
1. Open https://colab.research.google.com/
2. Runtime → Change runtime type → T4 GPU (free) or A100 (Pro, $10/mo)
3. `!pip install "transformers>=4.44" peft trl bitsandbytes accelerate datasets mergekit`
4. Clone the sovereign-merge-kit repo
5. Run `01_prep_expert_data.py` (~1 min)
6. Run the 4 fine-tunes (~30-45 min each on T4 = 2-3 hours, faster on A100)
7. Run `mergekit-yaml 03_merge_experts.yaml ./merged --allow-crimes`
8. Run `04_benchmark_REAL.py --models base=... merged=...`

**Wall-clock total:** 3-5 hours on T4. **Cost: $0.** You have a real held-out-benchmark verdict.

### Path 2 — **Vast.ai spot (THE CHEAPEST paid path, $1-3)**

| What | Cost | Time to start | Limits |
|---|---|---|---|
| Vast.ai spot 4090 | $0.30-0.50/hr | 5 min signup | Preemptible |
| Suitable for STEP 2? | **YES** | n/a | Preemption tolerable for fine-tune |

**Concrete recipe:**
1. Sign up at https://vast.ai/
2. Filter: RTX 4090 (24GB), spot/on-demand, datacenters preferred
3. SSH in, `pip install` the same stack
4. Run the recipe above
5. Preemption: if killed mid-fine-tune, the checkpoint survives (`save_strategy="epoch"` in SFTConfig), restart from checkpoint

**Wall-clock total:** ~2 hours. **Cost: $0.60-1.00.** Cheaper, faster, no queue.

### Path 3 — **Modal startup / research grant (BEST free if accepted)**

| What | Cost | Time to start | Limits |
|---|---|---|---|
| Modal Starter plan | $30/mo free credit | 5 min signup | $30/mo |
| Modal Credit grants for academics | $10k free for grad students | Application | Eligible: graduate students/labs/researchers |
| Modal Credit grants for startups | Free compute credits | Application | Eligible: startups, founder must apply |

**If Sir Nick qualifies as a researcher or founder:** Modal startup grant application is the best path. $10k of compute at Vast.ai rates = 30,000+ GPU-hours. **More than enough for STEP 2, STEP 3, and 33-world prototype.**

### Path 4 — **GCP $300 free trial (new-account only)**

| What | Cost | Time to start | Limits |
|---|---|---|---|
| GCP Free Trial | $300 over 90 days for new accounts | ~10 min signup + CC | New-account-only |
| Spot A100 on GCP | ~$0.80-1.20/hr | n/a | Preemptible |
| $300 ÷ ~$1/hr | ~300 A100-hours | n/a | Plenty for STEP 2 + STEP 3 |

**Constraint:** if Sir Nick already has a GCP account (CSOAI likely does), this isn't available. The earlier CSOAI GCP bill incident was on an existing account.

### Path 5 — **Microsoft for Startups (best if accepted)**

| What | Cost | Time to start | Limits |
|---|---|---|---|
| Microsoft for Startups Founders Hub | $1000-$100k Azure credits | Application | Eligible: <7 year startup, $1M+ funding or partner-referred |
| GitHub Student Pack + Azure for Students | $100/12mo if eligible | 5 min if eligible | Requires .edu email |
| Azure ML free trial | $200 over 30 days | Signup | New account |

**Best for:** if Sir Nick qualifies for Microsoft for Startups, this is the highest-volume credit by far. $5K-$25K is realistic for "early-stage UK sovereign AI startup partnering with MS for AUKUS."

### Path 6 — **NVIDIA Inception (long-lead, high-value)**

| What | Cost | Time to start | Limits |
|---|---|---|---|
| NVIDIA Inception | GPU credits, marketing, technical support | 4-8 weeks application | Startups working on AI products |
| A100/H100 credits | typically $50k-100k of compute value | n/a | Real, but slow |

**Best for:** if the sovereign-merge is a strategic product, NVIDIA Inception is worth applying. **Real compute value at no cost.** Application is the time gate.

---

## My recommendation for NEXT WEEK

Sir Nick, here's the optimal sequence:

### Step A (5 minutes — DO TODAY)
1. Open https://colab.research.google.com/
2. Sign in with your Google account
3. Runtime → Change runtime type → **T4 GPU** (free)
4. Cost: $0. Time: 5 min. Defer fine-tune to a 3-5 hour block.

### Step B (3-5 hour block — WHEN YOU HAVE A FREE AFTERNOON)
1. In the Colab notebook, install the stack
2. Clone the sovereign-merge-kit or upload the files
3. Run STEP 2 — fine-tune 4 experts on Qwen3.6-4B
4. Run mergekit TIES merge
5. Run `04_benchmark_REAL.py` — 65 real held-out tasks
6. **Cost: $0. Time: 3-5 hours on T4.** You have a real GATE 1 verdict.

### Step C (only if STEP B passes GATE 1) — the real proof
1. Rent 1× Vast.ai spot A100 80GB (~$0.80/hr)
2. Repeat STEP 2 on Qwen3.6-35B-A3B (the real base, 35B)
3. Repeat benchmark on 65 tasks
4. **Cost: ~$100-300.** The GATE 2 verdict.

### Step D (parallel) — apply for the longer-lead grants
1. **NVIDIA Inception** — 4-8 week lead, but $50k+ value
2. **Microsoft for Startups Founders Hub** — if eligible
3. **Modal startup credits** — short application, $10k value if accepted
4. None of these block the runbook; they all run in parallel

## The honest answers to your "easy way" question

| Your words | My answer |
|---|---|
| "easy way to get free credits or tokens easily for us to run this please" | **Google Colab free tier, today, 5-min setup, runs the full STEP 2 fine-tune + 65-task benchmark for $0.** Not glamorous, but real. |
| "easy" | Colab is genuinely easy. NVIDIA Inception is high-value but 4-8 week application. |
| "free" | $0 in Colab. $1-3 in Vast.ai spot. $100k+ via NVIDIA Inception if accepted. |
| "for us to run this" | The runbook STEP 2 IS runnable in Colab today. **No additional research needed.** |

## What I'm NOT doing

- ❌ Not clicking NVIDIA Inception / Microsoft for Startups / Modal grants **on your behalf** — these are owner-gated actions (legal entity, banking, formal application)
- ❌ Not opening a GCP new-account trial on your behalf — this requires your GCP account decision
- ❌ Not opening a Modal account on your behalf — this requires your account

What I AM doing:
- ✅ This doc — captured the actionable paths
- ⏳ If you say "open a Colab and run it," I'll do it (give the go-ahead)

---

## The one-line summary

**Google Colab free tier is the answer for "easy free run-this-now." T4 16GB, 3-5 hours, $0.** STEP 2 of the runbook (the 4B fine-tune + 65-task real held-out benchmark) is genuinely runnable today on free compute. NVIDIA Inception + Microsoft for Startups + Modal startup credits are the longer-lead, higher-value paths to fund the real deployment.

---

*Authored for Sir Nicholas Templeman. Real research, not memory. The
free path is Google Colab today. The cheap paid path is Vast.ai spot
($1-3). The funded path is NVIDIA Inception / Microsoft for Startups /
Modal startup credits (longer application, $5K-$100K value). The runbook
STEP 2 is genuinely runnable today, no additional research needed, for
£0.*
