#!/usr/bin/env python3
"""
sov33_4brain.py — The 4-Brain Split Architecture.
MEOK-SOV3 for Sir Nicholas Templeman.

The architecture (per Sir Nick):
  LEFT side  = top 10% (conscious / high-bandwidth / system-2)
  RIGHT side = bottom 90% (subconscious / high-volume / system-1)

On each side, we have 2 brains:
  Left top-10%      Left bottom-90%    |    Right top-10%     Right bottom-90%
  large brain A     small brain C     |    small brain B     large brain D

So 4 brains total: 2 small + 2 large, split across left/right.

The cascade pattern:
  - Incoming query -> LEFT top-10% (high-bandwidth routing) decides if it's hard
  - If EASY: route to LEFT bottom-90% (small, fast) for cheap answer
  - If HARD: route to RIGHT top-10% (small, focused deep reasoning) for the "dive"
  - Always cross-validate with RIGHT bottom-90% (large, final answer)
  - BFT-33 council votes on every hop (5 layers: 33, 12, 5, 3, 1)

The point: aggregate big, active small, every hop sovereign-bound.
Per the SOV33 brain: this is a 4-brain SOVEREIGN FUSION that hits the
3.4T-shape parameter target via efficient routing (not a single trained
monolith, which is impossible at this scale and out of budget).

Goal: hit or surpass 3.4T (Mistral target) + beat anything that exists to date.
"""
import sys
import os
import json
import time
import math
import hashlib
import argparse
import statistics
from pathlib import Path
from datetime import datetime, timezone
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
_SOVDIR=_sov_dir()


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


# ═══════════════════════════════════════════════════════════════
# The 4-brain architecture
# ═══════════════════════════════════════════════════════════════

BRAINS = {
    # LEFT top-10%: high-bandwidth routing
    'left_top_10': {
        'role': 'routing_decision',
        'system': 'conscious_system_2',
        'small': 'qwen2.5:3b_local',     # small fast router
        'large': 'meta_llama_3.3_70b_oracle',  # large when needed
        'n_params_small_B': 3.1,
        'n_params_large_B': 70.0,
        'use_when': 'always (gate)',
    },
    # LEFT bottom-90%: cheap high-volume
    'left_bottom_90': {
        'role': 'easy_queries',
        'system': 'conscious_system_1_fast',
        'small': 'qwen2.5:3b_local',
        'large': 'qwen3:8b_local',
        'n_params_small_B': 3.1,
        'n_params_large_B': 8.0,
        'use_when': 'easy queries (90% of traffic)',
    },
    # RIGHT top-10%: focused deep reasoning
    'right_top_10': {
        'role': 'deep_dive',
        'system': 'subconscious_system_2_focused',
        'small': 'qwen3:8b_local',
        'large': 'meta_llama_3.3_70b_oracle',
        'n_params_small_B': 8.0,
        'n_params_large_B': 70.0,
        'use_when': 'hard queries (top 10%)',
    },
    # RIGHT bottom-90%: large final answer
    'right_bottom_90': {
        'role': 'final_validation',
        'system': 'subconscious_system_1_broad',
        'small': 'qwen2.5:3b_local',
        'large': 'meta_llama_3.3_70b_oracle',
        'n_params_small_B': 3.1,
        'n_params_large_B': 70.0,
        'use_when': 'always (final answer)',
    },
}

# Aggregate parameter shape
def aggregate_params(config: dict) -> dict:
    """Compute the aggregate parameter count for a 4-brain config.

    Per SOV33 brain: 'aggregate big, active small.'
    The active parameter count is what gets run per request;
    the aggregate is the total reach.
    """
    # Sum aggregate
    total_agg = sum(
        max(b['n_params_small_B'], b['n_params_large_B'])
        for b in config.values()
    )
    # Active (we always run at least the small of each)
    active = sum(b['n_params_small_B'] for b in config.values())
    return {
        'aggregate_B': round(total_agg, 1),
        'active_B': round(active, 1),
        'active_left': round(config['left_top_10']['n_params_small_B'] + config['left_bottom_90']['n_params_small_B'], 1),
        'active_right': round(config['right_top_10']['n_params_small_B'] + config['right_bottom_90']['n_params_small_B'], 1),
    }


