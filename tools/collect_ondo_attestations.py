#!/usr/bin/env python3
"""GAP-01 follow-up: hash-pin ONDO attestation distribution surfaces.

Second collection pass. Does NOT touch the frozen 2026-09-20 manifest; writes a
separate ondo-attestation-manifest.json in the same register. Read-only: no
wallet, transaction, signing, or publishing. Folder landing pages are pinned as
served; if the landing page is a JavaScript shell with no extractable file
list, that fact is recorded as the observation, not silently worked around.
"""
from __future__ import annotations

import hashlib
import json
import urllib.request
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

REGISTER = Path('measurement/registers/2026-09-20')
OUT = REGISTER / 'ondo-attestation-manifest.json'
RAW_DIR = REGISTER / 'ondo-evidence-raw'
UA = 'CSOAI-ondo-evidence-intake/0.2 (+https://councilof.ai)'
SUBJECT = 'issuer:ondo'

# Every locator below was extracted from bytes pinned in the first pass
# (site-usdy raw: two Dropbox folder hrefs; docs OUSG trust-and-transparency
# page, itself linked from site-ousg: Google Drive folder href).
SOURCES: list[dict[str, Any]] = [
    {'source_id': 'docs-ousg-trust-transparency', 'kind': 'attestation-docs',
     'url': 'https://docs.ondo.finance/qualified-access-products/ousg/trust-and-transparency'},
    {'source_id': 'docs-stocks-trust-transparency', 'kind': 'attestation-docs',
     'url': 'https://docs.ondo.finance/ondo-stocks/trust-and-transparency'},
    {'source_id': 'dropbox-usdy-daily', 'kind': 'attestation-folder-landing',
     'url': 'https://www.dropbox.com/scl/fo/375wdvar3rbc7o23nxsgp/AOFY8jhpENaNx9WAw-WPnbY?rlkey=4icqn1z9bez725wywr30fx52a&st=bsxeh8j5&dl=0'},
    {'source_id': 'dropbox-usdy-monthly', 'kind': 'attestation-folder-landing',
     'url': 'https://www.dropbox.com/scl/fo/fk5t99zyihshuak3u1u9v/AMYiYSUwvoL6osa2FX_G_M8?rlkey=0ttmb4ifhdg4ebvhbh8aa3juc&st=fyoof4cu&dl=0'},
    {'source_id': 'gdrive-ousg-nav-financials', 'kind': 'attestation-folder-landing',
     'url': 'https://drive.google.com/drive/folders/1Ti8IzoXTibM3B2RWxystT38ISrPH-rRP?usp=sharing'},
]


def fetch_url(url: str) -> tuple[bytes, str | None, str]:
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': '*/*'})
    with urllib.request.urlopen(req, timeout=45) as response:  # nosec B310 fixed HTTPS sources
        return response.read(), response.headers.get('content-type'), response.geturl()


def observe(source: dict[str, Any]) -> dict[str, Any]:
    retrieved_at = datetime.now(UTC).isoformat()
    base: dict[str, Any] = {
        'subject_id': SUBJECT, 'source_id': source['source_id'], 'kind': source['kind'],
        'retrieved_at': retrieved_at, 'locator': source['url'],
    }
    try:
        raw, content_type, final_url = fetch_url(source['url'])
        digest = hashlib.sha256(raw).hexdigest()
        RAW_DIR.mkdir(parents=True, exist_ok=True)
        raw_path = RAW_DIR / f'{digest}.bin'
        raw_path.write_bytes(raw)
        base.update({
            'bytes': len(raw), 'sha256': digest, 'raw_path': str(raw_path),
            'content_type': content_type, 'final_url_after_redirects': final_url,
            'state': 'OBSERVED_NOT_YET_ACCEPTED',
        })
        return base
    except Exception as exc:
        base.update({'state': 'UNCHECKABLE', 'error_type': type(exc).__name__})
        return base


def main() -> int:
    rows = [observe(source) for source in SOURCES]
    doc = {
        'schema': 'csoai.ondo-attestation-manifest/0.1',
        'as_of': '2026-09-20',
        'subject_id': SUBJECT,
        'gap_ref': 'GAP-01',
        'provenance_note': 'All locators were extracted from first-pass pinned bytes. Dropbox and Google Drive are third-party hosts; content served from them is THIRD_PARTY_ATTESTATION class, and host possession of bytes is not attestor authorship.',
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
