#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Explicit, bounded metadata refresh for existing owned 402 Index listings.

The existing missing-only registration loop keeps its default behaviour. This
mode requires exact selected URLs and --apply; otherwise it only writes a plan.
No wallet, payment, price, ownership token, scheduler or delivery claim is added.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import time
import urllib.error
import urllib.parse
import urllib.request

MANIFEST = 'https://councilof.ai/.well-known/x402.json'
INDEX = 'https://402index.io/api/v1'
BOUND = 1048576
UA = 'Council-402Index-Metadata-Refresh/1.0'
ID = re.compile(r'[0-9a-f-]{36}\Z')

class RefreshError(ValueError):
    pass

def need(condition, reason):
    if not condition:
        raise RefreshError(reason)

def utc():
    return datetime.now(timezone.utc).isoformat()

def digest(value):
    raw = json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()
    return hashlib.sha256(raw).hexdigest()

def owned_url(value):
    if not isinstance(value, str) or len(value) > 2048:
        return False
    try:
        u = urllib.parse.urlsplit(value)
        return (u.scheme == 'https' and u.hostname == 'councilof.ai' and u.port in (None, 443)
                and not u.username and not u.password and not u.fragment
                and u.path.startswith('/api/') and not any(ord(c) < 32 for c in value))
    except ValueError:
        return False

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None

def call(url, body=None):
    """Literal owned manifest or documented directory endpoints, no redirects/retry."""
    allowed = url == MANIFEST or (url.startswith(INDEX + '/services')) or url == INDEX + '/register'
    need(allowed, 'UNEXPECTED_API_ROUTE')
    if body is not None:
        need(url == INDEX + '/register', 'UNEXPECTED_WRITE_ROUTE')
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
    request = urllib.request.Request(url, data=None if body is None else json.dumps(body, allow_nan=False).encode(),
        headers={'User-Agent': UA, 'Accept': 'application/json', 'Accept-Encoding': 'identity',
                 **({'Content-Type': 'application/json'} if body is not None else {})})
    deadline = time.monotonic() + 20
    try:
        try:
            response = opener.open(request, timeout=15)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            status = response.code
            need(response.headers.get('Content-Encoding', 'identity') == 'identity', 'ENCODED_RESPONSE')
            chunks, length = [], 0
            while True:
                need(time.monotonic() < deadline, 'READ_DEADLINE')
                part = response.read1(min(65536, BOUND - length + 1))
                if not part:
                    break
                length += len(part)
                need(length <= BOUND, 'RESPONSE_TOO_LARGE')
                chunks.append(part)
        raw = b''.join(chunks)
        try:
            data = json.loads(raw)
        except (ValueError, UnicodeError):
            raise RefreshError('NON_JSON_RESPONSE') from None
        need(isinstance(data, dict), 'OBJECT_RESPONSE_REQUIRED')
        return status, data, hashlib.sha256(raw).hexdigest()
    except (urllib.error.URLError, TimeoutError, OSError):
        raise RefreshError('TRANSPORT_OUTCOME_UNCONFIRMED; no automatic retry') from None

def read_manifest(client=call):
    status, data, sha = client(MANIFEST)
    need(status == 200, 'MANIFEST_UNAVAILABLE')
    need(isinstance(data.get('resources'), list) and 0 < len(data['resources']) <= 200, 'MANIFEST_SCOPE')
    return data, sha

