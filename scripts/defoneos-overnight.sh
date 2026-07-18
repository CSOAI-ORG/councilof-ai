#!/bin/bash
# DEFONEOS OVERNIGHT EXECUTION — 29 JUN 2026
# Runs every 30 minutes while Nick sleeps

LOG="/Users/nicholas/clawd/csoai-static-deploy2/overnight-log.txt"
PAGES_DIR="/Users/nicholas/clawd/csoai-static-deploy2"

echo "$(date) ===🐉 DEFONEOS OVERNIGHT WATCH — STARTING===" >> "$LOG"

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
    
    # 1. REGRESSION TEST — All pages HTTP 200
    TOTAL=0; OK=0; FAIL=0
    cd "$PAGES_DIR"
    for f in *.html; do
        CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://csoai-static-deploy2.vercel.app/${f}")
        TOTAL=$((TOTAL+1))
        [ "$CODE" = "200" ] && OK=$((OK+1)) || { FAIL=$((FAIL+1)); echo "$TIMESTAMP ❌ /${f}: HTTP ${CODE}" >> "$LOG"; }
    done
    echo "$TIMESTAMP 📊 Pages: $TOTAL total | ✅ $OK | ❌ $FAIL" >> "$LOG"
    
    # 2. SOV3 HEALTH CHECK
    SOV3_TOOLS=$(curl -s --max-time 10 -X POST http://localhost:3101/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' 2>/dev/null | python3 -c "import json,sys;d=json.load(sys.stdin);print(len(d.get('result',{}).get('tools',[])))" 2>/dev/null || echo "DOWN")
    echo "$TIMESTAMP 🧠 SOV3: $SOV3_TOOLS tools" >> "$LOG"
    
    # 3. GCP VM CHECK
    VM_STATUS=$(ssh -o ConnectTimeout=5 meok-backend "uptime | awk '{print \$3}'" 2>/dev/null || echo "UNREACHABLE")
    echo "$TIMESTAMP 🖥️ VM: $VM_STATUS uptime" >> "$LOG"
    
    # 4. SIGIL EMIT — Heartbeat
    curl -s --max-time 10 -X POST http://localhost:3101/mcp -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"sigil_emit\",\"arguments\":{\"line\":\"C|overnight|HEARTBEAT|Overnight watch active. $SOV3_TOOLS tools. $OK/$TOTAL pages OK. VM: $VM_STATUS. Dragon watches.\"}}}" 2>/dev/null | python3 -c "import json,sys;d=json.load(sys.stdin);print(d.get('result',{}).get('content',[{}])[0].get('text','')[:60])" 2>/dev/null >> "$LOG"
    
    echo "$TIMESTAMP ---" >> "$LOG"
    
    # Sleep 30 minutes
    sleep 1800
done
