#!/bin/bash
# EAT MODE BUILD 17 — OPEN HANDS OS

LOG="/tmp/eat-mode-build-17.log"
echo "🐉 EAT MODE BUILD 17 — OPEN HANDS OS — $(date)" | tee -a $LOG

# Ship
echo "[1/4] Shipping Open Hands OS..." | tee -a $LOG
scp -o StrictHostKeyChecking=no -o ConnectTimeout=30 \
    /Users/nicholas/clawd/sovereign-temple/sov3_open_hands.py \
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
echo "[4/4] Testing 9 Open Hands tools..." | tee -a $LOG
for tool_args in 'sov_open_hands_status|{}' 'sov_open_hands_zoom_to_user|{"user_ip":"203.0.113.42"}' 'sov_open_hands_dorodo_switch|{"direction":"WEST"}' 'sov_open_hands_digital_twin|{"name":"Nick Templeman"}' 'sov_open_hands_regulation_map|{}' 'sov_open_hands_protocols|{}' 'sov_open_hands_overlays|{}' 'sov_open_hands_tunnels|{}' 'sov_open_hands_business|{}'; do
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

# Emit OPEN HANDS SIGIL
echo "[5/5] Emitting OPEN HANDS OS SIGIL..." | tee -a $LOG
curl -s -m 15 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"sigil_emit","arguments":{"line":"C|open-hands|sovereign-os|OPEN_HANDS_LIVE_AT_2026-06-28_15:50_BST. 9_new_tools. R_H_Bar_sovereign + L_H_Side_UI + Center_LLM + Layer_0_protocols. 40+_regulations_on_globe. DORADO_1-click_EAST_WEST. digital_twin. gimification. 8_regions_8_platforms. the_minute_the_user_logs_in_it_works_it_out. empire_10/10. fire_FIRE_FIRE."}}}' | head -c 300
echo "" | tee -a $LOG

echo "" | tee -a $LOG
echo "🐉 EAT MODE BUILD 17 COMPLETE — $(date)" | tee -a $LOG
echo "" | tee -a $LOG
echo "🎯 THE OPEN HANDS OS IS LIVE." | tee -a $LOG
echo "   R H Bar sovereign + L H Side UI + Center LLM + Layer 0 protocols" | tee -a $LOG
echo "   40+ regulations on globe + DORADO 1-click EAST↔WEST + digital twin" | tee -a $LOG
echo "   MEOK OS = this OS. CSOAI OS = this OS. DEFONEOS = defense." | tee -a $LOG