def read_index(client=call):
    rows, offset, expected_total, ids = [], 0, None, set()
    for _ in range(5):
        status, data, _sha = client(INDEX + f'/services?q=councilof.ai&limit=200&offset={offset}')
        need(status == 200, 'INDEX_UNAVAILABLE')
        total, page = data.get('total'), data.get('services')
        need(type(total) is int and 0 <= total <= 1000, 'INDEX_TOTAL_UNQUALIFIED')
        need(isinstance(page, list) and len(page) <= 200, 'INDEX_PAGE_UNQUALIFIED')
        if expected_total is None:
            expected_total = total
        need(total == expected_total, 'INDEX_CHANGED_DURING_PAGINATION')
        need(bool(page) or offset == total, 'INDEX_INCOMPLETE')
        for item in page:
            need(isinstance(item, dict) and isinstance(item.get('id'), str), 'INDEX_ROW_UNQUALIFIED')
            need(item['id'] not in ids, 'INDEX_DUPLICATE_PAGE_OR_ROW')
            ids.add(item['id'])
        rows.extend(page)
        offset += len(page)
        need(offset <= total, 'INDEX_COUNT_INCONSISTENT')
        if offset == total:
            return rows
    raise RefreshError('INDEX_PAGE_LIMIT; absence not established')

def plan_refresh(manifest, rows, selected, max_changes=3):
    need(type(max_changes) is int and 1 <= max_changes <= 10, 'CHANGE_LIMIT')
    need(isinstance(selected, list) and 0 < len(selected) <= max_changes, 'EXACT_SELECTION_REQUIRED')
    need(len(set(selected)) == len(selected), 'DUPLICATE_SELECTION')
    need(isinstance(manifest, dict) and isinstance(manifest.get('resources'), list), 'MANIFEST_SCOPE')
    need(isinstance(rows, list) and all(isinstance(row, dict) for row in rows), 'INDEX_SCOPE')
    plans = []
    for url in selected:
        need(owned_url(url), 'NOT_AN_OWNED_API_URL')
        matches = [r for r in manifest['resources'] if isinstance(r, dict) and r.get('url') == url]
        need(len(matches) == 1, 'MANIFEST_URL_MISSING_OR_AMBIGUOUS')
        route = matches[0]
        need(route.get('method') == 'GET', 'UNSUPPORTED_METHOD')
        description = route.get('description')
        need(isinstance(description, str) and 1 <= len(description) <= 500, 'CANONICAL_DESCRIPTION_REQUIRED')
        # Never truncate limitations or manufacture/repeat a static monetary offer.
        need(not re.search(r'(?:[$£€]\s*\d|\d(?:\.\d+)?\s*(?:USDC|USD|GBP)\b|current offer)', description, re.I), 'PRICE_IN_DESCRIPTION')
        existing = [r for r in rows if r.get('url') == url and str(r.get('protocol', '')).lower() == 'x402']
        need(len(existing) == 1, 'EXISTING_LISTING_MISSING_OR_AMBIGUOUS')
        old = existing[0]
        need(isinstance(old.get('id'), str) and ID.fullmatch(old['id']) is not None, 'LISTING_ID')
        need(isinstance(old.get('name'), str) and 0 < len(old['name']) <= 80, 'LISTING_NAME')
        if old.get('description') == description:
            continue
        payload = {'url': url, 'name': old['name'], 'protocol': 'x402', 'http_method': 'GET', 'description': description}
        # Preserve these descriptive fields, without setting prices or credentials.
        for key in ('provider', 'category', 'payment_asset', 'payment_network'):
            value = old.get(key)
            if value is not None:
                need(isinstance(value, str) and len(value) <= 200, 'LISTING_METADATA_TYPE')
                payload[key] = value
        plans.append({'url': url, 'listing_id': old['id'], 'before_description': old.get('description'),
                      'before_description_sha256': digest(old.get('description')), 'payload': payload,
                      'reason': 'Existing description differs from current canonical manifest; no new product or price.'})
    return plans

def inspect_after(record, plan):
    identity = record.get('id') == plan['listing_id'] and record.get('url') == plan['url'] and str(record.get('protocol','')).lower() == 'x402'
    metadata = identity and record.get('description') == plan['payload']['description'] and record.get('name') == plan['payload']['name']
    return {'same_listing_identity': identity, 'metadata_matches': metadata,
            'directory_state': record.get('status'), 'active_listing_confirmed': metadata and record.get('status') == 'active'}

