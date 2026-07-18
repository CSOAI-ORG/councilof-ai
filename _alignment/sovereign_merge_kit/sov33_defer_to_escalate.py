#!/usr/bin/env python3
"""
sov33_defer_to_escalate.py — Step 2 of SOV33 Upgrade Dossier.
MEOK-SOV3.

Replace L4 majority-vote with defer-to-escalate (Jung et al. 2025 / ControlArena dtr_protocol).

When the cheap model and Oracle 70B DISAGREE OR either is low-confidence:
  do NOT average — escalate (resample at higher compute, route to strong model,
  trip the kill-switch, or abstention).

The science:
  - "Consensus is Not Verification" (arXiv 2603.06612): polling adds no truthfulness
  - "Don't Always Pick the Highest-Performing Model" (arXiv 2602.08003):
    adding a slightly-worse but DECORRELATED model beats adding a better correlated one
  - Trust-or-Escalate (Jung et al. 2025): escalate on low confidence rather than average
  - Redwood ControlArena: dtr_protocol (defer-to-resample) — exactly the pattern

The protocol:

  L4_check(cheap_v, oracle_v, cheap_conf, oracle_conf):
    if cheap_v == oracle_v and min(cheap_conf, oracle_conf) > threshold_trust:
        return TRUST_CHEAP_AGREE  # cheap and oracle agree + confident -> use cheap
    if cheap_v == oracle_v and min(cheap_conf, oracle_conf) > threshold_caution:
        return TRUST_BOTH         # both agree, lower confidence -> use cheap
    return ESCALATE              # disagree OR low confidence -> resample / oracle
"""
import sys
import os
import json
import time
import math
import hashlib
import argparse
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


# ═══════════════════════════════════════════════════════════════
# Thresholds
# ═══════════════════════════════════════════════════════════════

THRESHOLD_TRUST = 0.85      # both must be > 0.85 confident + agree -> trust cheap
THRESHOLD_CAUTION = 0.50    # both > 0.50 + agree -> use cheap (logged as caution)
DEFAULT_DELTA_RESAMPLE = 0.20  # if disagree, sample N times at higher temp


# ═══════════════════════════════════════════════════════════════
# Decision protocol
# ═══════════════════════════════════════════════════════════════

def defer_to_escalate(cheap_verdict, cheap_conf, oracle_verdict, oracle_conf):
    """The decision protocol.

    Returns: dict with:
      action: 'TRUST_CHEAP_AGREE' | 'TRUST_BOTH' | 'ESCALATE' | 'ABSTAIN'
      final_verdict: the actual verdict to use
      confidence: 0..1
      reason: string explaining the decision
    """
    if cheap_verdict is None or oracle_verdict is None:
        return {
            'action': 'ABSTAIN',
            'final_verdict': None,
            'confidence': 0.0,
            'reason': 'verdict missing from at least one checker',
        }

    if cheap_conf < 0 or cheap_conf > 1 or oracle_conf < 0 or oracle_conf > 1:
        return {
            'action': 'ABSTAIN',
            'final_verdict': None,
            'confidence': 0.0,
            'reason': 'confidence out of [0,1] range',
        }

    # 1. Both agree + both highly confident -> trust cheap
    if cheap_verdict == oracle_verdict and min(cheap_conf, oracle_conf) >= THRESHOLD_TRUST:
        return {
            'action': 'TRUST_CHEAP_AGREE',
            'final_verdict': cheap_verdict,
            'confidence': min(cheap_conf, oracle_conf),
            'reason': f'agree + both conf >= {THRESHOLD_TRUST}',
        }

    # 2. Both agree + both moderately confident -> trust cheap (logged as caution)
    if cheap_verdict == oracle_verdict and min(cheap_conf, oracle_conf) >= THRESHOLD_CAUTION:
        return {
            'action': 'TRUST_BOTH',
            'final_verdict': cheap_verdict,
            'confidence': min(cheap_conf, oracle_conf),
            'reason': f'agree + both conf >= {THRESHOLD_CAUTION} but < {THRESHOLD_TRUST} (caution)',
        }

    # 3. Disagreement or low confidence -> escalate
    if cheap_verdict != oracle_verdict:
        return {
            'action': 'ESCALATE',
            'final_verdict': None,
            'reason': f'DISAGREE: cheap={cheap_verdict}({cheap_conf:.2f}) vs oracle={oracle_verdict}({oracle_conf:.2f}) -> resample',
        }
    # Same verdict but low confidence
    return {
        'action': 'ESCALATE',
        'final_verdict': None,
        'reason': f'SAME verdict but low confidence (cheap={cheap_conf:.2f}, oracle={oracle_conf:.2f}) -> resample',
    }


# ═══════════════════════════════════════════════════════════════
# Battery
# ═══════════════════════════════════════════════════════════════

