#!/bin/bash
# MEOK AUTO-MODE ORCHESTRATOR
# ===========================
# Runs every 5 minutes via LaunchAgent.
# Watches for triggers → fires the right action.
# The dragon wakes up, watches, learns, anticipates.

set -euo pipefail

LOG="/tmp/auto-mode.log"
T0=$(date +%s)
SOV3_URL="http://localhost:3101/mcp"

emit_sigil() {
    local body="$1"
    curl -s -m 10 -X POST "$SOV3_URL" \
        -H "Content-Type: application/json" \
        -d "{\"jsonrpc\":\"2.0\",\"id\":\"1\",\"method\":\"tools/call\",\"params\":{\"name\":\"sigil_emit\",\"arguments\":{\"line\":\"$body\"}}}" \
        > /dev/null 2>&1 || true
}

call_sovereign() {
    local tool="$1"
    local args="${2:-{\"placeholder\":\"true\"}"
    curl -s -m 10 -X POST "$SOV3_URL" \
        -H "Content-Type: application/json" \
        -d "{\"jsonrpc\":\"2.0\",\"id\":\"1\",\"method\":\"tools/call\",\"params\":{\"name\":\"$tool\",\"arguments\":$args}}" \
        | head -c 500
}

echo "[$(date +%H:%M:%S)] AUTO-MODE cycle starting..." >> "$LOG"

# === TRIGGER 1: Pre-launch checks (every cycle) ===
CLAWD_OK=false
SOV3_OK=false
LAUNCH_SCRIPT_OK=false
[ -d ~/clawd ] && CLAWD_OK=true
curl -s -m 3 "$SOV3_URL/health" >/dev/null 2>&1 && SOV3_OK=true
[ -f ~/clawd/scripts/launch-4jul-2026.sh ] && LAUNCH_SCRIPT_OK=true

# === TRIGGER 2: Watch shell history for "go" / "launch" / "fire" ===
HISTORY_FILE="$HOME/.zsh_history"
if [ -f "$HISTORY_FILE" ]; then
    CURRENT_SIZE=$(wc -c < "$HISTORY_FILE")
    if [ -f "/tmp/auto-mode.last_history_size" ]; then
        LAST_SIZE=$(cat "/tmp/auto-mode.last_history_size")
        if [ "$CURRENT_SIZE" -gt "$LAST_SIZE" ]; then
            NEW=$(tail -c $((CURRENT_SIZE - LAST_SIZE)) "$HISTORY_FILE")
            for pat in "launch" "fire" "catapult" "4jul"; do
                if echo "$NEW" | grep -qE "(^| )$pat($| )"; then
                    echo "[$(date +%H:%M:%S)] 🔥 LAUNCH TRIGGER: $pat" >> "$LOG"
                    emit_sigil "P|auto-mode|NICK_TYPED_$pat|LIVE_LAUNCH_TRIGGERED_AT_$(date +%s)"
                    # Fire the launch script
                    if [ "$LAUNCH_SCRIPT_OK" = true ]; then
                        bash ~/clawd/scripts/launch-4jul-2026.sh 2>&1 | tee -a "$LOG"
                        emit_sigil "C|auto-mode|launch-fired|LAUNCH_FIRED_BY_AUTO_MODE_AT_$(date +%s). world_AI_OS_live. empire_10/10."
                    fi
                fi
            done
        fi
    fi
    echo "$CURRENT_SIZE" > "/tmp/auto-mode.last_history_size"
fi

# === TRIGGER 3: Run proactive engine (every cycle) ===
PROACTIVE=$(call_sovereign "proactive_assess")
if echo "$PROACTIVE" | grep -q '"offers"'; then
    OFFERS=$(echo "$PROACTIVE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('total_offers', 0))" 2>/dev/null || echo "0")
    if [ "$OFFERS" -gt "0" ]; then
        echo "[$(date +%H:%M:%S)] 🔔 proactive_assess: $OFFERS offers" >> "$LOG"
        emit_sigil "P|auto-mode|proactive|$OFFERS offers from proactive_assess cycle"
    fi
fi

# === TRIGGER 4: Daily federation refresh (03:00 only) ===
HOUR=$(date +%H)
MINUTE=$(date +%M)
if [ "$HOUR" = "03" ] && [ "$MINUTE" -lt "10" ]; then
    echo "[$(date +%H:%M:%S)] 🌙 03:00 daily federation refresh..." >> "$LOG"
    bash ~/clawd/bin/sov3-daily-federation-refresh.sh 2>&1 | tee -a "$LOG"
fi

