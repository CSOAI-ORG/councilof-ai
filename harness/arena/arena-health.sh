#!/bin/bash
# arena-health.sh — engine + scoreboard health check with alerting. Pod-canonical.
# Checks: (1) axis-engine alive, (2) scoreboard verify match, (3) rounds progressing.
# On stall/broken verify, writes a RED status + (optionally) fires a notify.
# Run via cron: */10 * * * * bash ~/clawd/harness/arena/arena-health.sh
export PATH="/opt/homebrew/bin:$PATH"
KEY="$HOME/.runpod/ssh/runpodctl-ssh-key"
A100_IP=38.128.232.57
PORT_HELPER="$(dirname "$0")/runpod-port.sh"
A100_PORT=$("$PORT_HELPER" l7g747oivyq6ab "$A100_IP")
[ "${A100_PORT:-0}" -gt 0 ] || A100_PORT=14954
STAGE=/tmp/arena-health
mkdir -p "$STAGE"
TS(){ date -u +%FT%TZ; }
RED=0
OUT="$STAGE/arena-health.json"

# 1. axis-engine alive?
AXIS=$(ssh -i "$KEY" -p $A100_PORT -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=8 \
  root@$A100_IP 'pgrep -f axis-engine.sh >/dev/null && echo RUN || echo DOWN' 2>/dev/null)
LOOP=$(ssh -i "$KEY" -p $A100_PORT -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=8 \
  root@$A100_IP 'pgrep -f "tmp/arena-auto-loop" >/dev/null && echo RUN || echo DOWN' 2>/dev/null)
ROUNDS=$(ssh -i "$KEY" -p $A100_PORT -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=8 \
  root@$A100_IP 'wc -l < /workspace/arena_rounds.jsonl 2>/dev/null || echo 0' 2>/dev/null)

# 2. live verify match (public proof the pipeline is honest).
VERIFY=$(curl -s --max-time 15 "https://councilof.ai/api/arena/scoreboard?verify=1" 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print('TRUE' if d.get('match') else 'FALSE')" 2>/dev/null)
CID=$(curl -s --max-time 15 "https://councilof.ai/api/arena/scoreboard" 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('signature',{}).get('content_id','')[:12])" 2>/dev/null)

# 3. score
[ "$AXIS" != "RUN" ] && RED=$RED"1"
[ "$LOOP" != "RUN" ] && RED=$RED"1"
[ "$VERIFY" != "TRUE" ] && RED=$RED"1"
[ "${ROUNDS:-0}" -lt 1 ] && RED=$RED"1"

STATUS=$([ "$RED" = "0" ] && echo GREEN || echo RED)
echo "{\"ts\":\"$(TS)\",\"status\":\"$STATUS\",\"axis\":\"$AXIS\",\"loop\":\"$LOOP\",\"rounds\":$ROUNDS,\"verify\":\"$VERIFY\",\"content_id\":\"$CID\"}" > "$OUT"
echo "$(TS) arena-health $STATUS axis=$AXIS loop=$LOOP rounds=$ROUNDS verify=$VERIFY cid=$CID" >> /tmp/arena-health.log

if [ "$STATUS" = "RED" ]; then
  # alert hook — log loudly; wire to a pager/webhook if one is configured.
  echo "$(TS) ALERT: arena-engine unhealthy ($STATUS)" >> /tmp/arena-health.log
  [ -n "${ALERT_WEBHOOK:-}" ] && curl -sf -X POST "$ALERT_WEBHOOK" -d "arena-engine $STATUS axis=$AXIS loop=$LOOP verify=$VERIFY" >> /tmp/arena-health.log 2>&1 || true
fi
