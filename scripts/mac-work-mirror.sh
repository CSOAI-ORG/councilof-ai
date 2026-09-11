#!/bin/bash
# mac-work-mirror.sh — the estate backup procedure: continuously mirror ALL new work
# from the Mac to the RunPod RAG volume (sink pod) so nothing lives only on the Mac.
# Owner directive 2026-08-23: "all work OFF mac to runpod/oracle + backup procedure;
# WE WORK FROM THERE NOT MY MACBOOK."
#
# Mirrors:
#   ~/.grokbot/harness/mine        → /workspace/RAG/mac-migrate/mine-harness
#   ~/clawd/csoai-static-deploy2/EAT* → /workspace/RAG/mac-migrate/eat-stack
#   ~/clawd/kimi-regen/_plans      → /workspace/RAG/mac-migrate/plans
#   ~/clawd/kimi-regen/SOVOS       → /workspace/RAG/mac-migrate/sovos
#   ~/clawd/councilof-ai/docs      → /workspace/RAG/mac-migrate/repo-docs
#   ~/clawd/_evacuation            → /workspace/RAG/mac-migrate/evacuation
# Log: /tmp/mac-work-mirror.log (also appended to /tmp/mac-drain.log)
export PATH="/opt/homebrew/bin:$PATH"
KEY="$HOME/.runpod/ssh/runpodctl-ssh-key"
PORT=17595
LOG=/tmp/mac-work-mirror.log
DEST="/workspace/RAG/mac-migrate"
TS() { date "+%Y-%m-%dT%H:%M:%S"; }

sync_dir() { # $1=local $2=pod-target
  local src="$1" tgt="$2" attempt=0
  [ -d "$src" ] || { echo "$(TS) SKIP (no dir) $src" >> "$LOG"; return 0; }
  while [ $attempt -lt 3 ]; do
    attempt=$((attempt+1))
    /opt/homebrew/bin/rsync -az --partial --inplace --timeout=120 \
      -e "ssh -i $KEY -p $PORT -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=10 -o ServerAliveInterval=20 -o ServerAliveCountMax=3" \
      "$src/" "root@213.173.105.83:$tgt/" >> "$LOG" 2>&1
    local rc=$?
    if [ $rc -eq 0 ]; then
      echo "$(TS) OK $src" >> "$LOG"
      return 0
    fi
    echo "$(TS) RETRY $src rc=$rc (attempt $attempt)" >> "$LOG"
    sleep 5
  done
  echo "$(TS) FAILED $src after 3 attempts" >> "$LOG"
}

echo "$(TS) ==== WORK-MIRROR START ====" >> "$LOG"
sync_dir "$HOME/.grokbot/harness/mine"            "$DEST/mine-harness"
sync_dir "$HOME/clawd/kimi-regen/_plans"          "$DEST/plans"
sync_dir "$HOME/clawd/kimi-regen/SOVOS"           "$DEST/sovos"
sync_dir "$HOME/clawd/councilof-ai/docs"          "$DEST/repo-docs"
sync_dir "$HOME/clawd/_evacuation"                "$DEST/evacuation"
sync_dir "$HOME/clawd/csoai-static-deploy2/EAT_STATUS.md"  "$DEST/eat-stack" 2>/dev/null || true
# EAT stack source files (only the scripts, not the multi-GB repo)
for f in eat_stack.py eat_govbench.py eat_run_local.py eat_all.py govbench_eval.py compbench_local.py EAT_MASTER_MINING.md EAT_ACTION_PLAN.md; do
  [ -f "$HOME/clawd/csoai-static-deploy2/$f" ] && \
    /opt/homebrew/bin/rsync -az --partial --timeout=120 \
      -e "ssh -i $KEY -p $PORT -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=10" \
      "$HOME/clawd/csoai-static-deploy2/$f" "root@213.173.105.83:$DEST/eat-stack/" >> "$LOG" 2>&1
done
echo "$(TS) ==== WORK-MIRROR COMPLETE ====" >> "$LOG"
