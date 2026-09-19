#!/usr/bin/env python3
"""Offline integration of existing CSOAI readers and retained collector receipts.

No collector, policy engine, scheduler or identity provider is installed here.
The bundle is an operator-authored input, not a document fetched from the web.
Use isolated read-only inputs. Output remains internal and unsigned. No semantic
correctness, verified receipt origin or legal conclusion is inferred from hashes.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
from typing import Any
import claim_maintenance as cm

SCHEMA = 'csoai.retained-review-input/0.1'
LIMIT = 32

def read_local(root: Path, relative: str, limit: int = cm.MAX_BYTES) -> bytes:
    if not isinstance(relative, str) or not relative:
        raise cm.ContractError('RELATIVE_FILE_REQUIRED')
    p = Path(relative)
    if p.is_absolute() or any(x in ('.', '..') for x in p.parts):
        raise cm.ContractError('INPUT_PATH_ESCAPE')
    base = root.resolve(strict=True)
    target = base
    for part in p.parts:
        target = target / part
        if target.is_symlink():
            raise cm.ContractError('INPUT_SYMLINK_REFUSED')
    if not target.resolve(strict=True).is_relative_to(base):
        raise cm.ContractError('INPUT_PATH_ESCAPE')
    # Caller must supply an immutable/read-only input mount. These checks are not
    # a race-proof filesystem sandbox against a malicious concurrent local user.
    with target.open('rb') as stream:
        body = stream.read(limit + 1)
    if len(body) > limit:
        raise cm.ContractError('INPUT_SIZE_LIMIT')
    return body

def strict_keys(obj: Any, keys: set[str], error: str) -> None:
    if not isinstance(obj, dict) or set(obj) != keys:
        raise cm.ContractError(error)

def validate_rows(body: bytes) -> None:
    data = cm.load_json(body)
    if not isinstance(data, dict) or not isinstance(data.get('corrections'), list):
        raise cm.ContractError('CORRECTIONS_SCHEMA')
    ids = set()
    for row in data['corrections']:
        if not isinstance(row, dict) or not isinstance(row.get('id'), str) or not row['id']:
            raise cm.ContractError('CORRECTION_ROW_SCHEMA')
        if row['id'] in ids:
            raise cm.ContractError('DUPLICATE_CORRECTION_ID')
        ids.add(row['id'])

def capture_state(receipt: Any, body: bytes | None) -> str | None:
    if not isinstance(receipt, dict):
        raise cm.ContractError('RECEIPT_OBJECT_REQUIRED')
    if receipt.get('http_status') != 200 or body is None:
        return None  # Existing reader will preserve UNAVAILABLE, redirects or 304.
    if receipt.get('complete_body') is not True:
        return 'INCOMPLETE_CAPTURE'
    if type(receipt.get('body_bytes')) is not int or receipt['body_bytes'] != len(body):
        return 'CAPTURE_LENGTH_MISMATCH'
    if cm.read_state(receipt.get('body_sha256'), body) != 'MATCHED_BYTES':
        return 'INTEGRITY_FAILURE'
    return None

def review(bundle: dict, inputs: Path) -> dict:
    strict_keys(bundle, {'schema', 'run_as_of', 'source', 'targets'}, 'BUNDLE_SCHEMA')
    if bundle['schema'] != SCHEMA:
        raise cm.ContractError('BUNDLE_VERSION')
    now = cm.timestamp(bundle['run_as_of'])
    strict_keys(bundle['source'], {'uri', 'body_file', 'receipt_file'}, 'SOURCE_SCHEMA')
    source = bundle['source']
    if not isinstance(source['uri'], str) or not source['uri'].startswith('https://'):
        raise cm.ContractError('SOURCE_URI_REQUIRED')
    body = read_local(inputs, source['body_file'])
    source_receipt_raw = read_local(inputs, source['receipt_file'])
    receipt = cm.load_json(source_receipt_raw)
    state = capture_state(receipt, body)
    if state or receipt.get('http_status') != 200:
        raise cm.ContractError(state or 'SOURCE_UNAVAILABLE')
    if receipt.get('requested_uri') != source['uri'] or receipt.get('final_uri') != source['uri']:
        raise cm.ContractError('SOURCE_IDENTITY_MISMATCH')
    if cm.timestamp(receipt.get('observed_at')) > now:
        raise cm.ContractError('SOURCE_OBSERVATION_IN_FUTURE')
    validate_rows(body)  # Validate the complete input before mutating a graph.
    targets = bundle['targets']
    if not isinstance(targets, list) or len(targets) > LIMIT:
        raise cm.ContractError('TARGET_BOUND_EXCEEDED')
    result = []
    for target in targets:
        strict_keys(target, {'contract', 'body_file', 'receipt_file'}, 'TARGET_SCHEMA')
        contract = target['contract']
        if not isinstance(contract, dict) or contract.get('corrected_source_sha256') != cm.digest(body):
            raise cm.ContractError('CORRECTION_SOURCE_NOT_BOUND')
        raw_receipt = read_local(inputs, target['receipt_file'])
        target_receipt = cm.load_json(raw_receipt)
        target_body = None if target['body_file'] is None else read_local(inputs, target['body_file'])
        extra_state = capture_state(target_receipt, target_body)
        # Validate the normal contract even if the collector capture was incomplete.
        row = cm.check_readback(contract, target_receipt, target_body, now=bundle['run_as_of'])
        if extra_state:
            row['state'] = extra_state
        row['contract_sha256'] = cm.digest(cm.canonical(contract))
        row['receipt_sha256'] = cm.digest(raw_receipt)
        row['input_body_sha256'] = None if target_body is None else cm.digest(target_body)
        result.append(row)
    summary = cm.propagation_summary(result)
    graph = cm.ClaimGraph()
    imported = cm.import_corrections(graph, body, source['uri'], receipt['observed_at'])
    return {'schema': 'csoai.retained-review-output/0.1', 'as_of': bundle['run_as_of'],
            'state': 'OFFLINE_REVIEW_COMPLETE', 'source': {
                'uri': source['uri'], 'observed_at': receipt['observed_at'],
                'body_sha256': cm.digest(body), 'receipt_sha256': cm.digest(source_receipt_raw),
                'basis': 'RETAINED_COLLECTOR_RECEIPT_NOT_AUTHENTICATED_BY_THIS_PLUGIN'},
            'import': imported, 'readbacks': result, 'propagation': summary,
            'graph': graph.export(), 'provenance': graph.prov_export(public_only=False),
            'network_calls': 0, 'new_external_measurements': 0,
            'fresh_collections_performed': 0, 'execution_authorized': False,
            'publication_authorized': False, 'signature_state': 'UNSIGNED',
            'data_visibility': 'INTERNAL', 'receipt_origin_authenticated': False,
            'source_statements_independently_reproduced': False}

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bundle', type=Path, required=True)
    parser.add_argument('--inputs', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    try:
        bundle = cm.load_json(read_local(args.bundle.parent, args.bundle.name))
        report = review(bundle, args.inputs)
        args.output.mkdir(parents=True, exist_ok=False)
        (args.output / 'review.json').write_text(json.dumps(report, indent=2) + '\n')
        (args.output / 'review.html').write_text(cm.render_report(report))
        print(json.dumps({'state': report['state'], 'imported_statements': report['import']['imported_statements'],
                          'declared_targets': report['propagation']['declared_targets'],
                          'unresolved_targets': report['propagation']['unresolved_targets'],
                          'production_changed': False}))
        return 0
    except (cm.ContractError, OSError, ValueError, TypeError, KeyError) as exc:
        print(json.dumps({'state': 'ERROR', 'reason': str(exc)}))
        return 2

if __name__ == '__main__':
    raise SystemExit(main())
