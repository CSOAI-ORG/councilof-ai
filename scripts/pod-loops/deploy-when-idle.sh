#!/bin/bash
# Runs ON THE POD under nohup: waits until no deploy is running, then launches exactly one deploy of master.
for i in $(seq 1 90); do
  n=$(pgrep -f "^bash /workspace/lanes/loops/deploy-prod.sh" | wc -l)
  [ "$n" = "0" ] && break
  sleep 20
done
n=$(pgrep -f "^bash /workspace/lanes/loops/deploy-prod.sh" | wc -l)
[ "$n" = "0" ] || { echo "still busy after wait; not launching"; exit 0; }
: > /workspace/ci/deploy-prod.log
cd /workspace/ci && nohup bash /workspace/lanes/loops/deploy-prod.sh master > /workspace/ci/deploy-prod.stdout 2>&1 < /dev/null &
echo "deploy launched pid $! at $(date -u +%FT%TZ) master=$(git -C /workspace/ci/merge rev-parse --short origin/master 2>/dev/null)"
