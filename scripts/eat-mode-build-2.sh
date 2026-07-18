#!/bin/bash
# EAT MODE BUILD 2 — ship A2A + x402 + verify 196 tools

LOG="/tmp/eat-mode-build-2.log"
echo "🐉 EAT MODE BUILD 2 — $(date)" | tee -a $LOG

# Ship the new modules
echo "[1/4] Shipping sov3_a2a + sov3_x402 + patched server..." | tee -a $LOG
scp -o StrictHostKeyChecking=no -o ConnectTimeout=30 \
    /Users/nicholas/clawd/sovereign-temple/sov3_a2a.py \
    /Users/nicholas/clawd/sovereign-temple/sov3_x402.py \
    /Users/nicholas/clawd/sovereign-temple/sovereign-mcp-server.py \
    nicholas@meok-backend:/home/nicholas/sov3/ 2>&1 | tail -3

# Restart
echo "[2/4] Restarting SOV3..." | tee -a $LOG
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 nicholas@meok-backend \
    'sudo systemctl restart sov3.service && echo RESTARTED' 2>&1 | tail -3
sleep 20

# Verify
echo "[3/4] Verifying tool count..." | tee -a $LOG
TOOL_COUNT=$(curl -s -m 30 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/list","params":{}}' | python3 -c "import json,sys; print(len(json.load(sys.stdin)['result']['tools']))" 2>&1)
echo "  Total tools: $TOOL_COUNT" | tee -a $LOG

# Test A2A + x402
echo "[4/4] Testing 8 new tools (A2A + x402)..." | tee -a $LOG
for tool in sov_a2a_agent_card sov_a2a_task_list sov_x402_invoice sov_x402_status; do
    RESP=$(curl -s -m 15 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
        -d "{\"jsonrpc\":\"2.0\",\"id\":\"1\",\"method\":\"tools/call\",\"params\":{\"name\":\"$tool\",\"arguments\":{}}}" 2>&1)
    if echo "$RESP" | grep -q "result"; then
        echo "  ✅ $tool: works" | tee -a $LOG
    else
        echo "  ❌ $tool: failed" | tee -a $LOG
    fi
done

# Test the x402 flow end-to-end
echo "[5/4] x402 end-to-end test (create + pay + verify)..." | tee -a $LOG
INVOICE=$(curl -s -m 15 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"sov_x402_invoice","arguments":{"service":"article50_passport","tier":"pro","quantity":1,"customer":"monzo@test.com"}}}' 2>&1)
INVOICE_ID=$(echo "$INVOICE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(json.loads(d['result']['content'][0]['text']).get('id',''))" 2>&1)
echo "  Invoice: $INVOICE_ID" | tee -a $LOG
if [ -n "$INVOICE_ID" ]; then
    PAY=$(curl -s -m 15 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
        -d "{\"jsonrpc\":\"2.0\",\"id\":\"1\",\"method\":\"tools/call\",\"params\":{\"name\":\"sov_x402_pay\",\"arguments\":{\"invoice_id\":\"$INVOICE_ID\",\"payment_method\":\"stripe\"}}}" 2>&1)
    PAY_STATUS=$(echo "$PAY" | python3 -c "import json,sys; d=json.load(sys.stdin); print(json.loads(d['result']['content'][0]['text'])['invoice']['status'])" 2>&1)
    echo "  Paid: $PAY_STATUS" | tee -a $LOG
fi

echo "" | tee -a $LOG
echo "🐉 EAT MODE BUILD 2 COMPLETE — $(date)" | tee -a $LOG