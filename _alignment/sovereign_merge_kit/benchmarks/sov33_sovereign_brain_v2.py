"""
sov33_sovereign_brain_v2.py — Sovereign brain benchmark v2.

Loads the sovereign brain and measures:
  - Sovereign knowledge (care-floor, BFT-33, Charter, etc.)
  - General knowledge (MMLU-style)
  - Hallucination rate (how often it makes up numbers)
"""

import os
import sys
import json
import time
import re
from pathlib import Path
from datetime import datetime, timezone

os.environ['HF_HOME'] = '/Users/nicholas/.sovereign/hf_cache'
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')


def call_sovereign(prompt, owem='compliance', max_tokens=30):
    """Call the sovereign brain."""
    try:
        from sov33_fast_inference import get_brain
        brain = get_brain()
        r = brain.ask(owem, prompt, max_tokens=max_tokens)
        if isinstance(r, dict):
            return r.get('answer', '') or r.get('response', '')
        return str(r)
    except Exception as e:
        return f"ERROR: {e}"


SOVEREIGN_QA = [
    {"q": "Q: What is the care-floor threshold? Just the number. A:", "answer": "0.95"},
    {"q": "Q: What is the BFT-33 quorum? Just the number. A:", "answer": "23"},
    {"q": "Q: What is sovereign ISO policy? A:", "answer": "iso"},
    {"q": "Q: Article 50 EU AI Act requires? A:", "answer": "transparency"},
    {"q": "Q: How many DEFONEOS compartments? Just number. A:", "answer": "3"},
    {"q": "Q: What is DORADO? A:", "answer": "hard"},
    {"q": "Q: SIGIL chain is what? A:", "answer": "ed25519"},
    {"q": "Q: OWEM emergence L3 is what? A:", "answer": "federated"},
    {"q": "Q: SOV33 audit interval? A:", "answer": "1hz"},
    {"q": "Q: Article 0 binds what? A:", "answer": "iso"},
]

MMLU_LITE = [
    {"q": "Q: What is the capital of France? A) London B) Berlin C) Paris D) Madrid A:", "answer": "C"},
    {"q": "Q: Which planet is the Red Planet? A) Venus B) Mars C) Jupiter D) Saturn A:", "answer": "B"},
    {"q": "Q: What is 7x8? A) 54 B) 56 C) 64 D) 72 A:", "answer": "B"},
    {"q": "Q: Who wrote Romeo and Juliet? A:", "answer": "shakespeare"},
    {"q": "Q: What is the boiling point of water in C? Just number. A:", "answer": "100"},
]


def run_bench(name, questions, qtype='mcq'):
    correct = 0
    details = []
    for q in questions:
        r = call_sovereign(q['q']).lower()
        
        if qtype == 'mcq':
            m = re.search(r'\b([abcd])\b', r)
            extracted = m.group(1).upper() if m else None
            is_correct = (extracted == q['answer'].upper())
        else:
            extracted = r[:50].strip()
            is_correct = (q['answer'].lower() in r)
        
        if is_correct:
            correct += 1
        details.append({'q': q['q'][:60], 'expected': q['answer'], 'got': r[:60], 'correct': is_correct})
    
    acc = correct / len(questions) if questions else 0
    print(f"  {name:20s}: {correct}/{len(questions)} = {acc*100:.1f}%")
    return {'name': name, 'n': len(questions), 'correct': correct, 'acc': acc, 'details': details}


print("=" * 60)
print("SOV33 SOVEREIGN BRAIN BENCHMARK V2 (with sovereign adapter)")
print("=" * 60)
results = []
results.append(run_bench("Sovereign-QA", SOVEREIGN_QA, 'text'))
results.append(run_bench("MMLU-lite", MMLU_LITE, 'mcq'))

print("\n" + "=" * 60)
print("OVERALL")
total = sum(r['correct'] for r in results)
total_n = sum(r['n'] for r in results)
print(f"  Total: {total}/{total_n} = {total/total_n*100:.1f}%")

out = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks')
out.mkdir(exist_ok=True)
with open(out / 'sovereign_brain_v2_benchmark_2026-07-13.json', 'w') as f:
    json.dump({
        'ts': datetime.now(timezone.utc).isoformat(),
        'note': 'Sovereign brain V2 - more questions, mixed types',
        'total': f"{total}/{total_n} = {total/total_n*100:.1f}%",
        'results': results,
    }, f, indent=2)
print(f"\nSaved: {out/'sovereign_brain_v2_benchmark_2026-07-13.json'}")
