#!/bin/bash
# BULK PYPI PUBLISH SCRIPT
# Publishes top MCP servers to PyPI for organic discovery

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# PyPI API Token (from user)
PYPI_TOKEN="${PYPI_TOKEN:-}"

if [ -z "$PYPI_TOKEN" ]; then
    echo -e "${RED}❌ PYPI_TOKEN not set!${NC}"
    echo "Get your token from: https://pypi.org/manage/account/token/"
    echo "Then run: export PYPI_TOKEN=pypi-..."
    exit 1
fi

# Top 10 MCPs to publish
MCPS=(
    "care-membrane-mcp"
    "eu-ai-act-compliance-mcp"
    "proofof-ai-mcp"
    "ai-self-audit-mcp"
    "web-research-mcp"
    "memory-search-mcp"
    "code-executor-mcp"
    "agent-orchestrator-mcp"
    "agent-delegation-mcp"
    "agent-negotiation-mcp"
)

BASE_DIR="/Users/nicholas/clawd/mcp-marketplace"
PUBLISHED=0
FAILED=0

echo "🚀 BULK PYPI PUBLISH"
echo "==================="
echo ""

for mcp in "${MCPS[@]}"; do
    echo -e "${YELLOW}📦 Publishing: $mcp${NC}"
    
    cd "$BASE_DIR/$mcp" 2>/dev/null || {
        echo -e "${RED}  ❌ Directory not found: $mcp${NC}"
        ((FAILED++))
        continue
    }
    
    # Clean old builds
    rm -rf dist/ build/ *.egg-info
    
    # Build package
    if python3 -m build > /tmp/build.log 2>&1; then
        echo "  ✁️ Built successfully"
    else
        echo -e "${RED}  ❌ Build failed${NC}"
        tail -5 /tmp/build.log
        ((FAILED++))
        continue
    fi
    
    # Publish to PyPI
    if python3 -m twine upload dist/* --username __token__ --password "$PYPI_TOKEN" > /tmp/upload.log 2>&1; then
        echo -e "${GREEN}  ✅ Published: https://pypi.org/project/$mcp/${NC}"
        ((PUBLISHED++))
    else
        echo -e "${RED}  ❌ Upload failed${NC}"
        tail -3 /tmp/upload.log
        ((FAILED++))
    fi
    
    echo ""
done

echo "==================="
echo -e "${GREEN}✅ Published: $PUBLISHED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ $PUBLISHED -gt 0 ]; then
    echo "🎉 Success! Packages are now live on PyPI"
    echo "   Search: https://pypi.org/search/?q=meok"
fi
