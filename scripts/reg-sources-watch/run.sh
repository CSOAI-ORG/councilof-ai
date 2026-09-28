#!/bin/bash
# SPDX-License-Identifier: Apache-2.0
# run.sh - daily regulatory-sources watch (reaction-loop slice 4). OFF BY DEFAULT.
#
# It does nothing unless the file ENABLED exists next to this script (or REG_SOURCES_WATCH=1 is set), so that
# installing the cron line below cannot start it by accident. Enabling is an owner decision (see README.md).
#
# One line per run to ~/lanes/logs/reg-sources-watch.log:
#   rc=0 state=NO_CHANGE | rc=2 state=CHANGED (a human reads DATA/<sealed_id>/history/review-queue.jsonl)
#   | rc=1 state=FAILED step=... | rc=0 state=DISABLED
# Proposed cron (NOT installed), before capsule-daily 08:05Z and after claim-watch 07:50Z:
#   40 7 * * * flock -n /tmp/reg-sources-watch.lock env FLOOR_ROOT_M=512 $HOME/lanes/bin/disk-floor.sh reg-sources-watch $HOME/lanes/logs/reg-sources-watch.log bash $HOME/lanes/regulatory-watch-20260928/run.sh >/dev/null 2>&1
set -uo pipefail
L=$(cd "$(dirname "$0")" && pwd)
LOG=$HOME/lanes/logs/reg-sources-watch.log
DATA=${REG_SOURCES_WATCH_DATA:-/evac-bulk/reg-sources-watch}
mkdir -p "$(dirname "$LOG")"
ts() { date -u +%Y-%m-%dT%H:%M:%SZ; }
if [ ! -e "$L/ENABLED" ] && [ "${REG_SOURCES_WATCH:-0}" != "1" ]; then
  echo "$(ts) job=reg-sources-watch rc=0 state=DISABLED (no $L/ENABLED; owner decision)" >> "$LOG"
  exit 0
fi
# Disk floor even without the wrapper: the watcher writes kilobytes, but never onto a nearly full volume.
free_m=$(df -Pm "$(dirname "$DATA")" 2>/dev/null | awk 'NR==2{print $4}')
if [ -n "$free_m" ] && [ "$free_m" -lt 512 ]; then
  echo "$(ts) job=reg-sources-watch rc=1 state=FAILED step=disk-floor free_m=$free_m" >> "$LOG"
  exit 1
fi
OUT=$(cd "$L" && nice -n 10 timeout 900 /usr/bin/python3 reg_sources_watch.py run --sources "$L/sources.json" --data "$DATA" 2>&1)
rc=$?
last=$(printf '%s\n' "$OUT" | tail -1)
case "$last" in rc=*) ;; *) last="rc=1 state=FAILED step=wrapper exit=$rc tail=$(printf '%s' "$OUT" | tail -c 300 | tr '\n' ' ')";; esac
echo "$(ts) job=reg-sources-watch $last" >> "$LOG"
exit $rc
