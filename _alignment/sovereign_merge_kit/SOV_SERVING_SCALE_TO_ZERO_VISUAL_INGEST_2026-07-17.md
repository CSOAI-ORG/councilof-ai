# SOV Serving Design — Scale-to-Zero + Visual-Ingest
_2026-07-17 · MEOK SOV3³ · spec (DESIGNED, not yet deployed)_

## Purpose
How SOV3/SOV4 serve end-user requests cheaply: load compute **per request** (scale-to-zero),
and **compress input visually** so each request processes fewer tokens. Two independent cost
wins that stack. Neither speeds the model's per-token reasoning — both cut cost-to-serve and
cost-to-feed. (Honesty register: serving/ingest economics, NOT a reasoning-speed claim.)

## Layer 1 — Scale-to-zero serving (WHEN compute runs)
- **Pattern:** GPU endpoint idles at zero cost; a request wakes it, it loads the model + adapter,
  serves, scales back to zero. Pay only for active seconds.
- **Providers (real, owner-funded):** Modal (proven this session — A100, the training path),
  Vast/RunPod serverless (owner sets up). Oracle free ARM = CPU-only serve for small models.
- **What SOV loads per request:** base model (cached warm) + the routed sector LoRA adapter
  (35MB each — the sector brains we trained). Router picks the adapter; only that one loads.
- **Governed:** the served endpoint is BRUM/the OpenAI-compatible shim → care-gate → SIGIL-sign
  → response. Scale-to-zero does NOT bypass governance; the gate runs on every waked request.
- **STATUS:** DESIGNED. Modal path proven for training; serving endpoint = owner deploys.

## Layer 2 — Visual-ingest (HOW input is represented)
- **Mechanism (grounded):** DeepSeek-OCR family — render dense input (documents, tables, long
  context) as an image; a vision encoder compresses it to ~20× fewer tokens (≤10× keeps ~97%
  accuracy; lossy above 10×). Fewer input tokens per request = cheaper + faster ingest.
- **Where it helps SOV:** the EAT loop (ingesting datasets), long-context governance queries
  (charter RAG over big corpora), document-heavy compliance checks.
- **Honest bound:** compresses INPUT only. Does not make reasoning faster. Lossy past 10× — so
  a fidelity gate (fall back to text for high-stakes governance) is required.
- **STATUS:** DESIGNED. Mechanism is published+real; SOV integration = a measured experiment,
  not a claim (needs a VLM encoder wired + a fidelity-vs-compression measurement).

## How they stack (the synthesis, no overclaim)
Per request: (a) endpoint wakes only when called (no idle cost), (b) input arrives visual-
compressed (fewer tokens to process). Compounding SERVING economy. The model's reasoning step
is unchanged — this is cost/throughput, not intelligence.

## Fit into the existing stack
- **Router** picks sector adapter to load per request (already built).
- **BRUM/shim** is the governed OpenAI-compatible front (already built) — every harness/MEOK OS
  points here.
