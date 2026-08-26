#!/bin/bash
# publish-watchdog.sh — standalone watchdog that guarantees the signed scoreboard is
# re-published each cycle regardless of whether the auto-loop's axis_arena batch is slow
# or publish_scoreboard.py hangs. Force-publishes the latest rounds whenever the board is
# stale (> STALE_SECONDS) and no publish is in flight. Compliments (does not replace) the
# auto-loop: it is the safety net keeping objective-#1 "scoreboard re-signed each cycle"
# true under GPU contention. Safe: exits immediately if the board is fresh.
set -uo pipefail
DIR=/workspace/arena_engine
KEY=$DIR/key
BOARD=/workspace/arena_scoreboard.json
ROUNDS=/workspace/arena_rounds.jsonl
LOG=/workspace/arena_engine/pipeline.log
STALE_SECONDS=${STALE_SECONDS:-900}   # re-publish if board as_of older than 15 min
TS(){ date -u +%FT%TZ; }

now=$(date -u +%s)
# Parse the board as_of to unix epoch using a dedicated python interpreter via stdin
# (avoids any shell/printf percent-escaping entirely).
board_ts=$(BOARD_F="$BOARD" python3 - <<'PY' 2>/dev/null || echo 0
import os, json, datetime
try:
    d = json.load(open(os.environ['BOARD_F']))
    s = d['as_of'].replace('Z', '+00:00')
    if '.' in s:
        b, fr = s.split('.', 1)
        dt = datetime.datetime.strptime(b + '.' + fr[:6] + '+00:00',
                                        '%Y-%m-%dT%H:%M:%S.%f%z')
    else:
        dt = datetime.datetime.strptime(s, '%Y-%m-%dT%H:%M:%S%z')
    print(int(dt.timestamp()))
except Exception:
    print(0)
PY
)
age=$(( now - board_ts ))
echo "$(TS) watchdog: board age=${age}s (stale_threshold=${STALE_SECONDS}s)" >> "$LOG"
if [ "$age" -lt "$STALE_SECONDS" ]; then
  echo "$(TS) watchdog: board fresh, no action" >> "$LOG"
  exit 0
fi

# Don't double-publish if a publish is already running (auto-loop or another watchdog).
if pgrep -f publish_scoreboard.py >/dev/null 2>&1; then
  echo "$(TS) watchdog: publish already in flight, skip" >> "$LOG"
  exit 0
fi

echo "$(TS) watchdog: board stale (${age}s) force-publishing rounds=$(wc -l < "$ROUNDS")" >> "$LOG"
cd "$DIR" && timeout 180 python3 publish_scoreboard.py \
  --rounds "$ROUNDS" --benchdir /workspace/bench --key "$KEY" --out "$BOARD" >> "$LOG" 2>&1
echo "$(TS) watchdog: done content_id=$(python3 -c "import json;print(json.load(open('$BOARD')).get('signature',{}).get('content_id','?')[:12])" 2>/dev/null)" >> "$LOG"
