#!/bin/bash
# The pod has no cron. This is the supervised loop that stands in for it: wakes every 60 s, runs
# whatever is due (UTC), and relies on each job's own stamp() so a job runs at most once per slot
# even if the scheduler is restarted mid-slot. Run it under tmux: `loops/start.sh`.
#
#   every 10 min   watchdog.sh              logs/watchdog.log
#   hourly  :05    root-check.sh            logs/root-check.log
#   03:00Z         bazaar-conformance.sh    logs/bazaar-conformance.log
#   03:30Z         settlement-dry.sh        logs/settlement-dry.log
#   04:00Z         revenue-snapshot.sh      logs/revenue-snapshot.log
#   05:00Z         hubcard-refresh.sh       logs/hubcard-refresh.log
#   05:30Z         hf_upload.py --flush     logs/hf-flush.log   (pushes anything queued while no token existed)
#
# A daily job is "due" for the whole hour after its start minute, so a scheduler that was down at
# 03:00 and back at 03:40 still runs it once that day. Jobs run in the background so a slow census
# never delays the watchdog.
set -u
. "$(dirname "$0")/lib.sh"
log scheduler "START pid=$$ loops=$LOOPS"
while true; do
  H=$(date -u +%H); M=$(date -u +%M)
  "$LOOPS/watchdog.sh" >/dev/null 2>&1
  [ "$M" -ge 5 ] && "$LOOPS/root-check.sh" >/dev/null 2>&1
  due() { [ "$H" = "$1" ] && [ "${M#0}" -ge "${2#0}" ]; }
  if due 03 00 && stamp bazaar-conformance; then nohup "$LOOPS/bazaar-conformance.sh" --now >/dev/null 2>&1 & fi
  if due 03 30 && stamp settlement-dry;      then nohup "$LOOPS/settlement-dry.sh" --now >/dev/null 2>&1 & fi
  if due 04 00 && stamp revenue-snapshot;    then nohup "$LOOPS/revenue-snapshot.sh" --now >/dev/null 2>&1 & fi
  if due 05 00 && stamp hubcard-refresh;     then nohup "$LOOPS/hubcard-refresh.sh" --now >/dev/null 2>&1 & fi
  if due 05 30 && stamp hf-flush;            then (python3 "$LOOPS/hf_upload.py" --flush 2>&1 | while read -r l; do log hf-flush "$l"; done) & fi
  sleep 60
done
