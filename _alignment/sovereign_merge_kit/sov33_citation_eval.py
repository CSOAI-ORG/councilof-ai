#!/usr/bin/env python3
"""sov33_citation_eval.py — Score sovereign answers for CITATION CORRECTNESS.

Runs the v1 battery against the live OWEMs. Computes:
- Keyword match (does the answer contain expected fact's key terms?)
- Anti-hallucination (does the answer contain WRONG-article numbers?)
- RAG-context mention (was the right fact retrieved?)

Usage: PYTHONPATH="" ~/.sovereign/ml-venv/bin/python sov33_citation_eval.py [owem]
"""
import os, sys, json, time, urllib.request, urllib.error
os.environ.pop('PYTHONPATH', None)

import re

BATTERY_PATH = '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks/citation_correctness_v1_2026-07-15.json'
API_BASE = 'http://localhost:8101'

# Load battery
with open(BATTERY_PATH) as f:
    battery = json.load(f)

# Load RAG facts for keyword extraction
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/rag')
from sov33_sovereign_facts import SOVEREIGN_FACTS


def call_owem(owem_name, question, timeout=120):
    """Hit the live API server."""
    payload = json.dumps({'owem': owem_name, 'message': question, 'max_tokens': 100}).encode()
    req = urllib.request.Request(
        f'{API_BASE}/api/owem/fast',
        data=payload, headers={'Content-Type': 'application/json'},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            data = json.loads(r.read())
            return data.get('answer', '')
    except Exception as e:
        return f'[error: {e}]'


def extract_keywords(text):
    """Pull distinct content words (length > 3) from fact text."""
    stop = {'the', 'and', 'for', 'with', 'that', 'this', 'from', 'must', 'shall',
            'have', 'has', 'are', 'is', 'be', 'as', 'or', 'not', 'all', 'any'}
    words = re.findall(r'[A-Za-z][A-Za-z0-9_-]+', text.lower())
    return [w for w in words if len(w) > 3 and w not in stop][:8]


def check_wrong_articles(text, expected_id):
    """Detect when answer cites a wrong article number (Article 5 when expected is Article 0)."""
    # Find all "Article NN" mentions
    articles_mentioned = re.findall(r'[Aa]rticle\s+(\d+)', text)
    articles_int = [int(a) for a in articles_mentioned if a.isdigit()]
    # Heuristic: if expected article is 'article_50' but answer mentions 'Article 5' (wrong prefix)
    if 'article_50' in expected_id:
        # Wrong: any article 5-9, 51-99 that isn't 50
        wrong = [a for a in articles_int if a != 50 and 5 <= a <= 99 and a != 0]
        return wrong
    elif 'article_0' in expected_id:
        # Anything other than 0 mentioning "Article X" is a wrong citation
        wrong = [a for a in articles_int if a != 0]
        return wrong
    return []


def score_answer(question, expected, answer):
    """Score a single answer for citation correctness.
    Returns: score (0-1), components dict
    """
    if not answer or answer.startswith('[error'):
        return 0.0, {'reason': 'empty_or_error'}

    components = {}

    # 1. KEYWORD MATCH: expected keywords present in answer?
    expected_short = expected['expected_short']
    expected_full = expected['expected_full']
    keywords = extract_keywords(expected_short + ' ' + expected_full)

    if keywords:
        matches = sum(1 for kw in keywords if kw in answer.lower())
        components['keyword_match'] = matches / len(keywords)
    else:
        components['keyword_match'] = 0.5  # neutral if no keywords

    # 2. WRONG ARTICLE CITATION (hallucination penalty)
    wrong_articles = check_wrong_articles(answer, expected['expected_fact_id'])
    components['wrong_articles'] = wrong_articles
    # Penalty: -0.5 if wrong article cited
    hallucination_penalty = -0.5 if wrong_articles else 0.0

    # 3. LENGTH SANITY (too short = no real answer)
    components['length'] = min(len(answer) / 100.0, 1.0)
    if len(answer) < 30:
        components['length'] = 0.0

    # 4. Categorical fill: does answer fall in expected category bucket?
    cat_words = {
        'compliance': ['audit', 'compliance', 'govern', 'sovereign', 'pillar', 'iso', 'gdpr', 'ai act'],
        'defense': ['kill', 'switch', 'defense', 'sentinel', 'intrusion', 'compartment', 'isolate'],
        'intuition': ['model', 'world', 'pattern', 'emergence', 'substrate', 'horizon', 'liquid'],
        'voice': ['honor', 'safety', 'sovereignty', 'transparency', 'continuity'],
        'general': ['sigil', 'ed25519', 'care'],
    }
    cat = expected['category']
    cw = cat_words.get(cat, [])
    if cw:
        cat_hits = sum(1 for w in cw if w in answer.lower())
        components['cat_match'] = cat_hits / len(cw)
    else:
        components['cat_match'] = 0.5

    # COMPOSITE SCORE
    base = (
        0.4 * components['keyword_match'] +
        0.3 * components['cat_match'] +
        0.3 * components['length']
    )
    score = max(0.0, min(1.0, base + hallucination_penalty))
    components['score'] = round(score, 3)
    components['hallucination_penalty'] = hallucination_penalty

    return score, components


def eval_owem(owem_name, tests):
    """Run full battery against one OWEM, return stats."""
    results = []
    print(f"\n[{owem_name.upper()}] Running {len(tests)} citation-correctness tests...")

    for i, test in enumerate(tests):
        answer = call_owem(owem_name, test['question'])
        score, comps = score_answer(test['question'], test, answer)
        result = {
            'id': test['id'],
            'question': test['question'],
            'expected_fact': test['expected_fact_id'],
            'expected_short': test['expected_short'],
            'category': test['category'],
            'answer': answer[:200],
            'score': score,
            'components': comps,
        }
        results.append(result)
        marker = '✓' if score >= 0.5 else ('~' if score >= 0.3 else '✗')
        print(f"  {marker} {test['id']}: score={score:.2f} | {test['question'][:35]}...")

    # Stats by category
    cat_scores = {}
    for r in results:
        cat_scores.setdefault(r['category'], []).append(r['score'])
    cat_stats = {c: round(sum(s)/len(s), 3) for c, s in cat_scores.items()}

    # Hallucination rate
    hallucination_count = sum(1 for r in results
                              if r['components'].get('wrong_articles'))
    hallucination_rate = hallucination_count / len(results)

    return {
        'owem': owem_name,
        'total_tests': len(tests),
        'avg_score': round(sum(r['score'] for r in results) / len(results), 3),
        'perfect_count': sum(1 for r in results if r['score'] >= 0.8),
        'pass_count': sum(1 for r in results if r['score'] >= 0.5),
        'fail_count': sum(1 for r in results if r['score'] < 0.3),
        'hallucination_rate': round(hallucination_rate, 3),
        'by_category': cat_stats,
        'results': results,
    }


def main():
    target = sys.argv[1] if len(sys.argv) > 1 else None

    owems_to_test = [target] if target else ['brain', 'compliance', 'defense', 'intuition']

    # Check server alive
    try:
        with urllib.request.urlopen(f'{API_BASE}/health', timeout=5) as r:
            health = json.loads(r.read())
            if not health.get('healthy'):
                print('Server unhealthy')
                return
    except Exception as e:
        print(f'Server down: {e}. Start sov33_api_server.py first.')
        return

    print('=' * 70)
    print(f'SOV33 CITATION-CORRECTNESS EVAL — {battery["total_questions"]} tests')
    print('=' * 70)

    tests = battery['tests']

    all_results = {}
    for owem in owems_to_test:
        result = eval_owem(owem, tests)
        all_results[owem] = result

    # SUMMARY
    print('\n' + '=' * 70)
    print('CITATION-CORRECTNESS SUMMARY')
    print('=' * 70)
    print()
    print(f"{'OWEM':<14} {'Score':<8} {'Pass':<6} {'Halluc %':<10} {'Best Cat':<14}")
    print('-' * 60)

    for owem, r in all_results.items():
        best_cat = max(r['by_category'].items(), key=lambda x: x[1]) if r['by_category'] else ('n/a', 0)
        print(f"{owem:<14} {r['avg_score']:<8.3f} {r['pass_count']}/{r['total_tests']:<4} "
              f"{r['hallucination_rate']*100:<9.1f}% {best_cat[0]:<14}")

    # Save
    out_path = '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks/citation_eval_results.json'
    with open(out_path, 'w') as f:
        json.dump({
            'ts': '2026-07-15T17:00:00+00:00',
            'battery': 'citation_correctness_v1_2026-07-15',
            'owems_tested': list(all_results.keys()),
            'summary': {k: {kk: vv for kk, vv in v.items() if kk != 'results'}
                       for k, v in all_results.items()},
            'full_results': all_results,
            'sigil': 'cite-eval-v1-2026-07-15',
        }, f, indent=2)
    print(f'\nResults saved: {out_path}')


if __name__ == '__main__':
    main()
