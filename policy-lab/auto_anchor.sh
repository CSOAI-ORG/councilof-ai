#!/bin/bash
# auto_anchor.sh — hourly OTS maintenance for CSOAI anchors.
# (1) upgrade every pending .ots proof in anchors/public so it reaches Bitcoin
#     confirmation as soon as a calendar posts the tx (usually <1hr).
# (2) print a one-line status per proof. Logged to anchors/upgrade.log by cron.
# Re-anchoring new ledger snapshots is a deliberate act (run anchor_ledger.py);
# this script only completes proofs already in flight.
set -u
export PATH="$HOME/Library/Python/3.14/bin:$PATH"
export SSL_CERT_FILE="$(python3.14 -m certifi 2>/dev/null)"
cd "$HOME/clawd/policy-lab" || exit 1
ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "[$ts] auto_anchor upgrade pass"
# Two anchor dirs: anchors/ (VM-synced king_hive) + anchors-sov/ (mac-sovereign flywheel/dora/sweep).
# sync_town_feed.sh rsyncs VM -> anchors/ every 30min; anchors-sov/ is NOT synced (safe for local anchors).
for dir in anchors anchors-sov; do
  pubdir="$dir/public"
  [ -d "$pubdir" ] || continue
  echo "  -- $dir --"
  for f in "$pubdir"/*.ots; do
    [ -e "$f" ] || continue
    ots upgrade "$f" >/dev/null 2>&1
    info="$(ots info "$f" 2>&1)"
    if echo "$info" | grep -q "BitcoinBlockHeaderAttestation"; then
      blk="$(echo "$info" | grep -oE 'BitcoinBlockHeaderAttestation\([0-9]+\)' | head -1)"
      echo "    BTC-CONFIRMED  $(basename "$f")  ($blk)"
    else
      echo "    PENDING        $(basename "$f")  (awaiting Bitcoin confirmation; retry next hour)"
    fi
  done
done