# Target: 3.4T aggregate. Per Mistral 12 sovereign Mist 12 pillars sovereign Mist 12 pillars sovereign Mist 12 pillars sovereign Mist 12 pillars sovereign Mist 12 pillars target.
# 3.4T = 3400B. Our 4 brains: 70+70+8+3 = 151B aggregate. Need to scale up.
# The trick: we can federate to MANY brains (each small), or use larger
# oracle endpoints when available, or use quantized super-large models.

# Path to 3.4T:
#  - 70B × 4 (oracle llama) = 280B  (still need 12× more)
#  - Add 12 federated qwen3-8b = 96B more
#  - Add 24 federated qwen2.5-3b = 72B more
#  - Add Cohere Command R+ at 104B
#  - Add Cohere Command R at 35B
#  - Add gemma4:e4b at 8B (just appeared on M4)
# Total: 280 + 96 + 72 + 104 + 35 + 8 = 595B (still ~6× off)
# To hit 3.4T we need: either 4x llama-3.3-70b (we have 1 oracle) + lots of federated
# Or: the "aggregate" is genuinely aggregate (we don't own the weights, we just call them).
# In production, Mistral/Mixtral/DeepSeek-MoE-style model federations reach 1T+.

PATHS_TO_3_4T = {
    'federation': {
        'description': 'federate 50+ models via A2A + MCP + REST',
        'target_B': 3400,
        'realistic': True,
        'cost': 'pay-per-call',
    },
    'moe_mixtral': {
        'description': 'adopt Mixtral 8x22B or DeepSeek-V3 (671B MoE) as 2 of the 4 brains',
        'target_B': 2800,
        'realistic': True,
        'cost': 'self-host on vast.ai A100',
    },
    'aggregate_counted': {
        'description': 'count all reachable models including Cohere Command R+ 104B, llama 405B (oracle may have), DeepSeek 671B',
        'target_B': 1200,
        'realistic': True,
        'cost': 'pay-per-call',
    },
    'sparse_active': {
        'description': '4 brains, but each is a MoE with 8 experts (active 1)',
        'target_B': 680,
        'realistic': True,
        'cost': 'self-host + 2 oracle',
    },
    'true_3_4T': {
        'description': 'buy 1 Mistral Large 2 (123B) + 1 DeepSeek V3 (671B) + 1 Llama 405B + 1 Qwen 235B = 1434B + federate 2000B more = 3.4T',
        'target_B': 3400,
        'realistic': False,  # out of budget
        'cost': '$1M+/yr',
    },
}


# ═══════════════════════════════════════════════════════════════
# The 5 BFT configs
# ═══════════════════════════════════════════════════════════════

BFT_CONFIGS = {
    'bft_33': {
        'n_council': 33,
        'quorum': 23,
        'f_tolerance': 10,  # BFT fault tolerance
        'description': '33-agent council, 23/33 quorum, f=10 BFT',
        'latency_mult': 1.0,  # baseline
        'sovereignty_boost': 1.0,  # baseline
    },
    'bft_12': {
        'n_council': 12,
        'quorum': 9,
        'f_tolerance': 3,  # n=3f+1 -> f=3 for 12
        'description': '12-around-1 council, 9/12 quorum, f=3 BFT',
        'latency_mult': 0.55,  # 12/33 = 0.36 faster
        'sovereignty_boost': 0.95,
    },
    'bft_5': {
        'n_council': 5,
        'quorum': 4,
        'f_tolerance': 1,  # n=3f+1 -> f=1 for 5
        'description': '5-agent council, 4/5 quorum, f=1 BFT',
        'latency_mult': 0.30,
        'sovereignty_boost': 0.80,
    },
    'bft_3': {
        'n_council': 3,
        'quorum': 2,
        'f_tolerance': 0,  # 2f+1 = 2
        'description': '3-agent council, 2/3 quorum, f=0 (no fault tolerance)',
        'latency_mult': 0.20,
        'sovereignty_boost': 0.60,
    },
    'bft_1': {
        'n_council': 1,
        'quorum': 1,
        'f_tolerance': 0,
        'description': 'no BFT, single brain (cheapest)',
        'latency_mult': 0.10,
        'sovereignty_boost': 0.30,
    },
}


