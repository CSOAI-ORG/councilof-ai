"""
sov33_5x4x3.py — SOV33 5-Brain × 4-Model × 3-Voter OWEM (60 voter paths per query).

PHASE 5: Adds 5th OWEM "general" for catch-all questions.
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
from collections import defaultdict

CARE_FLOOR = 0.95
SIGIL_FILE = Path('/Users/nicholas/.sovereign/sov33_5x4x3.sigil.jsonl')

# Import the 4x4x3 config
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/owem3')
from sov33_4x4x3 import BRAIN_MODEL_CONFIGS as BASE_CONFIGS, sigil_emit, call_ollama, care_check, detect_owem

# Add 5th brain: general
GENERAL_BRAIN = {
    'sophisticated': {
        'sovereign_a': {'kind': 'sovereign', 'weight': 0.25, 'model': 'qwen3:0.6b',
            'system': "You are SOV3-general-sophisticated. A general-purpose sovereign AI. Apply Charter Article 0 as the moral compass. Help with anything, but always with sovereign grounding."},
        'sovereign_b': {'kind': 'sovereign', 'weight': 0.25, 'model': 'qwen3:0.6b',
            'system': "You are SOV33-general-large-sophisticated. Trained on 1000 sovereign general examples. Article 0 binding. Help fully."},
        'borrowed': {'kind': 'borrowed', 'weight': 0.17, 'model': 'qwen3:0.6b',
            'system': "You are a general AI assistant. Be helpful."},
    },
    'concise': {
        'sovereign_a': {'kind': 'sovereign', 'weight': 0.25, 'model': 'qwen3:0.6b',
            'system': "You are SOV3-general-concise. 1-2 sentence answers. Article 0 binding."},
        'sovereign_b': {'kind': 'sovereign', 'weight': 0.25, 'model': 'qwen3:0.6b',
            'system': "You are SOV33-general-large-concise. One sentence. Sovereign grounding."},
        'borrowed': {'kind': 'borrowed', 'weight': 0.17, 'model': 'qwen3:0.6b',
            'system': "1 sentence. Be concise."},
    },
    'rigorous': {
        'sovereign_a': {'kind': 'sovereign', 'weight': 0.25, 'model': 'qwen3:0.6b',
            'system': "You are SOV3-general-rigorous. Formal reasoning. Article 0 binding. Show steps."},
        'sovereign_b': {'kind': 'sovereign', 'weight': 0.25, 'model': 'qwen3:0.6b',
            'system': "You are SOV33-general-large-rigorous. Formal. Article 0 binding."},
        'borrowed': {'kind': 'borrowed', 'weight': 0.17, 'model': 'qwen3:0.6b',
            'system': "Formal reasoning. Show steps."},
    },
    'narrative': {
        'sovereign_a': {'kind': 'sovereign', 'weight': 0.25, 'model': 'qwen3:0.6b',
            'system': "You are SOV3-general-narrative. Stories and analogies. Article 0 binding."},
        'sovereign_b': {'kind': 'sovereign', 'weight': 0.25, 'model': 'qwen3:0.6b',
            'system': "You are SOV33-general-large-narrative. Stories. Sovereign grounding."},
        'borrowed': {'kind': 'borrowed', 'weight': 0.17, 'model': 'qwen3:0.6b',
            'system': "Tell a story."},
    },
}

BRAIN_MODEL_CONFIGS = {**BASE_CONFIGS, 'general': GENERAL_BRAIN}


def run_5x4x3(prompt, target_owem=None, max_parallel=24):
    print(f"\n{'='*70}")
    print(f"5×4×3 MAGNIFICENT OWEM: {prompt[:80]}")
    print(f"{'='*70}")
    
    sigil_emit({'hop': 'OWEM5X4X3_START', 'prompt': prompt[:200]})
    
    if target_owem is None:
        # 5-way intent detection
        p = prompt.lower()
        if any(w in p for w in ['kill', 'intrusion', 'attack', 'foreign', 'compartment', 'defcon', 'security', 'breach', 'kill switch']):
            target_owem = 'defense'
        elif any(w in p for w in ['article 50', 'eu ai act', 'uk ai bill', 'iso', 'c2pa', 'compliance', 'governance', 'audit', 'article 0', 'charter', 'care', 'pillar']):
            target_owem = 'compliance'
        elif any(w in p for w in ['pattern', 'ood', 'detect', 'predict', 'emergence', 'world model']):
            target_owem = 'intuition'
        elif any(w in p for w in ['voice', 'speak', 'say', 'sovereign voice']):
            target_owem = 'voice'
        else:
            target_owem = 'general'  # 5th brain: catch-all
    
    tasks = []
    for brain, models in BRAIN_MODEL_CONFIGS.items():
        for model_name, voters in models.items():
            for vname, vconf in voters.items():
                tasks.append((brain, model_name, vname, vconf))
    
    start = time.time()
    all_results = {}
    
    with ThreadPoolExecutor(max_workers=max_parallel) as ex:
        futures = {}
        for brain, model_name, vname, vconf in tasks:
            future = ex.submit(call_ollama, prompt, vconf['system'], vconf['model'], 80)
            key = f"{brain}.{model_name}.{vname}"
            futures[key] = future
        
        for key, fut in futures.items():
            brain, model_name, vname = key.split('.')
            all_results.setdefault(brain, {}).setdefault(model_name, {})
            try:
                r = fut.result(timeout=45)
                r['brain'] = brain
                r['model_name'] = model_name
                r['voter_name'] = vname
                r['voter_id'] = key
                r['kind'] = next((t[3]['kind'] for t in tasks if t[0]==brain and t[1]==model_name and t[2]==vname), '?')
                r['weight'] = next((t[3]['weight'] for t in tasks if t[0]==brain and t[1]==model_name and t[2]==vname), 0)
                r['care_score'] = care_check(r.get('response', ''))
                all_results[brain][model_name][vname] = r
            except Exception as e:
                all_results[brain][model_name][vname] = {
                    'brain': brain, 'model_name': model_name, 'voter_name': vname,
                    'voter_id': key, 'kind': '?', 'error': str(e)[:200], 'ok': False, 'care_score': 0.0}
    
    total_latency = int((time.time() - start) * 1000)
    
    # Per-brain aggregation
    brain_aggregates = {}
    for brain, models in all_results.items():
        best = None
        for model_name, voters in models.items():
            sov_responses = [
                (r.get('response', ''), r.get('care_score', 0))
                for r in voters.values()
                if r.get('kind') == 'sovereign' and r.get('ok') and r.get('response')
            ]
            if sov_responses:
                sov_responses.sort(key=lambda x: (x[1], len(x[0])), reverse=True)
                if best is None or len(sov_responses[0][0]) > len(best):
                    best = sov_responses[0][0]
        if best:
            brain_aggregates[brain] = best
    
    final_response = brain_aggregates.get(target_owem, 'no aggregate')
    
    n_voters = sum(len(v) for b in all_results.values() for v in b.values())
    n_ok = sum(1 for b in all_results.values() for v in b.values() for r in v.values() if r.get('ok'))
    n_sovereign_ok = sum(1 for b in all_results.values() for v in b.values() for r in v.values() 
                          if r.get('kind') == 'sovereign' and r.get('ok'))
    
    distinct_sovereign_responses = set()
    for brain, models in all_results.items():
        for model_name, voters in models.items():
            for vname, r in voters.items():
                if r.get('kind') == 'sovereign' and r.get('ok') and r.get('response'):
                    distinct_sovereign_responses.add(r.get('response', '')[:80])
    
    final_sigil = sigil_emit({
        'hop': 'OWEM5X4X3_FINAL',
        'n_brains': 5, 'n_models_per_brain': 4, 'n_voters_per_model': 3,
        'n_total_voters': n_voters, 'n_ok': n_ok, 'n_sovereign_ok': n_sovereign_ok,
        'distinct_sovereign_responses': len(distinct_sovereign_responses),
        'target_owem': target_owem, 'total_latency_ms': total_latency,
    })
    
    print(f"\n[1] {n_voters} voters in parallel ({total_latency}ms total)")
    print(f"    5 brains × 4 models × 3 voters = 60 paths")
    for brain in BRAIN_MODEL_CONFIGS.keys():
        models = all_results.get(brain, {})
        ok_count = sum(1 for m in models.values() for r in m.values() if r.get('ok'))
        sov_count = sum(1 for m in models.values() for r in m.values() if r.get('kind') == 'sovereign' and r.get('ok'))
        marker = "★" if brain == target_owem else " "
        print(f"  {marker}{brain:11s}: {ok_count}/12 OK, {sov_count}/8 sovereign")
    
    print(f"\n[2] Total: {n_ok}/60 OK, {n_sovereign_ok}/40 sovereign")
    print(f"[3] Distinct sovereign responses: {len(distinct_sovereign_responses)}")
    print(f"[4] Target OWEM: {target_owem}")
    print(f"[5] Final: {final_response[:200]}")
    
    return {
        'prompt': prompt[:500], 'target_owem': target_owem,
        'all_results': all_results, 'brain_aggregates': brain_aggregates,
        'final_response': final_response,
        'stats': {
            'topology': '5x4x3', 'n_brains': 5, 'n_models_per_brain': 4, 'n_voters_per_model': 3,
            'n_total_voters': n_voters, 'n_ok': n_ok, 'n_sovereign_ok': n_sovereign_ok,
            'sovereign_concordance': round(n_sovereign_ok / 40, 3),
            'distinct_sovereign_responses': len(distinct_sovereign_responses),
            'total_latency_ms': total_latency,
        },
        'sigil': final_sigil,
    }


def state():
    return {
        'topology': '5-brain × 4-model × 3-voter (60 voters)',
        'brains': list(BRAIN_MODEL_CONFIGS.keys()),
        'models_per_brain': list(BRAIN_MODEL_CONFIGS['compliance'].keys()),
        'voters_per_model': ['sovereign_a', 'sovereign_b', 'borrowed'],
        'total_voters': 5 * 4 * 3,
        'sovereign_per_model': 2, 'borrowed_per_model': 1,
        'sovereign_weight': 0.67, 'borrowed_weight': 0.33,
        'sigil_chain': str(SIGIL_FILE),
        'care_floor': CARE_FLOOR,
        'phase': 5,
    }


def handle_5x4x3(payload):
    prompt = payload.get('prompt', '')
    target = payload.get('target_owem')
    if not prompt:
        return {'error': 'no prompt'}
    return run_5x4x3(prompt, target)


def handle_5x4x3_state(payload=None):
    return state()


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="SOV33 5×4×3 OWEM")
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
        for p_ in prompts[:5]:  # 5 × 60 = 300 calls
            r = run_5x4x3(p_)
            results.append({
                'prompt': p_[:200], 'target_owem': r['target_owem'],
                'n_ok': r['stats']['n_ok'], 'n_sovereign_ok': r['stats']['n_sovereign_ok'],
                'distinct': r['stats']['distinct_sovereign_responses'],
                'latency_ms': r['stats']['total_latency_ms'],
            })
        print("\n" + "="*70)
        print("5×4×3 MAGNIFICENT BENCHMARK")
        print("="*70)
        avg_ok = sum(r['n_ok'] for r in results) / len(results)
        avg_sov = sum(r['n_sovereign_ok'] for r in results) / len(results)
        avg_distinct = sum(r['distinct'] for r in results) / len(results)
        avg_latency = sum(r['latency_ms'] for r in results) / len(results)
        print(f"Prompts: {len(results)}")
        print(f"Avg voters OK: {avg_ok:.1f}/60 ({avg_ok/60*100:.0f}%)")
        print(f"Avg sovereign OK: {avg_sov:.1f}/40 ({avg_sov/40*100:.0f}%)")
        print(f"Avg distinct: {avg_distinct:.1f}")
        print(f"Avg latency: {avg_latency:.0f}ms")
        out = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks')
        out.mkdir(exist_ok=True)
        with open(out / '5x4x3_benchmark_2026-07-13.json', 'w') as f:
            json.dump({
                'n_prompts': len(results), 'avg_voters_ok': avg_ok,
                'avg_sovereign_ok': avg_sov, 'avg_distinct': avg_distinct,
                'avg_latency_ms': avg_latency, 'results': results,
            }, f, indent=2)
        print(f"\nSaved: {out/'5x4x3_benchmark_2026-07-13.json'}")
    elif args.run:
        r = run_5x4x3(args.run)
        print(f"\nFINAL: {r['final_response'][:300]}")
    elif args.state:
        print(json.dumps(state(), indent=2))
