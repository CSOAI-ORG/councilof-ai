#!/bin/bash
# hermes-content-shift.sh
# Tue/Thu/Sat 10am: pick next item from revenue/CONTENT_QUEUE.md, generate it through
# the dual-brain pipeline, council-audit, commit if approved.
# Output: revenue/content/<date>_<type>_<slug>.md (markdown for human review).
# Promotion to live meok/ui/src/app/blog/ pages is human-gated.

set -uo pipefail

LOG=/tmp/hermes_content.log
ENGINE_PY="/Users/nicholas/clawd/sovereign-temple/content_engine.py"
VENV="/Users/nicholas/clawd/sovereign-temple/.venv/bin/python"

# Source API keys
if [ -f "$HOME/.zshrc" ]; then
  eval "$(grep -E '^export (STEPFUN|ANTHROPIC|DEEPSEEK|GOOGLE|MISTRAL|XAI|MINIMAX|DASHSCOPE|HUNYUAN|ANTHROPIC_BILLING_OK)' "$HOME/.zshrc" 2>/dev/null || true)"
fi

echo "" >> $LOG
echo "═══════════════════════════════════════════════════════════════" >> $LOG
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Content shift starting" >> $LOG

if ! curl -s -m 5 -o /dev/null -w "%{http_code}" http://localhost:3101/health | grep -q "200"; then
  echo "[FAIL] SOV3 council unreachable" >> $LOG
  exit 1
fi
if [ ! -x "$VENV" ] || [ ! -f "$ENGINE_PY" ]; then
  echo "[FAIL] missing $VENV or $ENGINE_PY" >> $LOG
  exit 1
fi

RESULT=$("$VENV" "$ENGINE_PY" --pick-next 2>>$LOG)
echo "$RESULT" >> $LOG

echo "[$(date '+%H:%M:%S')] Content shift DONE" >> $LOG
exit 0
