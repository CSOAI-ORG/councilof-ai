#!/usr/bin/env python3
"""Offline diagnostic only. Does not sign, pay, or enforce a wallet policy."""
import hashlib
import json
import re
import sys

RESOURCE = "https://councilof.ai/api/coverage-evidence"
ASSET = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"
PAYEE = "0x212686404a7d1e1fd88f35ed6200c3af7a78ae31"
CAP_ATOMIC = 20000  # 0.02 USDC, 6 decimals; one diagnostic challenge

def _unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('duplicate JSON object key')
        result[key] = value
    return result

def check(raw):
    doc = json.loads(raw, object_pairs_hook=_unique_object)
    if not isinstance(doc, dict) or not isinstance(doc.get('resource'), dict):
        raise ValueError('invalid challenge')
    if doc.get('x402Version') != 2 or doc['resource'].get('url') != RESOURCE:
        raise ValueError('unexpected x402 version or resource')
    options = doc.get('accepts')
    if not isinstance(options, list) or len(options) != 1 or not isinstance(options[0], dict):
        raise ValueError('expected exactly one payment option')
    a = options[0]
    if (a.get('scheme') != 'exact' or a.get('network') != 'eip155:8453'
            or str(a.get('asset', '')).lower() != ASSET
            or str(a.get('payTo', '')).lower() != PAYEE):
        raise ValueError('unexpected scheme, network, asset, or recipient')
    amount, maximum = a.get('amount'), a.get('maxAmountRequired')
    if not isinstance(amount, str) or not re.fullmatch(r'[0-9]+', amount) or len(amount) > 20:
        raise ValueError('amount must be an atomic-unit string')
    if maximum is not None and maximum != amount:
        raise ValueError('amount aliases disagree')
    if not 0 < int(amount) <= CAP_ATOMIC:
        raise ValueError('zero or above the 0.02 USDC cap')
    if a.get('resource', RESOURCE) != RESOURCE:
        raise ValueError('option resource mismatch')
    return {'status': 'PREFLIGHT_ONLY', 'amount_atomic': amount,
            'challenge_sha256': hashlib.sha256(raw).hexdigest(),
            'limitation': 'No signature, payment, wallet enforcement, or delivery was tested.'}

if __name__ == '__main__':
    try:
        if len(sys.argv) != 2:
            raise ValueError('usage: owner_x402_preflight.py CHALLENGE_JSON')
        with open(sys.argv[1], 'rb') as f:
            raw = f.read(262145)
        if len(raw) > 262144:
            raise ValueError('challenge too large')
        print(json.dumps(check(raw), sort_keys=True))
    except (ValueError, OSError, TypeError, json.JSONDecodeError) as exc:
        print('REJECTED:', str(exc), file=sys.stderr)
        sys.exit(1)
