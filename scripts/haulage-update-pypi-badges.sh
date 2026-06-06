#!/usr/bin/env bash
# Update haulage.app mcps.ts data after MCPs go live on PyPI.
# Reads ~/clawd/mcp-marketplace/ for built MCPs and flags which are LIVE on PyPI.
# Run after publish + before next deploy.

set -uo pipefail

MCP_HOME="/Users/nicholas/clawd/mcp-marketplace"
DATA_FILE="/Users/nicholas/clawd/haulage-deploy/src/data/mcps.ts"

echo "===Querying PyPI for each scaffolded MCP==="
echo ""

declare -A PYPI_STATUS

for DIR in "$MCP_HOME"/meok-*; do
  [ -d "$DIR" ] || continue
  NAME=$(basename "$DIR")
  # Only check ones with a built wheel (real ship-ready code)
  if ls "$DIR"/dist/*.whl >/dev/null 2>&1; then
    URL="https://pypi.org/pypi/$NAME/json"
    HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$URL")
    if [ "$HTTP" = "200" ]; then
      PYPI_STATUS[$NAME]="LIVE"
      echo "  ✅ LIVE  $NAME"
    else
      PYPI_STATUS[$NAME]="SCAFFOLDED"
      echo "  📦 BUILT (not yet on PyPI)  $NAME"
    fi
  else
    PYPI_STATUS[$NAME]="EMPTY"
    echo "  ⬜ FOLDER ONLY  $NAME"
  fi
done

echo ""
echo "===Summary==="
LIVE=$(for k in "${!PYPI_STATUS[@]}"; do [ "${PYPI_STATUS[$k]}" = "LIVE" ] && echo x; done | wc -l | tr -d ' ')
BUILT=$(for k in "${!PYPI_STATUS[@]}"; do [ "${PYPI_STATUS[$k]}" = "SCAFFOLDED" ] && echo x; done | wc -l | tr -d ' ')
EMPTY=$(for k in "${!PYPI_STATUS[@]}"; do [ "${PYPI_STATUS[$k]}" = "EMPTY" ] && echo x; done | wc -l | tr -d ' ')
echo "  $LIVE  LIVE on PyPI"
echo "  $BUILT  Built locally, wheel ready (run publish-flagships.sh)"
echo "  $EMPTY  Scaffolded folder only (no code yet)"
echo ""

if [ -f "$DATA_FILE" ]; then
  echo "===Next step==="
  echo "Open: $DATA_FILE"
  echo "Replace 'starterPrice: \"Coming soon\"' with real Stripe URLs for LIVE MCPs."
  echo "Then: cd ~/clawd/haulage-deploy && npm run build && vercel --prod --yes"
fi
