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
#                                        card the signer just superseded fails evidence-notes.cards.test.ts;
#                                        the note gains a closing update sentence, never a silent re-link)
#   public/interop/crosswalk/intoto/     scripts/crosswalk/emit_intoto.py (producers-check; a new
#                                        axis, or a representative that stopped saying MEASURED)
# #2802 failed the first, #2815/#2843/#2846 the second; the third renamed a statement file that the
# stamped regulatory inventory names, on a local replay of #2846 over current master, until the
# emitter kept published representatives (see its SELECTION note). This runs all three after the signer,
# commits the result as the bot, and pushes without force. The hub-cards index version and its
# OTS proof are written by the signer's own step (hf-fin-shells-measure.yml, #2865).
#
# One stamped derived view follows the cards too, public/interop/mill-receipt-readiness.json (the
# 36 STAGED_UNSIGNED wrappers resolved to their terminal replacements). Its bytes carry an .ots and
# are never edited here: the signer's step versions it (#2868: a new immutable file, its own proof
# and a moving pointer), the same way #2865 versions the hub-cards index. A replay of #2846 extended
# one of those chains (Llama-3.2-1B-Instruct, safety), so this step relies on the signer having run.
set -euo pipefail
# The body is one function, called on the last line with `; exit`: the checkout below can rewrite
# this very file, and bash reads a script as it runs, so nothing may be read from it after that.
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
    # Say which notes changed and how, so a human reads each once beside the card it now names.
    { grep -E '^evidence-notes: ' notes.log | sed 's/^evidence-notes: /- /' || true; } > notes.md
    if [ -s notes.md ]; then
      { echo "Evidence notes refreshed on this branch by \`scripts/evidence-notes-current-cards.mjs\`. A note whose prose names a card the signer just superseded gains one closing sentence saying so and naming the current card; its links (and the admission receipt link) follow the current card. The prose above that sentence is unchanged, so read it once: rewrite it if it should now describe the current card."; echo; cat notes.md; } > "$REPORT"
    fi
  fi
  if [ "$rc" = 2 ]; then
    echo "::warning::evidence-notes: a note needs a human rewrite (the update sentence would break the 250-word rule, or a withdrawn card or receipt has nothing to link); see the UNRESOLVED lines above"
  elif [ "$rc" != 0 ]; then
    return "$rc"
  fi
  python3 scripts/crosswalk/emit_intoto.py
  git add public/interop/models-measured.json client/src/data/evidence-notes.json
  git add -A public/interop/crosswalk/intoto
  if git diff --cached --quiet; then
    echo "derived views already current on $BR"
    return 0
  fi
  git -c user.name="csoai-mill-land-derived" -c user.email="board@csoai.org" commit -q \
    -m "mill: rebuild the derived views for the cards signed on this branch" \
    -m "Derived views only: models-measured.json, evidence-note citations, in-toto statements. No card, signature, ledger row or stamped file is written here."
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
