#!/bin/bash
# promote-draft.sh <draft-id> — the OWNER's one command: a drift-draft becomes a real ledger entry + note on a branch.
#
#   bash /workspace/lanes/loops/promote-draft.sh D-2026-09-22T14-01
#
#   -> /workspace/ci/corrections-lane: branch corrections/<draft-id> from origin/master
#   -> drift-draft.py --promote: next ledger id C-<today>-<NN> read from functions/api/corrections.ts bytes; the entry
#      inserted at the top of LEDGER.corrections; public/corrections/<slug>-<date>[-SUPERSEDES].md written from the
#      draft note (+ SUPERSESSIONS.md row when the subject is itself a public/corrections file); the draft moved to
#      council-os/corrections-drafts/promoted/ and out/drift-draft/queue/promoted/
#   -> commit + push the branch. The owner opens the PR and merges. This script never merges, never deploys.
#   GET /api/corrections serves signature_state STALE after the merge until the ledger signature is re-issued
#   (owner-gated): a stale signature is a published defect, never a silent edit.
set -eu
. "$(dirname "$0")/lib.sh"
ID=${1:?usage: promote-draft.sh <draft-id, e.g. D-2026-09-22T14-01>}
CLONE=${DRIFT_CLONE:-/workspace/ci/corrections-lane}
BARE=${DRIFT_BARE:-/workspace/git/councilof-ai.git}
Q=$OUT/drift-draft/queue
[ -f "$Q/$ID.json" ] || { echo "no such draft: $Q/$ID.json"; exit 2; }
[ -d "$CLONE/.git" ] || git clone -q "$BARE" "$CLONE"
git -C "$CLONE" fetch -q origin master
git -C "$CLONE" checkout -q -B "corrections/$ID" origin/master
python3 "$LOOPS/drift-draft.py" --promote "$ID" --clone "$CLONE" --out "$OUT/drift-draft" | tee -a "$LOGS/drift-draft.log"
git -C "$CLONE" add functions/api/corrections.ts public/corrections council-os/corrections-drafts
git -C "$CLONE" -c user.name=CSOAI -c user.email=nicholas@csoai.org commit -q -m "corrections: promote $ID (owner-approved draft); supersedes, never edits; ledger signature will read STALE until re-issued"
git -C "$CLONE" push -q origin "corrections/$ID"
git -C "$CLONE" checkout -q --detach origin/master
log drift-draft "PROMOTED $ID -> branch corrections/$ID commit=$(git -C "$CLONE" rev-parse --short "corrections/$ID") (owner merges the PR)"
