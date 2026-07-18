#!/bin/bash
# Clone the 5 awesome-list forks + add CSOAI/MEOK Labs sections to each README.
# This is the upstream-PR pre-flight: prep the fork's branch so the PR
# against the upstream repo is one click away.
#
# Owner-step: none (uses `gh` auth for the clone; push is also gh-authed).
# The actual PR opening (against the upstream repo) is owner-curated —
# a separate script or manual action.
set -o pipefail

ROOT=~/clawd
FORK_DIR="$ROOT/forks"

mkdir -p "$FORK_DIR"
cd "$FORK_DIR"

declare -a FORKS=(
  "https://github.com/CSOAI-ORG/awesome-mcp-servers-csoai.git"
  "https://github.com/CSOAI-ORG/awesome-compliance-csoai.git"
  "https://github.com/CSOAI-ORG/awesome-eu-ai-act.git"
  "https://github.com/CSOAI-ORG/awesome-eu-ai-act-genaigurus.git"
  "https://github.com/CSOAI-ORG/awesome-legaltech.git"
)

cloned=0
skipped=0
failed=0

for url in "${FORKS[@]}"; do
  name=$(basename "$url" .git)
  if [ -d "$name" ]; then
    echo "  ⊘ $name (already cloned)"
    skipped=$((skipped+1))
    continue
  fi
  echo "  → $name"
  if git clone --depth 1 "$url" "$name" 2>&1 | tail -1; then
    cloned=$((cloned+1))
  else
    failed=$((failed+1))
    echo "    ✗ clone failed"
  fi
done

echo ""
echo "=== SUMMARY ==="
echo "  cloned:  $cloned"
echo "  skipped: $skipped (already cloned)"
echo "  failed:  $failed"
echo ""
echo "Next steps (the M4 lane or owner can do these):"
echo "  1. cd forks/<name> && git checkout -b csoai-mcp-servers"
echo "  2. Edit README.md to add the CSOAI/MEOK Labs MCP section (see UPSTREAM_PR_DRAFTS_2026-06-29.md)"
echo "  3. git add . && git commit -m 'docs: add CSOAI/MEOK Labs MCP servers'"
echo "  4. git push origin csoai-mcp-servers"
echo "  5. gh pr create --repo <upstream> --base <main|master> --head csoai-mcp-servers --title 'Add CSOAI/MEOK Labs MCP servers' --body-file <pr-body.md>"