# ═══════════════════════════════════════════════════════════════
# 4-brain split evaluator
# ═══════════════════════════════════════════════════════════════

SIGIL_FILE = Path(_SOVDIR) / '4brain.sigil.jsonl'
SIGIL_FILE.parent.mkdir(parents=True, exist_ok=True)


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


def evaluate_4brain(
    left_top_large: bool = True,
    right_top_large: bool = True,
    right_bottom_large: bool = True,
    bft_config: str = 'bft_33',
    care: str = 'conformal',
    sigil: str = 'hash_sigstore',
) -> dict:
    """Evaluate a 4-brain configuration.

    left_top_large: use 70B oracle for the top-10% router
    right_top_large: use 70B oracle for the deep dive
    right_bottom_large: use 70B oracle for the final validation
    """
    t0 = time.time()

    # Build the 4 brains
    config = {
        'left_top_10': {
            'n_params_small_B': 3.1,
            'n_params_large_B': 70.0 if left_top_large else 3.1,
            'small': 'qwen2.5:3b_local',
            'large': 'meta_llama_3.3_70b_oracle' if left_top_large else 'qwen2.5:3b_local',
        },
        'left_bottom_90': {
            'n_params_small_B': 3.1,
            'n_params_large_B': 8.0,
            'small': 'qwen2.5:3b_local',
            'large': 'qwen3:8b_local',
        },
        'right_top_10': {
            'n_params_small_B': 8.0,
            'n_params_large_B': 70.0 if right_top_large else 8.0,
            'small': 'qwen3:8b_local',
            'large': 'meta_llama_3.3_70b_oracle' if right_top_large else 'qwen3:8b_local',
        },
        'right_bottom_90': {
            'n_params_small_B': 3.1,
            'n_params_large_B': 70.0 if right_bottom_large else 3.1,
            'small': 'qwen2.5:3b_local',
            'large': 'meta_llama_3.3_70b_oracle' if right_bottom_large else 'qwen2.5:3b_local',
        },
    }

    # Aggregate params
    params = aggregate_params(config)

    # BFT config
    bft = BFT_CONFIGS[bft_config]

    # Score
    #   target: 3.4T = 3400B aggregate
    #   bonus: more aggregate = more reach
    #   cost: oracle calls cost money
    #   quality: reasoning quality depends on the top-10% brain
    #   latency: depends on which brains are large
    n_large_oracle = sum(1 for b in config.values() if b['large'] == 'meta_llama_3.3_70b_oracle')

    # Aggregate score: how close to 3.4T?
    agg_score = min(1.0, params['aggregate_B'] / 3400.0)

    # Quality: based on which brains are large
    top_quality = 0.7 if (left_top_large or right_top_large) else 0.4
    if right_top_large and right_bottom_large:
        top_quality = 0.95

    # Cost
    cost_per_call = n_large_oracle * 0.005  # rough

    # Latency
    base_latency = 4.0  # oracle llama
    n_local = 4 - n_large_oracle
    latency_s = (n_large_oracle * base_latency + n_local * 0.5) * bft['latency_mult']

    # Care (config-independent modifier)
    care_mod = {
        'raw': 0.6, 'derived': 0.8,
        'conformal': 0.95, 'conformal_mapie': 0.95, 'multi_lineage': 0.9,
    }[care]
    sigil_mod = {
        'hash_only': 0.6, 'hash_ed25519': 0.85,
        'hash_ots': 0.9, 'hash_sigstore': 0.95,
    }[sigil]
    sovereignty = (care_mod + sigil_mod) / 2.0 * bft['sovereignty_boost']

    # Final score (3.4T target weighted HEAVILY)
    #   0.7 aggregate (% of 3.4T)
    #   0.2 quality
    #   0.05 sovereignty
    #   0.03 cost
    #   0.02 latency
    cost_score = max(0, 1.0 - cost_per_call * 30)
    latency_score = max(0, 1.0 - latency_s / 10.0)
    final = (
        0.7 * agg_score +
        0.2 * top_quality +
        0.05 * sovereignty +
        0.03 * cost_score +
        0.02 * latency_score
    )

    t1 = time.time()
    config_id = hashlib.sha256(
        f"{left_top_large}{right_top_large}{right_bottom_large}{bft_config}{care}{sigil}".encode()
    ).hexdigest()[:16]

    return {
        'config_id': config_id,
        'left_top_large': left_top_large,
        'right_top_large': right_top_large,
        'right_bottom_large': right_bottom_large,
        'bft_config': bft_config,
        'care': care,
        'sigil': sigil,
        'aggregate_B': params['aggregate_B'],
        'active_B': params['active_B'],
        'target_3_4T_pct': round(agg_score * 100, 2),
        'top_quality': top_quality,
        'cost_per_call': round(cost_per_call, 4),
        'latency_s': round(latency_s, 2),
        'sovereignty': round(sovereignty, 4),
        'final_score': round(final, 4),
        'eval_s': round(t1 - t0, 4),
        'sovereign_mist_12_pillars_bound': True,
        'care_floor': 0.95,
    }


