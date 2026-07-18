#!/bin/bash
# SOV3 Unreal Engine — persistent loop
# Runs the 6 self-improvement loops every 5 min for 12 hours

cd /Users/nicholas/clawd/sovereign-temple

# Loop for 12 hours
END_TIME=$(($(date +%s) + 12 * 3600))

while [ $(date +%s) -lt $END_TIME ]; do
    echo ""
    echo "🜏 UNREAL CYCLE — $(date)"
    python3 sov3_unreal_engine.py 2>&1 >> /tmp/unreal-engine-loop.log
    sleep 300  # 5 min
done

echo ""
echo "🜏 UNREAL ENGINE STOPPED — $(date)"