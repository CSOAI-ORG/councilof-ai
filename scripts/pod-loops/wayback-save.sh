#!/bin/bash
# wayback-save.sh -- ask the Wayback Machine for our claim URLs and record only the
# captures the CDX index confirms. Registered 2026-09-22 by the index-presence lane.
#
# The save request's HTTP status is not evidence. Measured 2026-09-22: the anonymous GET
# route answers 500 and captures anyway, the POST route answers 401 "You need to be
# logged in" for a URL the GET route then captured, and some requests take no effect at
# all. So a capture counts here only when it appears in CDX and the archived bytes read
# back.
#
# The scheduler owns the stamp; this script takes --now. One receipt line per run,
# including "nothing to do".
set -u
. "$(dirname "$0")/lib.sh"
LOG=wayback-save
PY="$LOOPS/wayback_save.py"
[ "${1:-}" = "--now" ] || { log $LOG "SKIP not invoked with --now (the scheduler owns the stamp)"; exit 0; }
exec 9>"$STATE/$LOG.lock"
flock -n 9 || { log $LOG "SKIP another run holds the lock"; exit 0; }
[ -f "$PY" ] || { log $LOG "SKIP archiver absent at $PY -- nothing requested"; exit 0; }
o=$(WAYBACK_OUT="$OUT/index-presence" python3 "$PY" --budget "${WAYBACK_BUDGET:-4}" 2>&1)
rc=$?
echo "$o" >> "$LOGS/$LOG.detail.log"
line=$(printf '%s\n' "$o" | grep -m1 '^\[result\]')
[ -n "$line" ] || line="no [result] line; exit $rc; see $LOGS/$LOG.detail.log"
log $LOG "rc=$rc $line"
exit 0
