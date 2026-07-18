# SOV33 OWEM Integration — 11 Jul 2026
## When training completes: wire own-weights brain

This is the bridge that turns SOV33 from "wrapper" to "actual OWEM".

## Architecture

```
                ┌──────────────────────────────────────┐
                │  SOV-OWEM Substrate (UNIFIED)         │
                ├──────────────────────────────────────┤
                │  Layer 0: DRUM heartbeat (sync)      │
                │  Layer 1: Sovereign binding (6 invs) │
                │  Layer 2: BFT-33 council (23/33)     │
                │  Layer 3: 4-anchor × 5-elder MoE     │
                │  Layer 4: SOVEREIGN BRAIN (own-weights)
                │  Layer 5: SIGIL chain (Ed25519)       │
                └──────────────────────────────────────┘
                                  ↓
                ┌──────────────────────────────────────┐
                │  OWEM Components (NEW)               │
                │  - JEPA-style world predictor         │
                │  - EWC continual learning             │
                │  - Open-vocabulary recognition        │
                │  - Sovereign-trained weights          │
                └──────────────────────────────────────┘
```

## What happens when training completes

When `~/.sovereign/models/qwen3-sov-compliance-0.6b/` is ready:

1. The model is loaded as a NEW brain tier (tier 4 = sovereign-trained)
2. The brain adapter wraps it for sovereign ops (care-floor + BFT + SIGIL)
3. It runs LOCALLY on Ollama (re-import the adapter into ollama via Modelfile)
4. Substrate RAG is used as context for sovereign ops
5. OWEM world predictor adds state awareness
6. EWC prevents catastrophic forgetting of training
7. Cheatsheet captures novel concepts

## Stages

| Stage | Status | Output |
|---|---|---|
| 1. Train Qwen3-0.6B on compliance corpus | IN PROGRESS (~4h) | qwen3-sov-compliance-0.6b |
| 2. Wire into Ollama as a sovereign model | After Stage 1 | sov-custom:qwen3-0.6b |
| 3. Brain adapter (care-floor + BFT + SIGIL) | After Stage 2 | sov_brain_adapter.py |
| 4. Sovereign ask uses own model first | After Stage 3 | own-brain-path |
| 5. Add 4 experts (defense, intuition, voice) | Stage 2 of SOV-OWM | 4 sovereign models |

## The honest test

After Stage 1, the test is:
- sovereign.ask("What is sovereign AI?") → uses qwen3-sov-compliance-0.6b
- Compare to qwen2.5:3b baseline + Llama-70B Oracle
- Sovereign-trained model should win on sovereign-specific tasks
- (it may LOSE on general knowledge - that's expected)

## What "not a wrapper" means

After Stage 1, SOV33 has:
- 1 sovereign-trained model (qwen3-0.6b-sov-compliance)
- 0 borrowed models in the sovereign-task path (still borrowed for general)
- 100% sovereign substrate (governance, gates, BFT, SIGIL, world model)

After Stage 2:
- 4 sovereign-trained models (one per expert)
- 100% sovereign substrate
- 0 borrowed models in sovereign-task path

The substrate is NO LONGER a wrapper when:
- All brains in the sovereign path are sovereign-trained
- World predictor uses its own embeddings
- EWC prevents forgetting of trained knowledge

## Current state (11 Jul 2026 ~18:08)

- Stage 1 training: 5% complete (10/200 iters)
- OWEM world predictor: working (loss decreasing)
- EWC: loaded 7 planets
- Open vocab: empty (will grow on novel inputs)
- Overnight cron: every 10 min, running successfully
