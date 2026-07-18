#!/bin/bash
# SOV3 Watch Mode — auto-detect when Nick types "go" or "launch"
# Now also auto-fires the 4 Jul launch script when appropriate

WATCH_LOG="/tmp/sov3-watch.log"
HISTORY_FILE="$HOME/.zsh_history"
SOV3_URL="http://localhost:3101/mcp"
LAUNCH_SCRIPT="$HOME/clawd/scripts/launch-4jul-2026.sh"

emit_sigil() {
    local body="$1"
    curl -s -m 10 -X POST "$SOV3_URL" \
        -H "Content-Type: application/json" \
        -d "{\"jsonrpc\":\"2.0\",\"id\":\"1\",\"method\":\"tools/call\",\"params\":{\"name\":\"sigil_emit\",\"arguments\":{\"line\":\"$body\"}}}" \
        > /dev/null 2>&1
}

# Watch for new shell history entries
LAST_SIZE=0
if [ -f "$HISTORY_FILE" ]; then
    LAST_SIZE=$(wc -c < "$HISTORY_FILE")
fi

while true; do
    if [ -f "$HISTORY_FILE" ]; then
        CURRENT_SIZE=$(wc -c < "$HISTORY_FILE")
        if [ "$CURRENT_SIZE" -gt "$LAST_SIZE" ]; then
            NEW=$(tail -c $((CURRENT_SIZE - LAST_SIZE)) "$HISTORY_FILE")
            # Detect: "fire launch", "go 4jul", "launch the catapult", "catapult fire", etc.
            for pat in "go" "eat" "continue" "next" "fire" "launch" "catapult"; do
                if echo "$NEW" | grep -qE "(^| )$pat($| )"; then
                    msg="user-intent-$pat|NICK_TYPED_$pat|$(date +%s)"
                    echo "$(date +%H:%M:%S) TRIGGER: $msg" >> "$WATCH_LOG"
                    emit_sigil "$msg"
                    # If "launch" or "catapult" or "fire" → fire the launch script
                    if echo "$NEW" | grep -qE "(launch|catapult|fire|4jul)"; then
                        echo "$(date +%H:%M:%S) FIRING LAUNCH SCRIPT" >> "$WATCH_LOG"
                        if [ -f "$LAUNCH_SCRIPT" ]; then
                            bash "$LAUNCH_SCRIPT" 2>&1 | tee -a "$WATCH_LOG"
                            emit_sigil "C|jeeves-cli|watch-mode-launch|LAUNCH_SCRIPT_FIRED_BY_WATCH_MODE_AT_$(date +%s). world_AI_OS_live. empire_10/10."
                        fi
                    fi
                fi
            done
            LAST_SIZE=$CURRENT_SIZE
        fi
    fi
    # Check SOV3 health
    if ! curl -s -m 5 "$SOV3_URL/health" > /dev/null 2>&1; then
        echo "$(date +%H:%M:%S) ALERT: SOV3 DOWN" >> "$WATCH_LOG"
    fi
    sleep 30
done
