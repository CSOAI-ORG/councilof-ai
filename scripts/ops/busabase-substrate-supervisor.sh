#!/bin/bash
# busabase-substrate-supervisor.sh — M4 side: make sure the estate's Busabase substrate is
# actually serving, and wake it if it is not.
#
# WHY THIS EXISTS (2026-11-01). The estate's substrate is a Busabase store on a RunPod pod,
# reached from the M4 through ONE ssh tunnel. On 1 Nov the substrate was dark and the reason
# was not "the pod is down": the pod was RUNNING, but its writers were dead, because the
# Busabase runtime lived in the pod's /opt — which is the pod's CONTAINER disk, and RunPod
# recreates the container on every stop/resume/reclaim. /workspace (the network volume)
# survives; /opt does not. So the substrate went dark every time the pod was reclaimed, and
# the owner saw a bare "connection refused".
#
# Three layers now keep it up, and each one covers the failure of the layer below it:
#   1. pod-supervisor.sh (on the pod) re-runs the estate's own start-all.sh when a port goes
#      dark, and points the runtime at the VOLUME, not /opt.
#   2. this script (on the M4) wakes the pod and relaunches (1) whenever the substrate is dark.
#   3. the launchd tunnel resolves the pod endpoint at launch, so a rotated endpoint is not a
#      dead tunnel.
#
# This script never writes to the store and never prints a credential.
#
# Exit: 0 = substrate serving; 1 = still dark after the wake attempt.

set -uo pipefail

POD_ID="${BUSABASE_POD_ID:-6sr24tuhwl62sw}"
PORT="${BUSABASE_PORT:-15430}"
LOG="${SUPERVISOR_LOG:-/Users/nicholas/workspace_for_ai/busabase-tunnels/logs/substrate-supervisor.log}"
SSH_HELPER=/Users/nicholas/.runpod/csoai-ssh.sh
PROBE_URL="http://127.0.0.1:${PORT}/api/v1/bases"

mkdir -p "$(dirname "$LOG")" 2>/dev/null
log() { echo "$(date -u +%FT%TZ) $*" >> "$LOG" 2>/dev/null; }

probe() {
  /usr/bin/curl -s -o /dev/null -m 8 -w '%{http_code}' "$PROBE_URL" 2>/dev/null
}

code=$(probe)
if [ "$code" = "200" ]; then
  log "substrate serving on ${PORT} (http=${code})"
  exit 0
fi
log "substrate dark on ${PORT} (http=${code}) — waking pod ${POD_ID}"

# 1. The pod must be running before anything can be launched on it.
status=$(runpodctl pod get "$POD_ID" -o json 2>/dev/null | python3 -c 'import sys,json;print(json.load(sys.stdin).get("runtimeStatus",""))' 2>/dev/null)
if [ "$status" != "running" ]; then
  log "pod runtimeStatus=${status:-unknown} — runpodctl pod start"
  runpodctl pod start "$POD_ID" >/dev/null 2>&1 || log "pod start returned non-zero"
  sleep 45
fi

# 2. Relaunch the pod-side supervisor, detached from this SSH session.
out=$(POD_ID="$POD_ID" "$SSH_HELPER" \
  'setsid nohup bash /workspace/busabase/pod-supervisor.sh >> /workspace/busabase/logs/pod-supervisor.out 2>&1 < /dev/null & echo launched' 2>&1 | tail -1)
log "pod supervisor launch: ${out}"

# 3. Give it a moment, then re-probe.
sleep 20
code=$(probe)
if [ "$code" = "200" ]; then
  log "substrate serving after wake (http=${code})"
  exit 0
fi
log "substrate STILL dark after wake (http=${code})"
exit 1
