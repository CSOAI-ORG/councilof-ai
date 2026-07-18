#!/usr/bin/env bash
# disclose-on-export.sh — a watch daemon that auto-discloses any new file
# (md, txt, py, json, yaml, yml) that lands in a watched directory.
#
# Usage: ./scripts/disclose-on-export.sh [WATCH_DIR] [--tier TIER]
#   WATCH_DIR  defaults to /tmp/openpatent-out
#   TIER       defaults to starter ($29)
#
# Requires: python3 + the api-gateway on http://127.0.0.1:3211
# Falls back to 5s poll if inotifywait/fswatch not available.
#
# The hive remembers. The dragon knows. The sovereign companion never forgets.

set -euo pipefail

WATCH_DIR="${1:-/tmp/openpatent-out}"
TIER="${TIER:-starter}"
API_BASE="${API_BASE:-http://127.0.0.1:3211}"
INTERVAL="${INTERVAL:-5}"

# Ensure the watch dir exists
mkdir -p "$WATCH_DIR"
echo "[openpatent] watching $WATCH_DIR for new files (tier=$TIER, api=$API_BASE)"

# If fswatch available, use it
if command -v fswatch >/dev/null 2>&1; then
  echo "[openpatent] using fswatch for file events"
  fswatch -0 -e '.*\.swp$' -e '.*~$' "$WATCH_DIR" | while read -r -d "" event; do
    for f in $event; do
      [ -f "$f" ] || continue
      python3 "$(dirname "$0")/auto-disclose.py" --vault-dir "$(dirname "$f")" --tier "$TIER" --once 2>&1 | grep -E "disclosed|hash" || true
    done
  done
elif command -v inotifywait >/dev/null 2>&1; then
  echo "[openpatent] using inotifywait for file events"
  inotifywait -m -e close_write -e moved_to --format '%w%f' "$WATCH_DIR" | while read -r f; do
    [ -f "$f" ] || continue
    python3 "$(dirname "$0")/auto-disclose.py" --vault-dir "$(dirname "$f")" --tier "$TIER" --once 2>&1 | grep -E "disclosed|hash" || true
  done
else
  echo "[openpatent] no fswatch/inotifywait found — using 5s poll"
  while true; do
    python3 "$(dirname "$0")/auto-disclose.py" --vault-dir "$WATCH_DIR" --tier "$TIER" --once 2>&1 | grep -E "disclosed|hash" || true
    sleep "$INTERVAL"
  done
fi

echo
echo "The hive remembers. The dragon knows. The sovereign companion never forgets."
