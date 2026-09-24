#!/bin/bash
# swh-visit-readback.sh -- read Software Heritage VISITS back for the source origins
# and record a failed visit as a fact. Registered 2026-09-23.
#
# WHY THIS EXISTS ALONGSIDE swh-archive.sh, which is NOT a duplicate of it:
# swh-archive.sh SUBMITS save requests and keeps a ledger of those that returned a
# SWHID. Three properties of that design hid a week-long outage:
#   * it appends github.com/CSOAI-ORG/councilof-ai LAST to a ~109-origin queue,
#     budgets 8 per run and breaks early on HTTP 429 (observed runs submitted 2),
#     so the canonical origin is starved -- zero lines in its detail log;
#   * its ledger retains only origins that HAVE a snapshot_swhid, so it read
#     "10 origins with a SWHID" while the canonical origin was failing;
#   * "accepted" is not archival. The loading task can fail afterwards, and did.
# This loop reads origin/<url>/visits/ for a short explicit list that no budget can
# starve. It submits nothing and publishes nothing.
#
# The scheduler owns the stamp; this script takes --now and never stamps itself.
# One receipt line per run, including runs where nothing changed.
set -u
. "$(dirname "$0")/lib.sh"

LOG=swh-visit-readback
CI=/workspace/ci/councilof-ai
PY="$CI/scripts/watch_swh_archival.py"
DEST="$OUT/swh-visits"

[ "${1:-}" = "--now" ] || { log $LOG "SKIP not invoked with --now (the scheduler owns the stamp)"; exit 0; }

exec 9>"$STATE/$LOG.lock"
flock -n 9 || { log $LOG "SKIP another run holds the lock"; exit 0; }

[ -f "$PY" ] || { log $LOG "SKIP reader absent at $PY -- nothing read, and that is NOT a clean bill of health"; exit 0; }

mkdir -p "$DEST"
o=$(cd "$CI" && python3 "$PY" 2>&1); rc=$?

# The reader writes the door into its own checkout; keep the dated evidence here.
if [ -f "$CI/public/.well-known/software-heritage.json" ]; then
  cp "$CI/public/.well-known/software-heritage.json" "$DEST/$(today).json"
  cp "$CI/public/.well-known/software-heritage.json" "$DEST/latest.json"
fi

echo "$o" >> "$LOGS/$LOG.detail.log"
state=$(printf "%s\n" "$o" | grep -m1 "^estate_state:" | awk "{print \$2}")
fails=$(printf "%s\n" "$o" | grep -c "failed visit:")
# rc=1 means archival is failing. Say so on the one line a human reads.
log $LOG "rc=$rc estate_state=${state:-UNREAD} failed_visits=$fails$( [ "$rc" -ne 0 ] && echo "  ARCHIVAL FAILING -- see $DEST/latest.json" )"
exit 0
