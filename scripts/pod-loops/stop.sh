#!/bin/bash
# Stop only the recorded supervisor; it terminates its own scheduler child.
set -u
. "$(dirname "$0")/lib.sh"
if flock -n "$STATE/supervisor.lock" true; then
  echo "No managed supervisor is running; unmanaged processes are untouched"
  exit 0
fi
read -r p < "$STATE/supervisor.pid"
[[ "$p" =~ ^[1-9][0-9]*$ ]] || { echo "Invalid supervisor pid file"; exit 1; }
mapfile -d '' -t arguments < "/proc/$p/cmdline"
[[ "${arguments[0]##*/}" == bash && "${arguments[1]:-}" == "$LOOPS/supervise.sh" ]] || {
  echo "Recorded PID does not match the scheduler supervisor; nothing stopped"
  exit 1
}
kill -TERM "$p"
log scheduler "STOP requested for verified supervisor pid=$p"
echo "scheduler stop requested; in-flight jobs finish and worker/mill are untouched"
