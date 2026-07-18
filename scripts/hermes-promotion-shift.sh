#!/bin/bash
# hermes-promotion-shift.sh
# Wed + Sun 9am: take the latest research memo / content piece and produce
# 9 platform-native promotion drafts ready for human paste.

set -uo pipefail

LOG=/tmp/hermes_promotion.log
ENGINE_PY="/Users/nicholas/clawd/sovereign-temple/promotion_engine.py"
VENV="/Users/nicholas/clawd/sovereign-temple/.venv/bin/python"

if [ -f "$HOME/.zshrc" ]; then
  eval "$(grep -E '^export (STEPFUN|ANTHROPIC|DEEPSEEK|GOOGLE|MISTRAL|XAI|MINIMAX|DASHSCOPE|HUNYUAN|ANTHROPIC_BILLING_OK)' "$HOME/.zshrc" 2>/dev/null || true)"
fi

echo "" >> $LOG
echo "═══════════════════════════════════════════════════════════════" >> $LOG
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Promotion shift starting" >> $LOG

if ! curl -s -m 5 -o /dev/null -w "%{http_code}" http://localhost:3101/health | grep -q "200"; then
  echo "[FAIL] SOV3 council unreachable" >> $LOG
  exit 1
fi
if [ ! -x "$VENV" ] || [ ! -f "$ENGINE_PY" ]; then
  echo "[FAIL] missing $VENV or $ENGINE_PY" >> $LOG
  exit 1
fi

RESULT=$("$VENV" "$ENGINE_PY" --latest 2>>$LOG)
echo "$RESULT" >> $LOG

echo "[$(date '+%H:%M:%S')] Promotion shift DONE" >> $LOG
exit 0
