#!/bin/bash
# x402 buyer canary (lane x402-revenue-20260928) — daily on Oracle, after the 01:05Z census.
# GETs every door in the live /.well-known/x402.json exactly as advertised, 3 probes each, pays nothing,
# publishes nothing. Records under /evac-bulk/x402-buyer-canary; one line per run to ~/lanes/logs/x402-buyer-canary.log.
# Code: scripts/x402-buyer-canary.py (copied to ~/lanes/x402-buyer-canary-20260928/ on Oracle until it lands).
# Cron (Oracle, installed 2026-09-28): 35 1 * * * flock -n /tmp/x402-buyer-canary.lock bash $HOME/lanes/x402-buyer-canary-20260928/run.sh
set -uo pipefail
LOG=$HOME/lanes/logs/x402-buyer-canary.log
OUT=/evac-bulk/x402-buyer-canary
ts() { date -u +%Y-%m-%dT%H:%M:%SZ; }
FREE_ROOT=$(df -Pk / | awk 'NR==2{print int($4/1024)}')
FREE_BULK=$(df -Pk /evac-bulk 2>/dev/null | awk 'NR==2{print int($4/1024)}'); FREE_BULK=${FREE_BULK:-0}
if [ "$FREE_ROOT" -lt 300 ] || [ "$FREE_BULK" -lt 1500 ]; then
  echo "$(ts) FAILED_DISK_FLOOR root=${FREE_ROOT}M bulk=${FREE_BULK}M; nothing run" >> "$LOG"; exit 1
fi
AVAIL=$(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo)
if [ "$AVAIL" -lt 80 ]; then echo "$(ts) FAILED_LOW_MEMORY avail=${AVAIL}M; nothing run" >> "$LOG"; exit 1; fi
mkdir -p "$OUT"
LINE=$(nice -n 10 timeout 1800 python3 "$HOME/lanes/x402-buyer-canary-20260928/x402-buyer-canary.py" --out "$OUT" --probes 3 2>&1 | tail -1)
rc=${PIPESTATUS[0]}
echo "$(ts) rc=$rc $LINE" >> "$LOG"
exit $rc
