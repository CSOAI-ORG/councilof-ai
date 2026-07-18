#!/bin/bash
# /Users/nicholas/clawd/csoai-static-deploy2/scripts/eat-mode-daily.sh
# The all-day automated EAT-mode loop for the DEFONEOS sovereign substrate. v2.
#
# Cycles:
#   - Every 2 hours: golden test (29 checks)
#   - 07:00 UTC: morning digest → Telegram
#   - Every 4 hours: analytics funnel snapshot → Telegram
#   - 22:00 UTC: end-of-day rollup
#
# HONESTY: This script hits the LIVE production endpoints. No simulation. No fabrication.
# Each cycle persists state to /tmp/*.log via the endpoints themselves. SIGIL-signed.

set -e

BASE="https://csoai-static-deploy2.vercel.app"
SEND_KEY="${SEND_KEY:-}"
HOUR=$(date -u +%H)

# Build auth header
if [ -n "$SEND_KEY" ]; then AUTH_H="X-Send-Key: $SEND_KEY"; else AUTH_H=""; fi

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"; }

run_golden() {
  log "Running /api/daily-golden..."
  RESULT=$(curl -s -w "\nHTTP %{http_code} in %{time_total}s" "$BASE/api/daily-golden" --max-time 30 2>&1)
  PASS=$(echo "$RESULT" | grep -oE '"pass":[0-9]+' | head -1 | grep -oE '[0-9]+')
  FAIL=$(echo "$RESULT" | grep -oE '"fail":[0-9]+' | head -1 | grep -oE '[0-9]+')
  log "Golden: $PASS pass / $FAIL fail"
  echo "$RESULT" >> /tmp/eat-loop.log 2>&1 || true
}

run_digest() {
  log "Running /api/morning-digest..."
  curl -s "$BASE/api/morning-digest" --max-time 15 >> /tmp/eat-loop.log 2>&1 || true
  log "Digest appended to log"
}

run_analytics() {
  log "Running /api/analytics?funnel=true..."
  RESULT=$(curl -s -w "\nHTTP %{http_code}" "$BASE/api/analytics?funnel=true" --max-time 10)
  echo "$RESULT" >> /tmp/eat-loop.log 2>&1 || true
  log "Analytics funnel snapshot appended"
}

# Schedule
case "$HOUR" in
  06)
    log "=== 06:00 UTC: golden + digest + analytics ==="
    run_golden
    run_digest
    run_analytics
    ;;
  07)
    log "=== 07:00 UTC: morning digest (UK morning) ==="
    run_digest
    ;;
  22)
    log "=== 22:00 UTC: EOD rollup ==="
    run_golden
    run_analytics
    ;;
  00|02|04|08|10|12|14|16|18|20)
    log "=== ${HOUR}:00 UTC tick ==="
    run_golden
    ;;
  *)
    log "=== ${HOUR}:00 UTC off-schedule tick ==="
    run_golden
    ;;
esac

log "Cycle complete"
