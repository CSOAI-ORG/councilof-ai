#!/usr/bin/env bash
# Sync King Hive data from VM, regenerate town_feed.json, and update the MEOK UI bundle.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
POLICY_LAB="$SCRIPT_DIR"
UI_DIR="$HOME/meok-ai/ui"
PUBLIC_TOWN="$UI_DIR/public/town-3d"

VM_HOST="meok-backend"
VM_DATA_DIR="/home/nicholas/meok-king/data"

echo "[town-feed] Syncing King Hive data from VM..."
scp "$VM_HOST:$VM_DATA_DIR/king_hive_verdicts.jsonl" "$POLICY_LAB/king_hive_verdicts.jsonl"
mkdir -p "$POLICY_LAB/anchors"
if command -v rsync >/dev/null 2>&1; then
  rsync -avz "$VM_HOST:$VM_DATA_DIR/anchors/" "$POLICY_LAB/anchors/"
else
  scp -r "$VM_HOST:$VM_DATA_DIR/anchors/*" "$POLICY_LAB/anchors/"
fi

echo "[town-feed] Regenerating feed..."
cd "$POLICY_LAB"
# Source sovereign proofs from anchors-sov/ (the mac-sovereign, non-clobbered,
# 8/8 Bitcoin-verified set) — NOT anchors/, which the rsync above clobbers with the
# VM's king_hive proofs. king_hive verdicts still come from the scp'd jsonl above.
# The sweep dose-response headline is sourced from the local signed sweep ledger.
PL_ANCHORS=anchors-sov PL_SWEEP=sweep_dose_response.jsonl python3 town_feed.py

echo "[town-feed] Copying to MEOK UI..."
cp "$POLICY_LAB/town_feed.json" "$PUBLIC_TOWN/town_feed.json"
# Agent-47 SPA fetches /town_feed.json from domain root; keep both paths warm.
cp "$POLICY_LAB/town_feed.json" "$UI_DIR/public/town_feed.json"

echo "[town-feed] Done. Feed updated at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "[town-feed] Redeploy meok-ai/ui to publish the new feed."
