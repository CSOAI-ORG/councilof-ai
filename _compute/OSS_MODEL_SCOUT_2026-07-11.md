# 🔭 OSS model scout — what's out there, what SOV33 needs (M4, 2026-07-11)

Scouted the families Nick named (Hunyuan / Step / Kimi / Laguna) + the near neighbours. Honest
verdict up top: **the biggest win needed no new model at all — our existing Groq key already serves a
whole open-weight ladder.** We access frontier OSS via API, not by hosting (the Mac is 16 GB).

## ⭐ CONCRETE WIN (wired today): the Groq key is a model ladder, free, one key
`api.groq.com` on our current `GROQ_API_KEY` serves 17 models. Added to `sov33_compute` as tiers:
| tier | model | use |
|---|---|---|
| `fast` (default) | `llama-3.3-70b-versatile` | sub-second 70B — the brain default |
| `heavy` | **`openai/gpt-oss-120b`** | 120B open-weight for hard problems — verified |
| `reason` | **`qwen/qwen3-32b`** | visible chain-of-thought reasoning — verified |
| `cheap` | `llama-3.1-8b-instant` | bulk/cheap |
Call: `infer(prompt, tier="heavy")`. Also present on the key: `qwen3.6-27b`, `llama-4-scout-17b`,
`groq/compound` (agentic tool-use), `whisper-large-v3` (STT). **No re-keying — this is "what else is
there we need" answered from what we already hold.**

## The families Nick named
- **Kimi (Moonshot K2)** — open-weights 1T-MoE (~32B active), top-tier agentic/coding. Access: Moonshot
  API or OpenRouter (`moonshotai/kimi-k2`). NOT on our Groq key today. Local `.kimi` is the *kimi-code CLI*
  (a coding agent), not a raw inference endpoint. **Need:** an OpenRouter/Moonshot key to add it as an
  agentic tier — worth it, but a new key (hold per the no-sprawl rule until asked).
- **Hunyuan (Tencent)** — Hunyuan-Large (389B MoE) open; **Hunyuan3D-2** (image/text→3D mesh) is the
  relevant one: it feeds the Cesium **character/world/Hatch** pipeline. Access: HF Space or ComfyUI, needs
  a GPU (Colab T4 / HF ZeroGPU). **Need:** wire Hunyuan3D-2 on Colab to generate Hatch/world 3D assets —
  a real capability for the SovSpace body, GPU-gated not key-gated.
- **StepFun Step (2/3)** — trillion-MoE, multimodal; mostly API (`.stepfun` CLI on disk). Step-Audio is
  open. Lower priority — llama-70b + gpt-oss-120b already cover text; Step adds little we can't get.
- **Laguna** — **this is OURS**: the sovereign's own local code model, Tier 6 in the OLM router's fusion
  council (Kimi 20 / Opus 25 / DeepSeek 15 / Qwen 15 / Laguna 25), served on local Ollama. Not external.
- **DeepSeek-R1 / Qwen3** — the reasoning frontier. Qwen3 we now have (Groq, free). DeepSeek-R1 via
  OpenRouter (key present but no quota) — a re-key would add it; hold for now.
- **MiniMax-01** — 456B MoE, 4M context. API (`.minimax` CLI on disk). Niche (long-context); not needed yet.

## What SOV33 actually needs (ranked, honest)
1. ✅ **Model ladder on one key** — DONE (gpt-oss-120b heavy + qwen3 reason, no new keys).
2. **Hunyuan3D-2 on Colab** for real 3D Hatch/world assets — the one genuinely new capability, GPU-gated.
3. **Kimi K2 / DeepSeek-R1** as agentic + reasoning tiers — valuable but needs 1 new key each (OpenRouter
   or Moonshot). Deferred under the no-sprawl rule until the ladder is proven in use.
4. Everything else (Step, MiniMax) — nice-to-have, not needed; llama-70b/gpt-oss-120b/qwen3 cover it.

**Bottom line:** we didn't need to go fetch big models — the access we already have (Groq ladder + OCI
70B + local Qwen/gemma) covers frontier reasoning. The one real gap is **3D asset generation
(Hunyuan3D-2)** for the SovSpace body, which is GPU-work on Colab, not a model we host.
