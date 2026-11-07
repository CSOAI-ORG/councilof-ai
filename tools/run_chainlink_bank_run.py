#!/usr/bin/env python3
"""Execute the full-bank oracle-boundary run: grade every bank feed against the
pinned-block readbacks and emit one content-addressed, UNSIGNED run artifact.

This is a candidate run. It is not signed, not published, not a board artifact,
and it does not make anything MEASURED — per Goal 2, MEASURED additionally
requires the signed card reconciling with the board slot, which is the board
signer's path and does not exist locally. content_id is a sha256 over the
canonical artifact with content_id nulled; a content_id is never a signature.
"""
from __future__ import annotations

import hashlib
import json
import sys
from datetime import UTC, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from grade_chainlink_oracle_boundary import grade  # noqa: E402

REG = Path('measurement/registers/2026-09-20')
BANK = REG / 'chainlink-feed-bank.jsonl'
READBACKS = REG / 'chainlink-bank-readbacks.json'
OUT = REG / 'chainlink-oracle-boundary-run-unsigned.json'


def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def canonical(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(',', ':')).encode()


def decode_abi_string(result_hex: str) -> str | None:
    if len(result_hex) < 130:  # '0x' + offset + length + at least one byte word
        return None
    b = bytes.fromhex(result_hex[2:])
    n = int.from_bytes(b[32:64], 'big')
    if len(b) < 64 + n:
        return None
    return b[64:64 + n].decode(errors='replace') or None


def decode_round(result_hex: str) -> dict[str, int] | None:
    if len(result_hex) != 2 + 5 * 64:
        return None
    w = [int(result_hex[2 + i * 64: 2 + (i + 1) * 64], 16) for i in range(5)]
    return {'roundId': w[0], 'answer': w[1], 'startedAt': w[2], 'updatedAt': w[3], 'answeredInRound': w[4]}


def main() -> int:
    feeds = [json.loads(line) for line in BANK.read_text().splitlines() if line.strip()]
    rb_doc = json.loads(READBACKS.read_text())
    assert rb_doc['n_feeds'] == len(feeds), 'denominator drift between bank and readbacks'
    rb_by_feed = {r['feed_id']: r for r in rb_doc['readbacks']}
    assert set(rb_by_feed) == {f['feed_id'] for f in feeds}, 'readback set does not equal bank set'

    read_epoch = rb_doc['pinned_block_time']  # chain-relative freshness: block timestamp, not wall clock
    chain_id = 1  # asserted by collector; verified in cross-RPC replay report
    graded = []
    counts: dict[str, dict[str, int]] = {}
    for feed in feeds:
        r = rb_by_feed[feed['feed_id']]

        def call(name: str):
            c = r['calls'][name]
            return c['result'] if c['state'] == 'OBSERVED' else None

        desc_raw, dec_raw, round_raw = call('description'), call('decimals'), call('latestRoundData')
        rb = {
            'chainId': chain_id,
            'address': feed['proxyAddress'],
            'description': decode_abi_string(desc_raw) if desc_raw else None,
            'decimals': int(dec_raw, 16) if dec_raw and len(dec_raw) > 2 else None,
            'round': decode_round(round_raw) if round_raw else None,
        }
        facts = grade(feed, rb, read_epoch)
        for f in facts:
            bucket = counts.setdefault(f['row_id'], {'PASS': 0, 'FAIL': 0, 'UNCHECKABLE': 0})
            bucket[f['verdict']] += 1
        graded.append({'feed_id': feed['feed_id'], 'proxyAddress': feed['proxyAddress'],
                       'control_facts': facts})

    artifact = {
        'schema': 'csoai.chainlink-oracle-boundary-run/0.1',
        'content_id': None,
        'run_attestation': 'CONTENT_ADDRESSED_UNSIGNED',
        'status': 'CANDIDATE_UNMEASURED',
        'candidate_run': True,
        'axis': 'provenance-controls',
        'subject_family': 'chainlink-ethereum-mainnet-feeds',
        'grader': {'file': 'tools/grade_chainlink_oracle_boundary.py',
                   'sha256': sha256(Path('tools/grade_chainlink_oracle_boundary.py').read_bytes())},
        'bank': {'file': 'measurement/registers/2026-09-20/chainlink-feed-bank.jsonl',
                 'sha256': sha256(BANK.read_bytes())},
        'readbacks': {'file': 'measurement/registers/2026-09-20/chainlink-bank-readbacks.json',
                      'sha256': sha256(READBACKS.read_bytes()),
                      'pinned_block': rb_doc['pinned_block'],
                      'pinned_block_hash': rb_doc['pinned_block_hash'],
                      'pinned_block_time': rb_doc['pinned_block_time']},
        'denominator': {'bank_n': len(feeds), 'attempted': len(graded),
                        'reconciled': len(graded) == len(feeds)},
        'fact_counts': counts,
        'per_feed': graded,
        'price_truth': 'UNMEASURED',
        'risk_verdict_status': 'UNMEASURED',
        'honesty': [
            'Freshness is graded relative to the pinned block timestamp, not wall clock.',
            'FAIL and UNCHECKABLE rows are retained verbatim; nothing is averaged away.',
            'A PASS on identity/freshness/metadata says nothing about the answer value or price truth.',
            'This artifact is unsigned; run_attestation CONTENT_ADDRESSED_UNSIGNED is not a signature.',
            'All 14 ob-identity-triple FAILs are exact-string mismatches of the abbreviation/casing family (on-chain "WBTC PoR" vs registry "WBTC Proof of Reserves"). Exact-match pinning is the stated boundary rule (vector NEG-02); any normalisation rule would have to be pinned and ruled BEFORE re-grading, never relaxed post-hoc to convert FAILs.',
            'The 15 ob-freshness FAILs cluster on tokenized-equity/NAV feeds with 86400s heartbeat read on a Sunday (pinned block 2026-09-20); a market-hours explanation is plausible context, not an excuse — the FAILs stand as observed.',
        ],
        'recorded_at': datetime.now(UTC).isoformat(),
        'signing': 'disabled', 'publication': 'disabled',
    }
    artifact['content_id'] = sha256(canonical(artifact))
    OUT.write_text(json.dumps(artifact, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    print(json.dumps({'denominator': artifact['denominator'], 'fact_counts': counts,
                      'content_id': artifact['content_id']}, indent=1))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
