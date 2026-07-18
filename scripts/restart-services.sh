#!/bin/bash
# RESTART ALL SERVICES
# Run this to ensure everything is running after a crash

echo "=== Restarting MEOK Services ==="

# Check Docker containers first
echo ""
echo "Checking Docker containers..."
if docker ps | grep -q sovereign-postgres; then
    echo "  ✅ PostgreSQL container running"
else
    echo "  ⚠️ PostgreSQL container not running"
fi

if docker ps | grep -q sovereign-redis; then
    echo "  ✅ Redis container running"
else
    echo "  ⚠️ Redis container not running"
fi

if docker ps | grep -q sovereign-weaviate; then
    echo "  ✅ Weaviate container running"
else
    echo "  ⚠️ Weaviate container not running"
fi

# Check if farm-vision is running
if ! lsof -i :8888 >/dev/null 2>&1; then
    echo ""
    echo "Starting farm-vision..."
    cd /Users/nicholas/clawd/meok/farm-vision
    nohup python3 -m http.server 8888 > /dev/null 2>&1 &
    echo "  ✅ farm-vision started"
else
    echo "  ✅ farm-vision already running"
fi

# Check if MEOK API is running
if ! lsof -i :3200 >/dev/null 2>&1; then
    echo ""
    echo "Starting MEOK API..."
    cd /Users/nicholas/clawd/meok
    nohup python3 -m uvicorn api.server:app --host 0.0.0.0 --port 3200 > /dev/null 2>&1 &
    echo "  ✅ MEOK API started"
else
    echo "  ✅ MEOK API already running"
fi

# Check if SOV3 MCP is running
if ! lsof -i :3101 >/dev/null 2>&1; then
    echo ""
    echo "Starting SOV3 MCP..."
    cd /Users/nicholas/clawd/sovereign-temple
    nohup python3 sovereign-mcp-server.py --port 3101 > /dev/null 2>&1 &
    echo "  ✅ SOV3 MCP started"
else
    echo "  ✅ SOV3 MCP already running"
fi

# Check if MEOK UI is running
if ! lsof -i :3000 >/dev/null 2>&1 && ! lsof -i :3001 >/dev/null 2>&1; then
    echo ""
    echo "Starting MEOK UI..."
    cd /Users/nicholas/clawd/meok/ui
    nohup npm run dev > /dev/null 2>&1 &
    echo "  ✅ MEOK UI started"
else
    echo "  ✅ MEOK UI already running"
fi

echo ""
echo "=== Service Check ==="
python3 /Users/nicholas/clawd/scripts/crash-recovery.py status
