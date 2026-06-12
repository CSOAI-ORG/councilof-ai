#!/bin/bash
# Layer 0 FastAPI Watchdog
# Ensures the csoai-org-v2/layer0_tunnels/main.py server stays up on :8000.
# If /health doesn't return 200, restart it. Logs to /tmp/layer0_watchdog.log.

set -uo pipefail

LOCK="/tmp/layer0_watchdog.lock"
if ! mkdir "$LOCK" 2>/dev/null; then
  if [ -f "$LOCK/pid" ] && kill -0 "$(cat "$LOCK/pid" 2>/dev/null)" 2>/dev/null; then
    exit 0
  fi
  rm -rf "$LOCK" 2>/dev/null
  mkdir "$LOCK" 2>/dev/null || exit 0
fi
echo $$ > "$LOCK/pid"
trap 'rm -rf "$LOCK"' EXIT

LOG="/tmp/layer0_watchdog.log"
DIR="/Users/nicholas/clawd/csoai-org-v2/layer0_tunnels"
PORT=8000
PYTHON="$(command -v python3 || echo /Library/Developer/CommandLineTools/usr/bin/python3)"

# Health check
HEALTH=$(curl -s -m 5 -o /dev/null -w "%{http_code}" http://localhost:${PORT}/health 2>/dev/null || echo "000")

if [ "$HEALTH" = "200" ]; then
  # Healthy — exit silently
  exit 0
fi

# Unhealthy — restart
echo "$(date -u +%FT%TZ) layer0 unhealthy (HTTP $HEALTH), restarting" >> "$LOG"

# Kill any lingering process on the port
PID=$(lsof -ti :${PORT} 2>/dev/null | head -1)
if [ -n "$PID" ]; then
  kill -9 "$PID" 2>/dev/null
  sleep 1
fi

# Start fresh
cd "$DIR"
nohup "$PYTHON" -m uvicorn main:app --host 0.0.0.0 --port ${PORT} --log-level warning \
  >> /tmp/layer0.log 2>&1 &

echo "$(date -u +%FT%TZ) layer0 restarted, PID $!" >> "$LOG"
