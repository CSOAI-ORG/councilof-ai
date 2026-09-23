#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Read public CSOAI evidence without a wallet, API key, GPU or downloaded-code execution.
Checks exact published bytes. It does not establish source truth, payment, independent
publisher identity, signature validity or Bitcoin confirmation. Python 3.9+; stdlib only.
"""
from __future__ import annotations
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
import re
import sys
import urllib.parse
import urllib.request

HF_BASE = 'https://huggingface.co/datasets/csoai/councilof-ai-mirror/resolve/'
CAPTURE_POINTER = HF_BASE + 'main/claim-capture/latest.json'
OPERATIONS_POINTER = HF_BASE + 'main/operations/claim-maintenance/latest.json'
HEX64 = re.compile(r'^[0-9a-f]{64}$')
HEX40 = re.compile(r'^[0-9a-f]{40}$')
POPULATIONS = ('stablecoins', 'protocols', 'mcp_versions', 'x402_services')
MAX_BYTES = 8_000_000
UA = 'CSOAI-Public-Consumer/1.0 (+https://councilof.ai)'

class EvidenceError(ValueError):
    """A contract or integrity check failed; do not promote to verified."""

def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()

def encoded(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False).encode()

def strict_json(raw: bytes):
    def pairs(items):
        out = {}
        for k, v in items:
            if k in out:
                raise EvidenceError('Duplicate JSON member')
            out[k] = v
        return out
    def constant(value):
        raise EvidenceError('Non-finite JSON value')
    try:
        return json.loads(raw, object_pairs_hook=pairs, parse_constant=constant)
    except (UnicodeDecodeError, json.JSONDecodeError) as e:
        raise EvidenceError('Response is not valid UTF-8 JSON') from e

def checked_url(url: str, revision: str | None = None) -> str:
    if not isinstance(url, str) or len(url) > 2000 or not url.startswith(HF_BASE):
        raise EvidenceError('URL is outside the owned public mirror')
    parsed = urllib.parse.urlsplit(url)
    if parsed.query or parsed.fragment or '%' in parsed.path or '\\' in parsed.path:
        raise EvidenceError('URL has an unexpected query, escape or fragment')
    suffix = url[len(HF_BASE):]
    parts = suffix.split('/')
    if any(x in ('', '.', '..') for x in parts):
        raise EvidenceError('Unsafe URL path')
    if parts[0] == 'main':
        if revision is not None or url not in (CAPTURE_POINTER, OPERATIONS_POINTER):
            raise EvidenceError('Only the two discovery pointers may be mutable')
    elif not HEX40.fullmatch(parts[0]) or revision is not None and parts[0] != revision:
        raise EvidenceError('Immutable revision mismatch')
    if len(parts) < 3 or parts[1] not in ('claim-capture', 'operations'):
        raise EvidenceError('Unknown public release family')
    return url

class MirrorRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        # These bounded JSON artifacts normally remain on huggingface.co. Refuse
        # an unexpected host rather than following arbitrary dataset content.
        u = urllib.parse.urlsplit(newurl)
        if u.scheme != 'https' or u.hostname != 'huggingface.co' or u.username or u.password:
            raise EvidenceError('Unexpected download redirect; inspect it separately')
        return super().redirect_request(req, fp, code, msg, headers, newurl)

def fetch(url: str) -> bytes:
    checked_url(url)
    request = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json', 'Accept-Encoding': 'identity'})
    with urllib.request.build_opener(MirrorRedirect()).open(request, timeout=25) as response:
        raw = response.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise EvidenceError('Public artifact exceeds the download budget')
    return raw

def equal_bytes(raw: bytes, digest: str, length=None) -> None:
    if not isinstance(digest, str) or not HEX64.fullmatch(digest) or sha(raw) != digest:
        raise EvidenceError('SHA-256 mismatch')
    if length is not None and (type(length) is not int or length < 0 or len(raw) != length):
        raise EvidenceError('Byte length mismatch')

def freshness(as_of: str, max_age_hours: float, now: dt.datetime | None = None) -> dict:
    if not isinstance(as_of, str):
        raise EvidenceError('Source observation date is missing')
    try:
        observed = dt.datetime.fromisoformat(as_of.replace('Z', '+00:00'))
    except ValueError as e:
        raise EvidenceError('Invalid source date') from e
    if observed.tzinfo is None:
        raise EvidenceError('Source date lacks timezone')
    age = ((now or dt.datetime.now(dt.timezone.utc)) - observed).total_seconds() / 3600
    if age < -5 / 60:
        raise EvidenceError('Observation time is in the future')
    if not 0 < max_age_hours <= 24 * 366:
        raise EvidenceError('Invalid consumer freshness budget')
    return {'as_of': as_of, 'age_hours': round(max(0, age), 3), 'consumer_max_age_hours': max_age_hours,
            'state': 'WITHIN_CONSUMER_WINDOW' if age <= max_age_hours else 'STALE_FOR_CONSUMER'}

def pointer_manifest(pointer_url: str, schema: str, manifest_field: str, fetcher=fetch):
    p = strict_json(fetcher(checked_url(pointer_url)))
    if not isinstance(p, dict) or p.get('schema') != schema or not HEX40.fullmatch(str(p.get('hf_commit', ''))):
        raise EvidenceError('Unexpected discovery pointer')
    url = checked_url(p.get(manifest_field), p['hf_commit'])
    raw = fetcher(url)
    equal_bytes(raw, p.get('release_sha256'))
    m = strict_json(raw)
    if not isinstance(m, dict) or not isinstance(m.get('files'), dict):
        raise EvidenceError('Manifest has no file map')
    for name, info in m['files'].items():
        if not isinstance(info, dict) or not HEX64.fullmatch(str(info.get('sha256', ''))) or type(info.get('bytes')) is not int or info['bytes'] < 0:
            raise EvidenceError('Invalid file-map digest or byte count')
    return p, m, url

def read_operations(max_age_hours=6.0, fetcher=fetch) -> tuple[dict, bytes]:
    p, m, manifest_url = pointer_manifest(OPERATIONS_POINTER, 'csoai.operations-pointer/0.1', 'manifest_url', fetcher)
    if m.get('schema') != 'csoai.operations-release/0.1':
        raise EvidenceError('Unsupported operational release schema')
    status_url = checked_url(p.get('status_url'), p['hf_commit'])
    if status_url != manifest_url.rsplit('/', 1)[0] + '/status.json':
        raise EvidenceError('Status is not beside the pinned manifest')
    raw = fetcher(status_url)
    meta = m['files'].get('status.json', {})
    equal_bytes(raw, meta.get('sha256'), meta.get('bytes'))
    status = strict_json(raw)
    if status.get('schema') != 'csoai.overnight-status/0.2' or p.get('as_of') != status.get('as_of') or m.get('as_of') != status.get('as_of'):
        raise EvidenceError('Operational date or schema mismatch')
    result = {'schema': 'csoai.public-consumer-result/1.0', 'verdict': 'CONTENT_HASHES_VERIFIED', 'family': 'operations',
              'manifest_url': manifest_url, 'manifest_sha256': p['release_sha256'], 'artifact_url': status_url,
              'source_freshness': freshness(status['as_of'], max_age_hours), 'reported_operational_state': status.get('status'),
              'producer_observations': status.get('sources', {}), 'requests_required': 3, **boundaries()}
    return result, raw

def read_population(population='stablecoins', max_age_hours=48.0, fetcher=fetch) -> tuple[dict, bytes]:
    if population not in POPULATIONS:
        raise EvidenceError('Unknown population')
    p, m, manifest_url = pointer_manifest(CAPTURE_POINTER, 'csoai.claim-capture-pointer/0.1', 'release_url', fetcher)
    if m.get('schema') != 'csoai.claim-capture-release/0.1' or p.get('run_id') != m.get('run_id'):
        raise EvidenceError('Capture revision mismatch')
    info = m.get('populations', {}).get(population)
    if not isinstance(info, dict) or not re.fullmatch(r'runs/[0-9TZ]+/populations/[a-z_]+\.json', str(info.get('path'))):
        raise EvidenceError('Unsafe or absent population artifact')
    if info['path'] != 'runs/' + m['run_id'] + '/populations/' + population + '.json':
        raise EvidenceError('Population path does not match its declared identity')
    artifact_url = manifest_url.rsplit('/', 1)[0] + '/' + info['path']
    checked_url(artifact_url, p['hf_commit'])
    raw = fetcher(artifact_url)
    meta = m['files'].get(info['path'], {})
    equal_bytes(raw, meta.get('sha256'), meta.get('bytes'))
    if info.get('sha256') != meta.get('sha256'):
        raise EvidenceError('Population metadata and file manifest disagree')
    doc = strict_json(raw)
    if doc.get('schema') != 'csoai.claim-population-slice/0.1' or doc.get('population') != population or doc.get('run_id') != m['run_id']:
        raise EvidenceError('Population identity mismatch')
    rows = doc.get('records')
    if not isinstance(rows, list) or type(doc.get('count')) is not int or len(rows) != doc['count'] or info.get('count') != doc['count']:
        raise EvidenceError('Population count mismatch')
    if doc.get('as_of') != info.get('as_of') or doc.get('coverage') != info.get('coverage') or doc.get('unique_entities') != info.get('unique_entities'):
        raise EvidenceError('Coverage or date differs from the manifest')
    identifiers = set()
    for row in rows:
        if row.get('population') != population or not isinstance(row.get('subject_id'), str) or row.get('state') != 'CLAIM_CAPTURED':
            raise EvidenceError('Unexpected claim row')
        identity = row['subject_id']
        if identity in identifiers:
            raise EvidenceError('Duplicate identity')
        identifiers.add(identity)
        core = {k: row[k] for k in ('population', 'subject_id', 'claim')}
        equal_bytes(encoded(core), row.get('content_sha256'))
    if len({r.get('entity_id') for r in rows}) != doc.get('unique_entities'):
        raise EvidenceError('Distinct entity count mismatch')
    result = {'schema': 'csoai.public-consumer-result/1.0', 'verdict': 'CONTENT_HASHES_VERIFIED', 'family': 'capture',
              'population': population, 'records': len(rows), 'unique_entities': doc['unique_entities'],
              'coverage': doc['coverage'], 'source_freshness': freshness(doc['as_of'], max_age_hours),
              'manifest_url': manifest_url, 'manifest_sha256': p['release_sha256'], 'artifact_url': artifact_url,
              'artifact_sha256': meta['sha256'], 'requests_required': 3, 'new_measurements_performed': 0,
              'not_the_frozen_paid_product': True, **boundaries()}
    return result, raw

def boundaries():
    return {'assurance_scope': 'Checks consistency with a same-publisher manifest obtained over HTTPS; not independent publisher authentication.',
            'signature_checked': False, 'bitcoin_chain_checked': False, 'merkle_inclusion_checked': False,
            'source_truth_checked': False, 'payment_made': False, 'remote_code_executed': False}

def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('family', choices=('operations', 'population'), nargs='?', default='operations')
    parser.add_argument('--population', choices=POPULATIONS, default='stablecoins')
    parser.add_argument('--max-age-hours', type=float)
    parser.add_argument('--output', type=Path, help='New directory for the checked artifact and result; never overwrites an existing directory')
    args = parser.parse_args(argv)
    maximum = args.max_age_hours if args.max_age_hours is not None else (6 if args.family == 'operations' else 48)
    if not 0 < maximum <= 24 * 366:
        parser.error('--max-age-hours must be positive and no more than one year')
    result, artifact = read_operations(maximum) if args.family == 'operations' else read_population(args.population, maximum)
    if args.output:
        args.output.mkdir(parents=True, exist_ok=False)
        (args.output / 'artifact.json').write_bytes(artifact)
        (args.output / 'verification.json').write_bytes(encoded(result) + b'\n')
    print(json.dumps(result, indent=2))
    return 0 if result['source_freshness']['state'] == 'WITHIN_CONSUMER_WINDOW' else 3

if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as e:
        print(json.dumps({'verdict': 'NOT_VERIFIED', 'error_type': type(e).__name__, 'detail': str(e)[:240]}), file=sys.stderr)
        sys.exit(2)
