"""Byte-bound receiver for the existing specialist-join research lane.

No network, inference, arbitrary file access, signing, publication or action tools.
The calling owner must supply trusted expected digests and current context.
A checksum confirms bytes, not source truth, principal identity or permission.
"""
from __future__ import annotations
import datetime as dt
import hashlib
import importlib.util
import json
from pathlib import Path
from typing import Any

from join_contract import FIELDS, HEX, MAX_BYTES, MAX_COMPONENTS, digest, join, loads

PIN_FIELDS = {'component_id', 'revision', 'result_sha256'}
PAYLOAD_FIELDS = FIELDS - {'result_sha256'}


def receive(artifacts: list[bytes], pins: list[dict], context: dict, *, now: str,
            weights: list[float] | None = None,
            min_probability: float = .55, min_margin: float = .10) -> dict:
    """Verify exact artifact bytes and pin identities before the existing join.

    Pins are required inputs from the caller's trust path, not discovered from
    the supplied artifacts. Labels, state and probabilities come from the
    verified bytes. Caller-authentication and current authority stay external.
    """
    if not isinstance(artifacts, list) or not 1 <= len(artifacts) <= MAX_COMPONENTS:
        raise ValueError('ARTIFACT_COUNT')
    if not isinstance(pins, list) or len(pins) != len(artifacts):
        raise ValueError('PIN_COUNT')
    receipts, accepted = [], []
    for raw, pin in zip(artifacts, pins):
        if not isinstance(pin, dict) or set(pin) != PIN_FIELDS:
            raise ValueError('PIN_SHAPE')
        if not isinstance(pin['component_id'], str) or not 1 <= len(pin['component_id']) <= 256:
            raise ValueError('PIN_IDENTITY')
        for field in ['revision', 'result_sha256']:
            if not isinstance(pin[field], str) or not HEX.fullmatch(pin[field]):
                raise ValueError('PIN_DIGEST')
        if not isinstance(raw, bytes) or len(raw) > MAX_BYTES:
            raise ValueError('ARTIFACT_SIZE')
        actual = hashlib.sha256(raw).hexdigest()
        if actual != pin['result_sha256']:
            raise ValueError('ARTIFACT_DIGEST_MISMATCH')
        payload = loads(raw)
        if not isinstance(payload, dict) or set(payload) != PAYLOAD_FIELDS:
            raise ValueError('ARTIFACT_SHAPE')
        for field in ['component_id', 'revision']:
            if payload[field] != pin[field]:
                raise ValueError('PIN_IDENTITY_MISMATCH')
        receipts.append({**payload, 'result_sha256': actual})
        accepted.append({'component_id': pin['component_id'], 'revision': pin['revision'],
                         'sha256': actual, 'bytes': len(raw)})
    review = join(receipts, context, now=now, weights=weights,
                  min_probability=min_probability, min_margin=min_margin)
    result = {
        'kind': 'BYTE_VERIFIED_PREDICTION_JOIN_REVIEW',
        'receiver_revision': 'component-artifact-receiver/1',
        'clock_mode': 'CALLER_SUPPLIED_REPLAY',
        'artifact_manifest': accepted,
        'artifact_manifest_sha256': digest(accepted),
        'join': review,
        'pins_authenticated': False,
        'source_truth_established': False,
        'authorises_execution': False,
        'signature_state': 'UNSIGNED',
        'replies': 'HELD',
    }
    result['receiver_sha256'] = digest(result)
    return result


