#!/usr/bin/env python3
"""Pinned-block readback collector for all feeds in the Chainlink feed bank.

Pins one block (eth_blockNumber on the primary endpoint), records its hash,
then reads description() / decimals() / latestRoundData() for every bank feed
AT THAT BLOCK via batched JSON-RPC. Every batch response is frozen into
chainlink-oracle-raw/ (sha256-addressed); every per-feed row carries the batch
hash so a reviewer can re-parse the frozen bytes. Feeds whose calls revert or
error are UNCHECKABLE rows — counted, never dropped. Read-only: no wallet, no
key, no transaction.
"""
from __future__ import annotations

import hashlib
import json
import urllib.request
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

REG = Path('measurement/registers/2026-09-20')
BANK = REG / 'chainlink-feed-bank.jsonl'
RAW_DIR = REG / 'chainlink-oracle-raw'
OUT = REG / 'chainlink-bank-readbacks.json'
RPC = 'https://ethereum.publicnode.com'
UA = 'CSOAI-oracle-evidence/0.1 (+https://councilof.ai)'
SELECTORS = {'description': '0x7284e416', 'decimals': '0x313ce567', 'latestRoundData': '0xfeaf968c'}
BATCH = 50


def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def rpc_raw(payload: Any) -> bytes:
    body = json.dumps(payload, separators=(',', ':')).encode()
    req = urllib.request.Request(RPC, data=body,
                                 headers={'User-Agent': UA, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=60) as response:  # nosec B310 fixed HTTPS endpoint
        return response.read()


def freeze(raw: bytes) -> str:
    digest = sha256(raw)
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    (RAW_DIR / f'{digest}.bin').write_bytes(raw)
    return digest


def main() -> int:
    feeds = [json.loads(line) for line in BANK.read_text().splitlines() if line.strip()]
    collected_at = datetime.now(UTC).isoformat()

    pinned_raw = rpc_raw({'jsonrpc': '2.0', 'id': 1, 'method': 'eth_blockNumber', 'params': []})
    pinned = int(json.loads(pinned_raw)['result'], 16)
    pinned_hex = hex(pinned)
    block_raw = rpc_raw({'jsonrpc': '2.0', 'id': 1, 'method': 'eth_getBlockByNumber', 'params': [pinned_hex, False]})
    block = json.loads(block_raw)['result']
    chain_raw = rpc_raw({'jsonrpc': '2.0', 'id': 1, 'method': 'eth_chainId', 'params': []})

    calls: list[dict[str, Any]] = []
    call_index: list[tuple[int, str]] = []  # (feed_idx, call_name)
    for fi, feed in enumerate(feeds):
        for name, sel in SELECTORS.items():
            calls.append({'jsonrpc': '2.0', 'id': len(calls) + 1, 'method': 'eth_call',
                          'params': [{'to': feed['proxyAddress'], 'data': sel}, pinned_hex]})
            call_index.append((fi, name))

    results: dict[int, Any] = {}
    batch_hashes: list[str] = []
    for off in range(0, len(calls), BATCH):
        chunk = calls[off:off + BATCH]
        raw = rpc_raw(chunk)
        batch_hashes.append(freeze(raw))
        for item in json.loads(raw):
            results[item['id']] = item

    rows: list[dict[str, Any]] = []
    counts = {'OBSERVED': 0, 'UNCHECKABLE': 0}
    for fi, feed in enumerate(feeds):
        row: dict[str, Any] = {'feed_id': feed['feed_id'], 'proxyAddress': feed['proxyAddress'],
                               'block': pinned, 'calls': {}, 'batch_sha256': batch_hashes}
        for name in SELECTORS:
            call_id = next(i + 1 for i, (f, c) in enumerate(call_index) if f == fi and c == name)
            item = results.get(call_id, {})
            if 'result' in item:
                row['calls'][name] = {'state': 'OBSERVED', 'result': item['result'],
                                      'result_sha256': sha256(item['result'].encode())}
                counts['OBSERVED'] += 1
            else:
                row['calls'][name] = {'state': 'UNCHECKABLE',
                                      'error': item.get('error', {'message': 'no result'})}
                counts['UNCHECKABLE'] += 1
        rows.append(row)

    out = {
        'schema': 'csoai.chainlink-bank-readbacks/0.1',
        'collected_at': collected_at,
        'rpc_endpoint': RPC,
        'chain_id_raw_sha256': freeze(chain_raw),
        'pinned_block': pinned,
        'pinned_block_hash': block['hash'],
        'pinned_block_time': int(block['timestamp'], 16),
        'block_raw_sha256': freeze(block_raw),
        'block_number_raw_sha256': freeze(pinned_raw),
        'n_feeds': len(feeds),
        'call_counts': counts,
        'denominator_rule': 'every bank row attempted exactly once; UNCHECKABLE rows counted, never dropped',
        'readbacks': rows,
        'signing': 'disabled', 'publication': 'disabled',
    }
    OUT.write_text(json.dumps(out, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    print(f"pinned_block={pinned} feeds={len(feeds)} calls={counts} -> {OUT}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
