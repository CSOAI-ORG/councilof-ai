#!/bin/bash
# Start/confirm one persistent-volume scheduler supervisor; tmux is not required.
set -u
. "$(dirname "$0")/lib.sh"
command -v flock >/dev/null || { echo "flock is required"; exit 1; }

scheduler_child_ready() {
  local p
  local -a arguments=()
  [ -r "$STATE/scheduler.pid" ] || return 1
  read -r p < "$STATE/scheduler.pid" || return 1
  [[ "$p" =~ ^[1-9][0-9]*$ ]] || return 1
  [ -r "/proc/$p/cmdline" ] || return 1
  mapfile -d '' -t arguments < "/proc/$p/cmdline" || return 1
  [[ "${arguments[0]:-}" == */bash || "${arguments[0]:-}" == bash ]] || return 1
  [[ "${arguments[1]:-}" == "$LOOPS/scheduler.sh" ]] || return 1
  # Process identity without the scheduler lease is not readiness.
  if flock -n "$STATE/scheduler.lock" true; then return 1; fi
  return 0
}

if ! flock -n "$STATE/supervisor.lock" true; then
  if scheduler_child_ready; then
    echo "scheduler supervisor and scheduler are already running"
    exit 0
  fi
  echo "Scheduler supervisor holds its lease but no verified scheduler child is ready"
  exit 1
fi
if alive "[s]cheduler.sh" && flock -n "$STATE/scheduler.lock" true; then
  echo "An older unmanaged scheduler is running; confirm and stop that scheduler before upgrading"
  exit 1
fi
nohup bash "$LOOPS/supervise.sh" >>"$LOGS/scheduler-supervisor.nohup.log" 2>&1 </dev/null &
for _ in {1..10}; do
  if ! flock -n "$STATE/supervisor.lock" true && scheduler_child_ready; then
    echo "scheduler supervisor and verified scheduler child are running"
    exit 0
  fi
  sleep 1
done
echo "FAILED to start a verified scheduler child"
exit 1
