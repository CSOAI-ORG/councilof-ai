#!/usr/bin/env python3
"""
sov33_rho_api.py — Hermes lane API wrapper for ρ measurement.

Reads council_correlation_results.json (Cohere vs Meta measured) + config_sweep_results.json
(20 configs with MEASURED rho across diverse lineages) + triangle_owem's lineage_diversity_to_rho.

Per LANE_TASKS_HERMES.md item 2: MEASURE ρ across lineages (don't assert "14 lineages = decorrelated").
"""
import sys, os, json
from pathlib import Path
from datetime import datetime, timezone

COUNCIL_RESULTS = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/council_correlation_results.json')
SWEEP_RESULTS = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/config_sweep_results.json')


def load_council_measurement():
    """Cohere vs Meta — the canonical reference measurement."""
    if not COUNCIL_RESULTS.exists():
        return None
    return json.loads(COUNCIL_RESULTS.read_text())


def load_sweep_measurements():
    """20 configs with MEASURED ρ across diverse lineages."""
    if not SWEEP_RESULTS.exists():
        return []
    return json.loads(SWEEP_RESULTS.read_text())


def get_rho():
    """Return the full ρ measurement summary for /api/rho."""
    council = load_council_measurement()
    sweep = load_sweep_measurements()

    # Sort sweep by rho (ascending = most decorrelated first)
    sweep_sorted = sorted(sweep, key=lambda c: c.get('rho', 1.0))

    # Best (lowest) rho per topology
    by_topology = {}
    for c in sweep:
        topo = c.get('topology', '?')
        lineage = c.get('lineage', '?')
        key = f'{topo}/{lineage}'
        if key not in by_topology or c.get('rho', 1.0) < by_topology[key].get('rho', 1.0):
            by_topology[key] = c

    # Stats
    rhos = [c.get('rho') for c in sweep if c.get('rho') is not None]
    stats = {
        'min': min(rhos) if rhos else None,
        'max': max(rhos) if rhos else None,
        'avg': sum(rhos) / len(rhos) if rhos else None,
        'count': len(rhos),
        'decorrelated_count': sum(1 for r in rhos if r < 0.3),  # ρ<0.3 = decorrelated
        'theatre_count': sum(1 for r in rhos if r > 0.7),  # ρ>0.7 = theatre
    }

    return {
        'canonical_cohere_vs_meta': council,
        'config_sweep_stats': stats,
        'best_per_topology': by_topology,
        'all_sweep_results': sweep_sorted,
        'honest_register': {
            'measurement_method': 'Phi coefficient on error vectors, 10-question battery',
            'what_low_rho_means': 'ρ<0.3 = decorrelated = real fault tolerance',
            'what_high_rho_means': 'ρ>0.7 = correlated = council is theatre',
            'retracted_claim': '14 lineages = decorrelated (was the old, wrong framing)',
            'honest_framing': 'MEASURE ρ, pick decorrelated pairs by measurement, log per-pair',
        },
        'ts': datetime.now(timezone.utc).isoformat(),
    }


if __name__ == '__main__':
    import json
    print(json.dumps(get_rho(), indent=2))
