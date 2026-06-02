#!/bin/bash
# MEOK / SOV3 Unified Guardian
# Auto-restarts critical services after 3 consecutive failures.
# Logs to /tmp/meok_guardian.log and writes status to shared knowledge.

set -uo pipefail

# ─── Singleton guard (atomic mkdir lock) ──────────────────────────────────────
# Root cause of the 2026-06-02 SOV3 crash-loop: cron (*/2) plus launchd spawned
# many overlapping guardians with no mutual exclusion, so multiple restart_sov3()
# passes raced on port 3101 (Errno 48) and the service could never stay up.
# This lock guarantees only ONE guardian runs at a time. mkdir is atomic and
# needs no external dependency (macOS has no flock by default).
GUARDIAN_LOCK="/tmp/meok-guardian.lock"
if ! mkdir "$GUARDIAN_LOCK" 2>/dev/null; then
  if [ -f "$GUARDIAN_LOCK/pid" ] && kill -0 "$(cat "$GUARDIAN_LOCK/pid" 2>/dev/null)" 2>/dev/null; then
    exit 0   # another guardian is alive — bail silently
  fi
  rm -rf "$GUARDIAN_LOCK" 2>/dev/null; mkdir "$GUARDIAN_LOCK" 2>/dev/null || exit 0
fi
echo $$ > "$GUARDIAN_LOCK/pid"
trap 'rm -rf "$GUARDIAN_LOCK"' EXIT

LOG="/tmp/meok_guardian.log"
STATUS_DIR="/Users/nicholas/.clawdbot/shared-knowledge/status"
MEMORY_DIR="/Users/nicholas/clawd/memory"
PYTHON="$(command -v python3 || echo /Library/Developer/CommandLineTools/usr/bin/python3)"
CHECK_INTERVAL=30
MAX_FAILS=3

# Ensure status dir exists; fall back to local path if iCloud symlink is broken
if ! mkdir -p "$STATUS_DIR" 2>/dev/null || ! [ -w "$STATUS_DIR" ]; then
  STATUS_DIR="/tmp/meok-guardian-status"
  mkdir -p "$STATUS_DIR"
fi
mkdir -p "$MEMORY_DIR"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG"; }

# Track fail counts in memory files (simple integer files)
fail_file() { echo "/tmp/guardian_fail_${1}.count"; }
get_fails() { local f="$(fail_file "$1")"; cat "$f" 2>/dev/null || echo 0; }
inc_fails() { local f="$(fail_file "$1")"; local c=$(($(get_fails "$1") + 1)); echo "$c" > "$f"; }
reset_fails() { local f="$(fail_file "$1")"; echo 0 > "$f"; }

# ─── Health Checks ───────────────────────────────────────────────────────────

check_meok_ui() {
  # Port 3000 is now Hermes WhatsApp bridge, not MEOK UI
  # Check /health endpoint (Hermes returns JSON even when disconnected)
  local code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 http://localhost:3000/health 2>/dev/null)
  [[ "$code" == "200" ]]
}

check_sov3() {
  local code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 15 http://localhost:3101/health 2>/dev/null)
  [[ "$code" == "200" ]]
}

check_meok_mcp() {
  local code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 http://localhost:3102/health 2>/dev/null)
  [[ "$code" == "200" ]]
}

check_meok_api() {
  local code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 http://localhost:3200/api/health 2>/dev/null)
  [[ "$code" == "200" ]]
}

check_farm_vision() {
  local code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 --max-time 5 http://localhost:8888/ 2>/dev/null)
  [[ "$code" == "200" ]]
}

check_postgres() {
  pg_isready -h 127.0.0.1 -p 5432 -q 2>/dev/null
}

check_ollama() {
  local code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 --max-time 5 http://localhost:11434/api/tags 2>/dev/null)
  [[ "$code" == "200" ]]
}

# ─── Restart Actions ─────────────────────────────────────────────────────────

restart_meok_ui() {
  # Port 3000 is now Hermes WhatsApp bridge
  log "[RESTART] Hermes WhatsApp (3000)"
  # Don't restart Hermes — it needs manual QR scan to reconnect
  # Just log the failure and move on
  log "[INFO] Hermes is disconnected (needs QR scan). Skipping auto-restart."
}

wait_for_port_free() {  # return 0 once port $1 is NOT listening, within $2 seconds
  local port=$1 timeout=$2 i=0
  while [ "$i" -lt "$timeout" ]; do
    lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 || return 0
    sleep 1; i=$((i+1))
  done
  return 1
}
wait_for_port_listen() {  # return 0 once port $1 IS listening, within $2 seconds
  local port=$1 timeout=$2 i=0
  while [ "$i" -lt "$timeout" ]; do
    lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 && return 0
    sleep 1; i=$((i+1))
  done
  return 1
}

