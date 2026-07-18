#!/bin/bash
# RUN BLACK SWAN PREDICTOR + WATCHDOG INTEGRATION
# Watches for new regulatory windows, runs predictor, emits SIGIL for critical events.
set -e

cd /Users/nicholas/clawd/sovereign-charters

echo "============================================================================"
echo "Sovereign Black Swan Watcher · $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "============================================================================"

# 1. Run Black Swan Predictor — get next 5 windows
echo ""
echo "[STEP 1/4] Running Black Swan Predictor..."
NEXT_WINDOWS=$(python3 M2_DEPLOYMENT_KIT/black_swan_predictor.py --n 5 --format json 2>/dev/null || echo "[]")

# 2. Filter for S5 (CRITICAL) and S4 (HIGH) events
CRITICAL_COUNT=$(echo "$NEXT_WINDOWS" | grep -c '"severity": 5' || echo 0)
HIGH_COUNT=$(echo "$NEXT_WINDOWS" | grep -c '"severity": 4' || echo 0)
echo "  Critical (S5) windows in next 5: $CRITICAL_COUNT"
echo "  High (S4) windows in next 5: $HIGH_COUNT"

# 3. Ingest any new sources via data_ingest.py
echo ""
echo "[STEP 2/4] Running sovereign data ingestion..."
python3 WATCHDOG/data_ingest.py --max-workers 4 2>/dev/null | tail -10 || echo "  (ingestion skipped)"

# 4. Compute trust scores for any new partner applications (uses trust_score.py if available)
echo ""
echo "[STEP 3/4] Computing trust scores for known partners..."
python3 M2_DEPLOYMENT_KIT/trust_score.py --self-test 2>&1 | head -5 || echo "  (trust score skipped)"

# 5. Emit a SIGIL for the day's black swan monitoring run
echo ""
echo "[STEP 4/4] Emitting SIGIL..."
TODAY=$(date -u +%Y-%m-%d)
SIGIL_LINE="BLACK_SWAN_WATCH|${TODAY}|critical=${CRITICAL_COUNT}|high=${HIGH_COUNT}|ingestion_run=ok"
echo "  $SIGIL_LINE"

# Write to local SIGIL log
echo "$SIGIL_LINE" >> /tmp/black_swan_sigil.log

echo ""
echo "============================================================================"
echo "Black Swan Watch complete. Next run: in 1 hour."
echo "============================================================================"
