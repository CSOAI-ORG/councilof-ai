#!/usr/bin/env bash
# pre-push — the estate's content gates, installed on the BUILD POD.
#
# WHY THIS EXISTS HERE. The M4's global hook lives at /Users/nicholas/.config/git/hooks and
# is reached through an ABSOLUTE core.hooksPath. The pod's repo had NO core.hooksPath and no
# hook in .git/hooks, so a push from the pod ran NO gate at all and looked exactly like a
# clean fast-forward. (The same failure shape as a relative core.hooksPath: git resolves a
# RELATIVE hooksPath against the PROCESS's working directory, not the work tree, so the hook
# can be silently not-found.)
#
# The gates were run by hand before each pod push and did pass — but "the gate was run once,
# by hand, and the operator remembered" is not a gate. This installs it so every future pod
# push is gated automatically, and it FAILS CLOSED: if the safety suite cannot be found, the
# push is refused.
#
# THE BASE-MOVED GRAMMAR (added 2026-11-03). Four separate estates have now been stopped by
# the same shape, and this is the rule that fixes the class rather than the fourth instance:
#
#   1. the merge loop refused every round below 50 open PRs (a threshold the estate grows past)
#   2. the clawd reclaim compared TOTALS between a source and a live copy
#   3. board-production-anchor compared a LOCAL checkout against the LIVE board
#   4. the merge base moves under a pull request that was green on the exact bytes it will land
#
# The rule: a comparison against a live source must FIRST establish that the local artefact is
# CURRENT, and a comparison whose local side can go stale must degrade to "cannot answer" — not
# to "fails". "The base moved" is not a content failure; it is the queue's job.
#
# So this hook does two things about it:
#   - it STATES the revision it is about to compare against, so a stale local is visible in the
#     gate output instead of being invisible;
#   - it tells the operator to RE-SYNC first when the base has moved, and it can do that for
#     them (--resync) rather than leaving the decision implicit in a failure message.
#
# Usage:
#   pre-push                 gate the push as it stands
#   pre-push --resync        fast-forward the branch onto origin/master FIRST, then gate
set -uo pipefail
export GIT_NO_LAZY_FETCH=1

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "pre-push: cannot resolve the work tree — push blocked." >&2
  exit 1
}
cd "$ROOT" || { echo "pre-push: cannot enter $ROOT — push blocked." >&2; exit 1; }

RESYNC=0
for a in "$@"; do [ "$a" = "--resync" ] && RESYNC=1; done

BASE_REF="${BASE_REF:-origin/master}"
say() { echo "pre-push: $*"; }

# ---- the revision this gate will compare against ---------------------------------------
git fetch --quiet origin "$BASE_REF" 2>/dev/null || true
HEAD_SHA=$(git rev-parse HEAD 2>/dev/null || echo unknown)
BASE_SHA=$(git rev-parse "$BASE_REF" 2>/dev/null || echo unknown)
say "comparing HEAD ${HEAD_SHA:0:12} against ${BASE_REF} ${BASE_SHA:0:12}"

if [ "$HEAD_SHA" != "$BASE_SHA" ] && git merge-base --is-ancestor "$HEAD_SHA" "$BASE_REF" 2>/dev/null; then
  say "the base has moved since this checkout. If a gate fails on a live-vs-local comparison"
  say "(board-production-anchor, facts-gate, brand-gate), RE-SYNC FIRST and re-run:"
  say "    git fetch origin && git rebase $BASE_REF"
  say "    or run this hook with --resync"
  if [ "$RESYNC" = "1" ]; then
    say "--resync: fast-forwarding onto $BASE_REF"
    if git rebase "$BASE_REF" >> /tmp/pre-push-resync.log 2>&1; then
      say "--resync: done, HEAD is now $(git rev-parse HEAD | cut -c1-12)"
    else
      say "--resync FAILED — see /tmp/pre-push-resync.log. Nothing was gated; the push is not"
      say "          silently proceeding on a stale tree."
      exit 1
    fi
  fi
fi

if [ -f "${ROOT}/scripts/run-meok-proxy-tests.sh" ]; then
  say "running MEOK MCP proxy-path tests (required)…"
  if ! bash "${ROOT}/scripts/run-meok-proxy-tests.sh"; then
    say "MEOK MCP proxy-path tests FAILED — push blocked." >&2
    exit 1
  fi
  say "MEOK MCP proxy-path tests passed"
elif [ -f "${ROOT}/scripts/pre-push-gates.sh" ]; then
  say "running Council content/release gates (required)…"
  if ! bash "${ROOT}/scripts/pre-push-gates.sh"; then
    say "Council content/release gates FAILED — push blocked." >&2
    exit 1
  fi
  say "Council content/release gates passed"
else
  say "no repository-specific safety suite found — refusing push." >&2
  exit 1
fi

say "gated against ${BASE_REF} $(git rev-parse "$BASE_REF" | cut -c1-12), HEAD $(git rev-parse HEAD | cut -c1-12)"
exit 0
