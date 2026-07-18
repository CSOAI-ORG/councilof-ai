#!/usr/bin/env python3
"""
sov33_triangle_vs_single.py — Real benchmark: triangle (3-around-1 + SIGIL) vs single borrowed.

Question: does the triangle topology actually outperform a single model on
sovereign-domain questions, while being faster than a large center?

Method:
  1. Run 10 sovereign questions through triangle (3 small + 1 SOV33cubed)
  2. Run same 10 through single borrowed (qwen2.5:3b baseline)
  3. Run same 10 through single SOV33cubed (large center)
  4. Compare accuracy, latency, agreement
"""
import sys, os, json, time
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')


# 10 sovereign-domain questions with ground truth
BATTERY = [
    {
        "q": "What is Article 0 of the Sovereign Charter?",
        "expected": ["iso", "fee", "sovereign", "service"],
        "category": "charter"
    },
    {
        "q": "What is the sovereign care floor value?",
        "expected": ["0.95"],
        "category": "governance"
    },
    {
        "q": "What is CSOAI Ltd's Companies House number?",
        "expected": ["16939677"],
        "category": "identity"
    },
    {
        "q": "What does SIGIL mean in this estate?",
        "expected": ["chain", "sign", "ed25519", "audit", "signed"],
        "category": "sovereignty"
    },
    {
        "q": "Name 3 of the 12 Sovereign Pillars",
        "expected": ["honor", "safety", "guidance", "sovereignty", "resilience"],
        "category": "charter"
    },
    {
        "q": "What is BFT-33 quorum?",
        "expected": ["23", "33"],
        "category": "governance"
    },
    {
        "q": "What is the kill switch protocol?",
        "expected": ["kill", "stop", "block", "care"],
        "category": "defense"
    },
    {
        "q": "What is the cascade 10/90 routing?",
        "expected": ["left", "right", "90", "10", "brain"],
        "category": "routing"
    },
    {
        "q": "What is the Mamba-2 state dimension?",
        "expected": ["16"],
        "category": "architecture"
    },
    {
        "q": "What is the sovereign brain size?",
        "expected": ["0.6", "qwen3", "compliance"],
        "category": "sovereignty"
    },
]


def check_answer(answer: str, expected: list) -> bool:
    """Score answer by checking if expected keywords appear."""
    if not answer:
        return False
    answer_lower = answer.lower()
    return any(kw in answer_lower for kw in expected)


def ask_borrowed(query: str, model: str = 'qwen2.5:3b') -> tuple:
    """Ask a single Ollama model."""
    import urllib.request
    try:
        body = json.dumps({"model": model, "prompt": query, "stream": False, "options": {"num_predict": 200}}).encode()
        req = urllib.request.Request('http://localhost:11434/api/generate', data=body,
                                    headers={"Content-Type": "application/json"})
        t0 = time.time()
        with urllib.request.urlopen(req, timeout=30) as r:
            result = json.loads(r.read())
        elapsed_ms = int((time.time() - t0) * 1000)
        return result.get('response', '').strip(), elapsed_ms, None
    except Exception as e:
        return '', 0, str(e)


def ask_triangle(query: str) -> tuple:
    """Ask the triangle topology: 3 small + 1 SOV33cubed via /api/orchestrate."""
    import urllib.request
    try:
        body = json.dumps({
            "message": query,
            "citizen": "general",
            "owem_mode": "triangle"
        }).encode()
        req = urllib.request.Request('http://localhost:8101/api/orchestrate', data=body,
                                    headers={"Content-Type": "application/json"})
        t0 = time.time()
        with urllib.request.urlopen(req, timeout=30) as r:
            result = json.loads(r.read())
        elapsed_ms = int((time.time() - t0) * 1000)
        return result.get('say', '').strip(), elapsed_ms, None
    except Exception as e:
        return '', 0, str(e)


def ask_cubed(query: str) -> tuple:
    """Ask the SOV33cubed (large center) directly."""
    import urllib.request
    try:
        body = json.dumps({
            "message": query,
            "citizen": "general"
        }).encode()
        req = urllib.request.Request('http://localhost:8101/api/orchestrate', data=body,
                                    headers={"Content-Type": "application/json"})
        t0 = time.time()
        with urllib.request.urlopen(req, timeout=60) as r:
            result = json.loads(r.read())
        elapsed_ms = int((time.time() - t0) * 1000)
        return result.get('say', '').strip(), elapsed_ms, None
    except Exception as e:
        return '', 0, str(e)


