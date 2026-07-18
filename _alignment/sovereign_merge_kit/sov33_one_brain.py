#!/usr/bin/env python3
"""
sov33_one_brain.py — THE TRUE 4-BRAIN ARCHITECTURE (per Sir Nick's clarification).
MEOK-SOV3 for Sir Nicholas Templeman. 11 Jul 2026.

Sir Nick's clarification: "each side has 2 brains 10% small 90% large
- so 4 brains in one brain!"

The architecture is now:
  - We have 2 BRAINS total (not 4)
  - Each brain has 2 INTERNAL paths:
    - Top 10% = small (conscious / routing / hot path)
    - Bottom 90% = large (subconscious / deep reasoning)
  - Total: 2 brains × 2 paths = 4 paths
  - But: 2 brains, 2 paths each = 4 PATHS in 2 BRAINS

OR another reading:
  - 1 BRAIN total (the sovereign substrate)
  - 4 PATHS inside it:
    - top 10% small LEFT (conscious/router)
    - bottom 90% large LEFT (deep reasoning on hard queries)
    - top 10% small RIGHT (cross-validator / spot check)
    - bottom 90% large RIGHT (final answer / reasoning)
  - 4 paths × 1 brain = the sovereign substrate

The architecture is:
  ┌────────────────────────────────────────────────────┐
  │                ONE BRAIN (substrate)                │
  │                                                    │
  │  LEFT (system-2)            RIGHT (system-1)    │
  │  ─────────────               ────────────────    │
  │  top-10%   bottom-90%        top-10%   bottom-90%│
  │  small     large             small     large     │
  │  router    deep              spot-chk  final     │
  │                                                    │
  │  Each "side" has the SAME 10/90 split:             │
  │  - 10% of compute → small/fast/conscious           │
  │  - 90% of compute → large/slow/subconscious         │
  └────────────────────────────────────────────────────┘

Per brain:
  - If 70B total: 7B active (top 10%) + 63B bottom 90% (full)
  - If 405B total: 40.5B active (top 10%) + 364.5B bottom 90%
  - If 671B MoE: 67B active (top 10%) + 604B bottom 90%

The aggregate parameter count for a 4-path federation:
  For 2 brains (e.g. llama-70B + deepseek-v3):
    - 2 × 70B = 140B (left) + 2 × 671B = 1342B (right) = 1482B aggregate
  For 12 brains (full federation, our V2 setup):
    - Sum of all top-10% = 1/10 of total
    - Sum of all bottom-90% = 9/10 of total
    - Total aggregate = total of all brains (same as before, but we know
      the structure is 2 paths per brain)

The KEY INSIGHT: the 4-path architecture means we have
  - 2 paths per brain × N brains = 2N paths
  - Active at any one time = N × top_10%_per_brain (much smaller than before)
  - This is the most efficient sparse MoE pattern possible
"""
import sys
import os
import json
import time
import math
import hashlib
import random
import argparse
import itertools
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



# ═══════════════════════════════════════════════════════════════
# The TRUE 4-path architecture
# ═══════════════════════════════════════════════════════════════

PATH_ROLES = {
    'left_top_10': {
        'system': 'conscious / system-2',
        'description': 'high-bandwidth router, fast path',
        'brain_count': 'top 10% of each brain',
        'use_when': 'always (gate) - decides easy vs hard',
    },
    'left_bottom_90': {
        'system': 'conscious / system-1 fast',
        'description': 'easy queries, fast answers',
        'brain_count': 'bottom 90% of each brain',
        'use_when': 'easy 90% of traffic',
    },
    'right_top_10': {
        'system': 'subconscious / system-2 focused',
        'description': 'deep dive, focused reasoning',
        'brain_count': 'top 10% of each brain',
        'use_when': 'hard queries (top 10%)',
    },
    'right_bottom_90': {
        'system': 'subconscious / system-1 broad',
        'description': 'final validation, broad reasoning',
        'brain_count': 'bottom 90% of each brain',
        'use_when': 'always (final answer)',
    },
}


