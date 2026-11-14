#!/usr/bin/env python3
"""GAP-08/GAP-09 fourth pass: pin the official app surface (app.ondo.finance).

app.ondo.finance is on Ondo's official-domains list (pinned first-pass source
docs-official-domains). Its served HTML carries the UI strings that confirm
which attestation report series exist; the report URLs themselves are loaded
at runtime and are NOT in the served bytes — that fact is the observation.

Separate manifest; never overwrites earlier passes. Read-only.
"""
from __future__ import annotations

import hashlib
import json
import urllib.request
from datetime import UTC, datetime
from pathlib import Path

REGISTER = Path('measurement/registers/2026-09-20')
OUT = REGISTER / 'ondo-app-manifest.json'
RAW_DIR = REGISTER / 'ondo-evidence-raw'
UA = 'CSOAI-ondo-evidence-intake/0.4 (+https://councilof.ai)'

SOURCES = [
    {'source_id': 'app-root', 'kind': 'official-app-shell',
     'url': 'https://app.ondo.finance/'},
]


def main() -> int:
    rows = []
    for source in SOURCES:
        retrieved_at = datetime.now(UTC).isoformat()
        base = {'subject_id': 'issuer:ondo', 'source_id': source['source_id'],
                'kind': source['kind'], 'retrieved_at': retrieved_at, 'locator': source['url']}
        try:
            req = urllib.request.Request(source['url'], headers={'User-Agent': UA, 'Accept': '*/*'})
            with urllib.request.urlopen(req, timeout=45) as r:  # nosec B310 fixed HTTPS source
                raw, content_type = r.read(), r.headers.get('content-type')
            digest = hashlib.sha256(raw).hexdigest()
            RAW_DIR.mkdir(parents=True, exist_ok=True)
            raw_path = RAW_DIR / f'{digest}.bin'
            raw_path.write_bytes(raw)
            base.update({'bytes': len(raw), 'sha256': digest, 'raw_path': str(raw_path),
                         'content_type': content_type, 'state': 'OBSERVED_NOT_YET_ACCEPTED'})
        except Exception as exc:
            base.update({'state': 'UNCHECKABLE', 'error_type': type(exc).__name__})
        rows.append(base)
    doc = {
        'schema': 'csoai.ondo-app-manifest/0.1',
        'as_of': '2026-09-20',
        'subject_id': 'issuer:ondo',
        'gap_ref': ['GAP-08', 'GAP-09'],
        'provenance_note': 'app.ondo.finance is confirmed official via the pinned official-domains page. Served bytes are a Next.js shell: UI strings are present, runtime-loaded URLs are not.',
        'execution': 'read_only_public_sources',
        'no_transactions': True,
        'signing': 'disabled',
        'publication': 'disabled',
        'sources': rows,
    }
    OUT.write_text(json.dumps(doc, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    print(json.dumps({r['source_id']: r['state'] for r in rows}, sort_keys=True))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
