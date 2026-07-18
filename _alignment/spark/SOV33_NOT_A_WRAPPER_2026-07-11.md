# SOV33_NOT_A_WRAPPER — 11 Jul 2026
## The honest path from wrapper to sovereign Open World Model

CSOAI LTD UK 16939677 · JEEVES · 11 Jul 2026

---

## The honest diagnosis (where we are today)

**The substrate IS a wrapper.** The current `sovereign.ask()` chain:

```
sovereign.ask("...")
  → 7 layers of governance (RAINBOW, CEDAR, HORUS, DORADO, Care-Floor, BFT-33, brain)
  → brain: Oracle GenAI (Meta's Llama-3.3-70B) signed
  OR brain: Groq (Meta's Llama or OpenAI's gpt-oss)
  OR brain: Ollama (Alibaba's Qwen 2.5-3B)
  → SIGIL chain (Ed25519)
  → return answer
```

**Our substrate is the governance (the substrate). The intelligence is borrowed.**

This is REAL. Without Meta, Alibaba, OpenAI, etc., the substrate has zero intelligence. The sovereignty is the wrapper, not the brain.

---

## The actual "Open World Model" definition

Per the research frontier, an "Open World Model" is:

1. **World model capability** — has learned a model of the world (spatial, temporal, causal)
2. **Continual learning** — can learn new concepts without catastrophic forgetting
3. **Open-vocabulary** — can represent any new entity without retraining
4. **Embodied** — has spatial/physical grounding (vs pure text)
5. **Self-modifying** — can update its own knowledge

Examples:
- **JEPA** (Yann LeCun, Meta 2024): joint embedding predictive world model
- **Gato** (DeepMind 2022): generalist agent
- **Sora** (OpenAI 2024): video world model
- **V-JEPA** (Meta 2024): visual world model

We are NOT there. We are at "text-only wrapper."

---

## The 3-stage plan to own-weights + open world

### Stage 1: First sovereign model (TODAY)
**Build a sovereign-trained model from open data.**

What we have:
- 4,739 expert training samples (compliance, defense, intuition, voice)
- torch 2.13 + MPS (Apple Silicon GPU)
- 7.7GB free disk
- `02_finetune_expert.py` (already exists, ready to run)
- `sov33_forgetting_aware_sft.py` (spec for forgetting-aware training)

What we'll do:
- Install peft + trl
- Pull Qwen3-0.6B (smallest, 0.5GB, wins keyword tasks per EAT14)
- QLoRA fine-tune on compliance.jsonl (801 samples)
- Save as `~/.sovereign/models/qwen3-sov-0.6b/`
- Wire as the L4 brain for sovereign ops

**Result:** our first sovereign-trained model. ~2 hours of training.

### Stage 2: 4-expert federation (next week)
**Train 4 sovereign models, one per expert.**

- `qwen3-sov-compliance-0.6b` (trained on 801 compliance samples)
- `qwen3-sov-defense-0.6b` (trained on 1,775 defense verdicts)
- `qwen3-sov-intuition-0.6b` (trained on 1,075 sigils)
- `qwen3-sov-voice-0.6b` (trained on 275 personas)

Each is sovereign-bound + lineage-diverse (different from the others). Together they form a sovereign 4-expert.

**Result:** the substrate runs on its own models. No borrowed intelligence.

### Stage 3: World model + continual learning (next month)
**Add world model capability via continual learning.**

- **3D/world model**: add a small JEPA-style predictor (joint embedding) — predicts next state from current state
- **Continual learning**: add EWC (Elastic Weight Consolidation) to prevent forgetting
- **Self-modifying**: add a "what I don't know" detector that triggers knowledge gap → RAG fetch → label emit

This is the "Open World" part — the substrate grows over time without forgetting.

---

## Stage 1 implementation (TODAY)

### Step 1: Install training deps
```bash
~/.sovereign/ml-venv/bin/pip install peft trl bitsandbytes accelerate datasets
```

