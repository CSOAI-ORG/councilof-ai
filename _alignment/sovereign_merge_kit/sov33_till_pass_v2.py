#!/usr/bin/env python3
"""
sov33_till_pass_v2.py — The V2 optimizer with REAL model data.
MEOK-SOV3 for Sir Nicholas Templeman.

Uses sov33_model_registry.REGISTRY (61 verified open-source models) as the
brain pool, instead of the placeholder values in sov33_4brain.py.

Each "brain" in the federation is a real model with real parameters,
real license, real cost, real latency. The optimizer picks the best
subset of brains + BFT config + care + sigil to maximize the score.

Sovereign-safe filter applied by default (sovereign_safe=True).
"""
import sys
import os
import json
import time
import math
import hashlib
import random
import argparse
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sov33_model_registry import (
    REGISTRY, list_sovereign_safe, total_aggregate,
)
from sov33_4brain import BFT_CONFIGS
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
_SOVDIR=_sov_dir()


# Real sigil emit
def sigil_emit(hop):
    SIGIL_FILE = Path(_SOVDIR) / 'till_pass_v2.sigil.jsonl'
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


CARE_FLOOR = 0.95
LOG_FILE = Path(_SOVDIR) / 'till_pass_v2.jsonl'
LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
BEST_FILE = Path(_SOVDIR) / 'till_pass_v2_best.json'

CARE_OPTIONS = ['raw', 'derived', 'conformal', 'conformal_mapie', 'multi_lineage']
SIGIL_OPTIONS = ['hash_only', 'hash_ed25519', 'hash_ots', 'hash_sigstore']
BFT_OPTIONS = list(BFT_CONFIGS.keys())


def get_brain_aggregate(brain_names: list) -> dict:
    """Sum aggregate parameters for a list of brain names from the real registry."""
    return total_aggregate(brain_names)


def evaluate_config(brain_names: list, bft: str, care: str, sigil: str) -> dict:
    """Evaluate a config using REAL model data."""
    agg = total_aggregate(brain_names)
    total_B = agg['total_aggregate_B']
    active_B = agg['total_active_B']
    cost = agg['cost_per_call']
    lat = agg['latency_max_s']

    # Sovereign filtering
    unsafe = [n for n in brain_names if not REGISTRY.get(n, {}).get('sovereign_safe', True)]
    if unsafe:
        # Penalize unsafe brains heavily
        return {
            'brain_names': brain_names,
            'total_B': total_B,
            'unsafe_brains': unsafe,
            'sovereignty': 0.0,
            'final_score': 0.0,
            'goal_reached': False,
        }

    # BFT config
    bft_cfg = BFT_CONFIGS[bft]
    lat *= bft_cfg['latency_mult']

    # Care modifier
    care_mod = {
        'raw': 0.6, 'derived': 0.8,
        'conformal': 0.95, 'conformal_mapie': 0.95, 'multi_lineage': 0.9,
    }[care]
    sigil_mod = {
        'hash_only': 0.6, 'hash_ed25519': 0.85,
        'hash_ots': 0.9, 'hash_sigstore': 0.95,
    }[sigil]
    sovereignty = (care_mod + sigil_mod) / 2.0 * bft_cfg['sovereignty_boost']

    # Quality: based on the biggest brain in the federation
    biggest = max((REGISTRY[n] for n in brain_names if n in REGISTRY), key=lambda x: x['params_total_B'], default={'params_active_B': 0})
    quality = min(1.0, biggest['params_active_B'] / 100.0)  # 100B+ = perfect

    # Aggregate score
    agg_score = min(1.0, total_B / 3400.0)

    # Cost + latency score
    cost_score = max(0, 1.0 - cost * 30)
    latency_score = max(0, 1.0 - lat / 10.0)

    # Final score: 70% agg + 20% quality + 5% sov + 3% cost + 2% latency
    final = (
        0.7 * agg_score +
        0.2 * quality +
        0.05 * sovereignty +
        0.03 * cost_score +
        0.02 * latency_score
    )

    return {
        'brain_names': brain_names,
        'n_brains': len(brain_names),
        'total_B': total_B,
        'total_T': round(total_B / 1000, 3),
        'active_B': active_B,
        'pct_of_3_4T': round(min(100, total_B / 34.0), 2),
        'quality': round(quality, 4),
        'sovereignty': round(sovereignty, 4),
        'cost_per_call': round(cost, 4),
        'latency_s': round(lat, 2),
        'bft': bft,
        'care': care,
        'sigil': sigil,
        'final_score': round(final, 4),
        'goal_reached': (
            final >= 0.94
            and total_B >= 3400  # at or surpass 3.4T
            and sovereignty >= 0.9
        ),
    }


