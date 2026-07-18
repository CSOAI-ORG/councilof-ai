# KDA 3:1 Hybrid-Attention Ratio — Experiment Spec

**Author:** MEOK SOV3 · **Date:** 2026-07-17 · **Track:** SSM-leg hybrid-attention test (CPU, free, real)
**Honesty register:** every claim below is tagged **LEAD** (external, unverified until we run), **DESIGNED** (our spec/mapping), **RUNNING** (verified in our sandbox), or **GATED**.

---

## 1. The lead (external — UNVERIFIED until we run our own test)

**Source:** Kimi Team, *"Kimi Linear: An Expressive, Efficient Attention Architecture"*, arXiv **2510.26692** (v2, Nov 2025). Code: github.com/MoonshotAI/Kimi-Linear; checkpoints on HuggingFace (`moonshotai/Kimi-Linear-48B-A3B-Instruct`).

What the paper claims (**LEAD** — these are THEIR results at THEIR scale, not ours):

- **KDA (Kimi Delta Attention)** is a linear-attention module that extends **Gated DeltaNet** with a finer-grained, *channel-wise* gating mechanism, implemented via a specialized Diagonal-Plus-Low-Rank (DPLR) chunkwise algorithm. It keeps a **fixed-size recurrent state** instead of a growing KV cache. `[LEAD]`
- **Hybrid architecture:** KDA layers are interleaved with periodic **full attention** (Multi-Head Latent Attention, MLA) in a **uniform 3:1 ratio** — 3 of every 4 layers are cheap linear, every 4th is full attention. The full layers preserve global information flow; positional info is delegated to KDA (MLA uses NoPE). `[LEAD]`
- **Claimed payoff at scale:** up to **75% KV-cache reduction** and up to **~6× (HF card: 6.3×) faster decoding throughput (TPOT)** at **1M-token** context, while *matching or surpassing* full-attention quality. Model: 48B total / 3B activated, trained on **5.7T tokens**. `[LEAD]`
- Community note (also a LEAD, not a fact): the optimal k:1 ratio "requires empirical tuning — too few full-attention layers → context drift; too many → lost efficiency."

