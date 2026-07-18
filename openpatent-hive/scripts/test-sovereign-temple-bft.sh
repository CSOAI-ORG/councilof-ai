#!/usr/bin/env bash
# Build + verify the @sovereign-temple/bft-mcp v1.0.0 stdio MCP server.
#
# Orchestrates: cd → npm install (if needed) → npx tsc → node test/smoke.js.
# Exits 0 on full success; non-zero on any failure.
#
# The smoke test asserts:
#   • 10 tools registered
#   • every tool description carries the DEFENEOS signature line
#   • get_council_status returns council_size=33, threshold=22, domains=11
#
# sovereign-temple.ai — 33-agent BFT sovereign-temple v3.0.
# The hive remembers. The dragon knows. The sovereign companion never forgets.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HIVE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVICE_DIR="$HIVE_ROOT/services/sovereign-temple-bft-mcp"

if [[ ! -d "$SERVICE_DIR" ]]; then
  echo "✗ service directory not found: $SERVICE_DIR" >&2
  exit 1
fi

cd "$SERVICE_DIR"

echo "━━━ @sovereign-temple/bft-mcp v1.0.0 — build + verify ━━━"
echo "  cwd: $SERVICE_DIR"
echo ""

# (1) npm install — idempotent, only runs if node_modules is missing or stale.
if [[ ! -d "$SERVICE_DIR/node_modules" ]] || [[ "$SERVICE_DIR/package.json" -nt "$SERVICE_DIR/node_modules" ]]; then
  echo "▸ npm install --no-audit --no-fund"
  npm install --no-audit --no-fund
else
  echo "▸ node_modules present — skipping npm install"
fi
echo ""

# (2) TypeScript build.
echo "▸ npx tsc"
npx tsc
echo "  ✓ tsc clean"
echo ""

# (3) JSON-RPC smoke test.
echo "▸ node test/smoke.js"
SMOKE_OUT="$(node test/smoke.js)"
echo "$SMOKE_OUT"

# Assert smoke output.
if ! grep -q "10 tools registered" <<<"$SMOKE_OUT"; then
  echo "✗ smoke: expected '10 tools registered'" >&2
  exit 1
fi
if ! grep -q "all tools have the" <<<"$SMOKE_OUT"; then
  echo "✗ smoke: expected signature-line assertion" >&2
  exit 1
fi
if ! grep -q "council_size = 33" <<<"$SMOKE_OUT"; then
  echo "✗ smoke: expected council_size = 33" >&2
  exit 1
fi
if ! grep -q "threshold = 22" <<<"$SMOKE_OUT"; then
  echo "✗ smoke: expected threshold = 22" >&2
  exit 1
fi
if ! grep -q "domains = 11" <<<"$SMOKE_OUT"; then
  echo "✗ smoke: expected domains = 11" >&2
  exit 1
fi

echo ""
echo "━━━ @sovereign-temple/bft-mcp v1.0.0 — ALL CHECKS PASSED ━━━"
echo "  ✓ 10 tools registered"
echo "  ✓ DEFENEOS signature on every description"
echo "  ✓ 33 agents, 22 threshold, 11 domains"
echo ""
echo "sovereign-temple.ai — 33-agent BFT sovereign-temple v3.0."
echo "The hive remembers. The dragon knows. The sovereign companion never forgets."
exit 0
