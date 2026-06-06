#!/usr/bin/env bash
# v5 — post-crash restart. Publishes ALL 16 remaining queued MCPs.
# Bridge MCP first (highest leverage). Throttle 12 min between each.
# Total runtime: ~4h overnight.

set -uo pipefail

V5_BATCH=(
  # GOVERNANCE BRIDGE FIRST — highest leverage
  "meok-haulage-governance-bridge-mcp"
  # Then UK trade verticals
  "meok-fors-clocs-mcp"
  "meok-allmi-hiab-mcp"
  "meok-dvsa-olicence-mcp"
  "meok-cpa-contract-lift-mcp"
  # Then global jurisdictions
  "meok-eu-mobility-package-mcp"
  "meok-fmcsa-hours-of-service-mcp"
  "meok-nhvr-australia-mcp"
  "meok-transport-canada-hos-mcp"
  "meok-iru-tir-international-mcp"
  # Then modes (air + sea + rail)
  "meok-iata-dgr-air-cargo-mcp"
  "meok-imo-marpol-marine-mcp"
  "meok-rail-freight-uk-mcp"
  # Then sector specials
  "meok-cold-chain-pharma-mcp"
  "meok-uae-rta-transport-mcp"
  "meok-livestock-welfare-transport-mcp"
)

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
N=${#V5_BATCH[@]}
SUCCESS=0
FAIL=0
for MCP in "${V5_BATCH[@]}"; do
  i=$((i+1))
  # Skip if already live
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "https://pypi.org/pypi/$MCP/json")
  if [ "$CODE" = "200" ]; then
    echo "✓ already LIVE: $MCP"
    SUCCESS=$((SUCCESS+1))
    continue
  fi

  DIR=/Users/nicholas/clawd/mcp-marketplace/$MCP
  if [ ! -d "$DIR" ]; then
    echo "✗ missing folder: $DIR"
    FAIL=$((FAIL+1))
    continue
  fi
  cd "$DIR"

  echo ""
  echo "═══ [$i/$N] $MCP ═══"
  TWINE_USERNAME="__token__" TWINE_PASSWORD="$PYPI_TOKEN" \
    python3.11 -m twine upload --non-interactive dist/* 2>&1 | tail -4

  # Verify after 15s
  sleep 15
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "https://pypi.org/pypi/$MCP/json")
  if [ "$CODE" = "200" ]; then
    echo "  ✅ LIVE  $MCP"
    SUCCESS=$((SUCCESS+1))
  else
    echo "  ⏳ ($CODE) — may be propagating or 429'd"
    FAIL=$((FAIL+1))
  fi

  # 12-min throttle between uploads
  if [ $i -lt $N ]; then
    echo "→ cool-down 12 min"
    sleep 720
  fi
done

echo ""
echo "═══════════════════════════════════════════════════════"
echo "v5 RESTART DONE — $SUCCESS uploaded, $FAIL failures"
for MCP in "${V5_BATCH[@]}"; do
  C=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "https://pypi.org/pypi/$MCP/json")
  [ "$C" = "200" ] && echo "  ✅ $MCP" || echo "  ✗ ($C) $MCP"
done
echo "═══════════════════════════════════════════════════════"
