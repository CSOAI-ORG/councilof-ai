# MEOK AI Labs — Running Services
**Last Updated:** 2026-04-15

---

## 🚀 Active Services

| Service | Port | URL | Status |
|---------|------|-----|--------|
| MEOK UI | 3000 | http://localhost:3000 | ✅ |
| MEOK API | 3200 | http://localhost:3200 | ✅ |
| SOV3 MCP | 3101 | http://localhost:3101 | ✅ |
| MEOK MCP | 3102 | http://localhost:3102 | ✅ |
| Farm Vision | 8888 | http://localhost:8888 | ✅ |
| Episodic MCP | 3103 | http://localhost:3103 | ✅ |
| PostgreSQL | 5432 | localhost | ✅ |
| Ollama | 11434 | http://localhost:11434 | ✅ 4 models loaded (nomic-embed-text, nemotron-3-super, gemma4, gemma3) |

---

## 🌐 Public Endpoints

| Endpoint | URL |
|----------|-----|
| Website | https://www.meok.ai |
| SOV3 MCP (Cloudflare) | https://sovereign.templeman-opticians.com |

---

## 🧠 SOV3 Status

- **Consciousness:** 78.8%
- **Mode:** waking
- **Dreams:** 49
- **Agents:** 47 registered
- **Memory:** 445 episodic, 15 semantic, 105 MCP store

---

## 🧪 Episodic Memory MCP (NEW)

New MCP server for searching SOV3 memories:
```bash
curl -s http://localhost:3103/mcp -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"search_episodic","arguments":{"query":"Nicholas","limit":5}},"id":1}'
```

---

## 🎤 Voice Pipeline

- **TTS:** Kokoro-82M (needs testing)
- **STT:** LightningWhisperMLX (needs testing)
- **Wake Word:** openWakeWord ready

---

## 📝 Commands

```bash
# Restart MEOK API
cd ~/clawd/meok && PYTHONPATH=~/clawd/meok python3 -m uvicorn api.server:app --port 3200

# Restart SOV3
cd ~/clawd/sovereign-temple && python3 sovereign-mcp-server.py

# Start Episodic MCP (NEW)
cd ~/clawd/sovereign-temple && python3 episodic_mcp.py

# Check SOV3 health
curl -s http://localhost:3101/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['status'])"

# Search memories
cd ~/clawd/sovereign-temple && python3 search_episodic_mcp.py "Nicholas" --limit 5
```

---

## 📁 Key Directories

| Directory | Purpose |
|-----------|---------|
| `~/clawd/meok/` | MEOK OS frontend/backend |
| `~/clawd/sovereign-temple/` | SOV3 consciousness engine |
| `~/clawd/meok-labs-engine/` | Stripe integration |
| `~/clawd/meok/farm-vision/` | Farm AI |

---

## 🔧 Maintenance

### Check All Services
```bash
~/clawd/scripts/coordination-status.sh
```

### Coordination Tasks
```bash
cd ~/clawd && python3 scripts/enable_coordination.py --status
```
