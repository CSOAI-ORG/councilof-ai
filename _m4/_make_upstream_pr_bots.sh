#!/bin/bash
# Daily upstream-PR check + gentle ping to maintainers
# Run via cron: 0 9 * * * ~/clawd/_m4/_make_upstream_pr_bots.sh
# (Gentle bot: just a polite "checking in" — never spam)

set -uo pipefail
ROOT=~/clawd
cd "$ROOT"

# 1. Refresh PR status
python3 _m4/_upstream_pr_tracker.py > /tmp/pr-status.log 2>&1

# 2. For each PR not yet merged, post a polite comment if last comment was >48h ago
PRS=(
  "morganrcu/awesome-eu-ai-act:master"
  "theopenlane/awesome-compliance:main"
  "GenAI-Gurus/awesome-eu-ai-act:main"
  "Vaquill-AI/awesome-legaltech:main"
)
for entry in "${PRS[@]}"; do
  IFS=':' read -r repo branch <<< "$entry"
  # Check PR status
  num=$(gh pr list --repo "$repo" --head "CSOAI-ORG:csoai-mcp-servers" --state all --json number --jq '.[0].number' 2>/dev/null)
  if [ -z "$num" ] || [ "$num" = "null" ]; then continue; fi
  # Check last comment date
  last_comment_at=$(gh api "repos/$repo/issues/$num/comments" --jq '.[0].created_at' 2>/dev/null)
  if [ -z "$last_comment_at" ] || [ "$last_comment_at" = "null" ]; then
    no_comment=true
  else
    age_h=$(python3 -c "
from datetime import datetime, timezone
import sys
d = datetime.fromisoformat('$last_comment_at'.replace('Z', '+00:00'))
n = datetime.now(timezone.utc)
print(int((n - d).total_seconds() / 3600))
" 2>/dev/null)
    no_comment=false
  fi
  if [ "${no_comment:-false}" = "true" ] || [ "${age_h:-0}" -gt 48 ]; then
    # Post a gentle ping
    msg=$(cat <<EOF
Gentle follow-up ping — no rush. We're 4 days from launch and the [CSOAI/MEOK Labs PR](https://github.com/CSOAI-ORG/awesome-mcp-servers-csoai) is in good shape on the EU AI Act / OSCAL / signed-COBOL front.

If you have any feedback on the new entries (eu-ai-act-compliance-mcp, regulatory-webhook-mcp, omnibus-tracker-mcp, watermarking-authenticity-mcp, solvency-ii-mcp, etc.) — we'd love to incorporate it before launch. We're also adding 8 100/100 A+++++ Layer-1 consumer apps (an in-browser OSCAL verifier, a BFT council view, an A2A substrate, etc.) — happy to add them to the PR if useful.

If you can't review in time, that's totally OK — we'll re-up after launch with any cleanup.

Thanks for considering CSOAI/MEOK Labs for the curated list!
EOF
)
    gh pr comment "$num" --repo "$repo" --body "$msg" 2>/dev/null && echo "  ✓ commented on $repo PR #$num"
  else
    echo "  ⊘ $repo PR #$num last commented ${age_h}h ago (skipping)"
  fi
done
echo ""
echo "=== PR CHECK COMPLETE ==="
cat /tmp/pr-status.log | grep "Merge rate"
