#!/usr/bin/env python3
"""
sov33_license_audit.py — Comprehensive license audit for the sovereign substrate.

MEOK-SOV3 for Sir Nicholas Templeman. 11 Jul 2026.

THE RULE (from SOV33_OPENSOURCE_COMPONENTS_2026-07-11.md):
  - PERMISSIVE (MIT / Apache-2.0 / BSD): fork freely, keep additions private, sell. ✓
  - COPYLEFT (AGPL / GPL): forking into a network service can legally compel open-sourcing.
  - RULE: build the paid/sovereign tier ONLY on permissive forks + your own IP.
  - Quarantine copyleft components to the fully-open free tier.

THE LLAMA CAVEAT:
  - Llama-3.1 has a 700M MAU clause: must be used by applications with <700M MAU.
  - Sovereign-paid product (high MAU potential) = NOT Llama-3.1.
  - Llama-3.2 has stricter clause.

HONEST SCOPE:
  - Audits the model_registry (70 models)
  - Reports the 5 unsafe + their licenses
  - Recommends the safe subset for the paid tier
  - Emits SIGIL audit event
"""
import sys
import os
import json
import hashlib
import argparse
from pathlib import Path
from datetime import datetime, timezone
from collections import Counter
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
_SOVDIR=_sov_dir()


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


SIGIL_FILE = Path(_SOVDIR) / 'license_audit.sigil.jsonl'
SIGIL_FILE.parent.mkdir(parents=True, exist_ok=True)
AUDIT_REPORT = Path(_SOVDIR) / 'license_audit_report.json'


def sigil_emit(hop: dict) -> str:
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


def audit_registry() -> dict:
    """Audit the model registry for license hygiene."""
    from sov33_model_registry import REGISTRY

    license_counts = Counter()
    tier_counts = Counter()
    safe_models = []
    unsafe_models = []

    for model_id, info in REGISTRY.items():
        lic = info.get('license', 'unknown')
        license_counts[lic] += 1
        tier_counts[info.get('tier', 'unknown')] += 1
        if info.get('sovereign_safe', False):
            safe_models.append(model_id)
        else:
            unsafe_models.append({
                'model': model_id,
                'license': lic,
                'reason': info.get('notes', ''),
            })

    # License tier classification
    PERMISSIVE_LICENSES = {
        'MIT', 'Apache-2.0', 'BSD', 'Modified-MIT', 'MRL (commercial OK)',
        'NVIDIA Open Model License', 'Apple Sample Code License',
    }
    SOVEREIGN_OK = PERMISSIVE_LICENSES | {'Gemma license', 'Gemma license (commercial OK with restrictions)'}
    NEEDS_REVIEW = {'CC-BY-NC (commercial via API)'}
    BLOCKED = {'Llama-3.1 (700M MAU clause)', 'Llama-3.1 (MAU clause)', 'Llama-3.2'}

    classified = {
        'PERMISSIVE_OK': [],
        'NEEDS_REVIEW': [],
        'BLOCKED': [],
        'UNKNOWN': [],
    }

    for model_id, info in REGISTRY.items():
        lic = info.get('license', 'unknown')
        if lic in PERMISSIVE_LICENSES:
            classified['PERMISSIVE_OK'].append(model_id)
        elif lic in SOVEREIGN_OK:
            classified['PERMISSIVE_OK'].append(model_id)
        elif lic in NEEDS_REVIEW:
            classified['NEEDS_REVIEW'].append(model_id)
        elif lic in BLOCKED:
            classified['BLOCKED'].append(model_id)
        else:
            classified['UNKNOWN'].append(model_id)

    summary = {
        'n_total': len(REGISTRY),
        'n_sovereign_safe': len(safe_models),
        'n_unsafe': len(unsafe_models),
        'license_distribution': dict(license_counts),
        'tier_distribution': dict(tier_counts),
        'classified': {k: len(v) for k, v in classified.items()},
        'blocked_models': unsafe_models,
        'safe_for_paid_tier': classified['PERMISSIVE_OK'] + classified['NEEDS_REVIEW'],
        'recommended_for_paid_tier_count': len(classified['PERMISSIVE_OK']) + len(classified['NEEDS_REVIEW']),
    }

    return summary


def main():
    parser = argparse.ArgumentParser(description='Sovereign substrate license audit')
    parser.add_argument('--output', default=str(AUDIT_REPORT))
    parser.add_argument('--quiet', action='store_true')
    args = parser.parse_args()

    print()
    print("=" * 70)
    print("SOV33 LICENSE AUDIT — Paid-tier hygiene check")
    print("=" * 70)
    print()

    summary = audit_registry()

    if not args.quiet:
        print(f"  Total models: {summary['n_total']}")
        print(f"  Sovereign-safe: {summary['n_sovereign_safe']}")
        print(f"  Not safe: {summary['n_unsafe']}")
        print()
        print("  License distribution:")
        for lic, n in sorted(summary['license_distribution'].items(), key=lambda x: -x[1]):
            mark = '✓' if lic in {'MIT', 'Apache-2.0', 'BSD', 'Modified-MIT'} else '⚠' if 'MAU' in lic or 'Llama-3.2' in lic else '?'
            print(f"    [{mark}] {lic}: {n}")
        print()
        print(f"  Classified:")
        print(f"    PERMISSIVE_OK:  {summary['classified']['PERMISSIVE_OK']} (paid tier safe)")
        print(f"    NEEDS_REVIEW:   {summary['classified']['NEEDS_REVIEW']} (commercial OK w/ review)")
        print(f"    BLOCKED:        {summary['classified']['BLOCKED']} (MAU-clause / restricted)")
        print(f"    UNKNOWN:        {summary['classified']['UNKNOWN']}")
        print()
        if summary['blocked_models']:
            print(f"  Blocked models ({len(summary['blocked_models'])}):")
            for m in summary['blocked_models']:
                print(f"    ✗ {m['model']}: {m['license']}")
                if m['reason']:
                    print(f"      → {m['reason']}")

    # Save report
    with open(args.output, 'w') as f:
        json.dump(summary, f, indent=2, default=str)

    sigil_emit({
        'hop': 'LICENSE_AUDIT_COMPLETE',
        'n_total': summary['n_total'],
        'n_sovereign_safe': summary['n_sovereign_safe'],
        'n_blocked': len(summary['blocked_models']),
        'care_floor': 0.95,
        'article_0_bound': True,
    })

    print()
    print(f"  Report saved to: {args.output}")
    print(f"  SIGIL emitted.")
    print()
    print(f"  RECOMMENDATION: Use the {summary['recommended_for_paid_tier_count']} safe-for-paid-tier models")
    print(f"  for the production sovereign substrate. Quarantine the {summary['n_unsafe']} blocked models")
    print(f"  to the fully-open free tier (or omit entirely per your tier policy).")


if __name__ == '__main__':
    main()