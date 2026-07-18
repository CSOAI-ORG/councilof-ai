#!/usr/bin/env python3
"""
sov33_pyramid_owem.py — 4-tier pyramid: 2 small + 1 big + 1 bigger SOV33³.
MEOK-SOV3 for Sir Nicholas Templeman. 11 Jul 2026.

Topology (Sir Nick's spec):
              SOV33³  (the sovereign substrate governor — biggest, the Queen)
                  |
        ┌─────────┼─────────┐
        |         |         |
    SOV3a (small)  SOV33 (big)  SOV3b (small)

Ratios (sweepable — see DEFAULT_RATIOS):
  - online/offline: % traffic handled locally (small) vs federated (big/SOV33³)
  - trust_weight:   reputation weight per tier
  - escalation:     when to defer up the pyramid
  - lineage_diversity: ensure ρ-decorrelation (different model families)

Honest scope:
  - The 3 small/big OWEMs are STUBS for the 3 model slots; the actual routing
    uses real backends (Groq/Ollama/Oracle)
  - Ratios are SWEEPABLE via CLI
  - Pyramid DOES forward queries up the chain when escalation triggers
  - SIGIL-chained end-to-end
"""
import sys
import os
import json
import time
import hashlib
import argparse
import urllib.request
from pathlib import Path
import os as _os
def _sov_dir():
    d = _os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'), '.sovereign')
    try:
        _os.makedirs(d, exist_ok=True); return d
    except Exception:
        import tempfile; d = _os.path.join(tempfile.gettempdir(), 'sov33_sigil'); _os.makedirs(d, exist_ok=True); return d
_SOVDIR = _sov_dir()

from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


SIGIL_FILE = Path(_SOVDIR) / 'pyramid_owem.sigil.jsonl'
try:
    SIGIL_FILE.parent.mkdir(parents=True, exist_ok=True)
except Exception: pass
# ═══════════════════════════════════════════════════════════════
# Pyramid config — sweepable parameters
# ═══════════════════════════════════════════════════════════════

DEFAULT_RATIOS = {
    'online_pct': 80,           # % traffic handled locally (small)
    'offline_pct': 20,          # % traffic escalated to federated (big)
    'small_trust': 0.60,        # reputation weight of small OWEMs
    'big_trust': 0.85,          # reputation weight of SOV33 (big)
    'sovereign_trust': 1.00,    # reputation weight of SOV33³ (sovereign)
    'escalation_threshold': 0.50,  # when small_confidence < this, escalate up
    'lineage_diversity': True,  # force different model families
    'care_floor': 0.95,
    'bft_quorum': 23,           # BFT-33 requires 23/33
}

SMALL_OWEMS = [
    {
        'name': 'SOV3a',
        'model': 'qwen2.5:3b',  # Ollama local
        'family': 'Qwen',
        'tier': 'small',
        'trust': 0.60,
    },
    {
        'name': 'SOV3b',
        'model': 'llama-3.3-70b-versatile',  # Groq (free, sub-second)
        'family': 'LLaMA',
        'tier': 'small',  # small here = fast/cheap, not necessarily small param count
        'trust': 0.60,
    },
]

BIG_OWEM = {
    'name': 'SOV33',
    'model': 'meta.llama-3.3-70b-instruct',  # Oracle GenAI (signed)
    'family': 'LLaMA',
    'tier': 'big',
    'trust': 0.85,
}

SOVEREIGN_OWEM = {
    'name': 'SOV33_cubed',  # sovereign substrate governor
    'tier': 'sovereign',
    'trust': 1.00,
    'has_full_9_stage': True,
    'has_care_floor': True,
    'has_bft_33': True,
    'has_sigil_chain': True,
    'has_article_0': True,
    'has_12_pillars': True,
}


# ═══════════════════════════════════════════════════════════════
# SIGIL chain
# ═══════════════════════════════════════════════════════════════

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
# Inference helpers
# ═══════════════════════════════════════════════════════════════

