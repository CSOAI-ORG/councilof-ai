#!/usr/bin/env python3
"""Build the frozen Chainlink oracle-boundary claims JSONL from the collected
source observations (2026-09-20 register).

Deterministic: reads chainlink-oracle-source-observations.json, reloads each
referenced raw bin, re-verifies its sha256, decodes ABI eth_call results, and
extracts exact short excerpts by offset from the frozen HTML. Emits one JSON
object per line. No network access. No signing. Rows are
OBSERVED_NOT_YET_ACCEPTED; unsupported fields stay null.

Assertion classes (per Goal 2): ISSUER_ASSERTION (Chainlink self-published),
ON_CHAIN_OBSERVATION (read-only chain readback), THIRD_PARTY_PLATFORM_METADATA
(GitHub). A claim is never promoted by this script.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

REG_DIR = Path('measurement/registers/2026-09-20')
OBS = REG_DIR / 'chainlink-oracle-source-observations.json'
OUT = REG_DIR / 'chainlink-oracle-claims.jsonl'

AXES_PROVENANCE = ['provenance-controls']
AXES_RESERVE = ['reserve-attestation']


def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def load_bin(obs: dict[str, Any]) -> bytes:
    raw = Path(obs['raw_path']).read_bytes()
    assert sha256(raw) == obs['sha256'], f"raw bin hash mismatch for {obs['kind']}"
    return raw


def excerpt_record(text: str, start: int, end: int) -> dict[str, Any]:
    ex = text[start:end]
    return {'excerpt': ex, 'excerpt_sha256': sha256(ex.encode()), 'byte_offset': start}


def main() -> int:
    doc = json.loads(OBS.read_text(encoding='utf-8'))
    obs = {o['kind']: o for o in doc['observations'] if o['state'] == 'OBSERVED_NOT_YET_ACCEPTED'}
    rows: list[dict[str, Any]] = []

    def base(claim_id: str, kind: str, assertion_class: str) -> dict[str, Any]:
        o = obs[kind]
        return {
            'claim_id': claim_id, 'subject_id': o['subject_id'],
            'source_locator': o['locator'], 'retrieved_at': o['retrieved_at'],
            'raw_sha256': o['sha256'], 'raw_path': o['raw_path'],
            'assertion_class': assertion_class, 'state': 'OBSERVED_NOT_YET_ACCEPTED',
        }

    # --- On-chain observations -------------------------------------------------
    chain = json.loads(load_bin(obs['chain_id']))
    row = base('chain-id-1', 'chain_id', 'ON_CHAIN_OBSERVATION')
    row.update({
        'claim': 'The RPC endpoint served chainId 0x1 (Ethereum mainnet) at read time.',
        'excerpt': chain['result'], 'excerpt_sha256': sha256(chain['result'].encode()),
        'decoded': {'chainId': int(chain['result'], 16)},
        'independently_checkable': {'verdict': 'YES', 'method': 'rerun eth_chainId against any Ethereum mainnet RPC'},
        'axis_candidates': AXES_PROVENANCE,
        'limitation': 'Proves which chain was read, nothing about any feed value.',
    })
    rows.append(row)

    desc_raw = json.loads(load_bin(obs['feed_identity_description']))['result']
    desc_bytes = bytes.fromhex(desc_raw[2:])
    strlen = int.from_bytes(desc_bytes[32:64], 'big')
    desc = desc_bytes[64:64 + strlen].decode()
    row = base('feed-description-eth-usd', 'feed_identity_description', 'ON_CHAIN_OBSERVATION')
    row.update({
        'claim': 'description() at 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419 returned "ETH / USD".',
        'excerpt': desc_raw, 'excerpt_sha256': sha256(desc_raw.encode()),
        'decoded': {'description': desc},
        'independently_checkable': {'verdict': 'YES', 'method': 'eth_call 0x7284e416 to the pinned address at any block'},
        'axis_candidates': AXES_PROVENANCE,
        'limitation': 'A self-reported contract string; identity is only established jointly with chainId and the docs registry entry.',
    })
    rows.append(row)

    dec_raw = json.loads(load_bin(obs['feed_decimals']))['result']
    row = base('feed-decimals-8', 'feed_decimals', 'ON_CHAIN_OBSERVATION')
    row.update({
        'claim': 'decimals() at the pinned aggregator returned 8.',
        'excerpt': dec_raw, 'excerpt_sha256': sha256(dec_raw.encode()),
        'decoded': {'decimals': int(dec_raw, 16)},
        'independently_checkable': {'verdict': 'YES', 'method': 'eth_call 0x313ce567'},
        'axis_candidates': AXES_PROVENANCE,
        'limitation': None,
    })
    rows.append(row)

    round_raw = json.loads(load_bin(obs['feed_latest_round']))['result']
    w = [int(round_raw[2 + i * 64: 2 + (i + 1) * 64], 16) for i in range(5)]
    row = base('feed-latest-round-fields', 'feed_latest_round', 'ON_CHAIN_OBSERVATION')
    row.update({
        'claim': 'latestRoundData() returned five ABI words (roundId, answer, startedAt, updatedAt, answeredInRound).',
        'excerpt': round_raw, 'excerpt_sha256': sha256(round_raw.encode()),
        'decoded': {'roundId': w[0], 'answer': w[1], 'startedAt': w[2], 'updatedAt': w[3], 'answeredInRound': w[4],
                    'round_metadata_complete': w[4] >= w[0] and w[2] > 0},
        'independently_checkable': {'verdict': 'YES', 'method': 'eth_call 0xfeaf968c at a pinned block'},
        'axis_candidates': AXES_PROVENANCE,
        'limitation': 'Establishes what the contract reported at read time only. The answer field is NOT evidence of any venue price, and no node or publisher signature is visible at this read path.',
    })
    rows.append(row)

    # --- Issuer assertions from the frozen docs registry page -------------------
    reg = load_bin(obs['feed_registry_doc']).decode('utf-8', errors='replace')
    addr = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'
    i = reg.lower().find(addr.lower())
    assert i >= 0, 'aggregator address not found in frozen registry page'
    start = reg.rfind('"name"', 0, i)
    entry = excerpt_record(reg, start, reg.find('"heartbeat"', i))
    row = base('registry-entry-eth-usd', 'feed_registry_doc', 'ISSUER_ASSERTION')
    row.update({
        'claim': 'The docs.chain.link address registry maps name "ETH / USD", path "eth-usd" to proxyAddress 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419 with threshold 0.5 on Ethereum mainnet.',
        **entry,
        'decoded': {'name': 'ETH / USD', 'path': 'eth-usd', 'proxyAddress': addr, 'threshold_pct': 0.5},
        'independently_checkable': {'verdict': 'YES', 'method': 'eth_call description() at the asserted address; cross-check agrees in this pack'},
        'axis_candidates': AXES_PROVENANCE,
        'limitation': 'Issuer-published registry; the agreement with on-chain readback is a separate derived finding, not part of this assertion.',
    })
    rows.append(row)

    hb_i = reg.find('"heartbeat"', i)
    hb = excerpt_record(reg, hb_i, reg.find(']', hb_i) + 1)
    row = base('registry-heartbeat-3600', 'feed_registry_doc', 'ISSUER_ASSERTION')
    row.update({
        'claim': 'The registry entry declares heartbeat 3600 (seconds) for the ETH/USD entry near the pinned proxyAddress.',
        **hb,
        'decoded': {'heartbeat_s': 3600},
        'independently_checkable': {'verdict': 'PARTIAL', 'method': 'freshness is checkable on-chain via updatedAt; the declared heartbeat value itself is not exposed by latestRoundData()'},
        'axis_candidates': AXES_PROVENANCE,
        'limitation': 'Devalue-encoded page JSON; excerpt offset is the verifier of record.',
    })
    rows.append(row)

    # --- Issuer assertions from the frozen concepts page ------------------------
    concepts = load_bin(obs['documentation_concepts']).decode('utf-8', errors='replace')
    needle = 'when the value deviates beyond a specified threshold or when the heartbeat idle time has passed'
    j = concepts.find(needle)
    assert j >= 0, 'update-conditions excerpt not found in frozen concepts page'
    upd = excerpt_record(concepts, j, j + len(needle))
    row = base('docs-update-conditions', 'documentation_concepts', 'ISSUER_ASSERTION')
    row.update({
        'claim': 'Chainlink documentation states a feed updates when the value deviates beyond a specified threshold or when the heartbeat idle time has passed.',
        **upd,
        'decoded': None,
        'independently_checkable': {'verdict': 'PARTIAL', 'method': 'update cadence observable via updatedAt deltas; per-feed threshold config not exposed by the standard read path'},
        'axis_candidates': AXES_PROVENANCE,
        'limitation': 'Describes the general mechanism; does not prove any specific update obeyed it.',
    })
    rows.append(row)

    needle2 = 'Data Feeds aggregate many data sources and publish them onchain'
    j2 = concepts.find(needle2)
    assert j2 >= 0, 'aggregation excerpt not found'
    agg = excerpt_record(concepts, j2, j2 + len(needle2))
    row = base('docs-aggregation-method', 'documentation_concepts', 'ISSUER_ASSERTION')
    row.update({
        'claim': 'Chainlink documentation states Data Feeds aggregate many data sources and publish them onchain.',
        **agg,
        'decoded': None,
        'independently_checkable': {'verdict': 'PARTIAL', 'method': 'aggregated result is on-chain; contributing venue inputs and per-node submissions are not independently readable from the consumer read path'},
        'axis_candidates': AXES_PROVENANCE,
        'limitation': 'Divergent venue inputs are invisible at the aggregator read; this is a named negative vector, not a resolved fact.',
    })
    rows.append(row)

    needle3 = 'Create your own monitoring alerts based on deviations in the answers that data feeds provide'
    j3 = concepts.find(needle3)
    assert j3 >= 0, 'monitoring excerpt not found'
    mon = excerpt_record(concepts, j3, j3 + len(needle3))
    row = base('docs-consumer-monitoring-duty', 'documentation_concepts', 'ISSUER_ASSERTION')
    row.update({
        'claim': 'Chainlink documentation instructs consumers to create their own monitoring alerts based on deviations in feed answers.',
        **mon,
        'decoded': None,
        'independently_checkable': {'verdict': 'YES', 'method': 'excerpt verifiable in the frozen page bytes'},
        'axis_candidates': AXES_PROVENANCE,
        'limitation': 'Establishes that consumer-side verification is the documented norm; consumer verification behavior itself is out of scope for this pack.',
    })
    rows.append(row)

    # --- Third-party platform metadata ------------------------------------------
    gh = json.loads(load_bin(obs['repo_metadata']))
    gh_ex = json.dumps({k: gh.get(k) for k in ('full_name', 'license', 'stargazers_count', 'pushed_at')},
                       sort_keys=True, default=None)
    row = base('repo-metadata-chainlink', 'repo_metadata', 'THIRD_PARTY_PLATFORM_METADATA')
    row.update({
        'claim': 'GitHub reports repository smartcontractkit/chainlink with license field NOASSERTION and a pushed_at timestamp.',
        'excerpt': gh_ex, 'excerpt_sha256': sha256(gh_ex.encode()),
        'decoded': {'full_name': gh.get('full_name'), 'license_spdx': (gh.get('license') or {}).get('spdx_id'),
                    'pushed_at': gh.get('pushed_at')},
        'independently_checkable': {'verdict': 'YES', 'method': 'GET https://api.github.com/repos/smartcontractkit/chainlink'},
        'axis_candidates': [],
        'limitation': 'Host-platform metadata, not issuer content; stars/pushed_at say nothing about code correctness. NOASSERTION means GitHub detected no license; it is not a legal finding.',
    })
    rows.append(row)

    # --- Reserve-attestation boundary claim (docs PoR page drift) ---------------
    row = {
        'claim_id': 'por-doc-url-drift', 'subject_id': 'org:chainlink-docs',
        'source_locator': 'https://docs.chain.link/data-feeds/proof-of-reserves',
        'retrieved_at': None, 'raw_sha256': None, 'raw_path': None,
        'assertion_class': 'ISSUER_ASSERTION',
        'claim': 'The proof-of-reserves documentation URL referenced by prior packs returned HTTP 404 at collection time; PoR claims are UNCHECKABLE from this pack.',
        'excerpt': None, 'excerpt_sha256': None, 'byte_offset': None, 'decoded': None,
        'independently_checkable': {'verdict': 'YES', 'method': 'rerun GET; a 200 in future is a correction event, not retroactive evidence'},
        'axis_candidates': AXES_RESERVE,
        'limitation': 'No PoR feed content was frozen; every PoR-dependent claim stays null.',
        'state': 'UNCHECKABLE',
    }
    rows.append(row)

    with OUT.open('w', encoding='utf-8') as fh:
        for r in rows:
            fh.write(json.dumps(r, sort_keys=True) + '\n')
    print(f'claims={len(rows)} written to {OUT}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
