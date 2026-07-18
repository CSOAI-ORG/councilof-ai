"""
sov33_intelligent_layer0.py — INTELLIGENT LAYER 0 with Brain Router.

Instead of blasting all 12 brains, this:
1. Uses the brain router to select the BEST brain for each query
2. Falls back to Layer 0 stomach if primary brain fails
3. Logs performance for continual learning
4. Optimizes for cost/quality/latency

This is the SMART version of Layer 0.
"""

import json
import time
import hashlib
import urllib.request
from pathlib import Path
from datetime import datetime, timezone

# Import brain router and Layer 0 stomach
import sys
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/owem3')
from sov33_brain_router import route_query, log_performance, detect_owem
from sov33_layer0_stomach import BRAIN_CONFIGS, OWEM_BRAIN_GROUPS, call_brain

SIGIL_FILE = Path('/Users/nicholas/.sovereign/intelligent_layer0.sigil.jsonl')


def sigil_emit(hop):
    SIGIL_FILE.parent.mkdir(parents=True, exist_ok=True)
    chain = []
    if SIGIL_FILE.exists():
        for line in SIGIL_FILE.read_text().splitlines():
            if line.strip():
                try: chain.append(json.loads(line))
                except: pass
    prev = chain[-1]['digest'] if chain else '0'*16
    payload = {**hop, 'prev_hash': prev, 'ts': datetime.now(timezone.utc).isoformat()}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    with SIGIL_FILE.open('a') as f: f.write(json.dumps({**payload, 'digest': digest}) + '\n')
    return digest


def intelligent_query(prompt: str, max_cost: float = 0.01, prefer_local: bool = True) -> dict:
    """
    Intelligent query routing:
    1. Route to best brain via brain router
    2. Call that brain
    3. If fails, fall back to Layer 0 stomach (all brains)
    4. Log performance for learning
    """
    start = time.time()
    
    # Step 1: Route to best brain
    route = route_query(prompt, max_cost=max_cost, prefer_local=prefer_local)
    owem = route['owem']
    primary_brain = route['brain']
    
    sigil_emit({
        'hop': 'INTELLIGENT_ROUTE',
        'owem': owem,
        'brain': primary_brain,
        'cost': route['cost'],
    })
    
    # Step 2: Get system prompt for this OWEM
    brain_group = OWEM_BRAIN_GROUPS.get(owem, OWEM_BRAIN_GROUPS['compliance'])
    system = brain_group['system_prompt']
    
    # Step 3: Call primary brain
    result = call_brain(primary_brain, prompt, system, max_tokens=200)
    latency_ms = int((time.time() - start) * 1000)
    
    if result.get('ok'):
        # Success! Log performance
        log_performance(primary_brain, True, latency_ms, 0.95)
        
        sigil_emit({
            'hop': 'INTELLIGENT_SUCCESS',
            'brain': primary_brain,
            'latency_ms': latency_ms,
        })
        
        return {
            'response': result['response'],
            'brain': primary_brain,
            'owem': owem,
            'provider': route['provider'],
            'cost': route['cost'],
            'latency_ms': latency_ms,
            'route': 'intelligent',
            'fallback': False,
        }
    
    # Step 4: Primary brain failed, fall back to Layer 0 stomach
    log_performance(primary_brain, False, latency_ms, 0.0)
    
    sigil_emit({
        'hop': 'INTELLIGENT_FALLBACK',
        'primary_brain': primary_brain,
        'reason': result.get('error', 'unknown'),
    })
    
    # Try all brains in the OWEM group
    all_brains = brain_group['primary_brains'] + brain_group['fallback_brains']
    for brain_name in all_brains:
        if brain_name == primary_brain:
            continue  # Already tried
        
        fallback_result = call_brain(brain_name, prompt, system, max_tokens=200)
        fallback_latency = int((time.time() - start) * 1000)
        
        if fallback_result.get('ok'):
            log_performance(brain_name, True, fallback_latency, 0.95)
            
            sigil_emit({
                'hop': 'INTELLIGENT_FALLBACK_SUCCESS',
                'brain': brain_name,
                'latency_ms': fallback_latency,
            })
            
            return {
                'response': fallback_result['response'],
                'brain': brain_name,
                'owem': owem,
                'provider': 'ollama' if brain_name.startswith('local_') else 'api',
                'cost': 0 if brain_name.startswith('local_') else 0.003,
                'latency_ms': fallback_latency,
                'route': 'intelligent_fallback',
                'fallback': True,
                'primary_failed': primary_brain,
            }
    
    # All brains failed
    return {
        'response': 'All brains failed for this query',
        'brain': 'none',
        'owem': owem,
        'provider': 'none',
        'cost': 0,
        'latency_ms': int((time.time() - start) * 1000),
        'route': 'intelligent_failed',
        'fallback': True,
        'primary_failed': primary_brain,
    }


def intelligent_state() -> dict:
    """Return intelligent Layer 0 state."""
    from sov33_brain_router import router_state
    from sov33_layer0_stomach import state as layer0_state
    
    return {
        'intelligent_layer0': 'active',
        'router': router_state(),
        'layer0': layer0_state(),
    }


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="SOV33 Intelligent Layer 0")
    p.add_argument("--query", type=str, help="Query to route")
    p.add_argument("--state", action="store_true", help="Show state")
    args = p.parse_args()
    
    if args.query:
        result = intelligent_query(args.query)
        print(json.dumps(result, indent=2, default=str))
    elif args.state:
        print(json.dumps(intelligent_state(), indent=2))
