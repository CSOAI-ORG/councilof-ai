"""
🐉 SOV3 Mind Bridge — Left Brain / Right Brain / Sovereign Brain
3 bridge tools: route, bind, synthesize
"""

import json
import re
from datetime import datetime

# Keywords for routing
KEYWORDS_LEFT = [
    'audit', 'compliance', 'charter', 'bft', 'council', 'sigil',
    'cert', 'math', 'logic', 'code', 'compute', 'forecast',
    'pattern', 'verify', 'crosswalk', 'reason', 'check', 'math',
    'compute', 'forecast', 'sequence', 'causality'
]
KEYWORDS_RIGHT = [
    'see', 'watch', 'where', 'when', 'who', 'move',
    'hand', 'camera', 'sensor', 'world', 'space',
    'koikeeper', 'fishkeeper', 'landlaw', 'pond',
    'gesture', 'observe', 'presence', 'spatial', 'actuate',
    'physical', 'vision', 'audio', 'touch', '3d', 'map'
]
KEYWORDS_BRIDGE = [
    'show', 'combine', 'integrate', 'bind', 'synthesize',
    'audit AND', 'while observing', 'in 3d', 'visualize'
]


def sov_route(query: str) -> dict:
    """
    Route query to left, right, or both hemispheres.
    Returns: {route: 'left'|'right'|'both', confidence: float, scores: dict}
    """
    q = query.lower()
    left_score = sum(1 for k in KEYWORDS_LEFT if k in q)
    right_score = sum(1 for k in KEYWORDS_RIGHT if k in q)
    bridge_score = sum(1 for k in KEYWORDS_BRIDGE if k in q)

    # Boost both if any bridge keyword
    if bridge_score > 0:
        left_score += 1
        right_score += 1

    if left_score > right_score:
        route = 'left'
        confidence = left_score / (left_score + right_score + 1)
    elif right_score > left_score:
        route = 'right'
        confidence = right_score / (left_score + right_score + 1)
    else:
        route = 'both'
        confidence = 0.5

    return {
        'query': query,
        'route': route,
        'confidence': round(confidence, 2),
        'scores': {
            'left': left_score,
            'right': right_score,
            'bridge': bridge_score
        },
        'timestamp': datetime.now().isoformat()
    }


def sov_bind(left_result: str, right_result: str, goal: str = None) -> dict:
    """
    Bind results from both hemispheres into unified understanding.
    """
    synthesis = (
        f"LEFT HEMISPHERE:\n{left_result}\n\n"
        f"RIGHT HEMISPHERE:\n{right_result}\n\n"
        f"BINDING: Both hemispheres contribute to a unified understanding. "
        f"The sovereign mind reconciles contradictions and synthesises new insights."
    )

    if goal:
        synthesis += f"\n\nGOAL: {goal}\n→ New understanding emerges from binding both views."

    return {
        'left': left_result,
        'right': right_result,
        'goal': goal,
        'synthesis': synthesis,
        'timestamp': datetime.now().isoformat()
    }


def sov_synthesize(left: str, right: str, goal: str) -> dict:
    """
    Synthesise a new understanding from both hemispheres + the goal.
    """
    return {
        'left': left,
        'right': right,
        'goal': goal,
        'synthesis': (
            f"Goal: {goal}\n\n"
            f"From Left Brain (analytic): {left}\n\n"
            f"From Right Brain (world): {right}\n\n"
            f"NEW INSIGHT: This synthesised understanding is greater than either alone. "
            f"The sovereign mind's purpose is to combine analytic + world into something neither could do alone."
        ),
        'timestamp': datetime.now().isoformat()
    }


# === CLI ===
if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python3 sov3_mind_bridge.py <query>")
        sys.exit(1)
    query = ' '.join(sys.argv[1:])
    result = sov_route(query)
    print(json.dumps(result, indent=2))