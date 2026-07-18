#!/bin/bash
# cron-wrapper.sh — wrap a cron job and emit a SOV3 coordination task.
# Usage: cron-wrapper.sh <task-name> <command> [args...]

TASK_NAME="${1:-cron-job}"
shift

LOG_DIR="/tmp/cron-wrapper-logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/${TASK_NAME}-$(date +%Y%m%d-%H%M%S).log"

START=$(date +%s)
"$@" > "$LOG_FILE" 2>&1
EXIT_CODE=$?
END=$(date +%s)
DURATION=$((END - START))

if [ $EXIT_CODE -eq 0 ]; then
  STATUS="success"
  LEVEL="info"
else
  STATUS="failed"
  LEVEL="error"
fi

RESULT="Cron $TASK_NAME $STATUS in ${DURATION}s (exit $EXIT_CODE). Log: $LOG_FILE"

# Submit to SOV3 coordination if available
if curl -s -m 5 http://127.0.0.1:3101/health > /dev/null 2>&1; then
  python3 /Users/nicholas/clawd/scripts/enable_coordination.py \
    --submit "cron:$TASK_NAME $STATUS (${DURATION}s)" --priority low > /dev/null 2>&1 || true
fi

echo "$RESULT"
exit $EXIT_CODE
