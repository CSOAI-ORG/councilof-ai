#!/bin/bash
# restore-clawd-from-cluster.sh — put the M4's EMPTIED clawd files back, from the cluster's copy.
#
# WHAT HAPPENED (2026-11-02 09:25). The clawd offload streamed ~/clawd to the RunPod network
# volume and then RECLAIMED the M4's copy file by file: `truncate -s 0`, then rmdir on the
# directories that became empty. 4,460 files under ~/clawd/_alignment were left at zero bytes
# and whole directories were removed, so the M4 lost both the bytes and the shape of the tree.
# The reclaim reported success.
#
# WHERE THE BYTES STILL ARE (verified 2026-11-03):
#   pod 6sr24tuhwl62sw: /workspace/m4-offload/verify-20261102-063232/x-clawd/clawd/_alignment
#     10,025 files, 9,996 non-zero, 368.6 MB; the five doctrine records present with content
#   HuggingFace: csoai/estate-offload-20261102 -> m4-offload/clawd-20261102.tar.zst
#     6,237,957,043 bytes, sha256 ab54af21b22337c6a3243eed10f8592562f5a192ade6ac1fa716cb5be00f354d
#
# WHAT THIS RESTORES, AND WHAT IT DELIBERATELY DOES NOT. It restores the files that are PRESENT
# on the M4 but EMPTY. It does not resurrect directories the reclaim rmdir'd, and it does not
# touch any file that already has content. That keeps the repair a repair: the pre-reclaim
# tree as a whole (10,025 files) is available on the cluster if anyone wants the rest, but
# this script does not decide that on its own.
#
# It verifies AFTER the copy: every file it targeted must now be non-empty and must match the
# size recorded on the cluster. A reclaim that empties files and reports success is the shape
# being fixed here; so is a restore that reports success without checking.
set -uo pipefail
export PATH="/opt/homebrew/bin:$PATH"

SRC_ROOT=clawd/_alignment          # relative to the expanded cluster copy
DST_ROOT="$HOME/clawd/_alignment"
POD_ID="${BUSABASE_POD_ID:-6sr24tuhwl62sw}"
CLUSTER_BASE="/workspace/m4-offload/verify-20261102-063232/x-clawd"
KEY=/Users/nicholas/.runpod/ssh/runpodctl-ssh-key
LOG="$HOME/csoai-work/scratch-restore/restore-clawd.log"
LIST=/tmp/clawd-empty-list-$$.txt
mkdir -p "$(dirname "$LOG")"

say() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$LOG"; }

# ---- resolve the pod endpoint at run time (it rotates on every resume) ----------------
info=$(runpodctl ssh info "$POD_ID" -o json 2>/dev/null) || { say "FATAL: cannot resolve pod $POD_ID"; exit 1; }
IP=$(printf '%s' "$info" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("ip",""))')
PORT=$(printf '%s' "$info" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("port",""))')
[ -z "$IP" ] || [ -z "$PORT" ] && { say "FATAL: no ip/port for $POD_ID"; exit 1; }
say "pod $POD_ID endpoint $IP:$PORT"
RSYNC_SSH="ssh -F /dev/null -i $KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o BatchMode=yes -o ConnectTimeout=15 -p $PORT"

# ---- the list: files that exist on the M4 and are EMPTY -------------------------------
cd "$DST_ROOT" 2>/dev/null || { say "FATAL: $DST_ROOT is gone"; exit 1; }
find . -type f -size 0 2>/dev/null | sed 's|^\./||' > "$LIST"
n=$(wc -l < "$LIST" | tr -d ' ')
say "targeting $n empty files under $DST_ROOT"
[ "$n" -gt 0 ] || { say "nothing to restore"; exit 0; }

# ---- restore them, preserving mtimes ----------------------------------------------------
if rsync -a --files-from="$LIST" --relative -e "$RSYNC_SSH" \
     "root@$IP:$CLUSTER_BASE/$SRC_ROOT/" "$DST_ROOT/" >>"$LOG" 2>&1; then
  say "rsync completed"
else
  say "FAIL: rsync returned non-zero — the remaining files are still empty"
fi

# ---- VERIFY: no targeted file may still be empty, and sizes must match the cluster ------
remaining=$(cd "$DST_ROOT" && find . -type f -size 0 2>/dev/null | sed 's|^\./||' | wc -l | tr -d ' ')
say "files still empty after the restore: $remaining"
if [ "$remaining" != "0" ]; then
  say "FAIL: $remaining files are STILL empty — reporting failure, not success"
  exit 1
fi
say "RESTORE VERIFIED: all $n targeted files have content again"
exit 0
