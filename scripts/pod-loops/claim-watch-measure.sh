#!/bin/bash
# Weekly (Mondays 07:00Z): re-run the claim-maintenance series on the published registry's
# subjects and write one receipt per run.
#
#   * extends the CL-1 cumulative-counter series with a new dated reading;
#   * re-reads the CL-4 / ON-1 / ON-2 presence baselines and diffs them against the last run;
#   * recomputes CL-3 oracle share and CL-5 feed cadence/deviation from public keyless sources.
#
# It emits "observed change requiring review" and NEVER an allegation: a figure that moved, or a
# name that is no longer on a page, is a prompt for a human to look. Nothing is sent to any party
# named in the registry, and no published file is edited.
#
# The SCHEDULER owns the stamp (`stamp claim-watch-measure` in scheduler.sh). This script writes
# no stamp of its own and refuses to run without --now, so a manual invocation can never consume
# the week's slot or hide a scheduled run.
#
# Outputs:  $OUT/claim-watch/run-<id>/{CL-1,CL-3,CL-4,CL-5,ON-1,ON-2}.json + receipt.json
#           $OUT/claim-watch/receipts.jsonl        one receipt line per run
#           $OUT/claim-watch/latest-receipt.json
#           $OUT/claim-watch/series/CL-1.jsonl     the published counter series, appended
set -u
. "$(dirname "$0")/lib.sh"

[ "${1:-}" = "--now" ] || { log claim-watch-measure "REFUSED no --now (the scheduler owns the stamp)"; exit 0; }

WORK=$LANES/claim-watch
REPO_SRC=${CLAIM_WATCH_REPO:-/workspace/git/councilof-ai.git}
# Default to master. Until the lane lands, CLAIM_WATCH_REF names the branch that carries
# scripts/claims; the loop refuses to run on a ref that does not, rather than running stale code.
REF=${CLAIM_WATCH_REF:-origin/master}
OUTDIR=$OUT/claim-watch

mkdir -p "$WORK" "$OUTDIR"
if [ ! -d "$WORK/repo/.git" ]; then
  git clone -q --no-checkout "$REPO_SRC" "$WORK/repo" || { log claim-watch-measure "ABORT clone failed"; exit 1; }
  git -C "$WORK/repo" sparse-checkout init --cone >/dev/null 2>&1
  git -C "$WORK/repo" sparse-checkout set scripts/claims >/dev/null 2>&1
fi
git -C "$WORK/repo" fetch -q origin '+refs/heads/*:refs/remotes/origin/*' 2>/dev/null
git -C "$WORK/repo" checkout -q -f "$REF" 2>/dev/null || { log claim-watch-measure "ABORT no such ref $REF"; exit 1; }
HEAD_SHA=$(git -C "$WORK/repo" rev-parse --short HEAD 2>/dev/null)

if [ ! -f "$WORK/repo/scripts/claims/watch_run.py" ]; then
  log claim-watch-measure "ABORT $REF@$HEAD_SHA carries no scripts/claims/watch_run.py — refusing to run stale code"
  exit 1
fi

log claim-watch-measure "START ref=$REF head=$HEAD_SHA out=$OUTDIR"
python3 "$WORK/repo/scripts/claims/watch_run.py" --now --out "$OUTDIR" --series "$OUTDIR/series" \
  > "$LOGS/claim-watch-measure.run.log" 2>&1
rc=$?

RECEIPT=$(grep -m1 '^RECEIPT ' "$LOGS/claim-watch-measure.run.log" | cut -c9-)
CHANGES=$(grep -c '^OBSERVED-CHANGE-REQUIRING-REVIEW' "$LOGS/claim-watch-measure.run.log")
log claim-watch-measure "RESULT rc=$rc head=$HEAD_SHA changes=$CHANGES | ${RECEIPT:0:420}"
if [ "${CHANGES:-0}" -gt 0 ]; then
  grep '^OBSERVED-CHANGE-REQUIRING-REVIEW' "$LOGS/claim-watch-measure.run.log" | while read -r l; do
    log claim-watch-measure "$l — for review by a person; this loop makes no allegation and notifies no one outside"
  done
fi
exit $rc
