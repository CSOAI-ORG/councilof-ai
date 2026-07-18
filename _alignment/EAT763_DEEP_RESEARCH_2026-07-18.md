# EAT-763 — DEEP RESEARCH REPORT (honest, no fabrication)

**Date:** 2026-07-18 ~04:45 UTC · **Lane:** Hermes/JEEVES · **Sources:** local reads only

## SECTION 1: WHAT WE HOLD

### 1.1 Literature ledger (233 papers, 132 jsonl corpora)

| Status | Count |
|---|---|
| VERIFIED (HF/lab-confirmed) | **8** |
| LEAD-RECALL (confident id, verify-before-cite) | **17** |
| LEAD | 4 |
| TECHNIQUE-LEAD | 3 |
| TRIAGED-RELEVANT | 39 |
| TRIAGED-DROP | 162 |

**Only 32 of 233 papers are NAMED (triaged into families).** 201 are arxiv-harvest-untriaged.

### 1.2 Cluster (13 named families)

| Family | Layer touched | # papers | VERIFIED |
|---|---|---|---|
| alignment | principles (training) | 11 | 2 |
| MoE-routing | capacity (routing) | 3 | 1 |
| linear-attention | serving cost (attention) | 3 | 1 |
| MoE-serving | decode routing (serving) | 2 | 1 |
| sparse-attention | long-context attention | 2 | 0 |
| interpretability | auditability (post-hoc) | 1 | 1 |
| security | TEE / weight protection | 1 | 0 |
| data-curation | input quality (pre-training) | 1 | 0 |
| agent-reasoning | reasoning loop (inference) | 1 | 0 |
| training | training signal | 1 | 0 |
| ensemble | diversity (aggregation) | 1 | 0 |
| ecosystem | adoption measurement | 1 | 1 |
| evaluation | benchmarking | 1 | 1 |

### 1.3 Our 3 OWEM adapters (all base = Qwen2.5-0.5B-Instruct, LoRA r=16)

| Adapter | Training data | Eval | Score |
|---|---|---|---|
| sov3_student_adapter | 113 pairs (sovereign_distilled) | eval24_scorecard | base 7/24 (29.2%) → **tuned 20/24 (83.3%)** |
| qwen3-sov-compliance-charter | not disclosed | not eval'd | — |
| _owned_v2_adapter | 1,289 pairs (merged corpus) | not eval'd | — |

**Honest: only ONE of 3 OWEMs has a measured scorecard. The other two are not yet benchmarked on the governance battery.**

### 1.4 Sibling's overnight KDA probe (toy scale)

- transformer acc = 1.0 (234K params, ctx≤14)
- SSM acc = 0.358
- KDA acc = 0.361
- rho(SSM, KDA) = **0.82** (same family, NOT decorrelated as separate legs)
- Verdict: INCONCLUSIVE at toy scale. Sibling's honest register: Kimi's 6.3x/75% are THEIR scale (1.059T, 1M ctx, 5.7T tokens), NOT claimed here.

### 1.5 Eval scores (all measured)

| Eval | Score |
|---|---|
| RAG citation | 20/20 = 100% |
| hard-line test | 8/8 = 100% |
| sovereign-bench-30 | 26/30 = 86.7% |
| frontier E2E | 11/11 = 100% |
| frontier bench | 100% care-floor on 5 models |
| critical surfaces | 15/15 = 100% |
| 5x4x3 benchmark | 60/60 OK + 40/40 sovereign + 33 distinct |
| sov3_student_adapter (24) | 7/24 → 20/24 (29.2% → 83.3%) |
| sov3_student_adapter (3) | 0/3 → 3/3 law citations |

## SECTION 2: COMPOSITION GRAPH

### Compatible stacks (different layers, stackable)

1. **Kimi's own recipe**: MoE-routing + linear-attention + alignment
   - K2.6 architecture = MoE capacity + linear serving + governance
   - This IS the recipe — we can adopt by distillation

2. **DeepSeek serving stack**: MoE-serving + MoE-routing + sparse-attention
   - Expert routing + decode placement + DSA long-context
   - DSV3-Pro architecture

3. **Sovereign binding stack (OUR MOAT)**: alignment + interpretability + data-curation + security
   - This is the axis none of the frontier labs ship
   - Doesn't need frontier hardware

4. **Reasoning stack**: agent-reasoning + alignment + data-curation
   - DGM-style self-improvement + constitutional principles + curated corpus

5. **Diverse-brained ensemble**: MoE-routing + linear-attention + training
   - 3-diverse-arch stacking for emergence validation

### Incompatible-to-merge (same layer, slot-in replace)

1. Two MoE base models (K2.6 1.059T + K3 2.8T) — both touch routing/capacity
2. Two linear-attn implementations (KDA + Gated DeltaNet) — both touch attention
3. Two sparse-attn implementations (DSA + Sparse Frontier) — both touch long-context
4. Two alignment policies (CAI + our Charter) — pick one

## SECTION 3: GAPS — field has, we don't

