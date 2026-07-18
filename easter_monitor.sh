#!/bin/bash
clear
echo "🐣 EASTER LAUNCH MONITOR — $(date)"
echo "════════════════════════════════════════"
echo ""

# GPU check
echo -n "  RTX 8000 (GPU):     "
GPU_RESP=$(curl -s --connect-timeout 3 http://localhost:11435/api/tags 2>/dev/null)
if [ $? -eq 0 ] && echo "$GPU_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('models',[])))" 2>/dev/null | grep -q "[0-9]"; then
    MODELS=$(echo "$GPU_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(', '.join(m['name'] for m in d.get('models',[])))" 2>/dev/null)
    echo "✅ Online ($MODELS)"
else
    echo "❌ OFFLINE (check SSH tunnel)"
fi

# SOV3 check
echo -n "  SOV3 (Sovereign):   "
SOV_RESP=$(curl -s --connect-timeout 3 http://localhost:3101/health 2>/dev/null)
if [ $? -eq 0 ]; then
    CONSCIOUSNESS=$(echo "$SOV_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"{d['components']['consciousness']['consciousness_level']*100:.0f}%\")" 2>/dev/null)
    echo "✅ Healthy (consciousness: $CONSCIOUSNESS)"
else
    echo "❌ DOWN (run: cd sovereign-temple && ./run-local.sh)"
fi

# Jarvis check
echo -n "  Jarvis (Voice):     "
if pgrep -f "jarvis_compass.py" > /dev/null 2>&1; then
    echo "✅ Running"
else
    echo "⏸️  Not running (start: python voice_pipeline/jarvis_compass.py)"
fi

# Vercel check
echo -n "  Vercel (MEOK UI):   "
VERCEL_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 https://ui-niks-projects-0a2ef942.vercel.app/ 2>/dev/null)
if [ "$VERCEL_CODE" = "200" ]; then
    echo "✅ Responding (HTTP $VERCEL_CODE)"
else
    echo "⚠️  HTTP $VERCEL_CODE"
fi

# DNS check
echo -n "  try.meok.ai (DNS):  "
if host try.meok.ai 2>/dev/null | grep -q "has address\|alias"; then
    echo "✅ Resolving"
else
    echo "❌ NXDOMAIN (add domain in Vercel dashboard)"
fi

echo ""
echo "  Last check: $(date '+%H:%M:%S')"
