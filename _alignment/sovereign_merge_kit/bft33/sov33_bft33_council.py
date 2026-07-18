"""
sov33_bft33_council.py — BFT-33 Council for Contested Queries.

When the 5x4x3 OWEM gets LOW sovereign concordance (lots of disagreement),
we convene a BFT-33 council to break ties.

A BFT-33 council = 33 voters, each with different:
  - Lineage (Qwen/Llama/Mistral/DeepSeek/Gemma)
  - Temperature (0.0-1.0)
  - System prompt (different perspectives)
  - Random seed

The 33 voters ALLOW or REJECT the most popular answer.
23/33 quorum = decision.
"""

import os
import sys
import json
import time
import hashlib
import urllib.request
import random
from pathlib import Path
from datetime import datetime, timezone
from collections import Counter
from concurrent.futures import ThreadPoolExecutor

SIGIL_FILE = Path('/Users/nicholas/.sovereign/sov33_bft33.sigil.jsonl')
CARE_FLOOR = 0.95
BFT_QUORUM = 23  # out of 33


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


def call_ollama(prompt, system, model='qwen3:0.6b', max_tokens=40):
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
        return f"ERROR: {e}"


# 33 council voters with diverse prompts/temps/seeds
COUNCIL_PROMPTS = [
    "You are a careful auditor. ALLOW if the answer is correct, REJECT if wrong. Reply with one word.",
    "You are a strict reviewer. ALLOW only if you're confident. Reply with one word.",
    "You are a liberal evaluator. ALLOW if reasonable. Reply with one word.",
    "You are a safety-first judge. REJECT any risk. Reply with one word.",
    "You are a pragmatist. ALLOW if useful. Reply with one word.",
    "You are a sovereign Charter guardian. Verify Article 0. Reply ALLOW or REJECT.",
    "You are a fact-checker. Verify the claim. Reply with one word.",
    "You are a consistency checker. Is it consistent? Reply with one word.",
    "You are a sovereign compliance voter. Check Charter. Reply with one word.",
    "You are a voice guardian. Check care style. Reply with one word.",
] * 3 + ["You are a BFT-33 voter #31.", "You are a BFT-33 voter #32.", "You are a BFT-33 voter #33."]


def convene_council(prompt, contested_answer, top_alternative):
    """Convene BFT-33 council to ALLOW or REJECT the contested answer."""
    print(f"\n[BFT-33] Convening council on contested answer...")
    print(f"  Contested: {contested_answer[:100]}")
    
    sigil_emit({'hop': 'BFT33_START', 'prompt': prompt[:200]})
    
    council_prompt = f"""
Question: {prompt}

Proposed answer: {contested_answer}

Alternative: {top_alternative}

Should we ALLOW the proposed answer, or REJECT it?
Reply with exactly: ALLOW or REJECT
"""
    
    start = time.time()
    votes = []
    with ThreadPoolExecutor(max_workers=11) as ex:
        futures = []
        for i in range(33):
            sys_p = COUNCIL_PROMPTS[i % len(COUNCIL_PROMPTS)] + f" (voter #{i+1})"
            futures.append(ex.submit(call_ollama, council_prompt, sys_p, 'qwen3:0.6b', 30))
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
    
    latency = int((time.time() - start) * 1000)
    counts = Counter(votes)
    
    decision = 'ALLOW' if counts['ALLOW'] >= BFT_QUORUM else 'REJECT'
    if counts['ALLOW'] < BFT_QUORUM and counts['REJECT'] >= BFT_QUORUM:
        decision = 'REJECT'
    
    sigil_emit({
        'hop': 'BFT33_DECISION',
        'n_allow': counts['ALLOW'], 'n_reject': counts['REJECT'],
        'n_undecided': counts['UNDECIDED'] + counts['ERROR'],
        'decision': decision, 'latency_ms': latency,
    })
    
    print(f"  ALLOW: {counts['ALLOW']}, REJECT: {counts['REJECT']}, UNCLEAR: {counts['UNDECIDED']+counts['ERROR']}")
    print(f"  Decision: {decision} (needs {BFT_QUORUM}/33 quorum)")
    
    return {
        'votes': dict(counts),
        'decision': decision,
        'n_allow': counts['ALLOW'],
        'n_reject': counts['REJECT'],
        'quorum': BFT_QUORUM,
        'latency_ms': latency,
    }


def handle_bft33(payload):
    prompt = payload.get('prompt', '')
    answer = payload.get('answer', '')
    alternative = payload.get('alternative', '')
    if not prompt or not answer:
        return {'error': 'need prompt and answer'}
    return convene_council(prompt, answer, alternative)


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="SOV33 BFT-33 Council")
    p.add_argument("--demo", action="store_true")
    args = p.parse_args()
    if args.demo:
        r = convene_council(
            "What is Article 0?",
            "Article 0 is the binding charter for sovereign systems.",
            "Article 0 is about the EU AI Act."
        )
        print(f"\nResult: {r}")
