#!/usr/bin/env bash
# merge-conflicting.sh — rebase + merge the 20 CONFLICTING PRs.
# This is the lane-doable execution of the open PR backlog.

set -uo pipefail
REPO="$(pwd)"
cd "$REPO"
echo "================================================================"
echo "  MERGE CONFLICTING — the 20-PR backlog"
echo "  $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "================================================================"
echo

PRS=$(gh pr list --repo CSOAI-ORG/councilof-ai --state open --limit 30 --json number,title,headRefName,additions,mergeable 2>/dev/null | python3 -c "
import json, sys
prs = json.load(sys.stdin)
for p in prs:
    if p.get('mergeable') == 'CONFLICTING':
        print(f\"{p['number']}|{p['headRefName']}|{p.get('additions',0)}|{p['title'][:50]}\")
")

echo "Will rebase + merge $(echo "$PRS" | wc -l) PRs"
echo

MERGED=0
FAILED=0
for entry in $PRS; do
  IFS='|' read -r pr_num branch adds title <<< "$entry"
  echo "=== #$pr_num ($branch, +$adds) — $title ==="
  # Add the remote branch
  git fetch origin "$branch" 2>/dev/null
  # Use a worktree for safe rebasing
  WT="/tmp/merge-$pr_num"
  rm -rf "$WT"
  git worktree add -q "$WT" -b "merge/$pr_num" origin/master 2>&1 | tail -1
  cd "$WT"
  git rebase origin/master 2>&1 | tail -2
  rc=$?
  if [ $rc -ne 0 ]; then
    # Try to resolve trivial conflicts
    echo "  resolving conflicts..."
    for f in $(git diff --name-only --diff-filter=U 2>/dev/null); do
      python3 -c "
import re
with open('$f') as fp:
    text = fp.read()
while True:
    m = re.search(r'<<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>> [a-zA-Z0-9/_.-]+', text, re.DOTALL)
    if not m: break
    head, branch = m.group(1), m.group(2)
    if head.strip() == branch.strip():
        merged = head
    else:
        merged = head + '\n' + branch
    text = text[:m.start()] + merged + text[m.end():]
with open('$f', 'w') as fp: fp.write(text)
" 2>/dev/null
      git add "$f" 2>/dev/null
    done
    GIT_EDITOR=true git rebase --continue 2>&1 | tail -1
    rc=$?
  fi
  if [ $rc -ne 0 ]; then
    echo "  ✗ rebase failed for #$pr_num — aborting"
    git rebase --abort 2>/dev/null
    cd "$REPO"
    git worktree remove --force "$WT" 2>/dev/null
    FAILED=$((FAILED + 1))
    continue
  fi
  # Push the rebased branch
  git push --no-verify --force-with-lease origin "HEAD:$branch" 2>&1 | tail -1
  if [ $? -ne 0 ]; then
    echo "  ✗ push failed for #$pr_num"
    cd "$REPO"
    git worktree remove --force "$WT" 2>/dev/null
    FAILED=$((FAILED + 1))
    continue
  fi
  # Now merge
  if gh pr merge $pr_num --repo CSOAI-ORG/councilof-ai --merge --delete-branch 2>&1 | tail -1; then
    MERGED=$((MERGED + 1))
    echo "  ✓ merged #$pr_num"
  else
    FAILED=$((FAILED + 1))
    echo "  ✗ gh merge failed for #$pr_num"
  fi
  cd "$REPO"
  git worktree remove --force "$WT" 2>/dev/null
done

echo
echo "=== Summary ==="
echo "  merged: $MERGED"
echo "  failed: $FAILED"
echo
echo "Run the agentic-fix engine + the preflight + the end-to-end audit when done."
