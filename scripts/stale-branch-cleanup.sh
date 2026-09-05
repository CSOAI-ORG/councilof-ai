#!/usr/bin/env bash
# stale-branch-cleanup.sh — delete the stale remote branches flagged in issue #1156.
# Lane-executable: pure `git push --delete`, no other side effects.
# Usage: bash stale-branch-cleanup.sh [--dry-run]

set -euo pipefail

DRY_RUN=false
[ "${1:-}" = "--dry-run" ] && DRY_RUN=true

# 7 stale 22-15-7 restore branches
STALE_22_15_7=(
  fix/p0-restore-22-15-7
  fix/p0-restore-22-15-7-2026-09-01
  fix/restore-22-15-7-unmeasured
  honesty/restore-22-15-7-axis-ids
  honesty/restore-22-15-7-empty-slots
  honesty/restore-22-15-7-v2
  leftover/p0-printers-22-15-7-2026-09-01
)

# 6 grok/mill-* output branches (mill output, not code per #1156)
GROK_MILL=(
  grok/mill-art5-affect
  grok/mill-empty5
  grok/mill-failover
  grok/mill-honest
  grok/mill-honesty
  grok/mill-safety-live12
)

# 3 grok/autoeat-fold-* branches
GROK_FOLD=(
  grok/autoeat-fold-0653
  grok/autoeat-fold-8344
  grok/autoeat-fold-8466
)

# 10 dependabot/* branches (owner's call per #1156)
DEPENDABOT=(
  dependabot/github_actions/actions/checkout-7
  dependabot/github_actions/actions/setup-node-7
  dependabot/github_actions/actions/setup-python-7
  dependabot/github_actions/actions/upload-artifact-7
  dependabot/npm_and_yarn/cypress-15.21.0
  dependabot/npm_and_yarn/dockview-8.2.0
  dependabot/npm_and_yarn/pdfkit-0.19.1
  dependabot/npm_and_yarn/radix-ui/react-menubar-1.1.24
  dependabot/npm_and_yarn/radix-ui/react-navigation-menu-1.2.22
  dependabot/npm_and_yarn/radix-ui/react-toggle-1.1.18
)

ALL=("${STALE_22_15_7[@]}" "${GROK_MILL[@]}" "${GROK_FOLD[@]}" "${DEPENDABOT[@]}")
TOTAL=${#ALL[@]}

echo "Will attempt to delete ${TOTAL} branches:"
for b in "${ALL[@]}"; do echo "  - $b"; done

if [ "$DRY_RUN" = true ]; then
  echo ""
  echo "DRY RUN: pass without --dry-run to actually delete."
  exit 0
fi

echo ""
echo "Checking each branch exists before deleting..."
EXISTING=()
for b in "${ALL[@]}"; do
  if git ls-remote --heads origin "$b" 2>/dev/null | grep -q .; then
    EXISTING+=("$b")
  else
    echo "  (already gone: $b)"
  fi
done
echo "Will delete ${#EXISTING[@]} branches (the rest were already gone):"
for b in "${EXISTING[@]}"; do echo "  - $b"; done

echo ""
echo "=== DELETING ==="
FAILED=0
DELETED=0
for b in "${EXISTING[@]}"; do
  if git push origin --delete "$b" 2>&1 | tail -1; then
    DELETED=$((DELETED+1))
  else
    echo "  FAILED: $b"
    FAILED=$((FAILED+1))
  fi
done

echo ""
echo "=== SUMMARY ==="
echo "  deleted: $DELETED"
echo "  failed:  $FAILED"
echo "  already gone before this run: $((TOTAL - ${#EXISTING[@]}))"
