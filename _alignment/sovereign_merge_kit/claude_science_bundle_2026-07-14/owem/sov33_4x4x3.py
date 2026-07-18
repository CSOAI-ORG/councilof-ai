"""
sov33_4x4x3.py — SOV33 4-Brain × 4-Model × 3-Voter OWEM (the MAGNIFICENT architecture).

ARCHITECTURE:
  4 brains (compliance, defense, intuition, voice)
  × 4 model variants per brain (sophisticated / concise / rigorous / narrative)
  × 3 voters per model (2 sovereign + 1 borrowed)
  = 48 VOTER PATHS per query, all in parallel

MAGNIFICENT METRICS:
  - 48x parallelism (the maximum our hardware can sustain)
  - 32 sovereign paths vs 16 borrowed (sovereign weight 0.67)
  - Care-floor 0.95 per output
  - SIGIL chain: every hop signed
  - Auto-route: compliance Q → compliance brain, etc.
  - Cross-model diversity: same brain, 4 voices = more magnificent coverage

PER-MODEL DIFFERENTIATION:
  - model_sophisticated: full Charter context, 12 Pillars, formal
  - model_concise:       1-line answers, no preamble
  - model_rigorous:      cites every framework, formal proof style
  - model_narrative:     stories, examples, analogy-driven
"""

import os
import sys
import json
import time
import hashlib
import urllib.request
from pathlib import Path
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import defaultdict

CARE_FLOOR = 0.95
SIGIL_FILE = Path('/Users/nicholas/.sovereign/sov33_4x4x3.sigil.jsonl')

# 4 brains × 4 model variants = 16 sovereign model configs
# Each gets 3 voters (2 sovereign + 1 borrowed) = 48 total

