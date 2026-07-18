#!/usr/bin/env python3
"""Validate the new /metrics + /docs (Swagger UI) + patent-search live."""
import json
import urllib.request
import urllib.error
import sys

BASE = "http://127.0.0.1"

def http(method, url, body=None, timeout=10):
    headers = {"Content-Type": "application/json"} if body else {}
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode(errors="replace"), dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode(errors="replace") if e.fp else "", dict(e.headers or {})

passes = 0
fails = 0

def check(name, status, body, expect=200, must_contain=None):
    global passes, fails
    ok = status == expect
    if must_contain:
        ok = ok and must_contain in body
    if ok:
        passes += 1
        print(f"  ✓ {name}: {status}")
    else:
        fails += 1
        print(f"  ✗ {name}: {status} expected {expect} (looking for {must_contain!r})")
        print(f"      body: {body[:200]}")

print("=" * 60)
print("METRICS + SWAGGER + LIVE-OSE VALIDATION")
print("=" * 60)

# 1. /openapi.json on api-gateway
print("\n[1/8] OpenAPI spec (api-gateway)")
s, b, h = http("GET", f"{BASE}:3211/openapi.json")
check("openapi.json", s, b, 200, "OpenPatent.ai")
if s == 200:
    spec = json.loads(b)
    paths = list(spec.get("paths", {}).keys())
    print(f"    → {len(paths)} paths: {paths[:6]}...")
    print(f"    → title: {spec.get('info', {}).get('title')}")

# 2. /docs (Swagger UI)
print("\n[2/8] Swagger UI")
s, b, h = http("GET", f"{BASE}:3211/docs")
check("/docs (Swagger UI)", s, b, 200, "swagger-ui")

# 3. /redoc (ReDoc UI)
print("\n[3/8] ReDoc UI")
s, b, h = http("GET", f"{BASE}:3211/redoc")
check("/redoc", s, b, 200, "redoc")

# 4. /metrics on api-gateway
print("\n[4/8] Prometheus /metrics on api-gateway")
s, b, h = http("GET", f"{BASE}:3211/metrics")
check("api-gateway /metrics", s, b, 200)
if s == 200:
    # Count metric families
    families = set()
    for line in b.split("\n"):
        if line.startswith("# TYPE "):
            families.add(line.split()[2])
    print(f"    → {len(families)} metric families exposed")
    print(f"    → includes service_info: {'service_info' in b}")
    print(f"    → includes http_requests: {'http_requests' in b}")

# 5. /metrics on bft-council
print("\n[5/8] Prometheus /metrics on bft-council")
s, b, h = http("GET", f"{BASE}:3215/metrics")
check("bft /metrics", s, b, 200)
if s == 200:
    has_service_info = 'service="bft-council"' in b
    print(f"    → service_info with service=bft-council: {has_service_info}")

# 6. /metrics on x402-router
print("\n[6/8] Prometheus /metrics on x402-router")
s, b, h = http("GET", f"{BASE}:3217/metrics")
check("x402 /metrics", s, b, 200)
if s == 200:
    has_service_info = 'service="x402-router"' in b
    print(f"    → service_info with service=x402-router: {has_service_info}")

# 7. patent-search live (will fallback to mock if PatentsView unavailable)
print("\n[7/8] patent-search — US (live PatentsView attempt)")
s, b, h = http("POST", f"{BASE}:3218/patent-search", body={
    "query": "blockchain consensus",
    "jurisdiction": "US",
    "limit": 3,
})
check("patent-search US", s, b, 200, "real")
if s == 200:
    j = json.loads(b)
    print(f"    → real={j.get('real')}, source={j.get('source', '?')[:50]}")
    print(f"    → results count: {len(j.get('results', []))}")

# 8. Run a real disclosure and check metrics tick
print("\n[8/8] Trigger disclosure, then read /metrics")
s, b, h = http("POST", f"{BASE}:3211/v1/disclosure", body={
    "title": "Metrics Validation Test",
    "description": "Testing the new /metrics endpoint and OpenAPI spec.",
    "inventor_did": "did:key:z6MkMetrics",
    "document_base64": "VGVzdGluZyBtZXRyaWNz",
    "tier": "defensive",
})
check("disclosure (for metrics tick)", s, b, 200, "DISCLOSED")
# Now read /metrics — should have incremented http_requests_total
s, b, h = http("GET", f"{BASE}:3211/metrics")
if s == 200:
    for line in b.split("\n"):
        if 'http_requests_total{' in line and '/v1/disclosure' in line:
            print(f"    → {line}")
            break

print()
print("=" * 60)
print(f"RESULTS: {passes} passed, {fails} failed")
print("=" * 60)
sys.exit(0 if fails == 0 else 1)