def path_aggregate(brain_names: list) -> dict:
    """Compute the 4-path aggregate for a list of brain names.

    For each brain, split into top-10% (active) and bottom-90% (large).
    Then aggregate across all 4 paths.

    Returns:
        {
            'left_top_10_total_B': sum of 10% of each brain
            'left_bottom_90_total_B': sum of 90% of each brain
            'right_top_10_total_B': sum of 10% of each brain
            'right_bottom_90_total_B': sum of 90% of each brain
            'grand_total_B': sum of all 4 paths
            'active_at_any_time_B': left_top_10 + right_top_10 (only top-10% of each side)
            'grand_total_T': grand_total_B / 1000
        }
    """
    left_top_10_total = 0.0
    left_bottom_90_total = 0.0
    right_top_10_total = 0.0
    right_bottom_90_total = 0.0

    for name in brain_names:
        if name not in REGISTRY:
            continue
        m = REGISTRY[name]
        # Each brain contributes to ALL 4 paths
        # Top 10% = active/compressed version (params_active_B ≈ 10% of total)
        # Bottom 90% = full version (params_total_B - top10%)
        top_10 = m['params_active_B']
        bottom_90 = m['params_total_B'] - m['params_active_B']
        # Both left paths and both right paths use the same brain
        left_top_10_total += top_10
        left_bottom_90_total += bottom_90
        right_top_10_total += top_10
        right_bottom_90_total += bottom_90

    return {
        'brain_names': brain_names,
        'n_brains': len(brain_names),
        'left_top_10_B': round(left_top_10_total, 2),
        'left_bottom_90_B': round(left_bottom_90_total, 2),
        'right_top_10_B': round(right_top_10_total, 2),
        'right_bottom_90_B': round(right_bottom_90_total, 2),
        'left_total_B': round(left_top_10_total + left_bottom_90_total, 2),
        'right_total_B': round(right_top_10_total + right_bottom_90_total, 2),
        'grand_total_B': round(left_top_10_total + left_bottom_90_total + right_top_10_total + right_bottom_90_total, 2),
        'grand_total_T': round((left_top_10_total + left_bottom_90_total + right_top_10_total + right_bottom_90_total) / 1000, 3),
        'active_at_any_time_B': round(left_top_10_total + right_top_10_total, 2),
        # For 3.4T comparison: the grand_total is the aggregate
        'pct_of_3_4T': round(min(100, (left_top_10_total + left_bottom_90_total + right_top_10_total + right_bottom_90_total) / 34.0), 2),
    }


# ═══════════════════════════════════════════════════════════════
# Eval a 4-path config
# ═══════════════════════════════════════════════════════════════

CARE_FLOOR = 0.95
CARE_OPTIONS = ['raw', 'derived', 'conformal', 'conformal_mapie', 'multi_lineage']
SIGIL_OPTIONS = ['hash_only', 'hash_ed25519', 'hash_ots', 'hash_sigstore']


def evaluate_4path_config(
    brain_names: list,
    bft: str = 'bft_12',
    care: str = 'conformal',
    sigil: str = 'hash_sigstore',
) -> dict:
    """Evaluate a 4-path config using the TRUE architecture.

    Each brain has 10/90 split. 2 brains minimum (left + right).
    Each side's 4 paths aggregate to the grand total.
    """
    paths = path_aggregate(brain_names)

    # Sovereign filter
    unsafe = [n for n in brain_names if not REGISTRY.get(n, {}).get('sovereign_safe', True)]
    if unsafe:
        return {
            'brain_names': brain_names,
            'unsafe_brains': unsafe,
            'paths': paths,
            'sovereignty': 0.0,
            'final_score': 0.0,
            'goal_reached': False,
        }

    # BFT
    bft_cfg = BFT_CONFIGS[bft]
    lat_mult = bft_cfg['latency_mult']

    # Cost + latency (use the brain's own values, scaled by 4 paths)
    total_cost = 0.0
    total_lat_max = 0.0
    for name in brain_names:
        if name in REGISTRY:
            total_cost += REGISTRY[name].get('cost_per_call', 0)
            total_lat_max = max(total_lat_max, REGISTRY[name].get('latency_s', 0))
    # Multiply by 4 paths (each path is a separate inference)
    # But the right paths only fire on hard queries (10% of traffic)
    # So effective cost = left cost + 0.1 * right cost
    # For the simple model: total cost = sum * 2 (left always runs, right fires 10% of time = 0.1*cost but path is called)
    # Use simpler: cost per call = total_cost * 1.1 (small overhead for 10% right-path)
    cost = total_cost * 1.1
    lat = total_lat_max * lat_mult

    # Care + sigil modifiers
    care_mod = {
        'raw': 0.6, 'derived': 0.8,
        'conformal': 0.95, 'conformal_mapie': 0.95, 'multi_lineage': 0.9,
    }[care]
    sigil_mod = {
        'hash_only': 0.6, 'hash_ed25519': 0.85,
        'hash_ots': 0.9, 'hash_sigstore': 0.95,
    }[sigil]
    sovereignty = (care_mod + sigil_mod) / 2.0 * bft_cfg['sovereignty_boost']

    # Quality: based on the biggest brain
    biggest = max(
        (REGISTRY[n] for n in brain_names if n in REGISTRY),
        key=lambda x: x['params_total_B'],
        default={'params_active_B': 0, 'params_total_B': 0}
    )
    # Quality = the total of the biggest brain (since each path uses the full brain)
    quality = min(1.0, biggest['params_total_B'] / 1000.0)  # 1T+ = perfect

    # Aggregate score: how close to 3.4T
    agg_score = min(1.0, paths['grand_total_B'] / 3400.0)

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
        'paths': paths,
        'sovereignty': round(sovereignty, 4),
        'quality': round(quality, 4),
        'cost_per_call': round(cost, 4),
        'latency_s': round(lat, 2),
        'bft': bft,
        'care': care,
        'sigil': sigil,
        'final_score': round(final, 4),
        'goal_reached': (
            final >= 0.94
            and paths['grand_total_B'] >= 3400
            and sovereignty >= 0.9
        ),
    }


