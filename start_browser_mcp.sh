#!/bin/bash
# Browser Use MCP - Startup Protocol
# Uses the Python 3.13 environment from meok-platform

CDIR="/Users/nicholas/clawd/meok-platform"
VENV="$CDIR/.venv"
LOG="/Users/nicholas/browser_mcp.log"

echo "🌐 Starting Browser Use MCP..."

cd "$CDIR"

if [ ! -d "$VENV" ]; then
    echo "❌ Virtual environment not found at $VENV"
    exit 1
fi

export PYTHONPATH="$CDIR:$PYTHONPATH"

echo "🚀 Launching Browser MCP Server..."
# Using the pre-installed browser_use.mcp.server module
nohup "$VENV/bin/python3" -m browser_use.mcp.server > "$LOG" 2>&1 &
echo "   PID: $!"
echo "   Logs: tail -f $LOG"
