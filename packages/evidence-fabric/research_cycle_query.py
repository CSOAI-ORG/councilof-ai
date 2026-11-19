#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Read-only lexical retrieval over a verified existing research cycle.

The caller supplies an event-visibility callback, never a policy from source text.
This adapter does not authenticate callers, grant authority, create events,
collect sources, dispatch tools, pay, sign, or install a scheduler.
"""
from __future__ import annotations
import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import re
import sys
from typing import Callable, Iterable
import research_cycle as C

STATES = frozenset({'CONSISTENT', 'DIVERGENT', 'PARTIAL', 'UNMEASURED',
                    'UNCHECKABLE', 'NOT_DISCRIMINATING'})
TOKEN = re.compile(r'[a-z0-9]+')
EVENT_ID = re.compile(r'sha256:[0-9a-f]{64}')
MAX_QUERY_BYTES = 4096


class QueryError(ValueError):
    pass


def verified_snapshot(directory: str | Path, expected: str) -> tuple[dict, dict]:
    """Verify the exact immutable byte snapshot that will be searched.

    Reuse the canonical receiver/rederiver rather than trusting a hash alone or
    importing any code from the received cycle. No external collector is called.
    """
    manifest = C.read_regular(directory, 'manifest.json').decode('utf-8')
    payload = {name: C.read_regular(directory, name) for name in sorted(C.FILES)}
    packet = C.download_packet(payload, manifest)
    result = C.verify_packet(C.encoded(packet), expected)
    return packet, result


def visibility(provider: Callable[[], Iterable[str]], known: set[str]) -> frozenset[str]:
    if not callable(provider):
        raise QueryError('an explicit caller-owned visibility callback is required')
    raw = provider()
    if not isinstance(raw, (list, tuple, set, frozenset)):
        raise QueryError('visibility must be a bounded event-ID collection')
    if len(raw) > 2000 or any(not isinstance(x, str) or not EVENT_ID.fullmatch(x) for x in raw):
        raise QueryError('invalid visibility event IDs')
    selected = frozenset(raw)
    if len(selected) != len(raw) or not selected <= known:
        raise QueryError('duplicate or unknown visibility event IDs')
    return selected


def rank(events: dict[str, dict], allowed: frozenset[str], query: str, limit: int) -> list[str]:
    """BM25 k1=1.2/b=0.75; all statistics concern only the visible filtered set."""
    q = set(TOKEN.findall(query.lower()))
    if not q or not allowed:
        return []
    counts = {eid: Counter(TOKEN.findall(C.E.jcs(events[eid]).decode('utf-8').lower()))
              for eid in sorted(allowed)}
    lengths = {eid: sum(c.values()) for eid, c in counts.items()}
    postings = defaultdict(set)
    for eid, c in counts.items():
        for term in c:
            postings[term].add(eid)
    candidates = set().union(*(postings.get(t, set()) for t in q))
    n = len(allowed)
    avg = sum(lengths.values()) / n
    scores = []
    for eid in candidates:
        score = 0.0
        for term in sorted(q):
            tf = counts[eid].get(term, 0)
            if tf:
                df = len(postings.get(term, ()))
                idf = math.log(1 + (n - df + 0.5) / (df + 0.5))
                score += idf * tf * 2.2 / (tf + 1.2 * (0.25 + 0.75 * lengths[eid] / max(avg, 1)))
        scores.append((-score, eid))
    return [eid for _, eid in sorted(scores)[:limit]]


def query_cycle(directory: str | Path, expected: str, query: str,
                visible_event_ids: Callable[[], Iterable[str]], *, limit: int = 3,
                states: Iterable[str] | None = None, before_delivery: Callable | None = None) -> dict:
    if not isinstance(query, str) or len(query.encode('utf-8')) > MAX_QUERY_BYTES:
        raise QueryError('query must be UTF-8 text of at most 4096 bytes')
    if type(limit) is not int or not 1 <= limit <= 20:
        raise QueryError('limit must be an integer from 1 to 20')
    if states is None:
        selected_states = STATES
    else:
        if not isinstance(states, (list, tuple, set, frozenset)) or not states:
            raise QueryError('states must be a nonempty collection')
        if any(not isinstance(s, str) for s in states):
            raise QueryError('states must contain strings')
        selected_states = frozenset(states)
        if not selected_states <= STATES:
            raise QueryError('unsupported evidence state')
    packet, verification = verified_snapshot(directory, expected)
    rows = [C.parse(line.encode('utf-8')) for line in packet['files']['events.jsonl'].splitlines()]
    events = {row['event_id']: row for row in rows}
    if len(events) != len(rows):
        raise QueryError('duplicate native event identity')
    scope = visibility(visible_event_ids, set(events))
    allowed = frozenset(eid for eid in scope if events[eid]['state'] in selected_states)
    ids = rank(events, allowed, query, limit)
    if before_delivery is not None:
        before_delivery()
    if visibility(visible_event_ids, set(events)) != scope:
        raise QueryError('visibility changed before delivery')
    latest, _ = verified_snapshot(directory, expected)
    if latest != packet:
        raise QueryError('cycle changed before delivery')
    # Check scope once more after source verification, which can take time.
    if visibility(visible_event_ids, set(events)) != scope:
        raise QueryError('visibility changed before delivery')
    binding = C.parse(packet['files']['binding.json'].encode('utf-8'))
    return {
        'state': 'RETRIEVED_REFERENCE' if ids else 'NO_VISIBLE_MATCH',
        'cycle_id': verification['cycle_id'], 'manifest_sha256': expected,
        'cycle_as_of': binding['as_of'],
        'queried_at': datetime.now(timezone.utc).isoformat(),
        'retrieval_method': 'eligible-first-bm25-k1=1.2-b=0.75',
        'records': [{'rank': i + 1, 'event': events[eid]} for i, eid in enumerate(ids)],
        'producer_authenticated': False, 'caller_authenticated_by_adapter': False,
        'current_task_applicability': 'NOT_ASSESSED',
        'grants_authority': False, 'execution_allowed': False,
        'limitations': [
            'Ranking never changes the native event state or establishes claim truth.',
            'The caller must supply current visibility from its existing authority.',
            'The local CLI scope file is selection, not authentication or authorization.',
            'Cycle time is retained; retrieval does not refresh source observations.',
            'Rechecks do not provide atomic distributed revocation after return.',
            'No public measurement admission, payment or execution is performed.',
        ],
    }


def scope_file(path: Path) -> list[str]:
    # Use the same bounded, no-symlink/no-special-file reader with a fixed basename.
    # A scoped file can have any basename; read its bytes with equivalent local guards.
    import os
    import stat
    flags = os.O_RDONLY | os.O_NONBLOCK | getattr(os, 'O_NOFOLLOW', 0)
    fd = os.open(path, flags)
    with os.fdopen(fd, 'rb') as stream:
        info = os.fstat(stream.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_size > 200_000:
            raise QueryError('bounded regular scope file required')
        raw = stream.read(200_001)
    if len(raw) > 200_000:
        raise QueryError('scope file exceeds byte limit')
    value = C.parse(raw)
    if not isinstance(value, list):
        raise QueryError('scope file must contain an event-ID list')
    return value


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('directory')
    p.add_argument('--expected-manifest', required=True)
    p.add_argument('--allow-events', type=Path, required=True,
                   help='reviewed local event-ID list; not an authentication credential')
    p.add_argument('--query', required=True)
    p.add_argument('--limit', type=int, default=3)
    p.add_argument('--state', action='append', dest='states')
    a = p.parse_args()
    try:
        result = query_cycle(a.directory, a.expected_manifest, a.query,
                             lambda: scope_file(a.allow_events), limit=a.limit, states=a.states)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except (ValueError, KeyError, TypeError, OSError, UnicodeError):
        # Do not echo private paths, source text or arbitrary provider exception text.
        print(json.dumps({'state': 'REJECTED', 'reason': 'QUERY_OR_SOURCE_NOT_QUALIFIED',
                          'grants_authority': False}), file=sys.stderr)
        return 2


if __name__ == '__main__':
    raise SystemExit(main())
