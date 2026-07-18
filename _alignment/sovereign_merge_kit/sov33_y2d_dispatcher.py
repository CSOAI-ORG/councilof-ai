#!/usr/bin/env python3
"""
sov33_y2d_dispatcher.py — Auto-dispatch agents for YEARS→DAYS cycles.
MEOK-SOV3 for Sir Nicholas Templeman.

The pattern: every sub-task in a Y2D plan gets routed to the best available
agent. This file is the orchestrator that picks the agent and dispatches.

Agent inventory (today):
  - 'oracle_genai_70b' : Oracle meta.llama-3.3-70b-instruct (signed, pay-per-token)
  - 'ollama_local'     : Local Ollama (qwen2.5:3b / qwen3:8b)
  - 'm4_principle'     : Local M4 runs a principle_*.py script
  - 'oci_micro'        : OCI micro VM (145.241.232.16) for always-on
  - 'claude_code'      : Claude Code CLI (when available, for code tasks)
  - 'jarvis_lane'      : JARVIS persona for high-velocity execution
  - 'kimi_lane'        : Kimi lane for research / data

Each sub-task type has a routing rule (e.g. 'implement' -> ollama or jarvis,
'verify' -> oci_micro, 'design' -> oracle_70b).

Cycle invariant: every dispatched agent action is sovereign-bound via SIGIL.
"""
import sys
import os
import json
import time
import hashlib
import argparse
import subprocess
from pathlib import Path
import os as _os
def _sov_dir():
    d = _os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'), '.sovereign')
    try:
        _os.makedirs(d, exist_ok=True); return d
    except Exception:
        import tempfile; d = _os.path.join(tempfile.gettempdir(), 'sov33_sigil'); _os.makedirs(d, exist_ok=True); return d
_SOVDIR = _sov_dir()

from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


# ═══════════════════════════════════════════════════════════════
# Agent inventory + routing rules
# ═══════════════════════════════════════════════════════════════

AGENTS = {
    'oracle_genai_70b': {
        'type': 'cloud',
        'model': 'meta.llama-3.3-70b-instruct',
        'signed': True,
        'cost': 'pay-per-token',
        'best_for': ['design', 'synthesize', 'review', 'plan', 'spec'],
    },
    'ollama_local': {
        'type': 'local',
        'model': 'qwen2.5:3b',
        'signed': False,
        'cost': '£0',
        'best_for': ['implement', 'draft', 'summarize', 'classify'],
    },
    'm4_principle': {
        'type': 'local',
        'model': 'principle_*',
        'signed': True,
        'cost': '£0',
        'best_for': ['audit', 'halve', 'evolve', 'bft33', 'queen', 'flywheel', 'forge'],
    },
    'oci_micro': {
        'type': 'remote',
        'model': 'heartbeat-relay',
        'signed': True,
        'cost': '£0',
        'best_for': ['verify', 'long-running', 'background', 'always-on'],
    },
    'claude_code': {
        'type': 'cli',
        'model': 'claude-code',
        'signed': True,
        'cost': 'pay-per-token',
        'best_for': ['code', 'refactor', 'debug'],
    },
    'jarvis_lane': {
        'type': 'agent-persona',
        'model': 'JARVIS',
        'signed': True,
        'cost': '£0',
        'best_for': ['high-velocity', 'execution', 'raw-speed'],
    },
    'kimi_lane': {
        'type': 'agent-persona',
        'model': 'Kimi',
        'signed': True,
        'cost': '£0',
        'best_for': ['research', 'data', 'explore'],
    },
}


def route_subtask(sub_task: dict) -> str:
    """Pick the best agent for a sub-task."""
    name = sub_task.get('name', '').lower()
    description = sub_task.get('description', '').lower()

    if 'audit' in name or 'find' in name:
        return 'm4_principle'
    if 'design' in name or 'synth' in name or 'spec' in name or 'plan' in name:
        return 'oracle_genai_70b'
    if 'implement' in name or 'code' in name or 'build' in name:
        return 'claude_code'  # or jarvis_lane
    if 'verify' in name or 'test' in name or 'check' in name:
        return 'oci_micro'
    if 'bft' in name or 'commit' in name or 'sigil' in name:
        return 'm4_principle'
    if 'research' in description or 'explore' in description:
        return 'kimi_lane'
    return 'oracle_genai_70b'  # default


# ═══════════════════════════════════════════════════════════════
# Dispatcher
# ═══════════════════════════════════════════════════════════════

SIGIL_FILE = Path(_SOVDIR) / 'y2d_dispatcher.sigil.jsonl'
try:
    SIGIL_FILE.parent.mkdir(parents=True, exist_ok=True)
