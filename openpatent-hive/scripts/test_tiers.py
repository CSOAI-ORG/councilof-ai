#!/usr/bin/env python3
"""Test all 5 disclosure tiers end-to-end."""
import json
import urllib.request
import urllib.error

results = []
for tier in ["starter", "defensive", "full", "premium", "enterprise"]:
    body = {
        "title": f"Tier {tier} test",
        "description": f"{tier} tier test — verifying 5-tier pricing across the openpatent.ai hive.",
        "inventor_did": "did:key:z6MkTierTest",
        "document_base64": "VGVzdA==",
        "tier": tier,
    }
    req = urllib.request.Request(
        "http://127.0.0.1:3211/v1/disclosure",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            d = json.loads(r.read())
            status = d.get("status", "?")
            fee = d.get("fee_paid", "?")
            print(f"  {tier:12s} → status={status}  fee=${fee}")
            results.append((tier, "PASS" if status == "DISCLOSED" else "FAIL", fee))
    except urllib.error.HTTPError as e:
        d = json.loads(e.read())
        print(f"  {tier:12s} → FAIL  {e.code}  {d.get('detail', '?')[:120]}")
        results.append((tier, "FAIL", None))

print()
passed = sum(1 for _, s, _ in results if s == "PASS")
print(f"{passed}/5 tiers passed")
