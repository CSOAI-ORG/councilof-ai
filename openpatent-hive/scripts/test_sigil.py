#!/usr/bin/env python3
"""Test the worker sovereign-sigil emission + BFT /attest endpoint."""
import json
import urllib.request
import urllib.error
import sys
import time

BASE = "http://127.0.0.1"

def http(method, url, body=None, timeout=10):
    headers = {"Content-Type": "application/json"} if body else {}
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

print("=" * 60)
print("SOVEREIGN SIGIL EMISSION TEST")
print("=" * 60)

# 1. Submit a premium disclosure (triggers worker)
print("\n[1/4] Premium disclosure (triggers worker → BFT)")
s, b = http("POST", f"{BASE}:3211/v1/disclosure", body={
    "title": "Sigil emission test",
    "description": "Testing sovereign-temple sigil emissions through the worker to the BFT council.",
    "inventor_did": "did:key:z6MkSigil",
    "document_base64": "VGVzdA==",
    "tier": "premium",
    "request_bft_review": True,
})
print(f"  status={s}")
disclosure = json.loads(b) if s == 200 else {}
hash_in = disclosure.get("document_hash", "test")
print(f"  document_hash: {hash_in[:32]}...")

# 2. Wait for worker to process
print("\n[2/4] Wait for worker to process")
time.sleep(3)
print("  ✓ waited 3s")

# 3. Read worker /metrics — should show ots_upgrade_initiated count
print("\n[3/4] Worker /metrics")
s, b = http("GET", f"{BASE}:3212/metrics")
print(f"  status={s}")
if s == 200:
    has_service_info = 'service="worker"' in b
    print(f"  service=worker: {has_service_info}")
    has_sigil = "sigil" in b.lower() or "attest" in b.lower()
    print(f"  sigil/attest metrics: {has_sigil}")

# 4. BFT /attest endpoint
print("\n[4/4] BFT /attest endpoint")
import json as _json
s, b = http("POST", f"{BASE}:3215/attest", body={
    "proposal": _json.dumps({
        "action": "ots_upgrade_initiated",
        "actor": "openpatent.worker",
        "job_id": "test-12345",
        "hive": "openpatent",
        "disclosure_hash": hash_in,
    }),
    "metadata": {
        "hive": "openpatent",
        "actor": "openpatent.worker",
        "action": "ots_upgrade_initiated",
    },
})
print(f"  status={s}")
if s == 200:
    j = json.loads(b)
    print(f"  status: {j.get('status', '?')}")
    print(f"  council: {j.get('council', j.get('council_size', '?'))}")
    print(f"  attestation: {j.get('attestation_id', '?')[:40]}...")

print()
print("=" * 60)
print("✓ Sigil emission test complete")
print("=" * 60)
