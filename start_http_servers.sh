#!/bin/bash
# Start All Council of MCPs as HTTP Servers

echo "🚀 Starting Council of MCPs (HTTP Mode)..."
echo ""

cd /Users/nicholas/clawd

# Kill any existing
pkill -f "http_server.py" 2>/dev/null
sleep 1

# Start CouncilOf (Port 3103)
echo "⚖️  Starting CouncilOf HTTP Server (Port 3103)..."
python3 council-of-mcps/councilof/http_server.py > /tmp/councilof_http.log 2>&1 &
echo "   PID: $!"

sleep 2

# Start MoE (Port 3104)
echo "🎯 Starting MoE HTTP Server (Port 3104)..."
python3 council-of-mcps/moe/http_server.py > /tmp/moe_http.log 2>&1 &
echo "   PID: $!"

sleep 2

# Start Ralph (Port 3201)
echo "👔 Starting Ralph HTTP Server (Port 3201)..."
python3 council-of-mcps/ralph/http_server.py > /tmp/ralph_http.log 2>&1 &
echo "   PID: $!"

sleep 3

echo ""
echo "Checking ports..."
for port in 3103 3104 3201; do
    if curl -s http://localhost:$port/mcp -X POST -d '{"tool":"test"}' 2>/dev/null | grep -q "error\|Unknown"; then
        echo "  ✅ Port $port: RESPONDING"
    else
        echo "  ⚠️  Port $port: Check /tmp/*_http.log"
    fi
done

echo ""
echo "✅ Council of MCPs HTTP Servers running!"
