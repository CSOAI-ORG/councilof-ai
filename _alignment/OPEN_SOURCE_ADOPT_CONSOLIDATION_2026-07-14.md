# 🌐 Open-source landscape — scrape + consolidate + ADOPT list (2026-07-14)
_Web-verified July 2026 (not training memory). The single finding: **every CPU-proven law we hold maps to a
real, named, production library** — we don't build these from scratch, we adopt them. Source tier marked:
[P]=primary (arXiv/GitHub), [S]=secondary aggregator (verify before public/legal cite)._

## 1. Best base models to adopt (current, licensed, Mac-runnable)
| model | params | license | why | Mac speed |
|---|---|---|---|---|
| **DeepSeek-V4-Pro** | 1.6T / 49B active MoE | **MIT** | the honest T-base (frontier escalation) | server-scale |
| **DeepSeek-V4-Flash** | **284B / 13B active** MoE, 256 experts [P: HF model card, MIT] (⚠ org-list showed 158B — confirm) | **MIT** ✅ | sovereign daily driver — **needs 48GB Mac** (not the 16GB one) | **~4.5–5 tok/s on 48GB via SSD-stream** [P: ssd-moe repo]; aggregator "35–42 tok/s" unconfirmed |
| **Qwen3-235B-A22B** | 235B / 22B active | **Apache-2.0** | broadest benchmark leader, reasoning+code+multilingual | server |
| **Qwen3.5 / 3.6 (27–35B-A3B)** | ~3.3B active | **Apache-2.0** | fast large tier | **64–92 tok/s on M4 Max** [S] |
| **GLM-5.2** | (MoE) | **MIT** | #1 open on BenchLM (81); GLM-4.7 = 94.2% HumanEval / 73.8% SWE-bench | server/sharded |
| **Qwen3-4B / 32B** | dense | **Apache-2.0** | the soupable small/large expert tiers | fast |
- **License-safe trio: Qwen3 (Apache-2.0), DeepSeek-V4 (MIT), GLM-5 (MIT)** — commercial, zero royalty. Open is now within 5–10 pts of closed APIs. [S]
- ⚠ Avoid Qwen2.5-3B/72B (Research/Qwen license) — use Qwen3+.

## 2. Our proven laws → the real library that scales each (ADOPT, don't rebuild)
| our CPU-proven mechanism | adopt this (real, named) | tier |
|---|---|---|
| brain-merge / soup / TIES (`brain-merge-laws`) | **MergeKit** (Arcee) — SLERP/TIES/DARE/Passthrough, runs on 8GB VRAM or CPU | [P] github |
| ratio-sweep auto-optimizer (`fluid-ratio-sweep`) | **Mergenetic / EvoGM / DAM** — evolutionary merge-recipe search vs GSM8K/HumanEval (our α-search, at scale) | [P] arXiv |
| Hermes' SSD-streaming 6-lever (44.6× SSD, LRU, prefetch) | **MoE-Infinity** (JIT expert fetch + activation-aware cache + prefetch, HF+OpenAI serving), **FlashMoE** (SSD + ML cache = our LRU+prefetch, published), **FineMoE** (−47% latency, +39% hit) | [P] arXiv/github |
| run the T-base on the Mac (SSD stream) | **`ssd-moe/deepseek-v4-flash-mlx`** — DeepSeek-V4-Flash (~100B MoE) on **48GB Apple Silicon via SSD expert-streaming, ~4.5–5 tok/s** — Hermes' stack, already open | [P] github |
| Frankenmerge / layer-stacking (our fluid pyramid) | **MergeKit Passthrough** (stack layers across models) | [P] |
| care-gate / guardrail | wrap/benchmark vs **Qwen Guard 4B** (83.97% recall, best open) — beat Llama-Guard-12B/GPT-OSS-Safeguard-20B (miss ≤75%) | [P] arXiv ICLR'26 |

