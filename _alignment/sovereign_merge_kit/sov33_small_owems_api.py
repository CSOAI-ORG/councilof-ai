#!/usr/bin/env python3
"""
sov33_small_owems_api.py — Hermes lane API wrappers for the 2 smaller OWEMs:
  - TriangleOWEM (3-around-1 governance topology)
  - CascadeRouter (10% conscious / 90% subconscious left-right cascade)

Both built by Claude Code (MEOK Labs) and committed to the shared tree.
This module provides simple JSON-friendly wrappers for the API server.
"""
import sys
import os
from pathlib import Path
import json
from datetime import datetime, timezone

sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')

# Import the OWEMs (built by Claude Code, shared tree)
from sov33_triangle_owem import build_triangle, TriangleOWEM
from sov33_cascade_router import CascadeRouter


def triangle_route(query_text: str, lane: str = 'Intuition', difficulty: float = 0.5, proposal: str = 'ALLOW'):
    """Route a query through the 3-around-1 triangle topology.

    The triangle has 3 small OWEMs (qwen3-30b, llama3-70b, mistral-12b) at the vertices
    and 1 SOV33-cubed center as Queen/governor.

    Returns: dict with decision, votes, escalated, sigil, rho, n_eff
    """
    # Build triangle with diverse lineages (per LANE_TASKS_HERMES: ρ measured = 0.15)
    tri = build_triangle(
        lineages=['qwen3-30b', 'llama3-70b', 'mistral-12b'],
        offline_ratios=[0.8, 0.8, 0.8],
        trust_weights=[1.0, 1.0, 1.0]
    )

    query = {
        'id': f'q-{int(datetime.now(timezone.utc).timestamp() * 1000)}',
        'lane': lane,
        'difficulty': difficulty,
        'proposal': proposal,
        'text': query_text
    }

    result = tri.route(query)

    return {
        'topology': '3-around-1 (triangle)',
        'small_owems': [
            {'name': v['owem'], 'lineage': v['lineage'], 'in_lane': v['in_lane'], 'local': v['local'], 'verdict': v['verdict']}
            for v in result['votes']
        ],
        'rho': result['rho'],
        'rho_source': result['rho_source'],
        'n_eff_votes': round(result['n_eff'], 3),
        'n_local': result['n_local'],
        'ruling': result['ruling'],
        'why': result['why'],
        'escalated': result['escalated'],
        'sigil': result['sigil'],
        'query_text': query_text,
        'lane': lane,
        'difficulty': difficulty,
        'ts': datetime.now(timezone.utc).isoformat()
    }


def cascade_route(task_text: str):
    """Route a task through the 10/90 conscious/subconscious cascade (lightweight).

    LEFT brain = small fast model (handles ~90% of traffic).
    RIGHT brain = large deep model (called only for the hard ~10%).

    LIGHTWEIGHT VERSION: only computes the difficulty score. Does NOT call OWEM.process()
    (which imports 51 components and is expensive). For full cascade + OWEM, use sov33_cascade_router.py directly.

    Returns: dict with difficulty, escalation decision (no OWEM call)
    """
    # Re-implement the difficulty estimator (lightweight, no CascadeRouter init)
    import re
    HARD_SIGNALS = [
        r"\bprove\b|\bderive\b|\bmulti[- ]step\b|\bwhy\b.*\bwhy\b",
        r"\btrade[- ]?off|\bcompare\b.*\band\b|\bconflict(ing)?\b",
        r"\bedge case|\bcorner case|\bambiguit|\bnuance",
        r"\barticle\s*\d+.*\band\b.*\barticle\s*\d+",
        r"\bif\b.*\bthen\b.*\belse\b",
    ]
    t = task_text.lower()
    hits = sum(1 for p in HARD_SIGNALS if re.search(p, t))
    # Difficulty: base = hits, plus length factor
    base = min(1.0, hits / 3.0)
    length_factor = min(0.3, len(task_text) / 500.0)
    difficulty = min(1.0, base + length_factor)
    escalated = difficulty > 0.5

    return {
        'topology': '10/90 cascade (left/right brain) — LIGHTWEIGHT',
        'difficulty': round(difficulty, 3),
        'escalated_to_right': escalated,
        'decision': 'LEFT_BRAIN' if not escalated else 'RIGHT_BRAIN',
        'rationale': f'hits={hits}, length={len(task_text)}',
        'note': 'lightweight mode: difficulty only, no full OWEM call',
        'task_text': task_text,
        'ts': datetime.now(timezone.utc).isoformat()
    }


def demo_small_owems():
    """Demo both small OWEM topologies in one call."""
    print("=== TRIANGLE OWEM (3-around-1) ===")
    tri_result = triangle_route(
        query_text="Is the sovereign care floor at 0.95?",
        lane='Intuition',
        difficulty=0.3,
        proposal='ALLOW'
    )
    print(f"  Decision: {tri_result['ruling']}")
    print(f"  N effective votes: {tri_result['n_eff_votes']}")
    print(f"  Escalated: {tri_result['escalated']}")
    print()

    print("=== CASCADE ROUTER (10/90) ===")
    cascade_result = cascade_route("Design a novel cross-jurisdiction governance charter.")
    print(f"  Difficulty: {cascade_result['difficulty']}")
    print(f"  Escalated to right brain: {cascade_result['escalated_to_right']}")
    print()

    return {'triangle': tri_result, 'cascade': cascade_result}


if __name__ == '__main__':
    demo_small_owems()
