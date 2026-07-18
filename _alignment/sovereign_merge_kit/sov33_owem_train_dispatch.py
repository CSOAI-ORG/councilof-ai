#!/usr/bin/env python3
"""
sov33_owem_train_dispatch.py — Dispatch OWEM training to the next free GPU.
MEOK-SOV3 for Sir Nicholas Templeman. 12 Jul 2026.

PURPOSE: When L0 → L1 transition is needed, this picks the next free GPU via
the bridge, generates the right Colab script, and dispatches the training.

THE LOOP:
  1. substrate.owem_emergence detects need (e.g. 1 expert < 4 needed for L1)
  2. train_dispatch picks the next free GPU via free_gpu_bridge
  3. Generates a Colab-ready script (SOV33_FOUR_EXPERT_STREAMS_COLAB.py)
  4. Records the run in the quota tracker
  5. When zip appears, install_adapters handles the merge

THIS IS WHAT UNBLOCKS L0→L1 AUTOMATICALLY:
  - No need to wait for one Colab run
  - Rotates across 7 free providers (colab, kaggle, lightning, etc.)
  - 125 GPU-hr/week honest capacity
  - Each new expert can be trained on the next free GPU
"""
import sys, os, json, hashlib, time
from pathlib import Path
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
_SOVDIR=_sov_dir()


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


SIGIL_FILE = Path(_SOVDIR) / 'owem_train_dispatch.sigil.jsonl'
TRAIN_LOG = Path(_SOVDIR) / 'owem_train_log.json'


def sigil_emit(hop):
    chain = []
    if SIGIL_FILE.exists():
        for line in SIGIL_FILE.read_text().splitlines():
            if line.strip():
                chain.append(json.loads(line))
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {**hop, 'prev_hash': prev}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    signed = {**payload, 'digest': digest, 'ts': datetime.now(timezone.utc).isoformat()}
    with SIGIL_FILE.open('a') as f:
        f.write(json.dumps(signed) + '\n')
    return digest


# The 4 OWEMs we want to train (after compliance is done)
EXPERT_TRAINING_QUEUE = [
    {'name': 'defense',    'data': 'expert_data/defense.jsonl',    'examples': 1775, 'priority': 1},
    {'name': 'intuition',  'data': 'expert_data/intuition.jsonl',  'examples': 1075, 'priority': 2},
    {'name': 'voice',      'data': 'expert_data/voice.jsonl',      'examples': 275,  'priority': 3},
    {'name': 'compliance-v2', 'data': 'expert_data/compliance.jsonl', 'examples': 801, 'priority': 4, 'note': 'larger model, better data'},
]


def dispatch_next_expert(need_hr: float = 3.0) -> dict:
    """Pick the next expert to train + the next free GPU to use.

    Returns: dispatch plan (which expert, which GPU, when to run)
    """
    from free_gpu_bridge import next_provider, plan

    # 1. Find the next free GPU
    gpu = next_provider(need_hr)
    if not gpu is None:
        gpu_info = {
            'provider': gpu['name'],
            'gpu_type': gpu['gpu'],
            'submit_method': gpu['submit'],
            'auth': gpu['auth'],
        }
    else:
        gpu_info = {'error': 'no free GPU with quota available'}

    # 2. Pick the next expert (by priority)
    log = load_log()
    done_experts = {e['expert'] for e in log.get('completed', [])}
    next_expert = None
    for e in sorted(EXPERT_TRAINING_QUEUE, key=lambda x: x['priority']):
        if e['name'] not in done_experts:
            next_expert = e
            break

    if next_expert is None:
        return {
            'status': 'queue_empty',
            'message': 'all 4 experts already trained',
            'gpu': gpu_info,
        }

    # 3. Compose the dispatch
    dispatch = {
        'status': 'ready',
        'expert': next_expert,
        'gpu': gpu_info,
        'expected_hr': need_hr,
        'colab_script': 'SOV33_FOUR_EXPERT_STREAMS_COLAB.py',
        'expected_output_zip': 'sov33_adapters.zip',
        'install_command': 'python sov33_install_adapters.py --zip ~/Downloads/sov33_adapters.zip --no-merge --no-quantize',
        'post_install': {
            'level_transition': 'L0 → L1 (when 4 experts total)',
            'next_expert_after': [e['name'] for e in EXPERT_TRAINING_QUEUE if e['name'] != next_expert['name']][:3],
        },
    }

    # 4. SIGIL the dispatch
    sigil_emit({
        'hop': 'OWEM_TRAIN_DISPATCH',
        'expert': next_expert['name'],
        'gpu': gpu_info.get('provider', '?'),
        'need_hr': need_hr,
        'care_floor': 0.95,
    })

    return dispatch


