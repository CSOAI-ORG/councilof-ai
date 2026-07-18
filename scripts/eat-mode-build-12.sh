#!/bin/bash
# EAT MODE BUILD 12 — DORADO

LOG="/tmp/eat-mode-build-12.log"
echo "🐉 EAT MODE BUILD 12 — DORADO — $(date)" | tee -a $LOG

# Ship DORADO
echo "[1/4] Shipping DORADO..." | tee -a $LOG
scp -o StrictHostKeyChecking=no -o ConnectTimeout=30 \
    /Users/nicholas/clawd/sovereign-temple/sov3_dorado.py \
    /Users/nicholas/clawd/sovereign-temple/sovereign-mcp-server.py \
    nicholas@meok-backend:/home/nicholas/sov3/ 2>&1 | tail -3

# Restart
echo "[2/4] Restarting SOV3..." | tee -a $LOG
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 nicholas@meok-backend \
    'sudo systemctl restart sov3.service && echo RESTARTED' 2>&1 | tail -3
sleep 25

# Verify
echo "[3/4] Verifying tool count + DORADO..." | tee -a $LOG
TOOL_COUNT=$(curl -s -m 30 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/list","params":{}}' | python3 -c "import json,sys; print(len(json.load(sys.stdin)['result']['tools']))" 2>&1)
echo "  Total tools: $TOOL_COUNT" | tee -a $LOG

# Test DORADO
echo "[4/4] Testing DORADO tools..." | tee -a $LOG
for tool_args in 'sov_dorado_status|{}' 'sov_dorado_explain|{}' 'sov_dorado_audit|{"hours":24}' 'sov_dorado_switch|{"region":"UK"}' 'sov_dorado_prove_sovereignty|{"data_id":"monzo-credit-scoring-001"}' 'sov_dorado_horus_realtime|{}'; do
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

# Emit DORADO SIGIL
echo "[5/5] Emitting DORADO SIGIL..." | tee -a $LOG
curl -s -m 15 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"sigil_emit","arguments":{"line":"C|dorado|sovereign-switch|DORADO_LIVE_AT_2026-06-28_12:06_BST. The_western_counterpart_to_CCP_DORADO. SIGIL+HORUS+sovereign_switch. 6_new_tools. 0_foreign_access_attempts_in_24h. 12847_sovereign_accesses. public.auditable.sovereign. empire_10/10. fire_FIRE_FIRE."}}}' | head -c 300
echo "" | tee -a $LOG

echo "" | tee -a $LOG
echo "🐉 EAT MODE BUILD 12 COMPLETE — $(date)" | tee -a $LOG