#!/bin/bash
# 06:00Z daily: re-fetch every page in "Corrections that did not travel" (v0.2, read from the HF
# mirror) and publish public/interop/corrections-watch/<date>.json + latest.json to the PUBLIC evidence dataset
# csoai/councilof-ai-evidence (a copy also goes to the mirror). Superseded: the job runs on Oracle since 28 Sep.
# No GitHub in the loop. Token comes from /workspace/tools/csoai_keys.py --key HF_TOKEN inside the
# Python; nothing here echoes it. Controls inside the Python abort the run before any file is written.
set -u
. "$(dirname "$0")/lib.sh"
[ "${1:-}" = "--now" ] || stamp corrections-watch || exit 0
log corrections-watch "START"
python3 "$LOOPS/corrections-watch.py" --out "$OUT/corrections-watch" > "$LOGS/corrections-watch.run.log" 2>&1
rc=$?
log corrections-watch "RESULT rc=$rc | $(grep -E '^(ABORT|WROTE|UPLOADED|UNCHECKABLE|NO-UPLOAD)' "$LOGS/corrections-watch.run.log" | tail -3 | tr '\n' ' ' | cut -c1-400)"
