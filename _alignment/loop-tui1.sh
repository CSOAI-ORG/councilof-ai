#!/bin/bash
# TUI-1 integrity loop with delta-detection
# Fires every 20 min via cron. Only writes to STATUS/INBOX when state changes.

REPO=CSOAI-ORG/councilof-ai
SITE=https://councilof.ai
STATUS=~/clawd/_alignment/STATUS-tui1-$(date -u +%F).md
INBOX=~/clawd/_alignment/INBOX-governor.md
LAST_STATE=~/clawd/_alignment/.last-tui1-state
now=$(date -u +"%H:%M")

# Collect current state hash (compact representation of what matters)
current_state() {
  curl -s --max-time 15 "$SITE/root.json" | sha256sum | cut -d' ' -f1
  echo "---"
  curl -s --max-time 15 "$SITE/interop/root-witness-pointer.json" | jq -r '.live_root.sha256 // ""'
  echo "---"
  gh pr list -R $REPO --state open --head public-root/pending --json number --jq 'length' 2>/dev/null
  echo "---"
  gh pr list -R $REPO --base master --state open --search "mill/land in:head" --json number --jq 'length' 2>/dev/null
}

new_state=$(current_state)
old_state=""
[ -f "$LAST_STATE" ] && old_state=$(cat "$LAST_STATE")

if [ "$new_state" = "$old_state" ]; then
  # No change — just log to STATUS (not INBOX) for heartbeat
  echo "$now UTC: no-change (state identical to last pass)" >> "$STATUS"
  exit 0
fi

# State changed — do full loop
echo "$new_state" > "$LAST_STATE"

# [Original loop logic from the cron prompt]
# ... (ROOT, PENDING, LANDINGS, etc.)
