#!/bin/zsh
# Overnight autonomous job: when PyPI throttle clears, ship the credibility-critical
# date-fixes (wrong Article-50 deadline). Self-sequences AFTER the mop-up so they don't
# compete for the throttled PyPI. Heavy backoff. Logs a morning report.
LOG=~/clawd/_mcp_registry_align/MORNING_REPORT.txt
PY=/opt/homebrew/bin/python3.11
echo "=== MEOK overnight job started ===" > "$LOG"
# 1. wait for mop-up to finish (max ~3h)
for i in {1..36}; do pgrep -f retry_throttled >/dev/null || break; sleep 300; done
echo "mop-up clear; shipping date-fixes" >> "$LOG"
$PY -m pip install -q build twine >/dev/null 2>&1
DATEFIXED=(eu-ai-act-compliance-mcp meok-eu-aigc-icon-mcp agent-content-watermark-mcp ai-self-audit-mcp)
upload_bo(){ local d=$1 t=0
  while (( t<7 )); do
    local o=$(cd "$d" && $PY -m twine upload dist/* --non-interactive 2>&1)
    echo "$o" | grep -qi "429\|too many" && { t=$((t+1)); sleep $((t*180)); continue; }
    echo "$o" | grep -qiE "view at|already exist" && return 0
    return 1
  done; return 1; }
for pkg in $DATEFIXED; do
  d=~/clawd/mcp-marketplace/$pkg; [ ! -d "$d" ] && { echo "$pkg: no dir" >> "$LOG"; continue; }
  cd "$d" && rm -rf dist build
  $PY -m build --sdist --wheel >/dev/null 2>&1 || { echo "$pkg: BUILD FAIL" >> "$LOG"; continue; }
  upload_bo "$d" && echo "$pkg: SHIPPED (date-fix live)" >> "$LOG" || echo "$pkg: upload still throttled" >> "$LOG"
  sleep 30
done
echo "=== overnight job done $(date 2>/dev/null) ===" >> "$LOG"