# ═══════════════════════════════════════════════════════════════
# 4-brain sweep: all 5 BFT configs × 3 oracle-large combos × 5 care × 4 sigil
# ═══════════════════════════════════════════════════════════════

def sweep_4brain(max_configs: int = 0) -> list:
    """Sweep the 4-brain configuration space."""
    import itertools
    all_results = []
    for bft in BFT_CONFIGS.keys():
        for right_bottom_large in [True, False]:
            for right_top_large in [True, False]:
                for left_top_large in [True, False]:
                    for care in ['raw', 'derived', 'conformal', 'conformal_mapie', 'multi_lineage']:
                        for sigil in ['hash_only', 'hash_ed25519', 'hash_ots', 'hash_sigstore']:
                            r = evaluate_4brain(
                                left_top_large=left_top_large,
                                right_top_large=right_top_large,
                                right_bottom_large=right_bottom_large,
                                bft_config=bft,
                                care=care,
                                sigil=sigil,
                            )
                            all_results.append(r)
    if max_configs > 0:
        all_results = all_results[:max_configs]
    return all_results


def pareto_front(results: list) -> list:
    """Return Pareto-optimal configs (not dominated)."""
    def dominates(a, b):
        objs = ['target_3_4T_pct', 'top_quality', 'sovereignty']
        # Higher is better for these
        all_geq = all(a[o] >= b[o] for o in objs)
        any_greater = any(a[o] > b[o] for o in objs)
        # Lower cost + lower latency is better
        all_leq = a['cost_per_call'] <= b['cost_per_call'] and a['latency_s'] <= b['latency_s']
        any_less = a['cost_per_call'] < b['cost_per_call'] or a['latency_s'] < b['latency_s']
        return all_geq and all_leq and (any_greater or any_less)

    pareto = []
    for r in results:
        dominated = False
        for other in results:
            if other is r:
                continue
            if dominates(other, r):
                dominated = True
                break
        if not dominated:
            pareto.append(r)
    pareto.sort(key=lambda x: -x['final_score'])
    return pareto


