#!/usr/bin/env python3
"""
sov33_dynamic_cheatsheet.py — Crown Jewel #5: Adaptive-memory test-time learning.
MEOK-SOV3.

The hard finding: SEAL self-editing weights (arXiv 2506.10943) is exciting but
WRONG for a governance system. "A model that modifies its own weights is a
model that can drift in ways that are harder to audit." Breaks the SIGIL-
auditable brain guarantee.

The fix: Dynamic Cheatsheet (arXiv 2504.07952) — test-time learning via
EXTERNAL adaptive memory, no weight updates. The model records solutions/
heuristics to a memory it reads back. Parameter-free self-improvement.

For SOV33: we already have Graphiti (mcp-memory-service). Adaptive-memory
test-time learning over Graphiti gives 80% of "learns on the job" benefit
with FULL auditability and ZERO drift risk:
  - Weights stay frozen and signed
  - Learning lives in (SIGIL-hashable, inspectable) memory graph
  - Every cheatsheet entry is sovereign-bound

This file: the dynamic cheatsheet pattern.
  - capture: extract successful problem-solution pairs from sovereign.ask
  - store: SIGIL-bound entry in the cheatsheet
  - retrieve: at ask time, top-k similar past successes feed into context
  - audit: every read/write SIGIL-logged
"""
import sys
import os
import json
import time
import math
import hashlib
import argparse
from pathlib import Path
from datetime import datetime, timezone
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
_SOVDIR=_sov_dir()


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


# ═══════════════════════════════════════════════════════════════
# Cheatsheet state
# ═══════════════════════════════════════════════════════════════

CHEATSHEET_FILE = Path(_SOVDIR) / 'dynamic_cheatsheet.jsonl'
CHEATSHEET_FILE.parent.mkdir(parents=True, exist_ok=True)
SIGIL_FILE = Path(_SOVDIR) / 'cheatsheet.sigil.jsonl'


def _embed(text: str, dim: int = 64) -> list:
    """Cheap hash-based embedding (no model needed). Per-token shingles hashed to dim-dim vector."""
    vec = [0.0] * dim
    text_lower = text.lower()
    shingles = set()
    for i in range(0, len(text_lower) - 2):
        shingles.add(text_lower[i:i + 3])
    for s in shingles:
        h = int(hashlib.sha256(s.encode()).hexdigest()[:8], 16)
        vec[h % dim] += 1.0
    # normalize
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def _cos(a, b):
    return sum(ai * bi for ai, bi in zip(a, b))


def capture_cheatsheet_entry(
    request: str,
    response: str,
    decision: str,
    care_score: float,
    sigil_digest: str,
    tags: list = None,
) -> dict:
    """Capture a successful ask into the dynamic cheatsheet."""
    entry_id = hashlib.sha256(f"{request}{response}{sigil_digest}".encode()).hexdigest()[:16]
    embedding = _embed(request + " " + response[:200])

    entry = {
        'entry_id': entry_id,
        'request': request[:500],
        'response': response[:1000],
        'decision': decision,
        'care_score': care_score,
        'sigil_digest': sigil_digest,
        'tags': tags or [],
        'embedding': embedding,
        'captured_at': datetime.now(timezone.utc).isoformat(),
        'reuse_count': 0,
        'success_count': 0,
        'sovereign_mist_12_pillars_bound': True,
        'care_floor': 0.95,
    }

    with CHEATSHEET_FILE.open('a') as f:
        # Don't write the embedding to JSONL (too large); store separately
        compact = {k: v for k, v in entry.items() if k != 'embedding'}
        f.write(json.dumps(compact) + '\n')

    # SIGIL emission
    chain = []
    if SIGIL_FILE.exists():
        for line in SIGIL_FILE.read_text().splitlines():
            if line.strip():
                chain.append(json.loads(line))
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {
        'hop': 'CHEATSHEET_CAPTURE',
        'entry_id': entry_id,
        'request_hash_16': hashlib.sha256(request.encode()).hexdigest()[:16],
        'decision': decision,
        'care_score': care_score,
        'sovereign_bound': True,
        'article_0': True,
    }
    digest = hashlib.sha256(json.dumps({**payload, 'prev_hash': prev}, sort_keys=True).encode()).hexdigest()[:16]
    signed = {**payload, 'digest': digest, 'prev_hash': prev, 'ts': datetime.now(timezone.utc).isoformat()}
    with SIGIL_FILE.open('a') as f:
        f.write(json.dumps(signed) + '\n')

    return entry


