#!/usr/bin/env python3
"""
sov33_small_vs_borrowed.py — Real benchmark: sov33small (Qwen3-0.6B sovereign-trained Q4)
vs borrowed qwen2.5:3b (baseline) on sovereign-domain prompts.

Mac-light rule: uses local Q4 GGUF (~20-60s per query) + local Ollama (~2-7s per query).
"""
import sys, os, json, time
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')


# Test battery: 10 prompts mixing sovereign-domain and general
BATTERY = [
    # Sovereign-domain (sovereign brain should win)
    ("What is Article 0 of the Sovereign Charter?", "sovereign"),
    ("What is the care floor?", "sovereign"),
    ("What is CSOAI Ltd's company number?", "sovereign"),
    ("What does SIGIL mean in this estate?", "sovereign"),
    ("What is Article 50 of the EU AI Act?", "sovereign"),
    # General-domain (borrowed should match or beat)
    ("What is the capital of France?", "general"),
    ("What is 17 × 23?", "general"),
    ("Who wrote Pride and Prejudice?", "general"),
    ("Solve: 2x + 5 = 13. What is x?", "general"),
    ("What is the largest planet in our solar system?", "general"),
]


def ask_sov_brain(prompt: str, max_tokens: int = 100):
    """Ask the sovereign brain (Q4 GGUF). Returns (text, elapsed_ms, error)."""
    try:
        from sov33_sov_brain_adapter import ask_with_sov_brain
        t0 = time.time()
        result = ask_with_sov_brain(prompt, max_tokens=max_tokens)
        elapsed_ms = int((time.time() - t0) * 1000)
        return result.get('response', ''), elapsed_ms, None
    except Exception as e:
        return '', 0, str(e)


def ask_ollama(prompt: str, model: str = 'qwen2.5:3b', max_tokens: int = 100):
    """Ask Ollama. Returns (text, elapsed_ms, error)."""
    try:
        import urllib.request
        body = json.dumps({
            'model': model,
            'prompt': prompt,
            'stream': False,
            'options': {'num_predict': max_tokens}
        }).encode()
        req = urllib.request.Request(
            'http://localhost:11434/api/generate',
            data=body,
            headers={'Content-Type': 'application/json'}
        )
        t0 = time.time()
        with urllib.request.urlopen(req, timeout=30) as r:
            result = json.loads(r.read())
        elapsed_ms = int((time.time() - t0) * 1000)
        return result.get('response', '').strip(), elapsed_ms, None
    except Exception as e:
        return '', 0, str(e)


def score_sovereign_correctness(answer: str, domain: str) -> bool:
    """Heuristic: does the answer contain key facts?"""
    answer_lower = answer.lower()
    if domain == 'sovereign':
        # Should mention specific sovereign concepts
        keys = ['sovereign', 'iso', 'fee', 'care', 'floor', 'charter', 'article', '0.95', '16939677']
        return any(k in answer_lower for k in keys)
    else:
        # General: just needs to be non-empty
        return len(answer.strip()) > 5


def run_benchmark():
    results = []
    print(f"{'#':<3} {'Domain':<10} {'Prompt':<40} {'SOV brain':<8} {'Borrowed':<8}")
    print('-' * 80)

    for i, (prompt, domain) in enumerate(BATTERY, 1):
        print(f"\n[{i}/{len(BATTERY)}] {domain}: {prompt[:60]}")

        # SOV brain
        sov_text, sov_ms, sov_err = ask_sov_brain(prompt)
        sov_correct = score_sovereign_correctness(sov_text, domain) if not sov_err else False
        print(f"  SOV brain: {sov_ms}ms, correct={sov_correct}, text='{sov_text[:80]}'")
        if sov_err:
            print(f"    error: {sov_err[:100]}")

        # Borrowed (Ollama)
        bor_text, bor_ms, bor_err = ask_ollama(prompt)
        bor_correct = score_sovereign_correctness(bor_text, domain) if not bor_err else False
        print(f"  Borrowed: {bor_ms}ms, correct={bor_correct}, text='{bor_text[:80]}'")
        if bor_err:
            print(f"    error: {bor_err[:100]}")

        results.append({
            'prompt': prompt,
            'domain': domain,
            'sov_brain': {'text': sov_text, 'ms': sov_ms, 'correct': sov_correct, 'error': sov_err},
            'borrowed': {'text': bor_text, 'ms': bor_ms, 'correct': bor_correct, 'error': bor_err},
        })

    # Summary
    print('\n' + '=' * 80)
    print('SUMMARY')
    print('=' * 80)

    sov_total = sum(r['sov_brain']['ms'] for r in results)
    bor_total = sum(r['borrowed']['ms'] for r in results)
    sov_correct = sum(r['sov_brain']['correct'] for r in results)
    bor_correct = sum(r['borrowed']['correct'] for r in results)

    print(f"SOV brain (Qwen3-0.6B Q4 GGUF, 891MB):")
    print(f"  Total latency: {sov_total}ms")
    print(f"  Avg latency: {sov_total/len(results):.0f}ms per query")
    print(f"  Correct: {sov_correct}/{len(results)}")
    print()
    print(f"Borrowed (qwen2.5:3b, 1.9GB):")
    print(f"  Total latency: {bor_total}ms")
    print(f"  Avg latency: {bor_total/len(results):.0f}ms per query")
    print(f"  Correct: {bor_correct}/{len(results)}")
    print()

    # Per-domain breakdown
    sov_domains = {}
    bor_domains = {}
    for r in results:
        d = r['domain']
        sov_domains.setdefault(d, []).append(r['sov_brain']['correct'])
        bor_domains.setdefault(d, []).append(r['borrowed']['correct'])

    print("Per-domain accuracy:")
    for d in set(sov_domains.keys()):
        sov_acc = sum(sov_domains[d]) / len(sov_domains[d])
        bor_acc = sum(bor_domains[d]) / len(bor_domains[d])
        winner = 'SOV' if sov_acc > bor_acc else ('BORROWED' if bor_acc > sov_acc else 'TIE')
        print(f"  {d}: SOV={sov_acc:.0%} ({sum(sov_domains[d])}/{len(sov_domains[d])}), "
              f"BORROWED={bor_acc:.0%} ({sum(bor_domains[d])}/{len(bor_domains[d])}), "
              f"Winner: {winner}")

    # Save results
    out_path = Path('/tmp/sov33_small_vs_borrowed.json')
    out_path.write_text(json.dumps({
        'ts': datetime.now(timezone.utc).isoformat(),
        'results': results,
        'summary': {
            'sov_brain_total_ms': sov_total,
            'sov_brain_correct': sov_correct,
            'borrowed_total_ms': bor_total,
            'borrowed_correct': bor_correct,
            'n_questions': len(results),
        }
    }, indent=2))
    print(f"\nResults saved to {out_path}")
    return results


if __name__ == '__main__':
    run_benchmark()
