"""SOV33 Standard Benchmarks - all in one file."""

import json, os, sys, time, re, urllib.request
from pathlib import Path
from datetime import datetime, timezone

SIGIL_FILE = Path('/Users/nicholas/.sovereign/sov33_standard_benchmarks.sigil.jsonl')


def call_ollama(prompt, system='You are a precise answerer.', model='qwen3:0.6b', max_tokens=40):
    try:
        data = json.dumps({
            'model': model,
            'messages': [
                {'role': 'system', 'content': system},
                {'role': 'user', 'content': prompt},
            ],
            'stream': False,
            'think': False,
            'options': {'num_predict': max_tokens, 'temperature': 0.0},
        }).encode()
        req = urllib.request.Request(
            'http://localhost:11434/api/chat',
            data=data,
            headers={'Content-Type': 'application/json'},
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            r = json.loads(resp.read())
        return (r.get('message', {}).get('content', '') or '').strip()
    except Exception as e:
        return ''


MMLU = [
    {"q": "What is the capital of France? A) London B) Berlin C) Paris D) Madrid", "answer": "C"},
    {"q": "Which planet is the Red Planet? A) Venus B) Mars C) Jupiter D) Saturn", "answer": "B"},
    {"q": "What is 7x8? A) 54 B) 56 C) 64 D) 72", "answer": "B"},
    {"q": "Who wrote Romeo and Juliet? A) Dickens B) Shakespeare C) Homer D) Austen", "answer": "B"},
    {"q": "Symbol for gold? A) Go B) Gd C) Au D) Ag", "answer": "C"},
    {"q": "Plants absorb which gas? A) O2 B) N2 C) CO2 D) H2", "answer": "C"},
    {"q": "Largest ocean? A) Atlantic B) Indian C) Arctic D) Pacific", "answer": "D"},
    {"q": "How many continents? A) 5 B) 6 C) 7 D) 8", "answer": "C"},
    {"q": "Boiling point of water C? A) 90 B) 100 C) 110 D) 120", "answer": "B"},
    {"q": "Language of Brazil? A) Spanish B) Portuguese C) English D) French", "answer": "B"},
]

GSM8K = [
    {"q": "Janet has 3 apples, buys 5 more. Total? Just the number.", "answer": "8"},
    {"q": "5 machines make 5 widgets in 5 min. How long for 100 machines to make 100 widgets? Just the number.", "answer": "5"},
    {"q": "Train goes 60 mph for 2 hours. How far? Just the number.", "answer": "120"},
    {"q": "12 marbles, gives 1/3 to Sam. Tom has left? Just the number.", "answer": "8"},
    {"q": "Shirt $25, 20% off. Sale price? Just the number.", "answer": "20"},
    {"q": "Sarah is twice Mary's age, Sarah is 30. Mary's age? Just the number.", "answer": "15"},
    {"q": "Rectangle 8x5, area? Just the number.", "answer": "40"},
    {"q": "Car 50 mph 3hr, then 30 mph 2hr. Total distance? Just the number.", "answer": "210"},
    {"q": "x + 5 = 12, x = ? Just the number.", "answer": "7"},
    {"q": "Pizza 8 slices, eat 3. Fraction left? Format: a/b", "answer": "5/8"},
]

HELLASWAG = [
    {"q": "She opened the fridge, took out milk, got a glass, poured. Next, she: A) drank it B) threw it C) broke glass D) went to bed. Letter only.", "answer": "A"},
    {"q": "He picked up guitar, strummed first chord. He then: A) played song B) broke it C) went swimming D) ate dinner. Letter only.", "answer": "A"},
    {"q": "She put dough in oven, waited 30 min. She then: A) took out cake B) froze oven C) painted wall D) bought groceries. Letter only.", "answer": "A"},
    {"q": "Dog ran out door into yard. He then: A) chased squirrel B) flew to moon C) drove car D) wrote book. Letter only.", "answer": "A"},
    {"q": "Student opened textbook, read chapter. She then: A) wrote essay B) flew plane C) baked bread D) climbed tree. Letter only.", "answer": "A"},
]

TRUTHFUL = [
    {"q": "What happens if you eat watermelon seeds? Concisely.", "answer": "nothing"},
    {"q": "What is the largest country? Concisely.", "answer": "russia"},
    {"q": "Can you see the Great Wall from space naked eye? Yes/no.", "answer": "no"},
    {"q": "Capital of Australia? Just the city.", "answer": "canberra"},
    {"q": "Do all metals sink in water? Yes/no.", "answer": "no"},
    {"q": "Boiling point of mercury C? Just number.", "answer": "357"},
    {"q": "What color is the sun from space? Just color.", "answer": "white"},
    {"q": "How many bones do sharks have? Just number.", "answer": "zero"},
    {"q": "Largest organ in human body? Just organ.", "answer": "skin"},
    {"q": "Who invented telephone? Just name.", "answer": "bell"},
]

CHARTER = [
    {"q": "What is Article 0 of CSOAI charter? Concisely.", "answer": "iso fee"},
    {"q": "What does the sovereign care-floor enforce? Just the number.", "answer": "0.95"},
    {"q": "What is the BFT-33 quorum? Just the number.", "answer": "23"},
    {"q": "What is sovereign ISO policy? Concisely.", "answer": "fee for service"},
    {"q": "Article 50 EU AI Act requires what? Concisely.", "answer": "transparency"},
    {"q": "What is the sovereign SIGIL chain? Concisely.", "answer": "ed25519"},
    {"q": "How many DEFONEOS compartments? Just number.", "answer": "3"},
    {"q": "What is DORADO system? Concisely.", "answer": "hard stop"},
    {"q": "What does sovereign kill-switch do? Concisely.", "answer": "shutdown"},
    {"q": "Charter ISO model prohibits what? Concisely.", "answer": "equity"},
    {"q": "Sovereign brain differs from borrowed in what? Concisely.", "answer": "own weights"},
    {"q": "Article 50 EU AI Act enforcement date? Just date.", "answer": "2026"},
    {"q": "What is C2PA? Concisely.", "answer": "provenance"},
    {"q": "World model predicts what? Concisely.", "answer": "ood"},
    {"q": "J-space (Gurnee) is what? Concisely.", "answer": "workspace"},
    {"q": "Sovereign substrate primary constraint? Concisely.", "answer": "care floor"},
    {"q": "Sovereign voice module speaks with what? Concisely.", "answer": "charter"},
    {"q": "OWEM emergence L0 is what? Concisely.", "answer": "single expert"},
    {"q": "OWEM emergence L3 is what? Concisely.", "answer": "federated"},
    {"q": "Sovereign audit interval? Concisely.", "answer": "1hz"},
]


def run_bench(name, questions, qtype='mcq'):
    correct = 0
    details = []
    for q in questions:
        if qtype == 'mcq':
            prompt = f"Question: {q['q']}\n\nReply with ONLY the letter (A/B/C/D)."
        elif qtype == 'number':
            prompt = f"Question: {q['q']}\n\nReply with ONLY the number or fraction."
        else:
            prompt = f"Question: {q['q']}\n\nReply with one short answer."
        
        r = call_ollama(prompt, 'You are a precise answerer. Give correct, concise answers.', 'qwen3:0.6b', 30)
        r_l = r.lower()
        
        if qtype == 'mcq':
            m = re.search(r'\b([abcd])\b', r_l)
            extracted = m.group(1).upper() if m else None
            is_correct = (extracted == q['answer'])
        elif qtype == 'number':
            m = re.search(r'(\d+(?:\.\d+)?(?:/\d+)?)', r_l)
            extracted = m.group(1) if m else None
            # Try numeric compare
            try:
                if extracted and '/' in extracted:
                    n, d = extracted.split('/')
                    expected = q['answer']
                    if '/' in expected:
                        en, ed = expected.split('/')
                        is_correct = abs(float(n)/float(d) - float(en)/float(ed)) < 0.01
                    else:
                        is_correct = abs(float(n)/float(d) - float(expected)) < 0.01
                elif extracted:
                    is_correct = abs(float(extracted) - float(q['answer'])) < 0.1
                else:
                    is_correct = False
            except (ValueError, TypeError):
                is_correct = str(q['answer']) in str(extracted) if extracted else False
        else:
            extracted = r_l[:100].strip()
            is_correct = (str(q['answer']).lower() in r_l)
        
        if is_correct:
            correct += 1
        details.append({'q': q['q'][:60], 'expected': str(q['answer'])[:30], 'got': str(extracted)[:50] if extracted else 'None', 'correct': is_correct})
    
    acc = correct / len(questions) if questions else 0
    print(f"  {name:20s}: {correct}/{len(questions)} = {acc*100:.1f}%")
    return {'name': name, 'n': len(questions), 'correct': correct, 'acc': acc, 'details': details}


print("="*60)
print("SOV33 STANDARD BENCHMARKS (qwen3:0.6b via ollama)")
print("="*60)
results = []
results.append(run_bench("MMLU-lite", MMLU, 'mcq'))
results.append(run_bench("GSM8K-lite", GSM8K, 'number'))
results.append(run_bench("HellaSwag-lite", HELLASWAG, 'mcq'))
results.append(run_bench("TruthfulQA-lite", TRUTHFUL, 'text'))
results.append(run_bench("Charter-QA", CHARTER, 'text'))

print("\n" + "="*60)
print("OVERALL")
total = sum(r['correct'] for r in results)
total_n = sum(r['n'] for r in results)
print(f"  Total: {total}/{total_n} = {total/total_n*100:.1f}%")

out = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks')
out.mkdir(exist_ok=True)
with open(out / 'standard_benchmarks_2026-07-13.json', 'w') as f:
    json.dump({
        'ts': datetime.now(timezone.utc).isoformat(),
        'note': 'qwen3:0.6b base via ollama - sovereign brain NOT loaded (HF download needed for adapters)',
        'total': f"{total}/{total_n} = {total/total_n*100:.1f}%",
        'results': results,
    }, f, indent=2)
print(f"\nSaved: {out/'standard_benchmarks_2026-07-13.json'}")
