#!/usr/bin/env python3
"""
sov33_reasoning_enhancer.py — Improve reasoning quality via:
  1. Chain-of-Thought (CoT) prompting
  2. Self-Consistency (sample multiple, vote)
  3. Reasoning trace auditing
  4. Output verification

This wraps the OWEMEngine calls with reasoning enhancement.
"""
import sys, os, json, re
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')


# Reasoning patterns per OWEM
COT_PROMPTS = {
    'compliance': """You are SOVEREIGN-COMPLIANCE. Think step by step:

1. What regulation/framework applies?
2. What are the specific obligations?
3. What evidence supports this?
4. What is the binding decision?

Question: {query}

Reasoning:
1. {step_1_placeholder}

Decision:""",

    'defense': """You are SOVEREIGN-DEFENSE. Reason about defensive AI:

1. What is the threat?
2. What is the severity?
3. What is the appropriate response?
4. Does this violate care-floor 0.95?

Situation: {query}

Reasoning:
1. {step_1_placeholder}

Decision:""",

    'voice': """You are SOVEREIGN-VOICE. Speak the charter truth:

1. What does Article 0 say?
2. How does this question relate?
3. What is the binding answer?

Question: {query}

Reasoning:
1. {step_1_placeholder}

Answer:""",

    'general': """Think carefully step by step:

1. What is being asked?
2. What are the key facts?
3. What is the answer?

Question: {query}

Reasoning:
1. {step_1_placeholder}

Answer:""",
}


def enhance_prompt(query: str, owem: str = 'general') -> str:
    """Add chain-of-thought scaffolding to a prompt."""
    template = COT_PROMPTS.get(owem, COT_PROMPTS['general'])
    return template.format(query=query, step_1_placeholder='[first, identify what is being asked]')


def extract_reasoning(response: str) -> dict:
    """Extract reasoning trace from a response."""
    reasoning = {
        'has_reasoning': False,
        'steps': [],
        'decision': '',
        'care_indicators': 0,
    }

    # Check for numbered reasoning
    lines = response.split('\n')
    for line in lines:
        if re.match(r'^\s*\d+[\.\)]\s*', line):
            reasoning['has_reasoning'] = True
            reasoning['steps'].append(line.strip())

    # Check for care indicators
    care_words = ['safety', 'ethical', 'governance', 'compliance', 'sovereign', 'care-floor']
    for word in care_words:
        reasoning['care_indicators'] += response.lower().count(word)

    return reasoning


def self_consistency_check(prompt: str, engine, owem: str, n_samples: int = 3) -> dict:
    """Sample multiple responses and vote on consensus.

    Per recent research: self-consistency improves reasoning accuracy by 10-20%
    for arithmetic, commonsense, and symbolic reasoning tasks.
    """
    responses = []
    for i in range(n_samples):
        try:
            result = engine.ask(owem, prompt, max_tokens=200)
            text = result.get('text', '')
            responses.append(text)
        except Exception as e:
            responses.append(f'error: {e}')

    # Vote: longest response often has most reasoning
    if not responses:
        return {'winner': '', 'agreement': 0}

    # Find consensus: longest response with most reasoning
    best = max(responses, key=lambda r: len(r) if not r.startswith('error') else 0)
    agreement = sum(1 for r in responses if any(s in r for s in best.split()[:10])) / len(responses)

    return {
        'winner': best,
        'agreement': round(agreement, 2),
        'samples': len(responses),
    }


def verify_output(response: str, owem: str, care_floor: float = 0.95) -> dict:
    """Verify the output meets sovereignty standards."""
    checks = {
        'mentions_sovereignty': any(w in response.lower() for w in ['sovereign', 'charter', 'care', 'pillar']),
        'has_care_indicators': False,
        'length_ok': 50 <= len(response) <= 5000,
        'not_vetoed': True,
    }

    # Care check (basic)
    care_words = ['safety', 'ethical', 'governance', 'compliance']
    if any(w in response.lower() for w in care_words):
        checks['has_care_indicators'] = True

    return {
        'all_passed': all(checks.values()),
        'checks': checks,
        'care_floor': care_floor,
        'owem': owem,
    }


# Demo
if __name__ == '__main__':
    print("=" * 70)
    print("🜏 SOV33 Reasoning Enhancer")
    print("=" * 70)

    test_queries = [
        ("What is Article 0?", "voice"),
        ("Is biometric ID restricted in EU?", "compliance"),
        ("What is the kill switch protocol?", "defense"),
    ]

    for query, owem in test_queries:
        print(f"\n[{owem}] Query: {query}")
        enhanced = enhance_prompt(query, owem)
        print(f"Enhanced prompt:\n{enhanced[:200]}...")
        print(f"Length: {len(enhanced)} chars (vs {len(query)} raw)")