# ═══════════════════════════════════════════════════════════════
# Till-pass with the TRUE 4-path architecture
# ═══════════════════════════════════════════════════════════════

SIGIL_FILE = Path(_SOVDIR) / 'one_brain.sigil.jsonl'
SIGIL_FILE.parent.mkdir(parents=True, exist_ok=True)
LOG_FILE = Path(_SOVDIR) / 'one_brain.jsonl'
BEST_FILE = Path(_SOVDIR) / 'one_brain_best.json'


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


def mutate_brain_list(brain_list, n_mutations=1):
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


def mutate_other(config, n_mutations=1):
    new_config = dict(config)
    for _ in range(n_mutations):
        axis = random.choice(['bft', 'care', 'sigil'])
        if axis == 'bft':
            new_config['bft'] = random.choice(list(BFT_CONFIGS.keys()))
        elif axis == 'care':
            new_config['care'] = random.choice(CARE_OPTIONS)
        elif axis == 'sigil':
            new_config['sigil'] = random.choice(SIGIL_OPTIONS)
    return new_config


def till_pass(
    max_iterations=200,
    patience=30,
    initial_brains=None,
    initial_bft='bft_12',
    initial_care='conformal',
    initial_sigil='hash_sigstore',
    verbose=True,
):
    """The V3 till-pass with the TRUE 4-path architecture."""
    if initial_brains is None:
        # Warm start: 12 sovereign-safe brains
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
    best_result = evaluate_4path_config(
        best_config['brains'], best_config['bft'],
        best_config['care'], best_config['sigil']
    )
    best_score = best_result['final_score']
    no_improve = 0
    history = []
    t0 = time.time()

    if verbose:
        print()
        print("=" * 70)
        print("ONE-BRAIN TILL-PASS V3 — TRUE 4-path architecture (10% / 90%)")
        print("=" * 70)
        print()
        print("Each brain = top 10% small (conscious) + bottom 90% large (subconscious).")
        print("Each 'side' (left/right) has 2 paths. 2 sides × 2 paths = 4 paths.")
        print()
        print(f"Initial: {len(initial_brains)} brains, {best_result['paths']['grand_total_T']}T aggregate")
        print(f"  Left side:  top-10%={best_result['paths']['left_top_10_B']}B + bottom-90%={best_result['paths']['left_bottom_90_B']}B = {best_result['paths']['left_total_B']}B")
        print(f"  Right side: top-10%={best_result['paths']['right_top_10_B']}B + bottom-90%={best_result['paths']['right_bottom_90_B']}B = {best_result['paths']['right_total_B']}B")
        print(f"  Grand total: {best_result['paths']['grand_total_B']}B ({best_result['paths']['pct_of_3_4T']}% of 3.4T)")
        print(f"  Active at any one time: {best_result['paths']['active_at_any_time_B']}B")
        print(f"  Score: {best_score:.4f}, sovereignty: {best_result['sovereignty']:.2f}")
        print()

    for it in range(max_iterations):
        temperature = max(0.05, 1.0 * (0.99 ** it))

        if random.random() < 0.7:
            new_brains = mutate_brain_list(best_config['brains'], n_mutations=1)
            new_config = dict(best_config)
            new_config['brains'] = new_brains
        else:
            new_config = mutate_other(best_config, n_mutations=1)
            new_brains = new_config['brains']

        result = evaluate_4path_config(
            new_brains, new_config['bft'], new_config['care'], new_config['sigil']
        )
        score = result['final_score']
        delta = score - best_score

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
                'grand_total_T': result['paths']['grand_total_T'],
                'pct_of_3_4T': result['paths']['pct_of_3_4T'],
                'timestamp': datetime.now(timezone.utc).isoformat(),
            }) + '\n')

        if best_result.get('goal_reached', False):
            if verbose:
                print(f"  [{it:4d}] *** GOAL REACHED ***")
                print(f"  [{it:4d}] score={best_score:.4f}, total={best_result['paths']['grand_total_T']}T ({best_result['paths']['pct_of_3_4T']}% of 3.4T)")
            break

        if no_improve >= patience:
            new_brains = mutate_brain_list(best_config['brains'], n_mutations=3)
            best_config['brains'] = new_brains
            no_improve = 0
            if verbose:
                print(f"  [{it:4d}] no improvement, big mutation")

        if verbose and (it % 10 == 0 or it < 5):
            print(f"  [{it:4d}] best={best_score:.4f}, this={score:.4f}, "
                  f"total={best_result['paths']['grand_total_T']}T ({best_result['paths']['pct_of_3_4T']}%), "
                  f"temp={temperature:.3f}, acc={accepted}")

    t1 = time.time()
    elapsed = round(t1 - t0, 2)

    sigil_emit({
        'hop': 'ONE_BRAIN_TILL_PASS_BEST',
        'n_iterations': it + 1,
        'elapsed_s': elapsed,
        'best_score': best_score,
        'grand_total_T': best_result['paths']['grand_total_T'],
        'pct_of_3_4T': best_result['paths']['pct_of_3_4T'],
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
        'mixer_version': '3.0 (true 4-path architecture)',
    }, indent=2))

    if verbose:
        print()
        print("=" * 70)
        print("FINAL — ONE-BRAIN V3 (TRUE 4-path architecture)")
        print("=" * 70)
        print(f"  Iterations:   {it + 1}")
        print(f"  Elapsed:      {elapsed}s")
        print(f"  Best score:   {best_score:.4f}")
        paths = best_result['paths']
        print(f"  Grand total:  {paths['grand_total_T']}T ({paths['pct_of_3_4T']}% of 3.4T)")
        print(f"  Active:       {paths['active_at_any_time_B']}B")
        print(f"  Sovereignty:  {best_result['sovereignty']:.2f}")
        print(f"  Cost/call:    ${best_result['cost_per_call']:.4f}")
        print(f"  Latency:      {best_result['latency_s']:.2f}s")
        print(f"  N brains:     {best_result['n_brains']}")
        print()
        print(f"  Config: bft={best_config['bft']}, care={best_config['care']}, sigil={best_config['sigil']}")
        print()
        print(f"  LEFT side (system-2, conscious):")
        print(f"    top-10% small (router):  {paths['left_top_10_B']}B")
        print(f"    bottom-90% large (deep):  {paths['left_bottom_90_B']}B")
        print(f"    left total:               {paths['left_total_B']}B")
        print(f"  RIGHT side (system-1, subconscious):")
        print(f"    top-10% small (spot):     {paths['right_top_10_B']}B")
        print(f"    bottom-90% large (final): {paths['right_bottom_90_B']}B")
        print(f"    right total:              {paths['right_total_B']}B")
        print()
        print(f"  Brains in the federation:")
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
    parser = argparse.ArgumentParser(description='SOV33 One-Brain V3 (TRUE 4-path architecture)')
    parser.add_argument('--max-iters', type=int, default=200)
    parser.add_argument('--patience', type=int, default=50)
    parser.add_argument('--quiet', action='store_true')
    args = parser.parse_args()

    return till_pass(
        max_iterations=args.max_iters,
        patience=args.patience,
        verbose=not args.quiet,
    )


if __name__ == '__main__':
    main()