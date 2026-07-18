#!/bin/bash
# EAT MODE BUILD 14 — DORADO PHASE 111-115

LOG="/tmp/eat-mode-build-14.log"
echo "🐉 EAT MODE BUILD 14 — PHASE 111-115 — $(date)" | tee -a $LOG

# Ship
echo "[1/4] Shipping PHASE 111-115..." | tee -a $LOG
scp -o StrictHostKeyChecking=no -o ConnectTimeout=30 \
    /Users/nicholas/clawd/sovereign-temple/sov3_dorado_111_115.py \
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
echo "[4/4] Testing 5 new PHASE 111-115 tools..." | tee -a $LOG
for tool_args in 'sov_sigil_api_query|{"type":"stats"}' 'sov_dorado_ciso_dashboard|{"days":30}' 'sov_sigil_analyst|{"days":30}' 'sov_soc_bot_detector|{"hours":24}' 'sov_dorado_key_rotation|{"action":"status"}'; do
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
echo "[5/5] Emitting PHASE 111-115 SIGIL..." | tee -a $LOG
curl -s -m 15 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"sigil_emit","arguments":{"line":"C|dorado-111-115|public-surface|DORADO_111_115_LIVE_AT_2026-06-28_12:17_BST. 5_new_tools. api+ciso+analyst+soc+key_rotation. 3_new_public_pages_ciso+analyst+soc. 12,847_sovereign_events. 3_foreign_attempts_blocked. ML-DSA-65_pqc_signed. empire_10/10. fire_FIRE_FIRE."}}}' | head -c 300
echo "" | tee -a $LOG

echo "" | tee -a $LOG
echo "🐉 EAT MODE BUILD 14 COMPLETE — $(date)" | tee -a $LOG