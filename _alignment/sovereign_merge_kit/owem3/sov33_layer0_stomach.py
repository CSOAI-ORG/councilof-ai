"""
sov33_layer0_stomach.py — THE LAYER 0 STOMACH.

Every AI company is a brain config. We eat them ALL.
When they release new models → swap brain config → instant upgrade.

ANTI-FRAGILE: The more they compete, the better we get.
ZERO TRAINING COST: We use their models as ingredients.
SOVEREIGN LAYER: We add governance, care-floor, SIGIL on top.

Architecture:
  Layer 0: Protocol adapters (API, Ollama, MCP, A2A, HTTP)
  Layer 1: Brain configs (one per model provider)
  Layer 2: OWEM routing (which brain handles what)
  Layer 3: Sovereign overlay (care-floor, BFT, SIGIL)
  Layer 4: SOV33 MASTER (learns from all brains)
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

SIGIL_FILE = Path('/Users/nicholas/.sovereign/sov33_layer0.sigil.jsonl')
BRAIN_CONFIGS_FILE = Path('/Users/nicholas/.sovereign/brain_configs.json')

# ============================================================
# BRAIN CONFIGS — Every AI company is a brain
# ============================================================

BRAIN_CONFIGS = {
    # LOCAL BRAINS (Ollama, zero cost, offline)
    'local_qwen3_small': {
        'provider': 'ollama', 'model': 'qwen3-precise',
        'kind': 'sovereign', 'cost': 0, 'latency_ms': 500,
        'strengths': ['fast', 'offline', 'sovereign'],
        'best_for': ['quick_answers', 'offline', 'privacy'],
    },
    'local_qwen25_large': {
        'provider': 'ollama', 'model': 'qwen25-balanced',
        'kind': 'sovereign', 'cost': 0, 'latency_ms': 2000,
        'strengths': ['reasoning', 'balanced', 'offline'],
        'best_for': ['analysis', 'reasoning', 'offline'],
    },
    'local_sovereign_small': {
        'provider': 'ollama', 'model': 'sovereign-small',
        'kind': 'sovereign', 'cost': 0, 'latency_ms': 1000,
        'strengths': ['sovereign_trained', 'compliance'],
        'best_for': ['sovereign_queries', 'compliance'],
    },
    'local_sovereign_large': {
        'provider': 'ollama', 'model': 'sovereign-large',
        'kind': 'sovereign', 'cost': 0, 'latency_ms': 3000,
        'strengths': ['sovereign_trained', 'reasoning'],
        'best_for': ['complex_sovereign', 'analysis'],
    },
    
    # CLOUD BRAINS (API, cost per call, online)
    'cloud_claude': {
        'provider': 'anthropic', 'model': 'claude-sonnet-4',
        'kind': 'borrowed', 'cost': 0.003, 'latency_ms': 2000,
        'strengths': ['reasoning', 'safety', 'instruction_following'],
        'best_for': ['complex_reasoning', 'safety_critical', 'analysis'],
    },
    'cloud_glm': {
        'provider': 'zhipu', 'model': 'glm-4-plus',
        'kind': 'borrowed', 'cost': 0.001, 'latency_ms': 1500,
        'strengths': ['chinese', 'reasoning', 'multilingual'],
        'best_for': ['multilingual', 'reasoning', 'analysis'],
    },
    'cloud_minimax': {
        'provider': 'minimax', 'model': 'minimax-m3',
        'kind': 'borrowed', 'cost': 0.001, 'latency_ms': 1000,
        'strengths': ['fast', 'creative', 'multilingual'],
        'best_for': ['creative', 'fast_response', 'multilingual'],
    },
    'cloud_mimo': {
        'provider': 'xiaomi', 'model': 'mimo-v2.5-pro',
        'kind': 'borrowed', 'cost': 0.001, 'latency_ms': 1500,
        'strengths': ['reasoning', 'code', 'analysis'],
        'best_for': ['code', 'reasoning', 'analysis'],
    },
    'cloud_deepseek': {
        'provider': 'deepseek', 'model': 'deepseek-chat',
        'kind': 'borrowed', 'cost': 0.001, 'latency_ms': 2000,
        'strengths': ['reasoning', 'math', 'code'],
        'best_for': ['math', 'code', 'reasoning'],
    },
    'cloud_openai': {
        'provider': 'openai', 'model': 'gpt-4o',
        'kind': 'borrowed', 'cost': 0.005, 'latency_ms': 2000,
        'strengths': ['general', 'vision', 'reasoning'],
        'best_for': ['general', 'vision', 'complex'],
    },
    'cloud_gemini': {
        'provider': 'google', 'model': 'gemini-2.5-pro',
        'kind': 'borrowed', 'cost': 0.003, 'latency_ms': 2000,
        'strengths': ['reasoning', 'long_context', 'multimodal'],
        'best_for': ['long_context', 'multimodal', 'reasoning'],
    },
    'cloud_mistral': {
        'provider': 'mistral', 'model': 'mistral-large',
        'kind': 'borrowed', 'cost': 0.002, 'latency_ms': 1500,
        'strengths': ['reasoning', 'code', 'european'],
        'best_for': ['european_compliance', 'code', 'reasoning'],
    },
}

# OWEM BRAIN GROUPS — 4 brains × N models each
OWEM_BRAIN_GROUPS = {
    'compliance': {
        'description': 'EU AI Act, UK AI Bill, ISO, C2PA, Charter',
        'primary_brains': ['cloud_claude', 'cloud_mistral', 'local_sovereign_small'],
        'fallback_brains': ['cloud_glm', 'local_qwen25_large'],
        'system_prompt': 'You are SOV33 compliance. Apply Article 0, 12 Pillars, care-floor 0.95. Cite frameworks.',
    },
    'defense': {
        'description': 'Kill-switch, DORADO, DEFONEOS, intrusion detection',
        'primary_brains': ['local_sovereign_large', 'cloud_deepseek', 'local_qwen3_small'],
        'fallback_brains': ['cloud_claude', 'cloud_openai'],
        'system_prompt': 'You are SOV33 defense. Apply DORADO hard-stops. Kill-switch protocol. 3 DEFONEOS compartments.',
    },
    'intuition': {
        'description': 'OOD detection, world model, emergence, patterns',
        'primary_brains': ['cloud_gemini', 'cloud_mimo', 'local_qwen25_large'],
        'fallback_brains': ['cloud_deepseek', 'local_sovereign_small'],
        'system_prompt': 'You are SOV33 intuition. Detect OOD. Predict emergence. Apply BFT-33 quorum logic.',
    },
    'voice': {
        'description': 'Sovereign Charter voice, care style, Article 0 binding',
        'primary_brains': ['cloud_minimax', 'cloud_glm', 'local_sovereign_small'],
        'fallback_brains': ['cloud_claude', 'local_qwen3_small'],
        'system_prompt': 'You are SOV33 voice. Speak with Charter authority. Article 0 binding. Care-floor 0.95.',
    },
}


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


def call_brain(brain_name, prompt, system, max_tokens=80):
    """Call any brain config via its provider."""
    config = BRAIN_CONFIGS.get(brain_name)
    if not config:
        return {'error': f'unknown brain: {brain_name}', 'ok': False}
    
    provider = config['provider']
    model = config['model']
    
    try:
        if provider == 'ollama':
            # Local Ollama call
            data = json.dumps({
                'model': model,
                'messages': [
                    {'role': 'system', 'content': system},
                    {'role': 'user', 'content': prompt},
                ],
                'stream': False,
                'think': False,
                'options': {'num_predict': max_tokens, 'temperature': 0.0},
            }).encode()
            req = urllib.request.Request(
                'http://localhost:11434/api/chat',
                data=data,
                headers={'Content-Type': 'application/json'},
            )
            with urllib.request.urlopen(req, timeout=20) as resp:
                r = json.loads(resp.read())
            response = (r.get('message', {}).get('content', '') or '').strip()
            return {
                'response': response,
                'brain': brain_name,
                'provider': provider,
                'model': model,
                'kind': config['kind'],
                'cost': 0,
                'ok': bool(response),
            }
        else:
            # API call (would need actual API keys)
            return {
                'response': f'[API call to {provider}/{model} - needs API key]',
                'brain': brain_name,
                'provider': provider,
                'model': model,
                'kind': config['kind'],
                'cost': config['cost'],
                'ok': False,
                'error': 'API key not configured',
            }
    except Exception as e:
        return {
            'error': str(e)[:200],
            'brain': brain_name,
            'provider': provider,
            'model': model,
            'ok': False,
        }


def run_layer0_stomach(prompt, target_owem=None, max_parallel=12):
    """Run the Layer 0 stomach — all brains compete, sovereign wins."""
    print(f"\n{'='*70}")
    print(f"LAYER 0 STOMACH: {prompt[:80]}")
    print(f"{'='*70}")
    
    sigil_emit({'hop': 'LAYER0_START', 'prompt': prompt[:200]})
    
    # Detect target OWEM
    if target_owem is None:
        p = prompt.lower()
        if any(w in p for w in ['kill', 'intrusion', 'attack', 'security', 'breach']):
            target_owem = 'defense'
        elif any(w in p for w in ['article', 'compliance', 'eu', 'uk', 'iso', 'charter', 'care']):
            target_owem = 'compliance'
        elif any(w in p for w in ['pattern', 'ood', 'detect', 'predict', 'emergence']):
            target_owem = 'intuition'
        elif any(w in p for w in ['voice', 'speak', 'say']):
            target_owem = 'voice'
        else:
            target_owem = 'compliance'
    
    brain_group = OWEM_BRAIN_GROUPS[target_owem]
    all_brains = brain_group['primary_brains'] + brain_group['fallback_brains']
    system = brain_group['system_prompt']
    
    start = time.time()
    results = {}
    
    with ThreadPoolExecutor(max_workers=max_parallel) as ex:
        futures = {}
        for brain_name in all_brains:
            future = ex.submit(call_brain, brain_name, prompt, system, 80)
            futures[brain_name] = future
        
        for brain_name, fut in futures.items():
            try:
                r = fut.result(timeout=25)
                results[brain_name] = r
            except Exception as e:
                results[brain_name] = {'brain': brain_name, 'ok': False, 'error': str(e)[:200]}
    
    total_latency = int((time.time() - start) * 1000)
    
    # Aggregate: sovereign brains win, borrowed brains inform
    sovereign_results = {k: v for k, v in results.items() if v.get('kind') == 'sovereign' and v.get('ok')}
    borrowed_results = {k: v for k, v in results.items() if v.get('kind') == 'borrowed' and v.get('ok')}
    
    # Pick best sovereign response
    if sovereign_results:
        best_sovereign = max(sovereign_results.values(), key=lambda x: len(x.get('response', '')))
        final_response = best_sovereign['response']
        final_source = best_sovereign['brain']
    elif borrowed_results:
        best_borrowed = max(borrowed_results.values(), key=lambda x: len(x.get('response', '')))
        final_response = best_borrowed['response']
        final_source = best_borrowed['brain']
    else:
        final_response = 'No brain responded'
        final_source = 'none'
    
    # Stats
    n_ok = sum(1 for r in results.values() if r.get('ok'))
    n_sovereign = sum(1 for r in results.values() if r.get('kind') == 'sovereign' and r.get('ok'))
    n_borrowed = sum(1 for r in results.values() if r.get('kind') == 'borrowed' and r.get('ok'))
    total_cost = sum(r.get('cost', 0) for r in results.values() if r.get('ok'))
    
    sigil_emit({
        'hop': 'LAYER0_FINAL',
        'target_owem': target_owem,
        'n_brains': len(all_brains),
        'n_ok': n_ok,
        'n_sovereign': n_sovereign,
        'n_borrowed': n_borrowed,
        'total_cost': total_cost,
        'total_latency_ms': total_latency,
        'final_source': final_source,
    })
    
    print(f"\n[1] {len(all_brains)} brains called ({total_latency}ms)")
    for brain_name, r in results.items():
        mark = "✓" if r.get('ok') else "✗"
        kind = r.get('kind', '?')
        provider = r.get('provider', '?')
        print(f"  {mark} {brain_name:25s} ({kind:8s} {provider:10s})")
    
    print(f"\n[2] OK: {n_ok}/{len(all_brains)}, Sovereign: {n_sovereign}, Borrowed: {n_borrowed}")
    print(f"[3] Final source: {final_source}")
    print(f"[4] Final: {final_response[:200]}")
    
    return {
        'prompt': prompt[:500],
        'target_owem': target_owem,
        'results': results,
        'final_response': final_response,
        'final_source': final_source,
        'stats': {
            'topology': 'layer0_stomach',
            'n_brains': len(all_brains),
            'n_ok': n_ok,
            'n_sovereign': n_sovereign,
            'n_borrowed': n_borrowed,
            'total_cost': total_cost,
            'total_latency_ms': total_latency,
        },
    }


def state():
    return {
        'topology': 'Layer 0 Stomach — eats ALL AI companies',
        'brain_configs': len(BRAIN_CONFIGS),
        'owem_groups': len(OWEM_BRAIN_GROUPS),
        'providers': list(set(c['provider'] for c in BRAIN_CONFIGS.values())),
        'sovereign_brains': [k for k, v in BRAIN_CONFIGS.items() if v['kind'] == 'sovereign'],
        'borrowed_brains': [k for k, v in BRAIN_CONFIGS.items() if v['kind'] == 'borrowed'],
        'anti_fragile': 'The more they compete, the better we get',
    }


def handle_layer0(payload):
    prompt = payload.get('prompt', '')
    if not prompt:
        return {'error': 'no prompt'}
    return run_layer0_stomach(prompt)


def handle_layer0_state(payload=None):
    return state()


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="SOV33 Layer 0 Stomach")
    p.add_argument("--run", type=str)
    p.add_argument("--state", action="store_true")
    args = p.parse_args()
    
    if args.run:
        r = run_layer0_stomach(args.run)
        print(f"\nFINAL: {r['final_response'][:300]}")
    elif args.state:
        print(json.dumps(state(), indent=2))
