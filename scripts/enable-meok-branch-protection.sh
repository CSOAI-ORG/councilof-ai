#!/usr/bin/env bash
# Require the meok-mcp-proxy-tests / proxy-path check on main (and master).
# Needs a valid gh token with admin:repo (branch protection).
set -euo pipefail
REPO="${1:-CSOAI-ORG/sovos-harness}"
BRANCHES="${2:-main master}"

# Check name must match workflow job name: proxy-path
# (workflow name meok-mcp-proxy-tests, job id proxy-path → check name "proxy-path")
CONTEXT="proxy-path"

for branch in $BRANCHES; do
  echo "==> requiring status context '$CONTEXT' on $REPO@$branch"
  gh api -X PUT "repos/${REPO}/branches/${branch}/protection" \
    --input - <<JSON
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["${CONTEXT}", "meok-mcp-proxy-tests / proxy-path"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
  echo "protected $branch"
done

echo "Done. PRs/pushes to protected branches now require the proxy-path check."
