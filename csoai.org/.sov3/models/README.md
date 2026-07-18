# 🜏 SOV3 Models — The Sovereign Neural Core

**The 8+ local models that power the SOV3 sovereign substrate.**

---

## THE 8 ANCHORED MODELS

| # | Model | Size | License | Role |
|---|---|---:|---|---|
| 1 | **qwen3:30b-a3b** | 30.5B | Apache 2.0 | Main OOWM (Organic Open World Model) — left brain online |
| 2 | **deepseek-r1:7b** | 7B | MIT | Reasoning + math + logic — right brain online |
| 3 | **llama3.1:8b** | 8B | Llama 3.1 Community | General LLM (Sovereign) — bridge |
| 4 | **moondream:latest** | 1.7B | Apache 2.0 | Vision + spatial — MOM council (multimodal) |
| 5 | **qwen2.5:3b** | 1.9B | Apache 2.0 | Edge model (SOV3small) — for 7 GB sovereign OS |
| 6 | **gemma3:4b** | 3.3B | Gemma 3 | Multimodal edge — for SOV3small3 |
| 7 | **qwen3:0.6b** | 522 MB | Apache 2.0 | Fast classification (NPC, real-time) |
| 8 | **meok-sov3:latest** | 1.9B | Apache 2.0 | Custom SOV3 fine-tune (the sovereign blend) |

**Total: ~55 GB of sovereign local models (8 models, 0 foreign API calls).**

## THE 4 SOV3 BRAINS

| Brain | Primary Model | Engine | Latency |
|---|---|---|---|
| COMPLIANCE | qwen3:30b-a3b | MoE-LARGE online | 689ms |
| VOICE | meok-sov3:latest | Custom SOV3 | 450ms |
| INTUITION | moondream + meok-sov3 | MoM-LARGE offline | 495ms |
| DEFENSE | deepseek-r1:7b | Reasoning | 720ms |

## THE SOV3small3 EDGE STACK (7 GB total)

For edge deployment on MacBook Air / Raspberry Pi 5:

```bash
ollama pull qwen3:0.6b
ollama pull qwen2.5:3b
ollama pull gemma3:4b
ollama pull meok-sov3:latest
```

Total: **7 GB**, runs offline, zero foreign API calls.

## INSTALL

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull the 8 sovereign models
ollama pull qwen3:30b-a3b
ollama pull deepseek-r1:7b
ollama pull llama3.1:8b
ollama pull moondream
ollama pull qwen2.5:3b
ollama pull gemma3:4b
ollama pull qwen3:0.6b
ollama pull meok-sov3

# Verify
ollama list | grep -E 'qwen3|deepseek|llama|moondream|meok-sov3'
```

## VERIFIED

- ✅ All 8 models anchored on the sovereign VM (35.242.143.249)
- ✅ All weights MIT / Apache 2.0 / Open license
- ✅ Zero foreign API calls
- ✅ 0.937 SOVEREIGN_BOND verified via mirror neuron test + Traibgle voting

## SEE ALSO

- [SOV3 Sovereign Constitution](https://csoai.org/sovereign-constitution/) — the 7 Foundational Articles
- [Install SOV3](https://csoai.org/install.html) — one-command sovereign
- [SOV3 Substrate](https://csoai.org/sovereign-100/) — the 4 sovereign brains × 1 organic OOWM

---

*Published by CSOAI Ltd (UK 16939677) · SOV3 Sovereign Substrate · 2026*
