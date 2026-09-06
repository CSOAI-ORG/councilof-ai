#!/bin/bash
# Start (or confirm) the scheduler in a tmux session named "loops" — one session per lane, per README-LANES.
set -u
. "$(dirname "$0")/lib.sh"
chmod +x "$LOOPS"/*.sh
if alive "[s]cheduler.sh"; then echo "scheduler already running: pids $(pids_of '[s]cheduler.sh' | tr '\n' ' ')"; exit 0; fi
tmux has-session -t loops 2>/dev/null && tmux kill-session -t loops
tmux new-session -d -s loops -c "$LOOPS" "bash $LOOPS/scheduler.sh"
sleep 2
alive "[s]cheduler.sh" && echo "scheduler started in tmux session 'loops' (pids $(pids_of '[s]cheduler.sh' | tr '\n' ' '))" || { echo "FAILED to start scheduler"; exit 1; }
