#!/bin/bash
# mill-hourly-land.sh — lands finished hourly slices: every mill/auto-<hour> branch whose receipt line
# says rc=0 and that is not yet in master is merged (--no-ff) into master in the merge clone, pushed to
# the bare repo, and one deploy is queued (deploy-when-idle guards against overlapping deploys).
# Receipt: one line per merge in $LOGS/mill-hourly-land.log. Branches with rc!=0 are left for a human.
set -u
. "$(dirname "$0")/lib.sh"
exec 6>"$STATE/mill-hourly-land.lock"; flock -n 6 || exit 0
[ "${1:-}" = "--now" ] || stamp mill-hourly-land hour || exit 0
MERGE=/workspace/ci/merge
cd "$MERGE" || exit 2
git fetch -q origin || exit 2
git checkout -q -B master origin/master || exit 2
merged=0
for ref in $(git for-each-ref --format='%(refname:short)' refs/remotes/origin/mill/auto-* | sort); do
  b=${ref#origin/}
  git merge-base --is-ancestor "$ref" origin/master && continue
  # the slice's own receipt must say rc=0 for this branch
  grep -qE "branch=$b .*rc=0" "$LOGS/mill-hourly.log" 2>/dev/null || { log mill-hourly-land "$b HOLD no rc=0 receipt"; continue; }
  if git merge --no-ff --no-edit "$ref" -m "mill: hourly slice $b (verified, signed with the pod token, rooted) — auto-landed by mill-hourly-land" >/dev/null 2>&1; then
    merged=$((merged+1)); log mill-hourly-land "$b MERGED $(git rev-parse --short HEAD)"
  else
    git merge --abort 2>/dev/null; log mill-hourly-land "$b CONFLICT left for a human"
  fi
done
# arena/auto-<hour> branches (arena-hourly.sh): land when their own receipt says OK for that branch
for ref in $(git for-each-ref --format='%(refname:short)' refs/remotes/origin/arena/auto-* | sort); do
  b=${ref#origin/}
  git merge-base --is-ancestor "$ref" origin/master && continue
  grep -qE " OK .*branch=$b " "$LOGS/arena-hourly.log" 2>/dev/null || { log mill-hourly-land "$b HOLD no OK receipt"; continue; }
  if git merge --no-ff --no-edit "$ref" -m "arena: hourly round $b (deterministic grader, Elo, board-signed signals) — auto-landed by mill-hourly-land" >/dev/null 2>&1; then
    merged=$((merged+1)); log mill-hourly-land "$b MERGED $(git rev-parse --short HEAD)"
  else
    git merge --abort 2>/dev/null; log mill-hourly-land "$b CONFLICT left for a human"
  fi
done
[ "$merged" -gt 0 ] || log mill-hourly-land "nothing to land (no unmerged mill/auto-* or arena/auto-* with a receipt)"
if [ "$merged" -gt 0 ]; then
  git push -q origin master && log mill-hourly-land "pushed master $(git rev-parse --short HEAD) ($merged slice(s))"
  nohup bash "$LOOPS/deploy-when-idle.sh" > "$LOGS/deploy-when-idle.log" 2>&1 < /dev/null &
  # the hub surface (/api/hub-cards) reads HF gspc-hub-cards + hub-queue, not the repo: flip after every landing
  bash "$LOOPS/hub-flip.sh" >> "$LOGS/hub-flip.log" 2>&1 && log mill-hourly-land "hub flip ok" || log mill-hourly-land "hub flip FAILED (see logs/hub-flip.log)"
fi