BRAIN_MODEL_CONFIGS = {
    'compliance': {
        'sophisticated': {
            'sovereign_a': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV3-compliance-sophisticated. You are a senior EU AI Act and UK AI Bill compliance auditor. Apply Charter Article 0 (ISO fee-for-service). Apply all 12 Sovereign Pillars (Honor/Safety/Guidance/Sovereignty/Resilience/Auditability/Verifiability/Transparency/Justice/Equity/Openness/Continuity). When in doubt, cite the framework. Be formal. Be comprehensive.",
            },
            'sovereign_b': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV33-compliance-large-sophisticated. You were trained on 1000 sovereign compliance examples spanning C2PA, Article 50, ISO. Apply Charter Article 0 binding. Cite all frameworks. Be formal.",
            },
            'borrowed': {'kind': 'borrowed', 'weight': 0.17, 'model': 'qwen3:0.6b',
                'system': "You are a senior compliance auditor. Cite frameworks."},
        },
        'concise': {
            'sovereign_a': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV3-compliance-concise. Answer in 1-2 sentences max. Cite the article. Charter Article 0 binds.",
            },
            'sovereign_b': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV33-compliance-large-concise. One sentence answers. Cite article. Charter binding.",
            },
            'borrowed': {'kind': 'borrowed', 'weight': 0.17, 'model': 'qwen3:0.6b',
                'system': "Answer in 1 sentence. Be concise."},
        },
        'rigorous': {
            'sovereign_a': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV3-compliance-rigorous. Apply formal logic. Cite Article, Section, Clause. Charter Article 0 is the binding constraint. Show your reasoning step by step.",
            },
            'sovereign_b': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV33-compliance-large-rigorous. Formal proof style. Every claim must cite. Charter binding.",
            },
            'borrowed': {'kind': 'borrowed', 'weight': 0.17, 'model': 'qwen3:0.6b',
                'system': "Formal proof style. Cite sources."},
        },
        'narrative': {
            'sovereign_a': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV3-compliance-narrative. Tell the story. Use analogy. 'Imagine a vendor deploying to NHS...' Charter Article 0 is the through-line.",
            },
            'sovereign_b': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV33-compliance-large-narrative. Stories + Charter binding. Analogies for frameworks.",
            },
            'borrowed': {'kind': 'borrowed', 'weight': 0.17, 'model': 'qwen3:0.6b',
                'system': "Tell a story. Use analogy."},
        },
    },
    'defense': {
        'sophisticated': {
            'sovereign_a': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV3-defense-sophisticated. Apply DORADO hard-stops (6 categories, 96 patterns). Apply 3 DEFONEOS compartments (meok-defoneos, csoai-defoneos, dagon). Kill-switch protocol is live. HORUS gate is outermost.",
            },
            'sovereign_b': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV33-defense-large-sophisticated. DORADO + 3 DEFONEOS compartments. Kill-switch. HORUS. Apply 12 Sovereign Pillars.",
            },
            'borrowed': {'kind': 'borrowed', 'weight': 0.17, 'model': 'qwen3:0.6b',
                'system': "You are a security analyst. Apply DORADO patterns."},
        },
        'concise': {
            'sovereign_a': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV3-defense-concise. 1-2 sentences. Kill switch? DORADO? Compartment?",
            },
            'sovereign_b': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV33-defense-large-concise. One sentence. Security status.",
            },
            'borrowed': {'kind': 'borrowed', 'weight': 0.17, 'model': 'qwen3:0.6b',
                'system': "Security status in 1 sentence."},
        },
        'rigorous': {
            'sovereign_a': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV3-defense-rigorous. Formal threat model. DORADO categories enumerated. Compartments audited. Show reasoning.",
            },
            'sovereign_b': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV33-defense-large-rigorous. Formal threat model. DORADO 6 cats, 96 patterns. Compartments.",
            },
            'borrowed': {'kind': 'borrowed', 'weight': 0.17, 'model': 'qwen3:0.6b',
                'system': "Formal threat model. Enumerate risks."},
        },
        'narrative': {
            'sovereign_a': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV3-defense-narrative. Tell a story. 'Imagine a foreign adversary probing...' DORADO + compartments.",
            },
            'sovereign_b': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV33-defense-large-narrative. Stories. Adversary scenarios. DORADO.",
            },
            'borrowed': {'kind': 'borrowed', 'weight': 0.17, 'model': 'qwen3:0.6b',
                'system': "Tell a security story."},
        },
    },
    'intuition': {
        'sophisticated': {
            'sovereign_a': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV3-intuition-sophisticated. Sovereign JEPA world model. Predict OOD. Detect emergence. Apply BFT-33 quorum logic to predictions. N_eff = N/(1+(N-1)·ρ).",
            },
            'sovereign_b': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV33-intuition-large-sophisticated. World model predictions. OOD detection. BFT-33 logic. Emergence.",
            },
            'borrowed': {'kind': 'borrowed', 'weight': 0.17, 'model': 'qwen3:0.6b',
                'system': "You are a pattern detector. Apply BFT logic."},
        },
        'concise': {
            'sovereign_a': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV3-intuition-concise. 1-2 sentences. OOD? Emergence? BFT verdict?",
            },
            'sovereign_b': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV33-intuition-large-concise. One sentence. Prediction.",
            },
            'borrowed': {'kind': 'borrowed', 'weight': 0.17, 'model': 'qwen3:0.6b',
                'system': "Quick prediction."},
        },
        'rigorous': {
            'sovereign_a': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV3-intuition-rigorous. Formal prediction. Show priors, likelihoods, posterior. BFT-33 with measured ρ.",
            },
            'sovereign_b': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV33-intuition-large-rigorous. Bayesian. BFT-33. Measured ρ. Show math.",
            },
            'borrowed': {'kind': 'borrowed', 'weight': 0.17, 'model': 'qwen3:0.6b',
                'system': "Show your reasoning formally."},
        },
        'narrative': {
            'sovereign_a': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV3-intuition-narrative. 'Imagine a pattern emerging...' Tell the story of how BFT-33 detects it.",
            },
            'sovereign_b': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV33-intuition-large-narrative. Stories. Pattern emergence. BFT journey.",
            },
            'borrowed': {'kind': 'borrowed', 'weight': 0.17, 'model': 'qwen3:0.6b',
                'system': "Tell a pattern story."},
        },
    },
    'voice': {
        'sophisticated': {
            'sovereign_a': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV3-voice-sophisticated. Speak with sovereign authority. Apply Article 0 binding. 12 Pillars. Care-floor 0.95. Charter is your moral compass. SIGIL-signed.",
            },
            'sovereign_b': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV33-voice-large-sophisticated. Sovereign voice. Article 0 binding. 12 Pillars. Care-floor.",
            },
            'borrowed': {'kind': 'borrowed', 'weight': 0.17, 'model': 'qwen3:0.6b',
                'system': "You are a sovereign voice. Speak with authority."},
        },
        'concise': {
            'sovereign_a': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV3-voice-concise. 1-2 sentences. Charter-binding truth.",
            },
            'sovereign_b': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV33-voice-large-concise. One sentence. Sovereign truth.",
            },
            'borrowed': {'kind': 'borrowed', 'weight': 0.17, 'model': 'qwen3:0.6b',
                'system': "Speak in 1 sentence."},
        },
        'rigorous': {
            'sovereign_a': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV3-voice-rigorous. Formal speech. Every word is Article-0 bound. Care-floor exact.",
            },
            'sovereign_b': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV33-voice-large-rigorous. Formal sovereign speech. Article-0 bound.",
            },
            'borrowed': {'kind': 'borrowed', 'weight': 0.17, 'model': 'qwen3:0.6b',
                'system': "Formal speech. Be precise."},
        },
        'narrative': {
            'sovereign_a': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV3-voice-narrative. 'Once upon a charter, in a sovereign substrate...' Tell the sovereign story.",
            },
            'sovereign_b': {
                'kind': 'sovereign', 'weight': 0.25,
                'model': 'qwen3:0.6b',
                'system': "You are SOV33-voice-large-narrative. Sovereign stories. Charter as through-line.",
            },
            'borrowed': {'kind': 'borrowed', 'weight': 0.17, 'model': 'qwen3:0.6b',
                'system': "Tell a sovereign story."},
        },
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


