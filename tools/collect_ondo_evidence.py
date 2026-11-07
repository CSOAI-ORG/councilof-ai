#!/usr/bin/env python3
"""Collect hash-pinned, public, primary ONDO sources for the CSOAI evidence-intake pack.

Read-only by construction: no wallet, exchange, signing key, blockchain
transaction, token transfer, or publishing path is used. RPC calls are
eth_chainId / eth_getCode / eth_call only (state reads). A failed source is
preserved as an explicit UNCHECKABLE observation, never dropped and never
inferred.

Outputs (all under measurement/registers/2026-09-20/):
  - ondo-evidence-raw/<sha256>.bin     content-addressed raw bytes
  - ondo-source-manifest.json          one row per source with provenance
"""
from __future__ import annotations

import hashlib
import json
import urllib.request
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

REGISTER = Path('measurement/registers/2026-09-20')
OUT = REGISTER / 'ondo-source-manifest.json'
RAW_DIR = REGISTER / 'ondo-evidence-raw'
UA = 'CSOAI-ondo-evidence-intake/0.1 (+https://councilof.ai)'
SUBJECT = 'issuer:ondo'

# Docs-claimed OUSG token address on Ethereum mainnet, transcribed from
# https://docs.ondo.finance/addresses on 2026-09-20. This pin is an ISSUER
# ASSERTION until an independent chain readback agrees; see the canary rule
# UNCHECKABLE_UNTIL_OFFICIAL_SOURCE_AND_CHAIN_READBACK_AGREE.
OUSG_ETHEREUM = '0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92'
RPC = 'https://ethereum.publicnode.com'

SOURCES: list[dict[str, Any]] = [
    # --- issuer site (ondo.finance) ---
    {'source_id': 'site-root', 'kind': 'issuer-site', 'url': 'https://ondo.finance/'},
    {'source_id': 'site-ousg', 'kind': 'issuer-product-page', 'url': 'https://ondo.finance/ousg'},
    {'source_id': 'site-usdy', 'kind': 'issuer-product-page', 'url': 'https://ondo.finance/usdy'},
    {'source_id': 'site-blog', 'kind': 'issuer-announcements-index', 'url': 'https://ondo.finance/blog'},
    # --- issuer docs (docs.ondo.finance) ---
    {'source_id': 'docs-root', 'kind': 'documentation', 'url': 'https://docs.ondo.finance/'},
    {'source_id': 'docs-addresses', 'kind': 'contract-addresses', 'url': 'https://docs.ondo.finance/addresses'},
    {'source_id': 'docs-official-domains', 'kind': 'official-domains', 'url': 'https://docs.ondo.finance/official-domains'},
    {'source_id': 'docs-audits', 'kind': 'audits', 'url': 'https://docs.ondo.finance/audits'},
    {'source_id': 'docs-trust-security', 'kind': 'trust-and-security', 'url': 'https://docs.ondo.finance/trust-and-security'},
    {'source_id': 'docs-ousg-overview', 'kind': 'product-docs', 'url': 'https://docs.ondo.finance/qualified-access-products/ousg/overview'},
    {'source_id': 'docs-ousg-mint-redeem', 'kind': 'redemption-docs', 'url': 'https://docs.ondo.finance/qualified-access-products/minting-and-redeeming'},
    {'source_id': 'docs-usdy-basics', 'kind': 'product-docs', 'url': 'https://docs.ondo.finance/general-access-products/usdy/basics'},
    {'source_id': 'docs-usdy-notes', 'kind': 'product-docs', 'url': 'https://docs.ondo.finance/general-access-products/usdy/important-notes'},
    {'source_id': 'docs-stocks-pricing', 'kind': 'oracle-pricing-docs', 'url': 'https://docs.ondo.finance/ondo-stocks/token-and-quote-pricing'},
    {'source_id': 'docs-disclaimers', 'kind': 'legal-disclaimers', 'url': 'https://docs.ondo.finance/legal/disclaimers'},
    {'source_id': 'docs-llms-txt', 'kind': 'machine-readable-index', 'url': 'https://docs.ondo.finance/llms.txt'},
    # --- status / incident surface ---
    {'source_id': 'status-root', 'kind': 'status-page', 'url': 'https://status.ondo.finance/'},
    # --- issuer code hosting (github.com/ondoprotocol, linked from docs root) ---
    {'source_id': 'github-org', 'kind': 'github-org', 'url': 'https://api.github.com/orgs/ondoprotocol'},
    {'source_id': 'github-repos', 'kind': 'github-repos', 'url': 'https://api.github.com/orgs/ondoprotocol/repos?per_page=100&sort=updated'},
    # --- read-only on-chain observations (state reads only; no transactions) ---
    {'source_id': 'rpc-chain-id', 'kind': 'chain_id', 'rpc': RPC, 'method': 'eth_chainId', 'params': []},
    {'source_id': 'rpc-ousg-code', 'kind': 'contract_code', 'rpc': RPC, 'method': 'eth_getCode', 'params': [OUSG_ETHEREUM, 'latest']},
    {'source_id': 'rpc-ousg-name', 'kind': 'contract_call', 'call': 'name()', 'rpc': RPC, 'method': 'eth_call',
     'params': [{'to': OUSG_ETHEREUM, 'data': '0x06fdde03'}, 'latest']},
    {'source_id': 'rpc-ousg-symbol', 'kind': 'contract_call', 'call': 'symbol()', 'rpc': RPC, 'method': 'eth_call',
     'params': [{'to': OUSG_ETHEREUM, 'data': '0x95d89b41'}, 'latest']},
    {'source_id': 'rpc-ousg-decimals', 'kind': 'contract_call', 'call': 'decimals()', 'rpc': RPC, 'method': 'eth_call',
     'params': [{'to': OUSG_ETHEREUM, 'data': '0x313ce567'}, 'latest']},
    {'source_id': 'rpc-ousg-total-supply', 'kind': 'contract_call', 'call': 'totalSupply()', 'rpc': RPC, 'method': 'eth_call',
     'params': [{'to': OUSG_ETHEREUM, 'data': '0x18160ddd'}, 'latest']},
]


