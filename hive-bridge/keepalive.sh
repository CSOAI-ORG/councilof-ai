#!/usr/bin/env bash
# Keep the SaaS sessions warm so Supabase/Google refresh tokens rotate and the
# on-disk profile keeps a valid JWT (the #1 operational failure mode per research).
# Run from cron every few hours. Pings benign authenticated pages via the bridge
# and flags any that bounce to a login wall so re-auth is a KNOWN step, not a
# silent breakage.
set -euo pipefail
PORT="${HIVE_BRIDGE_PORT:-8931}"
BASE="http://127.0.0.1:$PORT"
LOG="${HIVE_BRIDGE_LOG:-/tmp/hive-bridge.log}"

ping() { # url label
  local r
  r=$(curl -s -m 30 -X POST "$BASE/mcp" -H 'Content-Type: application/json' \
    -d "{\"action\":\"navigate\",\"args\":{\"url\":\"$1\"}}" 2>/dev/null || true)
  if echo "$r" | grep -qiE "sign in|log in|unauthorized|/login"; then
    echo "$(date '+%F %T') KEEPALIVE WARN: $2 needs re-auth (login wall)" | tee -a "$LOG"
  else
    echo "$(date '+%F %T') keepalive ok: $2" >> "$LOG"
  fi
}
ping "https://vercel.com/dashboard"   "vercel"
ping "https://lovable.dev/projects"   "lovable"
ping "https://dashboard.stripe.com"   "stripe"
