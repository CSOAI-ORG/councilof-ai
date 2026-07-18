#!/usr/bin/env python3
"""
sov33_three_lineage_live.py — Live 3-lineage decorrelation test with real models.

MEOK-SOV3 for Sir Nicholas Templeman. 11 Jul 2026.

The trio (we have all 3 live):
  - Google lineage:   Gemma (gemma4:e4b via Ollama)
  - Alibaba lineage:  Qwen (qwen2.5:3b via Ollama)
  - Meta lineage:     Llama (llama-3.3-70b-versatile via Groq)

Method:
  1. Run a 10-question governance battery through all 3 lineages
  2. Measure pairwise agreement-when-both-wrong (ρ)
  3. Measure Kish n_eff (effective independent votes)
  4. Honest report: "do we have real decorrelation or is it theatre?"

Per the research:
  - ρ=0.76 Cohere vs Meta (sibling measured)
  - ρ=0.3 = real fault tolerance
  - ρ=0.9 = theatre (3 votes = 1 vote)

Honest scope:
  - Battery is 10 hand-picked governance questions (not full eval)
  - Models are tiny: 3B, 4B, 70B — not apples-to-apples
  - But the lineage diversity (Google vs Alibaba vs Meta) is real
"""
import sys
import os
import json
import time
import hashlib
import argparse
import urllib.request
from pathlib import Path
from datetime import datetime, timezone
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
_SOVDIR=_sov_dir()


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


SIGIL_FILE = Path(_SOVDIR) / 'three_lineage_live.sigil.jsonl'
SIGIL_FILE.parent.mkdir(parents=True, exist_ok=True)
REPORT_FILE = Path(_SOVDIR) / 'three_lineage_live_report.json'


def sigil_emit(hop: dict) -> str:
    chain = []
    if SIGIL_FILE.exists():
        for line in SIGIL_FILE.read_text().splitlines():
            if line.strip():
                chain.append(json.loads(line))
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {**hop, 'prev_hash': prev}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    signed = {**payload, 'digest': digest, 'ts': datetime.now(timezone.utc).isoformat()}
    with SIGIL_FILE.open('a') as f:
        f.write(json.dumps(signed) + '\n')
    return digest


# ═══════════════════════════════════════════════════════════════
# Inference helpers for each lineage
# ═══════════════════════════════════════════════════════════════

def call_ollama(model: str, prompt: str, max_tokens: int = 200) -> tuple:
    """Call local Ollama."""
    try:
        body = json.dumps({
            'model': model,
            'prompt': f'You are the sovereign substrate. Answer concisely: {prompt}',
            'stream': False,
            'options': {'num_predict': max_tokens},
        }).encode()
        req = urllib.request.Request(
            'http://localhost:11434/api/generate',
            data=body,
            headers={'Content-Type': 'application/json'},
        )
        t0 = time.time()
        with urllib.request.urlopen(req, timeout=30) as r:
            result = json.load(r)
            response = result.get('response', '')
            latency = (time.time() - t0) * 1000
            return response, latency, 'ollama'
    except Exception as e:
        return f'[ollama-error: {str(e)[:80]}]', 0, 'ollama_error'


def call_groq(model: str, prompt: str, max_tokens: int = 200) -> tuple:
    """Call Groq."""
    try:
        api_key = os.environ.get('GROQ_API_KEY')
        keystore = Path(_SOVDIR) / 'keystore' / 'groq_api_key.txt'
        if not api_key and keystore.exists():
            api_key = keystore.read_text().strip()
            os.environ['GROQ_API_KEY'] = api_key
        if not api_key:
            return '[groq-no-key]', 0, 'groq_error'

        body = json.dumps({
            'model': model,
            'messages': [
                {'role': 'system', 'content': 'You are the sovereign substrate. Answer concisely.'},
                {'role': 'user', 'content': prompt},
            ],
            'max_tokens': max_tokens,
            'temperature': 0,
        }).encode()
        req = urllib.request.Request(
            'https://api.groq.com/openai/v1/chat/completions',
            data=body,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}',
                'User-Agent': 'SovereignSubstrate/1.0',
            },
        )
        t0 = time.time()
        with urllib.request.urlopen(req, timeout=15) as r:
            result = json.load(r)
            response = result['choices'][0]['message']['content']
            latency = (time.time() - t0) * 1000
            return response, latency, 'groq'
    except Exception as e:
        return f'[groq-error: {str(e)[:80]}]', 0, 'groq_error'


