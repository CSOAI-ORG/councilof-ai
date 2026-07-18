#!/bin/bash
# overnight-research-batch.sh
# Processes ALL unanswered research questions through the SOV3 council synthesizer
# Fires at all available LLM voices in parallel per question
# Run: bash overnight-research-batch.sh &

set -uo pipefail

LOG=~/.hermes/logs/overnight-research.log
QUEUE=~/clawd/revenue/RESEARCH_QUEUE.md
SYNTH=~/clawd/sovereign-temple/research_synthesizer.py
VENV=~/clawd/sovereign-temple/.venv/bin/python

mkdir -p ~/.hermes/logs ~/clawd/revenue/research

echo "══════════════════════════════════════════" > "$LOG"
echo "🌙 OVERNIGHT RESEARCH BATCH STARTED" >> "$LOG"
echo "Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$LOG"
echo "" >> "$LOG"

COUNT=0
MAX_QUESTIONS=30

while [ $COUNT -lt $MAX_QUESTIONS ]; do
  # Check if any questions remain unanswered
  REMAINING=$(grep -c "^## [^#✅]" "$QUEUE" 2>/dev/null || echo "0")
  if [ "$REMAINING" -eq 0 ]; then
    echo "🎉 ALL QUESTIONS ANSWERED" >> "$LOG"
    break
  fi

  COUNT=$((COUNT + 1))
  echo "" >> "$LOG"
  echo "── Round $COUNT / $MAX_QUESTIONS (${REMAINING} remaining) ──" >> "$LOG"
  echo "[$(date -u +%H:%M:%SZ)] Processing next question..." >> "$LOG"

  RESULT=$("$VENV" "$SYNTH" --queue "$QUEUE" --pick-next 2>> "$LOG")
  
  echo "$RESULT" >> "$LOG"
  
  SUMMARY=$(echo "$RESULT" | python3 -c '
import json, sys
try:
    d = json.loads(sys.stdin.read())
    print(f"majority={d.get(\"council_majority\",\"?\")} voices={d.get(\"voices\",0)} committed={\"yes\" if d.get(\"committed\") else \"no\"} memo={d.get(\"memo_path\",\"?\")}")
except:
    print("parse_error")
' 2>/dev/null)
  
  echo "  → $SUMMARY" >> "$LOG"
  
  # Brief pause between questions to avoid rate limits
  sleep 3
done

echo "" >> "$LOG"
echo "══════════════════════════════════════════" >> "$LOG"
echo "🌅 OVERNIGHT RESEARCH COMPLETE" >> "$LOG"
echo "Completed: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$LOG"
echo "Questions processed: $COUNT" >> "$LOG"

# Write completion status
echo "DONE: $COUNT questions | $(date -u +%Y-%m-%dT%H:%M:%SZ)" > ~/.hermes/logs/overnight-complete.txt
