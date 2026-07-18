#!/usr/bin/env python3
"""auto_citation_loop.py — Continuous citation-quality loop.

For each question in the citation battery:
  1. Send to live API
  2. Verify correct article cited
  3. Log to running JSON
  4. Print progress + scoring
"""
import os, sys, json, re, time
os.environ.pop('PYTHONPATH', None)
import urllib.request

OUTPUT = '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks/auto_citation_loop.json'

def call(q, owem='brain', timeout=60):
    payload = json.dumps({'owem': owem, 'message': q, 'max_tokens': 120}).encode()
    req = urllib.request.Request(
        'http://localhost:8101/api/owem/fast',
        data=payload, headers={'Content-Type': 'application/json'},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read()).get('answer', '')
    except Exception as e:
        return f'[error: {e}]'


BATTERY = [
    ("When does Article 50 of the EU AI Act take effect?", "50"),
    ("What does EU AI Act Article 50 require?", "50"),
    ("What is the penalty for violating Article 50?", "50"),
    ("What does the watermarking requirement in the EU AI Act apply to?", "50"),
    ("Is C2PA part of EU AI Act Article 50?", "50"),
    ("What does Article 9 of the EU AI Act require?", "9"),
    ("What is the risk management obligation under the EU AI Act?", "9"),
    ("Who in an organization is responsible for risk management under the AI Act?", "9"),
    ("What does Article 10 of the EU AI Act require?", "10"),
    ("What does the data governance requirement of the EU AI Act say?", "10"),
    ("What datasets are prohibited under EU AI Act Article 10?", "10"),
    ("What does Article 12 of the EU AI Act require?", "12"),
    ("What logs must high-risk AI systems keep under the EU AI Act?", "12"),
    ("What does Article 13 require about AI system transparency?", "13"),
    ("What does Article 14 require about human oversight?", "14"),
    ("What must providers do under Article 14 of the AI Act?", "14"),
    ("What does Article 15 require about accuracy of AI systems?", "15"),
    ("What does Article 19 require about post-market monitoring?", "19"),
    ("What is required under Article 61 for serious incident reporting?", "61"),
    ("What is the consequence of misleading information under the AI Act?", "99"),
]


def run(label='continuous'):
    """Run full citation battery, save to JSON."""
    results = []
    for q, expected in BATTERY:
        ans = call(q)
        cited = re.findall(r'[Aa]rt(?:icle|\.)\s*(\d+)', ans)
        correct = expected in cited
        wrong = [c for c in cited if c != expected]
        no_answer = len(ans) < 20 or 'Greetings. I am SOV33' in ans
        results.append({
            'q': q[:55], 'expected': expected, 'cited': cited,
            'correct': correct, 'wrong': wrong,
            'no_answer': no_answer,
            'answer': ans[:200],
        })

    n = len(results)
    correct = sum(1 for r in results if r['correct'])
    no_ans = sum(1 for r in results if r['no_answer'])

    payload = {
        'label': label,
        'ts': time.strftime('%Y-%m-%dT%H:%M:%S+00:00', time.gmtime()),
        'n': n,
        'correct_pct': round(correct/n*100, 1),
        'no_answer_pct': round(no_ans/n*100, 1),
        'correct': correct,
        'no_answer': no_ans,
        'results': results,
    }

    # Append to history file
    history_path = OUTPUT
    try:
        with open(history_path) as f:
            history = json.load(f)
    except:
        history = {'runs': []}
    history['runs'].append(payload)
    history['latest'] = payload
    with open(history_path, 'w') as f:
        json.dump(history, f, indent=2)

    print(f'[{label}] {correct}/{n} = {correct/n*100:.1f}% correct ({no_ans} no-answer)')
    return payload


if __name__ == '__main__':
    label = sys.argv[1] if len(sys.argv) > 1 else 'continuous'
    run(label)
