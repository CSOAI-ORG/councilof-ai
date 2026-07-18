#!/bin/bash
# Dagon Maps - Robust Startup Protocol
# Targeted at Python 3.11 environment

CDIR="/Users/nicholas/clawd/_private_dagon/dagon-geospatial-intel"
VENV="$CDIR/.venv"
LOG="/Users/nicholas/dagon_maps.log"

echo "🗺️ Starting Dagon Meok Maps..."

cd "$CDIR"

# 1. Ensure Venv exists with correct python
if [ ! -d "$VENV" ]; then
    echo "   Creating virtual environment..."
    /opt/homebrew/bin/python3.11 -m venv .venv
fi

# 2. Aggressive pip install with retries and long timeouts
MAX_RETRIES=5
COUNT=0
SUCCESS=0

while [ $COUNT -lt $MAX_RETRIES ]; do
    echo "   Attempt $((COUNT+1)) to install dependencies..."
    # Increase timeout to 60s and use a different mirror if needed
    ./.venv/bin/python3 -m pip install --upgrade pip --quiet
    ./.venv/bin/python3 -m pip install fastmcp httpx mcp --default-timeout=100
    if [ $? -eq 0 ]; then
        SUCCESS=1
        break
    fi
    COUNT=$((COUNT+1))
    echo "   ⚠️ Failed. Retrying in 5s..."
    sleep 5
done

if [ $SUCCESS -eq 0 ]; then
    echo "❌ Failed to install dependencies after $MAX_RETRIES attempts."
    # Fallback to local site-packages if possible or error out
fi

# 3. Start Server
echo "🚀 Launching Dagon Maps Server..."
nohup ./.venv/bin/python3 server.py > "$LOG" 2>&1 &
echo "   PID: $!"
echo "   Logs: tail -f $LOG"
