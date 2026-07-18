#!/usr/bin/env python3
"""
sov33_self_consistency.py — Self-consistency reasoning (sample N, vote).

Per Wang et al. 2022: sample multiple reasoning paths, take majority answer.
Improves accuracy 10-20% on arithmetic, commonsense, symbolic reasoning.

For SOV33: sample N times via OWEM cascade, vote on consensus.
"""
import sys, os, json, hashlib
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')


def extract_final_answer(text: str) -> str:
    """Extract the final answer from a response (last number, or last sentence)."""
    import re
    nums = re.findall(r'-?\d[\d,]*\.?\d*', (text or '').replace(',', ''))
    if nums:
        return nums[-1]
    # Otherwise: last sentence
    sentences = re.split(r'[.!?]\s+', text.strip())
    return sentences[-1] if sentences else text[:200]


def self_consistency(prompt: str, engine, owem: str = 'general', n_samples: int = 3, max_tokens: int = 200) -> dict:
    """Sample N responses, vote on majority answer.

    Returns: {
        'winner': the most-common answer,
        'agreement': fraction of samples that agree (0..1),
        'samples': list of {answer, sigil} for each sample,
        'sigil': SIGIL of the consensus
    }
    """
    samples = []
    answers = []
    for i in range(n_samples):
        try:
            result = engine.ask(owem, prompt, max_tokens=max_tokens)
            text = result.get('text', '')
            sigil = result.get('sigil', '')
            answer = extract_final_answer(text)
            samples.append({'answer': answer, 'text': text[:300], 'sigil': sigil[:16]})
            answers.append(answer)
        except Exception as e:
            samples.append({'answer': '', 'text': '', 'sigil': '', 'error': str(e)})
            answers.append('')

    # Vote: count most common
    if not answers or all(a == '' for a in answers):
        return {
            'winner': '',
            'agreement': 0.0,
            'samples': samples,
            'sigil': hashlib.sha256(f'empty-{prompt}'.encode()).hexdigest()[:16],
        }

    from collections import Counter
    counts = Counter(answers)
    winner, count = counts.most_common(1)[0]
    agreement = count / len(answers)

    sigil = hashlib.sha256(f'{winner}-{prompt}'.encode()).hexdigest()[:16]

    return {
        'winner': winner,
        'agreement': round(agreement, 2),
        'samples': samples,
        'sigil': sigil,
        'n_samples': n_samples,
        'owem': owem,
        'care_floor': 0.95,
        'ts': datetime.now(timezone.utc).isoformat(),
    }


if __name__ == '__main__':
    # Quick test
    prompts = [
        ("What is 17 + 25?", "general"),
        ("What is Article 0?", "voice"),
    ]
    print("SOV33 self-consistency demo (no engine call, just structure)")
    for q, owem in prompts:
        print(f"\n  Q: {q} (owem={owem})")
        print(f"  Would sample N=3, vote on majority, report agreement + winner")
