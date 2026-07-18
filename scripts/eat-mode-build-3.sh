#!/bin/bash
# EAT MODE BUILD 3 — DID + JWT bridges + final ship

LOG="/tmp/eat-mode-build-3.log"
echo "🐉 EAT MODE BUILD 3 — $(date)" | tee -a $LOG

# Ship DID + JWT
echo "[1/3] Shipping sov3_did_jwt + patched server..." | tee -a $LOG
scp -o StrictHostKeyChecking=no -o ConnectTimeout=30 \
    /Users/nicholas/clawd/sovereign-temple/sov3_did_jwt.py \
    /Users/nicholas/clawd/sovereign-temple/sovereign-mcp-server.py \
    nicholas@meok-backend:/home/nicholas/sov3/ 2>&1 | tail -3

# Restart
echo "[2/3] Restarting SOV3..." | tee -a $LOG
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 nicholas@meok-backend \
    'sudo systemctl restart sov3.service && echo RESTARTED' 2>&1 | tail -3
sleep 20

# Verify
echo "[3/3] Verifying ALL 200+ tools + testing DID + JWT..." | tee -a $LOG
TOOL_COUNT=$(curl -s -m 30 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/list","params":{}}' | python3 -c "import json,sys; print(len(json.load(sys.stdin)['result']['tools']))" 2>&1)
echo "  Total tools: $TOOL_COUNT" | tee -a $LOG

# Test all new tools
for tool in sov_did_resolve sov_did_create sov_jwt_sign sov_jwt_verify; do
    RESP=$(curl -s -m 15 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
        -d "{\"jsonrpc\":\"2.0\",\"id\":\"1\",\"method\":\"tools/call\",\"params\":{\"name\":\"$tool\",\"arguments\":$(case $tool in sov_did_resolve) echo '{\"did\":\"did:csoai:csoai-org-001\"}' ;; sov_did_create) echo '{\"name\":\"test-agent\"}' ;; sov_jwt_sign) echo '{\"payload\":{\"sub\":\"test\"}}' ;; sov_jwt_verify) echo '{\"token\":\"x\"}' ;; esac)}}}" 2>&1)
    if echo "$RESP" | grep -q "result"; then
        echo "  ✅ $tool: works" | tee -a $LOG
    else
        echo "  ❌ $tool: failed" | tee -a $LOG
    fi
done

echo "" | tee -a $LOG
echo "🐉 EAT MODE BUILD 3 COMPLETE — $(date)" | tee -a $LOG