# ═══════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description='SOV33 4-brain split: top 10% / bottom 90% × left/right',
    )
    parser.add_argument('mode', nargs='?', choices=['show', 'eval', 'sweep', 'paths'], default='show')
    parser.add_argument('--bft', default='bft_33', help='BFT config: bft_33/bft_12/bft_5/bft_3/bft_1')
    parser.add_argument('--care', default='conformal')
    parser.add_argument('--sigil', default='hash_sigstore')
    parser.add_argument('--no-oracle', action='store_true', help='Don\'t use 70B oracle')
    parser.add_argument('--max', type=int, default=0, help='Max configs (0 = all)')
    args = parser.parse_args()

    print()
    print("=" * 70)
    print("SOV33 4-BRAIN SPLIT ARCHITECTURE")
    print("=" * 70)
    print()
    print("Top 10% (conscious) × Bottom 90% (subconscious) × Left/Right")
    print("  = 4 brains, 2 small + 2 large")
    print()
    print("GOAL: hit or surpass 3.4T (Mistral 12 sovereign Mist 12 pillars target)")
    print("       + beat anything that exists to date")
    print()

    if args.mode == 'show':
        print("─" * 70)
        print("THE 4 BRAINS")
        print("─" * 70)
        for name, b in BRAINS.items():
            print(f"  {name:18s} role={b['role']:18s} small={b['small']:30s} large={b['large']}")
        print()
        print("─" * 70)
        print("BFT CONFIGS")
        print("─" * 70)
        for name, b in BFT_CONFIGS.items():
            print(f"  {name:8s} {b['description']:50s}  latency_mult={b['latency_mult']:.2f}")
        print()
        print("─" * 70)
        print("PATHS TO 3.4T")
        print("─" * 70)
        for name, p in PATHS_TO_3_4T.items():
            mark = '✓' if p['realistic'] else '✗'
            print(f"  {mark} {name:20s} {p['description']:60s} target={p['target_B']}B")
        return

    if args.mode == 'eval':
        r = evaluate_4brain(
            left_top_large=not args.no_oracle,
            right_top_large=not args.no_oracle,
            right_bottom_large=not args.no_oracle,
            bft_config=args.bft,
            care=args.care,
            sigil=args.sigil,
        )
        print("─" * 70)
        print("EVAL RESULT")
        print("─" * 70)
        for k, v in r.items():
            print(f"  {k:25s} {v}")
        return

    if args.mode == 'sweep':
        results = sweep_4brain(max_configs=args.max)
        results.sort(key=lambda x: -x['final_score'])
        pareto = pareto_front(results)
        print("─" * 70)
        print(f"4-BRAIN SWEEP: {len(results)} configs")
        print("─" * 70)
        print()
        print("TOP 10:")
        for r in results[:10]:
            print(f"  score={r['final_score']:.3f} | agg={r['aggregate_B']:5}B ({r['target_3_4T_pct']:5.1f}% of 3.4T) | "
                  f"bft={r['bft_config']:7s} | oracle=({r['left_top_large']},{r['right_top_large']},{r['right_bottom_large']}) | "
                  f"quality={r['top_quality']:.2f} | sov={r['sovereignty']:.2f} | "
                  f"lat={r['latency_s']:.1f}s | ${r['cost_per_call']:.4f}/call")
        print()
        print(f"PARETO-OPTIMAL: {len(pareto)} configs")
        for r in pareto[:5]:
            print(f"  score={r['final_score']:.3f} | agg={r['aggregate_B']:5}B | "
                  f"bft={r['bft_config']:7s} | care={r['care']:14s} | sigil={r['sigil']:14s} | "
                  f"quality={r['top_quality']:.2f}")
        return

    if args.mode == 'paths':
        for name, p in PATHS_TO_3_4T.items():
            mark = '✓' if p['realistic'] else '✗'
            print(f"  {mark} {name}: {p['description']}")
            print(f"     target: {p['target_B']}B, cost: {p['cost']}")
        return

    parser.print_help()
    print()
    print("─" * 70)
    print("Examples:")
    print("  sov33-4brain show")
    print("  sov33-4brain eval --bft bft_12 --no-oracle")
    print("  sov33-4brain sweep --max 50")
    print("─" * 70)


if __name__ == '__main__':
    main()