#!/usr/bin/env python3
"""A buyer's-eye probe of the maintainer's own verification surfaces (spec 10.6 self-application).

The claim under test says verification costs nothing and needs no account. The reading a stranger
can take is the simplest one available: ask each published verification door with no credential of
any kind and write down what comes back. A 200 is service without an account. A 401, 402 or 403 is
not. Nothing else is inferred, and the word 'forever' is untouched by this or any other probe.

Keyless by construction: common.get() refuses to send an Authorization header at all.
"""
from __future__ import annotations

import json
import sys

try:
    from . import common as c
except ImportError:
    import common as c  # type: ignore

#: The verification surfaces the maintainer publishes, each named on a public page.
DOORS = [
    ('board totals', 'https://councilof.ai/api/gspc'),
    ('public signed root', 'https://councilof.ai/root.json'),
    ('signed card index', 'https://councilof.ai/signed/card_index.json'),
    ('living card registry', 'https://councilof.ai/api/cards'),
    ('estate state', 'https://councilof.ai/api/state'),
    ('corrections', 'https://councilof.ai/api/corrections'),
    ('claim-maintenance register', 'https://councilof.ai/api/claims/register'),
    ('claim-maintenance specification', 'https://councilof.ai/spec/claim-maintenance/v0.1/'),
]


def run(doors=DOORS) -> dict:
    rows = []
    for label, url in doors:
        r = c.get(url, timeout=45)
        rows.append({'door': label, 'url': url, 'status': r['status'],
                     'served_without_a_credential': r['status'] == 200,
                     'response_bytes': r['bytes'], 'response_sha256': r['sha256'],
                     'accessed_utc': r['accessed_utc'],
                     **({} if r['ok'] else {'reason': r['reason']})})
    answered = [x for x in rows if x['status'] is not None]
    if not answered:
        return {'state': 'UNMEASURED',
                'reason': 'no door answered at all from this host, so this run measured nothing'}
    served = [x for x in answered if x['served_without_a_credential']]
    gated = [x for x in answered if x['status'] in (401, 402, 403)]
    return {
        'state': 'CLAIM_MEASURED',
        'measured_at': c.now_iso(),
        'method': ('request each published verification surface once with no Authorization header, no cookie '
                   'and no account, and record the HTTP status returned. The fetcher refuses to send a '
                   'credential at all, so the probe cannot accidentally authenticate itself'),
        'window': 'one pass over the declared door list at measured_at',
        'denominator': {'doors_declared': len(doors), 'doors_that_answered': len(answered),
                        'doors_that_did_not_answer': len(rows) - len(answered)},
        'result': {'doors_declared': str(len(doors)), 'doors_answered': str(len(answered)),
                   'served_200_without_a_credential': str(len(served)),
                   'returned_401_402_or_403': str(len(gated)),
                   'gated_doors': [x['door'] for x in gated], 'n': len(answered)},
        'doors': rows,
        'does_not_prove': [
            "that verification will remain free, or free 'forever'. That part of the claim is about future "
            'action and no probe can reach it; it is unmeasured now and stays unmeasured',
            'that these are every verification surface. The list is declared here and a reader who names '
            'another door can re-run the same probe against it',
            'that a 200 response contains anything useful, correct or complete; this probe reads the status '
            'line and the response digest and nothing else',
            'that a door not reached is gated. A door that did not answer is unmeasured and is counted '
            'separately',
        ],
    }


if __name__ == '__main__':
    out = run()
    if len(sys.argv) > 1:
        open(sys.argv[1], 'w').write(json.dumps(c.json_roundtrip_stable(out), indent=1, ensure_ascii=False) + '\n')
    print(json.dumps(out.get('result', out), indent=1))
