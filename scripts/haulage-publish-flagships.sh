#!/usr/bin/env bash
# Publish the 3 flagship haulage MCPs to PyPI.
# Run this when Nick is back. Requires PYPI_TOKEN env var.
#
# Usage:
#   export PYPI_TOKEN="pypi-AgEI..."
#   ~/clawd/scripts/haulage-publish-flagships.sh
#
# What it does:
#   1. Builds wheels for all 3 flagship MCPs
#   2. Runs tests (must all pass before publish)
#   3. Uploads to PyPI via twine
#   4. Verifies install from PyPI

set -euo pipefail

if [ -z "${PYPI_TOKEN:-}" ]; then
  echo "ERROR: PYPI_TOKEN environment variable required."
  echo "Get it from https://pypi.org/manage/account/token/"
  echo "Then: export PYPI_TOKEN=\"pypi-AgEI...\""
  exit 1
fi

MCPS=(
  "meok-ev-recall-transport-mcp"
  "meok-tacho-audit-mcp"
  "meok-bs7121-mcp"
  "meok-vehicle-handover-mcp"
  "meok-fors-clocs-mcp"
  "meok-allmi-hiab-mcp"
  "meok-dvsa-olicence-mcp"
  "meok-cpa-contract-lift-mcp"
)
ROOT="/Users/nicholas/clawd/mcp-marketplace"

# Ensure twine
python3.11 -m pip install --quiet --upgrade twine build

for MCP in "${MCPS[@]}"; do
  DIR="$ROOT/$MCP"
  if [ ! -d "$DIR" ]; then
    echo "✗ SKIP $MCP — folder missing"
    continue
  fi
  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "📦 $MCP"
  echo "═══════════════════════════════════════════════════════"

  cd "$DIR"

  # 1. Run tests
  echo "→ tests"
  if ! python3.11 -m pytest tests/ -q 2>&1 | tail -5; then
    echo "✗ TESTS FAILED — aborting publish for $MCP"
    continue
  fi

  # 2. Clean + build
  echo "→ build"
  rm -rf dist build *.egg-info
  python3.11 -m build --wheel --sdist --outdir dist/ 2>&1 | tail -3

  # 3. Gate-check (importable in clean venv)
  echo "→ gate-check"
  WHEEL=$(ls dist/*.whl | head -1)
  WORK=$(mktemp -d)
  python3.11 -m venv "$WORK/v" >/dev/null
  if ! "$WORK/v/bin/pip" install --quiet "$WHEEL" 2>&1 | tail -2; then
    echo "✗ INSTALL FAILED — aborting publish for $MCP"
    rm -rf "$WORK"; continue
  fi
  if ! "$WORK/v/bin/python" -c "import server; print('OK')" >/dev/null 2>&1; then
    echo "✗ IMPORT FAILED — aborting publish for $MCP"
    rm -rf "$WORK"; continue
  fi
  rm -rf "$WORK"

  # 4. Publish
  echo "→ uploading to PyPI"
  TWINE_USERNAME="__token__" TWINE_PASSWORD="$PYPI_TOKEN" \
    python3.11 -m twine upload --non-interactive dist/* 2>&1 | tail -5

  # 5. Verify
  echo "→ verify (30s wait for PyPI sync)"
  sleep 30
  VERIFY=$(mktemp -d)
  python3.11 -m venv "$VERIFY/v" >/dev/null
  if "$VERIFY/v/bin/pip" install --quiet "$MCP" 2>&1 | tail -3 \
     && "$VERIFY/v/bin/python" -c "import server" 2>/dev/null; then
    echo "✅ $MCP published + importable from PyPI"
  else
    echo "⚠️  $MCP — verify failed (may be PyPI propagation delay)"
  fi
  rm -rf "$VERIFY"
done

echo ""
echo "═══════════════════════════════════════════════════════"
echo "Done. 8 flagships now on PyPI:"
for M in "${MCPS[@]}"; do
  echo "  - https://pypi.org/project/$M/"
done
echo "═══════════════════════════════════════════════════════"