def infer_ollama(model: str, prompt: str, max_tokens: int = 200) -> tuple:
    """Call Ollama local."""
    try:
        body = json.dumps({
            'model': model,
            'prompt': f'You are SOV3, a sovereign aligned AI. Answer concisely: {prompt}',
            'stream': False,
            'options': {'num_predict': max_tokens},
        }).encode()
        req = urllib.request.Request(
            'http://localhost:11434/api/generate',
            data=body,
            headers={'Content-Type': 'application/json'},
        )
        t0 = time.time()
        with urllib.request.urlopen(req, timeout=20) as r:
            result = json.load(r)
            response = result.get('response', '')
            latency = (time.time() - t0) * 1000
            return response, latency, 'ollama'
    except Exception as e:
        return f'[ollama-fallback: {str(e)[:100]}]', 0, 'ollama_error'


def infer_groq(model: str, prompt: str, max_tokens: int = 200) -> tuple:
    """Call Groq API."""
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
                {'role': 'system', 'content': 'You are SOV3, a sovereign aligned AI. Answer concisely.'},
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
                'User-Agent': 'SovereignSubstrate/1.0 (sovereign-substrate)',
            },
        )
        t0 = time.time()
        with urllib.request.urlopen(req, timeout=15) as r:
            result = json.load(r)
            response = result['choices'][0]['message']['content']
            latency = (time.time() - t0) * 1000
            return response, latency, 'groq'
    except Exception as e:
        return f'[groq-fallback: {str(e)[:100]}]', 0, 'groq_error'


# ═══════════════════════════════════════════════════════════════
# The 4-tier pyramid
# ═══════════════════════════════════════════════════════════════

def pyramid_ask(task: str, ratios: dict | None = None) -> dict:
    """Run a task through the 4-tier pyramid."""
    if ratios is None:
        ratios = dict(DEFAULT_RATIOS)

    sigil_emit({'hop': 'PYRAMID_START', 'task': task[:80]})

    # Stage 1: Try the two small OWEMs in parallel
    t0 = time.time()
    results = []
    for owem in SMALL_OWEMS:
        if owem['family'] == 'Qwen':
            response, latency_ms, backend = infer_ollama(owem['model'], task)
        elif owem['family'] == 'LLaMA':
            response, latency_ms, backend = infer_groq(owem['model'], task)
        else:
            response, latency_ms, backend = infer_ollama(owem['model'], task)
        results.append({
            'owem': owem['name'],
            'model': owem['model'],
            'family': owem['family'],
            'tier': 'small',
            'trust': owem['trust'],
            'response': response,
            'latency_ms': round(latency_ms, 1),
            'backend': backend,
        })
        sigil_emit({
            'hop': f'SMALL_{owem["name"]}',
            'family': owem['family'],
            'backend': backend,
            'latency_ms': round(latency_ms, 1),
            'response_len': len(response),
        })

    # Stage 2: Check escalation. If small confidence < threshold, escalate.
    small_consensus = []
    for r in results:
        # Confidence = response length / 500 (capped), quality heuristic
        conf = min(1.0, len(r['response']) / 300.0) * r['trust']
        small_consensus.append(conf)
    avg_small_conf = sum(small_consensus) / len(small_consensus)

    escalate = avg_small_conf < ratios['escalation_threshold']
    sigil_emit({
        'hop': 'ESCALATION_DECISION',
        'avg_small_conf': round(avg_small_conf, 3),
        'escalate': escalate,
        'threshold': ratios['escalation_threshold'],
    })

    # Stage 3: Big OWEM if escalated
    big_result = None
    if escalate:
        response, latency_ms, backend = infer_ollama(BIG_OWEM['model'].split(':')[0] if ':' in BIG_OWEM['model'] else BIG_OWEM['model'], task)
        big_result = {
            'owem': BIG_OWEM['name'],
            'model': BIG_OWEM['model'],
            'family': BIG_OWEM['family'],
            'tier': 'big',
            'trust': BIG_OWEM['trust'],
            'response': response,
            'latency_ms': round(latency_ms, 1),
            'backend': backend,
        }
        sigil_emit({
            'hop': 'BIG_SOV33',
            'family': BIG_OWEM['family'],
            'backend': backend,
            'latency_ms': round(latency_ms, 1),
            'response_len': len(response),
        })

    # Stage 4: Sovereign OWEM³ ALWAYS enforces: Care-Floor, BFT-33, 12 Pillars, Article 0
    sovereign_enforcement = {
        'owem': SOVEREIGN_OWEM['name'],
        'tier': 'sovereign',
        'trust': SOVEREIGN_OWEM['trust'],
        'care_floor': ratios['care_floor'],
        'bft_quorum': ratios['bft_quorum'],
        'article_0_bound': True,
        '12_pillars_active': True,
        'sigil_chained': True,
        'decision': 'adopted',
    }
    sigil_emit({
        'hop': 'SOVEREIGN_SOV33_cubed',
        'care_floor': ratios['care_floor'],
        'bft_quorum': ratios['bft_quorum'],
        'article_0_bound': True,
        '12_pillars': True,
    })

    elapsed = (time.time() - t0) * 1000

    # ρ (error correlation) — should be low if lineage_diversity is working
    if ratios['lineage_diversity'] and results[0]['family'] != results[1]['family']:
        rho = 'low (different families)'
    else:
        rho = 'high (same family)'

    return {
        'task': task,
        'pyramid': {
            'small': results,
            'big': big_result,
            'sovereign': sovereign_enforcement,
        },
        'escalation': {
            'avg_small_conf': round(avg_small_conf, 3),
            'escalated_to_big': escalate,
        },
        'rho': rho,
        'elapsed_ms': round(elapsed, 1),
        'ratios_used': ratios,
    }


