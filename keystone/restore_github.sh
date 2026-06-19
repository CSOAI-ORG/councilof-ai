#!/bin/bash
# MEOK GitHub recovery — run AFTER copying a fresh PAT to the clipboard.
# Fresh PAT: https://github.com/settings/tokens  (classic; scopes: repo, workflow, read:org)
#
#   pbpaste | ~/clawd/keystone/restore_github.sh
#
# This: (1) stores the PAT in keystone (GCP + Keychain) as GITHUB_TOKEN so it
# NEVER lives only in gh's keychain again, (2) re-auths gh, (3) verifies,
# (4) pushes everything that is committed-and-ahead, (5) pushes all hives.
set -euo pipefail
KS=~/clawd/keystone/keystone

TOKEN="$(cat)"
[ -n "$TOKEN" ] || { echo "!! no token on stdin. Run:  pbpaste | $0"; exit 1; }

echo "== 1. Storing canonical GITHUB_TOKEN in keystone (GCP + Keychain) =="
printf '%s' "$TOKEN" | "$KS" set GITHUB_TOKEN

echo "== 2. Re-authenticating gh =="
printf '%s' "$TOKEN" | gh auth login -h github.com --with-token

echo "== 3. Verifying =="
gh api user --jq '"authed as: \(.login)"'

echo "== 4. Pushing committed-and-ahead repos =="
for d in ~/clawd ~/wong2-awesome-mcp-servers; do
  ahead=$(git -C "$d" rev-list --count @{u}..HEAD 2>/dev/null || echo 0)
  if [ "${ahead:-0}" != "0" ]; then
    echo "  -> $(basename "$d"): pushing $ahead commit(s)"
    git -C "$d" push
  fi
done

echo "== 5. Pushing hives =="
cd ~/hive-staging && bash bulk_push_hives.sh

echo "== DONE. Dirty repos NOT auto-committed (review these): =="
echo "   councilof-ai (5), meok-ai (5), meok-compliance-gateway (9), clawd (12 uncommitted)"
