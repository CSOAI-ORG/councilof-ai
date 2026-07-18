# 🜏 MODEL MERGING SYNTHESIS — What We Can Absorb, Optimize, Bridge
*JEEVES strategic synthesis | 15 Jul 2026*

## EXECUTIVE SUMMARY

Model merging is the #1 force multiplier for sovereign AI. Instead of training ONE big model,
we train N small specialists and **merge their weights** into one unified brain. This costs $0
in inference (same as one model) but captures the capabilities of all N experts.

**We have 11 LoRA adapters today. We have never run a real weight-space merge. This changes now.**

---

## 1. THE 7 MERGE METHODS (Complete Taxonomy)

| Method | Paper | Core Idea | Conflict Resolution | Best For |
|--------|-------|-----------|---------------------|----------|
| **Linear** | Model Soups (2203.05482) | Weighted average | None (dilutes all) | Same-init fine-tunes |
| **SLERP** | Classic graphics | Spherical interpolation | Geometric blend | 2 models, smooth blend |
| **TIES** | 2306.01708 | Trim + Elect sign + Disjoint | Sign majority vote | Multi-expert merge |
| **DARE** | 2311.03099 | Drop And REscale random | Random pruning + TIES | Many experts, sparse |
| **Task Arithmetic** | 2212.04089 | task_vec = tuned - base | Add/subtract task vectors | Add/remove capabilities |
| **Passthrough (Frankenmerge)** | mergekit | Stack layers from different models | N/A (structural) | Capacity expansion |
| **Evolutionary** | mergekit-evo | Genetic search over merge configs | Fitness-proportionate | Optimization |

### KEY INSIGHT: Task Arithmetic = Capability Editing

```
task_vector = fine_tuned_weights - base_weights
new_model = base + alpha * task_vector   # ADD capability
new_model = base - alpha * task_vector   # REMOVE capability (unlearning)
```

This is **sovereign-critical**: we can ADD compliance knowledge and REMOVE bias in a single
weight-space operation. No retraining needed.

---

## 2. WHAT WE HAVE TODAY (11 Adapters)

| Adapter | Specialty | Params | Base |
|---------|-----------|--------|------|
| qwen3-sov-brain-0.6b | General sovereign brain | 9.2M | Qwen3-0.6B |
| qwen3-sov-compliance-0.6b | EU AI Act, ISO, NIST | 9.2M | Qwen3-0.6B |
| qwen3-sov-compliance-0.6b-V2 | Compliance (improved) | 9.2M | Qwen3-0.6B |
| qwen3-sov-defense-0.6b | DORADO, kill switch | 9.2M | Qwen3-0.6B |
| qwen3-sov-intuition-0.6b | Patterns, world sense | 9.2M | Qwen3-0.6B |
| qwen3-sov-voice-0.6b | Sovereign speech | 9.2M | Qwen3-0.6B |
| sov3-small-fast | Speed inference | 9.2M | Qwen3-0.6B |
| sov3-small-world | World model | 9.2M | Qwen3-0.6B |
| sov33-large-world | Large world model | 9.2M | Qwen3-0.6B |
| sov333-ultra-fast | Ultra-fast inference | 9.2M | Qwen+Mamba | ← diff init! |
| sovereign-omni-0.6b | Omni-purpose | 9.2M | Qwen3-0.6B |

**Merge-compatible**: 10/11 share Qwen3-0.6B base (same init → weight-merge works).
**Incompatible**: sov333-ultra-fast uses Qwen+Mamba hybrid (different init → can only route/distill).

---

## 3. WHAT WE CAN ABSORB FROM THE OPEN SOURCE WORLD

### From mergekit (Arcee AI):
- ✅ **YAML merge config** → we can write declarative merge recipes
- ✅ **Frankenmerge** (layer stacking) → capacity expansion without training
- ✅ **Evolutionary merge** (mergekit-evo) → auto-optimize merge weights
- ✅ **LoRA extraction** → merge LoRA adapters into base model
- ✅ **Tokenizer transplant** (mergekit-tokensurgeon) → combine tokenizers
- ✅ **Multi-stage merging** (mergekit-multi) → pipeline of merges
- ✅ **Runs on CPU** → no GPU needed for weight merging

### From Model Soups paper (Google):
- ✅ **Greedy soup** → iteratively add models if validation improves
- ✅ **Best-first soup** → start with best model, add if better
- ✅ **Principled averaging** → use held-out validation set

