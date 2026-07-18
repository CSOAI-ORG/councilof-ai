#!/bin/bash
# Submit ALL MCPs in the mcp-marketplace mirror to the official MCP Registry.
# Source-of-truth: MCP_DEPLOYMENT_MANIFEST.json (regenerated 2026-06-28).
#
# Owner-gated: requires `mcp-publisher login github` first.
# This script reads the manifest, filters to deployment_ready=true, and runs
# `mcp-publisher publish` for each. Idempotent on the registry side.
#
# Usage:
#   mcp-publisher login github
#   SUBMIT=1 bash scripts/submit-all-mcp-registry.sh
set -uo pipefail

ROOT=~/clawd
MARKETPLACE="$ROOT/mcp-marketplace"
MANIFEST="$ROOT/MCP_DEPLOYMENT_MANIFEST.json"

HAVE=$(command -v mcp-publisher || true)
[ -z "${SUBMIT:-}" ] && HAVE="" && echo "DRY (validate-only). Set SUBMIT=1 + 'mcp-publisher login github' to actually submit."

if [ -z "$HAVE" ]; then
  echo ""
  echo "=== REGISTRY SUBMISSION MANIFEST ==="
  TOTAL=$(python3 -c "import json; d=json.load(open('$MANIFEST')); print(d['deploy_ready_count'])")
  echo "  total deploy-ready: $TOTAL"
  echo "  per-language:"
  python3 -c "
import json
d = json.load(open('$MANIFEST'))
from collections import Counter
c = Counter()
for e in d['deployable_servers']:
    if e['deployment_ready']:
        c[e['language']] += 1
for l, n in c.most_common():
    print(f'    {l:15s} {n:3d}')
"
  echo ""
  echo "→ Install mcp-publisher: 'brew install mcp-publisher' (or build from source)"
  echo "→ 'mcp-publisher login github' (uses your existing gh keyring)"
  echo "→ 'SUBMIT=1 bash scripts/submit-all-mcp-registry.sh' → ships $TOTAL entries to registry.modelcontextprotocol.io"
  exit 0
fi

submitted=0
failed=0
skipped=0

# Validate each server.json (registry-valid = required)
echo "=== VALIDATION ==="
for d in "$MARKETPLACE"/*/; do
  slug=$(basename "$d")
  sj="$d/server.json"
  if [ -f "$sj" ]; then
    if python3 -c "
import json, sys
j = json.load(open('$sj'))
assert j['packages'][0]['registryType']=='pypi'
assert j['name'].startswith('io.github.CSOAI-ORG/')
" 2>/dev/null; then
      : # valid
    else
      echo "  ✗ $slug (invalid server.json)"
      skipped=$((skipped+1))
    fi
  fi
done
echo "  valid: $((479 - skipped))"
echo ""

echo "=== SUBMITTING ==="
while IFS=$'\t' read -r slug; do
  d="$MARKETPLACE/$slug"
  sj="$d/server.json"
  [ -f "$sj" ] || continue
  if ( cd "$d" && mcp-publisher publish ) >/dev/null 2>&1; then
    submitted=$((submitted+1))
    echo "  ✓ $slug"
  else
    failed=$((failed+1))
    echo "  ✗ $slug"
  fi
done < <(python3 -c "
import json
d = json.load(open('$MANIFEST'))
for e in d['deployable_servers']:
    if e['deployment_ready']:
        print(e['name'])
")

echo ""
echo "=== SUBMIT RESULT ==="
echo "  submitted: $submitted"
echo "  failed:    $failed"
echo "  skipped:   $skipped"
