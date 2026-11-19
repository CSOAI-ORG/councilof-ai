#!/bin/bash
# pypi-footprint daily run (oracle-micro-2). Light: stdlib + one request/s, ~7 min, a few MB.
# Cron: 10 5 * * * flock -n /tmp/pypi-footprint.lock bash $HOME/lanes/pypi-footprint-20260927/run.sh >/dev/null 2>&1
set -uo pipefail
LANE=$HOME/lanes/pypi-footprint-20260927; LOG=$HOME/lanes/logs/pypi-footprint.log
TS=$(date -u +%FT%TZ)
FREE_ROOT=$(df -Pk / | awk 'NR==2{print int($4/1024)}')
if [ "$FREE_ROOT" -lt 512 ]; then echo "$TS job=pypi-footprint rc=1 FAILED_DISK_FLOOR root=${FREE_ROOT}M" >> "$LOG"; exit 1; fi
OUT=$(nice -n 15 python3 "$LANE/pypi_footprint.py" --publish --out-dir "$HOME/lanes/out/pypi-footprint" 2>>"$LANE/progress.log")
RC=$?
echo "$TS job=pypi-footprint rc=$RC $OUT" >> "$LOG"
exit $RC
