#!/usr/bin/env python3
"""Parse the frozen docs.chain.link address-registry page into a complete,
deduplicated Ethereum-mainnet feed bank (the proposed instrument denominator).

No network access. Reads the frozen raw bin pinned in
chainlink-oracle-source-observations.json (kind feed_registry_doc), splits the
devalue-encoded page on feed-object boundaries, and emits one JSONL row per
unique proxyAddress. Every row carries the exact source chunk hash and byte
offset so a reviewer can re-verify against the frozen page. Filter-stage
counts are reported, never silently dropped.

Bank membership rule: blockchainName == "Ethereum" AND no testnet marker
("sepolia"/"testnet", case-insensitive) anywhere in the entry chunk. Entries
failing either leg are counted and excluded, not deleted from the record.
"""
from __future__ import annotations

import hashlib
import html
import json
import re
from pathlib import Path
from typing import Any

REG = Path('measurement/registers/2026-09-20')
OBS = REG / 'chainlink-oracle-source-observations.json'
BANK_OUT = REG / 'chainlink-feed-bank.jsonl'
MANIFEST_OUT = REG / 'chainlink-feed-bank-manifest.json'

FIELDS = {
    'contractAddress': r'"contractAddress":\[0,"(0x[0-9a-fA-F]{40}|[^"]*)"\]',
    'ens': r'"ens":\[0,"([^"]*)"\]',
    'heartbeat': r'"heartbeat":\[0,(\d+|null)\]',
    'name': r'"name":\[0,"([^"]+)"\]',
    'path': r'"path":\[0,"([^"]+)"\]',
    'proxyAddress': r'"proxyAddress":\[0,"(0x[0-9a-fA-F]{40})"\]',
    'threshold': r'"threshold":\[0,([\d.]+|null)\]',
    'feedType': r'"feedType":\[0,"([^"]*)"\]',
    'blockchainName': r'"blockchainName":\[0,"([^"]+)"\]',
    'decimals': r'"decimals":\[0,(\d+|null)\]',
    'clicProductName': r'"clicProductName":\[0,"([^"]*)"\]',
}


def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def parse_chunk(chunk: str) -> dict[str, Any] | None:
    row: dict[str, Any] = {}
    for field, pat in FIELDS.items():
        m = re.search(pat, chunk)
        if not m:
            row[field] = None
            continue
        v: Any = m.group(1)
        if v == 'null':
            v = None
        elif field in ('heartbeat', 'decimals') and v is not None:
            v = int(v)
        elif field == 'threshold' and v is not None:
            v = float(v)
        row[field] = v
    return row if row['proxyAddress'] else None


def main() -> int:
    obs_doc = json.loads(OBS.read_text(encoding='utf-8'))
    reg_obs = next(o for o in obs_doc['observations'] if o['kind'] == 'feed_registry_doc'
                   and o['state'] == 'OBSERVED_NOT_YET_ACCEPTED')
    raw = Path(reg_obs['raw_path']).read_bytes()
    assert sha256(raw) == reg_obs['sha256'], 'frozen registry hash mismatch'
    page = html.unescape(raw.decode('utf-8', errors='replace'))

    counts = {'chunks': 0, 'entries_with_proxy': 0, 'excluded_wrong_chain': 0,
              'excluded_testnet_marker': 0, 'excluded_duplicate_proxy': 0, 'bank_rows': 0}
    seen: set[str] = set()
    rows: list[dict[str, Any]] = []

    # Entry objects open with {"compareOffchain": — split preserves the boundary.
    offset = 0
    for chunk in page.split('[0,{"compareOffchain"')[1:]:
        counts['chunks'] += 1
        chunk_start = page.find(chunk, offset)
        offset = chunk_start + len(chunk)
        parsed = parse_chunk(chunk)
        if not parsed:
            continue
        counts['entries_with_proxy'] += 1
        stage = 'bank'
        if parsed['blockchainName'] != 'Ethereum':
            counts['excluded_wrong_chain'] += 1
            stage = 'excluded_wrong_chain'
        elif re.search(r'sepolia|testnet', chunk, re.I):
            counts['excluded_testnet_marker'] += 1
            stage = 'excluded_testnet_marker'
        elif parsed['proxyAddress'].lower() in seen:
            counts['excluded_duplicate_proxy'] += 1
            stage = 'excluded_duplicate_proxy'
        if stage != 'bank':
            continue
        seen.add(parsed['proxyAddress'].lower())
        excerpt = chunk[:2048]
        rows.append({
            'feed_id': f"ethereum-mainnet/{parsed['path']}",
            **{k: parsed[k] for k in FIELDS},
            'source_raw_sha256': reg_obs['sha256'],
            'source_locator': reg_obs['locator'],
            'byte_offset': chunk_start,
            'excerpt_head_sha256': sha256(excerpt.encode()),
            'state': 'BANK_CANDIDATE_UNMEASURED',
        })
        counts['bank_rows'] += 1

    bank_bytes = ''.join(json.dumps(r, sort_keys=True) + '\n' for r in rows).encode()
    BANK_OUT.write_bytes(bank_bytes)
    manifest = {
        'schema': 'csoai.chainlink-feed-bank-manifest/0.1',
        'as_of': obs_doc['observations'][0]['retrieved_at'],
        'source': {'locator': reg_obs['locator'], 'raw_sha256': reg_obs['sha256'],
                   'retrieved_at': reg_obs['retrieved_at']},
        'bank_file': str(BANK_OUT), 'bank_sha256': sha256(bank_bytes),
        'filter_rule': 'blockchainName == Ethereum AND no sepolia/testnet marker in entry chunk; first occurrence per proxyAddress',
        'counts': counts,
        'completeness_note': 'Denominator = every entry parseable from the frozen registry page at the pinned hash; exclusions are counted by stage, never dropped silently.',
        'status': 'CANDIDATE_UNMEASURED',
        'signing': 'disabled', 'publication': 'disabled',
    }
    MANIFEST_OUT.write_text(json.dumps(manifest, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    print(json.dumps(counts, sort_keys=True))
    print('bank_sha256', manifest['bank_sha256'])
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