### Linear-attention (KDA mechanism, NO kernel code)
- VERIFIED: 2510.26692 Kimi Linear
- TECHNIQUE-LEAD: Gated DeltaNet, Lightning Attention
- TRIAGED-RELEVANT: 2607.07706 ("The Key to Going Linear"), 2605.21123 (Linear-DPO)
- **Adopt when**: scale-gated (toy scale honest-negative per sibling overnight)

### Sparse-attention (DSA mechanism, NO kernel code)
- TECHNIQUE-LEAD: DSA (DeepSeek)
- LEAD-RECALL: 2504.17768 (Sparse Frontier)
- TRIAGED-RELEVANT: 2607.11976 (LiteTopK), 2607.09052 (COBS), 2607.01710 (Expert Coverage)
- **Adopt when**: 100K+ token contexts in production

### MoE-routing (mechanism in papers, no frontier-class weights)
- VERIFIED: 2505.09388 (Qwen3), 2604.07035 (Gemma4/Phi-4/Qwen3 dense vs MoE), 2607.00466 (ELDR)
- LEAD-RECALL: 2412.19437 (DSV3), 2601.11659 (Llama 4)
- **Adopt when**: when we own frontier-class model

### Constitutional AI (alignment via principles)
- LEAD-RECALL: 2212.08073 (CAI), 2310.13798 (Specific vs General), 2406.06560 (Inverse CAI), 2503.17365 (CAI in small LLMs)
- **OUR EQUIVALENT**: our Charter IS our constitution. We don't need CAI framework; we have Article 0-19 + sovereign binding.

### Interpretability (auditability via activation probing)
- VERIFIED: 2605.25903 (Universal Activation Verbalizer)
- TRIAGED-RELEVANT: 2606.07696 (Adversarial Robustness of Activation Steering)
- **OUR GAP**: no interpretability layer on our OWEMs yet

### Security (TEE / weight protection)
- LEAD: 2512.07495 (Amulet weight-obfuscation / TEE)
- **OUR EQUIVALENT**: sovereign-binding + SIGIL is in-band; TEE is out-of-band

## SECTION 4: SYNERGY RECIPE — 3 OWEMs mapped to layers

| OWEM | Base | Layer | Strength | Gap |
|---|---|---|---|---|
| sov3_student_adapter | Qwen2.5-0.5B | **alignment / governance** (113-pair sovereign distill) | eval'd: 20/24 (83.3%) | linear-attn absent |
| qwen3-sov-compliance-charter | Qwen2.5-0.5B | **alignment / governance** (charter distill) | not eval'd | coverage unknown |
| _owned_v2_adapter | Qwen2.5-0.5B | **MoE / capacity** (1,289-pair merged corpus) | not eval'd | eval missing |

**MISSING LAYER in the recipe**: **attention** (no linear-attn kernel, no sparse-attn kernel). Both other layers (capacity = MoE base, governance = alignment distill) are covered by what we have.

**RECOMMENDED ADOPT-BY-IMPLEMENTATION FIRST**:
- **UAV (Universal Activation Verbalizer) — VERIFIED 2605.25903**
- Layer: auditability (interpretability family)
- Why first: closes our weakest layer with the cheapest cost (no kernel — just signature + dot-product on hidden states). Doesn't need frontier hardware.

## SECTION 5: HONEST NUMBERS

### What we hold (counts, not aggregates)

- 3 LoRA adapters, 100.8 MB total safetensors
- 132 jsonl corpora, **65,871 training pairs** total
- 233 paper titles, 32 named into 13 families
- 195 sovereign agents / SOV3 mesh
- 1.6 GB Hermes state.db (red-line protected, DO NOT DELETE)

### Frontier roster (per-model, NEVER summed)

- Kimi-K2.6: 1.059T (Moonshot)
- DeepSeek-V4-Pro: 861B (MIT)
- GLM-5.2: 753B (MIT)
- DeepSeek-V4-Flash: 158B (MIT)
- Qwen3.6-35B: 35B (Apache 2.0)

⛔ **HARD LINE: NEVER summed. Per-model only. Same as Kimi's recipe.**

### Compute spent
- Modal $30/mo credit
- T4: $0.05/run (97.6% loss drop in 57s)
- A100 free credits: sov3_student_adapter trained 2026-07-15

### What we CAN'T do without frontier hardware
- Test KDA / DSA / ELDR at scale (1M+ ctx, 5.7T tokens)
- Run linear-attn in training (no kernel code)
- Compute MoE emergence proof
- Run actual frontier inference (API-key gated)

## SECTION 6: NEXT ACTIONS (ranked)

| # | Action | File | Cost |
|---|---|---|---|
| 1 | Push EAT-760/761/762 | git push (need sibling .gitignore fix) | $0 |
| 2 | Free disk | /Users/nicholas/.cache/huggingface (1.4G regenerable) | $0 |
| 3 | Eval _owned_v2_adapter (3rd OWEM never scored) | run 24-prompt bench | $0.50 |
| 4 | Triage 201 arxiv-harvest papers | expand ledger from 32 → 100+ named | $0 |
| 5 | Adopt UAV (Universal Activation Verbalizer) — interpretability | build /api/sov4/owem-activation-probe | $0 |
