#!/usr/bin/env bash
# v4 — fires AFTER v3 completes. Publishes the 5 NEW MCPs from session-end:
#   meok-rail-freight-uk-mcp
#   meok-cold-chain-pharma-mcp
#   meok-uae-rta-transport-mcp
#   meok-livestock-welfare-transport-mcp
#   meok-haulage-governance-bridge-mcp ← THE BRIDGE
set -uo pipefail

V4_BATCH=(
  "meok-haulage-governance-bridge-mcp"  # bridge first — the highest leverage MCP
  "meok-rail-freight-uk-mcp"
  "meok-cold-chain-pharma-mcp"
  "meok-uae-rta-transport-mcp"
  "meok-livestock-welfare-transport-mcp"
)

# Wait for v3 to finish + 20 min cool-down quiet
echo "→ wait for v3 publish to be quiet for 20 min straight"
while true; do
  if ! pgrep -f "haulage-publish-cooldown-v3.sh" >/dev/null; then
    if [ -f /tmp/haulage-publish-v3.log ]; then
      MTIME=$(stat -f%m /tmp/haulage-publish-v3.log)
      AGE=$(( $(date +%s) - MTIME ))
      if [ $AGE -gt 1200 ]; then
        echo "v3 done + log quiet ${AGE}s — go"
        break
      fi
    else
      break
    fi
  fi
  sleep 60
done

PYPI_TOKEN=$(python3.11 -c "
import configparser, os
c = configparser.ConfigParser()
c.read(os.path.expanduser('~/.pypirc'))
for s in ['pypi', 'default']:
    if s in c.sections():
        for k in ['password', 'token']:
            if k in c[s]:
                print(c[s][k]); break
        break")

i=0
N=${#V4_BATCH[@]}
for MCP in "${V4_BATCH[@]}"; do
  i=$((i+1))
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "https://pypi.org/pypi/$MCP/json")
  [ "$CODE" = "200" ] && { echo "✓ already LIVE: $MCP"; continue; }

  DIR=/Users/nicholas/clawd/mcp-marketplace/$MCP
  [ -d "$DIR" ] || { echo "✗ missing: $DIR"; continue; }
  cd "$DIR"
  echo "═══ [$i/$N] $MCP ═══"
  TWINE_USERNAME="__token__" TWINE_PASSWORD="$PYPI_TOKEN" \
    python3.11 -m twine upload --non-interactive dist/* 2>&1 | tail -4
  sleep 10
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "https://pypi.org/pypi/$MCP/json")
  [ "$CODE" = "200" ] && echo "  ✅ LIVE" || echo "  ⏳ ($CODE)"
  [ $i -lt $N ] && { echo "→ cool-down 15 min"; sleep 900; }
done

echo "═══ v4 DONE ═══"
for MCP in "${V4_BATCH[@]}"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "https://pypi.org/pypi/$MCP/json")
  [ "$CODE" = "200" ] && echo "  ✅ $MCP" || echo "  ✗ ($CODE) $MCP"
done
