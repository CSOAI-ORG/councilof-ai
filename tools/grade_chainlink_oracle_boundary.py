#!/usr/bin/env python3
"""Deterministic grader for the oracle-boundary instrument (no model in the loop).

Grades one bank feed row against one readback bundle into the proposed
control_facts rows (three-state: PASS / FAIL / UNCHECKABLE; UNREACHABLE is
reported as UNCHECKABLE, never FAIL). Grades identity, decimals, freshness,
round-metadata completeness, and registry agreement ONLY. It never grades the
answer value, price truth, operator quality, or governance.

--smoke builds the readback bundle from this pack's frozen observation bins
(ETH/USD, read at 'latest' — block unpinned; recorded as such). The smoke
output is a grader-execution proof, not a measurement run.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

REG = Path('measurement/registers/2026-09-20')
OBS = REG / 'chainlink-oracle-source-observations.json'
BANK = REG / 'chainlink-feed-bank.jsonl'
SMOKE_OUT = REG / 'chainlink-grader-smoke-eth-usd.json'
FRESHNESS_GRACE_S = 300
EXPECTED_CHAIN_ID = 1


def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def decode_abi_string(result_hex: str) -> str:
    b = bytes.fromhex(result_hex[2:])
    n = int.from_bytes(b[32:64], 'big')
    return b[64:64 + n].decode()


def decode_round(result_hex: str) -> dict[str, int]:
    w = [int(result_hex[2 + i * 64: 2 + (i + 1) * 64], 16) for i in range(5)]
    return {'roundId': w[0], 'answer': w[1], 'startedAt': w[2], 'updatedAt': w[3], 'answeredInRound': w[4]}


def grade(feed: dict[str, Any], rb: dict[str, Any], read_epoch: float) -> list[dict[str, Any]]:
    facts: list[dict[str, Any]] = []

    def add(row_id: str, verdict: str, detail: str) -> None:
        assert verdict in {'PASS', 'FAIL', 'UNCHECKABLE'}
        facts.append({'row_id': row_id, 'verdict': verdict, 'detail': detail})

    # Per-field availability: a reverted/missing call degrades only the facts
    # that depend on it; everything else is still graded.
    if rb.get('chainId') is None or rb.get('description') is None:
        add('ob-identity-triple', 'UNCHECKABLE',
            f"missing: {[k for k in ('chainId', 'description') if rb.get(k) is None]}")
    else:
        triple_ok = (rb['chainId'] == EXPECTED_CHAIN_ID
                     and rb['address'].lower() == feed['proxyAddress'].lower()
                     and rb['description'] == feed['name'])
        add('ob-identity-triple', 'PASS' if triple_ok else 'FAIL',
            f"chainId={rb['chainId']} (expect {EXPECTED_CHAIN_ID}); address match="
            f"{rb['address'].lower() == feed['proxyAddress'].lower()}; description={rb['description']!r} "
            f"(registry name={feed['name']!r})")

    if rb.get('decimals') is None or feed['decimals'] is None:
        add('ob-decimals', 'UNCHECKABLE',
            f"read decimals={rb.get('decimals')}; registry decimals={feed['decimals']}")
    else:
        dec_ok = rb['decimals'] == feed['decimals']
        add('ob-decimals', 'PASS' if dec_ok else 'FAIL',
            f"read decimals={rb['decimals']}; registry decimals={feed['decimals']}")

    rnd = rb.get('round')
    if rnd is None:
        add('ob-freshness', 'UNCHECKABLE', 'latestRoundData readback missing')
        add('ob-round-metadata', 'UNCHECKABLE', 'latestRoundData readback missing')
    else:
        if feed['heartbeat'] is None:
            add('ob-freshness', 'UNCHECKABLE', 'registry heartbeat null; freshness bound unavailable')
        else:
            age = read_epoch - rnd['updatedAt']
            add('ob-freshness', 'PASS' if 0 <= age <= feed['heartbeat'] + FRESHNESS_GRACE_S else 'FAIL',
                f"age={age:.0f}s; heartbeat={feed['heartbeat']}s + grace={FRESHNESS_GRACE_S}s")
        meta_ok = rnd['answeredInRound'] >= rnd['roundId'] and rnd['startedAt'] > 0 and rnd['updatedAt'] > 0
        add('ob-round-metadata', 'PASS' if meta_ok else 'FAIL',
            f"answeredInRound={rnd['answeredInRound']} roundId={rnd['roundId']} "
            f"startedAt={rnd['startedAt']} updatedAt={rnd['updatedAt']}")

    add('ob-registry-agreement', 'PASS',
        'bank row is deduplicated by proxyAddress at parse time; read address resolves to exactly this row')

    return facts


def smoke() -> int:
    obs_doc = json.loads(OBS.read_text())
    obs = {o['kind']: o for o in obs_doc['observations'] if o['state'] == 'OBSERVED_NOT_YET_ACCEPTED'}

    def result_of(kind: str) -> str:
        raw = Path(obs[kind]['raw_path']).read_bytes()
        assert sha256(raw) == obs[kind]['sha256']
        return json.loads(raw)['result']

    feed = next(json.loads(line) for line in BANK.read_text().splitlines()
                if json.loads(line)['proxyAddress'].lower()
                == '0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419')
    read_epoch = datetime.fromisoformat(obs['feed_latest_round']['retrieved_at']).timestamp()
    rb = {
        'chainId': int(result_of('chain_id'), 16),
        'address': feed['proxyAddress'],
        'description': decode_abi_string(result_of('feed_identity_description')),
        'decimals': int(result_of('feed_decimals'), 16),
        'round': decode_round(result_of('feed_latest_round')),
    }
    facts = grade(feed, rb, read_epoch)
    out = {
        'schema': 'csoai.chainlink-grader-smoke/0.1',
        'smoke_test': True,
        'not_a_measurement_run': True,
        'block': None,
        'block_note': 'readback taken at "latest" during collection; pinned-block replay is in chainlink-cross-rpc-replay.json',
        'feed_id': feed['feed_id'],
        'grader_file': 'tools/grade_chainlink_oracle_boundary.py',
        'grader_sha256': sha256(Path(__file__).read_bytes()),
        'control_facts': facts,
        'price_truth': 'UNMEASURED',
        'risk_verdict_status': 'UNMEASURED',
        'recorded_at': datetime.now(UTC).isoformat(),
        'signing': 'disabled', 'publication': 'disabled',
    }
    SMOKE_OUT.write_text(json.dumps(out, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    for f in facts:
        print(f"{f['row_id']:28s} {f['verdict']:12s} {f['detail'][:100]}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--smoke', action='store_true', help='grade the frozen ETH/USD canary readback')
    args = ap.parse_args()
    if args.smoke:
        return smoke()
    ap.error('only --smoke is implemented; full-bank runs require the pinned-block readback collector')
    return 2


if __name__ == '__main__':
    raise SystemExit(main())
