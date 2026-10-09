#!/usr/bin/env python3
"""One-off read-only CDP Bazaar validation of CSOAI's declared paid doors."""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import subprocess
from pathlib import Path

SOURCE = Path('/tmp/csoai-x402-20260924.json')
OUTPUT = Path('/Users/nicholas/clawd/_alignment/CDP_BAZAAR_VALIDATION_20260924.json')
VALIDATOR = 'https://api.cdp.coinbase.com/platform/v2/x402/validate'


def main() -> None:
    raw = SOURCE.read_bytes()
    catalog = json.loads(raw)
    results = []
    for row in catalog['resources']:
        url = row['url']
        if url.endswith('/api/free-door'):
            continue
        if not url.startswith('https://councilof.ai/'):
            raise ValueError(f'Unexpected resource origin: {url}')
        request = json.dumps({'resource': url, 'method': row.get('method', 'GET')}, separators=(',', ':'))
        proc = subprocess.run(
            ['curl', '-sS', '--max-time', '20', '-X', 'POST', VALIDATOR,
             '-H', 'Content-Type: application/json', '-d', request,
             '-w', '\n%{http_code}'],
            capture_output=True, text=True, check=False,
        )
        body, _, status = proc.stdout.rpartition('\n')
        item = {'resource': url, 'validator_http_status': status,
                'response_sha256': hashlib.sha256(body.encode()).hexdigest()}
        if proc.returncode or not body:
            item['error'] = f'curl rc={proc.returncode}: {proc.stderr[:150]}'
        else:
            try:
                data = json.loads(body)
                item['valid'] = data.get('valid')
                item['simulation_outcome'] = (data.get('simulation') or {}).get('outcome')
                item['required_failures'] = [
                    {'check': check.get('check'), 'detail': check.get('detail')}
                    for check in data.get('preflight', [])
                    if check.get('severity') == 'required' and check.get('passed') is False
                ]
                item['advisory_failures'] = [
                    {'check': check.get('check'), 'detail': check.get('detail')}
                    for check in data.get('preflight', [])
                    if check.get('severity') != 'required' and check.get('passed') is False
                ]
            except json.JSONDecodeError:
                item['error'] = 'Validator response is not JSON'
        results.append(item)
    receipt = {
        'schema': 'csoai.cdp-bazaar-validation/1',
        'observed_at': dt.datetime.now(dt.timezone.utc).isoformat(),
        'source_manifest': 'https://councilof.ai/.well-known/x402.json',
        'source_manifest_sha256': hashlib.sha256(raw).hexdigest(),
        'validator': VALIDATOR,
        'paid_calls_or_settlements': 0,
        'meaning': 'Validator acceptance is not Bazaar indexing, buyer use, or revenue. A CDP-facilitator-settled payment is a separate gate.',
        'results': results,
    }
    OUTPUT.write_text(json.dumps(receipt, indent=2) + '\n')
    print(f'{OUTPUT}: {len(results)} checked; '
          f'{sum(x.get("valid") is True for x in results)} valid; '
          f'{sum(x.get("valid") is False for x in results)} invalid; '
          f'{sum("error" in x for x in results)} errors')
    for item in results:
        if item.get('valid') is not True:
            print(item['resource'], item.get('required_failures'), item.get('error'))


if __name__ == '__main__':
    main()
