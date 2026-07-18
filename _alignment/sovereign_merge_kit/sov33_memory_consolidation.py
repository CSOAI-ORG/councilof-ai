#!/usr/bin/env python3
"""
sov33_memory_consolidation.py — Sleep-like memory consolidation cycle.

Per neuroscience: during sleep, the brain consolidates memories, prunes
weak connections, and integrates new learning. For SOV33:
  1. Deduplicate replay buffer (remove near-duplicates)
  2. Boost high-scoring examples (priority for replay)
  3. Prune low-scoring examples
  4. Add "synthetic" examples from successful sovereign operations
"""
import sys, os, json, hashlib
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')

import os as _os
_MEM_DIR = Path(_os.environ.get('SOV33_SIGIL_DIR') or (Path.home() / '.sovereign'))
try:
    _MEM_DIR.mkdir(parents=True, exist_ok=True)
except Exception:
    _MEM_DIR = Path(_os.environ.get('TMPDIR', '/tmp')) / 'sov33_sigil'; _MEM_DIR.mkdir(parents=True, exist_ok=True)
REPLAY_PATH = _MEM_DIR / 'replay_buffer.jsonl'
SIGIL_PATH = _MEM_DIR / 'consolidation.sigil.jsonl'


def load_replay():
    if not REPLAY_PATH.exists():
        return []
    return [json.loads(l) for l in REPLAY_PATH.read_text().splitlines() if l.strip()]


def deduplicate(examples, threshold=0.85):
    """Remove near-duplicates by query hash similarity."""
    seen = {}
    keep = []
    for ex in examples:
        # Hash the query
        _txt = ex.get('query') or ex.get('content') or ex.get('text') or ''
        h = hashlib.sha256(_txt.lower().strip().encode()).hexdigest()[:8]
        if h not in seen:
            seen[h] = ex
            keep.append(ex)
        # else: skip duplicate
    return keep, len(examples) - len(keep)


def boost_by_score(examples):
    """Sort by score (highest first), keep top N."""
    return sorted(examples, key=lambda e: e.get('score', 0), reverse=True)


def prune_low(examples, min_score=0.3):
    """Remove examples below threshold."""
    return [ex for ex in examples if ex.get('score', 0) >= min_score], sum(1 for ex in examples if ex.get('score', 0) < min_score)


def consolidate(max_buffer=500):
    """Run the full consolidation cycle."""
    initial = load_replay()
    log = {'start_size': len(initial)}

    # Step 1: Deduplicate
    examples, deduped = deduplicate(initial)
    log['deduped'] = deduped

    # Step 2: Prune low scores
    examples, pruned = prune_low(examples)
    log['pruned_low_score'] = pruned

    # Step 3: Boost (sort by score)
    examples = boost_by_score(examples)

    # Step 4: Cap at max_buffer
    if len(examples) > max_buffer:
        examples = examples[:max_buffer]
    log['final_size'] = len(examples)

    # Save
    with open(REPLAY_PATH, 'w') as f:
        for ex in examples:
            f.write(json.dumps(ex) + '\n')

    # SIGIL
    sigil = hashlib.sha256(json.dumps(log, sort_keys=True).encode()).hexdigest()[:16]
    SIGIL_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(SIGIL_PATH, 'a') as f:
        f.write(json.dumps({
            'ts': datetime.now(timezone.utc).isoformat(),
            'event': 'memory_consolidation',
            'sigil': sigil,
            'log': log,
        }) + '\n')

    return log


if __name__ == '__main__':
    log = consolidate()
    print("Memory consolidation complete:")
    for k, v in log.items():
        print(f"  {k}: {v}")
