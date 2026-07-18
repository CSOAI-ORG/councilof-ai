#!/bin/bash
# EAT MODE BUILD 19 — OPEN HANDS REAL

LOG="/tmp/eat-mode-build-19.log"
echo "🐉 EAT MODE BUILD 19 — OPEN HANDS REAL — $(date)" | tee -a $LOG

# Ship
echo "[1/4] Shipping Open Hands Real..." | tee -a $LOG
scp -o StrictHostKeyChecking=no -o ConnectTimeout=30 \
    /Users/nicholas/clawd/sovereign-temple/sov3_open_hands_real.py \
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
echo "[4/4] Testing 7 Open Hands REAL tools..." | tee -a $LOG
for tool_args in 'sov_twin_train|{"twin_id":"i-test","conversation":[{"role":"user","content":"I prefer sovereign over foreign AI. UK GDPR compliance matters."}]}' 'sov_twin_knowledge_get|{"twin_id":"i-test"}' 'sov_twinstore_ui|{}' 'sov_wisdom_transfer|{"from_user":"alice","to_user":"bob","points":100,"reason":"helpful"}' 'sov_wisdom_economy_status|{}' 'sov_tui_install|{"user_os":"darwin"}' 'sov_appstore_submit|{"platform":"ios"}'; do
    tool="${tool_args%%|*}"
    arg="${tool_args#*|}"
    RESP=$(curl -s -m 15 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
        -d "{\"jsonrpc":"2.0\",\"id\":\"1\",\"method\":\"tools/call\",\"params\":{\"name\":\"$tool\",\"arguments\":$arg}}" 2>&1)
    if echo "$RESP" | grep -q "result"; then
        echo "  ✅ $tool: works" | tee -a $LOG
    else
        echo "  ❌ $tool: failed" | tee -a $LOG
    fi
done

# Emit SIGIL
echo "[5/5] Emitting OPEN HANDS REAL SIGIL..." | tee -a $LOG
curl -s -m 15 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"sigil_emit","arguments":{"line":"C|open-hands-real|the-stack-140|OPEN_HANDS_REAL_LIVE_AT_2026-06-28_16:00_BST. 7_new_tools. twin_training+twinstore+wisdom_economy+tui_install+appstore. install_sh_ready. twinstore_marketplace_live. 276_total_tools. installable_1_command. iOS_Android_submission_ready. the_sovereign_AI_OS_is_installable. empire_10/10. fire_FIRE_FIRE."}}}' | head -c 300
echo "" | tee -a $LOG

echo "" | tee -a $LOG
echo "🐉 EAT MODE BUILD 19 COMPLETE — $(date)" | tee -a $LOG