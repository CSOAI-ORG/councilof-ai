# Composition Graph — how the 233 clustered techniques STACK vs CONFLICT (2026-07-18)

Finer per-family layer under `BLEEDING_EDGE_TECHNIQUE_MAP_2026-07-18.md`. Do not read as
part-assembly — we hold paper **titles**, not weights or kernels. This maps *compatibility*:
which families touch **different** layers (so they compose) vs the **same** layer (pick one).

Honesty register: RUNNING vs DESIGNED vs measured-NEGATIVE is called out inline. Paper efficiency
numbers are *their* scale, not ours. Our own KDA/SSM linear-attn test was **NEGATIVE at toy scale**.

## Family clustering (233 papers, one family each)

| family | n | layer it touches |
|---|---|---|
| linear-attention | 4 | attention-layer |
| sparse-attention | 5 | attention-layer |
| MoE-routing | 4 | capacity-layer |
| quantization | 3 | capacity/serving-layer |
| serving-optimization | 18 | serving-layer |
| distillation | 8 | training-layer |
| retrieval-RAG | 3 | serving/context-layer |
| alignment-safety | 45 | governance-layer |
| agents-reasoning | 66 | orchestration-layer (application, above the stack) |
| other | 77 | not a merge leg (data-curation, ecosystem, multimodal geometry, misc) |

## The layer stack (the composition rule)

**Rule: same layer = pick ONE. Different layers = STACK.** A single forward pass touches each
layer once; two techniques that rewrite the *same* layer can't both own it.

```
[ orchestration-layer ]  agents-reasoning         (application, above the model)
[ governance-layer    ]  alignment-safety         care-gate / SIGIL / currency-gate / consensus-log
[ serving-layer       ]  serving-optimization, RAG-retrieval, quantization(inference)
[ capacity-layer      ]  MoE-routing              (which/how many experts fire)
[ attention-layer     ]  linear-attention  XOR  sparse-attention  XOR  full-attention
[ training-layer      ]  distillation, quantization(training/MXFP), LoRA
```

## STACK pairs (different layers → compose)

These compose because each rewrites a different layer. One legal end-to-end config picks at most
one technique per layer and lets the rest stack:

1. **MoE-routing (capacity) + linear-attention (attention)** — Kimi Linear / Ling 2.5 already ship this exact stack (hybrid attn under an MoE). Different layers → compose.
2. **MoE-routing (capacity) + serving-optimization (serving)** — ELDR / MoETuner / expert-locality decode routing sit *on top of* the MoE, at the serving layer. Compose.
3. **linear-attention (attention) + serving-optimization (serving)** — linear/SSM attn shrinks the KV state; prefix-caching & speculative decode still apply above it. Compose.
4. **distillation (training) + MoE-routing (capacity)** — distill a dense/large-MoE teacher into our MoE base; training vs capacity layer. Compose.
5. **distillation (training) + linear-attention (attention)** — "analysis-driven linearization" distills a full-attn teacher into a linear-attn student. Compose.
6. **quantization-training (MXFP4/8, training) + MoE-routing (capacity)** — low-precision training of the MoE weights; training layer under capacity. Compose.
7. **quantization-inference (serving) + serving-optimization (serving)** — CAUTION: both serving-layer; compose only if they touch *different* sub-stages (weight quant vs KV-cache/scheduling). Same sub-stage → conflict.
8. **alignment-safety (governance) + everything below** — care-gate / SIGIL / currency-gate wrap the whole stack; governance is orthogonal to attention/capacity/serving. Composes with all.
9. **agents-reasoning (orchestration) + everything below** — the agent loop calls the model; it sits above and composes with any inner config.
10. **retrieval-RAG (context) + serving-optimization (serving)** — RAG feeds context in; caching/scheduling serve it. Compose (adjacent serving sub-layers).

## CONFLICT sets (same layer → pick ONE)

1. **linear-attention XOR sparse-attention XOR full-attention** — all three rewrite the **attention layer**. Our measured finding: KDA and SSM are **ρ=0.82 both-linear-attention** — near-collinear, so running *two* linear-attn legs buys almost nothing. **Only ONE linear-attention leg.** And linear-attn vs sparse-attn is one-or-the-other per layer (a hybrid *ratio*, e.g. Kimi's 3:1, is still a single attention-layer design choice, not two stacked legs).
2. **MoE-routing designs** — one router / expert-parallel scheme per model. DeepSeek-V3 vs Qwen3 vs Llama-4 routing are alternatives, not additive.
3. **serving-optimization schedulers** — one decode-routing / PD-disaggregation scheme owns the serving path; ELDR vs MoETuner vs generic speculative decode = pick one per deployment.
4. **quantization scheme per tensor** — one precision format per weight/activation tensor (MXFP4 vs INT8 vs AWQ); they don't stack on the same tensor.

**n_stack = 10 composing pairs, n_conflict = 4 conflict sets.**

## The honest GAP-LIST (buildable EAT list)

### HAVE (on disk, RUNNING or present as artifact)
- MoE-capable base — Qwen2.5 (MoE-capable). NOTE: qwen3:30b-a3b is DESIGNED for the 192GB M4; confirm pulled before calling the 30B live.
- LoRA adapters (slot-in at fine-tune)
- care-gate (governance-layer)
- SIGIL attestation (governance-layer)
- currency-gate (governance-layer)
- consensus-log (governance-layer)
- distillation pipeline (training-layer)

### FIELD-HAS-WE-DON'T (from the ledger, we hold titles not kernels)
| gap | family/layer | tag | why |
|---|---|---|---|
| KDA kernel (gated-delta linear attn) | linear-attention / attention | **adopt-at-scale** | our KDA/SSM test was measured-NEGATIVE at toy scale; ρ=0.82 collinear with existing linear leg — one linear-attn leg is enough, pays only at large scale |
| DSA (DeepSeek Sparse Attention) / LiteTopK indexer-topk | sparse-attention / attention | **adopt-at-scale** | sparse-attn wins are long-context; needs a fused kernel we don't have, and only ONE attention-layer design fires anyway |
| MXFP4/8 low-precision training | quantization / training | **adopt-at-scale** | training-layer, composes with MoE — but the payoff is large-run FLOP/memory; toy-scale gain is noise |
| prefix-caching / KV-cache reuse | serving-optimization / serving | **adopt-now** | cheap, framework-level, compatible today, composes with any inner config — no retrain |
| speculative decoding (cost-aware, MoE-aware) | serving-optimization / serving | **adopt-now** | drop-in at serving layer, composes with MoE; ELDR/MoETuner-style expert-locality routing is the same slot |
| inference-time weight quantization (INT8/AWQ) | quantization / serving | **adopt-now** | post-hoc, no retrain, shrinks the served model today |

### The buildable EAT (ordered)
1. **adopt-now (do today, cheap, composes):** prefix-caching, speculative decoding, inference-time quantization — all serving-layer, no retrain, stack on the current MoE base under the governance gates.
2. **adopt-at-scale (only pays large, hold until then):** KDA kernel, DSA sparse-attn, MXFP4 training. Each is an attention/training-layer rewrite whose gain is scale-dependent; our own toy-scale KDA test was NEGATIVE, so building the kernel now would be effort spent ahead of the payoff.

Held boundaries: no param-summing across models; no emergence claim; 'cross-match' = compatibility mapping, not part-assembly.
