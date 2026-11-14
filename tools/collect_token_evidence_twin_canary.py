#!/usr/bin/env python3
"""Collect hash-pinned, public sources for the ETH/LINK/ONDO evidence canary.

No wallet, exchange, signing key, blockchain transaction, or publishing path is
used. A failed source is preserved as an explicit observation error.
"""
from __future__ import annotations

import hashlib
import json
import urllib.request
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

OUT = Path('measurement/registers/2026-09-19/token-evidence-twin-source-observations.json')
RAW_DIR = Path('measurement/registers/2026-09-19/token-evidence-raw')
UA = 'CSOAI-evidence-twin/0.1 (+https://councilof.ai)'
SOURCES: dict[str, list[dict[str, Any]]] = {
    'token:ethereum': [
        {'kind': 'documentation', 'url': 'https://ethereum.org/en/developers/docs/'},
        {'kind': 'chain_id', 'rpc': 'https://ethereum.publicnode.com', 'method': 'eth_chainId', 'params': []},
    ],
    'token:link': [
        {'kind': 'documentation', 'url': 'https://docs.chain.link/'},
        {'kind': 'contract_code', 'rpc': 'https://ethereum.publicnode.com', 'method': 'eth_getCode', 'params': ['0x514910771AF9Ca656af840dff83E8264EcF986CA', 'latest']},
    ],
    'token:ondo': [
        {'kind': 'documentation', 'url': 'https://docs.ondo.finance/'},
    ],
}


def fetch_url(url: str) -> tuple[bytes, str | None]:
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': '*/*'})
    with urllib.request.urlopen(req, timeout=30) as response:  # nosec B310 fixed HTTPS sources
        return response.read(), response.headers.get('content-type')


def rpc_call(source: dict[str, Any]) -> bytes:
    body = json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': source['method'], 'params': source['params']}, separators=(',', ':')).encode()
    req = urllib.request.Request(source['rpc'], data=body, headers={'User-Agent': UA, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=30) as response:  # nosec B310 fixed HTTPS source
        return response.read()


def observe(subject: str, source: dict[str, Any]) -> dict[str, Any]:
    retrieved_at = datetime.now(UTC).isoformat()
    try:
        if 'url' in source:
            raw, content_type = fetch_url(source['url'])
            locator = source['url']
        else:
            raw, content_type = rpc_call(source), 'application/json'
            locator = source['rpc']
        digest = hashlib.sha256(raw).hexdigest()
        RAW_DIR.mkdir(parents=True, exist_ok=True)
        raw_path = RAW_DIR / f'{digest}.bin'
        raw_path.write_bytes(raw)
        return {
            'subject_id': subject, 'kind': source['kind'], 'locator': locator,
            'retrieved_at': retrieved_at, 'bytes': len(raw), 'sha256': digest,
            'raw_path': str(raw_path),
            'content_type': content_type, 'state': 'OBSERVED_NOT_YET_ACCEPTED',
        }
    except Exception as exc:
        return {
            'subject_id': subject, 'kind': source['kind'], 'locator': source.get('url', source.get('rpc')),
            'retrieved_at': retrieved_at, 'state': 'UNCHECKABLE', 'error_type': type(exc).__name__,
        }


def main() -> int:
    rows = [observe(subject, source) for subject, sources in SOURCES.items() for source in sources]
    doc = {
        'schema': 'csoai.token-evidence-source-observations/0.1',
        'execution': 'read_only_public_sources',
        'signing': 'disabled', 'publication': 'disabled', 'observations': rows,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    print(json.dumps(doc, sort_keys=True))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
