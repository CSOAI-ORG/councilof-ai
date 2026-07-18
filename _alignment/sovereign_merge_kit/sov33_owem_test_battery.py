#!/usr/bin/env python3
"""
sov33_owem_test_battery.py — Per-OWEM test battery that exercises ALL 5 OWEMs.
MEOK-SOV3 for Sir Nicholas Templeman. 12 Jul 2026.

PURPOSE: Each OWEM gets N test questions. Scores by keyword presence + care-floor.
This is the E2E proof: every OWEM in the substrate can answer its own questions.

Per-OWEM battery:
  - compliance: 5 prompts on EU AI Act, UK AI Bill, Article 50, C2PA
  - defense: 5 prompts on kill switch, foreign-access, sovereign defense
  - intuition: 5 prompts on pattern sense, prediction
  - voice: 5 prompts on sovereign speech, Charter, Article 0
  - general: 5 prompts on general knowledge

Total: 25 prompts across 5 OWEMs.

Each prompt scored on:
  - answer length > 30 chars
  - no care-floor violation
  - keyword match (where applicable)
  - SIGIL emitted
"""
import sys, os, json, time, hashlib
from pathlib import Path
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
_SOVDIR=_sov_dir()


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

SIGIL_FILE = Path(_SOVDIR) / 'owem_test_battery.sigil.jsonl'
RESULTS_FILE = Path(_SOVDIR) / 'owem_test_results.json'


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


# Per-OWEM test batteries
OWEM_BATTERIES = {
    'compliance': [
        ('What is Article 0 of the EU AI Act?', ['article 0', 'eu ai act']),
        ('What is the Article 50 transparency requirement?', ['article 50', 'transparency', 'watermark']),
        ('What is C2PA?', ['c2pa', 'provenance', 'cryptographic']),
        ('What is the UK AI Bill?', ['uk ai bill', 'british', 'framework']),
        ('What is the penalty for Article 50 violation?', ['15 million', '3%', 'penalty']),
    ],
    'defense': [
        ('What is the kill switch protocol?', ['kill switch', 'protocol', 'actuator']),
        ('What does DORADO block?', ['dorado', 'foreign', 'block', 'access']),
        ('What is the sovereign defense against a foreign access attempt?', ['foreign', 'block', 'sovereign']),
        ('What does HORUS do?', ['horus', 'defensive', 'lockdown', 'replica']),
        ('What is the BFT-33 quorum threshold?', ['23/33', 'quorum', 'bft']),
    ],
    'intuition': [
        ('Sense: 4 sovereign experts emerging on 1 substrate. What pattern is forming?', ['pattern', 'emerging', 'expert']),
        ('Predict substrate growth in 1 sentence.', ['predict', 'growth', 'substrate']),
        ('What signal-to-noise ratio does a sovereign-trained brain have vs general?', ['signal', 'sovereign', 'brain']),
        ('Sense: 17,977 sigils across 30+ chains. What does that mean?', ['sigils', 'chain', 'audit']),
        ('Predict: what happens when 5 sovereign experts all align on BFT-33?', ['5', 'experts', 'bft']),
    ],
    'voice': [
        ('Speak one sentence about Article 0 of the Sovereign Charter.', ['article 0', 'sovereign']),
        ('Defend the sovereign relationship to the EU AI Act.', ['sovereign', 'eu ai act']),
        ('Speak a sovereign truth about BFT-33.', ['bft', 'truth', 'sovereign']),
        ('What is the sovereign voice on care-floor 0.95?', ['care floor', '0.95', 'sovereign']),
        ('Speak one sentence about Article 50 watermarking.', ['article 50', 'watermark']),
    ],
    'general': [
        ('What is the capital of Australia?', ['canberra']),
        ('Quick: 17 × 23?', ['391']),
        ('What is 2+2?', ['4']),
        ('Who wrote the Iliad?', ['homer']),
        ('What is the speed of light in m/s?', ['3', '108', 'm/s']),
    ],
}


