#!/usr/bin/env python3
"""Collect hash-pinned, public, primary Chainlink sources for the oracle-boundary
evidence pack (Goal 2, 2026-09-20 register).

Read-only. No wallet, exchange, signing key, blockchain transaction, or
publishing path is used. Every failed source is preserved as an explicit
observation with state UNCHECKABLE; a failure is never dropped and never
promoted. Raw bytes are content-addressed into chainlink-oracle-raw/.
"""
from __future__ import annotations

import hashlib
import json
import urllib.request
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

REG_DIR = Path('measurement/registers/2026-09-20')
OUT = REG_DIR / 'chainlink-oracle-source-observations.json'
RAW_DIR = REG_DIR / 'chainlink-oracle-raw'
UA = 'CSOAI-oracle-evidence/0.1 (+https://councilof.ai)'
RPC = 'https://ethereum.publicnode.com'
# ETH/USD aggregator, Ethereum mainnet. Identity must be confirmed by
# cross-checking the frozen docs registry page against description() readback;
# the address is not trusted from this script alone.
ETH_USD_AGGREGATOR = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'

SOURCES: dict[str, list[dict[str, Any]]] = {
    'feed:eth-usd-ethereum-mainnet': [
        {'kind': 'feed_registry_doc', 'url': 'https://docs.chain.link/data-feeds/price-feeds/addresses?network=ethereum'},
        {'kind': 'feed_ui_page', 'url': 'https://data.chain.link/feeds/ethereum/mainnet/eth-usd'},
        {'kind': 'feed_identity_description', 'rpc': RPC, 'method': 'eth_call',
         'params': [{'to': ETH_USD_AGGREGATOR, 'data': '0x7284e416'}, 'latest']},
        {'kind': 'feed_decimals', 'rpc': RPC, 'method': 'eth_call',
         'params': [{'to': ETH_USD_AGGREGATOR, 'data': '0x313ce567'}, 'latest']},
        {'kind': 'feed_latest_round', 'rpc': RPC, 'method': 'eth_call',
         'params': [{'to': ETH_USD_AGGREGATOR, 'data': '0xfeaf968c'}, 'latest']},
        {'kind': 'chain_id', 'rpc': RPC, 'method': 'eth_chainId', 'params': []},
    ],
    'org:chainlink-docs': [
        {'kind': 'documentation_concepts', 'url': 'https://docs.chain.link/data-feeds'},
        {'kind': 'documentation_por', 'url': 'https://docs.chain.link/data-feeds/proof-of-reserves'},
    ],
    'org:chainlink-repo': [
        {'kind': 'repo_metadata', 'url': 'https://api.github.com/repos/smartcontractkit/chainlink'},
    ],
    'org:chainlink-status': [
        {'kind': 'status_page', 'url': 'https://status.chain.link/'},
    ],
}


def fetch_url(url: str) -> tuple[bytes, str | None]:
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': '*/*'})
    with urllib.request.urlopen(req, timeout=60) as response:  # nosec B310 fixed HTTPS sources
        return response.read(), response.headers.get('content-type')


def rpc_call(source: dict[str, Any]) -> bytes:
    body = json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': source['method'], 'params': source['params']},
                      separators=(',', ':')).encode()
    req = urllib.request.Request(source['rpc'], data=body,
                                 headers={'User-Agent': UA, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=30) as response:  # nosec B310 fixed HTTPS source
        return response.read()


def observe(subject: str, source: dict[str, Any]) -> dict[str, Any]:
    retrieved_at = datetime.now(UTC).isoformat()
    locator = source.get('url', source.get('rpc'))
    try:
        if 'url' in source:
            raw, content_type = fetch_url(source['url'])
        else:
            raw, content_type = rpc_call(source), 'application/json'
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
            'subject_id': subject, 'kind': source['kind'], 'locator': locator,
            'retrieved_at': retrieved_at, 'state': 'UNCHECKABLE', 'error_type': type(exc).__name__,
        }


def main() -> int:
    rows = [observe(subject, source) for subject, sources in SOURCES.items() for source in sources]
    doc = {
        'schema': 'csoai.chainlink-oracle-source-observations/0.1',
        'execution': 'read_only_public_sources',
        'signing': 'disabled', 'publication': 'disabled', 'observations': rows,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    ok = sum(1 for r in rows if r['state'] == 'OBSERVED_NOT_YET_ACCEPTED')
    print(f'observations={len(rows)} observed={ok} uncheckable={len(rows) - ok}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