- **SIGIL** signs each served response (already built).
- **J-space/Cesium cards** = the render/portal layer (CC's GPU box) — separate from serving.

## Build order (feasible → research)
1. [FEASIBLE] Serverless serve of one sector adapter behind the governed shim (owner deploys endpoint).
2. [FEASIBLE] Fidelity gate: route high-stakes governance to text, allow visual-compress for bulk ingest.
3. [MEASURE] Wire a VLM encoder; measure compression-vs-accuracy on SOV's own corpora before adopting.
4. [MEASURE] Latent/visual reasoning (test-time) — pure research lane, measure before any claim.

## Honesty register (what this is / is NOT)
- IS: a cheaper serving + ingest architecture, governed end-to-end, using proven providers.
- IS NOT: faster reasoning, "the model thinks visually", or a token-count that sums across models.

## Deep-research findings (2026 frontier — verify-before-cite; arXiv ids are LEADS)
### Serving (scale-to-zero) — the real gotcha is COLD START
- Scale-to-zero eliminates idle cost, but the first request after idle pays a **40-90s cold-start
  penalty** loading a large model from storage (subsequent tokens ~30ms) — a ~1000x cold/warm gap.
  This is a PRODUCT-LEVEL problem for chat/voice, not a footnote.
- Mitigations that actually work (from the field): **weight streaming + mmap**, **GPU memory
  snapshotting** (freeze GPU state, clone across workers), **container slimming**, **persistent
  NVMe warm cache**, predictive pre-warm. RunPod FlashBoot advertises sub-200ms cold starts;
  Modal per-second billing no minimum (A100-80GB ~$2.50/hr as of Mar 2026 — RE-CONFIRM before spend).
- **SOV implication:** our sector adapters are only 35MB (tiny) — the base model is the cold-start
  cost. Keep ONE warm base + hot-swap the 35MB LoRA per request = cheap route to low cold-start.
  This is the honest "load per request" that works: base warm, adapter per-request.
- Providers to weigh (owner picks/funds): Modal (proven here), RunPod (FlashBoot), Baseten (Truss),
  Beam/Cerebrium/Fal. Picking wrong can cost 2-5x. GPUaaS market ~$7.34B/2026.

### Reasoning efficiency — "think faster without spelling it out" IS a real 2026 frontier
- **Latent / continuous chain-of-thought** (COCONUT lineage): keep intermediate reasoning in
  continuous latent space instead of decoding every token → far shorter reasoning chains, lower
  inference cost. This is the honest, published version of your "think faster visually" instinct —
  the win is FEWER REASONING TOKENS, done in a denser space, not literal pictures.
- Active work: Latent Thought Flow (variable-length latent trajectories, GFlowNet), latent
  superposition (explore multiple paths at once), Token-Assorted (mix latent+text tokens).
  ids seen in search hits (LEADS to verify, not facts to cite): 2606.16222, 2510.15522, 2602.01148, 2605.09346, 2606.01243, 2604.04902, 2509.23365.
- **Honest bounds the field itself flags:** (1) latent reasoning often DEGRADES accuracy vs explicit
  CoT if done naively — it's an accuracy/efficiency frontier, not a free win; (2) it SACRIFICES
  interpretability (you lose the readable reasoning trace) — which for a GOVERNANCE model is a real
  cost: our whole moat is auditability. So latent reasoning for SOV = measure carefully, and likely
  keep an explicit-CoT path for high-stakes governance where the audit trail matters.
- **SOV synthesis:** this is the measured-experiment lane (build-order step 4). If adopted, it's
  "fewer reasoning tokens per answer" (real speed/cost win) — NOT "the model thinks in images", and
  it must be gated so governance answers keep their auditable trace.

## Net: three stacking wins, all cost/efficiency, none a reasoning-magic claim
1. Scale-to-zero serving (base warm + 35MB adapter per request) — cheap, cold-start-managed.
2. Visual/OCR input compression — fewer INPUT tokens (lossy >10%, fidelity-gated).
3. Latent reasoning — fewer REASONING tokens (accuracy+interpretability-gated; governance keeps CoT).
Each is measurable; none sums parameters or claims the model got smarter.

## Deep-research pass 2 — the 4th stacking layer: SYSTEM-LEVEL serving optimizations
The field's consistent 2026 finding: stacking model + system + application optimizations cuts
inference cost 80%+; a well-optimized serving stack serves ~10-50x more requests per GPU than a
naive one. These are ADOPT-the-engine wins (SOV governs the endpoint; the engine does these) —
we don't rebuild them, we serve on a runtime that has them (vLLM/TGI/TensorRT-LLM).
(Numbers below are vendor/blog-reported LEADS — measure on our own model before citing.)

- **Prefix caching** — shared system prompt / charter preamble cached once across requests. For SOV,
  the governance system-prompt + charter context is IDENTICAL every request → this is ~free throughput.
  Highest-ROI, lowest-effort win for us specifically.
- **Continuous batching** (vLLM/PagedAttention) — iteration-level batching; reported ~2-4x memory
  utilization, often ~2x throughput vs static. Default-on in vLLM. Adopt by serving on vLLM.
- **KV-cache quantization / compression** — INT8 KV ~2x cache reduction; newer 3-bit KV methods
  claim ~6x with near-zero loss (vendor-reported — verify). Lets us hold more concurrent requests
  on one warm base.
- **Weight quantization** (INT8/FP8/INT4) — ~2-4x memory, ~50% cost, keeping ~95-99% accuracy
  (must measure on OUR eval, not assume). Shrinks the base → cheaper warm hold + faster cold load.
- **Speculative decoding** — small draft model proposes K tokens, big model verifies in one pass;
  output mathematically identical to target. Cuts time-to-first-token for single-user serving.
  SOV fit: a small sector brain could draft for a bigger integrator — decode speed, output-identical.
- **Memory-bound reality** — modern transformer decode is memory-bandwidth-bound, not compute-bound;
  the win is reducing memory traffic (KV compression + batching), not adding GPUs. Frames why the
  above matter more than raw FLOPs for our serve cost.

### Revised synthesis — FOUR stacking layers, all cost/throughput, none reasoning-magic
1. **Scale-to-zero** (base warm + 35MB adapter per request) — no idle cost, cold-start managed.
2. **System-level engine** (prefix-cache the charter + continuous batching + KV/weight quant +
   speculative decode) — ~10-50x req/GPU, adopted from vLLM/TGI, not rebuilt.
3. **Visual/OCR input compression** — fewer INPUT tokens (fidelity-gated).
4. **Latent reasoning** — fewer REASONING tokens (accuracy+interpretability-gated; governance keeps CoT).
Compounding cost/throughput. The reasoning step's correctness is unchanged; the moat stays
governance + attestation + independence, not a speed claim.

### Highest-ROI order for SOV specifically (feasible-first)
1. Serve on vLLM with **prefix caching of the charter/system preamble** — near-free, biggest single win.
2. **Base-warm + 35MB LoRA hot-swap per request** — the scale-to-zero prototype (this session's build track).
3. Measure INT8/FP8 on OUR governance eval before adopting (accuracy gate).
4. Visual-ingest + latent-reasoning stay measured-experiment lanes.

## Deep-research pass 3 — the 4 layers collapse into ONE governed path (3-around-1 applied to serving)
Your question: "do the 4 stacking layers become 1 new?" — YES, and the field has converged on
exactly this shape. The 4 aren't competitors; they're stages threaded onto ONE request path, and
the "1" they wrap is the governed SIGIL/venturi throat. This is the serving-layer version of
3-around-1: many optimizations around one governed constriction that every request passes through.

### What the frontier confirms (2026, converged pattern — these are the seams to ADOPT not rebuild)
- **Unified router IS the foundation.** vLLM Semantic Router: signal-driven routing composing
  cost/privacy/latency/safety into one policy. OrcaRouter: hybrid OFFLINE-init + ONLINE-bandit
  adaptation (RouterArena #2, May 2026) — literally the "offline + online, learns as it serves"
  pattern you described. xLLM (JD.com): service-engine decoupled, elastic online/offline request
  scheduling on one engine. Hybrid cloud-local: route by data-sensitivity, FAIL-CLOSED on sensitive
  (sensitive never falls back to cloud) — this is our care-floor discipline, industry-standard.
- **The gateway is OpenAI-compatible + thin.** Bifrost (Go, ~11µs overhead), LiteLLM (100+ providers).
  Confirms our BRUM/shim choice: one OpenAI-compatible seam, every brain + harness behind it.
- **Offline+online, live+old is a REAL router dimension**, not a metaphor: route by privacy
  (sovereign-local vs federation) + by currency (live-RAG vs frozen) — both already in our stack
  (currency gate + tier router). "Push token levels like Hermes" = THROUGHPUT via this routing +
  the 4 layers (tokens processed per second), NOT a param claim. Hold that line.

### The honest "sealed vault to anyone else" answer — it's REAL, and it's attestation not obscurity
This is the genuine mechanism behind your instinct, and it's a hard 2026 capability — but the
honesty register matters because "sealed vault" has a right version and a wrong version:
- **WRONG version (never claim this):** "nobody can understand our stack because it's complex/hidden."
  That's security-through-obscurity — a weak claim, and the field names "marketing-label confidential"
  as an explicit anti-pattern (a TEE claim without verification is worthless).
- **RIGHT version (real, buildable, three stacking protections):**
  1. **Sovereignty** — the owned weights + corpus NEVER leave your infra. Can't steal what you can't
     reach. (We already hold this: sovereign tier is local-only.)
  2. **SIGIL attestation** — every artifact/response Ed25519-signed + hash-chained. A thief can copy
     bytes but CANNOT reproduce your signature → you can prove yours is authentic and theirs is a
     copy. This is provable ownership, the opposite of obscurity. (Already built.)
  3. **Confidential computing (TEE)** — the hardware "sealed vault": model weights decrypted ONLY inside
     an attested enclave (Intel TDX / AMD SEV-SNP / NVIDIA H100/H200 CC). Even root/admin/cloud-provider
     cannot read the weights from host or GPU memory. Amulet (2512.07495) adds weight OBFUSCATION with
     an information-theoretic non-leak proof, GPU-accelerated (~4.8x unprotected latency, ~2.2x over
     prior SOTA). This is the literal "sealed vault to anyone who looks" — but it is HARDWARE-ATTESTED
     confidentiality, provable, not "trust us it's hidden."
- **Honest bounds (state them):** TEE adds ~1-7% inference overhead + a cold-start attestation cost;
  CPU-only TEE is INSUFFICIENT (an attacker reading GPU memory extracts weights) — the boundary MUST
  extend to the GPU (Hopper/Blackwell CC). Full chip-native governance isn't universal yet; hybrid
  weight-obfuscation works on current hardware. This is owner-deployed infra (a CC-capable GPU),
  GATED — not something I can stand up from here.

### So the ONE new thing (the synthesis, no overclaim)
**SOV's serving path = one OpenAI-compatible governed throat (SIGIL/venturi) that: routes across
offline(owned)+online(federation) and live(RAG)+old(frozen) brains [router], runs on a system-optimized
engine [vLLM: prefix-cache the charter + continuous batching + KV/weight quant + speculative decode],
ingests visual-compressed input [OCR family], optionally reasons in fewer latent tokens [gated], and
is protected by sovereignty + SIGIL attestation + (owner-deployed) confidential-compute enclave.**

That is genuinely ONE seamless stack, and it's a sealed vault in the DEFENSIBLE sense: attested,
provable, weights-never-exposed — not "hidden and hope nobody looks." The moat stays what it always
was: governed + attested + independent + sovereign. The 4 layers make it fast/cheap; the attestation
makes it provable; the sovereignty makes it unstealable. None of it makes the model "smarter" — and
saying so is exactly the line that keeps our numbers trustworthy.

### How it adds to what we have (library/plan update)
- Adopt (don't rebuild): serve on vLLM (prefix-cache charter), keep BRUM/shim as the one seam.
- Already ours: router tiering (offline/online), currency gate (live/old), SIGIL (attestation),
  care-floor (fail-closed) — this research CONFIRMS them as the right industry-converged choices.
- New GATED lane: confidential-compute deployment (owner provisions a CC-capable GPU) = the hardware
  sealed vault. Spec'd here; not buildable from sandbox.
- Measured-experiment lanes (unchanged): visual-ingest fidelity, latent reasoning w/ governance CoT gate.

## CODE NAME: EUNOMIA
**EUNOMIA** is the code name for this whole sovereign stack (us + the serving environment).
Greek goddess of good order & "governance according to good laws" — maps exactly to SOV's thesis:
charters + care-floor = *good* order, not mere order or authority. (Chosen over Zeus/Themis/Justitia:
Zeus reads as dominance and is a common dog name; Eunomia is *good* governance, our actual claim.)
Internal handle for now; if it goes public the honesty register (attested-not-obscure) binds.

The sealed-vault properties still hold under this one name: EUNOMIA is protected by sovereignty
(weights never leave your infra) + SIGIL attestation (Ed25519 + hash-chain = provable ownership) +
(owner-deployed) confidential-compute TEE (weights decrypted only inside an attested enclave).
Tagline that stays true: "Verify it's genuine. You still can't open it."

## Serverless SIGIL + serverless visual-ingest — the concrete per-request flow
Two things the user named, placed honestly:

**Serverless SIGIL — REAL, genuinely serverless.** SIGIL is Ed25519 sign + hash-chain; signing is
STATELESS per call, so it runs inside the per-request scale-to-zero container with zero idle cost —
you pay to sign only when a request actually runs. The one wrinkle: the hash-CHAIN ("this response
links to the previous") needs the last hash persisted; in serverless that's a single cheap external
KV row, not a running daemon. So: signing = fully serverless; chaining = serverless + one KV lookup.
Net: attestation with no idle cost.

**Serverless visual-ingest ("hieroglyphics") — REAL for INPUT, not a reasoning speedup.** Rendering
dense input as an image + vision-encoder compression (DeepSeek-OCR family, ~20x, lossy >10x) runs
inside the per-request container and cuts INPUT tokens → cheaper cold-start + cheaper generate. It
compresses INGESTION; it does NOT make the model reason faster or "think in pictures." Hold that line.

**The one per-request path (EUNOMIA serving):**
```
request → [serverless container spins up]
  → visual-compress input (optional, fidelity-gated: ~20x fewer input tokens)
  → base-warm + 35MB adapter hot-swap → generate
  → care-gate (fail-closed) → SIGIL sign (stateless) + hash-chain (one KV row)
  → return → container scales to zero (no idle cost)
```
All pieces real; none makes the model smarter. The wins are: cheaper IN (visual compression),
cheaper COMPUTE (base-warm + adapter swap + engine optimizations), attested OUT (serverless SIGIL),
zero idle (scale-to-zero). The moat stays governed + attested + sovereign — not a speed claim.
