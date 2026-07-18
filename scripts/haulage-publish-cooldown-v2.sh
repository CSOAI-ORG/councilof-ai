#!/usr/bin/env bash
# v2: 90-min initial wait + 15-min between uploads.
# PyPI imposes project-creation rate limit on accounts.
# We hit it hard with 4 publishes in the first burst — wait long.

set -uo pipefail

REMAINING=(
  "meok-fors-clocs-mcp"
  "meok-allmi-hiab-mcp"
  "meok-dvsa-olicence-mcp"
  "meok-cpa-contract-lift-mcp"
  "meok-eu-mobility-package-mcp"
  "meok-fmcsa-hours-of-service-mcp"
  "meok-nhvr-australia-mcp"
  "meok-iru-tir-international-mcp"
)

echo "=== v2 cool-down: waiting 90 min for PyPI quota to recover ==="
sleep 5400

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
N=${#REMAINING[@]}
SUCCESS=0
for MCP in "${REMAINING[@]}"; do
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

  # Check if it landed
  sleep 10
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "https://pypi.org/pypi/$MCP/json")
  if [ "$CODE" = "200" ]; then
    echo "  ✅ LIVE"
    SUCCESS=$((SUCCESS+1))
  else
    echo "  ⏳ ($CODE) — may still be propagating or rate-limited"
  fi

  if [ $i -lt $N ]; then
    echo "→ cool-down 15 min"
    sleep 900
  fi
done

echo ""
echo "═══════════════════════════════════════════════════════"
echo "DONE — $SUCCESS / $N now LIVE"
for MCP in "${REMAINING[@]}"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "https://pypi.org/pypi/$MCP/json")
  [ "$CODE" = "200" ] && echo "  ✅ $MCP" || echo "  ✗ ($CODE) $MCP"
done
