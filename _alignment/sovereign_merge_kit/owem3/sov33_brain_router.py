"""
sov33_brain_router.py — INTELLIGENT BRAIN ROUTER.

Routes queries to the best brain based on:
1. Query content (compliance/defense/intuition/voice)
2. Brain availability (local vs cloud)
3. Brain performance history (learning from outcomes)
4. Cost optimization (prefer free local brains)
5. Latency requirements (prefer fast brains)

This is the MISSING LAYER between the API server and the Layer 0 stomach.
Instead of blasting all brains, we route to the BEST one first.
"""

import json
import time
import hashlib
from pathlib import Path
from datetime import datetime, timezone
from collections import defaultdict

# Brain performance tracking
PERF_FILE = Path('/Users/nicholas/.sovereign/brain_performance.jsonl')

# OWEM routing rules
OWEM_KEYWORDS = {
    'compliance': [
        'article', 'compliance', 'eu ai act', 'uk ai bill', 'iso', 'c2pa',
        'gdpr', 'soc 2', 'nist', 'framework', 'regulation', 'audit',
        'charter', 'pillar', 'care-floor', '0.95', 'watermark',
    ],
    'defense': [
        'kill', 'intrusion', 'attack', 'security', 'breach', 'hack',
        'dorado', 'horus', 'rainbow', 'guard', 'defense', 'threat',
        'injection', 'malware', 'exploit', 'vulnerability', 'firewall',
    ],
    'intuition': [
        'pattern', 'ood', 'detect', 'predict', 'emergence', 'anomaly',
        'world model', 'forecast', 'trend', 'outlier', 'correlation',
        'cluster', 'classify', 'recognize', 'identify',
    ],
    'voice': [
        'voice', 'speak', 'say', 'tone', 'style', 'charter voice',
        'communication', 'report', 'announce', 'statement', 'narrative',
        'formal', 'informal', 'professional',
    ],
}

# Brain priority per OWEM (ordered by preference)
BRAIN_PRIORITY = {
    'compliance': [
        ('local_sovereign_small', 0),      # Free, fast, sovereign-trained
        ('cloud_claude', 0.003),            # Best reasoning
        ('cloud_mistral', 0.002),           # European compliance
        ('cloud_glm', 0.001),              # Multilingual
        ('local_qwen25_large', 0),          # Free fallback
    ],
    'defense': [
        ('local_sovereign_large', 0),       # Free, sovereign-trained
        ('cloud_deepseek', 0.001),          # Strong reasoning
        ('local_qwen3_small', 0),           # Fast local
        ('cloud_claude', 0.003),            # Safety-critical
        ('cloud_openai', 0.005),            # General fallback
    ],
    'intuition': [
        ('cloud_gemini', 0.003),            # Long context, multimodal
        ('cloud_mimo', 0.001),              # Reasoning
        ('local_qwen25_large', 0),          # Free local
        ('cloud_deepseek', 0.001),          # Math/reasoning
        ('local_sovereign_small', 0),       # Free fallback
    ],
    'voice': [
        ('cloud_minimax', 0.001),           # Fast, creative
        ('cloud_glm', 0.001),              # Multilingual
        ('local_sovereign_small', 0),       # Free, sovereign
        ('local_qwen3_small', 0),           # Fast local
        ('cloud_claude', 0.003),            # Quality fallback
    ],
}


def detect_owem(query: str) -> str:
    """Detect which OWEM should handle this query."""
    q = query.lower()
    scores = {}
    for owem, keywords in OWEM_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in q)
        scores[owem] = score
    
    if max(scores.values()) == 0:
        return 'compliance'  # Default
    
    return max(scores, key=scores.get)


def get_brain_performance() -> dict:
    """Load brain performance history."""
    perf = defaultdict(lambda: {'total': 0, 'success': 0, 'avg_latency': 0, 'avg_care': 0})
    
    if PERF_FILE.exists():
        for line in PERF_FILE.read_text().splitlines():
            if line.strip():
                try:
                    d = json.loads(line)
                    brain = d.get('brain', 'unknown')
                    perf[brain]['total'] += 1
                    if d.get('success', False):
                        perf[brain]['success'] += 1
                    perf[brain]['avg_latency'] = (
                        perf[brain]['avg_latency'] * (perf[brain]['total'] - 1) + d.get('latency_ms', 0)
                    ) / perf[brain]['total']
                    perf[brain]['avg_care'] = (
                        perf[brain]['avg_care'] * (perf[brain]['total'] - 1) + d.get('care_score', 0.95)
                    ) / perf[brain]['total']
                except:
                    pass
    
    return dict(perf)


def route_query(query: str, max_cost: float = 0.01, prefer_local: bool = True) -> dict:
    """
    Route a query to the best brain.
    
    Returns:
        {
            'owem': str,
            'brain': str,
            'provider': str,
            'cost': float,
            'reason': str,
        }
    """
    owem = detect_owem(query)
    perf = get_brain_performance()
    
    # Get brain priority for this OWEM
    candidates = BRAIN_PRIORITY.get(owem, BRAIN_PRIORITY['compliance'])
    
    # Filter by cost
    affordable = [(brain, cost) for brain, cost in candidates if cost <= max_cost]
    
    if prefer_local:
        # Prefer local brains
        local = [(brain, cost) for brain, cost in affordable if brain.startswith('local_')]
        if local:
            best_brain, best_cost = local[0]
            return {
                'owem': owem,
                'brain': best_brain,
                'provider': 'ollama',
                'cost': best_cost,
                'reason': 'local preferred',
            }
    
    # Use performance history to pick best
    if affordable:
        best_brain, best_cost = affordable[0]
        best_score = 0
        
        for brain, cost in affordable:
            if brain in perf:
                p = perf[brain]
                success_rate = p['success'] / max(p['total'], 1)
                # Score: success rate * 0.7 + (1 - normalized_latency) * 0.3
                score = success_rate * 0.7 + (1 - min(p['avg_latency'] / 5000, 1)) * 0.3
                if score > best_score:
                    best_score = score
                    best_brain = brain
                    best_cost = cost
        
        return {
            'owem': owem,
            'brain': best_brain,
            'provider': 'ollama' if best_brain.startswith('local_') else 'api',
            'cost': best_cost,
            'reason': 'performance-optimized',
        }
    
    return {
        'owem': owem,
        'brain': 'local_qwen3_small',
        'provider': 'ollama',
        'cost': 0,
        'reason': 'fallback (no affordable brains)',
    }


def log_performance(brain: str, success: bool, latency_ms: int, care_score: float = 0.95):
    """Log brain performance for learning."""
    PERF_FILE.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        'brain': brain,
        'success': success,
        'latency_ms': latency_ms,
        'care_score': care_score,
        'ts': datetime.now(timezone.utc).isoformat(),
    }
    with PERF_FILE.open('a') as f:
        f.write(json.dumps(entry) + '\n')


def router_state() -> dict:
    """Return router state."""
    perf = get_brain_performance()
    return {
        'router': 'active',
        'owem_keywords': {k: len(v) for k, v in OWEM_KEYWORDS.items()},
        'brain_priority': {k: len(v) for k, v in BRAIN_PRIORITY.items()},
        'performance_history': len(perf),
        'brains_tracked': list(perf.keys()),
    }


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="SOV33 Brain Router")
    p.add_argument("--route", type=str, help="Route a query")
    p.add_argument("--state", action="store_true", help="Show router state")
    args = p.parse_args()
    
    if args.route:
        result = route_query(args.route)
        print(json.dumps(result, indent=2))
    elif args.state:
        print(json.dumps(router_state(), indent=2))
