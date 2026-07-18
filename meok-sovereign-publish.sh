#!/bin/bash
# meok-sovereign-publish.sh — build + upload all 22 sovereign MCPs to PyPI
# Run on M2 Mac (the 24/7 node) after `vercel --prod` deploys proofof.ai
#
# Requires: PYPI_TOKEN in env, build + twine installed

set -e

MCP_ROOT="$HOME/clawd/mcp-marketplace"
LOG="/tmp/meok-publish.log"
SUCCESS=0
FAILED=0

echo "=========================================="
echo "MEOK SOVEREIGN MCP PUBLISHER"
echo "$(date)"
echo "=========================================="

if [ -z "$PYPI_TOKEN" ]; then
  echo "❌ PYPI_TOKEN not set. export PYPI_TOKEN=*** echo "Then re-run."
  exit 1
fi

# Install build tools
pip install --quiet build twine 2>&1 | tail -2

for mcp_dir in "$MCP_ROOT"/meok-sovereign-*-mcp "$MCP_ROOT"/meok-supply-chain-attestation-mcp; do
  if [ ! -d "$mcp_dir" ]; then
    continue
  fi
  name=$(basename "$mcp_dir")
  echo ""
  echo "→ Building $name..."
  cd "$mcp_dir"
  rm -rf dist/ build/ *.egg-info/
  /opt/homebrew/bin/python3.11 -m build 2>&1 | tail -3
  if [ -d dist ]; then
    echo "  ✅ Built $(ls dist/*.whl 2>/dev/null | wc -l) wheel + $(ls dist/*.tar.gz 2>/dev/null | wc -l) sdist"
    echo "  → Uploading..."
    TWINE_USERNAME=__token__ TWINE_PASSWORD="$PYPI_TOKEN" /opt/homebrew/bin/python3.11 -m twine upload dist/* 2>&1 | tail -3
    if [ $? -eq 0 ]; then
      SUCCESS=$((SUCCESS + 1))
      echo "  ✅ $name published"
    else
      FAILED=$((FAILED + 1))
      echo "  ❌ $name FAILED"
    fi
  else
    FAILED=$((FAILED + 1))
    echo "  ❌ $name build failed"
  fi
done

echo ""
echo "=========================================="
echo "PUBLISH COMPLETE"
echo "  ✅ Success: $SUCCESS"
echo "  ❌ Failed: $FAILED"
echo "=========================================="
echo "Next: visit https://pypi.org/project/meok-sovereign-passport-mcp/ to verify"
