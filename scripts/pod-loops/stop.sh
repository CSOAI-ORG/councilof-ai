#!/bin/bash
# Stop the scheduler (and nothing else: the GSPC worker and the mill are never touched by this).
set -u
. "$(dirname "$0")/lib.sh"
for p in $(pids_of "[s]cheduler.sh"); do kill "$p" 2>/dev/null && log scheduler "STOP pid=$p by stop.sh"; done
tmux kill-session -t loops 2>/dev/null
echo "scheduler stopped; in-flight daily jobs (if any) finish on their own"
