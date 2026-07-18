#!/bin/bash
# SOV3 Coordination Status Report
# Run from any agent to get current coordination state

echo "=============================================="
echo "SOV3 COORDINATION STATUS"
echo "=============================================="
echo ""

cd ~/clawd

# Get dashboard
python3 scripts/enable_coordination.py --status 2>/dev/null

echo ""
echo "=============================================="
echo "SERVICE HEALTH"
echo "=============================================="

# Check services
services=(
    "MEOK_UI:3000"
    "SOV3:3101"
    "MEOK_MCP:3102"
    "MEOK_API:3200"
    "Farm_Vision:8888"
)

for svc in "${services[@]}"; do
    IFS=':' read -r name port <<< "$svc"
    if curl -s "http://127.0.0.1:$port/api/health" > /dev/null 2>&1 || curl -s "http://127.0.0.1:$port/health" > /dev/null 2>&1; then
        echo "✅ $name ($port)"
    else
        echo "❌ $name ($port)"
    fi
done

echo ""
echo "=============================================="
echo "SHARED KNOWLEDGE"
echo "=============================================="

if [ -d ~/.clawdbot/shared-knowledge ]; then
    echo "✅ Shared knowledge: ~/.clawdbot/shared-knowledge/"
    echo "   Handoffs: $(ls ~/.clawdbot/shared-knowledge/handoffs/ 2>/dev/null | wc -l | tr -d ' ') pending"
    echo "   Intel files: $(find ~/.clawdbot/shared-knowledge/intel -name "*.md" 2>/dev/null | wc -l | tr -d ' ')"
else
    echo "❌ Shared knowledge NOT FOUND"
fi

echo ""
echo "=============================================="
echo "Last check: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="