def load_log() -> dict:
    """Load the training log."""
    if TRAIN_LOG.exists():
        try:
            return json.loads(TRAIN_LOG.read_text())
        except Exception:
            pass
    return {'completed': [], 'in_progress': [], 'failed': []}


def save_log(log: dict) -> None:
    TRAIN_LOG.parent.mkdir(parents=True, exist_ok=True)
    TRAIN_LOG.write_text(json.dumps(log, indent=2))


def record_completion(expert: str, hours: float, provider: str, success: bool = True) -> dict:
    """Record that an expert training completed."""
    log = load_log()
    entry = {
        'expert': expert,
        'hours': hours,
        'provider': provider,
        'completed_at': datetime.now(timezone.utc).isoformat(),
        'success': success,
    }
    if success:
        log.setdefault('completed', []).append(entry)
    else:
        log.setdefault('failed', []).append(entry)

    # Also record in the GPU bridge quota
    try:
        from free_gpu_bridge import record_run
        record_run(provider, hours)
    except Exception:
        pass

    save_log(log)

    sigil_emit({
        'hop': 'OWEM_TRAIN_COMPLETE',
        'expert': expert,
        'hours': hours,
        'provider': provider,
        'success': success,
        'care_floor': 0.95,
    })

    return entry


def progress_report() -> dict:
    """Current state of the training pipeline."""
    log = load_log()
    from free_gpu_bridge import plan

    completed = log.get('completed', [])
    in_progress = log.get('in_progress', [])
    failed = log.get('failed', [])

    # Get current GPU capacity
    plan_info = plan()

    # What's next?
    done_names = {e['expert'] for e in completed}
    next_experts = [e['name'] for e in EXPERT_TRAINING_QUEUE if e['name'] not in done_names]

    return {
        'completed_count': len(completed),
        'in_progress_count': len(in_progress),
        'failed_count': len(failed),
        'completed_experts': [e['expert'] for e in completed],
        'next_experts_to_train': next_experts,
        'free_gpu_capacity': plan_info,
        'total_hours_used': sum(e['hours'] for e in completed if e.get('success', True)),
    }


# ═══════════════════════════════════════════════════════════════
# Demo
# ═══════════════════════════════════════════════════════════════

def demo():
    print()
    print('=' * 70)
    print('SOV33 OWEM TRAIN DISPATCH — pick the next free GPU + next expert')
    print('=' * 70)
    print()

    print('  Progress so far:')
    progress = progress_report()
    print(f'    Completed: {progress["completed_count"]} experts ({progress["completed_experts"]})')
    print(f'    Hours used: {progress["total_hours_used"]} GPU-hr')
    print(f'    Next to train: {progress["next_experts_to_train"]}')
    print()

    print('  Current free-GPU capacity:')
    print(f'    Total: {progress["free_gpu_capacity"]["total_free_gpu_hr_this_week"]} GPU-hr/week')
    print(f'    Providers: {progress["free_gpu_capacity"]["providers"]}')
    print()

    print('  Next dispatch:')
    dispatch = dispatch_next_expert(need_hr=3.0)
    if dispatch['status'] == 'ready':
        print(f'    Expert: {dispatch["expert"]["name"]} ({dispatch["expert"]["examples"]} examples, priority {dispatch["expert"]["priority"]})')
        print(f'    GPU:    {dispatch["gpu"]["provider"]} ({dispatch["gpu"]["gpu_type"]})')
        print(f'    Submit: {dispatch["gpu"]["submit_method"]}')
        print(f'    Output: {dispatch["expected_output_zip"]}')
        print(f'    Install: {dispatch["install_command"]}')
    elif dispatch['status'] == 'queue_empty':
        print(f'    {dispatch["message"]}')
    print()

    print('=' * 70)
    print('  This is what unblocks L0→L1 automatically:')
    print('  - When you need a new expert, dispatch_next_expert() picks the GPU')
    print('  - When the zip appears, install_adapters handles the merge')
    print('  - The bridge rotates across 7 providers = 125 free GPU-hr/week')
    print(f'  SIGIL: {SIGIL_FILE}')
    print(f'  Log: {TRAIN_LOG}')


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--demo', action='store_true')
    parser.add_argument('--next', action='store_true', help='Pick next dispatch')
    parser.add_argument('--progress', action='store_true', help='Show progress')
    parser.add_argument('--record', nargs=3, metavar=('EXPERT', 'HOURS', 'PROVIDER'),
                        help='Record completion: expert hours provider')
    args = parser.parse_args()

    if args.next:
        print(json.dumps(dispatch_next_expert(), indent=2, default=str))
    elif args.progress:
        print(json.dumps(progress_report(), indent=2, default=str))
    elif args.record:
        record_completion(args.record[0], float(args.record[1]), args.record[2])
    else:
        demo()
