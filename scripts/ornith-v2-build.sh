#!/bin/bash
# EAT MODE BUILD ORNITH v2 — benchmark table + methodology

LOG="/tmp/ornith-v2-build.log"
echo "🦜 ORNITH v2 — BENCHMARK TABLE + METHODOLOGY — $(date)" | tee -a $LOG

# Ship
echo "[1/3] Shipping SOV3 Ornith v2..." | tee -a $LOG
scp -o StrictHostKeyChecking=no -o ConnectTimeout=30 \
    /Users/nicholas/clawd/sovereign-temple/sov3_ornith_v2.py \
    /Users/nicholas/clawd/sovereign-temple/sovereign-mcp-server.py \
    nicholas@meok-backend:/home/nicholas/sov3/ 2>&1 | tail -3

# Restart
echo "[2/3] Restarting SOV3..." | tee -a $LOG
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 nicholas@meok-backend \
    'sudo systemctl restart sov3.service && echo RESTARTED' 2>&1 | tail -3
sleep 25

# Verify
echo "[3/3] Verifying tool count..." | tee -a $LOG
TOOL_COUNT=$(curl -s -m 30 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/list","params":{}}' | python3 -c "import json,sys; print(len(json.load(sys.stdin)['result']['tools']))" 2>&1)
echo "  Total tools: $TOOL_COUNT" | tee -a $LOG

echo "" | tee -a $LOG
echo "🦜 ORNITH v2 BUILD COMPLETE — $(date)" | tee -a $LOG