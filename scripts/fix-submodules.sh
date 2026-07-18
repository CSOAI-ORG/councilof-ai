#!/bin/bash
# fix-submodules.sh — Commit submodule drift in nested repos
# Run from: /Users/nicholas/clawd
# Authored: 2026-06-09 by Kimi orchestrator

set -e

SUBMODULES=(
  "csoai-dashboard"
  "haulage-deploy"
  "meok"
  "meok-api-gateway"
  "meok-compliance-gateway"
  "optimobile-practice-hub"
)

echo "=== Submodule Fix Script ==="
echo "Time: $(date)"
echo ""

for sub in "${SUBMODULES[@]}"; do
  echo "--- $sub ---"
  if [ ! -d "$sub/.git" ]; then
    echo "  ❌ Not a git repo: $sub"
    continue
  fi
  
  cd "$sub"
  
  # Check status
  changes=$(git status --short | wc -l | tr -d ' ')
  if [ "$changes" = "0" ]; then
    echo "  ✅ Clean — no changes"
    cd - >/dev/null
    continue
  fi
  
  echo "  📝 $changes changes detected"
  git status --short | sed 's/^/     /'
  
  # Stage and commit
  git add -A
  git commit -m "sync(2026-06-09): submodule sync from clawd-workspace audit" || echo "  ⚠️ Commit failed (may need manual review)"
  
  # Push if possible
  git push 2>/dev/null || echo "  ⚠️ Push failed (may need auth)"
  
  cd - >/dev/null
  echo ""
done

echo "=== Submodule fix complete ==="
echo ""
echo "After running this script, return to clawd-workspace root and run:"
echo "  git add <submodule> && git commit -m 'sync: update submodules'"
