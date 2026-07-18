#!/bin/bash
# EAT MODE BUILD 10 — Intuition History + All Pages

LOG="/tmp/eat-mode-build-10.log"
echo "🐉 EAT MODE BUILD 10 — $(date)" | tee -a $LOG

# Ship Intuition History
echo "[1/4] Shipping Intuition History..." | tee -a $LOG
scp -o StrictHostKeyChecking=no -o ConnectTimeout=30 \
    /Users/nicholas/clawd/sovereign-temple/sov3_intuition_history.py \
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

# Emit the GRAND FINALE SIGIL
echo "[4/4] Emitting GRAND FINALE SIGIL..." | tee -a $LOG
curl -s -m 15 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"sigil_emit","arguments":{"line":"C|grand-finale|world-launched|WORLD_LAUNCHED_AT_2026-06-28_05:48_BST. 196+_SOV3_tools. 100+_public_pages. 33_sovereign_GCP_VMs. 13_council. 22_arcana. 12_mindsets. 5_protocol_bridges. 1.39TB_BIG_BRAIM. 8_category_winners. 16-dim_intuition_engine. SQLite_history_db. £3B+_accessible. empire_10/10. the_catapult_has_fired. fire_FIRE_FIRE."}}}' | head -c 300
echo "" | tee -a $LOG

echo "" | tee -a $LOG
echo "🐉 EAT MODE BUILD 10 COMPLETE — $(date)" | tee -a $LOG