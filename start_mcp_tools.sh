#!/bin/bash
# Start MCP Tool Servers (Moves 4-6)

echo "🚀 Starting MCP Tool Servers..."
echo ""

cd /Users/nicholas/clawd

# Kill existing
pkill -f "searxng_mcp_tool.py" 2>/dev/null
pkill -f "qdrant_mcp_tool.py" 2>/dev/null
pkill -f "redis_mcp_tool.py" 2>/dev/null
sleep 1

# Start SearXNG MCP (Port 3105)
echo "🔍 Starting SearXNG MCP (Port 3105)..."
python3 mcp-tools/searxng/searxng_mcp_tool.py > /tmp/searxng_mcp.log 2>&1 &
echo "   PID: $!"

sleep 2

# Start Qdrant MCP (Port 3106)
echo "🎯 Starting Qdrant MCP (Port 3106)..."
python3 mcp-tools/qdrant/qdrant_mcp_tool.py > /tmp/qdrant_mcp.log 2>&1 &
echo "   PID: $!"

sleep 2

# Start Redis MCP (Port 3107)
echo "💾 Starting Redis MCP (Port 3107)..."
python3 mcp-tools/redis/redis_mcp_tool.py > /tmp/redis_mcp.log 2>&1 &
echo "   PID: $!"

sleep 3

echo ""
echo "Checking MCP Tool Servers..."
for port in 3105 3106 3107; do
    if curl -s http://localhost:$port/mcp -X POST -d '{"tool":"test"}' 2>/dev/null | grep -q "error\|Unknown"; then
        echo "  ✅ Port $port: RESPONDING"
    else
        echo "  ⚠️  Port $port: Check /tmp/*_mcp.log"
    fi
done

echo ""
echo "✅ MCP Tool Servers running!"
echo ""
echo "Test commands:"
echo "  SearXNG: curl -X POST http://localhost:3105/mcp -d '{\"tool\":\"searxng_search\",\"params\":{\"query\":\"open source AI\"}}'"
echo "  Qdrant:  curl -X POST http://localhost:3106/mcp -d '{\"tool\":\"qdrant_get_collection_info\",\"params\":{}}'"
echo "  Redis:   curl -X POST http://localhost:3107/mcp -d '{\"tool\":\"redis_health\",\"params\":{}}'"
