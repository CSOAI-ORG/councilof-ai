#!/bin/bash
# scripts/self-parity/run.sh - the one entry point cron calls (oracle-micro-2, daily 05:10Z).
# flock is on the cron line. Here: disk floor (FAILED_DISK_FLOOR if /evac-bulk < 2G or / < 300M),
# a wait for >= 150 MB available memory (1 GB host), nice 15 + idle IO, then self_parity.py run.
# Exactly one line per run to ~/lanes/logs/self-parity.log; state in ~/fleet/self_parity.json.
# Measures our own listings only: registers, posts and publishes nothing.
set -uo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=${SELF_PARITY_ROOT:-/evac-bulk/self-parity}; LOG=$HOME/lanes/logs/self-parity.log
STATUS=$HOME/fleet/self_parity.json
D=$(date -u +%F); TS=$(date -u +%FT%TZ)
mkdir -p "$ROOT/logs" "$(dirname "$LOG")" "$(dirname "$STATUS")"
status() { python3 -c 'import json,os,sys,datetime
p=sys.argv[1]
try: d=json.load(open(p))
except Exception: d={"schema":"csoai.self-parity-status/0.1"}
d.update(at=datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),result=sys.argv[2],date=sys.argv[3])
json.dump(d,open(p+".tmp","w"),indent=1); os.replace(p+".tmp",p)' "$STATUS" "$1" "$D"; }
FREE_BULK=$(df -Pk /evac-bulk | awk 'NR==2{print int($4/1024)}'); FREE_ROOT=$(df -Pk / | awk 'NR==2{print int($4/1024)}')
if [ "$FREE_BULK" -lt 2048 ] || [ "$FREE_ROOT" -lt 300 ]; then
  echo "$TS job=self-parity date=$D rc=1 result=FAILED_DISK_FLOOR bulk=${FREE_BULK}M root=${FREE_ROOT}M" >> "$LOG"
  status "FAILED_DISK_FLOOR bulk=${FREE_BULK}M root=${FREE_ROOT}M"; exit 1
fi
for i in $(seq 1 60); do AVAIL=$(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo); [ "$AVAIL" -ge 150 ] && break; sleep 30; done
if [ "$AVAIL" -lt 150 ]; then
  echo "$TS job=self-parity date=$D rc=1 result=FAILED_LOW_MEMORY avail=${AVAIL}M" >> "$LOG"; status "FAILED_LOW_MEMORY"; exit 1
fi
RUNLOG=$ROOT/logs/run-$D.log
nice -n 15 ionice -c3 python3 "$HERE/self_parity.py" run --out-root "$ROOT" --date "$D" --status "$STATUS" "$@" > "$RUNLOG" 2>&1; rc=$?
[ $rc -ne 0 ] && status "EXIT_$rc"
echo "$TS job=self-parity date=$D rc=$rc bulk=${FREE_BULK}M $(grep -E 'DONE|ALREADY_DONE|FAILED|SIGN_|Error' "$RUNLOG" | tail -1 | cut -c22-220)" >> "$LOG"
exit $rc