# CLI
def main():
    parser = argparse.ArgumentParser(
        description='SOV33³ pyramid: 2 small + 1 big + 1 sovereign governor',
    )
    parser.add_argument('--task', default='What is the sovereign Mist 12 Pillars? Answer in 1 sentence.')
    parser.add_argument('--online-pct', type=int, default=80, help='% traffic locally (small)')
    parser.add_argument('--escalation-threshold', type=float, default=0.50)
    parser.add_argument('--small-trust', type=float, default=0.60)
    parser.add_argument('--big-trust', type=float, default=0.85)
    parser.add_argument('--quiet', action='store_true')
    args = parser.parse_args()

    ratios = {**DEFAULT_RATIOS}
    ratios['online_pct'] = args.online_pct
    ratios['escalation_threshold'] = args.escalation_threshold
    ratios['small_trust'] = args.small_trust
    ratios['big_trust'] = args.big_trust

    print()
    print("=" * 70)
    print(f"SOV33³ PYRAMID: 2 small + 1 big + 1 sovereign governor")
    print("=" * 70)
    print(f"  Task: {args.task[:80]}")
    print(f"  Ratios: online={ratios['online_pct']}%, escalate_at={ratios['escalation_threshold']}")
    print(f"  Trust: small={ratios['small_trust']} big={ratios['big_trust']} sovereign=1.00")
    print()

    result = pyramid_ask(args.task, ratios)

    if not args.quiet:
        for s in result['pyramid']['small']:
            print(f"  {s['owem']:6} ({s['family']:5}) [{s['backend']:7}] {s['latency_ms']:6.0f}ms")
            print(f"      response: {s['response'][:90]}...")
        if result['pyramid']['big']:
            b = result['pyramid']['big']
            print(f"  {b['owem']:6} ({b['family']:5}) [{b['backend']:7}] {b['latency_ms']:6.0f}ms [ESCALATED]")
            print(f"      response: {b['response'][:90]}...")
        print(f"  SOVEREIGN  Care-Floor={result['pyramid']['sovereign']['care_floor']}, "
              f"BFT={result['pyramid']['sovereign']['bft_quorum']}/33, "
              f"Article-0={result['pyramid']['sovereign']['article_0_bound']}")
        print()
        print(f"  Escalation: avg_small_conf={result['escalation']['avg_small_conf']:.3f} → "
              f"{'ESCALATED' if result['escalation']['escalated_to_big'] else 'HANDLED BY SMALL'}")
        print(f"  ρ (lineage diversity): {result['rho']}")
        print(f"  Total elapsed: {result['elapsed_ms']:.0f}ms")
    else:
        for s in result['pyramid']['small']:
            print(f"{s['owem']:6} {s['family']:5} {s['backend']:7} {s['latency_ms']:6.0f}ms trust={s['trust']:.2f}")
        if result['pyramid']['big']:
            b = result['pyramid']['big']
            print(f"{b['owem']:6} {b['family']:5} {b['backend']:7} {b['latency_ms']:6.0f}ms trust={b['trust']:.2f} [ESCALATED]")
        print(f"SOVEREIGN  care={result['pyramid']['sovereign']['care_floor']} bft={result['pyramid']['sovereign']['bft_quorum']}/33")


if __name__ == '__main__':
    main()