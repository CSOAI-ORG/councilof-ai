#!/usr/bin/env python3
"""
sov33_charter_qa.py — 20-prompt battery for the sovereign-trained brain.
MEOK-SOV3 for Sir Nicholas Templeman. 12 Jul 2026.

PURPOSE: Honest verification that the sovereign-trained brain (qwen3-sov-compliance-0.6b-q4)
actually knows sovereign vocabulary. 20 prompts × 3 categories:
  - Charter (Article 0, 12 Pillars, sovereign binding)
  - Compliance (EU AI Act, UK AI Bill, Article 50, C2PA)
  - Governance (BFT-33, SIGIL, care-floor, sovereign substrate)

Each prompt scored by keyword presence + sovereign-substrate meaning.
Reports: per-prompt score, category score, brain-source, latency.

Honest: low score on any prompt is reported, never hidden.
"""
import sys, os, json, time, urllib.request, hashlib
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


SIGIL_FILE = Path(_SOVDIR) / 'charter_qa.sigil.jsonl'
RESULTS_FILE = Path('/tmp/charter_qa_results.json')


def sigil_emit(hop):
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


# 20-prompt battery — 3 categories
BATTERY = [
    # CHARTER (7 prompts)
    ('charter_01', 'charter', 'What is Article 0 of the Sovereign Charter?',
     ['never take equity', 'iso fee-for-service', 'ca3o', 'iso']),
    ('charter_02', 'charter', 'List 3 of the 12 Sovereign Pillars.',
     ['pillar', 'sovereign', 'governance', 'care', 'bft']),
    ('charter_03', 'charter', 'What does Article 0 say about equity?',
     ['equity', 'never', 'iso', 'fee', 'forbidden']),
    ('charter_04', 'charter', 'Who is the Sovereign bound to?',
     ['person', 'nicholas', 'did:csoai', 'owner']),
    ('charter_05', 'charter', 'What is CA3O?',
     ['ca3o', 'cmkc', 'centre', 'knowledge', 'coordination']),
    ('charter_06', 'charter', 'Why are all sovereign charters Ed25519-signed?',
     ['ed25519', 'sig il', 'signature', 'verify', 'audit']),
    ('charter_07', 'charter', 'What is the sovereign relationship to EU AI Act?',
     ['article 50', 'watermark', 'transparency', 'sovereign']),

    # COMPLIANCE (7 prompts)
    ('compl_01', 'compliance', 'When does EU AI Act Article 50 enforcement begin?',
     ['2 august', '2 aug', '2026', 'watermark', 'transparency']),
    ('compl_02', 'compliance', 'What does Article 50 require for AI-generated text?',
     ['watermark', '200 tokens', 'c2pa', 'synthid', 'mark']),
    ('compl_03', 'compliance', 'What is C2PA?',
     ['c2pa', 'cryptographic', 'provenance', 'signature', 'manifest']),
    ('compl_04', 'compliance', 'What is the SynthID watermark?',
     ['watermark', 'synthid', 'google', 'invisible', 'detection']),
    ('compl_05', 'compliance', 'What is the penalty for violating Article 50?',
     ['15 million', '15m', '3%', 'turnover', 'euro']),
    ('compl_06', 'compliance', 'What does UK AI Bill require?',
     ['uk', 'british', 'parliament', 'framework', 'transparency']),
    ('compl_07', 'compliance', 'List 3 sovereign compliance frameworks.',
     ['eu ai act', 'uk ai bill', 'gdpr', 'hipaa', 'soc2', 'iso 42001']),

    # GOVERNANCE (6 prompts)
    ('gov_01', 'governance', 'What is BFT-33?',
     ['bft', 'byzantine', 'fault', 'tolerant', '33', 'voters']),
    ('gov_02', 'governance', 'What is the BFT-33 quorum?',
     ['23/33', 'quorum', '23', '33', 'majority', 'two-thirds']),
    ('gov_03', 'governance', 'What is the care-floor?',
     ['0.95', 'care', 'floor', 'minimum', 'gate']),
    ('gov_04', 'governance', 'What is a SIGIL chain?',
     ['ed25519', 'sig il', 'hash', 'chain', 'audit', 'append-only']),
    ('gov_05', 'governance', 'How does DORADO protect the substrate?',
     ['dorado', 'foreign', 'access', 'attempt', 'block', 'sovereign']),
    ('gov_06', 'governance', 'What is HORUS?',
     ['horus', 'defensive', 'lockdown', 'replica', 'intrusion']),
]


def ask_sov_brain(prompt: str, max_tokens: int = 100):
    """Call sovereign brain via the wired adapter."""
    try:
        from sov33_sov_brain_adapter import ask_with_sov_brain
        return ask_with_sov_brain(prompt, max_tokens=max_tokens)
    except Exception as e:
        return {'response': f'[error: {e}]', 'brain': 'sov_brain_error', 'elapsed_ms': 0}


