#!/usr/bin/env bash
# Publish CSOAI Governance MCP to the official MCP Registry at v1.0.2.
# Prereq: mcp-publisher login github (device flow)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/mcp/csoai-governance"

echo "[mcp-registry] npm pack dry-run"
npm pack --dry-run 2>/dev/null || true

echo "[mcp-registry] Publishing server.json v1.0.2"
if command -v mcp-publisher >/dev/null 2>&1; then
  mcp-publisher publish server.json
else
  echo "mcp-publisher not found. Install: npm i -g @modelcontextprotocol/publisher"
  echo "Then: mcp-publisher login github"
  echo "Manual: curl -X POST https://registry.modelcontextprotocol.io/v0/publish ..."
  exit 1
fi

echo "[mcp-registry] Done. Verify: https://registry.modelcontextprotocol.io/servers/io.github.CSOAI-ORG/csoai-governance"
