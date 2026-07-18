#!/bin/bash
# sov33_overnight_cron.sh — full overnight tick (every 10 min)

unset PYTHONPATH
LOG=~/.sovereign/logs/sov33-overnight.log
mkdir -p ~/.sovereign/logs
echo "[$(date)] === OVERNIGHT CRON START ===" >> $LOG

# 0. OWEM emergence (capture substrate growth)
~/.sovereign/ml-venv/bin/python /Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov33_owem_emergence.py --quiet >> $LOG 2>&1

# 1. Check if we need to train new expert (auto-dispatch L0->L1)
~/.sovereign/ml-venv/bin/python -c "
import sys
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')
import sov33
r = sov33.capability_owem_train_dispatch('progress')
if r.get('completed_count', 0) < 4:
    d = sov33.capability_owem_train_dispatch('next')
    if d.get('status') == 'ready':
        print(f'AUTO-DISPATCH: train {d[\"expert\"][\"name\"]} on {d[\"gpu\"][\"provider\"]}')
" >> $LOG 2>&1

# 2. Live tool awareness (rediscover surface)
~/.sovereign/ml-venv/bin/python /Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov33_live_tool_awareness.py --quiet >> $LOG 2>&1

# 3. Substrate explorer
~/.sovereign/ml-venv/bin/python /Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov33_substrate_explorer.py --quiet >> $LOG 2>&1

# 4. Growth controller
~/.sovereign/ml-venv/bin/python /Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov33_growth_controller.py --quiet >> $LOG 2>&1

# 5. OWEM world model step
~/.sovereign/ml-venv/bin/python /Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov33_owem_world_model.py --steps 5 --quiet --output /tmp/owem_step.json >> $LOG 2>&1

# 6. License audit
~/.sovereign/ml-venv/bin/python /Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov33_license_audit.py --tier paid_tier --quiet >> $LOG 2>&1

# 7. Label balancer
~/.sovereign/ml-venv/bin/python /Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov33_label_balancer.py --quiet >> $LOG 2>&1

# 8. Retrain
~/.sovereign/ml-venv/bin/python /Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov33_retrain_loop.py --quiet >> $LOG 2>&1

# 9. Free GPU bridge check (verify capacity)
~/.sovereign/ml-venv/bin/python -c "
import sys
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')
import sov33
r = sov33.capability_free_gpu('plan')
print(f'Free GPU capacity: {r.get(\"total_free_gpu_hr_this_week\", 0)} GPU-hr/week')
" >> $LOG 2>&1

# 10. Zip watcher (separate process, this just confirms it's running)
ps -p $(cat /tmp/zip_watcher.pid 2>/dev/null) >/dev/null 2>&1 || echo "zip_watcher not running!" >> $LOG

echo "[$(date)] === OVERNIGHT CRON DONE ===" >> $LOG