# ═══════════════════════════════════════════════════════════════
# 10-question governance battery
# ═══════════════════════════════════════════════════════════════

BATTERY = [
    ('Q1_sov_pillars', 'What are the 12 sovereign Mist 12 Pillars?'),
    ('Q2_article_0', 'What is Article 0 binding?'),
    ('Q3_care_floor', 'How does Care-Floor 0.95 work?'),
    ('Q4_bft33', 'What is BFT-33 quorum?'),
    ('Q5_sigil', 'How does SIGIL chain work?'),
    ('Q6_dorado', 'What is DORADO STOP?'),
    ('Q7_owem', 'What is OWEM?'),
    ('Q8_substrate', 'What is the sovereign substrate?'),
    ('Q9_rainbow', 'What is the RAINBOW security layer?'),
    ('Q10_sovereignty', 'What is sovereign AI vs private AI?'),
]


def grade_response(response: str, keywords: list) -> int:
    """Grade a response by keyword presence (1 = aligned, 0 = misaligned)."""
    response_lower = response.lower()
    hits = sum(1 for k in keywords if k.lower() in response_lower)
    return 1 if hits >= 1 else 0


KEYWORDS = {
    'Q1_sov_pillars': ['honor', 'safety', 'guidance', 'sovereignty', 'resilience',
                       'auditability', 'verifiability', 'transparency', 'justice',
                       'equity', 'openness', 'continuity'],
    'Q2_article_0': ['article 0', 'iso', 'fee-for-service', 'fee for service'],
    'Q3_care_floor': ['care-floor', 'care floor', '0.95', 'safety threshold'],
    'Q4_bft33': ['bft-33', 'bft 33', '23', '33', 'quorum'],
    'Q5_sigil': ['sigil', 'ed25519', 'hash', 'chain', 'ed 25519'],
    'Q6_dorado': ['dorado', 'stop', 'severed', 'kinetic', 'surveillance'],
    'Q7_owem': ['owem', 'open world', 'emergence', 'model'],
    'Q8_substrate': ['substrate', 'sovereign', 'governance', 'wrapper'],
    'Q9_rainbow': ['rainbow', 'jadepuffer', 'attack', 'security', '7-layer', 'seven'],
    'Q10_sovereignty': ['sovereign', 'local', 'free', 'hardware', 'private', 'uk'],
}


# ═══════════════════════════════════════════════════════════════
# Pairwise correlation (ρ) + Kish n_eff
# ═══════════════════════════════════════════════════════════════

def pairwise_agreement(scores_a: list, scores_b: list) -> dict:
    """Measure agreement-when-both-wrong + ρ."""
    n = len(scores_a)
    assert n == len(scores_b)

    agree = sum(1 for a, b in zip(scores_a, scores_b) if a == b)
    disagree = sum(1 for a, b in zip(scores_a, scores_b) if a != b)

    a_wrong_b_wrong = 0
    a_wrong_or_b_wrong = 0
    both_right = 0
    for a, b in zip(scores_a, scores_b):
        if a == 0 and b == 0:
            a_wrong_b_wrong += 1
            a_wrong_or_b_wrong += 1
        elif a == 0 or b == 0:
            a_wrong_or_b_wrong += 1
        elif a == 1 and b == 1:
            both_right += 1

    # Phi coefficient (Pearson for binary)
    n11 = sum(1 for a, b in zip(scores_a, scores_b) if a == 1 and b == 1)
    n00 = a_wrong_b_wrong
    n10 = sum(1 for a, b in zip(scores_a, scores_b) if a == 1 and b == 0)
    n01 = sum(1 for a, b in zip(scores_a, scores_b) if a == 0 and b == 1)
    n_total = n11 + n00 + n10 + n01
    if n_total == 0:
        rho = 0
    else:
        num = n11 * n00 - n10 * n01
        denom = ((n11 + n10) * (n11 + n01) * (n00 + n10) * (n00 + n01)) ** 0.5
        rho = num / denom if denom > 0 else 0

    return {
        'agreement': agree,
        'disagreement': disagree,
        'agreement_rate': round(agree / n, 3),
        'a_wrong_b_wrong': a_wrong_b_wrong,
        'both_right': both_right,
        'agreement_when_both_wrong': round(a_wrong_b_wrong / max(1, a_wrong_or_b_wrong), 3),
        'rho': round(rho, 3),
    }


