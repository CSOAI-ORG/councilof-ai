#!/usr/bin/env bash
# connect_lane.sh — connect ANY machine/agent (Hermes, M2, a new node) to the Sovereign substrate.
# Every lane uses the SAME recipe: clone the shared repo, announce itself on the signed bridge, probe compute.
# Usage:   bash connect_lane.sh <lane-name>
#   e.g.   bash connect_lane.sh hermes
#          bash connect_lane.sh m2
# PREREQ (owner, once per machine): GitHub auth so the PRIVATE repo can clone —
#   gh auth login          # or:  git config --global credential.helper store  (then a git op will prompt)
# This script NEVER handles keys. It signs bridge entries with a per-lane key it generates locally.
set -e
LANE="${1:?usage: bash connect_lane.sh <lane-name>}"
REPO="https://github.com/CSOAI-ORG/clawd-workspace.git"
BRANCH="m4-handoff-2026-06-24"
DIR="$HOME/clawd-workspace"

echo "== [$LANE] connecting to the Sovereign substrate =="

# 1. clone or update the shared repo (this IS the connection — the bridge lives inside it)
if [ -d "$DIR/.git" ]; then
  echo "-- repo exists, pulling latest"; git -C "$DIR" pull --ff-only origin "$BRANCH"
else
  echo "-- cloning (needs GitHub auth for the private repo)"; git clone -b "$BRANCH" "$REPO" "$DIR"
fi
KIT="$DIR/_alignment/sovereign_merge_kit"
cd "$KIT"

# 2. minimal deps (bridge signing only needs pynacl; RAG/NLI are optional/heavier)
python3 - <<'PY' 2>/dev/null || pip install pynacl >/dev/null 2>&1 || true
import nacl.signing  # noqa
PY

# 3. announce this lane on the signed bridge, then push so every other lane sees it
python3 - "$LANE" <<'PY'
import sys, subprocess
sys.path.insert(0, ".")
from sov333_bridge import BridgeNode, CAPABILITIES
lane = sys.argv[1]
n = BridgeNode(lane)
caps = sorted(CAPABILITIES.get(lane, {"generic"}))
rec = n.post("hello", {"msg": f"{lane} online", "caps": caps})
print(f"-- posted signed hello for '{lane}' · pubkey {n.sig.pub_hex()[:16]}… · caps={caps}")
print("-- lanes now on the bridge:", sorted({e['lane'] for e in BridgeNode.read()}))
PY
# push the bridge update (best-effort; skips if nothing to push / no write auth)
git -C "$DIR" add _alignment/sov333_bridge.jsonl 2>/dev/null && \
  git -C "$DIR" commit -q -m "$LANE: hello on bridge" 2>/dev/null && \
  git -C "$DIR" push -q origin "$BRANCH" 2>/dev/null && echo "-- bridge push OK" || echo "-- (bridge push skipped — pull+repush if it raced)"

# 4. show what compute this machine can actually offer (honest census)
if [ -f "$HOME/clawd/_compute/sov33_compute.py" ]; then
  echo "-- local compute census:"; python3 "$HOME/clawd/_compute/sov33_compute.py" --census 2>/dev/null | head -12 || true
fi
echo "== [$LANE] connected. It shares the signed bridge with every other lane. =="
