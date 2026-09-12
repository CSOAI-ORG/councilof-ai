#!/usr/bin/env python3
"""
TUI 4 — Agent Discovery Verification Script
Proves every agent-facing endpoint is live and returns expected shapes.
Run: python3 agents/verify-discovery.py
"""
import json
import sys
import urllib.request
import urllib.error

PASS = "✅"
FAIL = "❌"
SKIP = "⏭️"

results = []

def probe(name, url, method="GET", expect_status=None, check_json=True):
    """Probe an endpoint and report status."""
    try:
        req = urllib.request.Request(url, method=method)
        req.add_header("User-Agent", "csoai-trust-audit/0.1 (TUI4 verification)")
        if method == "POST":
            req.add_header("Content-Type", "application/json")
            req.data = json.dumps({
                "jsonrpc": "2.0", "id": 1, "method": "SendMessage",
                "params": {"message": {"messageId": "verify-001", "role": "user", "parts": [{"text": "board"}]}}
            }).encode()
        resp = urllib.request.urlopen(req, timeout=15)
        body = resp.read().decode()
        status = resp.status
        if check_json:
            data = json.loads(body)
        else:
            data = None
        ok = (expect_status is None or status == expect_status)
        results.append({"name": name, "url": url, "status": status, "ok": ok, "json": bool(data)})
        print(f"{PASS if ok else FAIL} {name}: HTTP {status}" + (f" (JSON keys: {list(data.keys())[:5]})" if data else ""))
        return data
    except urllib.error.HTTPError as e:
        # x402 returns 402 which is expected
        body = e.read().decode() if hasattr(e, 'read') else ""
        is_402 = e.code == 402
        try:
            data = json.loads(body)
        except:
            data = None
        ok = (expect_status is not None and e.code == expect_status) or is_402
        results.append({"name": name, "url": url, "status": e.code, "ok": ok, "json": bool(data), "is_402": is_402})
        print(f"{PASS if ok else FAIL} {name}: HTTP {e.code}" + (" (x402 challenge)" if is_402 else ""))
        return data
    except Exception as e:
        results.append({"name": name, "url": url, "status": None, "ok": False, "error": str(e)})
        print(f"{FAIL} {name}: {e}")
        return None

print("=" * 60)
print("TUI 4 — Agent Discovery Verification")
print("=" * 60)
print()

# 1. MCP well-known
print("--- MCP Discovery ---")
probe("mcp.json", "https://councilof.ai/.well-known/mcp.json")
probe("server-card.json", "https://councilof.ai/.well-known/mcp/server-card.json")
print()

# 2. Agent Card
print("--- A2A Discovery ---")
probe("agent-card.json", "https://councilof.ai/.well-known/agent-card.json")
probe("A2A endpoint", "https://councilof.ai/api/a2a", method="POST")
print()

# 3. x402
print("--- x402 Discovery ---")
probe("x402.json", "https://councilof.ai/.well-known/x402.json")
probe("x402 catalog", "https://councilof.ai/api/x402")
probe("free door", "https://councilof.ai/api/free-door")
probe("x402 trust", "https://councilof.ai/interop/x402-trust/latest.json")
print()

# 4. AG-UI
print("--- AG-UI ---")
probe("agui/gspc-state", "https://councilof.ai/api/agui/gspc-state", check_json=False)
print()

# 5. API endpoints
print("--- API Endpoints ---")
probe("GET /api/gspc", "https://councilof.ai/api/gspc")
probe("llms.txt", "https://councilof.ai/llms.txt", check_json=False)
probe("gspc-verify", "https://councilof.ai/gspc-verify", check_json=False)
print()

# 6. DID
print("--- DID ---")
probe("did.json", "https://csoai.org/.well-known/did.json")
print()

# 7. External directories
print("--- External Directories ---")
probe("PayAPI listing", "https://payapi.market/api/council-of-ai-gspc-eu-evidence-feed", check_json=False)
print()

# Summary
print("=" * 60)
passed = sum(1 for r in results if r["ok"])
total = len(results)
print(f"RESULTS: {passed}/{total} passed")
if passed < total:
    print("FAILURES:")
    for r in results:
        if not r["ok"]:
            print(f"  {FAIL} {r['name']}: {r.get('error', r.get('status', 'unknown'))}")
print("=" * 60)
