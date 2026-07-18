#!/usr/bin/env bash
# Sovereign HTTP memory service on 127.0.0.1:8100 (mcp-memory-service 10.13.1, sqlite_vec).
# Local cross-lane semantic memory for Claude Science / Claude Code / any tab. Key-authed.
V=~/.sovereign/ml-venv/bin
KEY=$(cat ~/.sovereign/memory_api_key 2>/dev/null)
[ -z "$KEY" ] && { echo "no key at ~/.sovereign/memory_api_key"; exit 1; }
pkill -f 'web.app' 2>/dev/null; sleep 1
cd /Users/nicholas/CSOAI-Research-Institute/memory-system/mcp-memory-service/src || exit 1
MCP_API_KEY="$KEY" MCP_MEMORY_STORAGE_BACKEND=sqlite_vec \
  nohup $V/python -m uvicorn mcp_memory_service.web.app:app --host 127.0.0.1 --port 8100 > /tmp/mcp-web-8100.log 2>&1 &
echo "sovereign-memory starting on http://127.0.0.1:8100 (pid $!) — ~40s to load embeddings"
