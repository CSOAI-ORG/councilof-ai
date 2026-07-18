#!/bin/bash
set -euo pipefail

BASE_DIR="/Users/nicholas/clawd"
MANIFEST="$BASE_DIR/MCP_DEPLOYMENT_MANIFEST.json"

# Extract repo names
cd "$BASE_DIR"
python3 -c "
import json
with open('$MANIFEST') as f:
    m=json.load(f)
for s in m.get('deployable_servers',[]):
    if s.get('deployment_ready'):
        print(s['name'])
" > /tmp/mcp-repos.txt

committed=0
pushed=0
skipped=0

while read -r name; do
    repo_dir="$BASE_DIR/mcp-marketplace/$name"
    [ -d "$repo_dir" ] || continue
    cd "$repo_dir"

    if [ -z "$(git status --porcelain 2>/dev/null)" ]; then
        skipped=$((skipped + 1))
        continue
    fi

    git add -A
    if git commit -m "feat: add SEO descriptions, test templates, and security audit fixes" >/dev/null 2>&1; then
        committed=$((committed + 1))
    fi

    if git push >/dev/null 2>&1; then
        pushed=$((pushed + 1))
    else
        echo "[WARN] $name: push failed"
    fi
done < /tmp/mcp-repos.txt

echo "Done. Committed: $committed, Pushed: $pushed, Skipped: $skipped"
