#!/bin/bash
# sovos-sync-resume — resumable rsync Mac -> volume with retries (flaky SSH link)
RSYNC=/opt/homebrew/bin/rsync
KEY=~/.runpod/ssh/runpodctl-ssh-key
DEST="root@213.173.105.83"
PORT=17595
SSHOPT="-e ssh -p $PORT -i $KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR -o ConnectTimeout=15 -F /dev/null -o ServerAliveInterval=30 -o ServerAliveCountMax=2"

sync_one() { # $1=src $2=dst $3=extra-excludes
  local src=$1 dst=$2
  for i in 1 2 3 4 5 6; do
    echo "  [try $i] $src -> $dst"
    $RSYNC -a --partial --append-verify --timeout=600 -z $SSHOPT $3 "$src" "$dst" && return 0
    echo "  [try $i failed, backing off 20s]"
    sleep 20
  done
  return 1
}

HARNESS_EXCL="--exclude='**/.git' --exclude='**/node_modules' --exclude='**/.next' --exclude='**/.venv' --exclude='**/__pycache__' --exclude='*.pyc' --exclude='*.safetensors' --exclude='*.gguf' --exclude='**/honey_all_producers.jsonl' --exclude='**/.backups/' --exclude='**/sim-world-data/'"
MIRROR_EXCL="--exclude='**/.git' --exclude='**/node_modules' --exclude='**/.next' --exclude='**/.venv' --exclude='**/__pycache__' --exclude='*.pyc'"

echo "[$(date -u +%H:%M:%S)] HARNESS RESUME"
sync_one ~/clawd/ "$DEST:/workspace/sovos-harness/" "$HARNESS_EXCL" || echo "HARNESS_RESUME_FAILED"
echo "[$(date -u +%H:%M:%S)] MIRROR RESUME"
sync_one ~/clawd/ "$DEST:/workspace/offload-dsh/clawd/" "$MIRROR_EXCL" || echo "MIRROR_RESUME_FAILED"
echo "[$(date -u +%H:%M:%S)] ALL_RESUME_DONE"
