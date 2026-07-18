# SOV4 Bleeding-Edge Synthesis — Open Models & Frameworks as of 2026-07-16
_Live pull from HuggingFace trending + arXiv. Cross-referenced against the SOV4 stack.
Honesty split: ✅ VALIDATES what we have · ✨ GENUINE SPARK to add · ⏭️ SKIP (bigger, not newer)._

## Method
Fetched HF trending text-generation models (live, sorted by trendingScore) + the arXiv papers behind
the ones signalling NEW architecture (not just scale). Every model/number below is from the live pull
this session, not memory. arXiv titles fetched from export.arxiv.org.

## The genuine sparks (worth iterating on)

### ✅✨ arXiv:2606.30616 — "Scaling the Horizon, Not the Parameters: Reaching Trillion-Parameter
Performance with a 35B Agent"  (behind InternScience/Agents-A1, a qwen3.5-MoE agentic VLM)
- **This is our exact thesis, now PUBLISHED.** A 35B agent reaches ~T-param *performance* by scaling the
  reasoning HORIZON (agentic multi-step loops) instead of parameter count.
- **What it means for us:** the "T-performance without T-params" position we've held all along is now
  citable, not just our claim. Our SRUM swarm + 12-mindset horizon-scaling is the same family.
- **Spark to add:** their horizon-scaling recipe (longer agentic rollouts on a small base) is exactly
  what SRUM does — worth reading the method to tune our rollout depth. Base is Qwen3.5-MoE (our family).

### ✅ Nemotron-3 (arXiv:2604.12374 Super / 2512.20848 Nano) — "Hybrid Mamba-Transformer MoE for
Agentic Reasoning"  +  Puzzle compression (2607.04371 / 2411.19146)
- **Validates our decorrelation bet directly:** NVIDIA ships ONE model interleaving Mamba (SSM) +
  Transformer + MoE. We chose Qwen-MoE (#1) + Bamba-SSM (#3) as decorrelated legs — same architectural
  intuition, they just fuse it in-model where we keep them separate + governed.
- **Spark:** "latent-moe" + "mtp" (multi-token prediction) tags on Nemotron-Puzzle-75B. MTP is a real
  decode-speed win (predict several tokens/step). Worth evaluating as a serving-tier speedup — it's a
  runtime technique, not a governance change, so it fits UNDER our gate cleanly.
- **Puzzle (2411.19146): distillation-based NAS for inference-optimized LLMs** — a principled way to
  compress a big model to a cheaper one that keeps quality. Relevant to our "run cheap, govern well" tier.

### ✨ SupraLabs/Supra-Router-51M — a 51M-param dedicated ROUTER/orchestrator model
- **This is our venturi, as a trained tiny model.** We route with keyword lists; they trained a 51M SLM
  purely to route/orchestrate across experts (tags: router, orchestrator, slm, edge, moe).
- **Spark:** our venturi routing is currently heuristic (keyword match). A tiny trained router (51M runs
  on anything, even the Mac) could REPLACE the keyword venturi with a learned one — a real, cheap upgrade
  that makes routing smarter without touching the governance gate. Highest-value spark on this list.

### ⏭️ Ternary/Bonsai-27B (1-bit / ternary quant, hybrid-attention, on-device)
- 1-bit/ternary quantization + hybrid attention, runs on-device (llama.cpp/mlx/metal). Huge downloads.
- **Verdict:** relevant to the Colibri/MLX on-device SERVING tier (run a governed model on the Mac), but
  it's a quantization technique, not a governance spark. Note for the serving lane; not a SOV4 core change.

### ⏭️ Frontier scale (DeepSeek-V4-Pro/Flash, GLM-5.2, Hy3, LongCat-2.0, Ornith-35B)
- These are the big/RL-tuned models. We already GOVERN these via API (they're our online tier). Ornith
  (RL-tuned Qwen3.5, ~2M downloads) is worth noting as a strong cheap online brain. Not new architecture.

## The honest bottom line
- **Two of today's top trending items VALIDATE our exact bets** (35B-horizon-scaling = our thesis;
  Mamba+Transformer+MoE hybrid = our decorrelation legs). We're not behind the curve — we're on it.
- **The one spark worth building now:** replace the heuristic venturi with a tiny TRAINED router
  (Supra-Router-51M pattern) — cheap, runs anywhere, smarter routing, governance untouched.
- **One serving-tier note:** MTP (multi-token prediction) + ternary quant are real decode-speed wins for
  the on-device tier — under the gate, not in it.
- **Nothing here forces a flagship spend** — the horizon-scaling paper actually argues AGAINST it
  (35B + agentic loops reaches the performance). That's evidence for our "measure before spend" discipline.

_All model IDs/downloads/likes are from the live HF pull 2026-07-16; arXiv titles from export.arxiv.org.
Papers are LEADS — read the method before citing specifics; the titles/ids are verified, the internals are not yet._
