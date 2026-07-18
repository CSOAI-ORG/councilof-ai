#!/bin/bash
# EAT MODE BUILD 11 — Bleeding-Edge Research

LOG="/tmp/eat-mode-build-11.log"
echo "🐉 EAT MODE BUILD 11 — $(date)" | tee -a $LOG

# Ship Bleeding-Edge
echo "[1/4] Shipping Bleeding-Edge Research..." | tee -a $LOG
scp -o StrictHostKeyChecking=no -o ConnectTimeout=30 \
    /Users/nicholas/clawd/sovereign-temple/sov3_bleeding_edge.py \
    /Users/nicholas/clawd/sovereign-temple/sovereign-mcp-server.py \
    nicholas@meok-backend:/home/nicholas/sov3/ 2>&1 | tail -3

# Restart
echo "[2/4] Restarting SOV3..." | tee -a $LOG
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 nicholas@meok-backend \
    'sudo systemctl restart sov3.service && echo RESTARTED' 2>&1 | tail -3
sleep 25

# Verify
echo "[3/4] Verifying tool count + Bleeding-Edge..." | tee -a $LOG
TOOL_COUNT=$(curl -s -m 30 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/list","params":{}}' | python3 -c "import json,sys; print(len(json.load(sys.stdin)['result']['tools']))" 2>&1)
echo "  Total tools: $TOOL_COUNT" | tee -a $LOG

# Test Bleeding-Edge
echo "[4/4] Testing Bleeding-Edge tools..." | tee -a $LOG
for tool_args in 'sov_bleeding_edge_status|{}' 'sov_bleeding_edge_get|{}' 'sov_bleeding_edge_query|{"category":"New Model Releases"}' 'sov_bleeding_edge_priority|{}' 'sov_bleeding_edge_integration_plan|{}'; do
    tool="${tool_args%%|*}"
    arg="${tool_args#*|}"
    RESP=$(curl -s -m 15 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
        -d "{\"jsonrpc\":\"2.0\",\"id\":\"1\",\"method\":\"tools/call\",\"params\":{\"name\":\"$tool\",\"arguments\":$arg}}" 2>&1)
    if echo "$RESP" | grep -q "result"; then
        echo "  ✅ $tool: works" | tee -a $LOG
    else
        echo "  ❌ $tool: failed" | tee -a $LOG
    fi
done

echo "" | tee -a $LOG
echo "🐉 EAT MODE BUILD 11 COMPLETE — $(date)" | tee -a $LOG