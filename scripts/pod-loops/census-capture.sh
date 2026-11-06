#!/bin/bash
# Daily 07:00Z: capture the public authless claim catalogues, root them (RFC 9162), submit the
# root to the OpenTimestamps calendars, take a detached board signature, publish to Hugging Face
# and to $OUT/census for the repo lane.
#
# THE SCHEDULER STAMPS. This script is invoked with --now and must NEVER call stamp() itself:
# a second stamp inside the job consumes the slot the scheduler already claimed and the job
# silently never runs. That was a real, silent no-op on this pod on 2026-09-22.
#
# Receipts are the lines in $LOGS/census-capture.log. A stamp file is not a receipt.
set -u
. "$(dirname "$0")/lib.sh"
log census-capture "START argv=${*:-}"
mkdir -p "$OUT/census"
ARGS=(); for x in "$@"; do [ "$x" = "--now" ] || ARGS+=("$x"); done
python3 "$LOOPS/census-capture.py" --out "$OUT/census" "${ARGS[@]+"${ARGS[@]}"}" \
  > "$LOGS/census-capture.run.log" 2>&1
rc=$?
log census-capture "RESULT rc=$rc | $(grep -E '^[0-9T:Z-]+ (DONE|DISK-STOP|ABORT)' "$LOGS/census-capture.run.log" | tail -2 | tr '\n' ' ' | cut -c1-300)"
grep -E '^[0-9T:Z-]+ +[a-z0-9-]+ +records=' "$LOGS/census-capture.run.log" | while read -r l; do
  log census-capture "  $l"
done
grep -E 'UNCHECKABLE|DROPPED|SELF-TEST FAILED' "$LOGS/census-capture.run.log" | head -10 | while read -r l; do
  log census-capture "  !! $l"
done
exit $rc
