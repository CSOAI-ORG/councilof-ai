#!/bin/bash
# sovos-finalize — waits out SSH cooldown, then provisions the estate on the volume:
# monorepo git birth + GitHub push, remote EAT cron, SFT v2 training, proof EAT cycle.
set -e
KEY=~/.runpod/ssh/runpodctl-ssh-key
PORT=17595
HOST=root@213.173.105.83

echo "[$(date -u +%H:%M:%S)] waiting for pod SSH to recover (30 min cap)..."
ok=0
for i in $(seq 1 30); do
  if ssh -p $PORT -i $KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -F /dev/null $HOST 'echo UP' >/dev/null 2>&1; then
    ok=1; echo "[$(date -u +%H:%M:%S)] pod UP (try $i)"; break
  fi
  echo "[$(date -u +%H:%M:%S)] try $i: not yet"; sleep 60
done
[ "$ok" = 1 ] || { echo "POD_STILL_DOWN — leaving for next cycle"; exit 1; }

# 1) finish harness+mirror syncs with retry loop
/Users/nicholas/clawd/scripts/sovos-sync-resume.sh

# 2) provision (git birth, cron, train, proof EAT)
scp -P $PORT -i $KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o UserKnownHostsFile=/dev/null \
  /Users/nicholas/clawd/scripts/sovos-pod-provision.sh $HOST:/workspace/sovos-pod-provision.sh
ssh -p $PORT -i $KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o UserKnownHostsFile=/dev/null $HOST \
  'bash /workspace/sovos-pod-provision.sh' || echo "PROVISION_RUN_REPORTED_ERR"

echo "[$(date -u +%H:%M:%S)] FINALIZE_DONE"
