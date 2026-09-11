# Claude Code - Clawd Workspace Guide

## Quick Commands

> **Layer-0 estate — measured 2026-09-05. Every number here has a command under it that returns it.**
>
> | Claim | Value | Check |
> |---|---|---|
> | Servers in the **official MCP registry** | **330** (329 PyPI, 1 npm) | `curl -s "https://registry.modelcontextprotocol.io/v0/servers?search=CSOAI-ORG&limit=100"` — paginate `metadata.nextCursor`, count `isLatest` |
> | MCP-**named** repos in `CSOAI-ORG` | **372** (363 public+unarchived) | `gh api --paginate 'users/CSOAI-ORG/repos?per_page=100&type=all' --jq '.[].name'` |
> | Repos declaring an **MCP SDK dependency but NOT named `*mcp*`** | **82** | fetch each unarchived repo's `package.json`/`pyproject.toml`, grep `modelcontextprotocol\|fastmcp\|mcp[` |
> | Built MCP servers **absent from the registry** | **142** (61 named, 81 not) | that same scan, diffed against the registry's `isLatest` names |
> | Repos in `CSOAI-ORG`, all kinds | **639 public** | the `users/` command above returns 639; the older **678** counted private repos too, so the two are not the same number and 'same' was wrong here |
> | Largest real OSCAL component-definition | **15 components** (`defoneos-assurance-pack/oscal/MEOK_OSCAL_COMPONENT.json`) | `python3 -c "import json;print(len(json.load(open(F))['component-definition']['components']))"` |
> | Live board | **22 axes · 22 measured · 0 unmeasured** | `curl -s https://councilof.ai/api/gspc` → `totals` |
>
> **The 2026-06-29 scorecard's P1 and P6 rows do not survive re-checking. Do not quote them.**
> `~/clawd/CSOAI_LAYER0_SCORECARD_2026-06-29.md` claims "531 MCPs / 479 deploy-ready
> (277 Python + 202 TypeScript)" and "97-comp Ed25519-signed OSCAL". Re-measured 2026-09-05:
> · **531 → 372.** Counting "mcp" anywhere in the name, private and archived included.
>   **And 372 is a NAME count, not a server count — do not read it as one.** Measured 2026-09-05:
>   82 unarchived repos declare an MCP SDK dependency without carrying "mcp" in the name, among them
>   `digital-human-library`, which depends on `@modelcontextprotocol/sdk`, ships a
>   `digital-human-library-mcp` binary, and is listed as one of our servers on Glama. A name is not a
>   detector. The dependency scan is the instrument; see `public/interop/mcp-registry-resolution.json`
>   in councilof-ai, which also records that **142 built servers are unpublished** (330 listed, 472
>   available).
>   The old verify command here, `gh repo list CSOAI-ORG --limit 1000`, RETURNED AN INCOMPLETE LIST on
>   2026-09-05 (678 rows) and a rename theory was built on the gap before per-repo `gh repo view`
>   refuted it. `CSOAI-ORG` is a **USER** account: `orgs/CSOAI-ORG/repos` 404s. Paginate `users/`.
> · **202 TypeScript MCPs → 4.** The whole org holds **74** TypeScript repos of any kind, so
>   that figure exceeds its own ceiling by 2.7×. Corroborated independently: the MCP registry
>   carries 329 PyPI against 1 npm. This is not drift — the number was never true in that shape.
> · **97 OSCAL components → no such file.** `layer0_protocol.oscal.json` is not an OSCAL
>   document: its top-level keys are `constitution`, `vsm`, `charters`, `temples`, `sigil`,
>   there is no `components` array, and its `sigil` is a bare 32-hex string, not an Ed25519
>   signature. Real OSCAL component-definitions in the estate hold 10, 14 and 15 components.
> · **Both of the scorecard's own verification commands are broken.** `gh api
>   /users/CSOAI-ORG/repos?q=mcp` returns byte-identical output with and without `?q=mcp` —
>   that is a list endpoint and it ignores `q`, so it filters nothing. The OSCAL one-liner
>   raises `KeyError: 'component-definition'` on the file it names.
>
> "100/100 A+++++", "world's only" and "world-leading" are not measurable and are not claims
> this workspace should hand to an agent as fact. **330 servers in a third-party registry is
> the real, checkable, and genuinely large number — lead with that.**

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
