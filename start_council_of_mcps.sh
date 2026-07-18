#!/bin/bash
# Start All Council of MCPs as Background Services

echo "🚀 Starting Council of MCPs..."
echo ""

cd /Users/nicholas/clawd

# Kill any existing Python processes on these ports
pkill -f "councilof_mcp_server.py" 2>/dev/null
pkill -f "moe_mcp_server.py" 2>/dev/null  
pkill -f "ralph_mcp_server.py" 2>/dev/null

sleep 1

# Start CouncilOf (Port 3103)
echo "⚖️  Starting CouncilOf MCP (Port 3103)..."
python3 council-of-mcps/councilof/councilof_mcp_server.py > /tmp/councilof.log 2>&1 &
COUNCILOF_PID=$!
echo "   PID: $COUNCILOF_PID"

sleep 2

# Start MoE (Port 3104)
echo "🎯 Starting MoE Council (Port 3104)..."
python3 council-of-mcps/moe/moe_mcp_server.py > /tmp/moe.log 2>&1 &
MOE_PID=$!
echo "   PID: $MOE_PID"

sleep 2

# Start Ralph (Port 3201)
echo "👔 Starting Ralph CEO (Port 3201)..."
python3 council-of-mcps/ralph/ralph_mcp_server.py > /tmp/ralph.log 2>&1 &
RALPH_PID=$!
echo "   PID: $RALPH_PID"

sleep 3

echo ""
echo "✅ All services started!"
echo ""
echo "Checking ports..."

# Check if ports are listening
for port in 3103 3104 3201; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "  ✅ Port $port: LISTENING"
    else
        echo "  ⚠️  Port $port: Not listening (check /tmp/*.log)"
    fi
done

echo ""
echo "Logs:"
echo "  CouncilOf: tail -f /tmp/councilof.log"
echo "  MoE:       tail -f /tmp/moe.log"
echo "  Ralph:     tail -f /tmp/ralph.log"
echo ""
echo "Test with:"
echo "  curl -X POST http://localhost:3103/mcp -d '{\"tool\":\"councilof_get_node_status\",\"params\":{}}'"
