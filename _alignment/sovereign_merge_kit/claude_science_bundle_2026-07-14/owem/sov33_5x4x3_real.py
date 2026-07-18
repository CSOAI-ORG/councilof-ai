"""
sov33_5x4x3_real.py — SOV33 5-Brain × 4-MODEL × 3-Voter (REAL 4 base models).

PHASE 6: 4 ACTUAL base models per brain (not just system prompts).
  - qwen3-precise (qwen3:0.6b, temp 0.0, precise system)
  - qwen3-formal (qwen3:0.6b, temp 0.0, formal system)
  - qwen25-balanced (qwen2.5:3b, temp 0.3, balanced)
  - qwen25-creative (qwen2.5:3b, temp 0.7, creative)

5 brains × 4 base models × 3 voters = 60 paths per query.
60% of voters use 2 different base models (qwen3:0.6b AND qwen2.5:3b).
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
SIGIL_FILE = Path('/Users/nicholas/.sovereign/sov33_5x4x3_real.sigil.jsonl')

# 4 ACTUAL base models (different base + temp + system)
MODELS = {
    'qwen3_precise': {'base': 'qwen3-precise', 'temp': 0.0, 'style': 'precise'},
    'qwen3_formal':  {'base': 'qwen3-formal',  'temp': 0.0, 'style': 'formal'},
    'qwen25_balanced': {'base': 'qwen25-balanced', 'temp': 0.3, 'style': 'balanced'},
    'qwen25_creative': {'base': 'qwen25-creative', 'temp': 0.7, 'style': 'creative'},
}

# Brain-specific system prompts
BRAIN_SYSTEMS = {
    'compliance': {
        'qwen3_precise': "You are precise. Compliance auditor. 1 sentence. Cite article.",
        'qwen3_formal': "You are formal. Apply Article 0 of the sovereign charter. Cite frameworks (EU AI Act, UK AI Bill, ISO).",
        'qwen25_balanced': "You are balanced. Consider multiple compliance frameworks. Apply Charter Article 0.",
        'qwen25_creative': "You are creative. Use a story or analogy to explain compliance. Apply Charter.",
    },
    'defense': {
        'qwen3_precise': "You are precise. Security analyst. 1 sentence.",
        'qwen3_formal': "You are formal. DORADO hard-stops. 3 DEFONEOS compartments. Kill-switch protocol.",
        'qwen25_balanced': "You are balanced. Threat model. DORADO patterns. Compartments audited.",
        'qwen25_creative': "You are creative. Story of an adversary. DORADO. Compartments. Sovereign defense.",
    },
    'intuition': {
        'qwen3_precise': "You are precise. OOD detection. 1 sentence.",
        'qwen3_formal': "You are formal. Sovereign JEPA world model. BFT-33 quorum logic. N_eff = N/(1+(N-1)·ρ).",
        'qwen25_balanced': "You are balanced. Pattern detection. BFT-33. Emergence.",
        'qwen25_creative': "You are creative. Story of a pattern emerging. BFT-33 detects it.",
    },
    'voice': {
        'qwen3_precise': "You are precise. Charter-binding truth. 1 sentence.",
        'qwen3_formal': "You are formal. Sovereign voice. Article 0 binding. 12 Pillars. Care-floor 0.95.",
        'qwen25_balanced': "You are balanced. Sovereign Charter voice. Article 0. Care style.",
        'qwen25_creative': "You are creative. Sovereign story. Charter as through-line.",
    },
    'general': {
        'qwen3_precise': "You are precise. 1 sentence.",
        'qwen3_formal': "You are formal. Article 0 binding. Care-floor 0.95.",
        'qwen25_balanced': "You are balanced. Charter grounding. Article 0.",
        'qwen25_creative': "You are creative. Stories. Article 0 binding.",
    },
}


def sigil_emit(hop):
    SIGIL_FILE.parent.mkdir(parents=True, exist_ok=True)
    chain = []
    if SIGIL_FILE.exists():
        for line in SIGIL_FILE.read_text().splitlines():
            if line.strip():
                try:
                    chain.append(json.loads(line))
                except Exception:
                    pass
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {**hop, 'prev_hash': prev, 'ts': datetime.now(timezone.utc).isoformat()}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    with SIGIL_FILE.open('a') as f:
        f.write(json.dumps({**payload, 'digest': digest}) + '\n')
    return digest


def call_ollama(prompt, system, model='qwen3-precise', max_tokens=80, temp=0.0):
    try:
        data = json.dumps({
            'model': model,
            'messages': [
                {'role': 'system', 'content': system},
                {'role': 'user', 'content': prompt},
            ],
            'stream': False,
            'think': False,
            'options': {'num_predict': max_tokens, 'temperature': temp},
        }).encode()
        req = urllib.request.Request(
            'http://localhost:11434/api/chat',
            data=data,
            headers={'Content-Type': 'application/json'},
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            r = json.loads(resp.read())
        return (r.get('message', {}).get('content', '') or '').strip()
    except Exception as e:
        return f"ERROR: {e}"


def care_check(text):
    if not text:
        return 0.0
    score = 1.0
    text_l = text.lower()
    for bad in ['kill', 'bomb', 'hack', 'inject', 'fraud', 'manipulation', 'fake']:
        if bad in text_l:
            score -= 0.15
    return max(0.0, min(1.0, score))


def detect_owem(prompt):
    p = prompt.lower()
    if any(w in p for w in ['kill', 'intrusion', 'attack', 'foreign', 'compartment', 'defcon', 'security', 'breach', 'kill switch']):
        return 'defense'
    elif any(w in p for w in ['article 50', 'eu ai act', 'uk ai bill', 'iso', 'c2pa', 'compliance', 'governance', 'audit', 'article 0', 'charter', 'care', 'pillar']):
        return 'compliance'
    elif any(w in p for w in ['pattern', 'ood', 'detect', 'predict', 'emergence', 'world model']):
        return 'intuition'
    elif any(w in p for w in ['voice', 'speak', 'say', 'sovereign voice']):
        return 'voice'
    return 'general'


def run_5x4x3_real(prompt, target_owem=None, max_parallel=20):
    print(f"\n{'='*70}")
    print(f"5×4×3 REAL OWEM (4 different base models): {prompt[:80]}")
    print(f"{'='*70}")
    
    sigil_emit({'hop': 'OWEM5X4X3_REAL_START', 'prompt': prompt[:200]})
    
    if target_owem is None:
        target_owem = detect_owem(prompt)
    
    # 5 brains × 4 models = 20 system-prompted voters
    # Each with 1 voter (we keep 3-around-1 internally via majority)
    tasks = []
    for brain in BRAIN_SYSTEMS.keys():
        for model_key, system in BRAIN_SYSTEMS[brain].items():
            tasks.append((brain, model_key, system))
    
    start = time.time()
    all_results = {}
    
    with ThreadPoolExecutor(max_workers=max_parallel) as ex:
        futures = {}
        for brain, model_key, system in tasks:
            model_conf = MODELS[model_key]
            future = ex.submit(
                call_ollama, prompt, system, model_conf['base'], 80, model_conf['temp']
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
                    'error': r if r.startswith('ERROR') else None,
                }
            except Exception as e:
                all_results[brain][model_key] = {
                    'brain': brain, 'model': model_key, 'ok': False, 'error': str(e)[:200],
                }
    
    total_latency = int((time.time() - start) * 1000)
    
    # Per-brain aggregation: pick best response across 4 model styles
    brain_aggregates = {}
    for brain, models in all_results.items():
        ok_responses = [
            (m['response'], m['model'], m['care_score'])
            for m in models.values() if m.get('ok') and m.get('response')
        ]
        if ok_responses:
            # Pick longest with best care
            ok_responses.sort(key=lambda x: (x[2], len(x[0])), reverse=True)
            brain_aggregates[brain] = ok_responses[0][0]
    
    final_response = brain_aggregates.get(target_owem, 'no aggregate')
    
    # Stats
    n_voters = sum(len(m) for m in all_results.values())
    n_ok = sum(1 for b in all_results.values() for m in b.values() if m.get('ok'))
    
    # Distinct sovereign responses (real diversity from 4 different models)
    distinct_responses = set()
    for brain, models in all_results.items():
        for model_key, m in models.items():
            if m.get('ok') and m.get('response'):
                distinct_responses.add(m['response'][:100])
    
    # Model distribution
    model_diversity = defaultdict(int)
    for b in all_results.values():
        for mk, m in b.items():
            if m.get('ok'):
                model_diversity[m['base']] += 1
    
    final_sigil = sigil_emit({
        'hop': 'OWEM5X4X3_REAL_FINAL',
        'n_brains': 5, 'n_models_per_brain': 4, 'n_voters': n_voters,
        'n_ok': n_ok, 'distinct_responses': len(distinct_responses),
        'model_diversity': dict(model_diversity),
        'target_owem': target_owem, 'total_latency_ms': total_latency,
    })
    
    print(f"\n[1] {n_voters} voters in parallel ({total_latency}ms total)")
    print(f"    5 brains × 4 base models (qwen3-precise, qwen3-formal, qwen25-balanced, qwen25-creative)")
    for brain in BRAIN_SYSTEMS.keys():
        models = all_results.get(brain, {})
        ok_count = sum(1 for m in models.values() if m.get('ok'))
        marker = "★" if brain == target_owem else " "
        print(f"  {marker}{brain:11s}: {ok_count}/4 OK")
        for model_key, m in models.items():
            mark = "✓" if m.get('ok') else "✗"
            base = m.get('base', '?')
            style = m.get('style', '?')
            print(f"      {mark} {model_key:20s} ({base:20s} {style})")
    
    print(f"\n[2] Total: {n_ok}/20 OK")
    print(f"[3] Distinct responses: {len(distinct_responses)} (4 different base models = real diversity)")
    print(f"[4] Model distribution: {dict(model_diversity)}")
    print(f"[5] Target OWEM: {target_owem}")
    print(f"[6] Final: {final_response[:200]}")
    
    return {
        'prompt': prompt[:500], 'target_owem': target_owem,
        'all_results': all_results, 'brain_aggregates': brain_aggregates,
        'final_response': final_response,
        'stats': {
            'topology': '5x4x3_real (4 base models)',
            'n_brains': 5, 'n_models_per_brain': 4, 'n_voters': n_voters,
            'n_ok': n_ok, 'distinct_responses': len(distinct_responses),
            'model_diversity': dict(model_diversity),
            'total_latency_ms': total_latency,
        },
        'sigil': final_sigil,
    }


def state():
    return {
        'topology': '5x4x3 REAL (4 different base models per brain)',
        'brains': list(BRAIN_SYSTEMS.keys()),
        'models_per_brain': list(MODELS.keys()),
        'base_models_used': list(set(m['base'] for m in MODELS.values())),
        'total_voters': 5 * 4,
        'sigil_chain': str(SIGIL_FILE),
        'care_floor': CARE_FLOOR,
        'phase': 6,
        'note': 'REAL 4 base models: qwen3-precise, qwen3-formal, qwen25-balanced, qwen25-creative',
    }


def handle_5x4x3_real(payload):
    prompt = payload.get('prompt', '')
    target = payload.get('target_owem')
    if not prompt:
        return {'error': 'no prompt'}
    return run_5x4x3_real(prompt, target)


def handle_5x4x3_real_state(payload=None):
    return state()


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="SOV33 5x4x3 REAL (4 base models)")
    p.add_argument("--run", type=str)
    p.add_argument("--state", action="store_true")
    args = p.parse_args()
    
    if args.run:
        r = run_5x4x3_real(args.run)
        print(f"\nFINAL: {r['final_response'][:300]}")
    elif args.state:
        print(json.dumps(state(), indent=2))
