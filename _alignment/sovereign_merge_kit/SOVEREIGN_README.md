# 🐉 The Local Sovereign — one command (2026-07-14)
A governed, signed, identity-safe local AI on the M4 (16GB), no cloud, no keys.

```bash
PY=~/.sovereign/ml-venv/bin/python
cd ~/clawd/_alignment/sovereign_merge_kit
$PY sovereign.py chat "im nicholas your sovereign"      # persona + identity guard
$PY sovereign.py ask  "does GDPR protect biometric data?"   # RAG-grounded, care-gated, SIGNED
```

## What it is (all verified this session)
- **Base:** `qwen2.5:3b` via Ollama/Metal, wrapped as the `sovereign` persona (Modelfile: `Sovereign-3b.Modelfile`).
- **Identity guard** (`sovereign_chat.py`): deterministically blocks the small-model "I am Nicholas" slip.
- **Knowledge** (`sovereign_kb.py`): 20 accurate governance facts — facts come from retrieval, not the weights.
- **Care-gate:** NLI model (`nli-deberta-v3-small`) drops contradicting proposers — reliable, unlike an LLM judge.
- **Signing:** every `ask` decision Ed25519-signed + offline-verifiable (`sov33_ed25519_sigil.py`).
- **Fusion/robustness proofs:** `sov33_council_fusion.py`, `sov33_bft_vs_moa*.py` (care-BFT 79× more robust than vanilla MoA).
- **Expert routing** (`sov33_owem_router.py`): route to OWEM adapters (merging them fails — routing works).
- **MLX** (`../MLX_SETUP_2026-07-14.md`): 4-bit quant = 4.2× smaller / 2.6× faster (fits ~7B in 16GB).

## Honest limits
Small models = no frontier IQ; facts must come from RAG. Bigger local brain needs the OrbStack ~34GB reclaim
(owner) or free GPU (owner logins). 16GB RAM is the hard ceiling MLX makes efficient, not larger.
