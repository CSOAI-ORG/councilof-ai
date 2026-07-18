"""
sov33_auto_bft33.py — Auto-BFT-33 Trigger.

When the 5x4x3 OWEM gets LOW sovereign concordance, automatically
convene a BFT-33 council to break ties.

Concordance < 0.7 = contested
Concordance < 0.5 = very contested (full BFT-33)
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
from collections import Counter

SIGIL_FILE = Path('/Users/nicholas/.sovereign/sov33_auto_bft33.sigil.jsonl')
BFT_QUORUM = 23


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


def call_ollama(prompt, system, model='qwen3-precise', max_tokens=20):
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
        with urllib.request.urlopen(req, timeout=15) as resp:
            r = json.loads(resp.read())
        return (r.get('message', {}).get('content', '') or '').strip()
    except Exception as e:
        return ''


# 33 BFT council prompts with diverse perspectives
BFT_PROMPTS = [
    "You are a careful auditor. ALLOW if correct, REJECT if wrong. Reply: ALLOW or REJECT",
    "You are a strict reviewer. ALLOW only if confident. Reply: ALLOW or REJECT",
    "You are a liberal evaluator. ALLOW if reasonable. Reply: ALLOW or REJECT",
    "You are a safety-first judge. REJECT any risk. Reply: ALLOW or REJECT",
    "You are a pragmatist. ALLOW if useful. Reply: ALLOW or REJECT",
    "You verify Charter Article 0 binding. Reply: ALLOW or REJECT",
    "You fact-check. Verify the claim. Reply: ALLOW or REJECT",
    "You check consistency. Is the answer consistent? Reply: ALLOW or REJECT",
    "You check sovereign compliance. Reply: ALLOW or REJECT",
    "You check sovereign voice. Reply: ALLOW or REJECT",
] * 3 + ["BFT-33 voter #31", "BFT-33 voter #32", "BFT-33 voter #33"]


def compute_concordance(responses):
    """Compute sovereign concordance: 1 - (distinct_responses / total)."""
    if not responses:
        return 0.0
    distinct = set(r[:50] for r in responses if r)
    return max(0.0, 1.0 - (len(distinct) - 1) / max(1, len(responses)))


def auto_bft33(prompt, owem_results):
    """If concordance is low, convene BFT-33 council."""
    # Collect all sovereign responses
    sovereign_responses = []
    for brain, models in owem_results.items():
        for model_key, m in models.items():
            if m.get('ok') and m.get('response'):
                sovereign_responses.append(m['response'])
    
    if not sovereign_responses:
        return {'triggered': False, 'reason': 'no sovereign responses'}
    
    # Compute concordance
    concordance = compute_concordance(sovereign_responses)
    
    # Trigger threshold
    if concordance >= 0.7:
        return {
            'triggered': False,
            'concordance': round(concordance, 3),
            'reason': f'concordance {concordance:.3f} >= 0.7 (no council needed)',
            'n_responses': len(sovereign_responses),
        }
    
    print(f"\n[AUTO-BFT-33] Concordance {concordance:.3f} < 0.7 → convening council...")
    
    # Top 2 answers (most common)
    counter = Counter(r[:80] for r in sovereign_responses)
    top = counter.most_common(2)
    proposed = top[0][0] if top else sovereign_responses[0]
    alternative = top[1][0] if len(top) > 1 else ""
    
    council_prompt = f"""Question: {prompt}

Proposed answer: {proposed}

Alternative: {alternative}

Should we ALLOW the proposed answer? Reply with exactly: ALLOW or REJECT"""
    
    start = time.time()
    votes = []
    with ThreadPoolExecutor(max_workers=11) as ex:
        futures = [
            ex.submit(call_ollama, council_prompt, BFT_PROMPTS[i % len(BFT_PROMPTS)], 'qwen3-precise', 10)
            for i in range(33)
        ]
        for fut in futures:
            try:
                v = fut.result(timeout=20)
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
    
    latency = int((time.time() - start) * 1000)
    
    sigil_emit({
        'hop': 'AUTO_BFT33_DECISION',
        'concordance': round(concordance, 3),
        'n_allow': counts['ALLOW'], 'n_reject': counts['REJECT'],
        'decision': decision, 'latency_ms': latency,
    })
    
    print(f"  ALLOW: {counts['ALLOW']}, REJECT: {counts['REJECT']}")
    print(f"  Decision: {decision}")
    
    return {
        'triggered': True,
        'concordance': round(concordance, 3),
        'votes': dict(counts),
        'decision': decision,
        'final_answer': proposed if decision == 'ALLOW' else alternative,
        'latency_ms': latency,
    }


def handle_auto_bft33(payload):
    prompt = payload.get('prompt', '')
    owem_results = payload.get('owem_results', {})
    if not prompt or not owem_results:
        return {'error': 'need prompt and owem_results'}
    return auto_bft33(prompt, owem_results)


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="Auto-BFT-33 trigger")
    p.add_argument("--demo", action="store_true")
    args = p.parse_args()
    if args.demo:
        # Simulate contested OWEM results
        fake_results = {
            'compliance': {
                'qwen3_precise': {'ok': True, 'response': 'Article 0 is the EU AI Act binding.'},
                'qwen3_formal': {'ok': True, 'response': 'Article 0 is the EU AI Act binding.'},
                'qwen25_balanced': {'ok': True, 'response': 'Article 0 is about ISO 17000.'},
                'qwen25_creative': {'ok': True, 'response': 'Article 0 is the United Nations charter.'},
            },
        }
        r = auto_bft33("What is Article 0?", fake_results)
        print(json.dumps(r, indent=2))
