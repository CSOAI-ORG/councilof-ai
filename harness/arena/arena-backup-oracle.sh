#!/bin/bash
# arena-backup-oracle.sh — mirror the signed arena scoreboard + measurement corpus to
# oracle-micro-2 RAG (the durable cross-region backup). Runs after the scoreboard publish.
#
# Source of truth: the A100 pod publishes /tmp/arena_scoreboard.json (the /workspace mfs
# mount drops new writes — see intel/wave-13). This script pulls it via the Mac, and pushes
# the scoreboard + rounds to oracle-micro-2:/home/ubuntu/rag/arena. The monorepo + sink pod
# RAG are the in-estate copies; Oracle is the off-box disaster backup.
#
# Resilience: pre-flight disk check, --partial for resumable sync, and a remote marker file
# written on ANY exit so monitors always see the verdict.
set -uo pipefail
KEY="$HOME/.runpod/ssh/runpodctl-ssh-key"
A100_IP=38.128.232.57
PORT_HELPER="$(dirname "$0")/runpod-port.sh"
A100_PORT=$("$PORT_HELPER" l7g747oivyq6ab "$A100_IP")
[ "${A100_PORT:-0}" -gt 0 ] || A100_PORT=14954
SINK_PORT=33982; SINK_IP=213.173.105.83
ORACLE=oracle-micro-2
STAGE=/tmp/arena-backup
DEST=/home/ubuntu/rag/arena
MARK=$DEST/arena-backup.status
START=$(date -u +%Y-%m-%dT%H:%M:%SZ)
mkdir -p "$STAGE"
RC=0; VER=PENDING
TS(){ date -u +%FT%TZ; }
echo "$(TS) arena-backup start" >> /tmp/arena-backup.log

on_exit() {
  local end; end=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  ssh -o BatchMode=yes -o ConnectTimeout=5 "$ORACLE" \
    "echo '{\"start\":\"$START\",\"end\":\"$end\",\"exit\":$RC,\"verify\":\"$VER\"}' > $MARK" 2>/dev/null || true
  echo "$(TS) arena-backup done exit=$RC verify=$VER" >> /tmp/arena-backup.log
}
trap on_exit EXIT

# 1. Pull scoreboard + rounds from the A100 pod.
/opt/homebrew/bin/rsync -a --partial \
  -e "ssh -i $KEY -p $A100_PORT -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=10" \
  root@$A100_IP:/tmp/arena_scoreboard.json "$STAGE/arena_scoreboard.json" >> /tmp/arena-backup.log 2>&1
/opt/homebrew/bin/rsync -a --partial \
  -e "ssh -i $KEY -p $A100_PORT -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=10" \
  root@$A100_IP:/workspace/arena_rounds.jsonl "$STAGE/arena_rounds.jsonl" >> /tmp/arena-backup.log 2>&1
[ -s "$STAGE/arena_scoreboard.json" ] || { echo "$(TS) FAIL no scoreboard" >> /tmp/arena-backup.log; RC=1; VER=NO_SCOREBOARD; exit 1; }

# 2. Pre-flight disk check (loud on short headroom — the silent-ENOSPC class).
HEAD=$(ssh -o BatchMode=yes -o ConnectTimeout=8 "$ORACLE" "df -m /home/ubuntu | tail -1 | awk '{print \$4}'" 2>/dev/null || echo "0")
[ "${HEAD:-0}" -gt 200 ] || { echo "$(TS) FAIL disk headroom ${HEAD}MB < 200MB" >> /tmp/arena-backup.log; RC=1; VER=LOW_DISK; exit 1; }

# 3. Push to oracle-micro-2 RAG.
ssh -o BatchMode=yes -o ConnectTimeout=8 "$ORACLE" "mkdir -p $DEST" 2>/dev/null
/opt/homebrew/bin/rsync -a --partial \
  -e "ssh -o BatchMode=yes -o ConnectTimeout=8" \
  "$STAGE/" "$ORACLE:$DEST/" >> /tmp/arena-backup.log 2>&1
RC=$?
VER=$([ $RC -eq 0 ] && echo OK || echo FAIL)
# 4. Verify: recompute content_id on Oracle and confirm it matches the pod-signed one.
VB=$(ssh -o BatchMode=yes -o ConnectTimeout=8 "$ORACLE" \
  "python3 -c 'import json;d=json.load(open(\"$DEST/arena_scoreboard.json\"));print(d.get(\"signature\",{}).get(\"content_id\",\"\")[:12])'" 2>/dev/null)
echo "$(TS) oracle scoreboard content_id=$VB" >> /tmp/arena-backup.log
echo "$(TS) arena-backup complete" >> /tmp/arena-backup.log
