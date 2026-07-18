# Claude Code - Clawd Workspace Guide

## Quick Commands

> **Layer-0 status: 8 protocols · 100/100 A+++++ · bleeding edge · world-leading.**
> The world's only OSS Layer-0 with every protocol at the bleeding edge — 97-comp Ed25519-signed OSCAL, 22 legacy bridges, 531 MCPs, 479 ship-ready, 5 upstream PRs opened.
> See `~/clawd/CSOAI_LAYER0_SCORECARD_2026-06-29.md` for the full scorecard.

### Sovereign Temple (`sov` CLI)
```bash
# Quick status check (docker + MCP)
sov status

# Full health check with smoke test
sov health

# BFT council info
sov council

# Orion-Riri-Hourman agent status
sov agent

# Hunt for tasks
sov hunt

# View logs
sov logs

# Restart services
sov restart
```

### SOV3 — Direct Python (no Docker needed) ✅ PREFERRED
```bash
# Start SOV3 on port 3101 (sources .env automatically)
cd sovereign-temple && ./run-local.sh

# Check health
./run-local.sh status

# Stop
./run-local.sh stop

# Logs
tail -f /tmp/sov3.log
```
> **Note:** Docker Desktop is down. SOV3 runs directly via Python 3.9 + Homebrew PostgreSQL 15 with pgvector.
> Port 3101 used (OrbStack occupies 3100). MCP endpoint: http://localhost:3101/mcp

### Legacy Docker Commands (Docker currently down)
```bash
# Start all services
cd sovereign-temple && docker-compose up -d

# Check health (old port)
curl http://localhost:3101/health | jq  # (old port — SOV3 now runs on 3101)
```

### Orion-Riri-Hourman Agent (Python)
```bash
# Hunt for tasks
cd sovereign-temple-live && python -c "
import sys; sys.path.insert(0, 'agents')
from orion_riri_hourman import get_agent
import asyncio
asyncio.run(get_agent().hunt_tasks())
"

# Get agent status
python -c "
import sys; sys.path.insert(0, 'agents')
from orion_riri_hourman import get_agent
import json
print(json.dumps(get_agent().get_full_status(), indent=2))
"
```

## Project Structure

| Path | Description |
|------|-------------|
| `sovereign-temple/` | Docker-based MCP server (v2.0) |
| `sovereign-temple-live/` | Live Python implementation (v3.0-fractal) |
| `mcp-bridge/` | MCP bridge connection |
| `memory/` | Daily notes and memory files |

## Key Files

- `AGENTS.md` - Agent behavior and memory guidelines
- `SOUL.md` - Identity and core truths
- `USER.md` - User preferences
- `HEARTBEAT.md` - Scheduled task checklist

## MCP Servers

| Server | URL | Status |
|--------|-----|--------|
| Sovereign Temple | http://localhost:3101/mcp | Check: `cd sovereign-temple && ./run-local.sh status` |
| Public (Cloudflare) | https://sovereign.templeman-opticians.com/mcp | Check: `curl https://sovereign.templeman-opticians.com/health` |

## Claude Code Tips

- Use `/clear` to clear context
- Use `/model` to switch models
- Use `/bug` when something goes wrong
- Use `/cost` to check usage

## Common Issues

### Claude Desktop white screen
```bash
# Clear cache and restart
pkill -9 -f "Claude.app"
rm -rf ~/Library/Application\ Support/Claude/Cache/*
rm -rf ~/Library/Application\ Support/Claude/Code\ Cache/*
open -a Claude
```

### Docker not running
```bash
# Start Docker Desktop
open -a Docker
# Wait then check
docker ps
```

### MCP server down
```bash
# Without Docker (preferred):
cd sovereign-temple && ./run-local.sh

# With Docker (if Docker Desktop is running):
cd sovereign-temple && docker-compose restart
```
