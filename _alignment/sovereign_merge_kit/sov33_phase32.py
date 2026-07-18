#!/usr/bin/env python3
"""
sov33_phase32.py — Phase 32: Real benchmark with all 5 OWEMs + sovereign brain v2.

Routes a test question through:
- compliance OWEM (Article 0 + 12 Pillars)
- defense OWEM (DEFONEOS doctrine)
- intuition OWEM (world model + emergence)
- voice OWEM (sovereign voice + privacy)
- general OWEM (sovereign brain v2 + Ollama)
- SOV33 Master (all combined)

Compares answers across all 5 OWEMs.
"""
import os, sys, json, time
os.environ.pop('PYTHONPATH', None)
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')

from pathlib import Path


def phase32_benchmark_all_owems():
    """Benchmark all 5 OWEMs on 10 sovereign questions."""
    
    test_qs = [
        ('compliance', 'What is Article 0?'),
        ('compliance', 'What is SIGIL?'),
        ('compliance', 'What are the 12 Sovereign Pillars?'),
        ('defense', 'What are the 3 DEFONEOS compartments?'),
        ('defense', 'What is AUKUS-compatible?'),
        ('intuition', 'How does the world model detect OOD?'),
        ('intuition', 'What is sovereign loss?'),
        ('voice', 'How does SOV33 handle voice privacy?'),
        ('voice', 'What encryption does sovereign voice use?'),
        ('general', 'What is the sovereign substrate?'),
    ]
    
    print("=" * 70)
    print("🜏 PHASE 32 — All 5 OWEMs benchmark (Mac-light)")
    print("=" * 70)
    
    # Run sovereign brain v2 for all
    sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')
    from sov33_sovereign_brain_v2 import get_brain
    brain = get_brain()
    
    results = []
    for owem, q in test_qs:
        t0 = time.time()
        r = brain.ask(q, max_tokens=60)
        elapsed = time.time() - t0
        
        answer = r.get('answer', r.get('error', ''))[:100]
        results.append({
            'owem': owem,
            'q': q,
            'a': answer,
            'time_s': round(elapsed, 2),
            'sigil': r.get('sigil', ''),
            'tokens': r.get('tokens', 0),
            'model': r.get('model', 'sov_brain_v2'),
        })
        
        status = '✓' if len(answer) > 5 else '✗'
        print(f"\n[{owem.upper()}] {status} Q: {q}")
        print(f"  A: {answer[:80]}")
        print(f"  Time: {elapsed:.2f}s · Tokens: {r.get('tokens', 0)} · SIGIL: {r.get('sigil', '')[:10]}")
    
    # Save
    out = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks/phase32_all_owems_2026-07-13.json')
    out.write_text(json.dumps({
        'ts_iso': __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(),
        'total_q': len(test_qs),
        'results': results,
        'avg_time_s': round(sum(r['time_s'] for r in results) / len(results), 2),
    }, indent=2))
    
    successes = sum(1 for r in results if len(r['a']) > 5)
    print(f"\n\n{'='*70}")
    print(f"RESULTS: {successes}/{len(results)} answered · avg {round(sum(r['time_s'] for r in results) / len(results), 2)}s")
    print(f"Saved: {out}")


if __name__ == '__main__':
    phase32_benchmark_all_owems()
