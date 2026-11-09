#!/bin/bash
# nsite_refill.sh — keep the N-site hunt fed. Runs from cron every 15 min.
#
# The lane stops itself when the queue empties (by design: onboard_one.py writes QUEUE_EMPTY and
# exits). On 2026-09-29 nothing refilled it, so the hunt was dead for 28 days while a puller kept
# copying the frozen log. This closes that loop: when the queue is empty, regenerate the source
# record from the Layer O registry, rebuild the queue, and clear the stop marker.
#
# Idempotent and safe to run often: it does nothing unless the queue is actually empty.
set -uo pipefail
cd ~/lanes/nsite-onboard
LOG=~/lanes/logs/nsite-refill.log
Q=queue.jsonl
N=$(grep -c . "$Q" 2>/dev/null | head -1); N=${N:-0}
if [ "$N" -gt 0 ]; then
  exit 0
fi
echo "$(date -u +%FT%TZ) queue empty -> refilling" >> "$LOG"
if ! python3 build_greenfield_surfaces.py >> "$LOG" 2>&1; then
  echo "$(date -u +%FT%TZ) refill: greenfield source builder error (continuing with registry source)" >> "$LOG"
fi
if ! python3 build_registry_surfaces.py >> "$LOG" 2>&1; then
  echo "$(date -u +%FT%TZ) refill FAILED: source builder error" >> "$LOG"; exit 1
fi
if ! python3 build_queue.py --registry ~/lanes/layer-o-registry \
     --sources ~/lanes/nsite-onboard/sources --out "$Q.new" >> "$LOG" 2>&1; then
  echo "$(date -u +%FT%TZ) refill FAILED: queue builder error" >> "$LOG"; exit 1
fi
M=$(grep -c . "$Q.new" 2>/dev/null || echo 0)
if [ "$M" -eq 0 ]; then
  echo "$(date -u +%FT%TZ) refill produced 0 candidates — source exhausted again, NOT clearing the marker" >> "$LOG"
  rm -f "$Q.new"; exit 1
fi
mv "$Q.new" "$Q"
rm -f QUEUE_EMPTY
echo "$(date -u +%FT%TZ) refilled: $M candidates; QUEUE_EMPTY cleared" >> "$LOG"
