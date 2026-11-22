#!/bin/bash
# drift-draft.sh — hourly :40 on the pod: DRIFT? -> corrections AUTO-DRAFT -> owner approve-queue. Never publishes.
#
#   snapshot  GET /api/gspc totals + per-axis status/n, /api/state card corpora (three, kept apart), every /api/pop/{id}
#             preview, the sha256 of each door artifact in the repo AND as served  ->  out/drift-draft/snapshots/<UTC-hour>.json
#   diff      against the previous snapshot + typed claim surfaces vs live (facts.json observed block, canon.json api,
#             public/corrections/*.json current-state fields, typed literals in public/**/*.md, docs/**, client/src/**)
#   draft     one corrections entry (csoai.corrections/0.1 shape) + a SUPERSEDES-style note per drift, deduplicated by
#             fingerprint  ->  out/drift-draft/queue/<D-id>.{json,md}, pushed to branch corrections/draft-<hour> under
#             council-os/corrections-drafts/ (NOT shipped: outside public/, client/, functions/). NEVER merged.
#   mirror    hf_upload.py -> csoai/corrections-watch drift-draft/{snapshots,diffs,queue}/...
#   receipt   ONE line in logs/drift-draft.log per run ("no drift" is a line too).
#   approve   promote-draft.sh <D-id>  (owner; not run here). Docs at the top of drift-draft.py.
#
# The scheduler passes --now and owns the hour stamp (`stamp drift-draft hour` on the SCHEDULER line). Without --now
# (a hand run) this script stamps itself so a duplicate hand run in the same hour is a no-op, like the other loops.
set -u
. "$(dirname "$0")/lib.sh"
exec 7>"$STATE/drift-draft.lock"
flock -n 7 || { log drift-draft "SKIP previous run still holds the lock"; exit 0; }
if [ "${1:-}" = "--now" ]; then shift; else stamp drift-draft hour || exit 0; fi
log drift-draft "START $*"
python3 "$LOOPS/drift-draft.py" --out "$OUT/drift-draft" "$@" > "$LOGS/drift-draft.run.log" 2>&1; rc=$?
r=$(grep -E '^(RECEIPT|SELFTEST)' "$LOGS/drift-draft.run.log" | tail -1 | cut -c1-700)
log drift-draft "${r:-NO-RECEIPT (see $LOGS/drift-draft.run.log: $(tail -1 "$LOGS/drift-draft.run.log" | cut -c1-200))} rc=$rc"
exit $rc
