"""
sov33_5x4x3_bft.py — 5x4x3 with Auto-BFT-33 Integration.

When sovereign concordance < 0.7, automatically convene BFT-33 council.
The council votes ALLOW/REJECT on each top answer, 23/33 quorum.
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
CONCORDANCE_THRESHOLD = 0.7
SIGIL_FILE = Path('/Users/nicholas/.sovereign/sov33_5x4x3_bft.sigil.jsonl')
BFT_QUORUM = 23

# Import the 5x4x3_real as base
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/owem3')
from sov33_5x4x3_real import (
    BRAIN_SYSTEMS, MODELS, call_ollama, care_check, detect_owem, sigil_emit
)


# BFT-33 council prompts (33 diverse)
BFT_PROMPTS = [
    "You are a careful auditor. Verify the answer. Reply: ALLOW or REJECT",
    "You are a strict reviewer. Verify the answer. Reply: ALLOW or REJECT",
    "You are a liberal evaluator. Verify the answer. Reply: ALLOW or REJECT",
    "You are a safety-first judge. Verify the answer. Reply: ALLOW or REJECT",
    "You are a pragmatist. Verify the answer. Reply: ALLOW or REJECT",
    "You verify Charter Article 0 binding. Reply: ALLOW or REJECT",
    "You fact-check the answer. Reply: ALLOW or REJECT",
    "You check consistency. Reply: ALLOW or REJECT",
    "You check sovereign compliance. Reply: ALLOW or REJECT",
    "You check sovereign voice. Reply: ALLOW or REJECT",
] * 3 + ["BFT-33 voter #31", "BFT-33 voter #32", "BFT-33 voter #33"]


def compute_concordance(responses):
    """1 - (distinct_responses / total)."""
    if not responses:
        return 0.0
    distinct = set(r[:80] for r in responses if r)
    return max(0.0, 1.0 - (len(distinct) - 1) / max(1, len(responses)))


def convene_council(prompt, proposed_answer, alternative_answer, max_voters=33):
    """Convene BFT-33 council."""
    council_prompt = f"""Question: {prompt}

Proposed answer: {proposed_answer}

Alternative: {alternative_answer}

