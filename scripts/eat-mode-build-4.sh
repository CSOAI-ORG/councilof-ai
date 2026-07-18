#!/bin/bash
# EAT MODE BUILD 4 — final wire DID+JWT, verify 200 tools

LOG="/tmp/eat-mode-build-4.log"
echo "🐉 EAT MODE BUILD 4 — $(date)" | tee -a $LOG

# Ship DID + JWT + new investor deck
echo "[1/5] Shipping sov3_did_jwt + patched server..." | tee -a $LOG
scp -o StrictHostKeyChecking=no -o ConnectTimeout=30 \
    /Users/nicholas/clawd/sovereign-temple/sov3_did_jwt.py \
    /Users/nicholas/clawd/sovereign-temple/sovereign-mcp-server.py \
    /Users/nicholas/clawd/sovereign-temple/sov3_strive_harness.py \
    nicholas@meok-backend:/home/nicholas/sov3/ 2>&1 | tail -3

# Restart
echo "[2/5] Restarting SOV3..." | tee -a $LOG
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 nicholas@meok-backend \
    'sudo systemctl restart sov3.service && echo RESTARTED' 2>&1 | tail -3
sleep 20

# Verify
echo "[3/5] Verifying tool count + DID/JWT..." | tee -a $LOG
TOOL_COUNT=$(curl -s -m 30 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/list","params":{}}' | python3 -c "import json,sys; print(len(json.load(sys.stdin)['result']['tools']))" 2>&1)
echo "  Total tools: $TOOL_COUNT" | tee -a $LOG

# Test DID + JWT
echo "[4/5] Testing 4 DID+JWT tools..." | tee -a $LOG
for tool_call in 'sov_did_resolve|did:csoai:csoai-org-001' 'sov_did_create|test-agent' 'sov_jwt_sign|sub-agent-001'; do
    tool="${tool_call%%|*}"
    arg="${tool_call#*|}"
    RESP=$(curl -s -m 15 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
        -d "{\"jsonrpc\":\"2.0\",\"id\":\"1\",\"method\":\"tools/call\",\"params\":{\"name\":\"$tool\",\"arguments\":{\"did\":\"$arg\",\"name\":\"$arg\",\"payload\":{\"sub\":\"test\"}}}}" 2>&1)
    if echo "$RESP" | grep -q "result"; then
        echo "  ✅ $tool: works" | tee -a $LOG
    else
        echo "  ❌ $tool: failed — $RESP" | tee -a $LOG
    fi
done

# Run striving harness
echo "[5/5] Running striving harness..." | tee -a $LOG
python3 /Users/nicholas/clawd/sovereign-temple/sov3_strive_harness.py 2>&1 | head -10 | tee -a $LOG

echo "" | tee -a $LOG
echo "🐉 EAT MODE BUILD 4 COMPLETE — $(date)" | tee -a $LOG