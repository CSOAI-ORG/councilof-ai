#!/bin/bash
# Batch build and publish all MCP servers to PyPI (Production Ready v2)
# Usage: bash batch-publish-pypi-v2.sh [limit]
# Set LIMIT to publish only N packages (for testing)

set -euo pipefail

PYTHON="/Library/Developer/CommandLineTools/Library/Frameworks/Python3.framework/Versions/3.9/bin/python3"
MARKETPLACE_DIR="/Users/nicholas/clawd/mcp-marketplace"
LOG_FILE="/Users/nicholas/clawd/scripts/pypi-publish-$(date +%Y%m%d-%H%M%S).log"
SUCCESS=0
FAIL=0
SKIP=0
ALREADY=0

LIMIT=${1:-0}  # 0 = unlimited
COUNT=0

echo "🚀 PyPI Batch Publish v2 — $(date)"
echo "====================================="
echo "Log: $LOG_FILE"
echo ""

# Ensure twine is available
if ! command -v twine &> /dev/null; then
    echo "❌ twine not found. Install: pip install twine"
    exit 1
fi

# Ensure build is available
if ! $PYTHON -m build --help &> /dev/null; then
    echo "❌ python build not found. Install: pip install build"
    exit 1
fi

for dir in "$MARKETPLACE_DIR"/*/; do
    name=$(basename "$dir")
    COUNT=$((COUNT+1))
    
    # Limit check
    if [ "$LIMIT" -gt 0 ] && [ "$COUNT" -gt "$LIMIT" ]; then
        echo "⏹️  Reached limit of $LIMIT packages. Stopping."
        break
    fi
    
    # Skip if no pyproject.toml
    if [ ! -f "$dir/pyproject.toml" ]; then
        echo "⏭️  SKIP (no pyproject.toml): $name"
        SKIP=$((SKIP+1))
        continue
    fi
    
    cd "$dir"
    
    # Clean old dist/ and build artifacts
    rm -rf dist/ build/ *.egg-info
    
    # Extract current version and bump patch
    current_version=$(grep -m1 '^version' pyproject.toml | sed 's/.*= *"\(.*\)".*/\1/')
    if [ -z "$current_version" ]; then
        current_version="1.0.0"
    fi
    
    # Bump patch version (e.g., 1.0.5 -> 1.0.6)
    IFS='.' read -r major minor patch <<< "$current_version"
    new_patch=$((patch + 1))
    new_version="${major}.${minor}.${new_patch}"
    
    # Update version in pyproject.toml
    sed -i '' "s/^version = .*/version = \"${new_version}\"/" pyproject.toml
    
    echo "📦 [$COUNT] Building $name v$new_version..."
    
    # Build
    if $PYTHON -m build 2>>"$LOG_FILE" | tail -1; then
        # Upload with skip-existing
        if $PYTHON -m twine upload --skip-existing dist/* 2>>"$LOG_FILE" | tail -2; then
            echo "✅ PUBLISHED: $name v$new_version"
            SUCCESS=$((SUCCESS+1))
        else
            echo "❌ UPLOAD FAIL: $name"
            FAIL=$((FAIL+1))
        fi
    else
        echo "❌ BUILD FAIL: $name"
        FAIL=$((FAIL+1))
    fi
done

echo ""
echo "====================================="
echo "📊 RESULTS: $(date)"
echo "SUCCESS:  $SUCCESS"
echo "FAILED:   $FAIL"
echo "SKIPPED:  $SKIP"
echo "====================================="
echo "Log: $LOG_FILE"
