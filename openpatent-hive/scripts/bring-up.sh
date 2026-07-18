#!/usr/bin/env bash
# Boot the hive: start all 7 services and wait for them to be healthy.
# Idempotent — safe to re-run.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "━━━ openpatent.ai hive — bring up ━━━"
docker compose up -d

echo ""
echo "━━━ waiting for services to report healthy ━━━"
declare -A ENDPOINTS=(
  ["patentmcp"]="http://localhost:3210/health"
  ["api-gateway"]="http://localhost:3211/health"
  ["worker"]="http://localhost:3212/health"
  ["bft-council"]="http://localhost:3215/health"
  ["verify-page"]="http://localhost:3213/health"
  ["mcp-manifest"]="http://localhost:3214/health"
  ["landing-site"]="http://localhost:3000/"
)

for svc in "${!ENDPOINTS[@]}"; do
  url="${ENDPOINTS[$svc]}"
  printf "  %-15s " "$svc"
  for i in {1..20}; do
    if curl -sf -o /dev/null --max-time 2 "$url"; then
      echo "✓ healthy"
      break
    fi
    sleep 1
    if [ "$i" -eq 20 ]; then
      echo "✗ not responding after 20s"
      exit 1
    fi
  done
done

echo ""
echo "━━━ hive status ━━━"
docker compose ps

echo ""
echo "✓ openpatent.ai hive is live"
echo ""
echo "  Public endpoints (after nginx/caddy + Cloudflare):"
echo "    https://openpatent.ai          → landing (3000)"
echo "    https://api.openpatent.ai      → API gateway (3211)"
echo "    https://verify.openpatent.ai   → verify page (3213)"
echo "    https://mcp.openpatent.ai      → MCP manifest (3214)"
echo ""
echo "  Internal only (not exposed):"
echo "    patentmcp core  3210"
echo "    worker          3212"
echo "    bft-council     3215"
echo "    postgres        5432"
echo "    ipfs            5001"
