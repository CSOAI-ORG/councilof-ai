#!/usr/bin/env python3
"""daily_research_loop.py — cron-friendly daily research + retrain.

Runs every day (or on-demand). Pulls fresh arXiv, scans for new frameworks,
rebuilds cross-walk candidates, re-trains SOV, emits SIGIL.

Usage:
  python3 daily_research_loop.py [--no-fetch] [--no-train]

Default: fetch fresh data + re-train + emit SIGIL.
"""

import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

SC = Path('/Users/nicholas/clawd/sovereign-charters')
M2 = SC / 'M2_DEPLOYMENT_KIT'

now = datetime.now(timezone.utc).isoformat()
print(f'🌀 DAILY RESEARCH LOOP — {now}\n{"="*60}')


def run(script_name):
    print(f'\n▶ {script_name}')
    try:
        result = subprocess.run(['python3', str(M2 / script_name)], capture_output=True, text=True, timeout=600)
        if result.returncode == 0:
            # Show last 8 lines
            lines = result.stdout.strip().split('\n')
            for l in lines[-8:]:
                print(f'    {l}')
        else:
            print(f'    ✗ exit {result.returncode}')
            print(f'    {result.stderr[-300:]}')
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        print(f'    ✗ TIMEOUT')
        return False
    except Exception as e:
        print(f'    ✗ {e}')
        return False


flags = set(sys.argv[1:])

# Phase 1: research ingest (cheap, finds new candidates)
if '--no-research' not in flags:
    run('research_ingest.py')

# Phase 2: deep research wave (heavier — 744 papers)
if '--no-deep' not in flags:
    run('deep_research_wave2.py')

# Phase 3: cross-walk graph
if '--no-crosswalk' not in flags:
    run('crosswalk_generator.py')

# Phase 4: vendor research
if '--no-vendor' not in flags:
    run('vendor_research.py')

# Phase 5: SOV retrain
if '--no-train' not in flags:
    run('sov_train.py')

# Phase 6: weekly report
run('weekly_report.py')

# Master SIGIL
import hashlib
master_sigil = hashlib.sha256(f'daily-loop|{now}'.encode()).hexdigest()[:32]
with open(SC / 'SIGIL_LOG.txt', 'a') as f:
    f.write(f'{now} | {master_sigil} | M|JEEVES|csoai|DAILY-RESEARCH-LOOP COMPLETE. research + deep + crosswalk + vendor + sov_train + weekly_report all run.\n')

print(f'\n{"="*60}')
print(f'🐉 DAILY RESEARCH LOOP COMPLETE')
print(f'   Master SIGIL: {master_sigil}')
print(f'{"="*60}')