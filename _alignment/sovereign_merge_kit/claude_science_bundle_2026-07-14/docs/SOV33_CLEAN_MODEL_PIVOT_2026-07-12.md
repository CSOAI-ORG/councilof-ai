# SOV33 — Pivot to a CLEAN MODEL on top of OWEM stacks

## The honest answer to Claude-science's "wrapper" question

Per `SOV33_OWEM_REALITY_2026-07-12.md`:

> SOV33 is MORE than a wrapper: it owns a trainable world-predictor (verified learning) + an EWC-structured consolidation layer + a growth controller + governance gates. It is NOT yet a competitive foundation model — the sovereign-owned weights are small/toy scale.

So: **we have sovereign weight ownership, but at toy scale.** To "hit new T" we need sovereign weight ownership at **LM scale**.

## What we have TODAY (12 Jul 2026)

| Component | Status | Sovereign-owned? | Scale |
|---|---|---|---|
| Frozen base (Qwen3-0.6B) | ✅ Trained | NO (open source) | 0.6B |
| LoRA adapter | ✅ Trained (87.54% accuracy) | YES (own training) | 168MB |
| Merged model | ✅ Saved | YES (own merge) | 2.4GB |
| Q4 GGUF | ✅ Exported | YES (own quantization) | 891MB |
| JEPAPredictor | ✅ Own weights, learns | YES | 16→32→16 (TOY) |
| EWC consolidation | ✅ Real structure | YES (proxy Fisher) | — |
| 4 OWEM routing groups | ✅ E2E wired | PARTIAL | 1 sovereign, 4 cloud |
| 5 OWEMs (compliance/defense/intuition/voice/general) | ✅ 1 trained, 4 pending | PARTIAL | 200 samples × 4 |
| Memory (sovereign) | ✅ Live | YES | file-based |

## What's MISSING for a TRUE sovereign model (the pivot path)

To move from "sovereign substrate with toy own-weights" → "sovereign model at LM scale", we need:

### 1. Sovereign Brain at LM Scale (NOT 0.6B)
- Today: Qwen3-0.6B (frozen) + LoRA adapter
- Need: 1-4B sovereign-owned base model, trained from scratch (or heavily adapted)
- Path: Train Qwen3-4B or Llama-3.2-1B with FULL sovereign data
- OR: Distill a sovereign 1B model from a frontier teacher
- Cost: ~50 GPU-hr on Kaggle T4 (we have 30hr/wk)

### 2. Independent Sovereign Tokenizer
- Today: Uses Qwen3's tokenizer (under open license)
- Need: Train a sovereign tokenizer on sovereign-specific vocabulary (charter terms, SIGIL chain, BFT-33, Article 0)
- Path: SentencePiece + 32K vocab from sovereign corpus
- Cost: ~2 GPU-hr on Kaggle

### 3. Sovereign Attention at Real Scale
- Today: Uses HF transformers (Qwen3 attention)
- Need: Sovereign-owned attention layer (e.g., Mamba-2 SSM) trained from scratch
- Path: Mamba-2 paper reproduction on sovereign data
- Cost: ~10 GPU-hr on Kaggle

### 4. 4 Sovereign Experts (not 1)
- Today: 1 sovereign (compliance) trained, 4 cloud-routed (Oracle)
- Need: All 4 sovereign experts trained (compliance, defense, intuition, voice)
- Path: Colab T4 + existing Colab scripts
- Cost: ~16 GPU-hr (4 × 4hr each)

### 5. Sovereign World Model at Transformer Scale
- Today: JEPAPredictor 16→32→16 (toy)
- Need: 64-dim or 128-dim with multi-layer transformer
- Path: Extend JEPAPredictor to transformer-scale
- Cost: ~5 GPU-hr on Kaggle

### 6. Sovereign Memory Format
- Today: JSONL files (open format)
- Need: Sovereign-specific format with embedded SIGIL + Ed25519
- Path: Build sovmem binary format
- Cost: Mac-light (no GPU)

## The Pivot Sequence (12 Jul - end of month)

### Phase 1: Sovereign Tokenizer (12-14 Jul)
- Train SentencePiece on sovereign corpus
- 32K vocab, sovereign-specific tokens
- Test on compliance brain
- **Cost: 2 GPU-hr Kaggle T4**

### Phase 2: Sovereign Brain 1B (14-18 Jul)
- Distill Qwen3-4B into sovereign 1B model
- Full sovereign data (compliance + charter + Article 0)
- 100K samples, 3 epochs
- **Cost: 50 GPU-hr Kaggle T4**

### Phase 3: Sovereign Attention Mamba-2 (18-21 Jul)
- Implement Mamba-2 SSM from paper
- Train on sovereign corpus
- Replace HF attention in sovereign brain
- **Cost: 10 GPU-hr Kaggle T4**

### Phase 4: 4 Sovereign Experts (21-25 Jul)
- Train defense, intuition, voice experts (compliance already done)
- 100K samples each, 3 epochs
- **Cost: 16 GPU-hr Kaggle T4**

### Phase 5: Sovereign World Model (25-28 Jul)
- Extend JEPAPredictor to 64-dim with multi-layer
- Train on sovereign action trajectories
- **Cost: 5 GPU-hr Kaggle T4**

### Phase 6: Sovereign Memory Format (28-30 Jul)
- Build sovmem binary format
- Add Ed25519 signature to every memory entry
- Migrate existing memories
- **Cost: Mac-light**

### Phase 7: Sovereign Substrate v2 (30 Jul)
- Replace all open-source components with sovereign ones
- End state: 100% sovereign-owned weights + tokenizer + attention + memory
- **NEW T = 1-2B sovereign-owned, fully governed**

## The honest tradeoffs

- **Won't beat GPT-4/Claude on raw capability** — these are 1-100B+ models with massive training
- **Will match Qwen3-4B on sovereign tasks** — we have the data and pipeline
- **Will WIN on governance/auditability** — every response SIGIL-signed, care-floor 0.95
- **Will WIN on sovereignty** — independent tokenization + attention + weights
- **Will OWN trainable weights at LM scale** — closes the "wrapper" critique

## The pitch (honest)

> SOV33 is moving from "sovereign substrate with toy own-weights" → "sovereign model at LM scale". 4-6 weeks of GPU training, end state = 1-2B sovereign-owned, fully governed, with independent tokenizer + attention + memory. Not a frontier model. A SOVEREIGN model — different capability class.

## Difference from "HY3" / "STE3.7" / similar new releases

HY3/STE3.7 (if referring to new model releases with new architecture):
- They're NEW foundation models — bigger, smarter
- They're NOT sovereign — anyone can use them
- They have NO governance — no care-floor, no Article 0, no SIGIL chain
- They're NOT SWAP-persistent — when model changes, memory goes too

SOV33 (post-pivot):
- Sovereign 1-2B model — smaller than frontier
- 100% sovereign-owned weights + tokenizer + attention
- Governance FIRST: care-floor 0.95, Article 0, 12 Pillars, BFT-33, SIGIL
- SWAP-persistent: memory stays when model changes
- Growing by accretion on frozen base

Different capability class: not "smarter" but "more sovereign".

## Action items

1. **Nick approves the pivot sequence** (Phase 1-7)
2. **Build Phase 1: Sovereign Tokenizer** (Mac-light + 2 GPU-hr Kaggle)
3. **Build Phase 2: Sovereign Brain 1B** (50 GPU-hr Kaggle)
4. **Wire sovereign components into SOV33 substrate** (replaces open-source)
5. **Document and announce** the sovereign model release
