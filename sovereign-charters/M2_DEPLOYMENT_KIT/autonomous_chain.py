#!/usr/bin/env python3
"""CSOAI autonomous chain — 16 scripts in sequence.

Phase 82. Auto-runs every M2 stdlib + sovereign chain script.
Honesty register: stages + emits SIGILs + queues owner actions.
Per EAT_directive_2026-07-02: stage never fire.
"""

import hashlib
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

CLAWD = Path('/Users/nicholas/clawd')
SC = CLAWD / 'sovereign-charters'
M2 = SC / 'M2_DEPLOYMENT_KIT'

PHASES = [
    ('SOV3 OOWM tick',            ['python3', str(M2/'sov3_oowm.py'), '50']),
    ('Watchdog live',             ['python3', str(M2/'watchdog_live.py'), 'stats']),
    ('bridge_think JEEVES',       ['python3', str(M2/'bridge_think.py'), 'JEEVES', 'Daily autonomous chain', 'local_only']),
    ('OSCAL regenerate',          ['python3', str(M2/'oscal_generator.py')]),
    ('Build SOV-20',              ['python3', str(M2/'build_sov20.py')]),
    ('Build SOV-33 master',       ['python3', str(M2/'build_sov33.py')]),
    ('side-by-side T0',           ['python3', str(M2/'side_by_side_test.py'), '--tier', '0', '--limit', '5']),
    ('side-by-side T1',           ['python3', str(M2/'side_by_side_test.py'), '--tier', '1', '--limit', '3']),
    ('side-by-side T2',           ['python3', str(M2/'side_by_side_test.py'), '--tier', '2', '--limit', '5']),
    ('outreach queue',            ['python3', str(M2/'outreach_queue.py')]),
    ('sovereignty_index',         ['python3', str(M2/'sovereignty_index.py'), '--self-test']),
    ('trust_score',               ['python3', str(M2/'trust_score.py'), '--self-test']),
    ('compliance_calculator',     ['python3', str(M2/'compliance_calculator.py'), '--self-test']),
    ('jurisdiction_mapper',       ['python3', str(M2/'jurisdiction_mapper.py'), '--self-test']),
    ('verify alignment',          ['python3', str(SC/'VERIFY_ALIGNMENT.py')]),
    ('m2_m4 orchestrator',        ['python3', str(M2/'m2_m4_orchestrator.py')]),
]


def emit_sigil(line: str) -> str:
    ts = datetime.now(timezone.utc).isoformat()
    log = SC / 'SIGIL_LOG.txt'
    h = hashlib.sha256(f'{line}|{ts}'.encode()).hexdigest()[:32]
    with open(log, 'a') as f:
        f.write(f'{ts} | {h} | {line}\n')
    return h


def run_phase(name, cmd, idx, total):
    print(f'\n[{idx:2d}/{total}] {name}', flush=True)
    print(f'        $ {" ".join(cmd)}', flush=True)
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=str(SC), timeout=180)
        ok = result.returncode == 0
        print(f'        => {"OK" if ok else "FAIL"} ({result.returncode})', flush=True)
        return ok
    except subprocess.TimeoutExpired:
        print(f'        => TIMEOUT', flush=True)
        return False
    except Exception as e:
        print(f'        => ERROR {e}', flush=True)
        return False


def main():
    started = datetime.now(timezone.utc).isoformat()
    print('=' * 80)
    print('🐉 CSOAI autonomous chain — 16 scripts in sequence')
    print(f'   Started: {started}')
    print(f'   Phases:  {len(PHASES)}')
    print('=' * 80)

    sigs = []
    for i, (name, cmd) in enumerate(PHASES, 1):
        ok = run_phase(name, cmd, i, len(PHASES))
        sig = emit_sigil(f'M|JEEVES|csoai|autonomous-chain[{i}/{len(PHASES)}] {name} {"OK" if ok else "FAIL"}')
        sigs.append((name, ok, sig))

    finished = datetime.now(timezone.utc).isoformat()
    ok_count = sum(1 for _, ok, _ in sigs if ok)
    master_line = f'M|JEEVES|csoai|AUTONOMOUS-CHAIN COMPLETE. {ok_count}/{len(PHASES)} phases OK. Started {started}. Finished {finished}.'
    master_sig = emit_sigil(master_line)

    print('\n' + '=' * 80)
    print(f'🐉 AUTONOMOUS-CHAIN COMPLETE')
    print(f'   {ok_count}/{len(PHASES)} phases OK')
    print(f'   Master SIGIL: {master_sig}')
    print('=' * 80)
    print('\n[Owner-Gated] Vercel deploy queued (needs owner).')
    print('[Owner-Gated] git commit + push queued (needs owner).')


if __name__ == '__main__':
    main()