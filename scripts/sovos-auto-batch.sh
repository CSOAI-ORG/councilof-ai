#!/bin/bash
# sovos-auto-batch — wave executor (Mac orchestrator). Wave 0: LOCK THE MOVE.
# Follows _alignment/NEXT_100_MOVES_v2_2026-08-23.md; logs to auto-batch.log.
LOG=~/clawd/_alignment/auto-batch.log
SSH="ssh -F /dev/null -p 17595 -i ~/.runpod/ssh/runpodctl-ssh-key -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=12"
POD=root@213.173.105.83

echo "[$(date -u +%H:%M:%S)] ===== WAVE 0: LOCK THE MOVE =====" >> $LOG

# 1) poll rebuild.log for REBUILD_OK (30 min cap)
ok=0
for i in $(seq 1 30); do
  if $SSH $POD 'grep -q REBUILD_OK /workspace/eat-logs/rebuild.log 2>/dev/null' 2>/dev/null; then ok=1; echo "[1] REBUILD_OK (try $i)" >> $LOG; break; fi
  if $SSH $POD 'grep -q REBUILD_START /workspace/eat-logs/rebuild.log 2>/dev/null' 2>/dev/null; then echo "[1] rebuilding... (try $i)" >> $LOG; fi
  sleep 60
done
[ $ok = 1 ] || echo "[1] REBUILD NOT OK after 30 min — CHECK rebuild.log" >> $LOG

# 2) push head
echo "[2] remote main: $($SSH $POD 'cd /workspace/sovos-harness 2>/dev/null && git ls-remote --heads origin main 2>/dev/null | head -1' 2>/dev/null)" >> $LOG

# 3) corpus bytes
echo "[3] corpus bytes: $($SSH $POD 'wc -c /workspace/sovos-harness/csoai-static-deploy2/sov_grpo_training_data.json 2>/dev/null' 2>/dev/null)" >> $LOG

# 4) launch training (watchdog backs it hourly)
$SSH $POD 'cd /workspace/sovos-harness/csoai-static-deploy2 2>/dev/null && setsid nohup /workspace/offload-dsh/eatenv/bin/python sov_minimal_train.py --steps 150 --output sov-minimal-output-v2 >> /workspace/eat-logs/train-v2.log 2>&1 & echo training-launched' >> $LOG 2>&1

# 5) proof EAT cycle
$SSH $POD 'setsid nohup /workspace/sovos-eat.sh >> /workspace/eat-logs/proof-eat-$(date -u +%Y%m%d-%H%M).log 2>&1 & echo eat-launched' >> $LOG 2>&1

# 6) restore drill marker (wave 1 enters on next session)
echo "[$(date -u +%H:%M:%S)] ===== WAVE 0 DONE (verify above; WAVE 1 gateway-v2 next) =====" >> $LOG
