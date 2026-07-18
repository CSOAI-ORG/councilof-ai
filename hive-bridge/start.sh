#!/usr/bin/env bash
# hive-bridge — owned, always-on, authenticated browser service for the hives.
# Replaces the flaky Kimi WebBridge extension. Persistent Chrome profile logged
# in ONCE to Lovable / Vercel / Stripe / Google; hives drive last-mile UI actions
# over MCP at http://127.0.0.1:8931/mcp.
#
# Singleton-guarded (atomic mkdir lock) so guardian/cron can't pile up instances
# — the restart-storm lesson from meok-guardian.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
PROFILE="${HIVE_BRIDGE_PROFILE:-$HOME/.meok-browser-profile}"
PORT="${HIVE_BRIDGE_PORT:-8931}"
LOCK="/tmp/hive-bridge.lock"
LOG="${HIVE_BRIDGE_LOG:-/tmp/hive-bridge.log}"
BIN="$HERE/node_modules/.bin/playwright-mcp"

# --- singleton -------------------------------------------------------------
if ! mkdir "$LOCK" 2>/dev/null; then
  if [ -f "$LOCK/pid" ] && kill -0 "$(cat "$LOCK/pid")" 2>/dev/null; then
    echo "hive-bridge already running (pid $(cat "$LOCK/pid")) on :$PORT"; exit 0
  fi
  rm -rf "$LOCK"; mkdir "$LOCK"   # stale lock — reclaim
fi
echo $$ > "$LOCK/pid"
trap 'rm -rf "$LOCK"' EXIT INT TERM

[ -x "$BIN" ] || { echo "engine missing — run: cd $HERE && npm install"; exit 1; }
mkdir -p "$PROFILE"

echo "$(date '+%F %T') hive-bridge up :$PORT  profile=$PROFILE" | tee -a "$LOG"
# Headed, real Chrome channel, persistent profile, isolated from the user's Chrome.
exec "$BIN" \
  --browser chrome \
  --user-data-dir "$PROFILE" \
  --port "$PORT" \
  --host 127.0.0.1 \
  >> "$LOG" 2>&1
