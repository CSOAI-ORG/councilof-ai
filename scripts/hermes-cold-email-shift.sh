#!/bin/bash
# hermes-cold-email-shift.sh
# Weekly Monday 7am: take the latest research memo and draft cold emails for every named target.
# Output: ready-to-paste .eml files in revenue/outreach/<date>_<slug>/ for human review.
# NEVER auto-sends.

set -uo pipefail

LOG=/tmp/hermes_cold_email.log
DRAFTER_PY="/Users/nicholas/clawd/sovereign-temple/cold_email_drafter.py"
VENV="/Users/nicholas/clawd/sovereign-temple/.venv/bin/python"

# Source API keys (cron has no env)
if [ -f "$HOME/.zshrc" ]; then
  eval "$(grep -E '^export (STEPFUN|ANTHROPIC|DEEPSEEK|GOOGLE|MISTRAL|XAI|MINIMAX|DASHSCOPE|HUNYUAN|ANTHROPIC_BILLING_OK)' "$HOME/.zshrc" 2>/dev/null || true)"
fi

echo "" >> $LOG
echo "═══════════════════════════════════════════════════════════════" >> $LOG
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cold-email shift starting" >> $LOG

# Sanity
if ! curl -s -m 5 -o /dev/null -w "%{http_code}" http://localhost:3101/health | grep -q "200"; then
  echo "[FAIL] SOV3 council unreachable" >> $LOG
  exit 1
fi
if [ ! -x "$VENV" ] || [ ! -f "$DRAFTER_PY" ]; then
  echo "[FAIL] missing $VENV or $DRAFTER_PY" >> $LOG
  exit 1
fi

RESULT=$("$VENV" "$DRAFTER_PY" --latest-memo 2>>$LOG)
echo "$RESULT" >> $LOG

echo "[$(date '+%H:%M:%S')] Cold-email shift DONE" >> $LOG
exit 0