def mutate_brain_list(brain_list: list, n_mutations: int = 1) -> list:
    """Mutate the brain list: add, remove, or replace a brain."""
    safe_models = list(list_sovereign_safe().keys())
    new_list = list(brain_list)
    for _ in range(n_mutations):
        op = random.choice(['add', 'remove', 'replace', 'upgrade', 'downgrade'])
        if op == 'add' and len(new_list) < 20:
            new_brain = random.choice(safe_models)
            if new_brain not in new_list:
                new_list.append(new_brain)
        elif op == 'remove' and len(new_list) > 2:
            new_list.pop(random.randint(0, len(new_list) - 1))
        elif op == 'replace' and new_list:
            idx = random.randint(0, len(new_list) - 1)
            new_brain = random.choice(safe_models)
            new_list[idx] = new_brain
        elif op == 'upgrade' and new_list:
            # Replace a small brain with a bigger one
            idx = random.randint(0, len(new_list) - 1)
            current = new_list[idx]
            current_total = REGISTRY.get(current, {}).get('params_total_B', 0)
            candidates = [
                (n, m['params_total_B'])
                for n, m in REGISTRY.items()
                if m.get('sovereign_safe', False) and m['params_total_B'] > current_total * 1.5
            ]
            if candidates:
                new_list[idx] = max(candidates, key=lambda x: x[1])[0]
        elif op == 'downgrade' and new_list:
            # Replace a big brain with a smaller one
            idx = random.randint(0, len(new_list) - 1)
            current = new_list[idx]
            current_total = REGISTRY.get(current, {}).get('params_total_B', 0)
            candidates = [
                (n, m['params_total_B'])
                for n, m in REGISTRY.items()
                if m.get('sovereign_safe', False) and 0 < m['params_total_B'] < current_total * 0.5
            ]
            if candidates:
                new_list[idx] = random.choice(candidates)[0]
    return new_list


def mutate_other(config: dict, n_mutations: int = 1) -> dict:
    new_config = dict(config)
    for _ in range(n_mutations):
        axis = random.choice(['bft', 'care', 'sigil'])
        if axis == 'bft':
            new_config['bft'] = random.choice(BFT_OPTIONS)
        elif axis == 'care':
            new_config['care'] = random.choice(CARE_OPTIONS)
        elif axis == 'sigil':
            new_config['sigil'] = random.choice(SIGIL_OPTIONS)
    return new_config


