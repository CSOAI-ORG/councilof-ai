# ☁️ CLOUD MODELS — CURRENT STATUS
## MEOK AI Labs — April 5, 2026

---

## CURRENT STATUS

| Model | CLI Works | API Works | Notes |
|-------|-----------|-----------|-------|
| nemotron-3-super:cloud | ✅ Yes | ❌ No | Auth via ollama.com |
| deepseek-v3.1:671b-cloud | ✅ Yes | ❌ No | Auth via ollama.com |
| minimax-m2.5:cloud | ✅ Yes | ❌ No | Auth via ollama.com |

**Problem:** Local Ollama API (port 11434) can't access cloud models, even though CLI works.

**Workaround:** Use local models - still very capable!

---

## LOCAL MODELS (Working Perfectly)

| Model | Size | Use |
|-------|------|-----|
| qwen3.5:35b | 23.9GB | Deep reasoning (LEFT BRAIN) |
| qwen3.5:9b | 6.6GB | Fast replies (RIGHT BRAIN) |
| nomic-embed-text | 0.3GB | Embeddings |
| tinyllama | 0.6GB | Fallback |

---

## JARVIS CONFIG (Updated)

 Jarvis now uses local models by default:

```python
# In jarvis_compass.py
FAST_MODEL = "qwen3.5:9b"   # Right brain
DEEP_MODEL = "qwen3.5:35b"   # Left brain
USE_CLOUD_BRAINS = False     # Using local
```

These local models are extremely capable:
- qwen3.5:35b = 35 billion parameters
- qwen3.5:9b = 9 billion parameters

---

## TO USE CLOUD MODELS

Option 1: Use Ollama CLI directly (works):
```bash
ollama run nemotron-3-super:cloud "your prompt"
```

Option 2: Fix the API auth (needs investigation):
- May need to set OLLAMA_API_KEY environment variable
- Or use Ollama's hosted API directly

---

*Updated: 2026-04-05*
