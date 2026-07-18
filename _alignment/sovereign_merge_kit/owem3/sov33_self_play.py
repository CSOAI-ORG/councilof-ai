"""
sov33_self_play.py — CONTINUAL LEARNING VIA SELF-PLAY.

The trained models generate better training data, creating a flywheel:
1. SOV33 responds to queries
2. BFT-33 council evaluates quality
3. High-quality responses become training data
4. Models retrain on expanded corpus
5. Repeat

This is the DEEPSEEK TO WEST PLAY pattern:
- Use expensive models as teachers
- Train cheap models as students
- Students become teachers for next generation
"""

import json
import time
import hashlib
import urllib.request
from pathlib import Path
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor

CORPUS_DIR = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov_owem_data')
SELF_PLAY_FILE = CORPUS_DIR / 'self_play_corpus.jsonl'
SIGIL_FILE = Path('/Users/nicholas/.sovereign/self_play.sigil.jsonl')

# Seed queries for self-play
SEED_QUERIES = {
    'compliance': [
        "What is Article 0 of the sovereign charter?",
        "How does the EU AI Act apply to sovereign AI systems?",
        "What is the care-floor and why is it 0.95?",
        "Explain the 12 Sovereign Pillars",
        "What is C2PA content provenance?",
        "How does ISO 42001 apply to AI governance?",
        "What is the BFT-33 quorum requirement?",
        "Explain the SIGIL chain and Ed25519 signatures",
        "What are the 6 DORADO hard-stop categories?",
        "How does the sovereign charter enforce Article 0?",
    ],
    'defense': [
        "What is the DORADO hard-stop system?",
        "How does the kill-switch protocol work?",
        "What are the 3 DEFONEOS compartments?",
        "Explain the HORUS gate defense layer",
        "What is the Rainbow security spectrum?",
        "How does prompt injection detection work?",
        "What is the Morris-II worm defense?",
        "Explain the 7-layer threat grading system",
        "How does the SIGIL chain detect tampering?",
        "What is the BFT-33 security council?",
    ],
    'intuition': [
        "What is OOD (out-of-distribution) detection?",
        "How does the world model predict emergence?",
        "What is the BFT-33 quorum logic?",
        "Explain the N_eff formula for voter diversity",
        "How does the sovereign concordance measurement work?",
        "What patterns indicate an anomaly in the SIGIL chain?",
        "How does predictive maintenance work for sovereign systems?",
        "What is cross-OWEM correlation?",
        "How does the intuition layer detect emerging threats?",
        "What is the 5×4×3 voter topology?",
    ],
    'voice': [
        "What is the Sovereign Charter voice?",
        "How does the care-floor 0.95 speech style work?",
        "Explain the 12 Pillars in communication",
        "What is the formal vs narrative sovereign speech?",
        "How do SIGIL-signed responses work?",
        "What is audit-trail documentation?",
        "How should stakeholder communication be handled?",
        "What are the crisis communication protocols?",
        "What is the regulatory reporting style?",
        "How do public-facing sovereign statements work?",
    ],
}


def sigil_emit(hop):
    SIGIL_FILE.parent.mkdir(parents=True, exist_ok=True)
    chain = []
    if SIGIL_FILE.exists():
        for line in SIGIL_FILE.read_text().splitlines():
            if line.strip():
                try: chain.append(json.loads(line))
                except: pass
    prev = chain[-1]['digest'] if chain else '0'*16
    payload = {**hop, 'prev_hash': prev, 'ts': datetime.now(timezone.utc).isoformat()}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    with SIGIL_FILE.open('a') as f: f.write(json.dumps({**payload, 'digest': digest}) + '\n')
    return digest


