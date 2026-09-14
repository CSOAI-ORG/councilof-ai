#!/usr/bin/env python3
"""Compare observations from dry settlement censuses, never infer delivery/conformance."""
import argparse
import json
from pathlib import Path


def load(path):
    rows = {}
    for n, line in enumerate(Path(path).read_text().splitlines(), 1):
        if not line.strip():
            continue
        row = json.loads(line)
        if (row.get('mode') != 'DRY' or row.get('status') not in ('DRY', 'NO_CHALLENGE')
                or row.get('settle_tx') or not row.get('host') or not row.get('url')
                or not row.get('observed_at')):
            raise ValueError(f'{path}:{n}: not a valid dry observation')
        key = (row['host'], row['url'])
        if key in rows:
            raise ValueError(f'{path}:{n}: duplicate subject URL')
        rows[key] = row
    if not rows:
        raise ValueError(f'{path}: empty census')
    return rows


def compare(before, after):
    a, b = load(before), load(after)
    shared = sorted(a.keys() & b.keys())
    fields = ('status', 'challenge_units', 'pay_to', 'x402_version', 'probe_status', 'reason')
    changes = []
    for key in shared:
        delta = {f: {'from': a[key].get(f), 'to': b[key].get(f)}
                 for f in fields if a[key].get(f) != b[key].get(f)}
        if delta:
            changes.append({'host': key[0], 'url': key[1], 'changes': delta})
    return {'schema': 'csoai.x402-dry-census-diff/1',
            'from': str(before), 'to': str(after),
            'before_count': len(a), 'after_count': len(b), 'overlap_count': len(shared),
            'added': [{'host': h, 'url': u} for h, u in sorted(b.keys() - a.keys())],
            'not_observed_this_round': [{'host': h, 'url': u} for h, u in sorted(a.keys() - b.keys())],
            'changes': changes,
            'scope': 'Observed challenge/status changes for sampled URLs only. No payment, delivery, conformance or host intent is established; missing observations do not prove disappearance.'}


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--from', dest='before', required=True)
    p.add_argument('--to', dest='after', required=True)
    p.add_argument('--out', required=True)
    args = p.parse_args()
    result = compare(args.before, args.after)
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out).write_text(json.dumps(result, indent=2) + '\n')
