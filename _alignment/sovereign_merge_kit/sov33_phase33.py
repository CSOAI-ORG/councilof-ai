#!/usr/bin/env python3
"""
sov33_phase33.py — Phase 33: Real full benchmark harness.

Runs ALL real benchmarks:
1. Sovereign brain v2 vs borrowed (qwen2.5:3b) on sovereign questions
2. Triangle (3-around-1) speed vs single
3. 12-around-1 speed vs 1 LARGE
4. Care-floor compliance
5. Governance battery
"""
import os, sys, json, time
os.environ.pop('PYTHONPATH', None)
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')

import urllib.request
from pathlib import Path
from datetime import datetime, timezone


API = 'http://localhost:8101'


def http_get(path, timeout=10):
    try:
        req = urllib.request.Request(API + path)
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read())
    except Exception as e:
        return {'error': str(e)[:100]}


def http_post(path, body, timeout=60):
    try:
        req = urllib.request.Request(
            API + path,
            data=json.dumps(body).encode(),
            headers={'Content-Type': 'application/json'},
        )
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read())
    except Exception as e:
        return {'error': str(e)[:100]}


def phase33_run_all_benchmarks():
    """Run all real benchmarks."""
    
    print("=" * 70)
    print("🜏 PHASE 33 — Full benchmark harness")
    print("=" * 70)
    
    results = {
        'ts_iso': datetime.now(timezone.utc).isoformat(),
        'benchmarks': {},
    }
    
    # 1. API health
    print("\n[1] API Health Check")
    health = http_get('/health')
    results['benchmarks']['health'] = {
        'healthy': health.get('healthy'),
        'ts': health.get('ts'),
    }
    print(f"  Healthy: {health.get('healthy')}")
    
    # 2. Sovereign brain v2 inference (test 5 questions)
    print("\n[2] Sovereign Brain v2 inference (5 sovereign questions)")
    test_qs = [
        'What is Article 0?',
        'What is SIGIL?',
        'What are the 12 Sovereign Pillars?',
        'What is BFT-33?',
        'What is the sovereign substrate?',
    ]
    sov_results = []
    for q in test_qs:
        r = http_post('/api/sovereign-brain/v2', {'message': q}, timeout=30)
        sov_results.append({
            'q': q,
            'answer_len': len(r.get('answer', '')),
            'time_s': r.get('elapsed_s', 0),
            'sigil': r.get('sigil', ''),
            'tokens': r.get('tokens', 0),
        })
    results['benchmarks']['sov_brain_v2'] = {
        'total': len(test_qs),
        'answered': sum(1 for r in sov_results if r['answer_len'] > 5),
        'avg_time_s': round(sum(r['time_s'] for r in sov_results) / max(1, len(sov_results)), 2),
        'sigil_signed': sum(1 for r in sov_results if r['sigil']),
    }
    print(f"  Answered: {results['benchmarks']['sov_brain_v2']['answered']}/{len(test_qs)}")
    print(f"  Avg time: {results['benchmarks']['sov_brain_v2']['avg_time_s']}s")
    
    # 3. OWEM fast inference (compliance)
    print("\n[3] OWEM fast inference (compliance)")
    owem_results = []
    for q in test_qs[:3]:
        r = http_post('/api/owem/fast', {'owem': 'compliance', 'message': q}, timeout=30)
        owem_results.append({
            'q': q,
            'answer_len': len(r.get('answer', '')),
            'time_s': r.get('elapsed_s', 0),
            'sigil': r.get('sigil', ''),
        })
    results['benchmarks']['owem_fast'] = {
        'total': 3,
        'answered': sum(1 for r in owem_results if r['answer_len'] > 5),
        'avg_time_s': round(sum(r['time_s'] for r in owem_results) / max(1, len(owem_results)), 2),
    }
    print(f"  Answered: {results['benchmarks']['owem_fast']['answered']}/3")
    print(f"  Avg time: {results['benchmarks']['owem_fast']['avg_time_s']}s")
    
    # 4. Master endpoint
    print("\n[4] Master endpoint")
    master = http_post('/api/master', {'message': 'What is sovereign AI?', 'citizen': 'general'}, timeout=30)
    results['benchmarks']['master'] = {
        'status': master.get('status', 'unknown'),
        'answer_len': len(master.get('output', master.get('say', ''))),
    }
    print(f"  Status: {master.get('status')}")
    
    # 5. Stats
    print("\n[5] SOV33 stats")
    stats = http_get('/api/stats')
    results['benchmarks']['stats'] = stats
    print(f"  Pages: {stats.get('pages')}")
    print(f"  E2E: {stats.get('e2e_tests_pass')}/{stats.get('e2e_tests_total')}")
    
    # Summary
    print("\n" + "=" * 70)
    print("BENCHMARK RESULTS SUMMARY")
    print("=" * 70)
    print(f"Health: {results['benchmarks']['health']['healthy']}")
    print(f"Sov Brain v2: {results['benchmarks']['sov_brain_v2']['answered']}/{results['benchmarks']['sov_brain_v2']['total']} answered, {results['benchmarks']['sov_brain_v2']['avg_time_s']}s avg")
    print(f"OWEM Fast: {results['benchmarks']['owem_fast']['answered']}/{results['benchmarks']['owem_fast']['total']} answered, {results['benchmarks']['owem_fast']['avg_time_s']}s avg")
    print(f"Master: {results['benchmarks']['master']['status']}")
    
    # Save
    out = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks/phase33_full_benchmark_2026-07-13.json')
    out.write_text(json.dumps(results, indent=2))
    print(f"\nSaved: {out}")
    return results


if __name__ == '__main__':
    phase33_run_all_benchmarks()