def till_pass_v2(
    max_iterations: int = 200,
    patience: int = 30,
    initial_brains: list = None,
    initial_bft: str = 'bft_33',
    initial_care: str = 'conformal',
    initial_sigil: str = 'hash_sigstore',
    verbose: bool = True,
) -> dict:
    """The V2 loop with real model data."""
    if initial_brains is None:
        # Warm start: top sovereign-safe frontier + production
        initial_brains = [
            'deepseek_v4_pro', 'mimo_v2_5_pro', 'kimi_k2_6', 'deepseek_v3',
            'mistral_large_123b', 'qwen3_235b', 'mixtral_8x22b', 'cohere_plus_104b',
            'qwen3_6_35b_a3b', 'qwen3_8b', 'qwen2_5_3b', 'gemma_3_27b',
        ]

    best_config = {
        'brains': initial_brains,
        'bft': initial_bft,
        'care': initial_care,
        'sigil': initial_sigil,
    }
    best_result = evaluate_config(best_config['brains'], best_config['bft'],
                                   best_config['care'], best_config['sigil'])
    best_score = best_result['final_score']
    no_improve = 0
    history = []
    t0 = time.time()

    if verbose:
        print()
        print("=" * 70)
        print("TILL-PASS V2 — real model data from sov33_model_registry")
        print("=" * 70)
        print()
        print(f"Initial: {len(initial_brains)} brains, {best_result['total_T']}T aggregate")
        print(f"  Score: {best_score:.4f}, sovereignty: {best_result['sovereignty']:.2f}")
        print(f"  pct_of_3_4T: {best_result['pct_of_3_4T']}%, cost: ${best_result['cost_per_call']:.4f}, lat: {best_result['latency_s']:.1f}s")
        print()

    for it in range(max_iterations):
        temperature = max(0.05, 1.0 * (0.99 ** it))

        # Mutate: 70% chance brain list, 30% other axes
        if random.random() < 0.7:
            new_brains = mutate_brain_list(best_config['brains'], n_mutations=1)
            new_config = dict(best_config)
            new_config['brains'] = new_brains
        else:
            new_config = mutate_other(best_config, n_mutations=1)
            new_brains = new_config['brains']

        result = evaluate_config(
            new_brains, new_config['bft'], new_config['care'], new_config['sigil']
        )
        score = result['final_score']
        delta = score - best_score

        # Accept
        if delta > 0 or random.random() < math.exp(delta / temperature):
            accepted = True
            if delta > 0:
                best_config = new_config
                best_score = score
                best_result = result
                no_improve = 0
            else:
                no_improve += 1
        else:
            accepted = False
            no_improve += 1

        history.append(result)
        with LOG_FILE.open('a') as f:
            f.write(json.dumps({
                'iter': it,
                'config': new_config,
                'score': score,
                'accepted': accepted,
                'delta': delta,
                'total_T': result.get('total_T', 0),
                'pct_of_3_4T': result.get('pct_of_3_4T', 0),
                'timestamp': datetime.now(timezone.utc).isoformat(),
            }) + '\n')

        if best_result.get('goal_reached', False):
            if verbose:
                print(f"  [{it:4d}] *** GOAL REACHED ***")
                print(f"  [{it:4d}] score={best_score:.4f}, total={best_result['total_T']}T ({best_result['pct_of_3_4T']}% of 3.4T)")
            break

        if no_improve >= patience:
            # Big mutation
            new_brains = mutate_brain_list(best_config['brains'], n_mutations=3)
            new_config['brains'] = new_brains
            no_improve = 0
            if verbose:
                print(f"  [{it:4d}] no improvement for {patience} iter, big mutation")

        if verbose and (it % 10 == 0 or it < 5):
            print(f"  [{it:4d}] best={best_score:.4f}, this={score:.4f}, "
                  f"total={best_result['total_T']}T ({best_result['pct_of_3_4T']}%), "
                  f"temp={temperature:.3f}, acc={accepted}")

    t1 = time.time()
    elapsed = round(t1 - t0, 2)

    sigil_emit({
        'hop': 'TILL_PASS_V2_BEST',
        'n_iterations': it + 1,
        'elapsed_s': elapsed,
        'best_score': best_score,
        'total_T': best_result['total_T'],
        'pct_of_3_4T': best_result['pct_of_3_4T'],
        'sovereignty': best_result['sovereignty'],
        'n_brains': best_result['n_brains'],
        'goal_reached': best_result.get('goal_reached', False),
        'care_floor': 0.95,
        'sovereign_mist_12_pillars_bound': True,
    })

    BEST_FILE.write_text(json.dumps({
        'best_config': best_config,
        'best_score': best_score,
        'best_result': best_result,
        'n_iterations': it + 1,
        'elapsed_s': elapsed,
        'goal_reached': best_result.get('goal_reached', False),
        'mixer_version': '2.0 (real registry)',
    }, indent=2))

    if verbose:
        print()
        print("=" * 70)
        print("FINAL — TILL-PASS V2")
        print("=" * 70)
        print(f"  Iterations:   {it + 1}")
        print(f"  Elapsed:      {elapsed}s")
        print(f"  Best score:   {best_score:.4f}")
        print(f"  Total:        {best_result['total_T']}T ({best_result['pct_of_3_4T']}% of 3.4T)")
        print(f"  Active:       {best_result['active_B']}B")
        print(f"  Sovereignty:  {best_result['sovereignty']:.2f}")
        print(f"  Cost/call:    ${best_result['cost_per_call']:.4f}")
        print(f"  Latency:      {best_result['latency_s']:.2f}s")
        print(f"  N brains:     {best_result['n_brains']}")
        print()
        print(f"  Config: bft={best_config['bft']}, care={best_config['care']}, sigil={best_config['sigil']}")
        print(f"  Brains:")
        for b in best_config['brains']:
            m = REGISTRY.get(b, {})
            print(f"    - {b:30s} {m.get('params_active_B', 0):6.1f}/{m.get('params_total_B', 0):6.1f}B")
        if best_result.get('goal_reached', False):
            print()
            print("  *** GOAL REACHED — HIT OR SURPASSED 3.4T ***")
        print()

    return {
        'best_config': best_config,
        'best_score': best_score,
        'best_result': best_result,
        'iterations': it + 1,
        'elapsed_s': elapsed,
    }


# CLI
def main():
    parser = argparse.ArgumentParser(description='SOV33 Till-Pass V2 with real model registry')
    parser.add_argument('--max-iters', type=int, default=500)
    parser.add_argument('--patience', type=int, default=50)
    parser.add_argument('--quiet', action='store_true')
    args = parser.parse_args()

    return till_pass_v2(
        max_iterations=args.max_iters,
        patience=args.patience,
        verbose=not args.quiet,
    )


if __name__ == '__main__':
    main()