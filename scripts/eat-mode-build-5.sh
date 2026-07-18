#!/bin/bash
# EAT MODE BUILD 5 — overnight + unreal + right brain

LOG="/tmp/eat-mode-build-5.log"
echo "🐉 EAT MODE BUILD 5 — $(date)" | tee -a $LOG

# Ship overnight + unreal + right brain
echo "[1/4] Shipping overnight + unreal + right brain..." | tee -a $LOG
scp -o StrictHostKeyChecking=no -o ConnectTimeout=30 \
    /Users/nicholas/clawd/sovereign-temple/sov3_overnight_sprint.py \
    /Users/nicholas/clawd/sovereign-temple/sov3_unreal_engine.py \
    /Users/nicholas/clawd/sovereign-temple/sov3_right_brain.py \
    /Users/nicholas/clawd/sovereign-temple/sovereign-mcp-server.py \
    nicholas@meok-backend:/home/nicholas/sov3/ 2>&1 | tail -3

# Restart
echo "[2/4] Restarting SOV3..." | tee -a $LOG
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 nicholas@meok-backend \
    'sudo systemctl restart sov3.service && echo RESTARTED' 2>&1 | tail -3
sleep 20

# Verify
echo "[3/4] Verifying tool count + Right Brain..." | tee -a $LOG
TOOL_COUNT=$(curl -s -m 30 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/list","params":{}}' | python3 -c "import json,sys; print(len(json.load(sys.stdin)['result']['tools']))" 2>&1)
echo "  Total tools: $TOOL_COUNT" | tee -a $LOG

# Test Right Brain
echo "[4/4] Testing Right Brain tools (iOK Farm)..." | tee -a $LOG
for tool in sov_right_brain_observe sov_right_brain_describe sov_right_brain_fusion sov_right_brain_presence; do
    RESP=$(curl -s -m 15 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
        -d "{\"jsonrpc\":\"2.0\",\"id\":\"1\",\"method\":\"tools/call\",\"params\":{\"name\":\"$tool\",\"arguments\":{}}}" 2>&1)
    if echo "$RESP" | grep -q "result"; then
        echo "  ✅ $tool: works" | tee -a $LOG
    else
        echo "  ❌ $tool: failed" | tee -a $LOG
    fi
done

echo "" | tee -a $LOG
echo "🐉 EAT MODE BUILD 5 COMPLETE — $(date)" | tee -a $LOG