restart_sov3() {
  log "[RESTART] SOV3 (3101)"
  # 1. Graceful TERM on the old master; wait up to 10s for the port to free.
  #    Only SIGKILL as a last resort. This avoids the Errno-48 collision.
  pkill -TERM -f "sovereign-mcp-server" 2>/dev/null || true
  wait_for_port_free 3101 10 || { pkill -9 -f "sovereign-mcp-server" 2>/dev/null || true; sleep 1; }
  # 2. Launch exactly ONE instance, bound to localhost (safe default).
  cd /Users/nicholas/clawd/sovereign-temple && HOST=127.0.0.1 nohup bash run-production.sh >> /tmp/sov3.log 2>&1 &
  echo $! > /tmp/sov3.pid
  # 3. Wait for the actual bind; give up cleanly instead of hammering forever.
  if wait_for_port_listen 3101 25; then
    log "[OK] SOV3 listening on 3101"
  else
    log "[FAIL] SOV3 did not bind 3101 in 25s — leaving for human, not re-hammering"
  fi
}

restart_meok_mcp() {
  log "[RESTART] MEOK MCP (3102)"
  bash /Users/nicholas/clawd/meok/team/start_meok.sh >> /tmp/meok_mcp_start.log 2>&1
  sleep 10
}

restart_meok_api() {
  log "[RESTART] MEOK API (3200)"
  pkill -f "uvicorn api.server:app --host 0.0.0.0 --port 3200" 2>/dev/null || true
  sleep 2
  cd /Users/nicholas/clawd/meok && nohup "$PYTHON" -m uvicorn api.server:app --host 0.0.0.0 --port 3200 >> /tmp/meok_api.log 2>&1 &
  sleep 10
}

restart_postgres() {
  log "[RESTART] PostgreSQL"
  brew services start postgresql@15 2>/dev/null || brew services start postgresql 2>/dev/null
  sleep 5
}

restart_ollama() {
  log "[RESTART] Ollama"
  pkill -f "ollama serve" 2>/dev/null || true
  sleep 2
  nohup ollama serve >> /tmp/ollama.log 2>&1 &
  sleep 5
}

restart_farm_vision() {
  log "[RESTART] Farm Vision (8888)"
  pkill -f "farm-vision/server.py" 2>/dev/null || true
  sleep 2
  cd /Users/nicholas/clawd/meok/farm-vision && nohup $PYTHON server.py >> /tmp/farm-vision.log 2>&1 &
  sleep 5
}

# ─── Main Guardian Loop ──────────────────────────────────────────────────────

run_guardian_cycle() {
  local any_restart=0
  local status_lines=""

  # Format: name check_func restart_func port
  local services=(
    "HERMES check_meok_ui restart_meok_ui 3000"
    "SOV3 check_sov3 restart_sov3 3101"
    "MEOK_MCP check_meok_mcp restart_meok_mcp 3102"
    "MEOK_API check_meok_api restart_meok_api 3200"
    "FARM_VISION check_farm_vision restart_farm_vision 8888"
    "POSTGRES check_postgres restart_postgres 5432"
    "OLLAMA check_ollama restart_ollama 11434"
  )

  for svc in "${services[@]}"; do
    read -r name check_fn restart_fn port <<< "$svc"
    if $check_fn; then
      reset_fails "$name"
      status_lines+="| $name | $port | ✅ |\n"
    else
      inc_fails "$name"
      local fails=$(get_fails "$name")
      status_lines+="| $name | $port | ⚠️ FAIL ${fails}/${MAX_FAILS} |\n"
      log "[$name] Health check failed (${fails}/${MAX_FAILS})"
      if [[ "$fails" -ge "$MAX_FAILS" ]]; then
        $restart_fn
        if $check_fn; then
          reset_fails "$name"
          status_lines+="| $name | $port | ✅ RESTORED |\n"
          any_restart=1
        else
          status_lines+="| $name | $port | ❌ STILL DOWN |\n"
        fi
      fi
    fi
  done

  # Write status snapshot
  local status_file="$STATUS_DIR/meok-guardian-latest.md"
  cat > "$status_file" <<EOF
# MEOK Guardian Status
**Generated:** $(date '+%Y-%m-%d %H:%M:%S %Z')

| Service | Port | Status |
|---------|------|--------|
$(echo -e "$status_lines")

**Any restart this cycle:** $any_restart
EOF

  # If any restart happened, also append to daily memory
  if [[ "$any_restart" -eq 1 ]]; then
    local mem_file="$MEMORY_DIR/$(date '+%Y-%m-%d')-guardian.md"
    echo "- $(date '+%H:%M:%S') — Guardian restored one or more services" >> "$mem_file"
  fi
}

# ─── Daemon or One-Shot Mode ────────────────────────────────────────────────

if [[ "${1:-}" == "--daemon" ]]; then
  log "=== MEOK Guardian daemon starting ==="
  while true; do
    run_guardian_cycle
    sleep "$CHECK_INTERVAL"
  done
else
  log "=== MEOK Guardian one-shot ==="
  run_guardian_cycle
fi
