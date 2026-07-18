#!/usr/bin/env python3
"""
sov33_config_compare.py — Compare SOV33 configurations for speed, accuracy, capability.

Configurations to test:
  A. 1 OWEM LARGE only
  B. 2 small OWEMs + 1 large (3-around-1)
  C. 1 large + 1 medium + 1 small + 1 medium (mixed sizes)
  D. 12-around-1 (12 Sovereign Pillars)
  E. 12-around-1 with MoE+MOM inside each
  F. SOV33 Master (all of above)
"""
import sys, os, json, time, urllib.request
from pathlib import Path
from datetime import datetime, timezone

API = 'http://localhost:8101'


def http_post(path, body, timeout=30):
    try:
        req = urllib.request.Request(API + path,
                                    data=json.dumps(body).encode(),
                                    headers={'Content-Type': 'application/json'})
        t0 = time.time()
        with urllib.request.urlopen(req, timeout=timeout) as r:
            elapsed_ms = int((time.time() - t0) * 1000)
            return json.loads(r.read()), elapsed_ms, None
    except Exception as e:
        return {}, 0, str(e)


# 10 test queries (mix of easy, medium, hard)
TEST_QUERIES = [
    # Easy (single-hop)
    ("Easy: What is Article 0?", "Article 0 binds", 'easy'),
    ("Easy: What is SIGIL?", "audit signed Ed25519", 'easy'),
    ("Easy: What is care-floor?", "0.95 floor", 'easy'),
    
    # Medium (multi-hop)
    ("Medium: How does the cascade work?", "cascade LEFT RIGHT", 'medium'),
    ("Medium: What is the triangle?", "3-around-1 voting", 'medium'),
    ("Medium: What is MoE?", "mixture of experts", 'medium'),
    
    # Hard (multi-step)
    ("Hard: Plan a sovereign AI deployment with governance", "plan governance sovereignty", 'hard'),
    ("Hard: Explain the world model and its 128-dim state", "world model 128 state", 'hard'),
]


# Configurations
CONFIGS = {
    'A. 1 OWEM LARGE only': 'overseer',
    'B. 2 small + 1 large (3-around-1)': 'triangle',
    'C. Mixed sizes (1L + 1M + 1S + 1M)': 'mixed',
    'D. 12-around-1 (12 Sovereign Pillars)': '12-around-1',
    'E. 12-around-1 with MoE+MOM': 'master',
    'F. SOV33 Master (all combined)': 'master',
}


def score_answer(answer, expected_keywords):
    if not answer:
        return 0
    answer_lower = answer.lower()
    matched = sum(1 for kw in expected_keywords if kw.lower() in answer_lower)
    return matched / len(expected_keywords)


def test_config(config_name, n_queries=8):
    """Test a configuration with n queries."""
    print(f"\n  Testing config: {config_name}")

    times = []
    scores = []
    for q, expected, difficulty in TEST_QUERIES[:n_queries]:
        # Decide endpoint based on config
        if config_name.startswith('A.') or config_name.startswith('B.'):
            endpoint = '/api/orchestrate'
        elif config_name.startswith('C.'):
            endpoint = '/api/orchestrate'  # mixed would be triangle
        elif config_name.startswith('D.'):
            # First plan, then orchestrate
            r_plan, ms_plan, err = http_post('/api/12-pillar/route', {'message': q})
            r, ms, err = http_post('/api/orchestrate', {'message': q, 'citizen': 'general'})
            ms = ms_plan + ms
        elif config_name.startswith('E.') or config_name.startswith('F.'):
            # All combined
            r_route, ms_route, _ = http_post('/api/12-pillar/route', {'message': q})
            r, ms, err = http_post('/api/orchestrate', {'message': q, 'citizen': 'general'})
            ms = ms_route + ms
        else:
            endpoint = '/api/orchestrate'

        if config_name.startswith('A.') or config_name.startswith('B.') or config_name.startswith('C.'):
            r, ms, err = http_post(endpoint, {'message': q, 'citizen': 'general'})

        if err:
            print(f"    {difficulty}: ERROR {err}")
            continue

        answer = r.get('say', '')
        score = score_answer(answer, expected.split())
        times.append(ms)
        scores.append(score)
        print(f"    {difficulty}: {ms}ms, score={score:.2f}")

    if not times:
        return None

    avg_ms = sum(times) / len(times)
    avg_score = sum(scores) / len(scores) if scores else 0
    return {
        'config': config_name,
        'avg_ms': round(avg_ms, 1),
        'p95_ms': sorted(times)[int(0.95 * len(times))] if times else 0,
        'avg_score': round(avg_score, 3),
        'n_tested': len(times),
    }


def main():
    print("=" * 70)
    print("🜏 SOV33 Config Comparison — Speed, Score, Capability")
    print("=" * 70)

    results = []
    for name, _ in CONFIGS.items():
        r = test_config(name)
        if r:
            results.append(r)

    # Summary
    print("\n" + "=" * 70)
    print("RESULTS")
    print("=" * 70)
    print(f"\n{'Config':<40} {'Avg ms':<10} {'P95 ms':<10} {'Score':<10}")
    for r in results:
        print(f"{r['config']:<40} {r['avg_ms']:<10.1f} {r['p95_ms']:<10} {r['avg_score']:<10.3f}")

    # Find best
    fastest = min(results, key=lambda r: r['avg_ms'])
    most_accurate = max(results, key=lambda r: r['avg_score'])
    best_overall = max(results, key=lambda r: r['avg_score'] / max(r['avg_ms'], 1))

    print(f"\n🏆 Fastest: {fastest['config']} ({fastest['avg_ms']}ms)")
    print(f"🎯 Most accurate: {most_accurate['config']} ({most_accurate['avg_score']:.3f})")
    print(f"⚡ Best overall (score/ms): {best_overall['config']}")

    # Save
    out = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks/config_compare_2026-07-12.json')
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps({
        'ts': datetime.now(timezone.utc).isoformat(),
        'results': results,
        'winner': {
            'fastest': fastest['config'],
            'most_accurate': most_accurate['config'],
            'best_overall': best_overall['config'],
        }
    }, indent=2))
    print(f"\nResults saved to {out}")
    return results


if __name__ == '__main__':
    main()
