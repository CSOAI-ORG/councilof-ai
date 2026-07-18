#!/usr/bin/env python3
"""
align-check.py — verify alignment across ALL 5 sovereign hives.

Hives:
  1. openpatent.ai hive — 35.242.143.249
  2. csoai.org hive — CSOAI Ltd UK (16939677)
  3. sovereign-temple hive — MEOK SOV3 substrate (port 3101)
  4. meok-attestation hive — meok-attestation-api.vercel.app/sign
  5. openpatent-mcp hive — patentmcp audit chain

For each hive, ping the live endpoint and report:
  - up/down
  - sigil (if available)
  - last entry timestamp
  - chain length (if applicable)
"""
import os
import sys
import json
import argparse
import datetime
import urllib.request
import urllib.error


def log(msg):
    print(f"[{datetime.datetime.utcnow().isoformat()}] {msg}", flush=True)


def ping(url, timeout=5, expect_json=True):
    """Hit a URL, return (ok, status, body)."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "align-check/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read()
            try:
                d = json.loads(body)
                return True, r.status, d
            except Exception:
                return True, r.status, body[:500].decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return False, e.code, e.read()[:500].decode("utf-8", errors="replace")
    except Exception as e:
        return False, None, str(e)


VM_HOST = os.environ.get("VM_HOST", "127.0.0.1")  # default localhost when run from VM

def check_openpatent_hive():
    """openpatent.ai hive — 35.242.143.249."""
    log("=== [1/5] openpatent.ai hive ===")
    results = {}
    for svc, port in [
        ("api-gateway", 3211),
        ("patentmcp", 3210),
        ("worker", 3212),
        ("bft-council", 3215),
        ("mcp-manifest", 3214),
        ("landing", 3000),
        ("legalof-ai", 3031),
        ("harvi-ai", 3032),
        ("ipcastle-ai", 3033),
        ("sovereign-temple-ai", 3034),
    ]:
        ok, status, body = ping(f"http://{VM_HOST}:{port}/health", timeout=3)
        chain = body.get("chain_length", "?") if isinstance(body, dict) else "?"
        results[svc] = {"ok": ok, "status": status, "chain": chain}
        log(f"  {svc:25s} :{port:5d} {status or 'ERR'} {'UP' if ok else 'DOWN'} chain={chain}")
    return results


def check_csoai_hive():
    """csoai.org hive — CSOAI Ltd UK (16939677)."""
    log("=== [2/5] csoai.org hive (CSOAI Ltd UK 16939677) ===")
    # Try the csoai.org website + a few possible API endpoints
    candidates = [
        "https://csoai.org/api/health",
        "https://csoai.org/.well-known/health",
        "https://csoai.org/health",
    ]
    for url in candidates:
        ok, status, body = ping(url, timeout=5)
        if ok:
            log(f"  csoai.org: {url} {status} ok")
            return {"url": url, "ok": True, "status": status}
    log(f"  csoai.org: no live endpoint (status: {status})")
    return {"url": None, "ok": False, "status": status}


def check_sovereign_temple_hive():
    """sovereign-temple hive — MEOK SOV3 substrate (port 3101)."""
    log("=== [3/5] sovereign-temple hive (MEOK SOV3) ===")
    ok, status, body = ping(f"http://{VM_HOST}:3101/mcp", timeout=5)
    log(f"  mcp: 3101 {status or 'ERR'} {'UP' if ok else 'DOWN'}")
    # Try tools/list
    try:
        req = urllib.request.Request(
            f"http://{VM_HOST}:3101/mcp",
            data=json.dumps({
                "jsonrpc": "2.0", "id": "align-check", "method": "tools/list",
            }).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=5) as r:
            d = json.loads(r.read())
            tools = d.get("result", {}).get("tools", [])
            log(f"  MEOK SOV3: {len(tools)} tools")
            return {"ok": True, "tools": len(tools)}
    except Exception as e:
        log(f"  MEOK SOV3 error: {e}")
        return {"ok": False, "error": str(e)}


def check_meok_attestation_hive():
    """meok-attestation hive — meok-attestation-api.vercel.app/sign."""
    log("=== [4/5] meok-attestation hive ===")
    payload = {
        "email": "align-check@meok.ai",
        "regulation": "openpatent-align-check",
        "entity": "openpatent.ai hive align check",
        "score": 100,
        "findings": ["100/100 sovereign", "align-check"],
        "articles_audited": ["1"],
    }
    try:
        req = urllib.request.Request(
            "https://meok-attestation-api.vercel.app/sign",
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            d = json.loads(r.read())
            sig = d.get("sig") or d.get("sigil") or d.get("digest") or "?"
            log(f"  MEOK attestation: 200 OK sigil={sig[:24]}")
            return {"ok": True, "sigil": sig}
    except Exception as e:
        log(f"  MEOK attestation error: {e}")
        return {"ok": False, "error": str(e)}


def check_openpatent_mcp_hive():
    """openpatent-mcp hive — patentmcp audit chain."""
    log("=== [5/5] openpatent-mcp hive (patentmcp audit chain) ===")
    ok, status, body = ping(f"http://{VM_HOST}:3210/health", timeout=5)
    if ok and isinstance(body, dict):
        chain = body.get("chain_length", "?")
        integrity = body.get("chain_integrity", {}).get("valid", "?")
        log(f"  patentmcp: 3210 200 OK chain={chain} integrity={integrity}")
        return {"ok": True, "chain": chain, "integrity": integrity}
    log(f"  patentmcp: 3210 {status or 'ERR'} DOWN")
    return {"ok": False}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()
    log("=== ALIGN CHECK ===")
    results = {
        "openpatent": check_openpatent_hive(),
        "csoai": check_csoai_hive(),
        "sovereign_temple": check_sovereign_temple_hive(),
        "meok_attestation": check_meok_attestation_hive(),
        "openpatent_mcp": check_openpatent_mcp_hive(),
    }
    log("=== ALIGN CHECK DONE ===")
    if args.json:
        print(json.dumps(results, indent=2, default=str))


if __name__ == "__main__":
    sys.exit(main())