#!/bin/bash
# runpod-ollama-bridge.sh — keep SSH tunnels to approved Ollama endpoints.
# RunPod endpoints drift across restarts → re-resolved via runpodctl.
# Oracle Cloud micros have static IPs → direct SSH.
#
# Tunnels:
#   11434 -> A100  DISABLED: no admitted workload; resolving a stopped pod
#                      through runpodctl resumes it at $1.59/hr
#   11436 -> Oracle micro1 (sov33-owem-micro) static IP
#   11437 -> Oracle micro2 (sov33-owem-micro2) static IP
#   11439 -> 3090  (sov-repull) via runpodctl
#
# A pod whose endpoint is not yet resolvable is skipped this cycle; launchd
# KeepAlive relaunches us, and each tunnel's ExitOnForwardFailure makes a stale
# endpoint fail fast so the next cycle re-resolves.
set -uo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$PATH"
RUNPOD_SSH_KEY="$HOME/.runpod/ssh/runpodctl-ssh-key"
ORACLE_SSH_KEY="$HOME/.ssh/id_ed25519"

# ── RunPod tunnels (dynamic IPs via runpodctl) ──────────────────────────────
start_runpod_tunnel() { # pod_id local_port
  local pod_id="$1" local_port="$2"
  local info ip port
  info=$(runpodctl ssh info "$pod_id" 2>/dev/null)
  ip=$(echo "$info" | python3 -c 'import json,sys
try:
    d=json.load(sys.stdin); print(d.get("ip",""))
except Exception: pass')
  port=$(echo "$info" | python3 -c 'import json,sys
try:
    d=json.load(sys.stdin); print(d.get("port",""))
except Exception: pass')
  if [ -z "$ip" ] || [ -z "$port" ]; then
    echo "$(date -u +%FT%TZ) $pod_id endpoint unresolved — skipping"
    return 0
  fi
  echo "$(date -u +%FT%TZ) $pod_id -> $ip:$port on :$local_port"
  ssh -N -L "$local_port:127.0.0.1:11434" -p "$port" \
    -o ServerAliveInterval=30 -o ServerAliveCountMax=3 \
    -o ExitOnForwardFailure=yes -o StrictHostKeyChecking=accept-new \
    -i "$RUNPOD_SSH_KEY" "root@$ip" &
}

# ── Oracle Cloud tunnels (static IPs) ───────────────────────────────────────
start_oracle_tunnel() { # host_ip local_port
  local host_ip="$1" local_port="$2"
  echo "$(date -u +%FT%TZ) oracle -> $host_ip on :$local_port"
  ssh -N -L "$local_port:127.0.0.1:11434" \
    -o ServerAliveInterval=30 -o ServerAliveCountMax=3 \
    -o ExitOnForwardFailure=yes -o StrictHostKeyChecking=accept-new \
    -i "$ORACLE_SSH_KEY" "ubuntu@$host_ip" &
}

# ── Initial launch ──────────────────────────────────────────────────────────
# A100 intentionally omitted. Do not resolve it here: `runpodctl ssh info` may
# resume a stopped pod, turning a tunnel health check into a paid-resource start.
start_oracle_tunnel "145.241.232.16"  11436   # sov33-owem-micro
start_oracle_tunnel "141.147.73.85"   11437   # sov33-owem-micro2
start_runpod_tunnel "fpowppss5ngtkw" 11439   # sov-repull (3090)

# ── Health check loop ───────────────────────────────────────────────────────
while :; do
  sleep 60

  # Re-resolve RunPod tunnels if dead
  for spec in "fpowppss5ngtkw 11439"; do
    set -- $spec
    pod_id="$1"; local_port="$2"
    if ! lsof -iTCP:"$local_port" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "$(date -u +%FT%TZ) re-resolving RunPod $pod_id for :$local_port"
      start_runpod_tunnel "$pod_id" "$local_port"
    fi
  done

  # Restart Oracle tunnels if dead
  for spec in "145.241.232.16 11436" "141.147.73.85 11437"; do
    set -- $spec
    host_ip="$1"; local_port="$2"
    if ! lsof -iTCP:"$local_port" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "$(date -u +%FT%TZ) re-connecting Oracle $host_ip for :$local_port"
      start_oracle_tunnel "$host_ip" "$local_port"
    fi
  done
done
