# 🐉 Coordination architecture — cited verdict (2026-07-14)
_Deep-research wf_49f16a4d, 104 agents. Confirms the gateway+orchestrator+worker design; one honest NO._

## LIVE NOW (verified this session)
- **`sovereign_router.py`** dispatches to **Groq (free 70B) ✅**, ollama fallback. `sovereign.py ask` is now fused by
  the 70B, grounded in the 20-fact KB, care-gated, Ed25519-signed. Runs off the Mac.
- **NVIDIA key = 403 rejected** (owner must re-check/regenerate at build.nvidia.com — the value is refused, not a format issue).

## What the research validated
- **Gateway:** LiteLLM proxy/Router is the mature version of our router — one OpenAI-compatible endpoint over 100+ providers
  (incl. NVIDIA NIM, Groq, Ollama) with cost/latency/least-busy routing, retries, cooldowns, ordered fallback.
  Our `sovereign_router.py` is the same pattern; **LiteLLM is the production upgrade** when we outgrow it. (docs.litellm.ai)
- **Orchestrator-worker:** LangGraph's Send API = master decomposes → N workers → synthesize. The right framework for
  you+Science coordinating a worker fleet. (OpenRouter is a simpler drop-in but does NOT front GLM/MiniMax/MiMo/NVIDIA-NIM/Ollama → LiteLLM wins.)
- **Off-Mac execution:** **Modal** — containerize + run remotely from one CLI call, serverless, per-second billing, fans out to
  thousands of isolated jobs. The correct replacement for the launchd sprawl that crashed the Mac. (modal.com/docs)
- **⛔ CONFIRMED INFEASIBLE:** "many Hermes on free GPUs training ONE model faster." Distributed training of a single model
  needs fast interconnect (NCCL over NVLink/InfiniBand) that isolated Colab/Kaggle sandboxes structurally lack. Only
  **embarrassingly-parallel INDEPENDENT jobs** work on free GPU. (DeepSpeed/FSDP docs)

## The honest architecture
you + Claude Science (orchestrators) → **LiteLLM/our router gateway** → worker fleet (Groq now; NVIDIA/GLM/MiniMax when keyed) →
each sandbox a signed Layer-0 node (`layer0_sandbox_bootstrap.py`) → Modal for long-lived off-Mac agents.
Mac only coordinates. Inference scales across providers; training stays small + parallel (not distributed).
