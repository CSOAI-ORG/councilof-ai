#!/bin/bash
# pod-supervisor.sh — keep the estate's Busabase writers alive on this pod.
#
# WHY (2026-11-01). The Busabase runtime used to live in /opt, which is the pod's CONTAINER
# disk. RunPod recreates the container on every stop/resume/reclaim, so /opt came back empty
# and the writers could not start: the substrate went dark from the owner's machine as a bare
# "connection refused", with no pod-level explanation. /workspace (the RunPod NETWORK VOLUME)
# survives a container recreate; /opt does not.
#
# So: the runtime and the pinned node binary now live on the volume, and this loop re-runs the
# estate's own start-all.sh whenever a store's port goes dark. It never invents a store: the
# estate's busabase-instance.sh still refuses to create an empty one.
#
# The estate's own watchdog (bin/busabase-substrate-watchdog.sh) is run alongside: it probes
# the FILESYSTEM the store writes to, separately from the port, and keeps its health record on
# POD-LOCAL disk, never on the volume it is watching.
set -uo pipefail

B=${BUSABASE_ROOT:-/workspace/busabase}
export BUSABASE_RUNTIME=${BUSABASE_RUNTIME:-$B/runtime-0.95.1}
export BUSABASE_NODE=${BUSABASE_NODE:-$B/node-v22.23.3/bin/node}
LOG=$B/logs/pod-supervisor.log
INTERVAL=${SUPERVISOR_INTERVAL:-60}

mkdir -p "$B/logs" 2>/dev/null
log() { echo "$(date -u +%FT%TZ) $*" >> "$LOG" 2>/dev/null; }

log "supervisor start pid $$ runtime=$BUSABASE_RUNTIME node=$BUSABASE_NODE"

# The estate's start-all.sh looks for the runtime at /opt/busabase/runtime-0.95.1 and rebuilds
# it there when it is missing. /opt is the CONTAINER disk, so that rebuild is both ephemeral
# and SLOW (thousands of small files on a FUSE network volume). Point /opt at the volume
# instead: start-all.sh then finds the runtime present and skips the rebuild entirely.
ensure_opt_links() {
  mkdir -p /opt/busabase
  [ -e /opt/busabase/runtime-0.95.1 ] || ln -sfn "$BUSABASE_RUNTIME" /opt/busabase/runtime-0.95.1
  [ -e /opt/busabase/node-v22.23.3 ] || ln -sfn "$B/node-v22.23.3" /opt/busabase/node-v22.23.3
}

while true; do
  ensure_opt_links
  for pair in "$B/primary 15429" "$B/csoai-primary 15430"; do
    set -- $pair; I=$1; P=$2
    if ! ss -ltnH "sport = :$P" 2>/dev/null | grep -q .; then
      log "$P not listening -> start-all.sh"
      bash "$B/start-all.sh" >> "$LOG" 2>&1
      sleep 3
      if ss -ltnH "sport = :$P" 2>/dev/null | grep -q .; then
        log "$P listening again"
      else
        log "$P STILL dark after start-all.sh"
      fi
    fi
  done
  bash "$B/bin/busabase-substrate-watchdog.sh" --once >> "$LOG" 2>&1 || true
  sleep "$INTERVAL"
done
