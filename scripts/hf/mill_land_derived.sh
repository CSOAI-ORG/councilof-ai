#!/usr/bin/env bash
# Rebuild, on a mill landing branch, the derived views that a newly signed card changes (A-G2).
#
#   bash scripts/hf/mill_land_derived.sh <branch> [report.md]
#
# WHY (2026-10-07). The OIDC signer commits signed cards (and a supersession row per replaced
# card) on the landing branch. Two committed views derive from those bytes and are checked by the
# gates, and no producer re-ran them on the branch:
#   public/interop/models-measured.json  scripts/build-models-measured.mjs (--check in the node tests)
#   client/src/data/evidence-notes.json  scripts/evidence-notes-current-cards.mjs (a note citing a
#                                        card the signer just superseded fails evidence-notes.cards.test.ts)
# #2802 failed the first, #2815/#2843/#2846 the second, and both were patched by hand. This runs
# both after the signer, commits the result as the bot, and pushes without force. The hub-cards
# index version and its OTS proof are written by the signer's own step (hf-fin-shells-measure.yml).
# Called by mill-jobs-land.yml and hub-queue-land.yml; pr-gates is dispatched after it.
set -euo pipefail
BR="${1:?usage: mill_land_derived.sh <branch> [report.md]}"
REPORT="${2:-}"
case "$BR" in mill/land-*) ;; *) echo "refusing: $BR is not a mill/land-* branch" >&2; exit 2 ;; esac

for attempt in 1 2 3; do
  git fetch --quiet origin "$BR"
  git checkout -q -f -B "$BR" FETCH_HEAD
  node scripts/build-models-measured.mjs
  rc=0
  node scripts/evidence-notes-current-cards.mjs > notes.log 2>&1 || rc=$?
  cat notes.log
  if [ -n "$REPORT" ]; then
    # A citation refreshed by machine leaves the note's prose as it was: say which notes, so a
    # human can check that the prose still reads true beside the card it now links.
    { grep -E '^evidence-notes: ' notes.log | sed 's/^evidence-notes: /- /' || true; } > notes.md
    if [ -s notes.md ]; then
      { echo "Evidence-note citations refreshed on this branch by \`scripts/evidence-notes-current-cards.mjs\` (links only; the prose was not edited, so read it once beside the current card):"; echo; cat notes.md; } > "$REPORT"
    fi
  fi
  if [ "$rc" = 2 ]; then
    echo "::warning::evidence-notes: a superseded citation has no free artifact slot; a human must edit that note (see log above)"
  elif [ "$rc" != 0 ]; then
    exit "$rc"
  fi
  git add public/interop/models-measured.json client/src/data/evidence-notes.json
  if git diff --cached --quiet; then
    echo "derived views already current on $BR"
    exit 0
  fi
  git -c user.name="csoai-mill-land-derived" -c user.email="board@csoai.org" commit -q \
    -m "mill: rebuild models-measured and evidence-note citations for the cards signed on this branch" \
    -m "Derived views only: scripts/build-models-measured.mjs and scripts/evidence-notes-current-cards.mjs. No card, signature or ledger row is written here."
  if git push --quiet origin "HEAD:$BR"; then
    echo "pushed derived views to $BR"
    exit 0
  fi
  echo "push to $BR rejected (the branch moved); refetching, attempt $attempt" >&2
  sleep 10
done
echo "could not push derived views to $BR after 3 attempts" >&2
exit 1
