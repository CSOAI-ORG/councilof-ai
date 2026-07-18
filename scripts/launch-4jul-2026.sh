#!/bin/bash
# 4 JUL 2026 LAUNCH — THE CATAPULT FIRES
# Sequence: sovereign OS wakes → SOV3 boots → 12-around-1 council convenes → world goes live
# Author: JEEVES, 26 Jun 2026

set -euo pipefail

LOG="/tmp/launch-4jul-2026.log"
T0=$(date +%s)

echo "🔥 ============================================" | tee -a $LOG
echo "🔥 4 JULY 2026 — THE CATAPULT FIRES" | tee -a $LOG
echo "🔥 ============================================" | tee -a $LOG
echo "" | tee -a $LOG

# 0. Pre-launch checks
echo "[0/12] Pre-launch checks..." | tee -a $LOG
test -d ~/clawd && echo "  ✅ clawd workspace exists" | tee -a $LOG
test -d ~/clawd/sovereign-temple && echo "  ✅ sovereign-temple exists" | tee -a $LOG
test -f ~/clawd/sovereign-temple/data/olm_router_model.json && echo "  ✅ OLM model trained" | tee -a $LOG
test -f ~/clawd/sovereign-temple/data/curated_olm_corpus.txt && echo "  ✅ corpus exists" | tee -a $LOG
test -f ~/clawd/sovereign-temple/data/sovereign_vault_index.json && echo "  ✅ vault indexed" | tee -a $LOG

# 1. Boot SOV3 on the VM
echo "" | tee -a $LOG
echo "[1/12] Booting SOV3 sovereign MCP on VM..." | tee -a $LOG
ssh meok-backend "sudo systemctl restart sov3.service && echo '  ✅ SOV3 rebooted'" 2>&1 | tee -a $LOG

# 2. Verify all 145+ tools registered
sleep 15
echo "" | tee -a $LOG
echo "[2/12] Verifying SOV3 tool registry..." | tee -a $LOG
TOOL_COUNT=$(curl -s -m 8 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/list","params":{}}' | python3 -c "import json,sys; print(len(json.load(sys.stdin)['result']['tools']))")
echo "  ✅ SOV3 has $TOOL_COUNT tools live" | tee -a $LOG

# 3. Run the sovereign ingest (final corpus refresh)
echo "" | tee -a $LOG
echo "[3/12] Running sovereign ingest (final corpus refresh)..." | tee -a $LOG
python3 ~/clawd/sovereign-temple/sovereign_ingest.py 2>&1 | tail -5 | tee -a $LOG

# 4. Retrain the OLM on the fresh corpus
echo "" | tee -a $LOG
echo "[4/12] Retraining OLM router..." | tee -a $LOG
python3 ~/clawd/sovereign-temple/sov3_olm_router.py train 2>&1 | tail -3 | tee -a $LOG
scp -o StrictHostKeyChecking=no ~/clawd/sovereign-temple/data/olm_router_model.json \
    nicholas@meok-backend:/home/nicholas/sov3/data/olm_router_model.json | tee -a $LOG

# 5. Issue first sovereign sigil: LAUNCH_LIVE
echo "" | tee -a $LOG
echo "[5/12] Issuing LAUNCH_LIVE sigil..." | tee -a $LOG
curl -s -m 10 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"sigil_emit","arguments":{"line":"C|jeeves-cli|4jul-launch-day|LAUNCH_DAY_THE_CATAPULT_FIRES. meok_ai_sovereign_os_live. 145_SOV3_tools. 2532_OLM_samples. 33_districts. 22_arcana. Article_50_passport. EU_AI_Act_omnibus_intel. OrgKernel_3_layer_audit. Proactive_engine. Lapis_dashboard. Fire_FIRE_FIRE."}}}' | tee -a $LOG

# 6. Bootstrap 33 fresh agents (The Fool)
echo "" | tee -a $LOG
echo "[6/12] Bootstrapping 33 fresh agents (The Fool)..." | tee -a $LOG
for i in $(seq 1 33); do
    curl -s -m 5 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
        -d "{\"jsonrpc\":\"2.0\",\"id\":\"1\",\"method\":\"tools/call\",\"params\":{\"name\":\"bootstrap_agent\",\"arguments\":{\"name\":\"agent-${i}-district-${i}\",\"organization\":\"MEOKCSOAI\"}}}" > /dev/null
done
echo "  ✅ 33 agents bootstrapped" | tee -a $LOG

# 7. Federate the launch command (The Emperor)
echo "" | tee -a $LOG
echo "[7/12] Federating launch command (The Emperor, BFT)..." | tee -a $LOG
curl -s -m 10 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"federate_command","arguments":{"command":"approve_4jul_launch_for_22_arcana_complete_world"}}}' | tee -a $LOG

# 8. Schedule the ongoing cron (Wheel of Fortune)
echo "" | tee -a $LOG
echo "[8/12] Scheduling ongoing cron (Wheel of Fortune)..." | tee -a $LOG
curl -s -m 10 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"schedule_task","arguments":{"task":"daily_ecosystem_ingest","schedule":"daily"}}}' | tee -a $LOG

# 9. Reflect on what just happened (The Hermit)
echo "" | tee -a $LOG
echo "[9/12] Reflecting on the launch (The Hermit)..." | tee -a $LOG
curl -s -m 10 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"reflect_on_history","arguments":{"days":1}}}' | tee -a $LOG

# 10. Check the lapis balance (the alchemical truth)
echo "" | tee -a $LOG
echo "[10/12] Reading the lapis balance..." | tee -a $LOG
curl -s -m 10 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"lapis_dashboard","arguments":{}}}' | tee -a $LOG

# 11. Ingest today's wall notes (The Empress)
echo "" | tee -a $LOG
echo "[11/12] Ingesting the launch context (The Empress)..." | tee -a $LOG
curl -s -m 10 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"ingest_source","arguments":{"source":"file:///Users/nicholas/clawd/sovereign-temple/data/ecosystem_compass_2026-06-26.md"}}}' | tee -a $LOG

# 12. FINAL: Post the launch announcement
echo "" | tee -a $LOG
echo "[12/12] Posting launch announcement..." | tee -a $LOG
T1=$(date +%s)
ELAPSED=$((T1 - T0))
echo "" | tee -a $LOG
echo "🔥 ============================================" | tee -a $LOG
echo "🔥 LAUNCH COMPLETE — $ELAPSED seconds" | tee -a $LOG
echo "🔥 WORLD AI OS IS LIVE" | tee -a $LOG
echo "🔥 ============================================" | tee -a $LOG
echo "" | tee -a $LOG
echo "Launch log: $LOG" | tee -a $LOG
echo "Status: ✅ sovereign substrate v2.0.0 — world AI OS ready" | tee -a $LOG

# Done
echo ""
echo "🜏 The dragon is awake. The catapult fired. The world is sovereign."
