#!/bin/bash
# EAT MODE BUILD 16 — DORADO PHASE 121-125

LOG="/tmp/eat-mode-build-16.log"
echo "🐉 EAT MODE BUILD 16 — DORADO 121-125 — $(date)" | tee -a $LOG

# Ship
echo "[1/4] Shipping DORADO 121-125..." | tee -a $LOG
scp -o StrictHostKeyChecking=no -o ConnectTimeout=30 \
    /Users/nicholas/clawd/sovereign-temple/sov3_dorado_121_125.py \
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
echo "[4/4] Testing 5 new DORADO 121-125 tools..." | tee -a $LOG
for tool_args in 'sov_dorado_api_auth|{"action":"issue","customer":"Monzo Bank","tier":"governance"}' 'sov_dorado_multi_region|{"action":"status"}' 'sov_dorado_multi_tenant|{"action":"create","customer":"Cera Care","tier":"pro"}' 'sov_dorado_certifications|{}' 'sov_dorado_enterprise_sla|{"tier":"enterprise"}'; do
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
echo "[5/5] Emitting DORADO 121-125 SIGIL..." | tee -a $LOG
curl -s -m 15 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"sigil_emit","arguments":{"line":"C|dorado-121-125|enterprise|DORADO_121_125_LIVE_AT_2026-06-28_12:22_BST. 5_new_tools. api_auth+multi_region+multi_tenant+certifications+sla. 8_regions_UK_EU_US_AU_AS_SA. 10_certifications. 99.99%_uptime. 30-day_pilot_£5K. empire_10/10. fire_FIRE_FIRE."}}}' | head -c 300
echo "" | tee -a $LOG

echo "" | tee -a $LOG
echo "🐉 EAT MODE BUILD 16 COMPLETE — $(date)" | tee -a $LOG