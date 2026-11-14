#!/usr/bin/env python3
"""Cross-RPC replay for the Chainlink oracle-boundary pack (closes GAP-07).

Pins one block height (min of the responding endpoints' eth_blockNumber),
verifies the responding endpoints serve the identical block hash at that
height (same-chain-view proof), then replays the ETH/USD aggregator reads
(description / decimals / latestRoundData) at the pinned block on those
endpoints and byte-compares the results.

Three endpoints operated by different organisations are tried; the replay
proceeds with the first two that answer eth_blockNumber, and every endpoint
attempt — including failures — is preserved as a step row. One physical
collection seat remains; that residual limit is recorded, not hidden.
Read-only; no wallet, key, or transaction.
"""
from __future__ import annotations

import hashlib
import json
import urllib.request
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

REG = Path('measurement/registers/2026-09-20')
OUT = REG / 'chainlink-cross-rpc-replay.json'
UA = 'CSOAI-oracle-evidence/0.1 (+https://councilof.ai)'
ENDPOINTS = [
    ('publicnode', 'https://ethereum.publicnode.com'),
    ('cloudflare', 'https://cloudflare-eth.com'),  # deprecated gateway: attempt recorded even on failure
    ('drpc', 'https://eth.drpc.org'),
]
REQUIRED = 2
AGGREGATOR = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'
CALLS = {'description': '0x7284e416', 'decimals': '0x313ce567', 'latestRoundData': '0xfeaf968c'}


def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def rpc(endpoint: str, method: str, params: list[Any]) -> bytes:
    body = json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': params},
                      separators=(',', ':')).encode()
    req = urllib.request.Request(endpoint, data=body,
                                 headers={'User-Agent': UA, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=30) as response:  # nosec B310 fixed HTTPS endpoints
        return response.read()


def result_hex(raw: bytes) -> str | None:
    try:
        return json.loads(raw).get('result')
    except Exception:
        return None


def main() -> int:
    report: dict[str, Any] = {
        'schema': 'csoai.chainlink-cross-rpc-replay/0.1',
        'recorded_at': datetime.now(UTC).isoformat(),
        'endpoints': {name: ep for name, ep in ENDPOINTS},
        'required_endpoints': REQUIRED,
        'residual_limitation': 'Both replays ran from one physical seat; endpoint operators differ but the network path does not. A second-seat replay remains open.',
        'signing': 'disabled', 'publication': 'disabled',
        'steps': [],
    }

    heights: dict[str, int] = {}
    for name, ep in ENDPOINTS:
        try:
            raw = rpc(ep, 'eth_blockNumber', [])
            heights[name] = int(result_hex(raw), 16)  # type: ignore[arg-type]
            report['steps'].append({'step': f'eth_blockNumber:{name}', 'state': 'OBSERVED',
                                    'value': heights[name], 'raw_sha256': sha256(raw)})
        except Exception as exc:
            report['steps'].append({'step': f'eth_blockNumber:{name}', 'state': 'UNCHECKABLE',
                                    'error_type': type(exc).__name__})
    if len(heights) < REQUIRED:
        report['overall'] = 'UNCHECKABLE: fewer than two endpoints answered eth_blockNumber'
        OUT.write_text(json.dumps(report, indent=2, sort_keys=True) + '\n')
        print(report['overall'])
        return 0

    live = [n for n, _ in ENDPOINTS if n in heights][:REQUIRED]
    eps = {n: dict(ENDPOINTS)[n] for n in live}
    report['endpoints_used'] = live
    pinned = min(heights[n] for n in live)
    pinned_hex = hex(pinned)
    report['pinned_block'] = pinned
    hashes: dict[str, str] = {}
    for name, ep in eps.items():
        try:
            raw = rpc(ep, 'eth_getBlockByNumber', [pinned_hex, False])
            bh = (json.loads(raw).get('result') or {}).get('hash')
            hashes[name] = bh
            report['steps'].append({'step': f'block_hash:{name}', 'state': 'OBSERVED',
                                    'value': bh, 'raw_sha256': sha256(raw)})
        except Exception as exc:
            report['steps'].append({'step': f'block_hash:{name}', 'state': 'UNCHECKABLE',
                                    'error_type': type(exc).__name__})
    same_view = len(set(hashes.values())) == 1 and len(hashes) == REQUIRED
    report['steps'].append({
        'step': 'same_chain_view_at_pinned_block',
        'state': 'PASS' if same_view else ('FAIL' if len(hashes) == REQUIRED else 'UNCHECKABLE'),
    })

    for call, selector in CALLS.items():
        results: dict[str, str | None] = {}
        for name, ep in eps.items():
            try:
                raw = rpc(ep, 'eth_call', [{'to': AGGREGATOR, 'data': selector}, pinned_hex])
                results[name] = result_hex(raw)
                report['steps'].append({'step': f'{call}:{name}', 'state': 'OBSERVED',
                                        'result_sha256': sha256((results[name] or '').encode()),
                                        'raw_sha256': sha256(raw)})
            except Exception as exc:
                results[name] = None
                report['steps'].append({'step': f'{call}:{name}', 'state': 'UNCHECKABLE',
                                        'error_type': type(exc).__name__})
        vals = [v for v in results.values() if v is not None]
        report['steps'].append({
            'step': f'{call}:cross_rpc_agreement',
            'state': 'PASS' if len(vals) == REQUIRED and len(set(vals)) == 1
                     else ('UNCHECKABLE' if len(vals) < REQUIRED else 'FAIL'),
        })

    verdicts = [s['state'] for s in report['steps'] if s['step'].endswith('cross_rpc_agreement')]
    report['overall'] = ('PASS' if same_view and verdicts and all(v == 'PASS' for v in verdicts)
                         else 'UNCHECKABLE' if 'UNCHECKABLE' in verdicts or (not same_view and len(hashes) < REQUIRED)
                         else 'FAIL')
    OUT.write_text(json.dumps(report, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    print('overall:', report['overall'], '| pinned_block:', pinned)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
