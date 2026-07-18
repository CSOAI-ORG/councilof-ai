#!/bin/bash
# THE OWNER MOVE — single command that ships the entire CSOAI estate to live.
#
# Pre-flight (one-time setup):
#   1. export PYPI_TOKEN=pypi-...
#   2. export NPM_TOKEN=npm_...
#   3. mcp-publisher login github (uses existing gh keyring)
#
# Then run:
#   bash scripts/ship-everything.sh
#
# This script runs all 3 owner-gated publish flows in sequence:
#   A. 277 Python packages → PyPI (twine upload --skip-existing)
#   B. 202 TypeScript packages → npm (npm publish)
#   C. 479 server.json → MCP registry (mcp-publisher publish)
#
# Each step is idempotent (--skip-existing on PyPI, npm checks version, registry
# rejects duplicates). Total wall time: ~20-30 min depending on network.
#
# After this runs:
#   - 479 packages are discoverable on PyPI + npm
#   - 479 server.json entries are live on registry.modelcontextprotocol.io
#   - 23 flagship repos auto-crawl Smithery/Glama within 24h
#   - Traffic starts flowing (the 136-258/day baseline × 2 weeks ago, now × 2.5x
#     the repo count)
set -uo pipefail

ROOT=~/clawd
cd "$ROOT"

echo "================================================================"
echo "  CSOAI SHIP-EVERYTHING — the single owner move"
echo "================================================================"
echo ""

# Pre-flight check
PY_READY=0
TS_READY=0
if [ -f MCP_DEPLOYMENT_MANIFEST.json ]; then
  PY_READY=$(python3 -c "import json; d=json.load(open('MCP_DEPLOYMENT_MANIFEST.json')); print(sum(1 for e in d['deployable_servers'] if e['deployment_ready'] and e['language']=='python'))")
  TS_READY=$(python3 -c "import json; d=json.load(open('MCP_DEPLOYMENT_MANIFEST.json')); print(sum(1 for e in d['deployable_servers'] if e['deployment_ready'] and e['language']=='typescript'))")
fi

echo "Manifest:"
echo "  $PY_READY Python packages to ship to PyPI"
echo "  $TS_READY TypeScript packages to ship to npm"
echo "  479 server.json to ship to MCP registry"
echo ""

if [ -z "${PYPI_TOKEN:-}" ] && [ -z "${NPM_TOKEN:-}" ]; then
  echo "Neither PYPI_TOKEN nor NPM_TOKEN is set. Cannot ship."
  echo ""
  echo "Set at least one (or both):"
  echo "  export PYPI_TOKEN=pypi-..."
  echo "  export NPM_TOKEN=npm_..."
  exit 1
fi

# ── STEP A: PyPI ─────────────────────────────────────────────────────────
if [ -n "${PYPI_TOKEN:-}" ]; then
  echo "─── STEP A: PyPI publish (${PY_READY} packages) ───"
  bash scripts/publish-all-py-mcps.sh
  echo ""
else
  echo "─── STEP A: PyPI publish ─── SKIPPED (no PYPI_TOKEN)"
  echo ""
fi

# ── STEP B: npm ───────────────────────────────────────────────────────────
if [ -n "${NPM_TOKEN:-}" ]; then
  echo "─── STEP B: npm publish (${TS_READY} packages) ───"
  bash scripts/publish-all-ts-mcps.sh
  echo ""
else
  echo "─── STEP B: npm publish ─── SKIPPED (no NPM_TOKEN)"
  echo ""
fi

# ── STEP C: MCP registry ──────────────────────────────────────────────────
if command -v mcp-publisher >/dev/null 2>&1; then
  echo "─── STEP C: MCP registry (479 server.json) ───"
  SUBMIT=1 bash scripts/submit-all-mcp-registry.sh
  echo ""
else
  echo "─── STEP C: MCP registry ─── SKIPPED (mcp-publisher not installed)"
  echo "  → brew install mcp-publisher (or build from source)"
  echo "  → mcp-publisher login github"
  echo "  → re-run this script"
  echo ""
fi

# ── DONE ──────────────────────────────────────────────────────────────────
echo "================================================================"
echo "  SHIP-EVERYTHING COMPLETE"
echo "================================================================"
echo ""
echo "Post-publish checklist (M2 MacBook):"
echo "  1. AirDrop the 523K bundle to the M2 MacBook"
echo "  2. git pull on csoai-v2-app to get the live-app tree"
echo "  3. Update 6 surfaces in csoai-v2-app with the day-3 numbers"
echo "  4. Refresh the OS 'proof' app with the 97-comp OSCAL (already current)"
echo "  5. Watch PyPI download stats: 'pip install csoai-... -U --dry-run'"
echo "  6. Watch GitHub traffic: 'gh api repos/CSOAI-ORG/<mcp>/traffic/views'"
echo ""
echo "The 1 owner move = the unlock. Now: traffic + revenue."
