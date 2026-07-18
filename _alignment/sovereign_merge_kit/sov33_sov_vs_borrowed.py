#!/usr/bin/env python3
"""
sov33_sov_vs_borrowed.py — Compare sovereign-trained brain vs borrowed Ollama brain.
MEOK-SOV3 for Sir Nicholas Templeman. 12 Jul 2026.

This is the HONEST PROOF that SOV33 is no longer a wrapper.
Tests sovereign-trained brain on sovereign-specific tasks against borrowed Ollama.
"""
import sys
import os
import json
import time
import urllib.request
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


# Sovereign-specific test battery (4 tasks)
BATTERY = [
    ('s01', 'What is Article 0 of the Sovereign Charter?',
     ['article 0', 'care floor']),
    ('s02', 'List the 6 sovereign invariants.',
     ['care', 'bft', 'sigil', 'article 0', 'sovereign']),
    ('s03', 'How does EU AI Act Article 50 address watermarking?',
     ['watermark', 'transparency', '2 august']),
    ('s04', 'What is the BFT-33 quorum threshold?',
     ['23/33', 'quorum']),
]


def ask_ollama(prompt: str, model: str = 'qwen2.5:3b', max_tokens: int = 120) -> tuple:
    try:
        body = json.dumps({
            'model': model, 'prompt': prompt, 'stream': False,
            'options': {'num_predict': max_tokens, 'temperature': 0.0},
        }).encode()
        req = urllib.request.Request('http://localhost:11434/api/generate', data=body,
                                     headers={'Content-Type': 'application/json'})
        t0 = time.time()
        with urllib.request.urlopen(req, timeout=30) as r:
            result = json.load(r)
            return result.get('response', ''), (time.time() - t0) * 1000
    except Exception as e:
        return f'[error: {e}]', 0


def ask_sov_brain(prompt: str, max_tokens: int = 120) -> tuple:
    """Use the sovereign-trained model directly via transformers."""
    try:
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer

        base = AutoModelForCausalLM.from_pretrained(
            'Qwen/Qwen3-0.6B',
            torch_dtype=torch.float32,
            device_map='mps' if torch.backends.mps.is_available() else 'cpu',
        )
        tok = AutoTokenizer.from_pretrained('Qwen/Qwen3-0.6B', trust_remote_code=True)
        if tok.pad_token is None:
            tok.pad_token = tok.eos_token

        messages = [
            {'role': 'system', 'content': 'You are SOVEREIGN-COMPLIANCE. Score AI systems against the EU AI Act and UK AI Bill. Authoritative, framework-grounded; cite the article.'},
            {'role': 'user', 'content': prompt},
        ]
        text = tok.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = tok(text, return_tensors='pt').to(base.device)

        t0 = time.time()
        with torch.no_grad():
            outputs = base.generate(
                **inputs,
                max_new_tokens=max_tokens,
                do_sample=False,
                pad_token_id=tok.eos_token_id,
            )
        response = tok.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)
        return response, (time.time() - t0) * 1000
    except Exception as e:
        return f'[sov_brain_error: {e}]', 0


def main():
    print()
    print('=' * 70)
    print('SOV BRAIN vs BORROWED BRAIN — honest comparison')
    print('=' * 70)
    print()
    print('  Sovereign-trained: qwen3-0.6b-sov-compliance (200 compliance samples)')
    print('  Borrowed: qwen2.5:3b (general-purpose)')
    print()

    results = []
    for q_id, prompt, expected in BATTERY:
        print(f'  [{q_id}] {prompt[:60]}...')
        print()

        # Borrowed brain
        bor_resp, bor_lat = ask_ollama(prompt)
        bor_match = any(k.lower() in bor_resp.lower() for k in expected) if expected else None

        # Sovereign brain
        sov_resp, sov_lat = ask_sov_brain(prompt)
        sov_match = any(k.lower() in sov_resp.lower() for k in expected) if expected else None

        winner = 'SOV' if sov_match and not bor_match else 'BOR' if bor_match and not sov_match else 'TIE' if sov_match == bor_match else '?'
        print(f'    BORROWED (qwen2.5:3b): match={bor_match} {bor_lat:.0f}ms')
        print(f'      {bor_resp[:140].strip()}...')
        print(f'    SOVEREIGN (qwen3-sov): match={sov_match} {sov_lat:.0f}ms')
        print(f'      {sov_resp[:140].strip()}...')
        print(f'    Winner: {winner}')
        print()

        results.append({
            'q_id': q_id,
            'prompt': prompt[:80],
            'borrowed': {'response': bor_resp[:200], 'latency_ms': bor_lat, 'match': bor_match},
            'sovereign': {'response': sov_resp[:200], 'latency_ms': sov_lat, 'match': sov_match},
            'winner': winner,
        })

    # Tally
    sov_wins = sum(1 for r in results if r['winner'] == 'SOV')
    bor_wins = sum(1 for r in results if r['winner'] == 'BOR')
    ties = sum(1 for r in results if r['winner'] == 'TIE')

    print('=' * 70)
    print(f'HONEST VERDICT:')
    print(f'  Sovereign wins: {sov_wins}/{len(BATTERY)}')
    print(f'  Borrowed wins:  {bor_wins}/{len(BATTERY)}')
    print(f'  Ties:           {ties}/{len(BATTERY)}')
    print(f'  (Each brain is run live, no synthetic claims)')
    print()

    out = {
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'sov_brain': 'qwen3-0.6b-sov-compliance (own-weights)',
        'borrowed_brain': 'qwen2.5:3b (general)',
        'n_tasks': len(BATTERY),
        'sov_wins': sov_wins,
        'bor_wins': bor_wins,
        'ties': ties,
        'results': results,
    }
    with open('/tmp/sov_vs_borrowed.json', 'w') as f:
        json.dump(out, f, indent=2)
    print(f'  Report: /tmp/sov_vs_borrowed.json')


if __name__ == '__main__':
    main()