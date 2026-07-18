#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# sync-lane.sh — the ONE command every CSOAI lane (M2/surface, M4/builder, Hermes)
# runs to commit its work and stay on the same tree without clobbering anyone.
#
# WHY: agents share ONE repo + ONE branch (clawd-workspace @ m4-handoff-2026-06-24).
# If a session ends mid-work, that work sits UNCOMMITTED and is at risk. This script
# safely pulls everyone else's commits, commits yours, pushes, and reports alignment.
#
# USAGE (run from anywhere inside ~/clawd):
#   bash ~/clawd/_alignment/sync-lane.sh "<lane>" "<commit message>" [path ...]
# EXAMPLES:
#   bash ~/clawd/_alignment/sync-lane.sh "M2-surface" "feat: pricing + TCO pages"
#   bash ~/clawd/_alignment/sync-lane.sh "hermes" "learn: overnight digest" sov3-hermes/
# If no paths given, commits ALL your changes. If no message, uses a timestamped default.
# Pass timestamp via $2 message yourself if you want it dated (script can't read the clock).
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail
REPO="$HOME/clawd"; BRANCH="m4-handoff-2026-06-24"
cd "$REPO" || { echo "✗ no ~/clawd"; exit 1; }

LANE="${1:-unknown-lane}"; MSG="${2:-}"; shift 2 2>/dev/null || shift $#
PATHS=("$@")

# 1. identity — attribute to Nick (so Vercel matches) + tag the lane in the name
git config user.name  "Nicholas Templeman ($LANE)"
git config user.email "nicholastempleman@gmail.com"

echo "🜏 lane=$LANE  branch=$BRANCH"
# 2. make sure we're on the shared branch
cur=$(git branch --show-current)
if [ "$cur" != "$BRANCH" ]; then
  echo "⚠️  you're on '$cur', not the shared '$BRANCH'."
  echo "    switch with: git checkout $BRANCH   (commit/stash first). NOT auto-switching."
  exit 2
fi

# 3. pull everyone else's commits FIRST, stashing your uncommitted work safely
echo "⇣ pulling other lanes' work (rebase, autostash)…"
if ! git pull --rebase --autostash origin "$BRANCH" 2>&1 | tail -3; then
  echo "✗ REBASE CONFLICT — someone edited the same lines. Resolve, then:"
  echo "    git rebase --continue   (or  git rebase --abort  to back out)"
  exit 3
fi

# 4. stage your work
if [ "${#PATHS[@]}" -gt 0 ]; then git add -f -- "${PATHS[@]}"; else git add -A; fi
if git diff --cached --quiet; then
  echo "✓ nothing new to commit — you're in sync."
else
  [ -z "$MSG" ] && MSG="wip($LANE): checkpoint"
  git commit -q -m "$MSG

Lane: $LANE. Committed via sync-lane (shared branch $BRANCH).
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
  echo "✓ committed: $MSG"
fi

# 5. push
echo "⇡ pushing…"
GIT_TERMINAL_PROMPT=0 git push origin "$BRANCH" 2>&1 | tail -2

# 6. alignment status — who else is working, what NOT to duplicate
echo ""
echo "──────── ALIGNMENT STATUS ────────"
echo "recent commits (all lanes):"
git log --format='  %h %an — %s' -6 | cut -c1-100
echo ""
echo "⚠️ BEFORE you research or build, read these (don't re-discover):"
echo "   _alignment/RESEARCH_PACK_2026-07-07.md   (deep research: repos/models/licenses — DONE)"
echo "   _alignment/M4_SESSION_ALIGNMENT_2026-07-07.md   (what M4 shipped: Hatch/trust/PyPI/demo)"
echo "   JEEVES_M4_LANE_ALIGNMENT.md   (who owns what: M4=substrate, JEEVES/M2=surface)"
echo "──────────────────────────────────"
