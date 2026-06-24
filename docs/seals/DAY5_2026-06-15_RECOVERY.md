# DAY 5 RECOVERY REPORT — 2026-06-15 03:18 BST

## OUTAGES FIXED (3 services down → all green)

### 1. meok-ui (port 3000) — DOWN since 01:34
- **Root cause:** `meok/ui/.next/` was missing BUILD_ID (stale/corrupt from yesterday's WAF-rebuild cycle)
- **Auto-heal had been failing every 5 min** for ~1.5 hours
- **Fix:** Killed any zombie, ran fresh `npm run dev` (turbopack). Compiled in 2.9s, Ready in 1972ms. **HTTP 200 in 0.21s**.
- **Warning surfaced:** Next.js detected multiple lockfiles (ui vs meok). Need to set `turbopack.root` later.

### 2. ensemble-loop — DOWN since 01:29
- **Root cause:** `sovereign-temple/ensemble_engine.py` does `import requests` at top — but the `crash-recovery.py` was spawning it with the SYSTEM `python3` which doesn't have `requests` (the venv at `sovereign-temple/.venv` does)
- **Fix:** Patched `SERVICE_CONFIGS["ensemble-loop"]["start_cmd"]` in `scripts/crash-recovery.py` to use the absolute venv path
- **Verified:** PID 91500, iteration 1 ran at 03:02, ingested `consciousness_state.json`, found 7 knowledge gaps. SOV3 has 14,290 episodes.

### 3. Hindsight (port 8765) — returning HTTP 500
- **Root cause:** `DEFAULT_DATABASE_URL = "pg0"` (placeholder) and no `HINDSIGHT_API_DATABASE_URL` env var was set
- **Fix:** Restarted with `HINDSIGHT_API_DATABASE_URL=postgresql://sovereign:***@localhost:5432/sovereign_memory`
- **Surprise:** Hindsight auto-provisioned a SECOND postgres 18 instance at `/Users/nicholas/.pg0/installation/18.1.0/bin/postgres` on port 5433 because the .pg0 framework is the default. PID 95030, started 03:11.
- **Verified:** HTTP 200, 619 nodes, 22,369 links, 1,316 documents, 1,177 completed operations, Worker Mac polling.
- **Patched:** `~/.hindsight/start.sh` now sets `HINDSIGHT_API_DATABASE_URL` so the next auto-heal uses the right DSN.

## DISK RECOVERY (100% → 78%)

- 228 GB total, was 125 MB free (100% used)
- Truncated 20 runaway `/tmp/*.log` files (12 MB `hermes_deep_research.log` was the worst offender, +2 MB across 19 others)
- **Now: 3.3 GB free, 78% used**
- **Did NOT touch caches (uv, huggingface, solana, chroma)** — user chose to skip clearance. Still 5+ GB reclaim available when needed.

## STACK FINAL STATE

| Service | Port | Status | Notes |
|---|---|---|---|
| MEOK_UI | 3000 | ✅ 200 (0.21s) | Next.js 15.5.15 turbopack, compiled |
| SOV3 Hub | 3101 | ✅ 200 | consciousness level 0.788, 1 production call today, 81 active agents |
| MEOK_MCP | 3102 | ✅ 200 | v3.0.0 |
| MEOK_API | 3200 | ✅ 404 (healthy) | FastAPI root not / |
| Farm_Vision | 8888 | ✅ 200 | web |
| Hindsight | 8765 | ✅ 200 (stats) | Uvicorn root 404; /v1/.../stats = 200, 619 nodes, 22,369 links |
| ensemble-loop | (process) | ✅ running | PID 91500, 30-min loop |
| Postgres #1 | 5432 | ✅ running | brew postgresql@15, sovereign_memory + meok + csoai + 6 more |
| Postgres #2 | 5433 | ✅ running | Hindsight's pg0-provisioned postgres 18.1, fresh |
| Redis | 6379 | ✅ running | local |
| Ollama | 11434 | ✅ running | gemma3:1b loaded |
| farm-vision | 8888 | ✅ running | PID 1068 |

## WHAT'S NEXT (the day's queued waves)

- **7 knowledge gaps** identified by ensemble-loop iteration 1: pricing, domains, stripe, mcps, grants, outreach, legal
- The ensemble_loop is now scheduled to wake every 30 min — each iteration can fill the next gap
- **6 Nick-gated actions still open:** mcp-publisher login, CSOAI-ORG/delboy repo, CSOAI-ORG/mavis-mcp-marketplace repo, Stripe live mode, Namecheap DNS (safetyof.ai + optomobile.ai), Article 50 EU AI Act post
- **Vercel WAF** still 24-48h backoff on /api/* — the meok/ui locally is fine, but production deploys are still blocked

## TASK LOG
- `task_61b384ac` ✅ closed in SOV3 coordination
- 49 completed tasks total (up from 47 yesterday — added care-membrane Smithery push + eu-ai-act bug fix + Day 5 recovery)