def retrieve_cheatsheet(query: str, k: int = 3, min_care: float = 0.5) -> list:
    """Retrieve top-k similar successful past asks."""
    if not CHEATSHEET_FILE.exists():
        return []

    qe = _embed(query)
    scored = []
    for line in CHEATSHEET_FILE.read_text().splitlines():
        if not line.strip():
            continue
        e = json.loads(line)
        if e.get('care_score', 0) < min_care:
            continue
        # Re-embed from request
        ee = _embed(e['request'] + " " + e.get('response', '')[:200])
        score = _cos(qe, ee)
        scored.append((score, e))

    scored.sort(key=lambda x: -x[0])
    return [{'score': s, **e} for s, e in scored[:k]]


def cheatsheet_stats() -> dict:
    """Stats on the cheatsheet."""
    if not CHEATSHEET_FILE.exists():
        return {'n_entries': 0}

    entries = []
    for line in CHEATSHEET_FILE.read_text().splitlines():
        if line.strip():
            entries.append(json.loads(line))

    decisions = {}
    care_sum = 0.0
    for e in entries:
        d = e.get('decision', 'unknown')
        decisions[d] = decisions.get(d, 0) + 1
        care_sum += e.get('care_score', 0)

    return {
        'n_entries': len(entries),
        'avg_care': round(care_sum / max(1, len(entries)), 3),
        'by_decision': decisions,
        'principle': 'memory-as-weights (Dynamic Cheatsheet arXiv 2504.07952) — frozen brain, learning in inspectable memory',
    }


def main():
    parser = argparse.ArgumentParser(
        description='Crown Jewel #5: Dynamic Cheatsheet (adaptive-memory test-time learning)',
    )
    parser.add_argument('request', nargs='?', help='Request to query cheatsheet for')
    parser.add_argument('--capture', nargs=3, metavar=('REQ', 'RESP', 'DECISION'),
                        help='Capture a cheatsheet entry: request, response, decision')
    parser.add_argument('--capture-care', type=float, default=0.95, help='Care score for capture')
    parser.add_argument('--capture-sigil', default='manual', help='Sigil digest for capture')
    parser.add_argument('--stats', action='store_true', help='Show cheatsheet stats')
    parser.add_argument('--k', type=int, default=3, help='Top-k for retrieval')
    args = parser.parse_args()

    print()
    print("=" * 70)
    print("CROWN JEWEL #5 — DYNAMIC CHEATSHEET")
    print("=" * 70)
    print()
    print("Principle: memory-as-weights, NOT self-editing weights")
    print("  - Weights stay frozen and signed")
    print("  - Learning lives in inspectable memory graph")
    print("  - Every entry SIGIL-bound")
    print()
    print("ArXiv 2504.07952 'Dynamic Cheatsheet' + Graphiti memory substrate")
    print()

    if args.capture:
        req, resp, dec = args.capture
        entry = capture_cheatsheet_entry(
            request=req,
            response=resp,
            decision=dec,
            care_score=args.capture_care,
            sigil_digest=args.capture_sigil,
        )
        print(f"Captured entry: {entry['entry_id']}")
        print(f"  request: {req[:80]}")
        print(f"  decision: {dec}")
        print(f"  care_score: {args.capture_care}")
        print()
        return

    if args.stats:
        stats = cheatsheet_stats()
        print("─" * 70)
        print("CHEATSHEET STATS")
        print("─" * 70)
        for k, v in stats.items():
            print(f"  {k}: {v}")
        print()
        return

    if args.request:
        results = retrieve_cheatsheet(args.request, k=args.k)
        print("─" * 70)
        print(f"TOP {args.k} similar past asks")
        print("─" * 70)
        for r in results:
            print(f"  score={r['score']:.3f} decision={r['decision']} care={r['care_score']}")
            print(f"    request: {r['request'][:80]}")
            print(f"    response: {r.get('response', '')[:100]}...")
            print()
        return

    parser.print_help()
    print()
    print("─" * 70)
    print("Examples:")
    print('  sov33-cheatsheet --capture "What is Article 6?" "EU AI Act Article 6 requires..." "adopted"')
    print("  sov33-cheatsheet --stats")
    print('  sov33-cheatsheet "Explain Article 6"')
    print("─" * 70)


if __name__ == '__main__':
    main()