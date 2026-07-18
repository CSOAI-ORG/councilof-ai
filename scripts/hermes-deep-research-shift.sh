#!/bin/bash
# hermes-deep-research-shift.sh
# Every 12h: pick next research question → fire at all voices in parallel →
# left-brain synthesises → 33+N council audits → write memo → commit if approved.
#
# Cron schedule: every 12 hours
#   30 */12 * * * /Users/nicholas/clawd/scripts/hermes-deep-research-shift.sh

set -uo pipefail

LOG=/tmp/hermes_deep_research.log
COUNCIL_PY="/Users/nicholas/clawd/sovereign-temple/research_synthesizer.py"
COUNCIL_VENV="/Users/nicholas/clawd/sovereign-temple/.venv/bin/python"

# Source API keys (cron context has no env)
if [ -f "$HOME/.zshrc" ]; then
  eval "$(grep -E '^export (STEPFUN|ANTHROPIC|DEEPSEEK|GOOGLE|MISTRAL|XAI|MINIMAX|DASHSCOPE|HUNYUAN|ANTHROPIC_BILLING_OK)' "$HOME/.zshrc" 2>/dev/null || true)"
fi

echo "" >> $LOG
echo "═══════════════════════════════════════════════════════════════" >> $LOG
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deep research shift starting" >> $LOG

# Sanity checks
if ! curl -s -m 5 -o /dev/null -w "%{http_code}" http://localhost:3101/health | grep -q "200"; then
  echo "[FAIL] SOV3 council unreachable - exiting" >> $LOG
  exit 1
fi

if [ ! -x "$COUNCIL_VENV" ] || [ ! -f "$COUNCIL_PY" ]; then
  echo "[FAIL] missing $COUNCIL_VENV or $COUNCIL_PY" >> $LOG
  exit 1
fi

# Run with --pick-next so it processes the first unanswered question
RESULT=$("$COUNCIL_VENV" "$COUNCIL_PY" --pick-next 2>>$LOG)

echo "$RESULT" >> $LOG

# Parse result + log summary
SUMMARY=$(printf '%s' "$RESULT" | python3 -c '
import json, sys
try:
    d = json.loads(sys.stdin.read())
    print(d.get("council_majority", "?"))
    print(d.get("memo_path", "?"))
    print("committed" if d.get("committed") else "not_committed")
    print(d.get("voices", 0))
except Exception:
    print("?"); print("?"); print("?"); print("?")
' 2>/dev/null)

MAJORITY=$(printf '%s' "$SUMMARY" | sed -n '1p')
MEMO=$(printf '%s' "$SUMMARY" | sed -n '2p')
COMMITTED=$(printf '%s' "$SUMMARY" | sed -n '3p')
VOICES=$(printf '%s' "$SUMMARY" | sed -n '4p')

echo "[$(date '+%H:%M:%S')] DONE: majority=$MAJORITY voices=$VOICES committed=$COMMITTED memo=$MEMO" >> $LOG

exit 0
