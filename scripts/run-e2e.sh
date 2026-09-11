#!/bin/bash
# run-e2e — FINISH THE MOVE: harness sync -> provision (git birth+push, cron, train, proof EAT) -> verify.
set -e
KEY=~/.runpod/ssh/runpodctl-ssh-key
PORT=17595
HOST=root@213.173.105.83
R=/opt/homebrew/bin/rsync
SSH="-e ssh -p $PORT -i $KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR -o ConnectTimeout=15 -F /dev/null -o ServerAliveInterval=30 -o ServerAliveCountMax=2"
EXCL="--exclude=**/.git --exclude=**/node_modules --exclude=**/.next --exclude=**/.venv --exclude=**/__pycache__ --exclude=*.pyc --exclude=*.safetensors --exclude=*.gguf --exclude=**/honey_all_producers.jsonl --exclude=**/.backups/ --exclude=**/sim-world-data/"

echo "[$(date -u +%H:%M:%S)] HARNESS SYNC"
for i in $(seq 1 8); do
  echo "[try $i]"
  $R -a --partial --append-verify --timeout=600 -z $SSH $EXCL ~/clawd/ "$HOST:/workspace/sovos-harness/" && break
  sleep 25
done

echo "[$(date -u +%H:%M:%S)] PROVISION"
scp -P $PORT -i $KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o UserKnownHostsFile=/dev/null -F /dev/null \
  /Users/nicholas/clawd/scripts/sovos-pod-provision.sh "$HOST:/workspace/sovos-pod-provision.sh" 2>&1 | tail -1
ssh -p $PORT -i $KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o UserKnownHostsFile=/dev/null -F /dev/null "$HOST" \
  'bash /workspace/sovos-pod-provision.sh' 2>&1 | tail -20

echo "[$(date -u +%H:%M:%S)] VERIFY"
ssh -p $PORT -i $KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o UserKnownHostsFile=/dev/null -F /dev/null "$HOST" '
  cd /workspace/sovos-harness
  echo "--- git ---"; git log --oneline -2 2>/dev/null; git remote -v | head -1
  echo "--- cron ---"; crontab -l 2>/dev/null | grep -c sovos-eat
  echo "--- logs ---"; ls /workspace/eat-logs/ 2>/dev/null | head -8
  echo "--- train ---"; tail -3 /workspace/eat-logs/train-v2.log 2>/dev/null | head -3' 2>&1 | tail -20
echo "[$(date -u +%H:%M:%S)] E2E_DONE"
