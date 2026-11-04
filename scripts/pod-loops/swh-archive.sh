#!/bin/bash
# swh-archive.sh -- ask Software Heritage to archive a few more of this estate's public
# git origins each day, and keep the SWHIDs. Registered 2026-09-22 by the index-presence
# lane.
#
# A succeeded save returns a SWHID: a permanent third-party, content-addressed record
# that those bytes existed on that date. It is not a claim that anyone reads them, and
# this loop never says otherwise.
#
# The scheduler owns the stamp; this script takes --now and never stamps itself.
# One receipt line per run, including the runs with nothing to do.
#
# Measured 2026-09-22 and worked WITH, not around:
#   * the anonymous save endpoint allows 10 requests per window (X-Ratelimit-Limit: 10),
#     so each run spends a budget and leaves the rest for tomorrow;
#   * github.com/CSOAI-ORG/* answers 404 to anonymous visitors, so SWH reports
#     visit_status "not_found" for it (request 2492509) while the Hugging Face origins
#     load in seconds. The GitHub origin stays in the list so that the day the account
#     flag is lifted, this loop records it instead of us guessing.
set -u
. "$(dirname "$0")/lib.sh"

LOG=swh-archive
PY="$LOOPS/swh_archive.py"

[ "${1:-}" = "--now" ] || { log $LOG "SKIP not invoked with --now (the scheduler owns the stamp)"; exit 0; }

exec 9>"$STATE/$LOG.lock"
flock -n 9 || { log $LOG "SKIP another run holds the lock"; exit 0; }

[ -f "$PY" ] || { log $LOG "SKIP archiver absent at $PY -- nothing submitted"; exit 0; }

o=$(SWH_OUT="$OUT/index-presence" python3 "$PY" --budget "${SWH_BUDGET:-8}" 2>&1)
rc=$?
echo "$o" >> "$LOGS/$LOG.detail.log"
line=$(printf '%s\n' "$o" | grep -m1 '^\[result\]')
[ -n "$line" ] || line="no [result] line; exit $rc; see $LOGS/$LOG.detail.log"
log $LOG "rc=$rc $line"
exit 0
