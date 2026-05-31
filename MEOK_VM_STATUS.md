# MEOK GCP VM — Live Status (2026-05-31)

VM: meok-backend · e2-standard-4 SPOT · europe-west2 · 35.246.43.221 · RUNNING (always-on)
Proxy: https://35.246.43.221.sslip.io · Caddy + Let's Encrypt · X-MEOK-Key gated
Key: meok-one/.meok_vm_key.txt (gitignored). Endpoint+key in meok-one/.env.local (gitignored).

## ✅ WORKING + VERIFIED (real output)
- Ollama on VM: qwen3:0.6b, qwen2.5:3b, llama3.2:3b, **meok-sov3** (our care model = qwen2.5:3b + SOV3 persona)
- HTTPS /llm proxy: front-door 200, no-key 401, keyed generate 200 (Host-rewrite fix applied)
- MEOK ONE router → VM via curl path (Py3.9 LibreSSL can't TLS the VM; curl works)
- **Character /api/think → meok-sov3 on VM** → real in-character reply, M4 idle. THE "talk to one" works.
- brains: left=meok-sov3 (VM), right=gemini (frontier). Council gate accepts GOOGLE_API_KEY.

## ⚠️ PARTIAL — SOV3 full mirror (honest blocker)
- SOV3 code deployed to VM ~/sov3 (113MB, no venv/models/weights)
- Postgres DB `sovereign_temple` + pgvector extension created ✅
- venv + requirements installed ✅
- BUT: server process listens on :3101 yet serves 404 on / /health /mcp.
  Entry is `sovereign-mcp-server.py` (script, not uvicorn module). Needs: correct .env
  (POSTGRES_DSN role/schema), confirm the script's actual bind + routes, possibly DB
  table init. NOT a quick fix — Python 3.9-authored code on VM's 3.11, schema unknown.
- NEXT: ssh in, run `./.venv/bin/python sovereign-mcp-server.py` in foreground, read the
  real startup error, fix env/schema, then add Caddy /sov3/* route + key gate.

## Cost
~£20/mo Spot on billing 01606E (real money — no credits yet). Stop overnight:
  gcloud compute instances stop meok-backend --zone=europe-west2-a   (→ ~£2/mo)
Apply Google for Startups (MEOK_GOOGLE_STARTUPS_APPLICATION.md) → credits → free.

## The win that matters
The character now thinks on the cloud via OUR OWN model (meok-sov3), not the crashing M4,
not tiny qwen3:0.6b. That's "best model + our own SOV3 + talk to one" — done. SOV3's full
110-tool memory layer is the next mirror step (partial above).