def review_json(request: str) -> dict:
    """Pure JSON interface suitable for an existing host's typed tool adapter.

    artifact_json entries carry UTF-8 JSON text, never filenames or URLs.
    This is a callable function, not a newly registered server or public endpoint.
    """
    if not isinstance(request, str):
        raise ValueError('REQUEST_TEXT_REQUIRED')
    try:
        raw = request.encode('utf-8')
    except UnicodeError:
        raise ValueError('REQUEST_ENCODING') from None
    data = loads(raw)
    required = {'context', 'pins', 'artifact_json', 'now'}
    optional = {'weights', 'min_probability', 'min_margin'}
    if not isinstance(data, dict) or not required <= set(data) or set(data) - required - optional:
        raise ValueError('REQUEST_SHAPE')
    texts = data['artifact_json']
    if not isinstance(texts, list) or not 1 <= len(texts) <= MAX_COMPONENTS:
        raise ValueError('ARTIFACT_COUNT')
    if any(not isinstance(t, str) for t in texts):
        raise ValueError('ARTIFACT_TEXT_REQUIRED')
    try:
        artifacts = [t.encode('utf-8') for t in texts]
    except UnicodeError:
        raise ValueError('ARTIFACT_ENCODING') from None
    return receive(artifacts, data['pins'], data['context'], now=data['now'],
                   **{key: data[key] for key in optional if key in data})


def review_current_json(request: str) -> dict:
    """Use receiver UTC, never a request-supplied clock, for the callable tool."""
    if not isinstance(request, str):
        raise ValueError('REQUEST_TEXT_REQUIRED')
    try:
        data = loads(request.encode('utf-8'))
    except UnicodeError:
        raise ValueError('REQUEST_ENCODING') from None
    if not isinstance(data, dict) or 'now' in data:
        raise ValueError('REQUEST_CLOCK_FORBIDDEN')
    data['now'] = dt.datetime.now(dt.timezone.utc).isoformat()
    result = review_json(json.dumps(data, allow_nan=False))
    result['clock_mode'] = 'RECEIVER_UTC'
    result['receiver_sha256'] = digest({k:v for k,v in result.items() if k != 'receiver_sha256'})
    return result


def _evidence_module():
    """Load only the existing repository event builder, not an input-chosen path."""
    path = Path(__file__).resolve().parents[2] / 'packages/evidence-fabric/event.py'
    spec = importlib.util.spec_from_file_location('canonical_join_evidence', path)
    if spec is None or spec.loader is None:
        raise RuntimeError('CANONICAL_EVIDENCE_MODULE_UNAVAILABLE')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def evidence_json(request: str, *, current: bool = False) -> dict:
    """Reference the actual receiver result in the existing canonical event.

    PARTIAL means the join ran but truth, independence and authority are not
    established. Predicted probabilities are not exposed as measured value.
    """
    result = review_current_json(request) if current else review_json(request)
    review = result['join']
    E = _evidence_module()
    event = E.build(
        subject={'kind': 'sandbox_run', 'locator': 'urn:csoai:component-join:' + result['receiver_sha256']},
        claim={'text': 'Retained specialist artifact bytes passed the declared compatibility checks.',
               'source_sha256': result['artifact_manifest_sha256'], 'read_at': review['observed_at']},
        method={'id': 'component-artifact-receiver', 'version': '1.0.0', 'holder': 'csoai',
                'code_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},
        declared={'task_id': review['context']['task_id'],
                  'input_sha256': review['context']['input_sha256'],
                  'dependency_root': review['context']['dependency_root']},
        observed={'artifact_manifest': result['artifact_manifest'],
                  'receiver_sha256': result['receiver_sha256'],
                  'review_sha256': review['review_sha256'],
                  'prediction_state': review['state'],
                  'clock_mode': result['clock_mode'],
                  'authorises_execution': False, 'replies': 'HELD'},
        state='PARTIAL', value=None,
        limits=[
            'Byte matching and declared context compatibility do not authenticate the supplied pins or establish source truth.',
            'This records a research receiver result, not a new model measurement, calibrated confidence or independent reproduction.',
            'The existing authenticated owner must check current source state and authority; execution and publication remain held.',
        ],
    )
    E.check_renderable(event)
    return {'receiver': result, 'event': event}


if __name__ == '__main__':
    import sys
    raw = sys.stdin.buffer.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise SystemExit('REQUEST_SIZE')
    try:
        output = evidence_json(raw.decode('utf-8'))
    except (ValueError, TypeError, UnicodeError) as exc:
        raise SystemExit(str(exc)) from None
    print(json.dumps(output, sort_keys=True, allow_nan=False))