> **The numbers 75% / 6.3× belong to Moonshot at 1M context and multi-trillion-token scale. They are NOT ours and we do not claim them.** This experiment does not attempt to reproduce those absolute figures. (Note: the SOV3 profile's "2.8T" refers to the separate Kimi K3 flagship param count, not the Kimi Linear training-token count, which is 5.7T.)

## 2. What we actually have (RUNNING / on-disk)

- A Mamba-2 / Bamba **SSM leg** referenced in prior merge-kit work (adapters `c7265669` / `01fe2837`). The SSM leg is a fixed-state recurrent mixer — architecturally the same *family* as the "linear" half of a KDA hybrid. `[DESIGNED mapping]`
- Toy CPU compute only: 16 GiB RAM, 10 cores, **no GPU**. torch 2.12.1 / numpy 2.4.6 in env `sov33ft`. `[RUNNING]`

## 3. Mapping the lead onto our SSM leg (DESIGNED)

| Kimi Linear component | Our stand-in in this test | Honest gap |
|---|---|---|
| KDA (gated-delta, DPLR, channel-wise gate) | **Gated linear attention** (elu+1 feature map, per-head scalar/elementwise decay gate) | We do **NOT** implement the DPLR delta rule or channel-wise fine gating. Ours is a simplified gated-linear mixer that shares KDA's *fixed-state* property only. |
| Full attention = MLA + NoPE | Standard causal **softmax attention** (RoPE-free, learned pos via embedding) | We use vanilla softmax attention, not latent-compressed MLA. |
| 3:1 interleave, periodic | 4-layer stack: **3 gated-linear + 1 full** (full at the periodic 4th slot) | Same ratio; toy depth. |
| 2.8T/5.7T-token, 48B model, 1M ctx | ~0.5–1M-param model, seq len 32→256, synthetic recall | Toy scale. **This is the whole point of the honesty boundary.** |

## 4. Hypothesis under test (the RATIO's *direction*, not the magnitude)

**H1 (memory):** A 3:1 hybrid keeps a growing KV cache in only 1 of 4 layers, so its cache footprint should grow at ~1/4 the rate of an all-full-attention model → a **structural ~75%-of-full reduction** relative to full attention (arithmetic, not a claimed speedup).

**H2 (quality):** On an associative-recall task that stresses fixed-state memory, **pure linear** should degrade as sequence length rises (finite state overflows), **all-full** should retain recall (exact but expensive), and the **3:1 hybrid** should recover most of full-attention's recall thanks to its single global layer — i.e. sit near the full-attention quality line at a fraction of the memory.

**Directional benefit = TRUE iff** hybrid uses far less KV memory than full **AND** retains recall much closer to full than pure-linear does, at matched parameter budget.

## 5. Method (DESIGNED → to become RUNNING)

- **Task:** synthetic **associative recall** (MQAR-style). Sequence = interleaved (key, value) token pairs, then a QUERY marker + one key; supervise only the answer position. 64 distinct keys, 8 value classes (chance = 1/8 = 0.125). Increasing #pairs / seq length stresses fixed-state capacity — the task that discriminates linear from full attention.
- **Training protocol:** *variable* sequence length each step (#pairs sampled 4..12), warmup+cosine LR — so the model learns position-robust recall, not one fixed length. Identical data stream, init RNG, optimizer and step budget across all three configs.
- **Length-extrapolation eval** (the sharp discriminator): eval at #pairs = 8, 12 (in-distribution) and **24, 48 (beyond training length)**. A fixed-state linear layer should degrade fastest as eval length exceeds training length; a full-attention layer should hold. If the 3:1 hybrid's single full layer rescues extrapolation recall, that is the directional benefit.
- **Configs at matched param budget** (same d_model, heads, head_dim, projections):
  1. `pure_linear` — 4 gated-linear layers.
  2. `hybrid_3to1` — 3 gated-linear + 1 full (periodic).
  3. `all_full` — 4 full-attention layers (quality ceiling / memory-worst reference).
- **Metrics:**
  - **KV-cache bytes** per config at seq L ∈ {32,64,128,256,512}: full layer = 2·L·nh·hd·4B; linear/gated layer = fixed state nh·hd·hd·4B (L-independent). Report bytes + hybrid-vs-full reduction %.
  - **Recall accuracy** at eval L ∈ {32,64,128,256} after identical training budget.
  - **Param count** per config (confirm matched to <~2%).
- **Controls:** fixed seed, identical optimizer/steps/data across configs, CPU, single process.

## 6. Honest boundary (stated up front)

- Toy scale (~1e6 params, ≤256 ctx) will **not** reproduce Moonshot's 75%/6.3× at 1M/5.7T. If our hybrid shows *directional* memory savings with retained recall, that supports the *design choice* — it does **not** validate their magnitudes.
- If the ratio shows **no** quality benefit at toy scale, the honest verdict is **scale-gated**: the mechanism may only pay off at long context / large model, and we say so rather than inflating.
- The memory result (H1) is largely **arithmetic** and will hold by construction; the *real* test is H2 (does 1 full layer in 4 actually rescue recall?).

## 7. Deliverables

- This spec (`KDA_HYBRID_EXPERIMENT_SPEC.md`).
- `kda_hybrid_experiment.py` — runnable CPU micro-experiment.
- `kda_hybrid_results.json` — measured param counts, KV-cache table, recall table, verdict.

## 8. RESULT (RUNNING — measured 2026-07-17, CPU, env sov33ft)

Config: 3 layers d=128, 4 heads, ~615,754 params **matched across all three configs** (0.0% spread). 3000 steps, bsz 64, variable train length 4–12 pairs, lr 2e-3 cosine. Loss plateaued at ~1.6 for all three (below the 1/8-chance floor ln8=2.08 → the task WAS learned). Identical seed / data / optimizer / budget per config.

**H1 — Memory (CONFIRMED, arithmetic):** the 3:1 hybrid keeps a growing KV cache in only 1 of 4 layers. KV-cache reduction vs all-full: **36% @L=32 → 72.6% @L=512**, approaching the paper's 75% figure *by construction* as L grows (this is geometry, not a claim of their result).

**H2 — Quality (NOT SUPPORTED at toy scale):** recall by #pairs (chance 0.125):

| config | 8 | 12 | 24 | 48 (4× train len) |
|---|---|---|---|---|
| pure_linear | 0.349 | 0.300 | 0.235 | **0.192** |
| hybrid_3to1 | 0.345 | 0.294 | 0.242 | **0.192** |
| all_full | 0.331 | 0.270 | 0.183 | **0.161** |

All three learned partial recall to the **same** level and degraded **identically** with extrapolation length. Full attention was **not** better than linear here — marginally *worse* at the longest eval (full−pure = **−0.031** at 48 pairs). With no linear-vs-full quality gap, the hybrid's single full layer had **nothing to recover**.

**VERDICT: `ratio_helps_at_toy_scale = FALSE`.** The memory saving is real and arithmetic; the RATIO's *quality* premise — that periodic full attention rescues recall a fixed-state linear leg loses — **does not reproduce at ~0.6M params / ctx ≤ 98**. This is consistent with the benefit being **SCALE-GATED**: Moonshot's advantage lives at 1M context / multi-trillion-token scale, exactly the regime a CPU toy cannot enter. We tested the ratio's *direction* and, honestly, at our scale it does not appear — we do **not** claim their 75%/6.3× as ours.

**Caveats (do not over-read the null):** (a) our linear leg is plain elu+1 linear attention, **not** KDA's gated-delta/DPLR rule — a gated-delta leg loses *less* long-range info, which would only *shrink* the gap a full layer could fill, so this does not rehabilitate the ratio at toy scale; (b) ctx ≤ 98 never enters the long-context regime where full attention's exactness dominates; (c) a single seed. The honest, defensible statement: **at reproducible CPU toy scale the 3:1 memory win holds by construction, the quality win does not materialize, and pursuing it is only justified once we can test at long context on real GPU scale — not asserted from the paper.**
