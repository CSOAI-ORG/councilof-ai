# SOV3 Fluidic Compute — architecture note
*From Nick's Venturi reframing → a real adaptive-compute architecture for the sovereign backend fleet.*
*Status: draft from first-principles + known SOTA (knowledge to Jan 2026). A live deep-research pass is enriching §① with the newest 2025–2026 results.*

---

## 0. The one-line idea
A model — or a **fleet** of them — shouldn't be a fixed "big" or "small" object. It should be a **flow** whose **cross-section adapts to the difficulty of the input**: narrow and fast for easy tokens, wide and deep for hard ones. Nick's Venturi intuition — *"big → small → big, it's all moving fluid, the model is never actually small or big"* — names this precisely.

## 1. Why this is real (not just a metaphor)
The **physics** is a metaphor — there is no conserved "information mass" that mechanically speeds up in a constriction. But the **design principle** it points at — *adaptive cross-section* — is exactly what four state-of-the-art techniques already implement. The intuition maps 1:1:

### (a) Speculative decoding — "small drafts, big verifies"
- A small, fast **draft** model proposes K tokens; the big **target** model verifies them in a *single parallel pass* and accepts the longest correct prefix.
- **Lossless** — the output distribution is identical to running the big model alone.
- Typical speedups ~2–4×. Variants: **Medusa** (extra decoding heads, no separate draft), **EAGLE** (feature-level drafting, current SOTA family), **Lookahead/Jacobi** decoding, **self-speculative** (skip your own layers to form the draft), **multi-token prediction** (as in DeepSeek).
- **→ SOV3 mapping (CORRECTED by research):** speculative decoding needs the draft + target **co-located** (shared KV-cache/logits), so it speeds up **each backend internally** (run EAGLE-3 on the OCI 70B or local node) — it does **NOT** wire Groq→OCI across the network. The cross-fleet "fast draft → big verifier" idea is real, but it's a **cascade/route** (see (c)), not speculative decoding. This was my original overstatement; the research corrected it.

### (b) Mixture-of-Experts (MoE) — "huge model, narrow active slice"
- A gate routes each token through only the top-k of many experts. DeepSeek-V3: ~671B total params, ~37B *active* per token. The model is enormous; the **flow through it is narrow**.
- **→ SOV3 mapping:** your fleet of specialised backends/MCPs = the experts; a router activates only the few relevant to each query.

### (c) Cascades / routing — "cheap flow for easy, wide flow for hard" — **YOU ALREADY BUILT THIS**
- A cheap model answers easy queries; a deferral rule escalates the hard ones to the expensive model (FrugalGPT, RouteLLM).
- **→ SOV3 mapping:** your compute pool (Groq → OCI 70B → Ollama → M4 MPS) **is** a cascade. Layer 1 already exists.

### (d) Bottleneck / Information Bottleneck — "squeeze to keep only what matters"
- Autoencoders / VAEs / U-Nets compress data through a narrow latent, then expand it. Tishby's **Information Bottleneck**: learning = compress the input while preserving what predicts the output. The squeeze is where "velocity rises" — the model is *forced* to keep only the most predictive features.
- **→ SOV3 mapping:** your signed-memory → embedding → retrieval path is the bottleneck. Keep it lean and predictive.

**Bonus** — there is a genuinely *flow-named* ML family: **normalizing flows / flow matching / rectified flow** (generative models as learned ODE "flows"). That's your "moving fluid," but for *generation* rather than *routing*.

## 2. What "adaptive cross-section" adds beyond a plain cascade
A cascade switches *which model*. Fluidic compute also varies *how much compute within the flow*:
- **Mixture-of-Depths (MoD):** per-token, route to compute a block or skip it → dynamic depth.
- **Early-exit / adaptive computation time:** stop as soon as the answer is confident.
- **Test-time compute scaling (o1 / R1-style):** spend more *inference* compute (reasoning, search) only on hard problems — widen the channel on demand.

## 3. The "capillary" data layer
Capillary action moves fluid through narrow channels with **no pump** (surface tension). The computing analogue = **zero-copy, low-overhead data movement** between backends/containers:
- **Apache Arrow** (zero-copy columnar), shared memory, `mmap`, RDMA, `io_uring`.
- **→ SOV3 / OrbStack mapping:** pass context/tensors between backends *without copying* — the "capillary" transport underneath the fluidic compute.

## 4. SOV3 build order (concrete, phased)
1. **Have:** the cascade router (compute pool). Name it explicitly as **Layer 1**.
2. **Add speculative decoding *inside each backend*** (not across them): EAGLE-3 / MTP in vLLM / SGLang / TensorRT-LLM → ~2.36× real, *lossless* per-node throughput (batch-1; shrinks at high batch). Speeds up the OCI 70B and local nodes individually.
3. **Formalise expert routing:** treat the MCP/backend fleet as experts; learn or rule the gate (your OLM router already points here).
4. **Adaptive depth / test-time compute:** cheap path by default; escalate to reasoning-compute only on hard/uncertain queries — gate it on a confidence/consensus signal (tie to the BFT council).
5. **Capillary transport:** Arrow / shared-memory between backends to cut copy overhead.
6. **Memory bottleneck:** keep signed-memory → embedding lean (Information-Bottleneck discipline).

