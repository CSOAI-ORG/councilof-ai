#!/bin/bash
# One supervisor for the existing scheduler. No worker or model process starts here.
set -u
. "$(dirname "$0")/lib.sh"
exec 9>"$STATE/supervisor.lock"
flock -n 9 || exit 0
printf '%s\n' "$$" > "$STATE/supervisor.pid"
child=""
stop() {
  [ -z "$child" ] || kill -TERM "$child" 2>/dev/null || true
  exit 0
}
trap stop TERM INT
log scheduler-supervisor "START pid=$$"
while true; do
  # Keep the supervisor lease out of the scheduler and its job descendants.
  bash "$LOOPS/scheduler.sh" 9>&- &
  child=$!
  wait "$child"
  result=$?
  child=""
  log scheduler-supervisor "scheduler exited=$result; retry in 30 seconds"
  sleep 30 &
  child=$!
  wait "$child" || true
  child=""
done