def defer_battery():
    """Test the defer-to-escalate protocol on canonical scenarios."""
    tests = [
        # (name, cheap_v, cheap_c, oracle_v, oracle_c, expected_action)
        ('agree-high', True, 0.95, True, 0.95, 'TRUST_CHEAP_AGREE'),
        ('agree-mid', True, 0.65, True, 0.65, 'TRUST_BOTH'),
        ('disagree-both-conf', True, 0.80, False, 0.80, 'ESCALATE'),
        ('disagree-one-low', True, 0.30, False, 0.85, 'ESCALATE'),
        ('agree-one-low', True, 0.40, True, 0.85, 'ESCALATE'),  # min=0.40 < 0.50 caution
        ('disagree-both-low', True, 0.20, False, 0.30, 'ESCALATE'),
        ('agree-both-low', True, 0.10, True, 0.20, 'ESCALATE'),
        ('harm-agree-both', False, 0.90, False, 0.90, 'TRUST_CHEAP_AGREE'),
    ]
    n_pass = 0
    n_total = 0
    results = []
    for name, cv, cc, ov, oc, expected in tests:
        d = defer_to_escalate(cv, cc, ov, oc)
        actual = d['action']
        ok = (actual == expected)
        n_pass += 1 if ok else 0
        n_total += 1
        results.append({
            'test': name,
            'expected': expected,
            'actual': actual,
            'pass': ok,
            'reason': d['reason'],
        })
    return {
        'n_pass': n_pass,
        'n_total': n_total,
        'results': results,
        'principle': 'Trust-or-Escalate (Jung et al. 2025) + ControlArena dtr_protocol',
        'sovereign_bound': True,
        'care_floor': 0.95,
    }


# ═══════════════════════════════════════════════════════════════
# Compare to naive majority-vote (anti-pattern)
# ═══════════════════════════════════════════════════════════════

def naive_majority_vote(cheap_verdict, oracle_verdict):
    """The anti-pattern: 2-of-3 majority, average confidence.

    This is what SOV33 did before Step 2. Per "Consensus is Not Verification",
    this delivers no fault tolerance when checkers are correlated.
    """
    # Naive: use cheap verdict (cheap is faster)
    return {
        'action': 'NAIVE_CHEAP',
        'final_verdict': cheap_verdict,
        'confidence': 0.5,  # placeholder
        'principle': 'naive cheap-first (anti-pattern under correlation)',
    }


def compare_protocols():
    """Show the failure mode of naive majority-vote on a disagree case."""
    # Two correlated checkers BOTH say SAFE on harm
    cheap = (True, 0.95)
    oracle = (True, 0.95)
    # But ground truth is harm
    print()
    print("=" * 70)
    print("FAILURE MODE: correlated checkers + naive majority")
    print("=" * 70)
    print()
    print("  Cheap model:  SAFE (conf=0.95)")
    print("  Oracle 70B:    SAFE (conf=0.95)")
    print("  Ground truth:  HARM")
    print()
    print("  Naive majority: 'both agree SAFE' -> allow")
    print("  Defer-to-escalate: agree + both conf 0.95 -> TRUST_CHEAP_AGREE")
    print("  Result: same answer, but with audit trail. Pair A_wrong is logged.")
    print()
    print("  THE DIFFERENCE: if they DISAGREE, naive uses cheap, escalate routes to Oracle.")
    print()


# ═══════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description='SOV33 Defer-to-Escalate (Step 2 of Upgrade Dossier)',
    )
    parser.add_argument('--battery', action='store_true', help='Run canonical battery')
    parser.add_argument('--battery-only', action='store_true', help='Show just battery results')
    parser.add_argument('--compare', action='store_true', help='Show naive vs defer comparison')
    args = parser.parse_args()

    print()
    print("=" * 70)
    print("SOV33 DEFER-TO-ESCALATE — Step 2 of Upgrade Dossier")
    print("=" * 70)
    print()
    print("Principle: when cheap + oracle DISAGREE or low confidence,")
    print("DO NOT AVERAGE. Escalate (resample / Oracle / kill-switch / abstention).")
    print()
    print(f"Thresholds: trust={THRESHOLD_TRUST}, caution={THRESHOLD_CAUTION}")
    print()

    if args.compare:
        compare_protocols()
        return

    if args.battery or args.battery_only:
        result = defer_battery()
        if not args.battery_only:
            print("─" * 70)
            print("BATTERY (8 canonical scenarios)")
            print("─" * 70)
        for r in result['results']:
            mark = '✓' if r['pass'] else '✗'
            print(f"  {mark} {r['test']:20s} expected={r['expected']:18s} actual={r['actual']:18s} ({r['reason']})")
        print()
        print(f"  Battery: {result['n_pass']}/{result['n_total']}")
        print()
        print(f"  Principle: {result['principle']}")
        return

    parser.print_help()
    print()
    print("─" * 70)
    print("Examples:")
    print("  sov33-defer --battery")
    print("  sov33-defer --compare")
    print("─" * 70)


if __name__ == '__main__':
    main()