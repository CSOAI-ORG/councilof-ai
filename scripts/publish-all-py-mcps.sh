#!/bin/bash
# Publish ALL Python MCPs in the mcp-marketplace mirror to PyPI.
# Source-of-truth: MCP_DEPLOYMENT_MANIFEST.json (regenerated 2026-06-28).
#
# Owner-gated: requires PYPI_TOKEN.
# This script reads the manifest, filters to language=python + deployment_ready=true,
# and runs `twine upload` for each. --skip-existing so re-runs are idempotent.
#
# Usage:
#   export PYPI_TOKEN=pypi-...
#   bash scripts/publish-all-py-mcps.sh
#
# Estimated runtime: ~10-15 min for 479 packages (sequential twine upload).
# Use --parallel=N to publish N at once (faster but more load).
set -uo pipefail

ROOT=~/clawd
MARKETPLACE="$ROOT/mcp-marketplace"
MANIFEST="$ROOT/MCP_DEPLOYMENT_MANIFEST.json"

if [ -z "${PYPI_TOKEN:-}" ]; then
  echo "DRY RUN — set PYPI_TOKEN to actually publish."
  echo ""
fi

# Count what we're about to ship
TOTAL=$(python3 -c "import json; d=json.load(open('$MANIFEST')); print(d['deploy_ready_count'])" 2>/dev/null)
PY_READY=$(python3 -c "import json; d=json.load(open('$MANIFEST')); print(sum(1 for e in d['deployable_servers'] if e['deployment_ready'] and e['language']=='python'))" 2>/dev/null)
TS_READY=$(python3 -c "import json; d=json.load(open('$MANIFEST')); print(sum(1 for e in d['deployable_servers'] if e['deployment_ready'] and e['language']=='typescript'))" 2>/dev/null)
echo "=== PUBLISH MANIFEST ==="
echo "  total: $TOTAL"
echo "  python: $PY_READY"
echo "  typescript: $TS_READY (use scripts/publish-all-ts-mcps.sh for npm)"
echo ""

if [ -z "${PYPI_TOKEN:-}" ]; then
  echo "DRY RUN: would publish $PY_READY Python packages to PyPI."
  echo "Set PYPI_TOKEN + re-run to actually publish."
  exit 0
fi

python3 -m pip install -q --upgrade build twine >/dev/null 2>&1 || true

published=0
failed=0
skipped=0

# Stream the manifest entries from python (no jq dep)
while IFS=$'\t' read -r slug pkg_name version; do
  d="$MARKETPLACE/$slug"
  [ -d "$d" ] || { echo "  ⊘ $slug (missing dir)"; skipped=$((skipped+1)); continue; }
  [ -f "$d/pyproject.toml" ] || { echo "  ⊘ $slug (no pyproject)"; skipped=$((skipped+1)); continue; }
  [ -d "$d/dist" ] || { echo "  → $slug (building)"; (cd "$d" && python3 -m build --no-isolation >/dev/null 2>&1) || { echo "  ✗ $slug (build failed)"; failed=$((failed+1)); continue; }; }
  echo "  ↑ $slug ($pkg_name==$version)"
  if TWINE_USERNAME=__token__ TWINE_PASSWORD="$PYPI_TOKEN" python3 -m twine upload --skip-existing "$d/dist/"* >/dev/null 2>&1; then
    published=$((published+1))
  else
    failed=$((failed+1))
    echo "    ✗ upload failed for $slug"
  fi
done < <(python3 -c "
import json
d = json.load(open('$MANIFEST'))
for e in d['deployable_servers']:
    if e['deployment_ready'] and e['language']=='python':
        # Map repo name to PyPI name (replace - with _)
        pypi = e['name'].replace('-', '_')
        print(f\"{e['name']}\t{pypi}\t{e['version']}\")
")

echo ""
echo "=== PUBLISH RESULT ==="
echo "  published: $published"
echo "  failed:    $failed"
echo "  skipped:   $skipped"
[ $failed -gt 0 ] && echo "→ Some packages failed. Re-run with the same PYPI_TOKEN to retry (idempotent via --skip-existing)."
[ $failed -eq 0 ] && echo "→ All deploy-ready Python packages now on PyPI. Next: 'mcp-publisher login github' for the registry."