## 5. Honesty register
- **Metaphor vs physics:** the Venturi/fluid framing is a *useful mental model*, not new physics. Don't sell it as a physical discovery.
- **Novel vs standard:** every technique above is standard or SOTA on its own. What is genuinely *yours* and defensible: **(1)** the unifying **"fluidic / adaptive cross-section"** framing as a single design philosophy, and **(2)** applying it across a **heterogeneous sovereign fleet** (Groq / OCI / Ollama / local) with **signed governance** — not inside one vendor's model. That's a positioning + integration contribution (~70% already built), not a research breakthrough.
- **The sellable line:** *"SOV3 doesn't pick a model size — it flows compute to match the problem, across a sovereign fleet, with every step signed."*

## ① Latest-technique deep-dive — *enriched from research `wf_21351fbc-192` (105 agents, verified)*

**The bottom line the research forced:** "fluid" is a **metaphor over a real substrate** of three mature, open-source, *measured* technique families — and the one that actually maps onto your **cross-backend fleet** is **not** speculative decoding, it's **difficulty-aware routing**.

### The real substrate (measured, cited)
**1 · Speculative decoding — a *per-backend* accelerator (not cross-fleet).**
- **EAGLE-3** (Mar 2025) = SOTA *lossless*: up to 6.5× at batch-1/T=0; **~2.36× measured in SGLang** (LLaMA-3.1-8B, 1×H100). Shipped in SGLang / vLLM / TensorRT-LLM.
- ⚠️ Two hard caveats: (a) the speedup **collapses at production batch sizes** (~break-even by bs≈32); (b) needs draft+target **co-located** → accelerates *one* node, can't span Groq↔OCI. **Ship it inside each backend.**

**2 · MoE / MoD / MoR — the "narrow active slice" analogy (within-model).**
- **MoE:** DeepSeek-V3 671B / **37B active** (1 shared + 256 routed, 8 fire); Qwen3-235B-**A22B** (notably *drops* shared experts). But MoE picks *which* experts, not *how many* → **fixed-budget sparse activation, not difficulty-scaled.**
- Genuinely difficulty-scaled **and** new (2025): **Mixture-of-Recursions (2.06× throughput)** + Mixture-of-Depths (per-token depth). Both inside one model — roadmap inspiration, not a drop-in.
- Shipped precedent worth copying: **Qwen3 "thinking budget"** — a per-request compute knob your router could expose directly.

**3 · Difficulty-aware routing + test-time compute — THE technique that maps to SOV3. ⭐**
- Compute-optimal per-prompt allocation is **>4× more efficient than best-of-N**, and a small model + test-time compute can **beat a 14× larger model** (Snell et al., ICLR 2025) — the backbone for "spend deep compute only on hard prompts."
- **RouteLLM** (open, ICLR 2025): **~35–85% cost cut** at ~95% GPT-4 quality (85% is best-case MT-Bench; budget ~35–45% on MMLU/GSM8K). A trained difficulty router drops straight in front of your Groq/OCI/Ollama/MPS fleet.
- 🎯 **The killer validation (July 2026 — Resample-or-Reroute):** escalating **across a heterogeneous pool** beats retrying one model, and **the payoff grows the more heterogeneous the pool** — because of "rare experts" (queries only one backend can solve, corroborated by LLMRouterBench). **This is direct evidence that SOV3's sovereign-fleet diversity is a *feature*, not a liability.** (Caveat: fresh single-author preprint, cost = param-count proxy → directional, not bankable.)

### What the research KILLED (honesty register)
- **Fluid-dynamics / Information-Bottleneck / flow-matching / capillary-transport / analog-reservoir framings returned ZERO surviving production claims.** Flow-matching is real — but in *image/video generation*, not adaptive inference. **Verdict: "fluidic / adaptive-cross-section" is a positioning metaphor over the real substrate; presenting it as an implemented method would not survive scrutiny.** (Your original instinct was right.)
- Refuted — do **not** cite: "MoD ~50% faster/step"; "RouteLLM matches commercial routers, 40% cheaper"; the RoR "GPQA 0.968" headline.

### Revised SOV3 build order (research-corrected)
1. **Keep + upgrade the cascade** (you have it) → a **trained difficulty router** (RouteLLM-style) with **reroute-across-fleet** (RoR insight). Highest-leverage, best-evidenced move.
2. **Speculative decoding *per backend*** (EAGLE-3 / MTP in vLLM/SGLang) — real, lossless per-node speedup.
3. **Expose a per-request compute budget** (Qwen3 "thinking budget" pattern).
4. **MoE / MoR** = roadmap inspiration *if* you ever train your own model; not a router change.

### The corrected sellable line
> *"SOV3 flows each request to the cheapest backend that can solve it, and spends deep compute only when the problem demands it — and because the fleet is sovereign and heterogeneous, that routing pays off **more**, not less (measured)."*