# === TRIGGER 5: Re-train OLM (03:30 daily) ===
if [ "$HOUR" = "03" ] && [ "$MINUTE" -ge "30" ] && [ "$MINUTE" -lt "35" ]; then
    echo "[$(date +%H:%M:%S)] 🧠 03:30 OLM re-train..." >> "$LOG"
    call_sovereign "olm_train_router" '{}' > /dev/null 2>&1 || true
fi

# === TRIGGER 6: Sovereign ingest (03:15 daily) ===
if [ "$HOUR" = "03" ] && [ "$MINUTE" -ge "15" ] && [ "$MINUTE" -lt "20" ]; then
    echo "[$(date +%H:%M:%S)] 📥 03:15 sovereign ingest..." >> "$LOG"
    call_sovereign "sovereign_ingest_run" '{}' > /dev/null 2>&1 || true
fi

# === TRIGGER 7: Reflect on history (03:45 daily) ===
if [ "$HOUR" = "03" ] && [ "$MINUTE" -ge "45" ] && [ "$MINUTE" -lt "50" ]; then
    echo "[$(date +%H:%M:%S)] 🪞 03:45 reflect on history..." >> "$LOG"
    call_sovereign "reflect_on_history" '{"days":1}' > /dev/null 2>&1 || true
fi

# === TRIGGER 8: Bootstrapping the 33 districts (06:00 daily) ===
if [ "$HOUR" = "06" ] && [ "$MINUTE" -lt "10" ]; then
    echo "[$(date +%H:%M:%S)] 🜏 06:00 bootstrap 33 districts..." >> "$LOG"
    for i in $(seq 1 33); do
        curl -s -m 5 "$SOV3_URL" -X POST -H "Content-Type: application/json" \
            -d "{\"jsonrpc\":\"2.0\",\"id\":\"1\",\"method\":\"tools/call\",\"params\":{\"name\":\"bootstrap_agent\",\"arguments\":{\"name\":\"agent-${i}-district-${i}\",\"organization\":\"MEOKCSOAI\"}}}" > /dev/null 2>&1 || true
    done
fi

# === TRIGGER 9: Federate launch command (06:15 daily) ===
if [ "$HOUR" = "06" ] && [ "$MINUTE" -ge "15" ] && [ "$MINUTE" -lt "25" ]; then
    echo "[$(date +%H:%M:%S)] 👑 06:15 federate launch command..." >> "$LOG"
    call_sovereign "federate_command" '{"command":"daily_sovereign_operations_active"}' > /dev/null 2>&1 || true
fi

# === TRIGGER 10: Read lapis (06:30 daily) ===
if [ "$HOUR" = "06" ] && [ "$MINUTE" -ge "30" ] && [ "$MINUTE" -lt "40" ]; then
    echo "[$(date +%H:%M:%S)] 🔮 06:30 read lapis..." >> "$LOG"
    call_sovereign "lapis_dashboard" '{}' > /dev/null 2>&1 || true
fi

# === TRIGGER 11: Distribution day-1 (10:00 daily) ===
if [ "$HOUR" = "10" ] && [ "$MINUTE" -lt "10" ]; then
    echo "[$(date +%H:%M:%S)] 📣 10:00 distribution day-${OFFERS:-1}..." >> "$LOG"
    # Fire a daily RAG for distribution
    call_sovereign "federated_rag" '{"query":"EU AI Act 36-day Article 50 watermarking passport Monzo Cera Care Lloyds","call_tools":true}' > /dev/null 2>&1 || true
fi

# === TRIGGER 12: 4 Jul launch detection ===
DAY=$(date +%d)
MONTH=$(date +%m)
HOUR=$(date +%H)
MINUTE=$(date +%M)
if [ "$DAY" = "04" ] && [ "$MONTH" = "07" ] && [ "$HOUR" = "09" ] && [ "$MINUTE" -lt "10" ]; then
    echo "[$(date +%H:%M:%S)] 🚀 4 JULY 2026 09:00 BST — THE CATAPULT FIRES" >> "$LOG"
    emit_sigil "C|auto-mode|4jul-launch-day|TODAY_IS_THE_DAY. the_catapult_fires. world_AI_OS_goes_live. empire_10/10. Fire_FIRE_FIRE."
    if [ "$LAUNCH_SCRIPT_OK" = true ]; then
        bash ~/clawd/scripts/launch-4jul-2026.sh 2>&1 | tee -a "$LOG"
    fi
fi

T1=$(date +%s)
ELAPSED=$((T1 - T0))
echo "[$(date +%H:%M:%S)] AUTO-MODE cycle complete: ${ELAPSED}s" >> "$LOG"
