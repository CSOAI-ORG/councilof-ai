#!/bin/bash
# Start CouncilOf MCP Server
# Port: 3103

cd /Users/nicholas/clawd/council-of-mcps/councilof

echo "🚀 Starting CouncilOf MCP Server (Port 3103)..."
echo "33-node Byzantine Fault Tolerant council"
echo ""

python3 councilof_mcp_server.py &

sleep 2

echo "✅ CouncilOf MCP running on port 3103"
echo "   - 13 SOV3 agents"
echo "   - 6 Neural models"
echo "   - 8 MCP tools"
echo "   - 1 Human proxy (Nick)"
echo "   - 5 External council"
echo ""
echo "Test with: curl -X POST http://localhost:3103/mcp -d '{\"tool\":\"councilof_vote\",\"params\":{\"description\":\"test\",\"severity\":\"routine\"}}'"