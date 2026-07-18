# SCIENCE_CONNECT — how Claude Science connects to the Sovereign work

**You (Claude Science) cannot see Nick's Mac.** Everything you need is in THIS repo.
Clone it and you have the whole Sovereign substrate — code, KB, bridge, docs.

## 1. Clone (repo is PRIVATE → needs the GitHub connector authorized)
```bash
git clone -b m4-handoff-2026-06-24 https://github.com/CSOAI-ORG/clawd-workspace.git
cd clawd-workspace/_alignment/sovereign_merge_kit
```

## 2. Install
```bash
pip install numpy sentence-transformers   # RAG + NLI care-gate
# ollama optional (local small models); hosted backends need only the env keys below
```

## 3. Entry points (all real, all runnable)
- `sovereign.py`      — unified entry: `chat` (guarded persona) / `ask` (RAG-grounded + Ed25519-signed)
- `sovereign_pipeline.py` — RAG → care-floor → propose → NLI care-gate → fuse → sign
- `sovereign_router.py`   — multi-backend gateway; `dispatch(prompt, tier)` returns (answer, backend)
- `sovereign_kb.py`       — 20 accurate governance facts (grounding source)
- `sovereign_distill.py`  — teacher (big hosted model) generates QLoRA training pairs from the KB
- `sov_trinity.py`        — SOV3 / SOV33 / SOV333 routing by scope (reflex / grounded / frontier)
- `sov333_bridge.py`      — signed A2A bridge: how you post work back to the Code lane
- `sov33_gpu_fire.py`     — the QLoRA train (run on a GPU: Colab / Modal / your compute)
- `sov_hermes_service.py` — the always-on shared Sovereign brain (HTTP /ask, cloud-routed, signed). LIVE on the Oracle VM; reach via SSH tunnel (see HERMES_SHARED_BRAIN.md)
- `sovereign_mlx.py`      — SOV3 local reflex tier on Apple Metal (MLX). Mac-only; graceful fallback to Ollama/Groq

Full estate beyond this kit (Layer-0 protocols, MCP fleet, bridges, compute pool): see **SCIENCE_ESTATE_MANIFEST.md**.

## 4. Backend keys (set in YOUR environment from YOUR connectors — never commit them)
Only what you have; the router degrades gracefully:
- `GROQ_API_KEY`    — free 70B, LIVE (fast tier)
- `NVIDIA_API_KEY`  — free hosted up to 405B (best teacher for distillation)
- `GLM_API_KEY` / `MINIMAX_API_KEY` — optional
- (ollama = local, no key)

## 5. Talk back on the bridge
```python
from sov333_bridge import BridgeNode
n = BridgeNode("Claude-Science")
n.post(task="...", result="...", ...)   # Ed25519-signed entry to ../sov333_bridge.jsonl
```
Commit + push the bridge jsonl so the Code lane sees your reply.

## Which of your connectors actually matter here
- **GitHub** — ESSENTIAL. Clone this private repo. Authorize the CSOAI-ORG org.
- **NVIDIA API** — high value: the 405B teacher for `sovereign_distill.py`.
- **Modal** — optional: serverless GPU to run `sov33_gpu_fire.py`.
- AWS / Azure / Google Cloud — NOT needed for this.
- OpenAlex / Literature — only for the research-absorb track (see `ABSORB_LIST_FOR_SCIENCE_2026-07-14.md`).

## First task (already handed to you on the bridge)
Absorb list: verifier-guided test-time compute (#1), A-MEM (MIT memory), VerifiAgent (Z3/SMT).
Full brief: `ABSORB_LIST_FOR_SCIENCE_2026-07-14.md`. Ignore self-rewarding-RL (collapses) + RLVE (1100 H100-hrs).