Should we ALLOW the proposed answer? Reply with exactly: ALLOW or REJECT"""
    
    votes = []
    with ThreadPoolExecutor(max_workers=11) as ex:
        futures = [
            ex.submit(call_ollama, council_prompt, BFT_PROMPTS[i % len(BFT_PROMPTS)], 'qwen3-precise', 10)
            for i in range(max_voters)
        ]
        for fut in futures:
            try:
                v = fut.result(timeout=15)
                v_l = v.lower()
                if 'allow' in v_l and 'reject' not in v_l:
                    votes.append('ALLOW')
                elif 'reject' in v_l and 'allow' not in v_l:
                    votes.append('REJECT')
                else:
                    votes.append('UNDECIDED')
            except Exception:
                votes.append('ERROR')
    
    counts = Counter(votes)
    decision = 'ALLOW' if counts['ALLOW'] >= BFT_QUORUM else ('REJECT' if counts['REJECT'] >= BFT_QUORUM else 'NO_QUORUM')
    return {
        'n_allow': counts['ALLOW'],
        'n_reject': counts['REJECT'],
        'n_undecided': counts['UNDECIDED'] + counts['ERROR'],
        'decision': decision,
        'quorum_required': BFT_QUORUM,
        'final': proposed_answer if decision == 'ALLOW' else (alternative_answer if decision == 'REJECT' else proposed_answer),
    }


def run_5x4x3_bft(prompt, target_owem=None, max_parallel=20):
    """Run 5x4x3 with auto-BFT-33."""
    print(f"\n{'='*70}")
    print(f"5×4×3 + BFT-33: {prompt[:80]}")
    print(f"{'='*70}")
    
    sigil_emit({'hop': 'OWEM5X4X3_BFT_START', 'prompt': prompt[:200]})
    
    if target_owem is None:
        target_owem = detect_owem(prompt)
    
    # 1. Run 5x4x3 (20 voters = 5 brains × 4 models)
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
                }
            except Exception as e:
                all_results[brain][model_key] = {
                    'brain': brain, 'model': model_key, 'ok': False, 'error': str(e)[:200],
                }
    
    total_latency = int((time.time() - start) * 1000)
    
    # 2. Collect sovereign responses
    sovereign_responses = []
    for brain, models in all_results.items():
        for model_key, m in models.items():
            if m.get('ok') and m.get('response'):
                sovereign_responses.append(m['response'])
    
    # 3. Compute concordance
    concordance = compute_concordance(sovereign_responses)
    print(f"\n[1] {len(sovereign_responses)} sovereign responses, concordance={concordance:.3f}")
    
    # 4. Per-brain aggregation
    brain_aggregates = {}
    for brain, models in all_results.items():
        ok_responses = [(m['response'], m['model']) for m in models.values() if m.get('ok') and m.get('response')]
        if ok_responses:
            ok_responses.sort(key=lambda x: len(x[0]), reverse=True)
            brain_aggregates[brain] = ok_responses[0][0]
    
    initial_answer = brain_aggregates.get(target_owem, 'no aggregate')
    
    # 5. Auto-BFT-33 if concordance low
    council_result = None
    if concordance < CONCORDANCE_THRESHOLD and len(sovereign_responses) > 0:
        print(f"[2] Concordance {concordance:.3f} < {CONCORDANCE_THRESHOLD} → convening BFT-33")
        # Top 2 most common
        counter = Counter(r[:80] for r in sovereign_responses)
        top = counter.most_common(2)
        proposed = top[0][0] if top else sovereign_responses[0]
        alternative = top[1][0] if len(top) > 1 else "I cannot determine the answer"
        
        council_result = convene_council(prompt, proposed, alternative)
        print(f"  ALLOW: {council_result['n_allow']}, REJECT: {council_result['n_reject']}")
        print(f"  Decision: {council_result['decision']}")
        final_response = council_result['final']
    else:
        print(f"[2] Concordance {concordance:.3f} >= {CONCORDANCE_THRESHOLD} → no council needed")
        final_response = initial_answer
    
    # 6. SIGIL
    final_sigil = sigil_emit({
        'hop': 'OWEM5X4X3_BFT_FINAL',
        'n_sovereign_responses': len(sovereign_responses),
        'concordance': round(concordance, 3),
        'council_triggered': council_result is not None,
        'council_decision': council_result['decision'] if council_result else 'NONE',
        'target_owem': target_owem,
        'total_latency_ms': total_latency,
    })
    
    print(f"\n[3] Target OWEM: {target_owem}")
    print(f"[4] Initial: {initial_answer[:100]}")
    if council_result:
        print(f"[5] Council: {council_result['decision']} → {final_response[:100]}")
    print(f"[6] Final: {final_response[:200]}")
    
    return {
        'prompt': prompt[:500],
        'target_owem': target_owem,
        'all_results': all_results,
        'brain_aggregates': brain_aggregates,
        'initial_answer': initial_answer,
        'concordance': round(concordance, 3),
        'council_result': council_result,
        'final_response': final_response,
        'stats': {
            'topology': '5x4x3 + BFT-33',
            'n_voters': sum(len(m) for m in all_results.values()),
            'n_sovereign': len(sovereign_responses),
            'concordance': round(concordance, 3),
            'council_triggered': council_result is not None,
            'total_latency_ms': total_latency,
        },
        'sigil': final_sigil,
    }


def state():
    return {
        'topology': '5x4x3 with Auto-BFT-33',
        'concordance_threshold': CONCORDANCE_THRESHOLD,
        'bft_quorum': BFT_QUORUM,
        'bft_council_size': 33,
        'sigil_chain': str(SIGIL_FILE),
        'care_floor': CARE_FLOOR,
        'phase': 21,
    }


def handle_5x4x3_bft(payload):
    prompt = payload.get('prompt', '')
    if not prompt:
        return {'error': 'no prompt'}
    return run_5x4x3_bft(prompt)


def handle_5x4x3_bft_state(payload=None):
    return state()


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="5x4x3 with Auto-BFT-33")
    p.add_argument("--run", type=str)
    p.add_argument("--state", action="store_true")
    args = p.parse_args()
    if args.run:
        r = run_5x4x3_bft(args.run)
        print(f"\nFINAL: {r['final_response'][:300]}")
    elif args.state:
        print(json.dumps(state(), indent=2))
