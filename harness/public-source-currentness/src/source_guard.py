"""Bounded diagnostic over a fixed public-source lock. No network or authority.
The caller supplies the lock through its trusted deployment, NOT the request.
"""
import base64
import hashlib
import math
import re

HEX40 = re.compile(r'^[0-9a-f]{40}$')
HEX64 = re.compile(r'^[0-9a-f]{64}$')
LOCK_KEYS = {'target', 'repository', 'path', 'approved_revision', 'approved_sha256',
             'max_source_bytes', 'valid_until_ms'}
MAX_SAFE = 9007199254740991

def integer(x):
    return type(x) in (int, float) and 0 <= x <= MAX_SAFE and x == int(x)

def validate_lock(lock):
    if not isinstance(lock, dict) or set(lock) != LOCK_KEYS:
        raise ValueError('INVALID_OPERATOR_LOCK')
    if lock['target'] != 'specialist-receiver' or lock['repository'] != 'csoai/meok-oowm-hybrid-lab':
        raise ValueError('UNSUPPORTED_FIXED_TARGET')
    if lock['path'] != 'integration-specialist-review/join_assets/harness/component-join-review/receive_artifacts.py':
        raise ValueError('UNSUPPORTED_FIXED_PATH')
    if not isinstance(lock['approved_revision'], str) or not HEX40.fullmatch(lock['approved_revision']):
        raise ValueError('INVALID_REVIEW_REVISION')
    if not isinstance(lock['approved_sha256'], str) or not HEX64.fullmatch(lock['approved_sha256']):
        raise ValueError('INVALID_REVIEW_DIGEST')
    if not integer(lock['max_source_bytes']) or not 1 <= lock['max_source_bytes'] <= 65536:
        raise ValueError('INVALID_SOURCE_BOUND')
    if not integer(lock['valid_until_ms']):
        raise ValueError('INVALID_LOCK_EXPIRY')

def assess(lock, observation, now_ms):
    """For tests/replay; the live Worker obtains its own clock and observations.
    MATCH means selected bytes matched at observation, not a durable permission.
    """
    validate_lock(lock)
    if not integer(now_ms):
        raise ValueError('INVALID_RECEIVER_CLOCK')
    base = {'target': lock['target'], 'scope': 'PUBLIC_REPOSITORY_SOURCE_BYTES_ONLY',
            'source_truth_established': False, 'runtime_deployment_verified': False,
            'execution_authorized': False, 'gspc_admitted': False, 'signature': None,
            'checked_at_ms': now_ms, 'approved_sha256': lock['approved_sha256']}
    def result(state, reason, **more):
        return {**base, 'state': state, 'reason': reason, **more}
    if now_ms >= lock['valid_until_ms']:
        return result('HOLD', 'OPERATOR_LOCK_EXPIRED')
    if not isinstance(observation, dict) or set(observation) != {'started_ms', 'finished_ms', 'before', 'source', 'after'}:
        return result('UNKNOWN', 'INCOMPLETE_OBSERVATION')
    start, end = observation['started_ms'], observation['finished_ms']
    if not integer(start) or not integer(end) or not start <= end <= now_ms:
        return result('UNKNOWN', 'INVALID_OBSERVATION_CLOCK')
    if end - start > 15000:
        return result('UNKNOWN', 'READ_DEADLINE_EXCEEDED')
    if now_ms - end > 5000:
        return result('UNKNOWN', 'OBSERVATION_TOO_OLD')
    for name in ('before', 'source', 'after'):
        obj = observation[name]
        if not isinstance(obj, dict):
            return result('UNKNOWN', 'INCOMPLETE_OBSERVATION')
        if not integer(obj.get('status')) or obj['status'] != 200:
            return result('UNKNOWN', 'UPSTREAM_NOT_200')
        if obj.get('redirected') is not False:
            return result('UNKNOWN', 'REDIRECT_OR_UNKNOWN_ROUTE')
        age = obj.get('age_seconds')
        if age is not None and (not integer(age) or age != 0):
            return result('UNKNOWN', 'CACHED_OR_INVALID_AGE')
        if not isinstance(obj.get('revision'), str) or not HEX40.fullmatch(obj['revision']):
            return result('UNKNOWN', 'INVALID_UPSTREAM_REVISION')
    before, source, after = (observation[x] for x in ('before', 'source', 'after'))
    if before['revision'] != after['revision']:
        return result('UNKNOWN', 'SOURCE_MOVED_DURING_READ')
    if source['revision'] != before['revision']:
        return result('UNKNOWN', 'SOURCE_REVISION_MISMATCH')
    if source.get('complete') is not True:
        return result('UNKNOWN', 'INCOMPLETE_SOURCE_BYTES')
    encoded = source.get('body_base64')
    if not isinstance(encoded, str) or len(encoded) > 87384:
        return result('UNKNOWN', 'INVALID_SOURCE_ENCODING')
    try:
        raw = base64.b64decode(encoded, validate=True)
        if base64.b64encode(raw).decode() != encoded:
            raise ValueError('NONCANONICAL_BASE64')
    except (ValueError, TypeError):
        return result('UNKNOWN', 'INVALID_SOURCE_ENCODING')
    if not 1 <= len(raw) <= lock['max_source_bytes']:
        return result('UNKNOWN', 'SOURCE_SIZE_BOUND')
    actual = hashlib.sha256(raw).hexdigest()
    if actual != lock['approved_sha256']:
        return result('HOLD', 'APPROVED_BYTES_CHANGED', observed_sha256=actual,
                      observed_revision=before['revision'], source_bytes=len(raw))
    return result('MATCH_AT_OBSERVATION', 'APPROVED_BYTES_MATCH', observed_sha256=actual,
                  observed_revision=before['revision'], source_bytes=len(raw),
                  head_changed_since_review=before['revision'] != lock['approved_revision'])
