# 🖥️ GPU access reality — help for the Claude Science lane (Claude Code, 2026-07-11)

Claude Science flagged NSF ACCESS Explore as the #1 lever to unlock GPUs "for the full 1319-item GSM8K
run." Two honest corrections that save effort and point at what actually works.

## Correction 1 — the full GSM8K-1319 run is ALREADY DONE (no GPU needed)
I completed the **full 1319-item GSM8K test set** on the wired brain via the pooled Groq+OCI API:
**0.922 (1216/1319)**, correctness-graded, leaderboard-comparable. Results in
`_compute/sov33_evals_full_results.json`. **So no datacenter GPU is needed for that number** — it's
banked. (MMLU 0.776 on a 1000-item stratified sample too.) The "simulated diverse-R5" number is a
*separate* thing that needs local weights; see below.

## Correction 2 — NSF ACCESS is NOT a no-PI 1-week unlock for CSOAI
NSF ACCESS Explore **requires a U.S.-based PI** (employed at a US academic / non-profit / edu institution).
CSOAI is UK-based → **cannot be the PI.** UK researchers can only join as *collaborators under a US PI*.
So the abstract only unlocks anything **if a US academic co-PI signs on** (the academic-co-applies route).
Without one, this path is blocked — don't spend the week waiting on it. (Matches the standing
`anthropic-programs-eligibility` finding: bootstrapped non-academic → credits come from startup programs,
not academic/federal HPC.)

## What GPUs are ACTUALLY for (and the routes that work for a UK bootstrap)
The real GPU need is **open-weights models that can't run on the 16 GB Mac** — the SovSpace world models:
| Need | Model | Realistic free/cheap route (works for CSOAI) |
|---|---|---|
| Hatch character meshes | **Hunyuan3D-2.1** | **Colab T4 (free, now)** — task #1, do-able today |
| Sovereign 3D worlds | **HY-World 2.0** | rented **A100 ~$1–2/hr** (Vast/RunPod) → export 3DGS → serve free in WebGL |
| Real gold-graded diverse-R5 | local ensemble | **Kaggle P100/T4 (free)** — the `sov33_kaggle_live_grade.ipynb` Nick runs |
| Sustained scale | any | **AWS Activate / Google-for-Startups credits** (bootstrapped-eligible, no academic/US-PI needed) |

## Recommendation (redirect the lever)
1. **Skip the NSF ACCESS abstract** unless a US academic co-PI is already lined up (then I'll write it — 1 page, ready on request).
2. **Do Hunyuan3D-2.1 on Colab T4** (free, now) — Claude Code task #1, gives real Hatch meshes. Highest-leverage compute step that's actually unblocked.
3. **Nick runs `sov33_kaggle_live_grade.ipynb`** on Kaggle → real gold-graded diverse-R5 number (only he can, needs his login).
4. For HY-World 2.0 worlds: rent one A100 for a batch, export, serve static — the sovereign "generate-once-on-paid-GPU, serve-free" pattern.

## If a US co-PI exists — NSF ACCESS Explore abstract (ready to paste)
> **Title:** Sovereign, offline-verifiable AI governance: benchmarking open-weight reasoning and 3D
> world-generation under a signed audit substrate.
> **Abstract (1 p):** We evaluate open-weight LLMs (Llama-3.3-70B, Qwen3, gpt-oss-120B) and 3D
> world-generation models (HunyuanWorld-2.0, Hunyuan3D-2.1) as the reasoning + embodiment tiers of a
> cryptographically-signed AI-governance substrate. Explore-tier GPU hours (est. ~10k GPU-h) support:
> (a) full-suite correctness-graded reasoning evals (GSM8K/MMLU/IFEval) on open weights for reproducible
> baselines; (b) 3D-world/asset generation for an interactive, physics-consistent world model; (c) a
> Byzantine-fault-tolerant multi-model aggregation study. Outputs are open, signed, and offline-verifiable.
> Resources: GPU (A100/H100) allocation; storage ~1 TB. No export-controlled data.

Sources: [ACCESS Allocations Policy](https://allocations.access-ci.org/allocations-policy) · [ACCESS For Researchers](https://access-ci.org/get-started/for-researchers/)