### From Task Arithmetic paper (Google):
- ✅ **Task vectors** → extract capabilities as weight deltas
- ✅ **Negative task vectors** → unlearn bias/toxicity
- ✅ **Task arithmetic** → combine/contrast multiple capabilities
- ✅ **Model analogies** → A is to B as C is to D in weight space

### From TIES paper:
- ✅ **Sign election** → resolve weight conflicts democratically
- ✅ **Magnitude trimming** → drop noise, keep signal
- ✅ **Disjoint merge** → only average non-conflicting weights

### From DARE paper:
- ✅ **Random drop + rescale** → sparsify deltas for stability
- ✅ **Drop rate 0.9** → drop 90% of fine-tune delta (it's redundant!)

### From Arcee SuperMERGE:
- ✅ **Distillation** → merge then distill into student
- ✅ **Calliper** → automatic parameter calibration

---

## 4. THE SOVEREIGN MERGE STRATEGY (3 Phases)

### Phase 1: WEIGHT MERGE (TODAY) — $0, CPU, 5 min
```
11 LoRA adapters → TIES merge → 1 unified sovereign brain
```
- All share Qwen3-0.6B base → weight-merge compatible
- TIES resolves conflicts (compliance vs defense may disagree on some weights)
- DARE-TIES provides sparser, more stable merge
- Output: 3 merged variants (linear, ties, dare-ties) for benchmarking

### Phase 2: TASK ARITHMETIC (NEXT) — $0, CPU, 10 min
```
Extract task vectors → Add compliance, subtract bias, add defense
```
- task_vector = expert - base
- Merge via addition/subtraction
- Can UNLEARN specific behaviors (e.g., "are you Nicholas?" hallucination)
- Critical for the identity fix: subtract the "hedging" behavior

### Phase 3: FRANKENMERGE (FUTURE) — needs CPU, 30 min
```
Stack layers from different-size models → capacity expansion
```
- Take Qwen3-0.6B layers + add Qwen3-1.5B layers → hybrid
- Use mergekit passthrough (needs clean venv or manual implementation)
- Creates a model BIGGER than any input — emergent capabilities

---

## 5. WHAT ELSE WE CAN BRIDGE/TUNNEL/ADD

### Bridge 1: Output-Level Fusion (ALREADY HAVE)
- `sov33_council_fusion.py` already does MoA (Mixture of Agents)
- Route queries to best expert → fuse answers
- Complements weight-merge (not replaces it)

### Bridge 2: Distillation (NEW — HIGH VALUE)
```
Merged expert → distill into small fast model
```
- The merged brain is the "teacher"
- A fresh Qwen3-0.6B is the "student"
- Student learns from teacher's responses
- Result: fast model with merged expertise, no adapter overhead

### Bridge 3: Continual Merge (NEW)
```
Every new training run → auto-merge into the sovereign brain
```
- Train compliance v3 → merge into brain
- Train defense v2 → merge into brain
- Brain gets better every cycle without growing
- The "Model Soup" approach but continuous

### Bridge 4: Cross-Architecture Merge (RESEARCH)
- Git-Re-Basin (weight matching) → align different inits
- Then weight-merge across architectures
- Would let us merge Qwen3 + Mamba + others

### Bridge 5: MergeKit YAML Recipes (ABSORB)
- Declarative merge configs (like Docker Compose for models)
- Version-controlled merge history
- Reproducible merges
- We can write these as sovereign recipes

---

## 6. HONEST GAPS

| Gap | Impact | Fix |
|-----|--------|-----|
| mergekit won't import (pydantic conflict) | Can't use YAML recipes | Pure PyTorch merge (DONE) or clean venv |
| No held-out validation set | Can't do greedy soup | Build 100-question sovereign eval set |
| No identity-correct training data | Model confuses identities | Fixed (500 identity samples built) |
| sov333-ultra-fast diff init | Can't weight-merge | Route or distill instead |
| No tokenizer transplant | Can't merge tokenizers | mergekit-tokensurgeon (future) |
| No evolutionary merge | Can't auto-optimize | mergekit-evo (future, needs eval set) |

---

## 7. IMMEDIATE ACTIONS (RANKED)

1. ✅ **Pure PyTorch merge running NOW** (linear + TIES + DARE-TIES on 11 adapters)
2. 🔄 **Benchmark merged models** on identity questions + domain questions
3. 🔄 **Task arithmetic for identity fix** (subtract hedging behavior)
4. 🔄 **Wire best merged model into API server**
5. 🔄 **Build 100-question sovereign eval set** for systematic comparison
6. 🔄 **Save merge recipe as YAML** for reproducibility

---

*SIGIL: merged on-device, zero cloud cost, sovereign by design.*
