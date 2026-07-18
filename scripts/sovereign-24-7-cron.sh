#!/bin/bash
# 🐉 CSOAI Sovereign 24/7 Health Check + Auto-Recovery
# Run every 5 minutes via cron: */5 * * * * /Users/nicholas/clawd/scripts/sovereign-24-7-cron.sh

set -e
TS=$(date +%Y-%m-%dT%H:%M:%S)
LOG=/tmp/sovereign-24-7.log
echo "[$TS] === SOVEREIGN 24/7 HEALTH CHECK START ===" >> $LOG

ok=0
fail=0
fail_list=""

# SOV3 substrate (5 local ports)
for port in 3101 3102 8765 8888 4000; do
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:$port/ 2>&1 || echo "000")
    if [ "$code" = "200" ]; then
        ok=$((ok+1))
        echo "[$TS]  ✓ :$port HTTP $code" >> $LOG
    else
        fail=$((fail+1))
        fail_list="$fail_list :$port"
        echo "[$TS]  ✗ :$port HTTP $code" >> $LOG
    fi
done

# 27 sovereign assets (Vercel)
for path in "" launch.html launch-kit.html pitch.html verify.html command.html post-launch.html striving.html bft-configurator.html vote.html sovereign-mom.html crosswalks.html confirm.html meok-os.html csoai-os.html physical-ai.html finance.html healthcare.html energy.html education.html government.html healthz.html api-v1-spec.html sitemap.xml robots.txt llms.txt agent-card.json; do
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "https://csoai-static-deploy2.vercel.app/${path}" 2>&1 || echo "000")
    if [ "$code" = "200" ]; then
        ok=$((ok+1))
    else
        fail=$((fail+1))
        fail_list="$fail_list /$path"
        echo "[$TS]  ✗ /$path HTTP $code" >> $LOG
    fi
done

echo "[$TS]  TOTAL: $ok OK / $fail FAIL" >> $LOG

# Auto-recovery for SOV3 if down
if ! curl -s --max-time 5 http://localhost:3101/health > /dev/null 2>&1; then
    echo "[$TS]  ⚠️  SOV3 down. Auto-recovering." >> $LOG
    bash /tmp/start_sov3_v3.sh 2>>$LOG || true
    sleep 15
    if curl -s --max-time 5 http://localhost:3101/health > /dev/null 2>&1; then
        echo "[$TS]  ✅ SOV3 recovered after auto-restart." >> $LOG
        curl -s --max-time 5 -X POST http://localhost:3101/mcp -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"sigil_emit\",\"arguments\":{\"line\":\"C|crash-recovery|sov3-auto-restarted|SOV3 auto-restarted by sovereign-24-7-cron at $TS. Recovered in <60s.\"}}}" > /dev/null 2>&1
    fi
fi

# SIGIL emit summary
if [ "$fail" -gt 0 ]; then
    curl -s --max-time 5 -X POST http://localhost:3101/mcp -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"sigil_emit\",\"arguments\":{\"line\":\"C|health-check|$ok OK / $fail FAIL$fail_list at $TS. Sovereign 24/7.\"}}}" > /dev/null 2>&1
else
    curl -s --max-time 5 -X POST http://localhost:3101/mcp -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"sigil_emit\",\"arguments\":{\"line\":\"C|health-check|$ok/32 OK at $TS. Sovereign 24/7. All green.\"}}}" > /dev/null 2>&1
fi

echo "[$TS] === SOVEREIGN 24/7 HEALTH CHECK END ===" >> $LOG
