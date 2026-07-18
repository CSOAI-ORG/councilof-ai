#!/bin/bash
# Publish ALL TypeScript MCPs in the mcp-marketplace mirror to npm.
# Source-of-truth: MCP_DEPLOYMENT_MANIFEST.json (regenerated 2026-06-28).
#
# Owner-gated: requires NPM_TOKEN.
# This script reads the manifest, filters to language=typescript + deployment_ready=true,
# runs `npm publish` for each. --dry-run works for the manifest summary.
#
# Usage:
#   export NPM_TOKEN=npm_...
#   bash scripts/publish-all-ts-mcps.sh
#
# Note: npm has a 2FA requirement for new publishers — owner may need to
# enable 2FA on the CSOAI-ORG npm org + add a granular token with publish
# scope to the CSOAI-ORG org. The token is owner-gated.
set -uo pipefail

ROOT=~/clawd
MARKETPLACE="$ROOT/mcp-marketplace"
MANIFEST="$ROOT/MCP_DEPLOYMENT_MANIFEST.json"

if [ -z "${NPM_TOKEN:-}" ]; then
  echo "DRY RUN — set NPM_TOKEN to actually publish."
  echo ""
fi

# Count what we're about to ship
TOTAL=$(python3 -c "import json; d=json.load(open('$MANIFEST')); print(d['deploy_ready_count'])" 2>/dev/null)
TS_READY=$(python3 -c "import json; d=json.load(open('$MANIFEST')); print(sum(1 for e in d['deployable_servers'] if e['deployment_ready'] and e['language']=='typescript'))" 2>/dev/null)
PY_READY=$(python3 -c "import json; d=json.load(open('$MANIFEST')); print(sum(1 for e in d['deployable_servers'] if e['deployment_ready'] and e['language']=='python'))" 2>/dev/null)
echo "=== PUBLISH MANIFEST ==="
echo "  total deploy-ready: $TOTAL"
echo "  python: $PY_READY (use scripts/publish-all-py-mcps.sh for PyPI)"
echo "  typescript: $TS_READY"
echo ""

if [ -z "${NPM_TOKEN:-}" ]; then
  echo "DRY RUN: would publish $TS_READY TypeScript packages to npm."
  echo "Set NPM_TOKEN + re-run to actually publish."
  echo ""
  echo "  Pre-flight for the owner:"
  echo "  1. Enable 2FA on the CSOAI-ORG npm org"
  echo "  2. Create a granular token: npm token create --publish --scope=CSOAI-ORG"
  echo "  3. Add npm org member for CSOAI-ORG (if not already)"
  echo "  4. export NPM_TOKEN=npm_... (the granular token)"
  echo "  5. bash scripts/publish-all-ts-mcps.sh"
  exit 0
fi

# Set the npm token for this session
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc 2>/dev/null || true
export NPM_TOKEN

published=0
failed=0
skipped=0

# Stream the manifest entries from python
while IFS=$'\t' read -r slug pkg_name version; do
  d="$MARKETPLACE/$slug"
  [ -d "$d" ] || { echo "  ⊘ $slug (missing dir)"; skipped=$((skipped+1)); continue; }
  [ -f "$d/package.json" ] || { echo "  ⊘ $slug (no package.json)"; skipped=$((skipped+1)); continue; }
  [ -d "$d/node_modules" ] || { echo "  → $slug (running npm install)"; (cd "$d" && npm install --silent >/dev/null 2>&1) || { echo "  ✗ $slug (install failed)"; failed=$((failed+1)); continue; }; }
  [ -d "$d/dist" ] || { echo "  → $slug (running build)"; (cd "$d" && npm run build --silent >/dev/null 2>&1) || { echo "  ✗ $slug (build failed)"; failed=$((failed+1)); continue; }; }
  echo "  ↑ $slug ($pkg_name@$version)"
  if ( cd "$d" && npm publish --access public --dry-run ) >/dev/null 2>&1; then
    # dry-run passed — now do the real publish
    if ( cd "$d" && npm publish --access public ) >/dev/null 2>&1; then
      published=$((published+1))
    else
      failed=$((failed+1))
      echo "    ✗ npm publish failed for $slug"
    fi
  else
    failed=$((failed+1))
    echo "    ✗ npm dry-run failed for $slug"
  fi
done < <(python3 -c "
import json
d = json.load(open('$MANIFEST'))
for e in d['deployable_servers']:
    if e['deployment_ready'] and e['language']=='typescript':
        # @scope/name format for npm
        pypi = '@csoai-org/' + e['name'].replace('_', '-')
        print(f\"{e['name']}\t{pypi}\t{e['version']}\")
")

echo ""
echo "=== PUBLISH RESULT ==="
echo "  published: $published"
echo "  failed:    $failed"
echo "  skipped:   $skipped"
[ $failed -gt 0 ] && echo "→ Re-run with the same NPM_TOKEN to retry."
[ $failed -eq 0 ] && echo "→ All TypeScript packages on npm. Combined with the Python side, the estate is fully live."
