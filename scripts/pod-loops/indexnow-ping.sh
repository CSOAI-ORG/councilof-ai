#!/bin/bash
# indexnow-ping.sh -- announce to IndexNow only the councilof.ai URLs whose content
# actually changed. Registered 2026-09-22 by the index-presence lane.
#
# The scheduler owns the stamp; this script takes --now and never stamps itself.
# Receipt: one line per run in $LOGS/indexnow-ping.log, including the runs with
# nothing to do -- an absent line would read like an absent run.
#
# What it refuses to do:
#   * ping while the key file is not served: IndexNow rejects every submission
#     whose key cannot be fetched, and a "submitted N" line would be a false
#     success. The key file is verified LIVE first, every run.
#   * resubmit unchanged URLs. IndexNow asks publishers to notify meaningful
#     changes; the 2026-09-21 receipt for this host says in as many words "do not
#     re-ping without a material public URL change". The submitter keeps a
#     per-URL content fingerprint and sends only what moved.
#   * claim indexing. Submitted and accepted are the only two states anything
#     here can observe. Appearing in a search index and staying there are two
#     further states and neither is measured by this loop.
#
# The submitter is a copy of scripts/monitoring/indexnow_submit.py. Refresh with:
#   cp <repo>/scripts/monitoring/indexnow_submit.py /workspace/lanes/loops/
set -u
. "$(dirname "$0")/lib.sh"

LOG=indexnow-ping
SUBMIT="$LOOPS/indexnow_submit.py"
STATE_FILE="$STATE/indexnow-councilof-ai.json"
KEY=97a1aa3163534fae954108d8941eb361
KEY_URL="https://councilof.ai/$KEY.txt"

[ "${1:-}" = "--now" ] || { log $LOG "SKIP not invoked with --now (the scheduler owns the stamp)"; exit 0; }

exec 9>"$STATE/$LOG.lock"
flock -n 9 || { log $LOG "SKIP another run holds the lock"; exit 0; }

[ -f "$SUBMIT" ] || { log $LOG "SKIP submitter absent at $SUBMIT -- nothing submitted"; exit 0; }

# 1. the key file must be LIVE. A ping against a missing key file is a silent failure:
#    the endpoint answers 200/202 and then discards the batch at key-validation time.
body=$(curl -fsS -m 25 "$KEY_URL" 2>/dev/null | tr -d '[:space:]')
if [ "$body" != "$KEY" ]; then
  log $LOG "SKIP key file not live: $KEY_URL did not return the key (got ${#body} chars); submitted=0"
  exit 0
fi

# 2. seed on the first run (records today's fingerprints, submits nothing), then
#    announce only genuine changes on every run after that.
seed=--seed-only
[ -s "$STATE_FILE" ] && seed=""

o=$(python3 "$SUBMIT" --changed-only --state "$STATE_FILE" $seed 2>&1)
rc=$?
echo "$o" >> "$LOGS/$LOG.detail.log"

line=$(printf '%s\n' "$o" | grep -m1 '^\[result\]')
diff=$(printf '%s\n' "$o" | grep -m1 '^\[diff\]')
[ -n "$line" ] || line="no [result] line; exit $rc; see $LOGS/$LOG.detail.log"
log $LOG "rc=$rc ${diff:-} ${line}"
exit 0