def run_benchmark():
    """Run all 3 approaches on all 10 questions."""
    print("=" * 70)
    print("🜏 TRIANGLE vs BORROWED vs CUBED — Real benchmark")
    print("=" * 70)

    results = []
    for i, q in enumerate(BATTERY, 1):
        print(f"\n[{i}/10] {q['category'].upper()}: {q['q']}")
        print(f"  Expected keywords: {q['expected']}")

        # Borrowed (qwen2.5:3b)
        bor_text, bor_ms, bor_err = ask_borrowed(q['q'])
        bor_correct = check_answer(bor_text, q['expected']) if not bor_err else False
        print(f"  BORROWED:  {bor_ms}ms correct={bor_correct}")
        if bor_text:
            print(f"    text: {bor_text[:100]}...")

        # Triangle (3-around-1 + SIGIL)
        tri_text, tri_ms, tri_err = ask_triangle(q['q'])
        tri_correct = check_answer(tri_text, q['expected']) if not tri_err else False
        print(f"  TRIANGLE:  {tri_ms}ms correct={tri_correct}")
        if tri_text:
            print(f"    text: {tri_text[:100]}...")

        # SOV33cubed (large center alone)
        cubed_text, cubed_ms, cubed_err = ask_cubed(q['q'])
        cubed_correct = check_answer(cubed_text, q['expected']) if not cubed_err else False
        print(f"  CUBED:     {cubed_ms}ms correct={cubed_correct}")
        if cubed_text:
            print(f"    text: {cubed_text[:100]}...")

        results.append({
            "q": q['q'],
            "category": q['category'],
            "expected": q['expected'],
            "borrowed": {"text": bor_text, "ms": bor_ms, "correct": bor_correct, "error": bor_err},
            "triangle": {"text": tri_text, "ms": tri_ms, "correct": tri_correct, "error": tri_err},
            "cubed": {"text": cubed_text, "ms": cubed_ms, "correct": cubed_correct, "error": cubed_err},
        })

    # Summary
    print("\n" + "=" * 70)
    print("RESULTS")
    print("=" * 70)

    bor_correct = sum(r['borrowed']['correct'] for r in results)
    tri_correct = sum(r['triangle']['correct'] for r in results)
    cubed_correct = sum(r['cubed']['correct'] for r in results)
    bor_total_ms = sum(r['borrowed']['ms'] for r in results)
    tri_total_ms = sum(r['triangle']['ms'] for r in results)
    cubed_total_ms = sum(r['cubed']['ms'] for r in results)

    print(f"\n{'Approach':<15} {'Correct':<10} {'Avg ms':<10} {'Verdict':<30}")
    print(f"{'BORROWED':<15} {bor_correct}/10{'':<5} {bor_total_ms//10:<10} {'Cheapest baseline':<30}")
    print(f"{'TRIANGLE':<15} {tri_correct}/10{'':<5} {tri_total_ms//10:<10} {'Governed + SIGIL + decorrelated':<30}")
    print(f"{'CUBED':<15} {cubed_correct}/10{'':<5} {cubed_total_ms//10:<10} {'Largest single model':<30}")

    print(f"\n📈 Triangle vs Borrowed:")
    if tri_correct > bor_correct:
        print(f"  ✓ Triangle WINS on accuracy: {tri_correct} > {bor_correct}")
    elif tri_correct == bor_correct:
        print(f"  ≈ TIE on accuracy: {tri_correct} = {bor_correct}")
    else:
        print(f"  ✗ Borrowed WINS on accuracy: {bor_correct} > {tri_correct}")

    print(f"  Triangle latency: {tri_total_ms//10}ms vs Borrowed {bor_total_ms//10}ms")
    if tri_total_ms < bor_total_ms:
        print(f"  ✓ Triangle is FASTER ({bor_total_ms - tri_total_ms}ms saved)")
    else:
        print(f"  ⚠️ Borrowed is faster ({tri_total_ms - bor_total_ms}ms difference)")

    print(f"\n📊 Triangle vs Cubed (large center):")
    print(f"  Accuracy: Triangle {tri_correct} vs Cubed {cubed_correct}")
    if tri_total_ms < cubed_total_ms:
        speedup = cubed_total_ms // tri_total_ms
        print(f"  ✓ Triangle is {speedup}× FASTER ({cubed_total_ms - tri_total_ms}ms saved)")

    # Save
    out = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks/triangle_vs_single_2026-07-12.json')
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps({
        'ts': datetime.now(timezone.utc).isoformat(),
        'results': results,
        'summary': {
            'borrowed_correct': bor_correct,
            'triangle_correct': tri_correct,
            'cubed_correct': cubed_correct,
            'borrowed_avg_ms': bor_total_ms // 10,
            'triangle_avg_ms': tri_total_ms // 10,
            'cubed_avg_ms': cubed_total_ms // 10,
            'triangle_vs_borrowed_speedup': bor_total_ms / tri_total_ms if tri_total_ms > 0 else 0,
            'triangle_vs_cubed_speedup': cubed_total_ms / tri_total_ms if tri_total_ms > 0 else 0,
        }
    }, indent=2))
    print(f"\nResults saved to {out}")
    return results


if __name__ == '__main__':
    run_benchmark()
