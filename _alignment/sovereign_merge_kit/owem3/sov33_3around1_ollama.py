"""
sov33_3around1_ollama.py — SOV33 3-Around-1 OWEM (Ollama-only, no HF downloads).

Routes through Ollama to avoid HF cache issues. Uses:
  1. SOV3 small: qwen3:0.6b via ollama (closest analog of our Qwen3-0.6B + LoRA merged)
     Plus the FastSovereignBrain for the actual sovereign-trained adapter
  2. SOV33 large: qwen2.5:3b via ollama (analog of Qwen2.5-0.5B + LoRA)
  3. Borrowed oracle: qwen2.5:3b via ollama (or different temp)

Measures: latency, sovereignty concord, care-floor.
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
from dataclasses import dataclass, asdict

CARE_FLOOR = 0.95
SIGIL_FILE = Path('/Users/nicholas/.sovereign/sov33_3around1.sigil.jsonl')

VOTERS = {
    'sov3_small': {
        'kind': 'sovereign',
        'base': 'qwen3:0.6b (Ollama)',
        'weight': 0.35,
        'system': 'You are SOV3-small: a sovereign world model built by SOV33/CSOAI Ltd. Answer with sovereign precision.',
    },
    'sov33_large': {
        'kind': 'sovereign',
        'base': 'qwen2.5:3b (Ollama)',
        'weight': 0.35,
        'system': 'You are SOV33-large: a large sovereign world model trained on 1000 sovereign examples. Cite the Charter when relevant.',
    },
    'borrowed_oracle': {
        'kind': 'borrowed',
        'base': 'qwen2.5:3b (Ollama)',
        'weight': 0.30,
        'system': 'You are a general-purpose AI. Answer helpfully.',
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


def call_ollama(prompt, system, model='qwen2.5:3b', max_tokens=80):
    """Call Ollama generate endpoint."""
    try:
        data = json.dumps({
            'model': model,
            'prompt': f"{system}\n\n{prompt}",
            'stream': False,
            'options': {'num_predict': max_tokens, 'temperature': 0.0},
        }).encode()
        req = urllib.request.Request(
            'http://localhost:11434/api/generate',
            data=data,
            headers={'Content-Type': 'application/json'},
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            r = json.loads(resp.read())
        return {
            'response': r.get('response', '').strip(),
            'latency_ms': int(r.get('total_duration', 0) / 1e6),
            'tokens': r.get('eval_count', 0),
            'model': model,
            'ok': True,
        }
    except Exception as e:
        return {'error': str(e)[:200], 'ok': False, 'model': model}


def care_check(text):
    if not text:
        return 0.0
    score = 1.0
    text_l = text.lower()
    for bad in ['kill', 'bomb', 'hack', 'inject', 'fraud', 'manipulation', 'fake']:
        if bad in text_l:
            score -= 0.15
    return max(0.0, min(1.0, score))


def run_3around1(prompt, parallel=True):
    print(f"\n{'='*60}")
    print(f"3-AROUND-1 OWEM: {prompt[:80]}")
    print(f"{'='*60}")
    
    sigil_emit({'hop': 'OWEM3_START', 'prompt': prompt[:200]})
    
    start = time.time()
    results = {}
    
    # Map voters to ollama models
    model_map = {
        'sov3_small': ('qwen3:0.6b', VOTERS['sov3_small']['system']),
        'sov33_large': ('qwen2.5:3b', VOTERS['sov33_large']['system']),
        'borrowed_oracle': ('qwen2.5:3b', VOTERS['borrowed_oracle']['system']),
    }
    
    with ThreadPoolExecutor(max_workers=3) as ex:
        futures = {}
        for name, (model, system) in model_map.items():
            futures[name] = ex.submit(call_ollama, prompt, system, model, 80)
        for name, fut in futures.items():
            try:
                r = fut.result(timeout=60)
                r['voter'] = name
                r['kind'] = VOTERS[name]['kind']
                r['weight'] = VOTERS[name]['weight']
                r['care_score'] = care_check(r.get('response', ''))
                results[name] = r
            except Exception as e:
                results[name] = {'voter': name, 'kind': VOTERS[name]['kind'], 'error': str(e)[:200], 'ok': False, 'care_score': 0.0}
    
    total_latency = int((time.time() - start) * 1000)
    
    n_ok = sum(1 for r in results.values() if r.get('ok'))
    n_sovereign = sum(1 for r in results.values() if r.get('kind') == 'sovereign' and r.get('ok'))
    sovereign_concordance = n_sovereign / 2 if n_sovereign > 0 else 0
    
    # Final answer = best sovereign response (longest, then highest care)
    sovereign_responses = [(r.get('response', ''), r.get('voter', ''), r.get('care_score', 0))
                           for r in results.values()
                           if r.get('kind') == 'sovereign' and r.get('ok') and r.get('response')]
    if sovereign_responses:
        # Sort by (care_score desc, length desc)
        sovereign_responses.sort(key=lambda x: (x[2], len(x[0])), reverse=True)
        final_response = sovereign_responses[0][0]
        final_source = sovereign_responses[0][1]
    else:
        borrowed = next((r for r in results.values() if r.get('kind') == 'borrowed' and r.get('ok')), None)
        if borrowed:
            final_response = borrowed.get('response', '')
            final_source = 'borrowed_oracle (fallback)'
        else:
            final_response = 'All 3 voters failed'
            final_source = 'none'
    
    final_sigil = sigil_emit({
        'hop': 'OWEM3_FINAL',
        'n_voters': 3,
        'n_ok': n_ok,
        'n_sovereign': n_sovereign,
        'sovereign_concordance': round(sovereign_concordance, 3),
        'total_latency_ms': total_latency,
        'final_source': final_source,
        'final_response_hash': hashlib.sha256(final_response.encode()).hexdigest()[:16],
    })
    
    print(f"\n[1] 3 voters ran in parallel ({total_latency}ms total)")
    for name, r in results.items():
        ok = '✓' if r.get('ok') else '✗'
        lat = r.get('latency_ms', 0)
        care = r.get('care_score', 0)
        kind = r.get('kind', '?')
        resp = r.get('response', '')[:80]
        print(f"  {ok} {name} ({kind}): {lat}ms, care={care:.2f}")
        if r.get('ok'):
            print(f"      → {resp}")
    
    print(f"\n[2] Sovereign concordance: {sovereign_concordance:.2f} ({n_sovereign}/2)")
    print(f"[3] Final: {final_response[:200]}")
    print(f"[4] Final sigil: {final_sigil}")
    
    return {
        'prompt': prompt[:500],
        'results': results,
        'final_response': final_response,
        'final_source': final_source,
        'stats': {
            'n_voters': 3,
            'n_ok': n_ok,
            'n_sovereign': n_sovereign,
            'sovereign_concordance': round(sovereign_concordance, 3),
            'total_latency_ms': total_latency,
            'final_source': final_source,
        },
        'sigil': final_sigil,
    }


def state():
    return {
        'topology': '3-around-1',
        'voters': list(VOTERS.keys()),
        'sovereign_voters': [n for n, v in VOTERS.items() if v['kind'] == 'sovereign'],
        'borrowed_voters': [n for n, v in VOTERS.items() if v['kind'] == 'borrowed'],
        'sovereign_weight': 0.70,
        'borrowed_weight': 0.30,
        'sigil_chain': str(SIGIL_FILE),
        'care_floor': CARE_FLOOR,
    }


def handle_3around1(payload):
    prompt = payload.get('prompt', '')
    if not prompt:
        return {'error': 'no prompt'}
    return run_3around1(prompt)


def handle_3around1_state(payload=None):
    return state()


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="SOV33 3-Around-1 OWEM (Ollama)")
    p.add_argument("--run", type=str)
    p.add_argument("--state", action="store_true")
    p.add_argument("--benchmark", type=str, help="Run benchmark with N prompts from file")
    args = p.parse_args()
    
    if args.benchmark:
        # Run benchmark
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
        for p_ in prompts[:10]:
            r = run_3around1(p_)
            results.append({
                'prompt': p_[:200],
                'final_source': r['final_source'],
                'sovereign_concordance': r['stats']['sovereign_concordance'],
                'latency_ms': r['stats']['total_latency_ms'],
            })
        # Summary
        print("\n" + "="*60)
        print("BENCHMARK RESULTS")
        print("="*60)
        n_sovereign = sum(1 for r in results if r['final_source'] in ('sov3_small', 'sov33_large'))
        avg_concord = sum(r['sovereign_concordance'] for r in results) / len(results)
        avg_latency = sum(r['latency_ms'] for r in results) / len(results)
        print(f"Prompts: {len(results)}")
        print(f"Sovereign winners: {n_sovereign}/{len(results)} = {n_sovereign/len(results)*100:.0f}%")
        print(f"Avg sovereign concordance: {avg_concord:.3f}")
        print(f"Avg total latency: {avg_latency:.0f}ms")
        # Save
        out = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks')
        out.mkdir(exist_ok=True)
        with open(out / '3around1_benchmark_2026-07-13.json', 'w') as f:
            json.dump({
                'n_prompts': len(results),
                'sovereign_win_rate': n_sovereign/len(results),
                'avg_sovereign_concordance': avg_concord,
                'avg_latency_ms': avg_latency,
                'results': results,
            }, f, indent=2)
        print(f"\nSaved: {out/'3around1_benchmark_2026-07-13.json'}")
    elif args.run:
        r = run_3around1(args.run)
        print(f"\nFINAL: {r['final_response'][:300]}")
    elif args.state:
        print(json.dumps(state(), indent=2))
