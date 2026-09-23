#!/usr/bin/env python3
"""A counterexample log for a leadership or exclusivity claim, from the other parties' own pages.

'The leading X', 'the trusted leader in X', 'the #1 X', 'only we do X' are exclusivity claims.
An outsider has exactly one honest test available: a counterexample. If another organisation's
OWN published page carries a comparable claim in the same category, then the category contains
more than one such claim.

What this establishes, exactly: that the claim is not exclusive as published. What it does NOT
establish, and what this module never says: that anyone is wrong, that anyone is misleading, or
that any of these claims is better founded than any other. Superlatives of this kind are ordinary
marketing register, they are not defined terms, and several can be simultaneously reasonable
under different readings. This harness quotes, counts, and stops.

Method. For each other party in a declared set, fetch its own page keylessly, extract the VISIBLE
text by the published rule, and search for the declared patterns. Every hit is quoted from that
party's own bytes with its URL, access time and response digest. A party whose page cannot be
read is recorded as unread and removed from the denominator, never counted as an absence.
"""
from __future__ import annotations

import json
import re
import sys

try:
    from . import common as c
except ImportError:
    import common as c  # type: ignore

QUOTE = 260


def scan(url: str, patterns: list[str]) -> dict:
    r = c.get(url, timeout=60)
    src = c.source(r, 'the organisation\'s own page')
    if not r['ok']:
        return {'url': url, 'read': False, 'status': r['status'], 'reason': r['reason'], 'source': src}
    text = c.visible_text(r['body'])
    hits = []
    for p in patterns:
        m = re.search(p, text, re.I)
        if m:
            a = max(0, m.start() - QUOTE // 2)
            hits.append({'pattern': p, 'matched_text': m.group(0),
                         'quoted_from_their_page': ('...' if a else '') + text[a:m.end() + QUOTE // 2].strip() + '...'})
    return {'url': url, 'read': True, 'status': r['status'], 'page_sha256': r['sha256'],
            'accessed_utc': r['accessed_utc'], 'comparable_claim_found': bool(hits),
            'quotes': hits[:2], 'source': src}


def run(category: str, claimant: str, claimant_claim: str, others: dict[str, str],
        patterns: list[str]) -> dict:
    rows = {name: scan(url, patterns) for name, url in others.items()}
    read = {k: v for k, v in rows.items() if v['read']}
    unread = {k: {'status': v['status'], 'reason': v.get('reason')} for k, v in rows.items() if not v['read']}
    with_claim = {k: v for k, v in read.items() if v['comparable_claim_found']}
    if not read:
        return {'state': 'UNMEASURED',
                'reason': 'no other party\'s page in the declared set could be read from this host, so this '
                          'run compared nothing and concludes nothing',
                'parties_unread': unread}
    return {
        'state': 'CLAIM_MEASURED',
        'measured_at': c.now_iso(),
        'method': ('declare a category and a set of other organisations publishing in it; fetch each one\'s own '
                   'page keylessly; extract its VISIBLE text by the published rule; search for the declared '
                   'leadership/exclusivity patterns; quote every hit from that organisation\'s own bytes with '
                   'its URL, access time and response digest'),
        'window': 'each page as its own server rendered it at measured_at',
        'denominator': {
            'category_declared': category,
            'other_parties_declared': len(others),
            'other_parties_read': len(read),
            'other_parties_not_read': len(unread),
            'other_parties_publishing_a_comparable_claim': len(with_claim),
        },
        'result': {
            'claimant': claimant,
            'claimant_claim_verbatim': claimant_claim,
            'other_parties_publishing_a_comparable_claim': str(len(with_claim)),
            'of_parties_read': str(len(read)),
            'named': sorted(with_claim),
            'n': len(read),
        },
        'patterns_declared': patterns,
        'counterexamples': {k: {'url': v['url'], 'accessed_utc': v['accessed_utc'],
                                'page_sha256': v['page_sha256'], 'quotes': v['quotes']}
                            for k, v in sorted(with_claim.items())},
        'parties_read_without_a_comparable_claim': sorted(set(read) - set(with_claim)),
        'parties_unread': unread,
        'sources': [v['source'] for v in rows.values()],
        'does_not_prove': [
            'that the claimant\'s statement is wrong, overstated or made in bad faith. Nothing here is a '
            'statement about the claimant, and none may be read as one',
            'that the other organisations\' statements are better founded. They are quoted, not assessed',
            'that these terms have an agreed meaning. "Leading", "#1" and "only" are not defined in this '
            'category, and several of these statements can be simultaneously reasonable under different readings',
            'that the declared set is the category. It is this harness\'s declaration, published so a reader '
            'can re-run the same method with a different set',
            'that a party read without a comparable claim makes no such claim anywhere; only the named page '
            'was read',
        ],
    }


if __name__ == '__main__':
    print(json.dumps(run('test', 'x', 'y', {'a': sys.argv[1]}, [r'\\bleading\\b']), indent=1)[:1500])
