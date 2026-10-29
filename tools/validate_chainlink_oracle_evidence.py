#!/usr/bin/env python3
"""Validate the Chainlink oracle-boundary candidate pack (2026-09-20 register).

Asserts, without any network access, signing, or publishing:
  - canary subjects present, status CANDIDATE_UNMEASURED, no promoted proof or
    distribution state;
  - every OBSERVED observation's sha256 recomputes from its raw bin;
  - every claims JSONL row has provenance, a hash chain into the observations,
    an excerpt hash, an assertion class, and axis candidates that exist on the
    canonical 23-axis index;
  - vectors carry falsification conditions and the six named negative
    boundaries;
  - instrument proposal references existing axes only and proposes no new axis;
  - no proof layer is marked signed/valid.
Exit 0 = PASS. Any failure raises.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

REG = Path('measurement/registers/2026-09-20')
AXIS_INDEX = Path('public/interop/canonical-23-axis-index-v0.1.json')


def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def main() -> int:
    slugs = {a['axis'] for a in json.loads(AXIS_INDEX.read_text())['axes']}
    assert len(slugs) == 23, f'expected 23 axis slugs, got {len(slugs)}'

    canary = json.loads((REG / 'chainlink-oracle-evidence-canary.json').read_text())
    assert canary['schema'] == 'csoai.chainlink-oracle-evidence-canary/0.1'
    assert canary['status'] == 'CANDIDATE_UNMEASURED'
    subjects = {s['subject_id']: s for s in canary['subjects']}
    assert set(subjects) == {'feed:eth-usd-ethereum-mainnet', 'org:chainlink-docs',
                             'org:chainlink-repo', 'org:chainlink-status'}
    for s in subjects.values():
        assert s['distribution_state'] == 'LOCAL_DRAFT_ONLY'
        assert all(v in {'PENDING', 'UNCHECKABLE'} for v in s['proof_state'].values())

    obs_doc = json.loads((REG / 'chainlink-oracle-source-observations.json').read_text())
    obs_by_hash: dict[str, dict] = {}
    uncheckable = 0
    for o in obs_doc['observations']:
        if o['state'] == 'OBSERVED_NOT_YET_ACCEPTED':
            raw = Path(o['raw_path']).read_bytes()
            assert sha256(raw) == o['sha256'], f"hash mismatch: {o['kind']}"
            obs_by_hash[o['sha256']] = o
        else:
            assert o['state'] == 'UNCHECKABLE' and 'error_type' in o
            assert 'sha256' not in o
            uncheckable += 1
    assert uncheckable >= 1, 'failure observations must be preserved, not dropped'

    rows = [json.loads(line) for line in (REG / 'chainlink-oracle-claims.jsonl').read_text().splitlines() if line.strip()]
    assert len(rows) >= 10
    ids = set()
    for r in rows:
        ids.add(r['claim_id'])
        assert r['source_locator'] and r['assertion_class'] in {
            'ISSUER_ASSERTION', 'ON_CHAIN_OBSERVATION', 'THIRD_PARTY_PLATFORM_METADATA'}
        assert r['independently_checkable']['verdict'] in {'YES', 'PARTIAL', 'NO'}
        assert set(r['axis_candidates']) <= slugs, f"unknown axis in {r['claim_id']}"
        if r['state'] == 'OBSERVED_NOT_YET_ACCEPTED':
            assert r['raw_sha256'] in obs_by_hash, f"claim {r['claim_id']} not chained to an observation"
            assert r['excerpt'] is not None
            assert sha256(r['excerpt'].encode()) == r['excerpt_sha256'], f"excerpt hash mismatch: {r['claim_id']}"
        else:
            assert r['state'] == 'UNCHECKABLE' and r['excerpt'] is None and r['raw_sha256'] is None
    assert len(ids) == len(rows), 'duplicate claim_id'

    vectors = json.loads((REG / 'chainlink-oracle-vectors.json').read_text())
    assert vectors['status'] == 'CANDIDATE_UNMEASURED'
    needed = {'NEG-01-stale-data', 'NEG-02-wrong-feed', 'NEG-03-wrong-chain',
              'NEG-04-missing-round-metadata', 'NEG-05-divergent-venue-inputs',
              'NEG-06-valid-signature-false-assertion'}
    have = {v['vector_id'] for v in vectors['vectors']}
    assert needed <= have, f'missing negative vectors: {needed - have}'
    for v in vectors['vectors']:
        assert v['falsification_condition'], f"no falsification condition: {v['vector_id']}"
        assert v['expected_instrument_verdict']

    inst = json.loads((REG / 'chainlink-oracle-instrument-proposal.json').read_text())
    assert inst['status'] == 'CANDIDATE_UNMEASURED'
    mapped = {m['axis'] for m in inst['axis_mapping']} | {a['axis'] for a in inst['axes_considered_and_rejected']}
    assert mapped <= slugs, f'instrument references unknown axes: {mapped - slugs}'
    assert inst['denominator_proposal']['minimum_n'] >= 30

    proof = json.loads((REG / 'chainlink-oracle-proof-attempts.json').read_text())
    claims_bytes = (REG / 'chainlink-oracle-claims.jsonl').read_bytes()
    assert proof['artifact_sha256'] == sha256(claims_bytes), 'proof-attempts artifact hash stale'
    for a in proof['attempts']:
        assert a['state'] in {'NOT_ATTEMPTED', 'BLOCKED'}, f"proof layer promoted: {a['layer']}"

    # --- feed bank (denominator) ---
    manifest = json.loads((REG / 'chainlink-feed-bank-manifest.json').read_text())
    bank_bytes = (REG / 'chainlink-feed-bank.jsonl').read_bytes()
    assert manifest['bank_sha256'] == sha256(bank_bytes), 'bank manifest hash stale'
    bank_rows = [json.loads(l) for l in bank_bytes.decode().splitlines() if l.strip()]
    c = manifest['counts']
    assert c['bank_rows'] == len(bank_rows), 'bank row count drift'
    assert c['entries_with_proxy'] == c['bank_rows'] + c['excluded_wrong_chain'] \
        + c['excluded_testnet_marker'] + c['excluded_duplicate_proxy'], 'filter stages do not reconcile'
    assert all(r['blockchainName'] == 'Ethereum' for r in bank_rows)
    assert len({r['proxyAddress'].lower() for r in bank_rows}) == len(bank_rows), 'duplicate proxy in bank'
    assert any(r['proxyAddress'] == '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419' for r in bank_rows)
    assert inst['denominator_proposal']['bank_sha256'] == manifest['bank_sha256'], 'instrument bank hash drift'
    assert inst['denominator_proposal']['n'] == len(bank_rows), 'instrument n drift'

    # --- cross-RPC replay ---
    replay = json.loads((REG / 'chainlink-cross-rpc-replay.json').read_text())
    assert replay['overall'] in {'PASS', 'FAIL', 'UNCHECKABLE'}
    assert any(s['state'] == 'UNCHECKABLE' for s in replay['steps']), 'endpoint failure must be preserved'
    gaps = json.loads((REG / 'chainlink-oracle-gaps-rejections.json').read_text())
    g07 = next(g for g in gaps['gaps'] if g['gap_id'] == 'GAP-07-single-rpc-seat')
    assert g07['state'] == 'CLOSED_AT_ENDPOINT_LEVEL' and 'residual' in g07['detail'].lower()

    # --- grader smoke ---
    smoke = json.loads((REG / 'chainlink-grader-smoke-eth-usd.json').read_text())
    assert smoke['smoke_test'] is True and smoke['not_a_measurement_run'] is True
    assert smoke['price_truth'] == 'UNMEASURED' and smoke['risk_verdict_status'] == 'UNMEASURED'
    assert smoke['grader_sha256'] == sha256(Path('tools/grade_chainlink_oracle_boundary.py').read_bytes()), \
        'grader hash drift: re-run --smoke after editing the grader'
    assert {f['row_id'] for f in smoke['control_facts']} == {
        'ob-identity-triple', 'ob-decimals', 'ob-freshness', 'ob-round-metadata', 'ob-registry-agreement'}
    assert all(f['verdict'] in {'PASS', 'FAIL', 'UNCHECKABLE'} for f in smoke['control_facts'])

    # --- full-bank candidate run (unsigned) ---
    run = json.loads((REG / 'chainlink-oracle-boundary-run-unsigned.json').read_text())
    assert run['status'] == 'CANDIDATE_UNMEASURED' and run['candidate_run'] is True
    assert run['run_attestation'] == 'CONTENT_ADDRESSED_UNSIGNED'
    assert 'sig_ed25519' not in run and run['signing'] == 'disabled' and run['publication'] == 'disabled'
    cid = run['content_id']
    run_nulled = {**run, 'content_id': None}
    assert cid == hashlib.sha256(
        json.dumps(run_nulled, sort_keys=True, separators=(',', ':')).encode()).hexdigest(), 'content_id mismatch'
    assert run['denominator'] == {'bank_n': len(bank_rows), 'attempted': len(bank_rows), 'reconciled': True}
    assert run['bank']['sha256'] == sha256(bank_bytes)
    rb_bytes = (REG / 'chainlink-bank-readbacks.json').read_bytes()
    assert run['readbacks']['sha256'] == sha256(rb_bytes)
    rb_doc = json.loads(rb_bytes)
    assert rb_doc['n_feeds'] == len(bank_rows)
    for row_id, bucket in run['fact_counts'].items():
        assert sum(bucket.values()) == len(bank_rows), f'fact count drift: {row_id}'
    assert run['price_truth'] == 'UNMEASURED' and run['risk_verdict_status'] == 'UNMEASURED'
    assert run['grader']['sha256'] == sha256(Path('tools/grade_chainlink_oracle_boundary.py').read_bytes())

    # --- staged card atom (unsigned; board signer path only) ---
    import sys as _sys
    _sys.path.insert(0, 'scripts/adapters')
    from staged_leaves import STAGED_DIRS, _check  # noqa
    assert 'chainlink-oracle-boundary-2026-09' in STAGED_DIRS, 'staging dir not enumerated'
    atom = json.loads(Path('public/interop/chainlink-oracle-boundary-2026-09/'
                           'card-oracle-boundary-ethereum-mainnet-unsigned.json').read_text())
    assert _check(atom) is None, f'staged atom rejected by adapter: {_check(atom)}'
    assert atom['sig_ed25519'] is None, 'staged atom must be unsigned'
    assert atom['payload']['run_content_id'] == cid, 'staged atom does not point at the current run'
    assert atom['payload']['bank_sha256'] == manifest['bank_sha256'], 'staged atom bank hash drift'
    assert atom['payload']['state'] == 'PROBED'

    print(f'PASS: {len(subjects)} subjects, {len(obs_by_hash)} observed + {uncheckable} uncheckable observations, '
          f'{len(rows)} claims, {len(have)} vectors, instrument on {len(inst["axis_mapping"])} existing axes, '
          f'bank n={len(bank_rows)}, replay {replay["overall"]}, smoke graded, '
          f'candidate run {cid[:12]}… unsigned, atom staged unsigned; '
          'nothing signed, nothing published, status CANDIDATE_UNMEASURED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
