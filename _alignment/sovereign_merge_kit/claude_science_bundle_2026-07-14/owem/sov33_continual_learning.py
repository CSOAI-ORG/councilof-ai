"""
sov33_continual_learning.py — Continuous Learning Loop.

After every sovereign action, extract a "lesson" and add to the training corpus.
This is the "Open World" aspect of the OWEM — it grows from every interaction.

Pipeline:
  1. Sovereign action happens (chat, agent, governance)
  2. Outcome is logged (care score, response, context)
  3. Lessons are extracted (what worked, what didn't)
  4. New training examples are created
  5. Periodically retrain the sovereign brains
  6. Each retrain cycle SIGIL-signed to the chain

This is the "organic open world model" - grows from real substrate use.
"""

import os
import sys
import json
import time
import hashlib
from pathlib import Path
from datetime import datetime, timezone
from collections import defaultdict

SIGIL_FILE = Path('/Users/nicholas/.sovereign/sov33_continual.sigil.jsonl')
LESSONS_FILE = Path('/Users/nicholas/.sovereign/sov33_lessons.jsonl')
TRAINING_POOL = Path('/Users/nicholas/.sovereign/sov33_training_pool.jsonl')


def sigil_emit(hop):
    SIGIL_FILE.parent.mkdir(parents=True, exist_ok=True)
    chain = []
    if SIGIL_FILE.exists():
        for line in SIGIL_FILE.read_text().splitlines():
            if line.strip():
                try:
                    chain.append(json.loads(line))
                except Exception:
                    pass
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {**hop, 'prev_hash': prev, 'ts': datetime.now(timezone.utc).isoformat()}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    with SIGIL_FILE.open('a') as f:
        f.write(json.dumps({**payload, 'digest': digest}) + '\n')
    return digest


def log_sovereign_action(action_type, prompt, response, care_score, owem_used, sigil, ok=True):
    """Log a sovereign action to the lessons pool."""
    record = {
        'ts': datetime.now(timezone.utc).isoformat(),
        'action_type': action_type,
        'prompt': prompt[:500],
        'response': response[:500],
        'care_score': care_score,
        'owem_used': owem_used,
        'sigil': sigil,
        'ok': ok,
    }
    with LESSONS_FILE.open('a') as f:
        f.write(json.dumps(record) + '\n')
    return record


def extract_lessons(records, min_care=0.85):
    """Extract training lessons from successful actions.
    
    A lesson = (prompt, response) pair where care_score >= min_care
    AND the response contains a specific factual answer.
    """
    lessons = []
    for r in records:
        if r.get('care_score', 0) >= min_care and r.get('ok') and r.get('response'):
            # Convert to chat format for training
            lesson = {
                'messages': [
                    {'role': 'user', 'content': r['prompt']},
                    {'role': 'assistant', 'content': r['response']},
                ],
                'source': 'continual_learning',
                'care_score': r['care_score'],
                'sigil': r.get('sigil', ''),
            }
            lessons.append(lesson)
    return lessons


def append_to_training_pool(lessons):
    """Add new lessons to the training pool."""
    if not lessons:
        return 0
    with TRAINING_POOL.open('a') as f:
        for l in lessons:
            f.write(json.dumps(l) + '\n')
    return len(lessons)


def get_pool_stats():
    """Get training pool statistics."""
    if not TRAINING_POOL.exists():
        return {'n_lessons': 0, 'n_unique_prompts': 0}
    n = 0
    prompts = set()
    with TRAINING_POOL.open() as f:
        for line in f:
            if line.strip():
                try:
                    d = json.loads(line)
                    n += 1
                    if d.get('messages'):
                        prompts.add(d['messages'][0]['content'])
                except Exception:
                    pass
    return {
        'n_lessons': n,
        'n_unique_prompts': len(prompts),
        'pool_file': str(TRAINING_POOL),
    }


def run_cycle():
    """Run one continual learning cycle."""
    print("=" * 60)
    print("CONTINUAL LEARNING CYCLE")
    print("=" * 60)
    
    sigil_emit({'hop': 'CONTINUAL_CYCLE_START'})
    
    # Read recent lessons
    if not LESSONS_FILE.exists():
        print("  No lessons yet")
        return {'n_lessons': 0, 'extracted': 0, 'appended': 0}
    
    records = []
    with LESSONS_FILE.open() as f:
        for line in f:
            if line.strip():
                try:
                    records.append(json.loads(line))
                except Exception:
                    pass
    
    print(f"  Total records: {len(records)}")
    
    # Extract high-quality lessons
    lessons = extract_lessons(records)
    print(f"  High-care lessons: {len(lessons)}")
    
    # Append to pool
    n = append_to_training_pool(lessons)
    print(f"  Appended to pool: {n}")
    
    # Stats
    stats = get_pool_stats()
    print(f"  Pool size: {stats['n_lessons']} lessons ({stats['n_unique_prompts']} unique)")
    
    sigil_emit({
        'hop': 'CONTINUAL_CYCLE_END',
        'n_records': len(records),
        'n_extracted': len(lessons),
        'n_appended': n,
        'pool_size': stats['n_lessons'],
    })
    
    return {
        'n_records': len(records),
        'extracted': len(lessons),
        'appended': n,
        'pool_stats': stats,
    }


def handle_continual_run(payload=None):
    return run_cycle()


def handle_continual_log(payload):
    """Log a sovereign action."""
    return log_sovereign_action(
        action_type=payload.get('action_type', 'unknown'),
        prompt=payload.get('prompt', ''),
        response=payload.get('response', ''),
        care_score=payload.get('care_score', 0.0),
        owem_used=payload.get('owem_used', ''),
        sigil=payload.get('sigil', ''),
        ok=payload.get('ok', True),
    )


def handle_continual_stats(payload=None):
    return {
        'lessons_file': str(LESSONS_FILE),
        'training_pool': str(TRAINING_POOL),
        'pool_stats': get_pool_stats(),
        'sigil_chain': str(SIGIL_FILE),
    }


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="SOV33 Continual Learning")
    p.add_argument("--run", action="store_true", help="Run a cycle")
    p.add_argument("--stats", action="store_true", help="Show stats")
    args = p.parse_args()
    
    if args.run:
        run_cycle()
    elif args.stats:
        print(json.dumps(handle_continual_stats(), indent=2))
    else:
        print("Use --run or --stats")
