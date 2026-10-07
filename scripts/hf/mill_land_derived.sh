#!/usr/bin/env bash
# Rebuild, on a mill landing branch, the derived views that a newly signed card changes (A-G2).
#
#   bash scripts/hf/mill_land_derived.sh <branch> [report.md]
#
# WHY (2026-10-07). The OIDC signer commits signed cards (and a supersession row per replaced
# card) on the landing branch. Three committed views derive from those bytes and are checked by the
# gates, and no producer re-ran them on the branch:
#   public/interop/models-measured.json  scripts/build-models-measured.mjs (--check in the node tests)
#   client/src/data/evidence-notes.json  scripts/evidence-notes-current-cards.mjs (a note citing a
#                                        card the signer just superseded fails evidence-notes.cards.test.ts)
#   public/interop/crosswalk/intoto/     scripts/crosswalk/emit_intoto.py (producers-check; a new
#                                        axis, or a representative that stopped saying MEASURED)
# #2802 failed the first, #2815/#2843/#2846 the second; the third renamed a statement file that the
# stamped regulatory inventory names, on a local replay of #2846 over current master, until the
# emitter kept published representatives (see its SELECTION note). This runs all three after the signer,
# commits the result as the bot, and pushes without force. The hub-cards index version and its
# OTS proof are written by the signer's own step (hf-fin-shells-measure.yml, #2865).
#
# One stamped derived view follows the cards too: public/interop/mill-receipt-readiness.json (the
# 36 STAGED_UNSIGNED wrappers resolved to their terminal replacements; guard:mill-receipt-readiness
# --check). It carries an .ots, so its bytes are never edited: when a signed card extends one of
# those chains, the stamped pair moves intact to mill-receipt-readiness.pre-<branch>.json(.ots), the
# producer writes the current view at the served path, a fresh create-only proof stamps it (pending
# until the hourly upgrade), and the OTS manifest and llms files that quote it are re-derived - the
# re-stamp pattern of #2816. The replay of #2846 extended one chain (Llama-3.2-1B-Instruct, safety).
# Called by mill-jobs-land.yml and hub-queue-land.yml; pr-gates is dispatched after it.
set -euo pipefail
# The body is one function, called on the last line with `; exit`: the checkout below can rewrite
# this very file, and bash reads a script as it runs, so nothing may be read from it after that.
restamp_readiness() {
  local f=public/interop/mill-receipt-readiness.json
  if node scripts/build-mill-receipt-readiness.mjs --check >/dev/null 2>&1; then
    return 0
  fi
  local pre="public/interop/mill-receipt-readiness.pre-${BR##*/}.json"
  [ -e "$pre" ] && { echo "refusing: $pre exists" >&2; return 3; }
  python3 -c "import opentimestamps" 2>/dev/null || python3 -m pip install -q opentimestamps-client
  git mv "$f" "$pre"
  git mv "$f.ots" "$pre.ots"
  node scripts/build-mill-receipt-readiness.mjs
  python3 scripts/surface/stamp_hub_cards_index.py "$f"
  python3 scripts/ots_manifest_rebuild.py --apply
  node scripts/llms-txt.mjs
  node scripts/build-mill-receipt-readiness.mjs --check
  git add -A public/interop/mill-receipt-readiness* public/interop/ots/manifest.json public/llms.txt public/llms-full.txt
  echo "re-stamped mill-receipt-readiness.json; the previous stamped pair is kept as ${pre##*/}(.ots)"
}

main() {
BR="${1:?usage: mill_land_derived.sh <branch> [report.md]}"
REPORT="${2:-}"
case "$BR" in mill/land-*) ;; *) echo "refusing: $BR is not a mill/land-* branch" >&2; return 2 ;; esac

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
    return "$rc"
  fi
  python3 scripts/crosswalk/emit_intoto.py
  git add public/interop/models-measured.json client/src/data/evidence-notes.json
  git add -A public/interop/crosswalk/intoto
  restamp_readiness
  if git diff --cached --quiet; then
    echo "derived views already current on $BR"
    return 0
  fi
  git -c user.name="csoai-mill-land-derived" -c user.email="board@csoai.org" commit -q \
    -m "mill: rebuild the derived views for the cards signed on this branch" \
    -m "Derived views only: models-measured.json, evidence-note citations, in-toto statements, and (when a staged chain moved) mill-receipt-readiness.json re-stamped with its previous stamped pair kept. No card, signature or ledger row is written here."
  if git push --quiet origin "HEAD:$BR"; then
    echo "pushed derived views to $BR"
    return 0
  fi
  echo "push to $BR rejected (the branch moved); refetching, attempt $attempt" >&2
  sleep 10
done
echo "could not push derived views to $BR after 3 attempts" >&2
return 1
}
main "$@"; exit $?