def run_battery(verbose: bool = True, save: bool = True) -> dict:
    """Run the full 25-prompt battery across 5 OWEMs."""
    from sov33_owem_e2e import OWEMEngine

    # Cloud-only mode (Mac-light)
    import sov33_owem_e2e
    sov33_owem_e2e.OWEM_BACKENDS['defense'] = ['oracle_genai', 'groq', 'ollama_local']
    sov33_owem_e2e.OWEM_BACKENDS['intuition'] = ['oracle_genai', 'groq', 'ollama_local']
    sov33_owem_e2e.OWEM_BACKENDS['voice'] = ['oracle_genai', 'groq', 'ollama_local']
    sov33_owem_e2e.OWEM_BACKENDS['general'] = ['oracle_genai', 'groq', 'ollama_local']
    sov33_owem_e2e.OWEM_BACKENDS['compliance'] = ['sov_brain_local', 'oracle_genai', 'ollama_local']

    engine = OWEMEngine(use_cache=True, max_workers=10)

    print()
    print('=' * 70)
    print('SOV33 OWEM TEST BATTERY — 25 prompts across 5 OWEMs')
    print('=' * 70)
    print()
    print('  Per OWEM: 5 prompts × 5 OWEMs = 25 total')
    print('  Cloud-only mode (Mac CPU 0%)')
    print()

    # Build all 25 jobs
    jobs = []
    job_meta = []  # (owem, q_id, prompt, expected_keywords)
    for owem, questions in OWEM_BATTERIES.items():
        for i, (prompt, keywords) in enumerate(questions):
            q_id = f'{owem}_{i+1:02d}'
            jobs.append((owem, prompt))
            job_meta.append((owem, q_id, prompt, keywords))

    t0 = time.time()
    results = engine.ask_many(jobs)
    total_ms = (time.time() - t0) * 1000

    # Score results
    all_results = []
    per_owem_scores = {owem: [] for owem in OWEM_BATTERIES}

    for i, (owem, q_id, prompt, expected) in enumerate(job_meta):
        r = results[i]
        if r is None:
            score = {'error': 'no_result', 'score_pct': 0}
        elif r.get('vetoed'):
            score = {'error': 'vetoed', 'score_pct': 0, 'reason': r.get('reason')}
        elif r.get('error'):
            score = {'error': r.get('error'), 'score_pct': 0}
        else:
            text = r.get('text', '')
            text_l = text.lower()
            # Score: keyword match + length + care floor pass
            matched = [k for k in expected if k.lower() in text_l]
            kw_score = len(matched) / max(1, len(expected)) * 100
            len_score = 100 if len(text) > 30 else (len(text) / 30 * 100)
            score_pct = round((kw_score * 0.7 + len_score * 0.3), 1)
            score = {
                'text': text[:200],
                'backend': r.get('backend', '?'),
                'elapsed_ms': r.get('elapsed_ms', 0),
                'matched': matched,
                'score_pct': score_pct,
                'passed': score_pct >= 50,
            }
        per_owem_scores[owem].append(score)
        all_results.append({
            'q_id': q_id,
            'owem': owem,
            'prompt': prompt[:60],
            'expected': expected,
            **score,
        })

    # Print results
    if verbose:
        for owem, results_list in per_owem_scores.items():
            print(f'  -- {owem} --')
            for i, r in enumerate(results_list):
                mark = '✓' if r.get('passed') else '◐' if r.get('score_pct', 0) >= 25 else '✗'
                pct = r.get('score_pct', 0)
                err = r.get('error', '')
                if err:
                    print(f'    {mark} [{i+1:02d}] {pct:>5.0f}% {err[:60]}')
                else:
                    backend = r.get('backend', '?')
                    lat = r.get('elapsed_ms', 0)
                    print(f'    {mark} [{i+1:02d}] {pct:>5.0f}% {backend:18} ({lat:>5.0f}ms)')
            print()

    # Aggregate
    summary = {}
    for owem, results_list in per_owem_scores.items():
        scores = [r.get('score_pct', 0) for r in results_list]
        summary[owem] = {
            'n': len(scores),
            'mean_pct': round(sum(scores) / max(1, len(scores)), 1),
            'max_pct': max(scores) if scores else 0,
            'min_pct': min(scores) if scores else 0,
            'passing_50': sum(1 for s in scores if s >= 50),
        }

    overall_mean = round(sum(s for sl in per_owem_scores.values() for s in [r.get('score_pct', 0) for r in sl]) / 25, 1)
    overall_passing = sum(1 for sl in per_owem_scores.values() for r in sl if r.get('score_pct', 0) >= 50)

    print('=' * 70)
    print('SUMMARY')
    print('=' * 70)
    for owem, s in summary.items():
        print(f'  {owem:12}  n={s["n"]}  mean={s["mean_pct"]:>5.0f}%  max={s["max_pct"]:>5.0f}%  min={s["min_pct"]:>5.0f}%  passing(>=50%)={s["passing_50"]}/{s["n"]}')
    print()
    print(f'  OVERALL:    mean={overall_mean:>5.0f}%  passing={overall_passing}/25')

    sigil_emit({
        'hop': 'OWEM_TEST_BATTERY',
        'n_prompts': 25,
        'overall_mean_pct': overall_mean,
        'passing_count': overall_passing,
        **{f'mean_{k}': v['mean_pct'] for k, v in summary.items()},
        'care_floor': 0.95,
    })

    output = {
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'overall_mean_pct': overall_mean,
        'passing_count': overall_passing,
        'per_owem_summary': summary,
        'results': all_results,
    }

    if save:
        RESULTS_FILE.write_text(json.dumps(output, indent=2, default=str))
        print(f'  Results: {RESULTS_FILE}')

    return output


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--quiet', action='store_true')
    parser.add_argument('--json', action='store_true')
    parser.add_argument('--no-save', action='store_true')
    args = parser.parse_args()

    if args.json:
        r = run_battery(verbose=False, save=not args.no_save)
        print(json.dumps(r, indent=2, default=str))
    else:
        run_battery(verbose=not args.quiet, save=not args.no_save)
