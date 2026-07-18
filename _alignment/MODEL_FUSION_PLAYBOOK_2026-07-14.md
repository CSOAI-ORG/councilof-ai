# 🧬 MEOK Labs — Model Fusion / Absorption Playbook (2026-07-14)
_Evidence base: deep-research run wf_6495e8d1 — 109 agents, adversarially verified, cited.
Honesty register load-bearing: [V]=verified w/ source · [✗]=REFUTED, never repeat · [?]=unverified, re-check._

## THE VERDICT (what's real vs myth)
A **fluid** system CAN fuse capability from many open models — through **three real mechanisms**:
**output-fusion (route/ensemble/aggregate), distillation, and MoE composition/upcycling.**
It **CANNOT** average weights across different architectures, and plain weight-merging does **NOT** reliably
make a model smarter than its best parent. **Nick's care-gated BFT aggregator is already the correct,
state-of-the-art substrate for the fluid path.** The instinct was right; the mechanism is *outputs, not weights*.

---

## 1. WEIGHT MERGING (mergekit) — real, but hard-constrained [V]
- Methods: SLERP · TIES · DARE · **Task-Arithmetic** · passthrough/frankenmerge · linear/model-soups. Runs on a **laptop, no GPU**.
- **HARD constraint (absolute): same base architecture + same tokenizer.** No exceptions. (arXiv 2403.13257, github.com/arcee-ai/mergekit)
- It **combines skills at fixed inference cost** — it does **NOT** provably exceed the best parent's raw intelligence.
- **In-the-wild (heterogeneous fine-tunes): only Task Arithmetic reliably helps** — TIES/DARE do NOT reliably win in messy real merges (arXiv 2511.21437). *(In clean benchmarks the ranking reverses — always attach scope.)* → **use Task-Arithmetic, not exotic methods.**
- Cross-domain composition IS real: Sakana's **evolutionary** merge made a **7B Japanese-Math model beat a 70B** — but all parents shared Mistral-7B base, and it used evolutionary search, not plain averaging (arXiv 2403.13187).
- **✗ REFUTED — do not say:** "merging reliably beats the best parent once you merge ≥4." False (1-2).

**Applies to us:** our 4 OWEM adapters are all Qwen3-0.6B → we can **Task-Arithmetic-merge them into one 0.6B model with all four skills.** Real "absorb our experts into one." Ceiling: still 0.6B, still needs RAG for facts.

## 2. OUTPUT-FUSION — THE fluid path, architecture-agnostic — ✅ we already have it [V]
- **Mixture-of-Agents (MoA):** N proposer models → 1 aggregator synthesizes one better answer. **Open models only scored 65.1% vs GPT-4 Omni's 57.5% on AlpacaEval 2.0** (arXiv 2406.04692, ICLR 2025). No shared-architecture constraint. **This is exactly our council-fusion + care-BFT.**
  - ⚠️ Honest caveat: that win is one GPT-4-judged *preference* benchmark (length/style bias) — NOT proof of general reasoning superiority, and it costs multi-call latency.
  - **✗ REFUTED:** "MoA is SOTA across AlpacaEval + MT-Bench + FLASK." False (1-2).
- **Routing (RouteLLM):** route each query to the right-sized model → **>2× cost cut, ~95% of GPT-4 quality retained** (arXiv 2406.18665). = our SOV333 scope law, formalised.
- **Our edge (open question worth testing):** does our *signed BFT* aggregator beat a *vanilla* MoA aggregator under adversarial proposers? Our 1.0×-vs-3.4× result suggests yes — that's a publishable differentiator.

## 3. DISTILLATION — the real "keep feeding to absorb" [V, medium]
- Multi-teacher KD: a student trains on many teachers' OUTPUTS → absorbs their behaviour/reasoning. Merge-of-Thought (MoT), SAMerging reframes merging as multi-teacher KD (arXiv 2509.08814, 2512.21288).
- **Ceiling (honest):** a small 0.6B–3B student has a hard capacity limit and does **NOT** reliably surpass its teachers.
- **✗ REFUTED (0-3):** "a Qwen3-14B MoT student surpasses DeepSeek-R1 / o1." False.
- **The play:** aggregate 100 models via MoA → **distill the winning aggregated answers into ONE sovereign student.** That's the honest "bootstrap intelligence into one."

## 4. MoE / UPCYCLING — real, and it maps to our OWEM experts [V]
- **Sparse upcycling:** copy a dense model's MLP into each expert + random router → **beats the dense parent for ~46% extra compute** (arXiv 2212.05055).
- **Branch-Train-MiX (BTX):** take independently-trained experts → their FFN params become MoE experts, average the rest, then a short MoE-finetune learns routing (arXiv 2403.07816). **This is how you compose an MoE from our separately-trained OWEM experts** (needs shared Qwen base + a finetune stage).

## 5. FREE-GPU INFRASTRUCTURE — [?] UNVERIFIED, re-check before planning
The research could **not** substantiate any current free-tier limit (Kaggle/Colab/Lightning/Modal/HF-ZeroGPU). Treat any specific hour/quota number as unverified. What we DO know first-hand: **Colab T4 works** (our proven recipe). Serving many models = vLLM/SGLang; training = Unsloth QLoRA.

---

## THE PLAN — bootstrap maximum intelligence into ONE Sovereign (research-endorsed)
1. **AGGREGATE** — route/ensemble many heterogeneous models through the **signed BFT aggregator** (✅ built: council-fusion). This is the only way to fuse 100 different-architecture models.
2. **DISTILL** — take the winning aggregated outputs and distill them into ONE sovereign student (multi-teacher KD, on free/cheap GPU). This is "absorb into one," honestly bounded by student size.
3. **COMPOSE (optional)** — Branch-Train-MiX / sparse-upcycle the OWEM experts into a sovereign MoE (needs shared Qwen base + MoE-finetune).
4. **MERGE (small, local)** — Task-Arithmetic-merge the 4 same-base OWEM adapters into one 0.6B multi-skill sovereign (laptop, no GPU).

**Everything static/weight-merge is bounded; everything fluid/output-level scales to all 100. Nick's aggregator is step 1, already built and verified.**
