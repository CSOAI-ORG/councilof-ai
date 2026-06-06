#!/usr/bin/env bash
# v3 — fires AFTER v2 completes. Publishes the 3 new global MCPs:
#   meok-transport-canada-hos-mcp
#   meok-iata-dgr-air-cargo-mcp
#   meok-imo-marpol-marine-mcp
#
# Run only after v2 publishes its 8 — otherwise PyPI 429s again.

set -uo pipefail

NEW3=(
  "meok-transport-canada-hos-mcp"
  "meok-iata-dgr-air-cargo-mcp"
  "meok-imo-marpol-marine-mcp"
)

# Wait for v2 to fully complete
echo "→ wait for v2 publish to be quiet for 20 min straight"
LAST_V2_MTIME=0
while true; do
  if ! pgrep -f "haulage-publish-cooldown-v2.sh" >/dev/null; then
    if [ -f /tmp/haulage-publish-v2.log ]; then
      MTIME=$(stat -f%m /tmp/haulage-publish-v2.log)
      AGE=$(( $(date +%s) - MTIME ))
      if [ $AGE -gt 1200 ]; then
        echo "v2 done + log quiet for ${AGE}s — go"
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
                print(c[s][k])
                break
        break
" 2>&1)

i=0
N=${#NEW3[@]}
SUCCESS=0
for MCP in "${NEW3[@]}"; do
  i=$((i+1))
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "https://pypi.org/pypi/$MCP/json")
  if [ "$CODE" = "200" ]; then
    echo "✓ already LIVE: $MCP"; SUCCESS=$((SUCCESS+1)); continue
  fi

  DIR=/Users/nicholas/clawd/mcp-marketplace/$MCP
  cd "$DIR"
  echo "═══ [$i/$N] $MCP ═══"

  TWINE_USERNAME="__token__" TWINE_PASSWORD="$PYPI_TOKEN" \
    python3.11 -m twine upload --non-interactive dist/* 2>&1 | tail -4

  sleep 10
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "https://pypi.org/pypi/$MCP/json")
  if [ "$CODE" = "200" ]; then
    echo "  ✅ LIVE"
    SUCCESS=$((SUCCESS+1))
  fi

  if [ $i -lt $N ]; then
    echo "→ cool-down 15 min"
    sleep 900
  fi
done

echo ""
echo "═══════════════════════════════════════════════════════"
echo "v3 DONE — $SUCCESS / $N now LIVE"
for MCP in "${NEW3[@]}"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "https://pypi.org/pypi/$MCP/json")
  [ "$CODE" = "200" ] && echo "  ✅ $MCP" || echo "  ✗ ($CODE) $MCP"
done
