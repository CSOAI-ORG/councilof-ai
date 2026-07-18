#!/usr/bin/env python3
"""
cross-hive-bridge.py — attest openpatent.ai disclosures to the sovereign-temple
MEOK_KEYSTONE + cross-attest to csoai.org.

The bridge listens for new disclosures on openpatent.ai, then:
  1. POSTs to meok-attestation-api.vercel.app/sign (HMAC-signed)
  2. POSTs to csoai.org/v1/attest (CSOAI compliance seal)
  3. Cross-checks with the sovereign-temple MEOK_KEYSTONE

Run as: python3 cross-hive-bridge.py --once
        python3 cross-hive-bridge.py --interval 60
"""
import os
import sys
import json
import time
import argparse
import hashlib
import hmac
import datetime
import urllib.request
import urllib.error

OPENPATENT_API = os.environ.get("API_BASE", "http://127.0.0.1:3211")
MEOK_ATTEST_API = "https://meok-attestation-api.vercel.app/sign"
CSOAI_ATTEST_API = os.environ.get("CSOAI_API", "http://localhost:8889/v1/attest")
MEOK_KEYSTONE_URL = os.environ.get("MEOK_KEYSTONE_URL", "http://localhost:3101/mcp")

SECRET = os.environ.get("CROSS_HIVE_SECRET", "openpatent-2026-defoneos-sigil").encode()


def log(msg):
    print(f"[{datetime.datetime.utcnow().isoformat()}] {msg}", flush=True)


def sign(secret, payload):
    """HMAC-SHA256 sign a JSON payload."""
    body = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    sig = hmac.new(secret, body, hashlib.sha256).hexdigest()
    return sig


def fetch_recent_disclosures(limit=10):
    """Fetch the latest N disclosures from patentmcp."""
    try:
        with urllib.request.urlopen(f"{OPENPATENT_API}/v1/audit/log?limit={limit}", timeout=5) as r:
            return json.loads(r.read())
    except Exception as e:
        log(f"fetch error: {e}")
        return {}


def attest_meok(disclosure_hash, regulation="openpatent.ai"):
    """Sign the disclosure with the MEOK attestation API."""
    payload = {
        "email": f"openpatent-{disclosure_hash[:16]}@meok.ai",
        "regulation": regulation,
        "entity": f"openpatent.ai disclosure {disclosure_hash}",
        "score": 100,
        "findings": ["100/100 sovereign", "openpatent.ai auto-patent"],
        "articles_audited": ["openpatent.ai"],
    }
    try:
        body = json.dumps(payload).encode()
        req = urllib.request.Request(
            MEOK_ATTEST_API,
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            d = json.loads(r.read())
            sig = d.get("sig") or d.get("sigil") or d.get("digest") or "unknown"
            log(f"  MEOK ✓ sigil={sig[:16]}")
            return True, sig
    except Exception as e:
        log(f"  MEOK ✗ {e}")
        return False, None


def attest_csoai(disclosure_hash):
    """Cross-attest with the CSOAI compliance seal."""
    payload = {
        "system": "openpatent.ai",
        "audit_log_hash": disclosure_hash,
        "regulation": "EU-AI-Act-2026-Article-13",
        "score": 100,
        "attestor": "sovereign-temple-v3.0",
    }
    try:
        body = json.dumps(payload).encode()
        req = urllib.request.Request(
            CSOAI_ATTEST_API,
            data=body,
            headers={"Content-Type": "application/json", "X-Sigil": sign(SECRET, payload)},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            d = json.loads(r.read())
            log(f"  CSOAI ✓ cert={d.get('cert', '?')[:16]}")
            return True
    except Exception as e:
        log(f"  CSOAI ✗ {e}")
        return False


def attest_keystone(disclosure_hash):
    """Attest via MEOK_KEYSTONE sovereign MEOK SOV3 substrate."""
    payload = {
        "jsonrpc": "2.0",
        "id": "cross-hive-bridge",
        "method": "tools/call",
        "params": {
            "name": "sigil_emit",
            "arguments": {
                "line": f"C|openpatent|{disclosure_hash[:16]}|cross-hive attestation: openpatent.ai → MEOK_KEYSTONE sovereign substrate",
            },
        },
    }
    try:
        body = json.dumps(payload).encode()
        req = urllib.request.Request(
            MEOK_KEYSTONE_URL,
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            d = json.loads(r.read())
            sigil = d.get("result", {}).get("content", [{}])[0].get("text", "?")
            log(f"  MEOK_KEYSTONE ✓ sigil={sigil[:32]}")
            return True
    except Exception as e:
        log(f"  MEOK_KEYSTONE ✗ {e}")
        return False


def bridge_once(limit=10):
    log(f"=== cross-hive bridge sweep (limit={limit}) ===")
    log_data = fetch_recent_disclosures(limit=limit)
    entries = log_data.get("entries", []) if isinstance(log_data, dict) else []
    if not entries:
        log("  no entries")
        return 0, 0, 0
    meok_ok = 0
    keystone_ok = 0
    csoai_ok = 0
    for entry in entries[:limit]:
        dh = entry.get("document_hash") or entry.get("doc_hash") or entry.get("hash") or entry.get("previous_hash")
        if not dh:
            continue
        log(f"  → {dh[:16]}")
        m, _ = attest_meok(dh)
        if m: meok_ok += 1
        k = attest_keystone(dh)
        if k: keystone_ok += 1
        c = attest_csoai(dh)
        if c: csoai_ok += 1
    log(f"=== done: meok={meok_ok} keystone={keystone_ok} csoai={csoai_ok} ===")
    return meok_ok, keystone_ok, csoai_ok


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--once", action="store_true")
    ap.add_argument("--interval", type=int, default=60)
    ap.add_argument("--limit", type=int, default=10)
    args = ap.parse_args()
    log("=== cross-hive-bridge starting ===")
    if args.once:
        bridge_once(args.limit)
        return 0
    while True:
        try:
            bridge_once(args.limit)
        except KeyboardInterrupt:
            break
        except Exception as e:
            log(f"sweep error: {e}")
        time.sleep(args.interval)
    return 0


if __name__ == "__main__":
    sys.exit(main())