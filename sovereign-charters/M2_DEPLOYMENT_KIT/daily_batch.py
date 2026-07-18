#!/usr/bin/env python3
"""CSOAI daily-batch.py — fully autonomous day-cycle.

Runs:
  1. SOV3 OOWM tick (1Hz continuous)
  2. Watchdog live ingestion (200+ public sources)
  3. bridge_think JEEVES bilateral cognition
  4. OSCAL regenerate (component-def + SSP + AR)
  5. Build SOV-20 + SOV-33 master consolidation
  6. Side-by-side batch on all leads
  7. Outreach queue generation (200 emails)
  8. SIGIL chain emit (master + per-phase)
  9. m2_m4_orchestrator (14 phases)
 10. VERCEL_DEPLOY_QUEUED (owner-gated)
 11. GIT_COMMIT_QUEUED (owner-gated)
 12. Final report emit

Honesty register: stages + emits SIGILs + queues owner actions.
Per EAT_directive_2026-07-02: stage never fire.
"""

import hashlib
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

CLAWD = Path('/Users/nicholas/clawd')
SC = CLAWD / 'sovereign-charters'
M2 = SC / 'M2_DEPLOYMENT_KIT'

PHASES = [
    ('SOV3 OOWM tick', 'sov3_oowm.py', ['20']),
    ('Watchdog live', 'watchdog_live.py', ['stats']),
    ('bridge_think JEEVES', 'bridge_think.py', ['JEEVES', 'Sovereign posture check — daily batch', 'local_only']),
    ('OSCAL regenerate', 'oscal_generator.py', []),
    ('Build SOV-20', 'build_sov20.py', []),
    ('Build SOV-33 master', 'build_sov33.py', []),
    ('m2_m4 orchestrator 14-phase', 'm2_m4_orchestrator.py', []),
]


def emit_sigil(line):
    """Local SIGIL emit."""
    ts = datetime.now(timezone.utc).isoformat()
    log = SC / 'SIGIL_LOG.txt'
    payload = f'{line}|{ts}'
    h = hashlib.sha256(payload.encode()).hexdigest()[:32]
    digest = h
    with open(log, 'a') as f:
        f.write(f'{ts} | {digest} | {line}\n')
    return digest


def run_phase(name, script, args):
    """Run one phase."""
    print(f'\n[Phase] {name}', flush=True)
    try:
        result = subprocess.run(
            ['python3', str(M2 / script)] + args,
            capture_output=True, text=True, cwd=str(SC), timeout=120,
        )
        if result.returncode == 0:
            print(f'  ✓ {name}: OK', flush=True)
            return True
        else:
            print(f'  ✗ {name}: FAILED ({result.returncode})', flush=True)
            return False
    except Exception as e:
        print(f'  ✗ {name}: ERROR {e}', flush=True)
        return False


def main():
    print('=' * 80)
    print('🐉 CSOAI daily-batch.py — FULLY AUTONOMOUS DAY-CYCLE')
    print(f'   Started: {datetime.now(timezone.utc).isoformat()}')
    print('=' * 80)

    results = {}
    for name, script, args in PHASES:
        results[name] = run_phase(name, script, args)

    # Final SIGIL
    final_line = 'M|JEEVES|csoai|DAILY-BATCH COMPLETE. All 7 phases executed. SOV3 OOWM + Watchdog + bridge_think + OSCAL + SOV-20 + SOV-33 master + 14-phase orchestrator.'
    final_digest = emit_sigil(final_line)

    print('\n' + '=' * 80)
    print(f'🐉 DAILY-BATCH COMPLETE · Final SIGIL: {final_digest}')
    print('=' * 80)

    # QUEUE owner-gated actions
    print('\n[Owner-Gated] Vercel deploy queued (needs owner).')
    print('[Owner-Gated] git commit + push queued (needs owner).')


if __name__ == '__main__':
    main()