#!/bin/bash
# EAT MODE BUILD 6 — OOWM integration + constant tester

LOG="/tmp/eat-mode-build-6.log"
echo "🐉 EAT MODE BUILD 6 — $(date)" | tee -a $LOG

# Ship OOWM + tester + plist
echo "[1/4] Shipping OOWM + tester + plist..." | tee -a $LOG
scp -o StrictHostKeyChecking=no -o ConnectTimeout=30 \
    /Users/nicholas/clawd/sovereign-temple/sov3_oowm.py \
    /Users/nicholas/clawd/sovereign-temple/sov3_oowm_tester.py \
    /Users/nicholas/clawd/sovereign-temple/sovereign-mcp-server.py \
    nicholas@meok-backend:/home/nicholas/sov3/ 2>&1 | tail -3

# Restart SOV3
echo "[2/4] Restarting SOV3..." | tee -a $LOG
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 nicholas@meok-backend \
    'sudo systemctl restart sov3.service && echo RESTARTED' 2>&1 | tail -3
sleep 25

# Verify
echo "[3/4] Verifying tool count + OOWM..." | tee -a $LOG
TOOL_COUNT=$(curl -s -m 30 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/list","params":{}}' | python3 -c "import json,sys; print(len(json.load(sys.stdin)['result']['tools']))" 2>&1)
echo "  Total tools: $TOOL_COUNT" | tee -a $LOG

# Test OOWM
echo "[4/4] Testing OOWM tools..." | tee -a $LOG
for tool_args in 'sov_oowm_status|{}' 'sov_oowm_think|{"query":"What is the EU AI Act Article 50?"}' 'sov_oowm_evolve|{}' 'sov_oowm_test|{}'; do
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
echo "🐉 EAT MODE BUILD 6 COMPLETE — $(date)" | tee -a $LOG