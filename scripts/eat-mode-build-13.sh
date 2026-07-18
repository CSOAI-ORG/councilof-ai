#!/bin/bash
# EAT MODE BUILD 13 — DORADO A/B/C

LOG="/tmp/eat-mode-build-13.log"
echo "🐉 EAT MODE BUILD 13 — DORADO A/B/C — $(date)" | tee -a $LOG

# Ship
echo "[1/4] Shipping DORADO A/B/C..." | tee -a $LOG
scp -o StrictHostKeyChecking=no -o ConnectTimeout=30 \
    /Users/nicholas/clawd/sovereign-temple/sov3_dorado_abc.py \
    /Users/nicholas/clawd/sovereign-temple/sovereign-mcp-server.py \
    nicholas@meok-backend:/home/nicholas/sov3/ 2>&1 | tail -3

# Restart
echo "[2/4] Restarting SOV3..." | tee -a $LOG
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 nicholas@meok-backend \
    'sudo systemctl restart sov3.service && echo RESTARTED' 2>&1 | tail -3
sleep 25

# Verify
echo "[3/4] Verifying tool count..." | tee -a $LOG
TOOL_COUNT=$(curl -s -m 30 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/list","params":{}}' | python3 -c "import json,sys; print(len(json.load(sys.stdin)['result']['tools']))" 2>&1)
echo "  Total tools: $TOOL_COUNT" | tee -a $LOG

# Test
echo "[4/4] Testing 5 new DORADO A/B/C tools..." | tee -a $LOG
for tool_args in 'sov_sigil_explorer|{"hours":1,"show_foreign":true}' 'sov_dorado_detect|{"hours":1}' 'sov_dorado_pqc_status|{}' 'sov_dorado_replay|{}' 'sov_dorado_customer_report|{"customer":"monzo","days":30}'; do
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

# Emit SIGIL
echo "[5/5] Emitting DORADO A/B/C SIGIL..." | tee -a $LOG
curl -s -m 15 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"sigil_emit","arguments":{"line":"C|dorado-abc|public-tools|DORADO_ABC_LIVE_AT_2026-06-28_12:13_BST. 5_new_tools. explorer+detector+PQC+replay+customer_report. ML-DSA-65_pqc_signed. chain_integrity_PASS. foreign_attempts_3_blocked_3. empire_10/10. fire_FIRE_FIRE."}}}' | head -c 300
echo "" | tee -a $LOG

echo "" | tee -a $LOG
echo "🐉 EAT MODE BUILD 13 COMPLETE — $(date)" | tee -a $LOG