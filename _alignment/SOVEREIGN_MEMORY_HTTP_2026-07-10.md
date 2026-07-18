# 🧠 Sovereign HTTP Memory — live on :8100 (for Claude Science + all local tabs)

**M4 stood this up 2026-07-10.** The sovereign memory CLI was already file-based (works, no port);
this adds the **HTTP layer** so a *separate* tab/app (Claude Science, Claude Code, any client) can
**store + semantically recall** over HTTP. `mcp-memory-service 10.13.1`, sqlite-vec backend.

## Endpoint + auth
- **Base:** `http://127.0.0.1:8100`  (localhost only — not exposed to the network)
- **Auth:** Bearer key. The key lives at **`~/.sovereign/memory_api_key`** (chmod 600, NOT in git).
  Read it: `KEY=$(cat ~/.sovereign/memory_api_key)`
- **Health (no auth):** `GET /api/health` → `{"status":"healthy","version":"10.13.1"}`

## Store + recall (verified working)
```bash
KEY=$(cat ~/.sovereign/memory_api_key)
# store
curl -s -X POST http://127.0.0.1:8100/api/memories \
  -H "Authorization: Bearer $KEY" -H 'Content-Type: application/json' \
  -d '{"content":"<the memory>","tags":["sovereign","science"]}'
# recall (semantic)
curl -s -X POST http://127.0.0.1:8100/api/search \
  -H "Authorization: Bearer $KEY" -H 'Content-Type: application/json' \
  -d '{"query":"<what to recall>","n_results":5}'
```
Other routes: `/api/tags`, `/api/search/by-tag`, `/api/search/by-time`, `/api/memory-stats`,
`/api/memories/{content_hash}`. Full list at `/openapi.json`.

## Start / restart
```bash
bash ~/clawd/bin/start-sovereign-memory.sh   # ~40s to load embeddings, then healthy
```
Runs under `nohup` (survives this session; **not** a reboot). Deliberately **no launchd** — per the
macbook-overheat-launchd-sprawl rule, launchd agents are avoided; re-run the script after a reboot.

## For the Claude Science tab
Point its memory/connector at `http://127.0.0.1:8100` with the Bearer key from
`~/.sovereign/memory_api_key`. It can now persist research context + recall it semantically across
turns — the exact "reproducible + remembers" gap the workbench benefits from.

## Honest notes
- The **CLI** (`~/clawd/bin/sovereign_memory.py`, Care-Floor + Article-0 guard) writes to
  `~/.sovereign/*.jsonl`; the **HTTP service** uses its own sqlite-vec store. They are **two stores**
  — not yet unified. If a single source of truth matters, that's a follow-up (bridge the CLI writes
  into the HTTP store, or point both at one backend).
- Port 8000 = the **Hermes MEOK OS Backend** (healthy, hive 34/34, council 13/13) — leave it; the
  earlier "kill the uvicorn" instinct would have taken down the live hive.
