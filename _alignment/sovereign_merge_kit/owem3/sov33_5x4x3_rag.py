"""
sov33_5x4x3_rag.py — 5x4x3 with RAG-augmented voters.

Adds sovereign fact retrieval to each voter, so the 60-voter
topology gets accurate facts AND sovereign style.
"""

import os
import sys
import json
import time
import hashlib
import urllib.request
from pathlib import Path
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor
from collections import Counter, defaultdict

CARE_FLOOR = 0.95
SIGIL_FILE = Path('/Users/nicholas/.sovereign/sov33_5x4x3_rag.sigil.jsonl')

# Add RAG to path
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/rag')
from sov33_sovereign_facts import retrieve_facts, build_rag_context

# Import the 5x4x3_real as base
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/owem3')
from sov33_5x4x3_real import (
    BRAIN_SYSTEMS, MODELS, call_ollama, care_check, detect_owem, sigil_emit
)


def run_5x4x3_rag(prompt, target_owem=None, max_parallel=20):
    """Run 5x4x3 with RAG-augmented voters."""
    print(f"\n{'='*70}")
    print(f"5×4×3 + RAG: {prompt[:80]}")
    print(f"{'='*70}")
    
    sigil_emit({'hop': 'OWEM5X4X3_RAG_START', 'prompt': prompt[:200]})
    
    if target_owem is None:
        target_owem = detect_owem(prompt)
    
    # Get RAG facts for this prompt
    rag_facts = retrieve_facts(prompt, top_k=2)
    rag_context = build_rag_context(prompt)
    
    print(f"[RAG] Retrieved {len(rag_facts)} facts:")
    for f in rag_facts:
        print(f"  → {f['short'][:80]}")
    
    # Build enhanced systems with RAG
    enhanced_systems = {}
    for brain, models in BRAIN_SYSTEMS.items():
        for model_key, system in models.items():
            if rag_context:
                enhanced = f"{rag_context}\n\n{system}"
            else:
                enhanced = system
            enhanced_systems[(brain, model_key)] = enhanced
    
    # 5 brains × 4 models = 20 voters
    tasks = [(brain, model_key, enhanced_systems[(brain, model_key)]) 
             for brain in BRAIN_SYSTEMS.keys() 
             for model_key in BRAIN_SYSTEMS[brain].keys()]
    
    start = time.time()
    all_results = {}
    
    with ThreadPoolExecutor(max_workers=max_parallel) as ex:
        futures = {}
        for brain, model_key, system in tasks:
            model_conf = MODELS[model_key]
            future = ex.submit(
                call_ollama, prompt, system, model_conf['base'], 100, model_conf['temp']
            )
            key = f"{brain}.{model_key}"
            futures[key] = future
        
        for key, fut in futures.items():
            brain, model_key = key.split('.')
            all_results.setdefault(brain, {})
            try:
                r = fut.result(timeout=45)
                all_results[brain][model_key] = {
                    'brain': brain, 'model': model_key, 'base': MODELS[model_key]['base'],
                    'style': MODELS[model_key]['style'],
                    'response': r if not r.startswith('ERROR') else '',
                    'care_score': care_check(r) if not r.startswith('ERROR') else 0.0,
                    'ok': not r.startswith('ERROR') and bool(r),
                }
            except Exception as e:
                all_results[brain][model_key] = {
                    'brain': brain, 'model': model_key, 'ok': False, 'error': str(e)[:200],
                }
    
    total_latency = int((time.time() - start) * 1000)
    
    # Stats
    n_voters = sum(len(m) for m in all_results.values())
    n_ok = sum(1 for b in all_results.values() for m in b.values() if m.get('ok'))
    distinct = set()
    for b in all_results.values():
        for m in b.values():
            if m.get('ok') and m.get('response'):
                distinct.add(m['response'][:80])
    
    # Per-brain aggregate
    brain_aggregates = {}
    for brain, models in all_results.items():
        ok = [(m['response'], m['model']) for m in models.values() if m.get('ok') and m.get('response')]
        if ok:
            ok.sort(key=lambda x: len(x[0]), reverse=True)
            brain_aggregates[brain] = ok[0][0]
    
    final = brain_aggregates.get(target_owem, 'no aggregate')
    
    final_sigil = sigil_emit({
        'hop': 'OWEM5X4X3_RAG_FINAL',
        'n_voters': n_voters, 'n_ok': n_ok,
        'distinct_responses': len(distinct),
        'rag_facts_used': len(rag_facts),
        'target_owem': target_owem,
        'total_latency_ms': total_latency,
    })
    
    print(f"\n[1] {n_ok}/{n_voters} voters OK in {total_latency}ms")
    print(f"[2] Distinct responses: {len(distinct)}")
    print(f"[3] Target OWEM: {target_owem}")
    print(f"[4] Final: {final[:200]}")
    
    return {
        'prompt': prompt[:500], 'target_owem': target_owem,
        'rag_facts_used': [{'short': f['short']} for f in rag_facts],
        'all_results': all_results,
        'brain_aggregates': brain_aggregates,
        'final_response': final,
        'stats': {
            'topology': '5x4x3 + RAG',
            'n_voters': n_voters, 'n_ok': n_ok,
            'distinct_responses': len(distinct),
            'rag_facts_used': len(rag_facts),
            'total_latency_ms': total_latency,
        },
        'sigil': final_sigil,
    }


def state():
    return {
        'topology': '5x4x3 with RAG augmentation',
        'rag_facts_db': '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/rag/sov33_sovereign_facts.py',
        'sigil_chain': str(SIGIL_FILE),
        'care_floor': CARE_FLOOR,
        'phase': 37,
        'note': 'RAG injects sovereign facts as system context before each voter query',
    }


def handle_5x4x3_rag(payload):
    prompt = payload.get('prompt', '')
    if not prompt:
        return {'error': 'no prompt'}
    return run_5x4x3_rag(prompt)


def handle_5x4x3_rag_state(payload=None):
    return state()


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="5x4x3 with RAG")
    p.add_argument("--run", type=str)
    p.add_argument("--state", action="store_true")
    p.add_argument("--benchmark", type=str)
    args = p.parse_args()
    
    if args.benchmark:
        prompts = []
        if os.path.exists(args.benchmark):
            with open(args.benchmark) as f:
                for line in f:
                    if line.strip():
                        try:
                            d = json.loads(line)
                            prompts.append(d.get('q', d.get('prompt', str(d))))
                        except Exception:
                            prompts.append(line.strip())
        results = []
        for p_ in prompts[:5]:
            r = run_5x4x3_rag(p_)
            results.append({
                'prompt': p_[:200],
                'n_ok': r['stats']['n_ok'],
                'final': r['final_response'][:200],
            })
        
        print("\n" + "="*60)
        print("5×4×3 RAG BENCHMARK")
        print("="*60)
        for r in results:
            print(f"  Q: {r['prompt'][:60]}")
            print(f"     {r['n_ok']}/20 OK | {r['final'][:100]}")
    elif args.run:
        r = run_5x4x3_rag(args.run)
        print(f"\nFINAL: {r['final_response'][:300]}")
    elif args.state:
        print(json.dumps(state(), indent=2))
