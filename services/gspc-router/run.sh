#!/bin/bash
# GSPC Route pod service: start (or restart) Ollama, route_service and agentgateway on THIS pod, loopback only.
# Decide-only. Intended host: the shared 4090 builder (~/fleet/build2-pod.env on Oracle), one job at a time.
#   bash services/gspc-router/run.sh [start|stop]
# Needs: node >= 20, the bundled core (bash build.sh on a host with node_modules, then copy dist/), ollama.
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
STATE=${GSPC_ROUTE_STATE:-/workspace/lanes/gspc-route-20260930}
LOGS=$STATE/logs; mkdir -p "$LOGS"
BIN=${GSPC_ROUTE_BIN:-/root/gspc-route/bin}
AGW_VERSION=v1.5.0
AGW_SHA256=daca5cda76e8c5ab0c1a75912fecf2d6365095403f810db72029c49d14a37e7b   # agentgateway-linux-amd64 v1.5.0 (release digest)
export OLLAMA_MODELS=${OLLAMA_MODELS:-$STATE/ollama-models} OLLAMA_HOST=127.0.0.1:11434

# Pidfiles, never pkill -f: a pattern also matches any shell whose command line merely mentions it.
stop() { for f in "$STATE"/route_service.pid "$STATE"/agentgateway.pid "$STATE"/ollama.pid; do [ -f "$f" ] && kill "$(cat "$f")" 2>/dev/null; rm -f "$f"; done; return 0; }
[ "${1:-start}" = stop ] && { stop; echo stopped; exit 0; }

# Disk floor: never start below 2 GB free where logs, records and models are written.
for d in "$STATE" "$(dirname "$OLLAMA_MODELS")" "$BIN"; do
  mkdir -p "$d"; free=$(df -Pk "$d" | awk 'NR==2{print $4}')
  [ "$free" -ge 2097152 ] || { echo "REFUSED: under 2 GB free at $d"; exit 3; }
done

mkdir -p "$BIN"
if ! echo "$AGW_SHA256  $BIN/agentgateway" | sha256sum -c --quiet 2>/dev/null; then
  curl -sSL -o "$BIN/agentgateway.tmp" "https://github.com/agentgateway/agentgateway/releases/download/$AGW_VERSION/agentgateway-linux-amd64"
  echo "$AGW_SHA256  $BIN/agentgateway.tmp" | sha256sum -c --quiet || { echo "REFUSED: agentgateway sha256 mismatch"; exit 4; }
  mv "$BIN/agentgateway.tmp" "$BIN/agentgateway"; chmod +x "$BIN/agentgateway"
fi
"$BIN/agentgateway" -f "$HERE/agentgateway.yaml" --validate-only
[ -f "$HERE/dist/route-core.mjs" ] || { echo "REFUSED: dist/route-core.mjs missing; run build.sh"; exit 5; }

stop
curl -sf "http://$OLLAMA_HOST/api/tags" >/dev/null || { nohup ollama serve >> "$LOGS/ollama.log" 2>&1 & echo $! > "$STATE/ollama.pid"; sleep 3; }
RECORDS_FILE="$STATE/records.jsonl" nohup node "$HERE/route_service.mjs" >> "$LOGS/route_service.log" 2>&1 & echo $! > "$STATE/route_service.pid"
nohup "$BIN/agentgateway" -f "$HERE/agentgateway.yaml" >> "$LOGS/agentgateway.log" 2>&1 & echo $! > "$STATE/agentgateway.pid"
for i in $(seq 1 30); do curl -sf http://127.0.0.1:3900/healthz >/dev/null && break; sleep 1; done
curl -sf http://127.0.0.1:3900/healthz && echo && echo "gspc-route up: 127.0.0.1:3900 (agentgateway) -> 127.0.0.1:8790 (route_service); records $STATE/records.jsonl"
