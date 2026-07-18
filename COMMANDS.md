# Quick Command Reference

## Sovereign Temple (`sov` CLI)

```bash
# Quick status
cd /Users/nicholas/clawd && bin/sov status

# Full health check
bin/sov health

# Council info
bin/sov council

# Agent status
bin/sov agent

# Hunt for tasks
bin/sov hunt

# Restart services
bin/sov restart

# View logs
bin/sov logs
```

## Claude Code Aliases (in this project)

```bash
sov              # Quick status
sov-status       # Docker + MCP status
sov-health       # Full smoke test
sov-council      # BFT council info
sov-agent        # Orion-Riri-Hourman status
sov-hunt         # Hunt for TODOs
sov-logs         # MCP logs
mcp-health       # Check MCP health
mcp-tools        # Count MCP tools
mem-today        # View today's memory
mem-yesterday    # View yesterday's memory
```

## Manual Commands

### Docker
```bash
cd sovereign-temple
docker-compose up -d      # Start
docker-compose restart    # Restart
docker-compose down       # Stop
docker ps                 # List running
```

### MCP Server
```bash
# Health check
curl http://localhost:3101/health

# List tools
curl -X POST http://localhost:3101/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"1","method":"tools/list"}'

# Call a tool
curl -X POST http://localhost:3101/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "tools/call",
    "params": {
      "name": "sovereign_health_check",
      "arguments": {}
    }
  }'
```

### Orion-Riri-Hourman Agent
```bash
cd sovereign-temple-live

# Get status
python3 -c "
import sys
sys.path.insert(0, 'agents')
from orion_riri_hourman import get_agent
import json
print(json.dumps(get_agent().get_full_status(), indent=2))
"

# Hunt tasks
python3 -c "
import sys
sys.path.insert(0, 'agents')
from orion_riri_hourman import get_agent
import asyncio
asyncio.run(get_agent().hunt_tasks())
"

# Start sprint
python3 -c "
import sys
sys.path.insert(0, 'agents')
from orion_riri_hourman import get_agent
import asyncio
asyncio.run(get_agent().start_sprint('micro'))
"
```

## Dashboard URLs

| Service | URL |
|---------|-----|
| Dashboard | http://localhost:3000 |
| Weaviate | http://localhost:8080 |
| MCP | http://localhost:3100 |
| Public MCP | https://sovereign.templeman-opticians.com |

## Claude Desktop

```bash
# Config location
~/Library/Application\ Support/Claude/claude_desktop_config.json

# Clear cache if issues
pkill -9 -f "Claude.app"
rm -rf ~/Library/Application\ Support/Claude/Cache/*
rm -rf ~/Library/Application\ Support/Claude/Code\ Cache/*
open -a Claude
```