def fetch_url(url: str) -> tuple[bytes, str | None]:
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': '*/*'})
    with urllib.request.urlopen(req, timeout=30) as response:  # nosec B310 fixed HTTPS sources
        return response.read(), response.headers.get('content-type')


def rpc_call(source: dict[str, Any]) -> bytes:
    body = json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': source['method'], 'params': source['params']},
                      separators=(',', ':')).encode()
    req = urllib.request.Request(source['rpc'], data=body,
                                 headers={'User-Agent': UA, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=30) as response:  # nosec B310 fixed HTTPS source
        return response.read()


def observe(source: dict[str, Any]) -> dict[str, Any]:
    retrieved_at = datetime.now(UTC).isoformat()
    base: dict[str, Any] = {
        'subject_id': SUBJECT, 'source_id': source['source_id'], 'kind': source['kind'],
        'retrieved_at': retrieved_at,
    }
    if 'call' in source:
        base['call'] = source['call']
    try:
        if 'url' in source:
            raw, content_type = fetch_url(source['url'])
            base['locator'] = source['url']
            base['transport'] = 'https-get'
        else:
            raw, content_type = rpc_call(source), 'application/json'
            base['locator'] = source['rpc']
            base['transport'] = 'jsonrpc-read-only'
            base['rpc_method'] = source['method']
            base['rpc_params'] = json.dumps(source['params'], separators=(',', ':'))
        digest = hashlib.sha256(raw).hexdigest()
        RAW_DIR.mkdir(parents=True, exist_ok=True)
        raw_path = RAW_DIR / f'{digest}.bin'
        raw_path.write_bytes(raw)
        base.update({
            'bytes': len(raw), 'sha256': digest, 'raw_path': str(raw_path),
            'content_type': content_type, 'state': 'OBSERVED_NOT_YET_ACCEPTED',
        })
        return base
    except Exception as exc:
        base.update({
            'locator': source.get('url', source.get('rpc')),
            'state': 'UNCHECKABLE', 'error_type': type(exc).__name__,
        })
        return base


def main() -> int:
    rows = [observe(source) for source in SOURCES]
    doc = {
        'schema': 'csoai.ondo-source-manifest/0.1',
        'as_of': '2026-09-20',
        'subject': {
            'subject_id': SUBJECT,
            'display_name': 'Ondo Finance (issuer; products observed: OUSG, USDY, Ondo Stocks)',
            'scope': 'Public primary sources only: issuer site, issuer docs, issuer status page, issuer GitHub org, and read-only public-RPC state reads of the docs-claimed OUSG Ethereum contract.',
            'identity_pin': {
                'ousg_ethereum_address': OUSG_ETHEREUM,
                'pin_state': 'DOCS_CLAIMED_PENDING_INDEPENDENT_AGREEMENT',
                'rule': 'UNCHECKABLE_UNTIL_OFFICIAL_SOURCE_AND_CHAIN_READBACK_AGREE',
            },
        },
        'execution': 'read_only_public_sources',
        'no_transactions': True,
        'signing': 'disabled',
        'publication': 'disabled',
        'sources': rows,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    ok = sum(1 for r in rows if r['state'] == 'OBSERVED_NOT_YET_ACCEPTED')
    bad = [r['source_id'] for r in rows if r['state'] != 'OBSERVED_NOT_YET_ACCEPTED']
    print(json.dumps({'observed': ok, 'uncheckable': bad}, sort_keys=True))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