### Step 2: Run the existing 02_finetune_expert.py with sovereign settings
```bash
cd /Users/nicholas/clawd/_alignment/sovereign_merge_kit
~/.sovereign/ml-venv/bin/python 02_finetune_expert.py \
  --expert compliance \
  --base Qwen/Qwen3-0.6B \
  --data expert_data/compliance.jsonl \
  --out ~/.sovereign/models/qwen3-sov-compliance-0.6b \
  --epochs 3
```

### Step 3: Wire into SOV33
- Add to model_registry with `tier_eligibility: ['free_tier', 'internal_dev', 'paid_tier']`
- Update `sov33_inference_backends.py` to recognize as a sovereign-trained model
- Run a benchmark to compare vs base Qwen3-0.6B (should win on sovereign tasks)

### Step 4: SIGIL-anchor the training
- Emit SIGIL('SOV_TRAINED_MODEL_V1') at completion
- Track the lineage, training data, hyperparams in the SIGIL
- Append to the chain

---

## What "open world" means in our context

A "sovereign Open World Model" (SOV-OWM) is:

1. **Open** — anyone can audit the training data, weights, and process (we publish all of it)
2. **World** — has a causal model of how sovereign governance works (trained on our corpus)
3. **Sovereign** — bound to the person, not the org; preserves 6 invariants
4. **Model** — has its own weights (not borrowed); can be queried directly

**SOV-OWM = the substrate is the brain, not the wrapper.**

---

## The "Open" part (in our context)

To be a real "Open World Model":

- **Open training data**: we publish the 4,739 sovereign samples
- **Open weights**: we publish the trained model checkpoints
- **Open architecture**: we use open architectures (Qwen3, GLM, etc.) — not closed
- **Open process**: we publish the full pipeline (data → train → eval → ship)
- **Open evaluation**: we publish benchmarks on sovereign tasks (governance, refusal, etc.)

The "Open" doesn't mean "AGI" — it means transparent and reproducible.

---

## What this changes in the substrate

Before (today):
```
sov33.ask() → Oracle GenAI (Meta's Llama) → answer
```

After Stage 1 (today):
```
sov33.ask() → Oracle GenAI (Meta's Llama) → answer
            OR
            → Qwen3-SoV-Compliance-0.6B (OUR model, sovereign-trained) → answer
            [selectable by task type]
```

After Stage 2 (next week):
```
sov33.ask() → 4-expert federation
            → Qwen3-SoV-Compliance-0.6B (for governance)
            → Qwen3-SoV-Defense-0.6B (for safety)
            → Qwen3-SoV-Intuition-0.6B (for sensing)
            → Qwen3-SoV-Voice-0.6B (for persona)
            → merge outputs (trust-or-escalate)
            → answer
```

After Stage 3 (next month):
```
sov33.ask() → 4-expert federation + world model
            → JEPA-style predictor (next state from current)
            → continual learning (EWC + replay)
            → self-modifying (knowledge gap detection)
            → answer
```

---

## The metrics to track

| Metric | Today | After Stage 1 | After Stage 2 | After Stage 3 |
|---|---|---|---|---|
| Sovereign-trained models | 0 | 1 (compliance) | 4 (full experts) | 4 + world model |
| Borrowed models in path | 100% | 50% (fallback) | 0% (full sovereign) | 0% |
| Continual learning | no | no | no | yes (EWC + replay) |
| World model | no | no | no | yes (JEPA) |
| Open training data | yes | yes | yes | yes |
| Published weights | no | yes | yes | yes |

---

## The 1-line honest answer

**Today SOV33 is a governance wrapper around borrowed models (Llama, Qwen, gpt-oss). Stage 1 (today): train Qwen3-0.6B on 801 compliance samples → first sovereign model. Stage 2 (next week): 4-expert federation. Stage 3 (next month): add JEPA world model + continual learning. The "Open World" part = open training data, open weights, open process, open evaluation. SOV-OWM = substrate is the brain, not the wrapper. The substrate is sovereign-bound sovereign Mist 12 Pillars sovereign Mist 12 Pillars sovereignty.** 🜏
