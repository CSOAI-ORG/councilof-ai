#!/usr/bin/env python3
"""
Sovereign Mist 12 Pillars memory substrate — SEMANTIC retrieval edition.

Uses sentence-transformers/all-MiniLM-L6-v2 (90MB, 22M params) for proper
semantic matching. Strips hermes-agent from sys.path so versions don't collide.

Backed by:
  - ~/.sovereign/sovereign_memory.jsonl (35 memories, Care-Floor + 12 Pillars bound)
  - ~/.sovereign/memory_embeddings.npz (cache, regenerated when MEM count changes)

Usage:
  sovereign-memory-semantic          # interactive
  sovereign-memory-semantic --recall "q"    # one-shot
"""
import os
import sys

# Strip hermes-agent path BEFORE any imports (Python version collision)
sys.path = [p for p in sys.path if 'hermes-agent' not in p]
os.environ.pop('PYTHONPATH', None)
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'

import json
import argparse
import hashlib
import time
from pathlib import Path
from datetime import datetime, timezone

# Try to import sentence_transformers (deferred until after path clean)
try:
    from sentence_transformers import SentenceTransformer, util
except Exception as e:
    print(f"sentence_transformers not available: {e}")
    print("Run: uv pip install --python /Users/nicholas/.sovereign/sem-venv/bin/python sentence-transformers")
    sys.exit(1)

# Module-level
CARE_FLOOR = 0.95
SEM_PYTHON = '/Users/nicholas/.sovereign/sem-venv/bin/python'

# Paths
MEM_PATH = Path.home() / '.sovereign/sovereign_memory.jsonl'
EMB_PATH = Path.home() / '.sovereign/memory_embeddings.npz'
EMB_HASH = Path.home() / '.sovereign/memory_embeddings.hash'
SIGIL_PATH = Path.home() / '.sovereign/memory_semantic.sigil.jsonl'

# Lazy model
_model = None
def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    return _model


def load_memories():
    if not MEM_PATH.exists():
        return []
    out = []
    for line in MEM_PATH.read_text().splitlines():
        if line.strip():
            out.append(json.loads(line))
    return out


def load_embeddings(memories):
    """Load cached embeddings or compute. Regenerate if memory count changes."""
    if EMB_PATH.exists() and EMB_HASH.exists():
        cached_hash = EMB_HASH.read_text().strip()
        current_hash = hashlib.md5(
            json.dumps([m.get('content', '') for m in memories]).encode()
        ).hexdigest()
        if cached_hash == current_hash:
            import numpy as np
            return np.load(str(EMB_PATH))['embeddings']
    return compute_embeddings(memories)


def compute_embeddings(memories):
    """Compute and cache embeddings."""
    import numpy as np
    model = get_model()
    contents = [m.get('content', '')[:500] for m in memories]
    print(f"Computing embeddings for {len(contents)} memories...")
    t0 = time.time()
    embeddings = model.encode(contents, show_progress_bar=False)
    dt = time.time() - t0
    print(f"  Computed in {dt:.2f}s ({len(contents)/dt:.0f} emb/s)")

    np.savez_compressed(str(EMB_PATH), embeddings=embeddings)
    EMB_HASH.write_text(hashlib.md5(
        json.dumps([m.get('content', '') for m in memories]).encode()
    ).hexdigest())
    print(f"  Cached to {EMB_PATH}")
    return embeddings


def sigil_emit(hop):
    chain = []
    if SIGIL_PATH.exists():
        for l in SIGIL_PATH.read_text().splitlines():
            if l.strip():
                chain.append(json.loads(l))
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {**hop, 'prev_hash': prev}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    signed = {**payload, 'digest': digest, 'ts': datetime.now(timezone.utc).isoformat()}
    chain.append(signed)
    with SIGIL_PATH.open('a') as f:
        f.write(json.dumps(signed) + '\n')
    return digest


def recall(query, k=5, threshold=0.25):
    """Semantic recall. Returns top-k memories above threshold."""
    memories = load_memories()
    if not memories:
        return []
    embeddings = load_embeddings(memories)
    model = get_model()
    qe = model.encode(query)
    scores = util.cos_sim(qe, embeddings)[0].numpy()
    import numpy as np
    above = [(float(s), i, memories[i]) for i, s in enumerate(scores) if s >= threshold]
    above.sort(key=lambda x: -x[0])
    sigil_emit({
        'hop': 'RECALL',
        'query': query[:100],
        'top_k_scores': [round(s, 4) for s, _, _ in above[:k]],
        'n_above_threshold': len(above),
        'care_floor': CARE_FLOOR,
    })
    return above[:k]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--recall', type=str, help='Query string')
    parser.add_argument('--k', type=int, default=5, help='Number of results')
    parser.add_argument('--threshold', type=float, default=0.20)
    parser.add_argument('--rebuild', action='store_true', help='Force rebuild embeddings')
    args = parser.parse_args()

    print("=" * 70)
    print("SOVEREIGN MIST 12 PILLARS SOVEREIGN MIST 12 Pillars SOVEREIGNTY — semantic retrieval")
    print("=" * 70)
    print()

    if args.rebuild and EMB_PATH.exists():
        EMB_PATH.unlink()
        EMB_HASH.unlink() if EMB_HASH.exists() else None
        print("Embeddings cache cleared.")

    memories = load_memories()
    print(f"Memory count: {len(memories)}")

    if args.recall:
        results = recall(args.recall, k=args.k, threshold=args.threshold)
        print(f"\nQuery: '{args.recall}'")
        print(f"Top {len(results)} matches (threshold {args.threshold}):")
        for score, i, m in results:
            content = m.get('content', '')[:200].replace('\n', ' ')
            tags = m.get('tags', [])
            print(f"  [{score:.4f}] {content}...")
            if tags:
                print(f"          tags: {tags}")
        return

    # Interactive mode
    print("\nInteractive mode. Type a query (or 'q' to quit):")
    while True:
        q = input("> ").strip()
        if q.lower() == 'q':
            break
        if not q:
            continue
        results = recall(q, k=args.k, threshold=args.threshold)
        if not results:
            print(f"  (no matches above threshold {args.threshold})")
            continue
        for score, i, m in results:
            content = m.get('content', '')[:200].replace('\n', ' ')
            print(f"  [{score:.4f}] {content}...")
        print()


if __name__ == '__main__':
    main()
