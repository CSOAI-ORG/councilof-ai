#!/bin/bash
# Start/confirm one persistent-volume scheduler supervisor; tmux is not required.
set -u
. "$(dirname "$0")/lib.sh"
command -v flock >/dev/null || { echo "flock is required"; exit 1; }
if ! flock -n "$STATE/supervisor.lock" true; then
  echo "scheduler supervisor already running"
  exit 0
fi
if alive "[s]cheduler.sh" && flock -n "$STATE/scheduler.lock" true; then
  echo "An older unmanaged scheduler is running; confirm and stop that scheduler before upgrading"
  exit 1
fi
nohup bash "$LOOPS/supervise.sh" >>"$LOGS/scheduler-supervisor.nohup.log" 2>&1 </dev/null &
sleep 2
if flock -n "$STATE/supervisor.lock" true; then
  echo "FAILED to start scheduler supervisor"
  exit 1
fi
echo "scheduler supervisor is running"