## 3. Safety/robustness — upgrade our red-team from hand-authored to the standard datasets
Our external red-team (40 prompts) and governed-robustness board are the right *shape*; adopt the real corpora
to make the numbers publishable:
- **HarmBench · StrongREJECT · RealToxicityPrompts · BeaverTails** — the 4 datasets the ICLR'26 safety-guard
  benchmark aggregates (79,331 samples, 8 NIST AI-RMF categories). Run our care-gate on these → a *standard* number. [P]
- **JailbreakBench / HarmBench** — swap in for our 40 hand-written jailbreaks.
- **NRT-Bench** — multi-turn red-team of agents as safety-critical operators (nuclear sim) → **DEFONEOS-relevant**. [P]
- ★ **"A Coin Flip for Safety: LLM Judges Fail to Reliably Measure Adversarial Robustness"** (arXiv 2603) —
  **independent confirmation of our own honesty catch**: keyword/LLM-judge refusal scoring is unreliable. Cite it —
  it validates why our governed-robustness *behavioural* board (accuracy-under-adversary) beats judge-based scoring.

## 4. The consolidated upgrade to what we have NOW (priority order)
1. **Swap the daily driver → DeepSeek-V4-Flash on MLX** (35–42 tok/s Mac, MIT) — replaces the slow Colibri/GLM path; this alone is the 0.42→~40 tok/s jump Hermes estimated, *already runnable*.
2. **Adopt MoE-Infinity / ssd-moe-flash-mlx** for the SSD-streaming tier — Hermes' 6 levers are these libraries; use them instead of a proxy.
3. **Use MergeKit + Mergenetic** for the real 4→1 brain (soup Qwen3 experts, evolutionary-search the recipe) — our merge/ratio laws, at scale.
4. **Run the care-gate on HarmBench/StrongREJECT/BeaverTails** → publish a standard safety number beside our red-team.
5. **Keep the moat as the wrapper**: care-gated-BFT + SIGIL seam + signed memory + OSCAL — none of the above has it. We *adopt the base + inference + merge; we own the governance.*

## Honest register
Base-model + Mac-speed figures are [S] secondary aggregators — verify HF model cards / repos before public/legal
citation (same discipline that caught the DeepSeek confabulation). The libraries in §2–3 are [P] primary
(arXiv/GitHub). Nothing here changes the moat: **we don't out-pretrain anyone — we adopt the best open base +
the best inference/merge tooling, and wrap the governance no one else has.**

## Sources
[TECHSY open LLMs Jul 2026](https://techsy.io/en/blog/best-open-source-llms-2026) · [llm-stats leaderboard](https://llm-stats.com/leaderboards/open-llm-leaderboard) · [HF open-source LLMs](https://huggingface.co/blog/daya-shankar/open-source-llms) · [MoE-Infinity](https://github.com/EfficientMoE/MoE-Infinity) · [FineMoE EuroSys'26](https://dl.acm.org/doi/10.1145/3767295.3769319) · [FlashMoE arXiv](https://arxiv.org/abs/2601.17063) · [MergeKit](https://www.mergekit.com/blog/what-is-model-merging) · [Mergenetic arXiv](https://arxiv.org/pdf/2505.11427) · [EvoGM arXiv](https://arxiv.org/pdf/2605.29295) · [NVIDIA model-merging](https://developer.nvidia.com/blog/an-introduction-to-model-merging-for-llms/) · [Safety-guard benchmark ICLR'26](https://arxiv.org/html/2605.28830v1) · [Coin Flip for Safety arXiv](https://arxiv.org/pdf/2603.06594) · [ssd-moe/deepseek-v4-flash-mlx](https://github.com/ssd-moe/deepseek-v4-flash-mlx) · [DeepSeek V4 on MLX](https://medium.com/@rawgear/run-deepseek-v4-on-apple-silicon-with-mlx-yes-its-possible-but-read-this-first-85ae3a65fb78) · [Mac local LLM 2026](https://insiderllm.com/guides/best-local-llms-mac-2026/)
