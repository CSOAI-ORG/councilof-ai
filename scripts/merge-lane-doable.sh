#!/usr/bin/env bash
# merge-lane-doable.sh — merge the 10 PRs flagged lane-doable in issue #1156
# and the operator checklist.
# Usage: bash merge-lane-doable.sh [--dry-run]

set -euo pipefail

DRY_RUN=false
[ "${1:-}" = "--dry-run" ] && DRY_RUN=true

# 13 PRs all CI-green (5/5 checks) per the JEEVES lane audit
PRS=(
  "1181|fix(hub): #1155 index row mirrors card body"
  "1182|fix(dashboard): wire 9 missing Council OS panes"
  "1183|sectors: repoint 256 dead CTA links across 68 pages"
  "1187|mill: 1 governance card from run 33695505411"
  "1186|mill: 1 governance card from run 33683981616"
  "1172|docs: code-home options 2 Sep"
  "1171|HF Jobs mill N-site: 56 UNSIGNED cards on 10 axes"
  "1167|docs: outreach drafts 2 Sep"
  "1166|ci: HuggingFace Jobs second runner"
  "1161|docs: x402 demand map 2 Sep"
  "1157|docs: black-swan loops research 2 Sep"
  "985|dependabot: bump actions/upload-artifact from 4 to 7"
  "905|fix(jcs): ES6 Number.toString for catalog/board"
)

echo "Will attempt to merge ${#PRS[@]} PRs:"
for entry in "${PRS[@]}"; do
  IFS='|' read -r n t <<< "$entry"
  echo "  #$n — $t"
done

if [ "$DRY_RUN" = true ]; then
  echo ""
  echo "DRY RUN: pass without --dry-run to actually merge."
  exit 0
fi

echo ""
echo "=== MERGING ==="
MERGED=0
FAILED=0
SKIPPED=0
for entry in "${PRS[@]}"; do
  IFS='|' read -r n t <<< "$entry"
  STATE=$(gh pr view "$n" --repo CSOAI-ORG/councilof-ai --json mergeable,state --jq '.mergeable + "|" + .state' 2>/dev/null || echo "UNKNOWN|UNKNOWN")
  IFS='|' read -r MERGEABLE PR_STATE <<< "$STATE"
  if [ "$MERGEABLE" = "MERGEABLE" ] && [ "$PR_STATE" = "OPEN" ]; then
    if gh pr merge "$n" --repo CSOAI-ORG/councilof-ai --merge --delete-branch 2>&1 | tail -2; then
      MERGED=$((MERGED+1))
    else
      echo "  FAILED #$n"
      FAILED=$((FAILED+1))
    fi
  else
    echo "  SKIPPED #$n ($MERGEABLE / $PR_STATE) — needs a rebase or owner review"
    SKIPPED=$((SKIPPED+1))
  fi
done

echo ""
echo "=== SUMMARY ==="
echo "  merged:  $MERGED"
echo "  failed:  $FAILED"
echo "  skipped: $SKIPPED"
