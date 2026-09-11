#!/bin/bash
# dorado-refresh.sh — refresh the Dorado Bench market rail every 15 min.
# Writes the snapshot to BOTH:
#   (1) deploy2's SOVOS/living/ (the living-data store, other surfaces read it)
#   (2) councilof-ai-wt/public/arena/dorado_market.json (the /api/dorado static
#       snapshot — committed so the CF Pages build carries fresh market rows;
#       the endpoint fetches it at request time, no build-time global needed)
#
# 2026-08-24: venv moved from /tmp (ephemeral — cleaned on disk reclaim, guard
# silently died twice) to ~/.dorado-venv (persistent). Auto-bootstraps if missing.
set -uo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
PY="$HOME/.dorado-venv/bin/python"
if [ ! -x "$PY" ]; then
  python3 -m venv "$HOME/.dorado-venv" 2>/dev/null
  "$HOME/.dorado-venv/bin/pip" install -q yfinance 2>/dev/null
fi
[ -x "$PY" ] || exit 0
"$PY" "$HOME/clawd/scripts/flywheel/dorado_market.py" > /dev/null 2>&1
cp /tmp/dorado_market.json "$HOME/clawd/csoai-static-deploy2/SOVOS/living/dorado_market.json" 2>/dev/null
cp /tmp/dorado_market.json "$HOME/councilof-ai-wt/public/arena/dorado_market.json" 2>/dev/null
echo "$(date -u +%H:%M) dorado refreshed" >> "$HOME/clawd/_evacuation/logs/dorado-refresh.log"
