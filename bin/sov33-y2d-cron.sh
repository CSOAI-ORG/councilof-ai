#!/usr/bin/env bash
# sov33-y2d-cron.sh — the auto-cycle cron that runs the Y2D framework
# every 6 hours, decomposing any new SOV33 goals and emitting sovereign-bound
# SIGIL hops. Per the compounding flywheel (P6): each cycle is 50% the time
# of the last.
#
# Schedule: every 6h via LaunchAgent
# Logs: ~/.sovereign/y2d/cron.log

set -e

export PATH="/Users/nicholas/.local/bin:$PATH"
export PYTHONPATH="/Users/nicholas/.sovereign/ml-venv/lib/python3.11/site-packages"

LOG=/Users/nicholas/.sovereign/y2d/cron.log
mkdir -p "$(dirname "$LOG")"

cd /Users/nicholas/clawd/_alignment/sovereign_merge_kit

# Rotate last 100 lines
if [ -f "$LOG" ] && [ "$(wc -l < "$LOG")" -gt 200 ]; then
    tail -100 "$LOG" > "$LOG.tmp"
    mv "$LOG.tmp" "$LOG"
fi

echo "=== Y2D cron tick at $(date -u +%FT%TZ) ===" >> "$LOG"

# Run the time stats
~/.sovereign/ml-venv/bin/python sov33_years_to_days.py time >> "$LOG" 2>&1

# Run one cycle with the standard auto-goal
~/.sovereign/ml-venv/bin/python sov33_years_to_days.py cycle \
    "improve the sovereign substrate (auto-cycle, $RANDOM)" \
    --name "auto-$(date -u +%Y%m%d-%H%M)" >> "$LOG" 2>&1

echo "=== End tick ===" >> "$LOG"