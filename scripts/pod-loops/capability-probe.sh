#!/bin/bash
# capability-probe.sh — daily on the pod: request every DECLARED capability against the live site,
# compare the observed status with the declaration, and on any mismatch write a DRAFT corrections
# entry into the owner's EXISTING approve-queue. It never publishes and never merges.
#
#   declaration  council-os/capabilities.json (the ONE declaration; openapi.json, the MCP
#                fleet lock, the A2A card and its alias, llms.txt and the site's capability
#                nav are all rendered from it)
#   probe        node scripts/capability-probe.mjs --now  ->  out/capability-probe/<UTC-hour>.json
#                Only probes the declaration marks `safe` are issued. A redirect is FOLLOWED,
#                because that is what a client does: a 308 onto a 404 is a door nobody can reach,
#                and the hop's own status would have read as agreement.
#   draft        capability-probe-draft.py renders each disagreement through drift-draft.py's OWN
#                renderer and pushes it on the SAME branch, corrections/draft-<hour>, under
#                council-os/corrections-drafts/. One queue, one approve path:
#                  bash /workspace/lanes/loops/promote-draft.sh <D-id>
#   receipt      ONE line in logs/capability-probe.log per run. "no drift" is a line too — a loop
#                with no log line never ran, and that is indistinguishable from a loop that found
#                nothing until somebody looks.
#
# THE STAMP IS THE SCHEDULER'S. It passes --now and owns the day stamp on its own line. This
# script must not stamp itself when given --now: a second write finds the first already there and
# the run exits 0 having measured nothing. That silent no-op is the defect distribution-measure hit
# on 2026-09-22. Run by hand WITHOUT --now, it stamps, so a duplicate hand run is a no-op.
set -u
. "$(dirname "$0")/lib.sh"
exec 6>"$STATE/capability-probe.lock"
flock -n 6 || { log capability-probe "SKIP previous run still holds the lock"; exit 0; }
if [ "${1:-}" = "--now" ]; then shift; else stamp capability-probe || exit 0; fi
log capability-probe "START $*"

CLONE=${CAPABILITY_CLONE:-/workspace/ci/capability-probe}
BARE=${CAPABILITY_BARE:-/workspace/git/councilof-ai.git}
BASE=${CAPABILITY_BASE:-https://councilof.ai}
REF=${CAPABILITY_REF:-origin/master}
export PATH=/workspace/tools/node/bin:$PATH

if [ ! -d "$CLONE/.git" ]; then
  git clone -q "$BARE" "$CLONE" || { log capability-probe "FAIL could not clone $BARE"; exit 1; }
fi
git -C "$CLONE" fetch -q origin || log capability-probe "WARN fetch failed; probing the checked-out tree"
git -C "$CLONE" checkout -q -f "$REF" || { log capability-probe "FAIL could not check out $REF"; exit 1; }

RUN="$LOGS/capability-probe.run.log"
node "$CLONE/scripts/capability-probe.mjs" --now --base "$BASE" --out "$OUT/capability-probe" \
  > "$RUN" 2>&1
rc=$?

# The drafts are only attempted when the probe produced a report at all. No report is not "no drift".
if [ $rc -eq 0 ] && [ -s "$OUT/capability-probe/latest.json" ]; then
  python3 "$LOOPS/capability-probe-draft.py" \
    --report "$OUT/capability-probe/latest.json" \
    --out "$OUT/drift-draft" \
    --clone "$CLONE" >> "$RUN" 2>&1
  drc=$?
else
  echo "DRAFTS skipped: the probe produced no report (rc=$rc)" >> "$RUN"
  drc=0
fi

r=$(grep -E '^RECEIPT' "$RUN" | tail -1 | cut -c1-700)
d=$(grep -E '^DRAFTS' "$RUN" | tail -1 | cut -c1-300)
log capability-probe "${r:-NO-RECEIPT (see $RUN: $(tail -1 "$RUN" | cut -c1-200))} ${d:-drafts=none} rc=$rc drafts_rc=$drc"
exit $rc
