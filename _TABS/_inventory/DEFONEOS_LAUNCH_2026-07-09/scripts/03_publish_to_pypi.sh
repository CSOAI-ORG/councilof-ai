#!/bin/bash
# W44 Day 3 — PUBLISH 70 MCPs TO PyPI
# This is the REAL script that will actually publish to PyPI.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Validate twine is installed
if ! command -v twine >/dev/null 2>&1; then
    echo "ERROR: twine not installed"
    echo "Install: pip install twine"
    exit 1
fi

# Validate PyPI credentials
if [ -z "$TWINE_USERNAME" ] || [ -z "$TWINE_PASSWORD" ]; then
    echo "ERROR: TWINE_USERNAME / TWINE_PASSWORD must be set"
    echo "Get token from https://pypi.org/manage/account/token/"
    echo "  export TWINE_USERNAME=__token__"
    echo "  export TWINE_PASSWORD=<pypi-token-from-dashboard>"
    exit 1
fi

echo "=== PUBLISHING 70 MCPs TO PyPI ==="
echo ""

# Get list of our 70 MCPs (only those that haven't been published yet)
cd /Users/nicholas/clawd/mcp-marketplace
MCP_DIRS=$(ls -d meek-*-mcp/ 2>/dev/null | head -70)

PUBLISHED=0
FAILED=0
for mcp_dir in $MCP_DIRS; do
    if [ ! -d "$mcp_dir/dist" ]; then
        # Build first
        cd "/Users/nicholas/clawd/mcp-marketplace/$mcp_dir"
        python3 -m build --wheel --sdist 2>&1 | tail -3 > /dev/null || {
            echo "BUILD FAILED: $mcp_dir"
            FAILED=$((FAILED + 1))
            cd /Users/nicholas/clawd/mcp-marketplace
            continue
        }
        cd /Users/nicholas/clawd/mcp-marketplace
    fi

    # Publish
    cd "/Users/nicholas/clawd/mcp-marketplace/$mcp_dir"
    if twine upload dist/* 2>&1 | tail -3 | grep -q "Successfully uploaded"; then
        echo "OK: $mcp_dir"
        PUBLISHED=$((PUBLISHED + 1))
    else
        echo "FAIL: $mcp_dir"
        FAILED=$((FAILED + 1))
    fi
    cd /Users/nicholas/clawd/mcp-marketplace
done

echo ""
echo "=== PUBLISHED: $PUBLISHED / FAILED: $FAILED ==="