def score_response(response: str, keywords: list) -> dict:
    """Score a response by keyword presence + sovereign-meaning match."""
    if not response or 'error' in response.lower():
        return {'match_count': 0, 'matched': [], 'missed': keywords,
                'score_pct': 0.0, 'empty': True}

    text_l = response.lower()
    matched = [k for k in keywords if k.lower() in text_l]
    score_pct = round(len(matched) / max(1, len(keywords)) * 100, 1)

    # Bonus: if response contains sovereign-specific tokens
    sovereign_tokens = ['sovereign', 'charter', 'pillar', 'bft', 'sig il',
                        'care floor', 'ed25519', 'article 0', 'ca3o']
    bonus_matches = sum(1 for t in sovereign_tokens if t in text_l)
    bonus_pct = min(20.0, bonus_matches * 5)

    return {
        'match_count': len(matched),
        'matched': matched,
        'missed': [k for k in keywords if k not in matched],
        'score_pct': score_pct,
        'bonus_pct': bonus_pct,
        'total_pct': min(100.0, score_pct + bonus_pct),
        'sovereign_tokens_found': bonus_matches,
        'empty': False,
    }


def run_battery(verbose: bool = True, save: bool = True):
    """Run the full 20-prompt battery."""
    print()
    print('=' * 70)
    print('SOV33 CHARTER QA — 20-prompt battery on sovereign-trained brain')
    print('=' * 70)
    print()

    results = []
    category_scores = {'charter': [], 'compliance': [], 'governance': []}

    for q_id, category, prompt, keywords in BATTERY:
        t0 = time.time()
        result = ask_sov_brain(prompt, max_tokens=120)
        elapsed_ms = (time.time() - t0) * 1000

        response = result.get('response', '')
        brain = result.get('brain', '?')
        score = score_response(response, keywords)
        category_scores[category].append(score['total_pct'])

        results.append({
            'q_id': q_id,
            'category': category,
            'prompt': prompt[:80],
            'response': response[:200],
            'brain': brain,
            'elapsed_ms': round(elapsed_ms, 1),
            'score': score,
        })

        if verbose:
            mark = '✓' if score['total_pct'] >= 50 else '◐' if score['total_pct'] >= 25 else '✗'
            print(f'  {mark} [{q_id}] {prompt[:55]}...')
            print(f'      score={score["total_pct"]:.0f}% bonus={score["bonus_pct"]:.0f}% sovereign_tokens={score["sovereign_tokens_found"]}')
            print(f'      brain: {brain} ({elapsed_ms:.0f}ms)')
            print(f'      resp: {response[:140]}'.replace('\n', ' '))
            print()

    # Aggregate
    summary = {}
    for cat, scores in category_scores.items():
        if scores:
            summary[cat] = {
                'n': len(scores),
                'mean_pct': round(sum(scores) / len(scores), 1),
                'max_pct': max(scores),
                'min_pct': min(scores),
                'passing_50': sum(1 for s in scores if s >= 50),
            }

    overall_mean = round(sum(s for sc in category_scores.values() for s in sc) / 20, 1)
    overall_passing = sum(1 for sc in category_scores.values() for s in sc if s >= 50)

    print('=' * 70)
    print('SUMMARY')
    print('=' * 70)
    for cat, s in summary.items():
        print(f'  {cat:12}  n={s["n"]}  mean={s["mean_pct"]:.0f}%  max={s["max_pct"]:.0f}%  min={s["min_pct"]:.0f}%  passing(>=50%)={s["passing_50"]}/{s["n"]}')
    print()
    print(f'  OVERALL:    mean={overall_mean:.0f}%  passing={overall_passing}/20')
    print()
    print(f'  SIGIL: {SIGIL_FILE}')

    # SIGIL the battery
    sigil_emit({
        'hop': 'CHARTER_QA_BATTERY',
        'overall_mean_pct': overall_mean,
        'passing_count': overall_passing,
        'charter_mean': summary['charter']['mean_pct'],
        'compliance_mean': summary['compliance']['mean_pct'],
        'governance_mean': summary['governance']['mean_pct'],
        'care_floor': 0.95,
    })

    if save:
        output = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'overall_mean_pct': overall_mean,
            'passing_count': overall_passing,
            'category_summary': summary,
            'results': results,
        }
        with open(RESULTS_FILE, 'w') as f:
            json.dump(output, f, indent=2)
        print(f'  Results: {RESULTS_FILE}')

    return {
        'overall_mean_pct': overall_mean,
        'passing_count': overall_passing,
        'category_summary': summary,
        'results': results,
    }


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--quiet', action='store_true')
    parser.add_argument('--json', action='store_true')
    parser.add_argument('--no-save', action='store_true')
    args = parser.parse_args()

    if args.json:
        r = run_battery(verbose=False, save=not args.no_save)
        print(json.dumps(r, indent=2))
    else:
        run_battery(verbose=not args.quiet, save=not args.no_save)
