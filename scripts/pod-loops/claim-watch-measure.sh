#!/bin/bash
# Weekly (Mondays 09:20Z, per scheduler.sh): re-run claim maintenance over every subject in every
# published registry, and write one receipt per run.
#
#   * extends the CL-1 cumulative-counter series with a new dated reading;
#   * re-reads the CL-4 / ON-1 / ON-2 presence baselines and diffs them against the last run;
#   * recomputes CL-3 oracle share and CL-5 feed cadence/deviation from public keyless sources;
#   * re-reads EVERY claim in EVERY registry on disk that nothing supersedes, recomputing each
#     source digest with the reference implementation's own extractor and comparing it with the
#     recorded one. A subject added to a registry file is covered from the next run with no edit
#     to this script: the watch is generated from the registries on disk, exactly as the register
#     is (spec 7.5);
#   * raises any claim whose registry records a resolution_date that has arrived. A date arriving
#     is a prompt for a person to look, not a finding and not a view about the outcome.
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

# RETIRED 2026-09-29 (lane ledgers-20260929; C-2026-0929-07). Claim-maintenance re-checks have
# ONE scheduler: scripts/claims/maintenance_due.py inside the daily claim-watch job (cron 50 7 * * *), which covers
# every LIVE registry on the registry's own signed read date and day 7/30/90. This weekly loop's scheduler was
# stopped from 2026-09-28 and its 09-28 read never ran. Running it too would be a second scheduler; it now exits.
log claim-watch-measure "RETIRED: re-checks run from scripts/claims/maintenance_due.py (one scheduler); nothing done"
exit 0

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
  # public/claims too: the loop names the registry it maintains and seeds the counter series
  # from the published one, so its series continues that file rather than forking a second.
  git -C "$WORK/repo" sparse-checkout set scripts/claims public/claims >/dev/null 2>&1
fi
git -C "$WORK/repo" fetch -q origin '+refs/heads/*:refs/remotes/origin/*' 2>/dev/null
git -C "$WORK/repo" sparse-checkout set scripts/claims public/claims >/dev/null 2>&1
git -C "$WORK/repo" checkout -q -f "$REF" 2>/dev/null || { log claim-watch-measure "ABORT no such ref $REF"; exit 1; }
HEAD_SHA=$(git -C "$WORK/repo" rev-parse --short HEAD 2>/dev/null)

if [ ! -f "$WORK/repo/scripts/claims/watch_run.py" ]; then
  log claim-watch-measure "ABORT $REF@$HEAD_SHA carries no scripts/claims/watch_run.py — refusing to run stale code"
  exit 1
fi

# Versioned continuity patch for pre-specification registry reads. The exact base and release
# hashes are checked so a later master change cannot be silently overwritten by this overlay.
# Rollback: restore the backed-up wrapper; no scheduler restart or registry edit is needed.
if [ "$REF" = "origin/master" ]; then
  PATCH_SRC=/workspace/lanes/releases/claim-watch-schema-discovery-20260923/watch_run.py
  BASE_HASH=df04a84cf406f02ea204d6432241dfdf5b16230653323d50da41295133867393
  PATCH_HASH=d4af92d1b53dbda31f9b064545694b0fbd5093fe8bcf2b47efe51419b14daa79
  ACTUAL_BASE=$(sha256sum "$WORK/repo/scripts/claims/watch_run.py" | cut -d' ' -f1)
  ACTUAL_PATCH=$(sha256sum "$PATCH_SRC" | cut -d' ' -f1)
  if [ "$ACTUAL_BASE" != "$BASE_HASH" ] || [ "$ACTUAL_PATCH" != "$PATCH_HASH" ]; then
    log claim-watch-measure "ABORT continuity overlay hash mismatch base=$ACTUAL_BASE patch=$ACTUAL_PATCH"
    exit 1
  fi
  cp "$PATCH_SRC" "$WORK/repo/scripts/claims/watch_run.py"
  log claim-watch-measure "CONTINUITY-OVERLAY base=$BASE_HASH patched=$PATCH_HASH"
fi
log claim-watch-measure "START ref=$REF head=$HEAD_SHA out=$OUTDIR"
# The re-read runs through the reference implementation, so Node has to be on PATH. If it is not,
# watch_run.py records the re-read as SKIPPED rather than reporting no changes: a read that did
# not happen is an event, never an absence of change (spec 1.1).
export PATH=/workspace/node24/bin:/workspace/node20/bin:$PATH
python3 "$WORK/repo/scripts/claims/watch_run.py" --now --out "$OUTDIR" --series "$OUTDIR/series" \
  --repo "$WORK/repo" \
  > "$LOGS/claim-watch-measure.run.log" 2>&1
rc=$?

RECEIPT=$(grep -m1 '^RECEIPT ' "$LOGS/claim-watch-measure.run.log" | cut -c9-)
CHANGES=$(grep -c '^OBSERVED-CHANGE-REQUIRING-REVIEW' "$LOGS/claim-watch-measure.run.log")
SKIPPED=$(grep -c '^REREAD-SKIPPED' "$LOGS/claim-watch-measure.run.log")
if [ "${SKIPPED:-0}" -gt 0 ]; then
  log claim-watch-measure "REREAD-SKIPPED the generic re-read did not run this week. That is recorded "\
    "as an event and is NOT a report of no changes"
fi
log claim-watch-measure "RESULT rc=$rc head=$HEAD_SHA changes=$CHANGES | ${RECEIPT:0:420}"
if [ "${CHANGES:-0}" -gt 0 ]; then
  grep '^OBSERVED-CHANGE-REQUIRING-REVIEW' "$LOGS/claim-watch-measure.run.log" | while read -r l; do
    log claim-watch-measure "$l — for review by a person; this loop makes no allegation and notifies no one outside"
  done
fi
exit $rc
