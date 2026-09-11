#!/bin/bash
# p6-weekly-snapshot.sh — Mac-side durable snapshot (P6, 2026-08-18).
# Pulls mine index + arena data from the 3090 pod, pushes to the volume sink
# (2.3PB EU-RO-1 /workspace). Run weekly via LaunchAgent; on-demand supported.
# Log: ~/clawd/_evacuation/logs/p6-snapshot.log
set -uo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$PATH"
LOG="$HOME/clawd/_evacuation/logs/p6-snapshot.log"
mkdir -p "$(dirname "$LOG")"
TS=$(date -u +%Y%m%d)
RSYNC="/opt/homebrew/bin/rsync"
STAGE="$HOME/clawd/_evacuation/p6-stage-$TS"
mkdir -p "$STAGE"

echo "===== p6 snapshot $TS $(date -u +%H:%M:%S) =====" >> "$LOG"

# 1. Pull from 3090 (sov-brain-2)
for f in /workspace/sov33-oowm/oowm/index/estate_mine_index.json \
         /workspace/arena-24x7/reborn_rounds.jsonl \
         /workspace/arena-24x7/grok_referee_league.json \
         /workspace/arena-24x7/grok_referee_rounds.jsonl; do
  $RSYNC -a --partial -e "ssh -o ConnectTimeout=10 -o BatchMode=yes" \
    "sov-brain-2:$f" "$STAGE/" >> "$LOG" 2>&1 \
    && echo "pulled $(basename $f)" >> "$LOG" || echo "PULL-FAIL $(basename $f)" >> "$LOG"
done

# 2. Push to volume sink (mkdir -p first — rsync won't create nested dirs)
ssh -o ConnectTimeout=10 -o BatchMode=yes -i "$HOME/.runpod/ssh/runpodctl-ssh-key" -p 17595 \
  root@213.173.105.83 "mkdir -p /workspace/snapshots/$TS" >> "$LOG" 2>&1
$RSYNC -a --partial -e "ssh -o ConnectTimeout=10 -o BatchMode=yes -i $HOME/.runpod/ssh/runpodctl-ssh-key -p 17595" \
  "$STAGE/" "root@213.173.105.83:/workspace/snapshots/$TS/" >> "$LOG" 2>&1 \
  && echo "pushed to sink /workspace/snapshots/$TS" >> "$LOG" || echo "PUSH-FAIL" >> "$LOG"

# 3. Cleanup stage
rm -rf "$STAGE"
echo "===== p6 done $(date -u +%H:%M:%S) =====" >> "$LOG"
tail -100 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
