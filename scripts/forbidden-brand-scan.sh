#!/usr/bin/env bash
# forbidden-brand-scan.sh
# Weekly scan for any of the severed brands or Kimi phantoms in forward-facing
# surfaces. Emits to stdout. Returns exit 0 = clean, exit 1 = leak detected.
#
# Schedule: 0 9 * * 1 (Mondays 09:00 BST, before the swarm wakes)
# Install: crontab -e → add line below
# 0 9 * * 1 /Users/nicholas/clawd/scripts/forbidden-brand-scan.sh >> /tmp/forbidden-brand-scan.log 2>&1

set -euo pipefail

# Forward-facing paths only (not internal docs, not training data, not archives)
SCAN_PATHS=(
  /Users/nicholas/clawd/meok.ai/ui/src
  /Users/nicholas/clawd/csoai-org/src
  /Users/nicholas/clawd/csoai-org-v2/src
  /Users/nicholas/clawd/mcp-marketplace
  /Users/nicholas/clawd/sdk
  /Users/nicholas/clawd/deliverables
  /Users/nicholas/clawd/docs
  /Users/nicholas/clawd/scripts
  /Users/nicholas/clawd/_intake
)

# The forbidden pattern: severed brands + Kimi phantoms
FORBIDDEN='James Castle|Grant Carter Osborne|Chris J\.|CSGA[^a-z]|CSGA-Global|Terranova|csga-global|csgaglobal|csga\.ai|defonos\.io|Toronto Summit|Toronto conference|Toronto Council'

LEAK_COUNT=0
echo "=== Forbidden-Brand Scan === $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
for d in "${SCAN_PATHS[@]}"; do
  if [ ! -d "$d" ]; then
    continue
  fi
  # rg if available, else grep
  if command -v rg >/dev/null 2>&1; then
    hits=$(rg -l -E "$FORBIDDEN" "$d" 2>/dev/null || true)
  else
    hits=$(grep -rli -E "$FORBIDDEN" "$d" 2>/dev/null | grep -v "/.git/" || true)
  fi
  if [ -n "$hits" ]; then
    echo "LEAK in $d:"
    echo "$hits"
    LEAK_COUNT=$((LEAK_COUNT + $(echo "$hits" | wc -l | tr -d ' ')))
  fi
done

if [ "$LEAK_COUNT" -gt 0 ]; then
  echo ""
  echo "❌ $LEAK_COUNT forbidden-brand file(s) found. See /Users/nicholas/clawd/_TABS/_inventory/SEVERED_BRAND_AUDIT_2026-06-27/ for the absorption plan."
  exit 1
else
  echo ""
  echo "✅ All forward-facing surfaces clean. The dragon is sovereign."
  exit 0
fi
