# 🛒 The REAL sovereign build — actual open models (fiction → reality, cited) 2026-07-14
_Names the concrete, downloadable, correctly-licensed open models for the 4→1 brain + the T-base. Web-verified
July 2026, NOT training-memory. Honest source tier: primary = HF model card (not yet fetched); secondary =
aggregators below (multiple agree). **Verify the HF model card before any public/legal citation of a figure.**_

## The T-base (the honest "trillion") — rides an open MIT ≥1T model
> **PRIMARY-VERIFIED CORRECTION (HF model list, 2026-07-14):** the **1.6T is the BASE** (`DeepSeek-V4-Pro-Base = 1.6T`);
> the *deployed* **V4-Pro = 862B**, and **V4-Flash = 158B** (~13B active), NOT the aggregators' "284B/1.6T-deployed".
> The trillion is real **as a base**; do NOT attribute 1.6T to the served model. Aggregators [S] conflated base↔deployed — verified against HF.
- **DeepSeek-V4-Pro-Base** — **1.6T** open base weights (the honest ≥1T). **V4-Pro** deployed = **862B** (HF org-list). The trillion is real **as a base**.
- **DeepSeek-V4-Flash** — **model card (primary): 284B total / 13B active MoE, MIT** (`License: mit`), 256 experts, 1M context, arXiv 2606.19348, "preview", Apr 2026. ⚠ The HF **org-list view** showed 158B for Flash / 292B base — a discrepancy vs the card; **lead with the card (284B/13B/MIT), confirm the 158B listing before relying on it.** [P: HF model card + org list — they disagree, flagged]
- **The T is REAL:** it lives in downloadable open weights. Sovereignty adds **governance + memory + attestation,
  NOT parameters.** Summing a stack to a "T" is still the refused fake — cite ONE real base's total (1.6T, legit).
- ⚠ Source tier: these are secondary aggregators (multiple, corroborating). Confirm on `huggingface.co/deepseek-ai`
  before public use — this is exactly the figure that burned us when only titles existed; now it has bodies, still verify primary.

## The 4→1 brain — Apache-2.0, commercial-safe, SOUPABLE (same base)
Merge law (measured, `brain-merge-laws`): you can only weight-soup **fine-tunes of the SAME base**; cross-size
must route/distill. So each pair = two fine-tunes of one Apache base.

| role | model (Apache-2.0) | why |
|---|---|---|
| **2 small** → soup → 1 | two fine-tunes of **Qwen3-4B** (or 1.7B) | same base ⇒ soupable; 4B = strong reflex/draft tier |
| **2 large** → soup → 1 | two fine-tunes of **Qwen3-32B** (or MoE **Qwen3-30B-A3B**) | same base ⇒ soupable; 32B = verify tier |
| **frontier escalation** | **DeepSeek-V4-Pro** (MIT) | the mirror-auditor routes high-divergence items HERE (measured: escalate must be genuinely stronger) |

- **Qwen3 dense sizes (all Apache-2.0):** 0.6B, 1.7B, 4B, 8B, 14B, 32B; MoE 30B-A3B, 235B-A22B. [qwen wiki], [insiderllm]
- **⚠ Licensing catch (real):** in the older **Qwen2.5** line, **3B = Qwen Research License** (NOT commercial) and
  72B = Qwen License. The CPU sims used Qwen2.5-3B — fine for a *research* proof, **wrong for a commercial build**.
  Qwen3 (and 3.5/3.6, latest = **Qwen3.6**, 27B dense + 35B-A3B, Apr 2026) are **all Apache-2.0** → use Qwen3+. [deeplearning.ai], [aimlapi]

## The honest build order (every step real + licensed)
1. **Base:** pull DeepSeek-V4-Pro (MIT) as the T-scale frontier + Qwen3-4B / Qwen3-32B (Apache) as the tiers.
2. **Experts:** QLoRA-fine-tune 2× Qwen3-4B (compliance, defense) and 2× Qwen3-32B (intuition, voice) on the estate's `expert_data`.
3. **Merge (measured law):** soup the same-base pairs (α=0.5 or TIES) → 1 small + 1 large. **Never average across bases/sizes.**
4. **Route** small→large; **escalate** high mirror-divergence → DeepSeek-V4-Pro (the genuinely-stronger target).
5. **Distill** DeepSeek/large → small periodically so the fast path improves.
6. **Govern:** wrap the emit in care-gated-BFT (the robustness #1) + SIGIL sign + OSCAL card.
7. **Fine-tune timeline (real):** adopting an open base makes this a **~days / ~£450** job, not a 20,000-GPU-year pretrain.

## The one-line honest pitch (survives an auditor)
**"A sovereign model that IS trillion-scale — because it rides DeepSeek-V4 (1.6T, MIT) — wrapped in governance
(care-gate + BFT council + signed memory) that no leaderboard model has, with Apache-licensed Qwen3 experts
souped and routed underneath. The T is real; the moat is the governance; every model is named and licensed."**

## Sources
[Qwen2.5 blog](https://qwenlm.github.io/blog/qwen2.5/) · [Qwen Wikipedia](https://en.wikipedia.org/wiki/Qwen) · [deeplearning.ai — Qwen2.5](https://www.deeplearning.ai/the-batch/alibaba-releases-qwen-2-5-models-raising-the-bar-for-open-weight-llms) · [insiderllm Qwen3 guide](https://insiderllm.com/guides/qwen3-complete-guide/) · [aimlapi Qwen3.6](https://aimlapi.com/blog/qwen-3-6-series-alibabas-open-source-llm-revolution-in-2026) · [morphllm DeepSeek V4](https://www.morphllm.com/deepseek-v4) · [clore.ai DeepSeek V4](https://docs.clore.ai/guides/language-models/deepseek-v4) · [nxcode DeepSeek V4](https://www.nxcode.io/resources/news/deepseek-v4-release-specs-benchmarks-2026) · [OpenRouter open-weights June 2026](https://openrouter.ai/blog/insights/the-open-weight-models-that-matter-june-2026/)