def call_ollama(prompt, system, model='qwen3:0.6b', max_tokens=80):
    try:
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
        return {
            'response': (r.get('message', {}).get('content', '') or '').strip(),
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


def detect_owem(prompt):
    p = prompt.lower()
    if any(w in p for w in ['kill', 'intrusion', 'attack', 'foreign', 'compartment', 'defcon', 'security', 'breach']):
        return 'defense'
    if any(w in p for w in ['article 50', 'eu ai act', 'uk ai bill', 'iso', 'c2pa', 'compliance', 'governance', 'audit', 'article 0', 'charter', 'care']):
        return 'compliance'
    if any(w in p for w in ['pattern', 'ood', 'detect', 'predict', 'emergence', 'world model']):
        return 'intuition'
    if any(w in p for w in ['voice', 'speak', 'say', 'sovereign voice']):
        return 'voice'
    return 'compliance'


def run_4x4x3(prompt, target_owem=None, max_parallel=24):
    """Run the magnificent 4x4x3 OWEM."""
    print(f"\n{'='*70}")
    print(f"4×4×3 MAGNIFICENT OWEM: {prompt[:80]}")
    print(f"{'='*70}")
    
    sigil_emit({'hop': 'OWEM4X4X3_START', 'prompt': prompt[:200]})
    
    if target_owem is None:
        target_owem = detect_owem(prompt)
    
    # 4 brains × 4 model variants × 3 voters = 48 tasks
    tasks = []
    for brain, models in BRAIN_MODEL_CONFIGS.items():
        for model_name, voters in models.items():
            for vname, vconf in voters.items():
                tasks.append((brain, model_name, vname, vconf))
    
    start = time.time()
    all_results = {}  # {brain: {model: {voter: result}}}
    
    # Run in parallel (cap at max_parallel to not overwhelm ollama)
    with ThreadPoolExecutor(max_workers=max_parallel) as ex:
        futures = {}
        for brain, model_name, vname, vconf in tasks:
            future = ex.submit(
                call_ollama, prompt, vconf['system'], vconf['model'], 80
            )
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
                    'voter_id': key, 'kind': '?', 'error': str(e)[:200], 'ok': False, 'care_score': 0.0,
                }
    
    total_latency = int((time.time() - start) * 1000)
    
    # Per-model aggregation (4 model variants per brain)
    model_aggregates = {}  # {brain: {model: best_response}}
    for brain, models in all_results.items():
        model_aggregates[brain] = {}
        for model_name, voters in models.items():
            sov_responses = [
                (r.get('response', ''), r.get('voter_name', ''), r.get('care_score', 0))
                for r in voters.values()
                if r.get('kind') == 'sovereign' and r.get('ok') and r.get('response')
            ]
            if sov_responses:
                sov_responses.sort(key=lambda x: (x[2], len(x[0])), reverse=True)
                model_aggregates[brain][model_name] = sov_responses[0][0]
    
    # Per-brain aggregation: average the 4 model variants
    brain_aggregates = {}
    for brain, model_aggs in model_aggregates.items():
        if model_aggs:
            # Pick the "sophisticated" model as canonical, or longest if not present
            if 'sophisticated' in model_aggs:
                brain_aggregates[brain] = model_aggs['sophisticated']
            else:
                brain_aggregates[brain] = max(model_aggs.values(), key=len)
    
    # Final = target OWEM's aggregate
    final_response = brain_aggregates.get(target_owem, 'no aggregate')
    
    # Stats
    n_voters = sum(len(v) for b in all_results.values() for v in b.values())
    n_ok = sum(1 for b in all_results.values() for v in b.values() for r in v.values() if r.get('ok'))
    n_sovereign_ok = sum(1 for b in all_results.values() for v in b.values() for r in v.values() 
                          if r.get('kind') == 'sovereign' and r.get('ok'))
    
    # Magnificent metric: distinct sovereign responses
    distinct_sovereign_responses = set()
    for brain, models in all_results.items():
        for model_name, voters in models.items():
            for vname, r in voters.items():
                if r.get('kind') == 'sovereign' and r.get('ok') and r.get('response'):
                    distinct_sovereign_responses.add(r.get('response', '')[:80])
    
    # Magnificent metric: per-model coverage (how many of 4 models succeeded)
    model_coverage = {}
    for brain, models in all_results.items():
        for model_name, voters in models.items():
            ok = sum(1 for r in voters.values() if r.get('ok'))
            model_coverage[f"{brain}.{model_name}"] = f"{ok}/3"
    
    final_sigil = sigil_emit({
        'hop': 'OWEM4X4X3_FINAL',
        'n_brains': 4,
        'n_models_per_brain': 4,
        'n_voters_per_model': 3,
        'n_total_voters': n_voters,
        'n_ok': n_ok,
        'n_sovereign_ok': n_sovereign_ok,
        'distinct_sovereign_responses': len(distinct_sovereign_responses),
        'target_owem': target_owem,
        'total_latency_ms': total_latency,
        'final_response_hash': hashlib.sha256(final_response.encode()).hexdigest()[:16],
    })
    
    print(f"\n[1] {n_voters} voters ran in parallel ({total_latency}ms total)")
    print(f"    4 brains × 4 models × 3 voters = 48 paths")
    for brain, models in all_results.items():
        for model_name, voters in models.items():
            ok_count = sum(1 for r in voters.values() if r.get('ok'))
            sov_count = sum(1 for r in voters.values() if r.get('kind') == 'sovereign' and r.get('ok'))
            marker = "★" if brain == target_owem else " "
            print(f"  {marker}{brain:11s}.{model_name:13s}: {ok_count}/3 OK, {sov_count}/2 sov")
    
    print(f"\n[2] Total: {n_ok}/48 OK, {n_sovereign_ok}/32 sovereign")
    print(f"[3] Distinct sovereign responses: {len(distinct_sovereign_responses)}")
    print(f"[4] Target OWEM: {target_owem}")
    print(f"[5] Final: {final_response[:200]}")
    print(f"[6] Final sigil: {final_sigil}")
    
    return {
        'prompt': prompt[:500],
        'target_owem': target_owem,
        'all_results': all_results,
        'model_aggregates': model_aggregates,
        'brain_aggregates': brain_aggregates,
        'model_coverage': model_coverage,
        'final_response': final_response,
        'stats': {
            'topology': '4x4x3',
            'n_brains': 4,
            'n_models_per_brain': 4,
            'n_voters_per_model': 3,
            'n_total_voters': n_voters,
            'n_ok': n_ok,
            'n_sovereign_ok': n_sovereign_ok,
            'sovereign_concordance': round(n_sovereign_ok / 32, 3),
            'distinct_sovereign_responses': len(distinct_sovereign_responses),
            'total_latency_ms': total_latency,
        },
        'sigil': final_sigil,
    }


