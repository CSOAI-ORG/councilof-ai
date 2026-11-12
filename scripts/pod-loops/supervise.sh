#!/bin/bash
# Container restarts wipe /root; the pod->Oracle mirror key lives on /workspace (added 2026-09-25).
[ -f /workspace/secrets/ssh/config ] && { mkdir -p /root/.ssh; grep -qs "Include /workspace/secrets/ssh/config" /root/.ssh/config || { printf "Include /workspace/secrets/ssh/config\n" | cat - /root/.ssh/config 2>/dev/null > /root/.ssh/config.new || true; mv /root/.ssh/config.new /root/.ssh/config; chmod 600 /root/.ssh/config; }; }
# Desktop Commander device keepalive (added 2026-09-17)
[ -x /workspace/tools/dc/keepalive.sh ] && pgrep -f dc/keepalive.sh >/dev/null || setsid nohup /workspace/tools/dc/keepalive.sh >/dev/null 2>&1 < /dev/null &
# One supervisor for the existing scheduler. No worker or model process starts here.
set -u
. "$(dirname "$0")/lib.sh"
exec 9>"$STATE/supervisor.lock"
flock -n 9 || exit 0
printf '%s\n' "$$" > "$STATE/supervisor.pid"
child=""
stop() {
  if [ -n "$child" ]; then
    kill -TERM "$child" 2>/dev/null || true
    wait "$child" 2>/dev/null || true
  fi
  : > "$STATE/scheduler.pid"
  exit 0
}
trap stop TERM INT
log scheduler-supervisor "START pid=$$"
while true; do
  # Keep the supervisor lease out of the scheduler and its job descendants.
  bash "$LOOPS/scheduler.sh" 9>&- &
  child=$!
  printf '%s\n' "$child" > "$STATE/scheduler.pid"
  wait "$child"
  result=$?
  child=""
  : > "$STATE/scheduler.pid"
  log scheduler-supervisor "scheduler exited=$result; retry in 30 seconds"
  sleep 30 &
  child=$!
  wait "$child" || true
  child=""
done
