#!/usr/bin/env python3
"""
sov33_tier_enforcer.py — Enforce tier eligibility on the model registry.

MEOK-SOV3 for Sir Nicholas Templeman. 11 Jul 2026.

HONEST SCOPE:
  - Reads the model registry
  - For each model, checks tier_eligibility vs the requested tier
  - Returns a tier-compliant subset
  - This is the GATE, not the suggestion

The 5 Llama-MAU models are now tier-tagged: ['free_tier', 'internal_dev'].
This means they CANNOT be selected for the paid_tier.
"""
import sys
import os
import json
import argparse
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')


def get_models_for_tier(tier: str) -> dict:
    """Return models eligible for the given tier."""
    from sov33_model_registry import REGISTRY

    eligible = {}
    blocked = []

    for model_id, info in REGISTRY.items():
        tier_elig = info.get('tier_eligibility', ['free_tier', 'internal_dev', 'paid_tier'])
        if tier in tier_elig or 'all_tiers' in tier_elig:
            eligible[model_id] = info
        else:
            blocked.append({
                'model': model_id,
                'license': info.get('license', '?'),
                'tier_eligibility': tier_elig,
                'reason': f'License {info.get("license", "?")} blocks tier={tier}',
            })

    return {
        'tier': tier,
        'eligible': eligible,
        'eligible_count': len(eligible),
        'blocked': blocked,
        'blocked_count': len(blocked),
        'total': len(REGISTRY),
    }


def main():
    parser = argparse.ArgumentParser(description='SOV33 tier eligibility enforcer')
    parser.add_argument('--tier', choices=['free_tier', 'internal_dev', 'paid_tier', 'all_tiers'],
                        default='paid_tier')
    parser.add_argument('--quiet', action='store_true')
    args = parser.parse_args()

    result = get_models_for_tier(args.tier)

    if not args.quiet:
        print()
        print("=" * 70)
        print(f"SOV33 TIER ENFORCER — tier={args.tier}")
        print("=" * 70)
        print(f"  Total models: {result['total']}")
        print(f"  Eligible: {result['eligible_count']}")
        print(f"  Blocked: {result['blocked_count']}")
        print()
        if result['blocked']:
            print(f"  BLOCKED for tier={args.tier}:")
            for b in result['blocked']:
                print(f"    ✗ {b['model']}: {b['reason']}")
        print()
        print(f"  ELIGIBLE (top 10):")
        for mid in list(result['eligible'].keys())[:10]:
            print(f"    ✓ {mid}")


if __name__ == '__main__':
    main()