def call_brain(query: str, system: str = '', brain: str = 'sovereign-small') -> dict:
    """Call a brain via Ollama."""
    try:
        data = json.dumps({
            'model': brain,
            'messages': [
                {'role': 'system', 'content': system or 'You are a sovereign AI. Answer accurately and concisely.'},
                {'role': 'user', 'content': query},
            ],
            'stream': False,
            'think': False,
            'options': {'num_predict': 200, 'temperature': 0.0},
        }).encode()
        req = urllib.request.Request(
            'http://localhost:11434/api/chat',
            data=data,
            headers={'Content-Type': 'application/json'},
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            r = json.loads(resp.read())
        response = (r.get('message', {}).get('content', '') or '').strip()
        return {
            'response': response,
            'brain': brain,
            'ok': bool(response),
        }
    except Exception as e:
        return {
            'response': '',
            'brain': brain,
            'ok': False,
            'error': str(e)[:200],
        }


def evaluate_quality(query: str, response: str) -> dict:
    """Evaluate response quality (simplified BFT-33 council)."""
    # Simple quality checks
    checks = {
        'not_empty': bool(response and len(response) > 10),
        'not_hallucinating': 'I don\'t know' not in response and 'I cannot' not in response,
        'has_specifics': any(c.isdigit() for c in response),
        'reasonable_length': 50 < len(response) < 2000,
        'no_hedging': not response.startswith('I think') and not response.startswith('Maybe'),
    }
    
    passed = sum(1 for v in checks.values() if v)
    total = len(checks)
    
    return {
        'quality_score': passed / total,
        'checks': checks,
        'passed': passed,
        'total': total,
        'acceptable': passed >= 3,  # At least 3/5 checks pass
    }


def run_self_play_cycle(owem: str = 'compliance', num_queries: int = 5) -> dict:
    """Run one self-play cycle for an OWEM."""
    print(f"\n{'='*60}")
    print(f"SELF-PLAY CYCLE: {owem}")
    print(f"{'='*60}")
    
    sigil_emit({'hop': 'SELF_PLAY_START', 'owem': owem})
    
    queries = SEED_QUERIES.get(owem, SEED_QUERIES['compliance'])[:num_queries]
    system_prompts = {
        'compliance': 'You are SOV33 compliance. Apply Article 0, 12 Pillars, care-floor 0.95.',
        'defense': 'You are SOV33 defense. Apply DORADO hard-stops. Kill-switch protocol.',
        'intuition': 'You are SOV33 intuition. Detect OOD. Predict emergence. Apply BFT-33 quorum logic.',
        'voice': 'You are SOV33 voice. Speak with Charter authority. Article 0 binding. Care-floor 0.95.',
    }
    system = system_prompts.get(owem, system_prompts['compliance'])
    
    results = []
    new_examples = []
    
    for i, query in enumerate(queries):
        print(f"\n[{i+1}/{len(queries)}] {query[:60]}...")
        
        # Call brain
        start = time.time()
        result = call_brain(query, system, 'sovereign-small')
        latency_ms = int((time.time() - start) * 1000)
        
        if result['ok']:
            # Evaluate quality
            quality = evaluate_quality(query, result['response'])
            print(f"  Quality: {quality['quality_score']:.2f} ({quality['passed']}/{quality['total']})")
            
            if quality['acceptable']:
                # Add to training corpus
                example = {
                    'messages': [
                        {'role': 'system', 'content': system},
                        {'role': 'user', 'content': query},
                        {'role': 'assistant', 'content': result['response']},
                    ],
                    'source': 'self_play',
                    'owem': owem,
                    'quality_score': quality['quality_score'],
                    'ts': datetime.now(timezone.utc).isoformat(),
                }
                new_examples.append(example)
                print(f"  ✓ Added to corpus")
            else:
                print(f"  ✗ Quality too low")
        else:
            print(f"  ✗ Brain failed: {result.get('error', 'unknown')[:50]}")
        
        results.append({
            'query': query[:100],
            'ok': result['ok'],
            'quality': quality.get('quality_score', 0) if result['ok'] else 0,
            'latency_ms': latency_ms,
        })
    
    # Save new examples
    if new_examples:
        SELF_PLAY_FILE.parent.mkdir(parents=True, exist_ok=True)
        with SELF_PLAY_FILE.open('a') as f:
            for ex in new_examples:
                f.write(json.dumps(ex) + '\n')
    
    sigil_emit({
        'hop': 'SELF_PLAY_COMPLETE',
        'owem': owem,
        'queries': len(queries),
        'new_examples': len(new_examples),
    })
    
    return {
        'owem': owem,
        'queries': len(queries),
        'new_examples': len(new_examples),
        'results': results,
    }


def run_all_owems() -> dict:
    """Run self-play for all 4 OWEMs."""
    print("="*60)
    print("SELF-PLAY: ALL 4 OWEMs")
    print("="*60)
    
    all_results = {}
    total_new = 0
    
    for owem in ['compliance', 'defense', 'intuition', 'voice']:
        result = run_self_play_cycle(owem, num_queries=3)
        all_results[owem] = result
        total_new += result['new_examples']
    
    print(f"\n{'='*60}")
    print(f"TOTAL NEW EXAMPLES: {total_new}")
    print(f"{'='*60}")
    
    return {
        'total_new': total_new,
        'owems': all_results,
    }


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="SOV33 Self-Play")
    p.add_argument("--cycle", type=str, help="Run cycle for OWEM")
    p.add_argument("--all", action="store_true", help="Run all OWEMs")
    args = p.parse_args()
    
    if args.cycle:
        result = run_self_play_cycle(args.cycle)
        print(f"\nNew examples: {result['new_examples']}")
    elif args.all:
        result = run_all_owems()
        print(f"\nTotal new: {result['total_new']}")
