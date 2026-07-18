#!/bin/bash
# Batch build and publish all MCP servers to PyPI
# Usage: bash batch-publish-pypi.sh

MARKETPLACE_DIR="/Users/nicholas/clawd/mcp-marketplace"
LOG_FILE="/Users/nicholas/clawd/scripts/pypi-publish.log"
SUCCESS=0
FAIL=0
SKIP=0
ALREADY=0

echo "$(date): Starting batch PyPI publish" > "$LOG_FILE"

for dir in "$MARKETPLACE_DIR"/*/; do
    name=$(basename "$dir")
    
    # Skip if no pyproject.toml
    if [ ! -f "$dir/pyproject.toml" ]; then
        echo "SKIP (no pyproject.toml): $name" >> "$LOG_FILE"
        SKIP=$((SKIP+1))
        continue
    fi
    
    # Skip if already has dist/ with files (already published)
    if [ -d "$dir/dist" ] && [ "$(ls "$dir/dist/" 2>/dev/null | wc -l | tr -d ' ')" -gt 0 ]; then
        echo "ALREADY: $name" >> "$LOG_FILE"
        ALREADY=$((ALREADY+1))
        continue
    fi
    
    # Build
    echo "BUILDING: $name"
    cd "$dir"
    if python3 -m build 2>>"$LOG_FILE" | tail -1; then
        # Upload
        if python3 -m twine upload --skip-existing dist/* 2>>"$LOG_FILE" | tail -2; then
            echo "✅ $name" >> "$LOG_FILE"
            SUCCESS=$((SUCCESS+1))
        else
            echo "❌ UPLOAD FAIL: $name" >> "$LOG_FILE"
            FAIL=$((FAIL+1))
        fi
    else
        echo "❌ BUILD FAIL: $name" >> "$LOG_FILE"
        FAIL=$((FAIL+1))
    fi
done

echo "" >> "$LOG_FILE"
echo "$(date): COMPLETE" >> "$LOG_FILE"
echo "Success: $SUCCESS | Failed: $FAIL | Skipped: $SKIP | Already: $ALREADY" >> "$LOG_FILE"
echo "====================================="
echo "SUCCESS: $SUCCESS"
echo "FAILED:  $FAIL"
echo "SKIPPED: $SKIP"
echo "ALREADY: $ALREADY"
echo "====================================="
echo "Log: $LOG_FILE"
