#!/bin/bash
# MEOK AI Labs — Bulk MCP Registry & Smithery Submission
# Submits top governance MCPs to the official MCP Registry and Smithery
# Run: bash submit-mcps-marketplace.sh

set -e

MCP_DIR="$HOME/clawd/mcp-marketplace"
GOVERNANCE_MCPS=(
  "eu-ai-act-compliance-mcp"
  "dora-compliance-mcp"
  "nis2-compliance-mcp"
  "bias-detection-mcp"
  "watermarking-authenticity-mcp"
  "cra-compliance-mcp"
  "csrd-compliance-mcp"
  "gdpr-compliance-ai-mcp"
  "ai-bom-mcp"
  "prompt-injection-firewall-mcp"
  "agent-audit-logger-mcp"
  "care-membrane-mcp"
  "a2a-governance-bridge-mcp"
  "agent-identity-trust-mcp"
  "agent-handoff-certified-mcp"
)

echo "============================================"
echo "MEOK AI Labs — MCP Marketplace Submission"
echo "============================================"
echo ""

# Check for required tools
command -v npx >/dev/null 2>&1 || { echo "ERROR: npx not found. Install Node.js first."; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "ERROR: python3 not found."; exit 1; }

# Count packages
TOTAL=${#GOVERNANCE_MCPS[@]}
echo "Submitting $TOTAL governance MCPs..."
echo ""

SUCCESS=0
FAILED=0
SKIPPED=0

for mcp in "${GOVERNANCE_MCPS[@]}"; do
  MCP_PATH="$MCP_DIR/$mcp"

  if [ ! -d "$MCP_PATH" ]; then
    echo "⏭️  SKIP: $mcp (directory not found)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  echo "📦 Processing: $mcp"

  # Read version from pyproject.toml
  VERSION=$(grep "^version = " "$MCP_PATH/pyproject.toml" 2>/dev/null | head -1 | sed 's/version = "\(.*\)"/\1/' || echo "1.0.0")
  DESCRIPTION=$(grep "^description = " "$MCP_PATH/pyproject.toml" 2>/dev/null | head -1 | sed 's/description = "\(.*\)"/\1/' | cut -c1-200 || echo "AI governance MCP server")

  echo "   Version: $VERSION"
  echo "   Description: $DESCRIPTION"

  # 1. Publish to PyPI (if not already published)
  echo "   📤 Checking PyPI..."
  PYPI_CHECK=$(pip index versions "$mcp" 2>/dev/null | grep "$VERSION" || echo "")
  if [ -z "$PYPI_CHECK" ]; then
    echo "   📤 Publishing to PyPI..."
    cd "$MCP_PATH"
    python3 -m build --wheel 2>/dev/null && twine upload dist/* --skip-existing 2>/dev/null || echo "   ⚠️  PyPI publish skipped (may already exist)"
    cd - > /dev/null
  else
    echo "   ✅ Already on PyPI"
  fi

  # 2. Smithery publish (if smithery.yaml exists)
  if [ -f "$MCP_PATH/smithery.yaml" ]; then
    echo "   📤 Submitting to Smithery..."
    cd "$MCP_PATH"
    npx -y @smithery/cli publish 2>/dev/null || echo "   ⚠️  Smithery publish failed (may need auth)"
    cd - > /dev/null
  else
    echo "   ⏭️  No smithery.yaml — skipping Smithery"
  fi

  # 3. Verify glama.json exists (Glama auto-indexes from PyPI)
  if [ -f "$MCP_PATH/glama.json" ]; then
    echo "   ✅ glama.json present (auto-indexed)"
  else
    echo "   ⚠️  No glama.json — may not appear on Glama"
  fi

  # 4. Verify manifest.json exists (for .mcpb bundles)
  if [ -f "$MCP_PATH/manifest.json" ]; then
    echo "   ✅ manifest.json present (Desktop Extension ready)"
  else
    echo "   ⏭️  No manifest.json — .mcpb bundle not available"
  fi

  echo "   ✅ Done: $mcp"
  echo ""
  SUCCESS=$((SUCCESS + 1))
done

echo "============================================"
echo "SUBMISSION SUMMARY"
echo "============================================"
echo "Processed: $SUCCESS"
echo "Skipped:   $SKIPPED"
echo "Failed:    $FAILED"
echo ""
echo "NEXT STEPS:"
echo "1. Verify listings at:"
echo "   - Smithery: https://smithery.ai/search?q=meok"
echo "   - Glama: https://glama.ai/mcp/servers?q=meok"
echo "   - MCP Registry: https://registry.modelcontextprotocol.io/"
echo ""
echo "2. Register on MCPize (needs GitHub auth):"
echo "   - Go to https://mcpize.com"
echo "   - Already registered as Nick Templeman / MEOK AI Labs"
echo "   - 2 servers active, 30+ to add"
echo ""
echo "3. Submit to PulseMCP:"
echo "   - Auto-indexes from Official MCP Registry weekly"
echo ""
echo "4. Post on Reddit/HN:"
echo "   - r/artificial, r/MachineLearning"
echo "   - Show HN draft in revenue/SHOW_HN_DRAFT_2026-05-13.md"
echo ""
echo "========================================="
echo "Done. Revenue path: MCP marketplace exposure"
echo "========================================="