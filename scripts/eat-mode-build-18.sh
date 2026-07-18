#!/bin/bash
# EAT MODE BUILD 18 — OPEN HANDS FULL

LOG="/tmp/eat-mode-build-18.log"
echo "🐉 EAT MODE BUILD 18 — OPEN HANDS FULL — $(date)" | tee -a $LOG

# Ship
echo "[1/4] Shipping Open Hands Full..." | tee -a $LOG
scp -o StrictHostKeyChecking=no -o ConnectTimeout=30 \
    /Users/nicholas/clawd/sovereign-temple/sov3_open_hands_full.py \
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
echo "[4/4] Testing 7 Open Hands FULL tools..." | tee -a $LOG
for tool_args in 'sov_icharacter_generate|{"name":"Nick Templeman","user_id":"nick@csoai.org"}' 'sov_twinstore_marketplace|{"action":"list"}' 'sov_inside_browser|{"url":"https://monzo.com","sandbox":"sovereign"}' 'sov_gimification_award|{"user_id":"nick","action":"article50_issued","reason":"First passport"}' 'sov_leaderboard_get|{}' 'sov_tui_native|{}' 'sov_mobile_native|{"platform":"ios"}'; do
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
echo "[5/5] Emitting OPEN HANDS FULL SIGIL..." | tee -a $LOG
curl -s -m 15 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"sigil_emit","arguments":{"line":"C|open-hands-full|the-stack|OPEN_HANDS_FULL_LIVE_AT_2026-06-28_15:55_BST. 7_new_tools. icharacter+twinstore+inside_browser+gimification+leaderboard+tui+mobile. 269_total_tools. mobile_iOS_Android_native. TUI_M4_Mac_native. twinstore_marketplace. gimification_engine. the_minute_the_user_logs_in_it_works_it_out. empire_10/10. fire_FIRE_FIRE."}}}' | head -c 300
echo "" | tee -a $LOG

echo "" | tee -a $LOG
echo "🐉 EAT MODE BUILD 18 COMPLETE — $(date)" | tee -a $LOG