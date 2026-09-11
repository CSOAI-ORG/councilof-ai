#!/bin/bash
# sovos-backup — Mac -> RunPod volume mirror (backup procedure for the sovereign estate)
# The RunPod volume (2.3PB / 456T free) is the canonical home. The Mac is a thin client:
# this script is the reverse-backup (Mac ephemeral copy -> volume truth).
RSYNC=/opt/homebrew/bin/rsync
KEY=~/.runpod/ssh/runpodctl-ssh-key
DEST="root@213.173.105.83"
PORT=17595
LOG=~/clawd/_alignment/sovos-backup.log
STAMP=$(date +%Y-%m-%dT%H:%M:%S)

mkdir -p ~/clawd/_alignment
echo "[$STAMP] sovos-backup start" >> "$LOG"

$RSYNC -a --delete --partial \
  --exclude='**/.git' --exclude='**/node_modules' --exclude='**/.next' \
  --exclude='**/.venv' --exclude='**/__pycache__' --exclude='*.pyc' \
  -e "ssh -p $PORT -i $KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -F /dev/null" \
  ~/clawd/ "$DEST:/workspace/offload-dsh/clawd/" >> "$LOG" 2>&1

$RSYNC -a --partial --exclude='Models' --exclude='history' \
  -e "ssh -p $PORT -i $KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -F /dev/null" \
  ~/.dsh/ "$DEST:/workspace/offload-dsh/dsh-backup/" >> "$LOG" 2>&1

$RSYNC -a --partial \
  -e "ssh -p $PORT -i $KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -F /dev/null" \
  ~/.runpod ~/.config/rclone ~/.config/gh "$DEST:/workspace/offload-dsh/secrets/" >> "$LOG" 2>&1

echo "[$STAMP] sovos-backup done (exit $?)" >> "$LOG"
