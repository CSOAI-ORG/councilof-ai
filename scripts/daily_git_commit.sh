#!/bin/bash
# ~/clawd/scripts/daily_git_commit.sh — daily git commit at 23:55 BST
# Preserves the day's work as a git snapshot.

set -e
cd ~/clawd

# Only commit if there are changes
if [[ -n $(git status --porcelain 2>/dev/null) ]]; then
  # Stage everything in ~/clawd (no .env, no node_modules, no __pycache__)
  git add -A 2>/dev/null || true
  # Commit with date + agent sigil
  COMMIT_DATE=$(date '+%Y-%m-%d %H:%M BST')
  git -c user.email='jeeves@meok.ai' -c user.name='JEEVES' commit -m "daily snapshot: $COMMIT_DATE" 2>&1 || true
  echo "[daily-commit] $COMMIT_DATE: committed"
else
  echo "[daily-commit] $(date '+%Y-%m-%d %H:%M BST'): no changes"
fi