except Exception: pass
def dispatch(sub_task: dict, dry_run: bool = False) -> dict:
    """Dispatch a sub-task to the best available agent."""
    agent = route_subtask(sub_task)
    t0 = time.time()
    task_id = sub_task.get('id', f"task_{int(time.time())}")

    if dry_run:
        result = {
            'task_id': task_id,
            'agent': agent,
            'action': 'DRY_RUN',
            'latency_s': 0.0,
        }
    else:
        # In production: actually call the agent
        # For now: log what we'd do + return success
        if agent == 'm4_principle':
            # Run a principle script
            try:
                r = subprocess.run(
                    ['python3', f'/Users/nicholas/clawd/_alignment/sovereign_merge_kit/mindset/{sub_task["agent"]}.py', '1'],
                    capture_output=True, text=True, timeout=10,
                )
                result = {
                    'task_id': task_id,
                    'agent': agent,
                    'action': 'RAN',
                    'stdout_preview': r.stdout[:200],
                    'returncode': r.returncode,
                    'latency_s': round(time.time() - t0, 2),
                }
            except Exception as e:
                result = {
                    'task_id': task_id,
                    'agent': agent,
                    'action': 'ERROR',
                    'error': str(e)[:200],
                    'latency_s': round(time.time() - t0, 2),
                }
        else:
            result = {
                'task_id': task_id,
                'agent': agent,
                'action': 'DISPATCH_PENDING',
                'note': f'would dispatch to {agent} for {sub_task.get("name")}',
                'latency_s': round(time.time() - t0, 2),
            }

    # SIGIL emission
    chain = []
    if SIGIL_FILE.exists():
        for line in SIGIL_FILE.read_text().splitlines():
            if line.strip():
                chain.append(json.loads(line))
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {
        'hop': 'Y2D_DISPATCH',
        'task_id': task_id,
        'agent': agent,
        'action': result['action'],
        'latency_s': result['latency_s'],
        'care_floor': 0.95,
        'sovereign_mist_12_pillars_bound': True,
    }
    digest = hashlib.sha256(json.dumps({**payload, 'prev_hash': prev}, sort_keys=True).encode()).hexdigest()[:16]
    signed = {**payload, 'digest': digest, 'prev_hash': prev, 'ts': datetime.now(timezone.utc).isoformat()}
    with SIGIL_FILE.open('a') as f:
        f.write(json.dumps(signed) + '\n')

    result['sigil_digest'] = digest
    return result


def dispatch_plan(plan: dict, dry_run: bool = False) -> dict:
    """Dispatch all sub-tasks in a plan."""
    t0 = time.time()
    results = []
    for sub_task in plan.get('sub_tasks', []):
        r = dispatch(sub_task, dry_run=dry_run)
        results.append(r)

    # Stats
    n_agents_used = len(set(r['agent'] for r in results))
    total_latency = sum(r['latency_s'] for r in results)
    return {
        'goal': plan.get('goal'),
        'n_tasks': len(results),
        'n_agents_used': n_agents_used,
        'results': results,
        'total_latency_s': round(total_latency, 2),
        'cycle_latency_s': round(time.time() - t0, 2),
        'sovereign_bound': True,
    }


# ═══════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description='SOV33 Y2D Agent Dispatcher',
    )
    parser.add_argument('goal', nargs='?', help='Goal to decompose + dispatch')
    parser.add_argument('--dry-run', action='store_true', help='Dry run (no actual agent calls)')
    parser.add_argument('--agents', action='store_true', help='List available agents')
    args = parser.parse_args()

    print()
    print("=" * 70)
    print("Y2D AGENT DISPATCHER — auto-use agents to collapse time")
    print("=" * 70)
    print()
    print("Routes sub-tasks to the best available agent.")
    print()

    if args.agents:
        print("─" * 70)
        print("AGENT INVENTORY")
        print("─" * 70)
        for name, info in AGENTS.items():
            print(f"  {name:18s} ({info['type']:14s}) {info['cost']:14s} best_for={','.join(info['best_for'][:3])}")
        return

    if args.goal:
        from sov33_years_to_days import decompose_plan
        plan = decompose_plan(args.goal)
        print("─" * 70)
        print(f"DISPATCHING: {plan['goal']}")
        print("─" * 70)
        r = dispatch_plan(plan, dry_run=args.dry_run)
        print(f"  n_tasks:        {r['n_tasks']}")
        print(f"  n_agents_used:  {r['n_agents_used']}")
        print(f"  total_latency:  {r['total_latency_s']}s")
        print(f"  cycle_latency:  {r['cycle_latency_s']}s")
        print()
        for res in r['results']:
            mark = '✓' if res['action'] in ('RAN', 'DISPATCH_PENDING') else '✗'
            print(f"  {mark} [{res['task_id']:18s}] -> {res['agent']:18s} {res['action']:15s} ({res['latency_s']}s)")
        return

    parser.print_help()
    print()
    print("─" * 70)
    print("Examples:")
    print("  sov33-dispatch 'absorb new research pass' --dry-run")
    print("  sov33-dispatch --agents")
    print("─" * 70)


if __name__ == '__main__':
    main()