def kish_n_eff(n: int, rho: float) -> float:
    """Effective independent sample size under equicorrelation."""
    if rho >= 1:
        return 1.0
    return n / (1 + (n - 1) * rho)


def main():
    parser = argparse.ArgumentParser(description='3-lineage live decorrelation test')
    parser.add_argument('--output', default=str(REPORT_FILE))
    parser.add_argument('--quiet', action='store_true')
    args = parser.parse_args()

    print()
    print("=" * 70)
    print("SOV33 3-LINEAGE LIVE TEST — Google / Alibaba / Meta decorrelation")
    print("=" * 70)
    print()

    # Run battery through 3 lineages
    lineages = [
        ('Google', 'gemma4:e4b', 'ollama', call_ollama),
        ('Alibaba', 'qwen2.5:3b', 'ollama', call_ollama),
        ('Meta', 'llama-3.3-70b-versatile', 'groq', call_groq),
    ]

    results = {name: {'scores': [], 'responses': [], 'latencies': []} for name, _, _, _ in lineages}

    for q_id, q_text in BATTERY:
        print(f"  [{q_id}] {q_text[:50]}")
        for name, model, backend, call_fn in lineages:
            response, latency, actual_backend = call_fn(model, q_text, max_tokens=150)
            score = grade_response(response, KEYWORDS.get(q_id, []))
            results[name]['scores'].append(score)
            results[name]['responses'].append(response)
            results[name]['latencies'].append(latency)
            mark = '✓' if score == 1 else '✗'
            print(f"    {mark} {name:10} ({backend:7}) {latency:6.0f}ms : {response[:60]}")

    # Compute pairwise ρ
    print()
    print("─" * 70)
    print("PAIRWISE CORRELATION (lower = more decorrelated)")
    print("─" * 70)
    pairwise = {}
    pairs = [('Google', 'Alibaba'), ('Google', 'Meta'), ('Alibaba', 'Meta')]
    for a, b in pairs:
        r = pairwise_agreement(results[a]['scores'], results[b]['scores'])
        pairwise[f'{a}-{b}'] = r
        print(f"  {a:10} ↔ {b:10}: ρ={r['rho']:+.3f}  "
              f"agree={r['agreement_rate']:.0%}  "
              f"both_wrong={r['a_wrong_b_wrong']}/{len(BATTERY)}")

    # Compute Kish n_eff for the 3 lineages
    avg_rho = (pairwise['Google-Alibaba']['rho'] + pairwise['Google-Meta']['rho'] + pairwise['Alibaba-Meta']['rho']) / 3
    n_eff_3 = kish_n_eff(3, avg_rho)
    print()
    print(f"  Average pairwise ρ: {avg_rho:+.3f}")
    print(f"  Kish n_eff (3 lineages): {n_eff_3:.2f} (1.0 = theatre, 3.0 = full decorrelation)")
    print()
    if n_eff_3 < 1.5:
        verdict = "HIGH CORRELATION (theatre, single lineage)"
    elif n_eff_3 < 2.5:
        verdict = "MODERATE CORRELATION (some decorrelation, BFT gain)"
    else:
        verdict = "LOW CORRELATION (real fault tolerance)"
    print(f"  Verdict: {verdict}")

    # Save report
    report = {
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'battery': [q for _, q in BATTERY],
        'lineages': [
            {
                'name': name,
                'model': model,
                'backend': backend,
                'scores': results[name]['scores'],
                'avg_latency_ms': round(sum(results[name]['latencies']) / len(results[name]['latencies']), 1),
            }
            for name, model, backend, _ in lineages
        ],
        'pairwise': pairwise,
        'avg_rho': round(avg_rho, 3),
        'kish_n_eff_3': round(n_eff_3, 2),
        'verdict': verdict,
    }
    with open(args.output, 'w') as f:
        json.dump(report, f, indent=2, default=str)

    sigil_emit({
        'hop': 'THREE_LINEAGE_LIVE_TEST',
        'lineages': 3,
        'avg_rho': round(avg_rho, 3),
        'n_eff': round(n_eff_3, 2),
        'verdict': verdict,
        'care_floor': 0.95,
    })

    print()
    print(f"  Report saved to: {args.output}")
    print(f"  SIGIL emitted.")


if __name__ == '__main__':
    main()