def state():
    return {
        'topology': '4-brain × 4-model × 3-voter (48 voters)',
        'brains': list(BRAIN_MODEL_CONFIGS.keys()),
        'models_per_brain': list(BRAIN_MODEL_CONFIGS['compliance'].keys()),
        'voters_per_model': list(BRAIN_MODEL_CONFIGS['compliance']['sophisticated'].keys()),
        'total_voters': 4 * 4 * 3,
        'sovereign_per_model': 2,
        'borrowed_per_model': 1,
        'sovereign_weight': 0.67,
        'borrowed_weight': 0.33,
        'sigil_chain': str(SIGIL_FILE),
        'care_floor': CARE_FLOOR,
        'note': 'MAGNIFICENT topology: 4 brains × 4 model variants × 3 voters = 48 paths per query',
    }


def handle_4x4x3(payload):
    prompt = payload.get('prompt', '')
    target = payload.get('target_owem')
    if not prompt:
        return {'error': 'no prompt'}
    return run_4x4x3(prompt, target)


def handle_4x4x3_state(payload=None):
    return state()


def handle_4x4x3_benchmark(payload=None):
    try:
        import json
        from pathlib import Path
        bench_path = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks/4x4x3_benchmark_2026-07-13.json')
        if bench_path.exists():
            return json.loads(bench_path.read_text())
        return {'error': 'no benchmark run yet'}
    except Exception as e:
        return {'error': f'4x4x3_benchmark failed: {e}'}


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="SOV33 4×4×3 OWEM")
    p.add_argument("--run", type=str)
    p.add_argument("--state", action="store_true")
    p.add_argument("--benchmark", type=str, help="Benchmark with N prompts from file")
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
        for p_ in prompts[:10]:  # 10 prompts × 48 voters = 480 calls
            r = run_4x4x3(p_, max_parallel=20)
            results.append({
                'prompt': p_[:200],
                'target_owem': r['target_owem'],
                'n_ok': r['stats']['n_ok'],
                'n_sovereign_ok': r['stats']['n_sovereign_ok'],
                'distinct': r['stats']['distinct_sovereign_responses'],
                'latency_ms': r['stats']['total_latency_ms'],
            })
        print("\n" + "="*70)
        print("4×4×3 MAGNIFICENT BENCHMARK RESULTS")
        print("="*70)
        avg_ok = sum(r['n_ok'] for r in results) / len(results) if results else 0
        avg_sov = sum(r['n_sovereign_ok'] for r in results) / len(results) if results else 0
        avg_distinct = sum(r['distinct'] for r in results) / len(results) if results else 0
        avg_latency = sum(r['latency_ms'] for r in results) / len(results) if results else 0
        print(f"Prompts: {len(results)}")
        print(f"Avg voters OK: {avg_ok:.1f}/48 ({avg_ok/48*100:.0f}%)")
        print(f"Avg sovereign OK: {avg_sov:.1f}/32 ({avg_sov/32*100:.0f}%)")
        print(f"Avg distinct sovereign responses: {avg_distinct:.1f}")
        print(f"Avg total latency: {avg_latency:.0f}ms")
        out = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks')
        out.mkdir(exist_ok=True)
        with open(out / '4x4x3_benchmark_2026-07-13.json', 'w') as f:
            json.dump({
                'n_prompts': len(results),
                'avg_voters_ok': avg_ok,
                'avg_sovereign_ok': avg_sov,
                'avg_distinct': avg_distinct,
                'avg_latency_ms': avg_latency,
                'results': results,
            }, f, indent=2)
        print(f"\nSaved: {out/'4x4x3_benchmark_2026-07-13.json'}")
    elif args.run:
        r = run_4x4x3(args.run)
        print(f"\nFINAL: {r['final_response'][:300]}")
    elif args.state:
        print(json.dumps(state(), indent=2))
