# M2 Ollama Mesh Node — Final Status

**Node:** MacBook Air M2 (8GB RAM, 245GB disk)  
**IP:** `192.168.50.176:11434`  
**Mesh ID:** `m2-sidekick`  
**Gateway:** `192.168.50.105:3205`

---

## ✅ What's Working

### Models on M2
| Model | Size | Speed | Role |
|-------|------|-------|------|
| `qwen3:0.6b` | 522 MB | **119 tok/s** | Ultra-fast draft/summary |
| `qwen3:1.7b` | 1.4 GB | **51 tok/s** | General chat |
| `deepseek-r1:1.5b` | 1.1 GB | **71 tok/s** | Local reasoning |
| `qwen3:4b` | 2.5 GB | *(load on demand)* | Heavy tasks |
| `nomic-embed-text` | 274 MB | 768-dim | Embeddings |
| `bge-m3` | 1.2 GB | 1024-dim | Document vectors |

**Removed:** `llama3.1:8b`, `llama3.2:3b` (too large for 8GB M2)
**Cancelled:** `phi4` (9.1GB — impossible on this machine)

### Mesh Status
- ✅ M2 registered as `m2-sidekick` — ONLINE
- ✅ 8/8 nodes online in MEOKCLAW
- ✅ Hermes configured to hit local M2 Ollama first

### Tools Installed
```bash
mesh health          # Check all nodes
mesh status          # Local + mesh status
mesh models          # List all 365 available models
mesh ask "prompt"    # Chat with local model
mesh embed "text"    # Generate embeddings
mesh warmup          # Pre-load models into RAM
mesh benchmark       # Speed test local models
mesh clean           # Free disk space
mesh-maintain        # Weekly cleanup (auto-runs Sundays 3am)
```

### System Hardening
- ✅ Ollama auto-starts on boot (Homebrew LaunchAgent)
- ✅ Disk monitor alerts every 5 min if >85%
- ✅ Weekly auto-cleanup (partials, caches, old logs)
- ✅ Time Machine snapshot thinning when disk >90%

---

## ⚠️ M2 Limitations (Be Realistic)

| Constraint | Impact |
|------------|--------|
| **8GB RAM** | Can only load **1 model at a time** into RAM. Switching models causes a 5-15s unload/load delay. |
| **245GB disk (96% used)** | Cannot add models >2GB without removing something. |
| **qwen3:4b benchmark failed** | 2.5GB + macOS overhead = swap city. It *runs* but first load is slow. |
| **No GPU** | Apple Silicon Neural Engine helps, but it's CPU-bound for large context. |

**Rule of thumb for M2:** Use `qwen3:1.7b` or `deepseek-r1:1.5b` for active work. Load `qwen3:4b` only when you need heavy lifting.

---

## 🔧 Quick Commands

```bash
# Warm up models for instant response
mesh warmup qwen3:1.7b

# Check mesh health
mesh health

# Free space if disk alerts trigger
mesh clean

# Manually run maintenance
~/bin/mesh-maintain
```

---

*Last updated: Wed 27 May 2026*
