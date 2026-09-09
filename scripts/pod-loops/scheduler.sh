#!/bin/bash
# The pod has no cron. This is the supervised loop that stands in for it: wakes every 60 s, runs
# whatever is due (UTC), and relies on each job's own stamp() so a job runs at most once per slot
# even if the scheduler is restarted mid-slot. Start via `loops/start.sh`.
#
#   every 10 min   watchdog.sh              logs/watchdog.log
#   hourly  :05    root-check.sh            logs/root-check.log
#   every 6 hours runpod upload heartbeat  state/runpod-upload/latest.json
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
exec 8>"$STATE/scheduler.lock"
flock -n 8 || exit 0
log scheduler "START pid=$$ loops=$LOOPS"
while true; do
  H=$(date -u +%H); M=$(date -u +%M)
  # Repository shell files are intentionally safe to install as 0644. Invoke
  # each owned shell explicitly through bash instead of depending on mode bits.
  bash "$LOOPS/watchdog.sh" 8>&- >/dev/null 2>&1
  [ "$M" -ge 5 ] && bash "$LOOPS/root-check.sh" 8>&- >/dev/null 2>&1
  # The one-shot helper owns its durable six-hour due time and upload lock.
  # Close the scheduler lease in children so a long upload cannot block recovery.
  python3 /workspace/council-of-ai/scripts/runpod_gspc_upload_heartbeat.py \
    --state-dir "$STATE/runpod-upload" 8>&- >>"$LOGS/runpod-upload.log" 2>&1 &
  due() { [ "$H" = "$1" ] && [ "${M#0}" -ge "${2#0}" ]; }
  if due 03 00 && stamp bazaar-conformance; then nohup bash "$LOOPS/bazaar-conformance.sh" --now 8>&- >/dev/null 2>&1 & fi
  if due 03 30 && stamp settlement-dry;      then nohup bash "$LOOPS/settlement-dry.sh" --now 8>&- >/dev/null 2>&1 & fi
  if due 04 00 && stamp revenue-snapshot;    then nohup bash "$LOOPS/revenue-snapshot.sh" --now 8>&- >/dev/null 2>&1 & fi
  if due 05 00 && stamp hubcard-refresh;     then nohup bash "$LOOPS/hubcard-refresh.sh" --now 8>&- >/dev/null 2>&1 & fi
  if due 05 30 && stamp hf-flush;            then (exec 8>&-; python3 "$LOOPS/hf_upload.py" --flush 2>&1 | while read -r l; do log hf-flush "$l"; done) & fi
  sleep 60 8>&-
done
