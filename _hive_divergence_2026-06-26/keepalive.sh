#!/bin/bash
# MEOK Sovereign Services Keep-Alive v2 — includes dashboard
LOG="/tmp/sovereign-keepalive.log"
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) keepalive tick v2" >> "$LOG"

check_and_restart() {
  local port=$1
  local name=$2
  local script=$3
  if ! lsof -nP -iTCP:$port -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) RESTART $name on :$port" >> "$LOG"
    nohup bash "$script" >> "$LOG" 2>&1 &
    disown
    sleep 3
    if lsof -nP -iTCP:$port -sTCP:LISTEN -t >/dev/null 2>&1; then
      echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $name RESTARTED on :$port" >> "$LOG"
    else
      echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $name FAILED to restart on :$port" >> "$LOG"
    fi
  fi
}

# Pre-built startup scripts in /home/nicholas/meok-compliance-gateway/starters/
GW="/home/nicholas/meok-compliance-gateway"
ST="$GW/starters"
PY="/home/nicholas/sov3/.venv/bin/python"

# Service 1: Keystone :8888
check_and_restart 8888 "keystone" "$ST/keystone.sh"

# Service 2: MEOK EU Compliance Gateway :8889
check_and_restart 8889 "eu-compliance-gateway" "$ST/eu-compliance-gateway.sh"

# Service 3: MEOK Sovereign OLM Router :8890
check_and_restart 8890 "sovereign-olm-router" "$ST/sovereign-olm-router.sh"

# Service 4: MEOK Sovereign Dashboard :8891
check_and_restart 8891 "sovereign-dashboard" "$ST/sovereign-dashboard.sh"

echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) keepalive tick complete (4 services)" >> "$LOG"
