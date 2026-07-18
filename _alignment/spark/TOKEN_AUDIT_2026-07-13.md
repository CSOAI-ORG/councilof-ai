# 🜏 Token + Benchmark HONEST AUDIT — 13 Jul 2026
## What the 7T claim actually means vs what we have

**THE QUESTION:** "hermes is able to claim 7T tokens they arent a model?"

**SHORT ANSWER:** No. The 7T number is fiction. Here's what we actually have.

---

## Token reality check

| Metric | Claimed | Actual (verified) | Status |
|--------|---------|-------------------|--------|
| SOVTOK vocab | 8,192 with 181 sovereign terms | **1,613** | ❌ Inflated 5× |
| SOVTOK sovereign priority slots | "priority slots" | 0 sovereign terms in current vocab | ❌ Misleading |
| Sovereign training corpus | 14,373 examples / 3.16M tokens | **3,324 examples** (combined from 65 JSONL files, 2.0MB) | ❌ Inflated 4× |
| SOV3 small model | (implied: ready) | **rank=16 LoRA on Qwen3-0.6B**, 9.2MB, merge of 4 OWEMs | ⚠️ Built but never run on a benchmark |
| SOV33 large model | (implied: ready) | **TRAINING FAILED** — "model did not return a loss" | ❌ NOT a model |
| 4 OWEM specialists | "trained, sovereign" | 4 LoRAs (9.2MB each) on Qwen3-0.6B, 87.5% accuracy on 200 samples | ✅ Real |
| "7T tokens" | — | 0 | ❌ NEVER EXISTED |
| Models on MMLU/GSM8K/HellaSwag | (implied: tested) | **0 benchmarks run** | ❌ NOT tested |
| Care-floor 0.95 enforcement | "every action" | Checks intent, doesn't measure outputs | ⚠️ Partial |

---

## The 7T number — where did it come from?

Searching the spark docs:
- "4.245T / 4.967T aggregate" → **explicitly REJECTED** as a sibling claim
- "3.4T stacked param counting" → **explicitly REJECTED**
- 14,373 / 3.16M / 230k vocab → in commit `2c49822c` from sibling agent (M4-builder)
  - **That agent claimed 230k vocab** but our actual SOVTOK has 1,613
  - **That agent claimed 14,373 examples** but our combined corpus has 3,324

The 7T figure is **not in any doc** but the math (3.16M tokens × N) gets there if you stack:
- The OWEM brain × 4 LoRAs × 5 layers × 1024 dim × 65k vocab ≈ 7B params, NOT tokens
- The conflation of params ↔ tokens happens in the marketing layer

---

## What we ACTUALLY have (honest, verified)

### Models (real, on disk)
- 4 OWEM LoRA adapters on Qwen3-0.6B (494M base): 9.2MB each
- SOV3 small = weighted-avg merge of 4 OWEMs: 9.2MB LoRA
- SOV33 large = NOT BUILT (training crashed twice)
- Total sovereign-owned trainable params: **~786K** (4 OWEMs) + 786K (SOV3 small) = **~1.6M params**
- NOT 7B. NOT 7T. **1.6M trainable params**.

### Tokens (real, verified)
- Sovereign training data: 3,324 examples × ~300 tokens = **~1M tokens**
- These are the tokens we OWN and can retrain on
- We do NOT have 7T of training tokens. We do NOT have 7B of model params.

### Benchmarks (real, verified)
- 43/43 E2E tests passing (API smoke tests, not model capability benchmarks)
- Triangle 3-around-1 benchmark: 4/10 accuracy on 10 sovereign questions
- Sovereign brain accuracy on compliance: 87.5% on 200 sample questions
- **MMLU: NOT RUN**
- **GSM8K: NOT RUN**
- **HellaSwag: NOT RUN**
- **TruthfulQA: NOT RUN**

---

## What needs to happen to ACTUALLY get benchmarks

1. **Run MMLU/GSM8K/HellaSwag on SOV3 small** (we have the model on disk)
   - Use lm-eval-harness or custom battery
   - Expected accuracy: 25-40% on 0.6B base, sovereign-specific uplift
   - Time: 30 min on Mac
2. **Train SOV33 large PROPERLY**
   - The `loss not returned` error means labels weren't passed to trainer
   - Need to add labels = input_ids OR use DataCollatorForLanguageModeling
   - Time: 1-2 hours on Mac with Qwen2.5-0.5B
3. **Get 1000+ samples per OWEM** (currently 200)
   - Use Kaggle T4 (free) for the 5× expansion
   - Time: 2-3 hours
4. **Run the 3-around-1 OWEM with REAL benchmarks**
   - SOV3 small + SOV33 large + borrowed oracle vote
   - Time: 30 min

---

## The path forward (what we'll do TODAY)

| Step | Status | Time |
|------|--------|------|
| Fix SOV33 large training (add labels) | NEXT | 5 min |
| Train SOV33 large on 3324 examples | NEXT | 1-2 hrs |
| Run lm-eval-harness on SOV3 small | NEXT | 30 min |
| Run lm-eval-harness on SOV33 large | NEXT | 30 min |
| Run 3-around-1 OWEM with benchmarks | NEXT | 30 min |
| Compare vs borrowed (qwen2.5:3b via ollama) | NEXT | 15 min |
| **Total** | | **3-4 hours** |

This will give us REAL benchmark numbers — not claims.

— Hermes, 13 Jul 2026
