#!/bin/bash
# Weekly: re-read every source in the Open Secure AI Alliance claim map and emit one receipt.
#
# WHAT IT DOES. Fetches every source_url in public/claims/osaia-membership-2026-09-23.json with
# the specification's own extractor, recomputes each digest, and records any difference as an
# OBSERVED CHANGE REQUIRING REVIEW: the two digests, the two access dates, and whether the
# captured sentence was still present.
#
# WHAT IT NEVER DOES. It writes no allegation, derives no count about any organisation from the
# changes it sees, sends nothing to anyone named in the registry, and never edits a published
# file. A page may change for any reason, including a better one than ours. A correction to the
# registry is a NEW registry naming the one it supersedes (spec §9.4), written by a person.
#
# A read that does not happen is written down as a read that did not happen. A schedule that is
# silently skipped is indistinguishable from a schedule that does not exist.
#
# The SCHEDULER owns the stamp. This refuses to run without --now, so a manual invocation can
# never consume the week's slot or hide a scheduled run.
#
# Outputs: $OUT/osaia-watch/receipt-<id>.json, $OUT/osaia-watch/latest-receipt.json, $LOGS/osaia-watch.log
set -u
. "$(dirname "$0")/lib.sh"

[ "${1:-}" = "--now" ] || { log osaia-watch "REFUSED no --now (the scheduler owns the stamp)"; exit 0; }

WORK=$LANES/osaia-watch
REPO_SRC=${OSAIA_WATCH_REPO:-/workspace/git/councilof-ai.git}
REF=${OSAIA_WATCH_REF:-origin/master}
OUTDIR=$OUT/osaia-watch
mkdir -p "$WORK" "$OUTDIR" "$LOGS"

if [ ! -d "$WORK/repo/.git" ]; then
  git clone -q --no-checkout "$REPO_SRC" "$WORK/repo" || { log osaia-watch "ABORT clone failed"; exit 1; }
  git -C "$WORK/repo" sparse-checkout init --cone >/dev/null 2>&1
fi
git -C "$WORK/repo" fetch -q origin '+refs/heads/*:refs/remotes/origin/*' 2>/dev/null
git -C "$WORK/repo" sparse-checkout set scripts public/claims data/claims >/dev/null 2>&1
git -C "$WORK/repo" checkout -q -f "$REF" 2>/dev/null || { log osaia-watch "ABORT cannot check out $REF"; exit 1; }

# Refuse to run stale code rather than running it: a loop that silently reads an older producer
# reports against a registry it was not written for.
if [ ! -f "$WORK/repo/scripts/claims/osaia-membership.mjs" ]; then
  log osaia-watch "ABORT $REF does not carry scripts/claims/osaia-membership.mjs"
  exit 1
fi

export PATH=/workspace/tools/node/bin:$PATH
cd "$WORK/repo" || exit 1
node scripts/claims/osaia-membership.mjs --watch --out "$OUTDIR" 2>&1 | tee -a "$LOGS/osaia-watch.log"
rc=${PIPESTATUS[0]}
log osaia-watch "rc=$rc $(grep -c OBSERVED-CHANGE-REQUIRING-REVIEW "$LOGS/osaia-watch.log" 2>/dev/null || echo 0) observed-change line(s) to date"
exit "$rc"