def apply_one(plan, client, out):
    # Read the existing exact identity again immediately before a write.
    status, before, before_sha = client(INDEX + '/services/' + plan['listing_id'])
    need(status == 200, 'PREWRITE_READ_UNAVAILABLE')
    need(before.get('id') == plan['listing_id'] and before.get('url') == plan['url']
         and str(before.get('protocol', '')).lower() == 'x402', 'PREWRITE_IDENTITY_CHANGED')
    if before.get('description') == plan['payload']['description']:
        return {'url': plan['url'], 'state': 'ALREADY_CURRENT', 'changed': False}
    need(digest(before.get('description')) == plan['before_description_sha256'], 'OTHER_WRITER_CHANGED_DESCRIPTION')
    need(before.get('name') == plan['payload']['name'], 'OTHER_WRITER_CHANGED_NAME')
    for key in ('provider', 'category', 'payment_asset', 'payment_network'):
        if key in plan['payload']:
            need(before.get(key) == plan['payload'][key], 'OTHER_WRITER_CHANGED_METADATA')
    stamp = utc()
    intent = {'attempted_at': stamp, 'listing_id': plan['listing_id'], 'url': plan['url'],
              'payload_sha256': digest(plan['payload']), 'prewrite_body_sha256': before_sha}
    intent_path = out / (plan['listing_id'] + '.intent.json')
    with intent_path.open('x', encoding='utf-8') as stream:
        stream.write(json.dumps(intent, indent=2)+'\n')
    result = dict(intent, changed=None, state='WRITE_OUTCOME_UNCONFIRMED')
    try:
        status, response, sha = client(INDEX + '/register', plan['payload'])
        result.update(registration_http_status=status, registration_body_sha256=sha,
                      response_status=response.get('status'), state='SUBMITTED_PENDING_READBACK' if status == 201 else 'NOT_ACCEPTED')
        # A 201 is not public listing proof. Never retry a write, even after ambiguity.
        if status in (200, 201):
            read_status, current, read_sha = client(INDEX + '/services/' + plan['listing_id'])
            result.update(readback_http_status=read_status, readback_body_sha256=read_sha,
                          observed=inspect_after(current, plan) if read_status == 200 else None)
            if result['observed'] and result['observed']['metadata_matches']:
                result.update(changed=True, state='PUBLIC_METADATA_UPDATED' if result['observed']['active_listing_confirmed'] else 'UPDATED_NOT_ACTIVE')
    except (RefreshError, OSError) as error:
        result['error'] = str(error)
    (out / (plan['listing_id'] + '.receipt.json')).write_text(json.dumps(result, indent=2)+'\n', encoding='utf-8')
    return result

def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh-existing', action='store_true', required=True)
    parser.add_argument('--only-url', action='append', required=True)
    parser.add_argument('--max-changes', type=int, default=3)
    parser.add_argument('--apply', action='store_true', help='Write selected existing metadata; default is plan only.')
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args(argv)
    manifest, manifest_sha = read_manifest()
    rows = read_index()
    plans = plan_refresh(manifest, rows, args.only_url, args.max_changes)
    args.out.mkdir(parents=True, exist_ok=True)
    report = {'checked_at': utc(), 'manifest_body_sha256': manifest_sha, 'plan_only': not args.apply,
              'selected_urls': args.only_url, 'plans': plans, 'results': [], 'payments_attempted': 0}
    (args.out/'PLAN.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
    if args.apply:
        for plan in plans:
            result = apply_one(plan, call, args.out)
            report['results'].append(result)
            print(json.dumps(result), flush=True)
            if result.get('registration_http_status') == 429 or result['state'] == 'WRITE_OUTCOME_UNCONFIRMED':
                break
    (args.out/'RESULT.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
    if not args.apply:
        print(json.dumps(report), flush=True)
    return 0 if not args.apply or all(r['state'] in ('PUBLIC_METADATA_UPDATED','ALREADY_CURRENT') for r in report['results']) and len(report['results']) == len(plans) else 2

if __name__ == '__main__':
    raise SystemExit(main())
