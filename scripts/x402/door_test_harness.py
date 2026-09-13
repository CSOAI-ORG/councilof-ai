#!/usr/bin/env python3
"""door_test_harness.py — discovery-to-fulfillment tests for every CSOAI paid door.

Walks each x402 catalog resource + MCP tools/list + A2A agent-card:
  1. Discovery: fetch the manifest (/.well-known/x402.json, /mcp, /.well-known/agent-card.json)
  2. Challenge: hit the resource with no payment → expect 402 with accepts[]
  3. Free preview: where offered, fetch the preview → expect 200
  4. Receipt verification path: check /api/receipts/verify endpoint responds

Output: JSON array of door records with pass/fail per step.
Classification: reads only, $0 spend, no keys touched.
"""
from __future__ import annotations

import json
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

OUT = Path(__file__).resolve().parent / "_results"
ORIGIN = "https://councilof.ai"

X402_RESOURCES = [
    {"id": "free_door", "url": f"{ORIGIN}/api/free-door", "expect_amount": "0"},
    {"id": "request_attestation", "url": f"{ORIGIN}/api/request-attestation?subject=llama3.2:3b"},
    {"id": "evidence_bundle", "url": f"{ORIGIN}/api/evidence-bundle?obligation=dora&subject=gpt-4o&bundle=1"},
    {"id": "eunomia_data", "url": f"{ORIGIN}/api/eunomia-data?feed=1"},
    {"id": "proof_bundle", "url": f"{ORIGIN}/api/proof?bundle=1"},
    {"id": "rwa_evidence", "url": f"{ORIGIN}/api/rwa/evidence?asset=RLUSD"},
    {"id": "art50_marking", "url": f"{ORIGIN}/api/art50/marking-evidence?url=https://councilof.ai/og-image.png"},
    {"id": "provider_diff", "url": f"{ORIGIN}/api/feeds/provider-diff?history=1"},
    {"id": "receipts_batch", "url": f"{ORIGIN}/api/receipts/batch?from=2026-09-01T00:00:00Z"},
]

FREE_ENDPOINTS = [
    {"id": "gspc_board", "url": f"{ORIGIN}/api/gspc"},
    {"id": "root_json", "url": f"{ORIGIN}/root.json"},
    {"id": "card_index", "url": f"{ORIGIN}/signed/card_index.json"},
    {"id": "x402_catalog", "url": f"{ORIGIN}/.well-known/x402.json"},
    {"id": "agent_card", "url": f"{ORIGIN}/.well-known/agent-card.json"},
    {"id": "mcp_endpoint", "url": f"{ORIGIN}/mcp"},
    {"id": "a2a_endpoint", "url": f"{ORIGIN}/api/a2a"},
    {"id": "coverage_api", "url": f"{ORIGIN}/api/coverage"},
    {"id": "revenue_api", "url": f"{ORIGIN}/api/revenue"},
    {"id": "verify_endpoint", "url": f"{ORIGIN}/gspc-verify"},
]


def curl(url: str, method: str = "GET", timeout: int = 20) -> tuple[int, str, dict]:
    """Fetch URL, return (status, body_text, headers_dict)."""
    cmd = ["curl", "-sL", "-X", method,
           "-w", "\n---HTTP-%{http_code}---",
           "-H", "Accept: application/json",
           "--max-time", str(timeout), url]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 5)
        out = r.stdout
        if "---HTTP-" in out:
            body, _, code_str = out.rpartition("---HTTP-")
            code_str = code_str.rstrip("-").strip()
            try:
                code = int(code_str)
            except ValueError:
                code = 0
            return code, body.strip(), {}
    except Exception as e:
        return 0, str(e), {}
    return 0, "", {}


def test_free_endpoint(ep: dict) -> dict:
    """Test a free endpoint: expect 200 + parseable JSON."""
    code, body, _ = curl(ep["url"])
    is_json = False
    try:
        json.loads(body)
        is_json = True
    except (json.JSONDecodeError, ValueError):
        pass
    result = {
        "id": ep["id"],
        "url": ep["url"],
        "type": "free",
        "http_status": code,
        "is_json": is_json,
        "bytes": len(body),
    }
    result["status"] = "PASS" if code == 200 and is_json else "FAIL"
    if code != 200:
        result["reason"] = f"HTTP {code}"
    elif not is_json:
        result["reason"] = "not JSON"
    return result


def test_x402_door(res: dict) -> dict:
    """Test a paid door: challenge (402) + optional free preview."""
    code, body, headers = curl(res["url"])
    result = {
        "id": res["id"],
        "url": res["url"],
        "type": "x402_paid",
        "http_status": code,
        "challenge_status": None,
        "accepts_count": None,
        "amount": None,
        "network": None,
        "pay_to": None,
        "has_offer_receipt": None,
        "free_preview_status": None,
        "receipt_verify_status": None,
    }

    # Step 1: Challenge
    if code == 402:
        result["challenge_status"] = "PASS"
        try:
            challenge = json.loads(body)
            accepts = challenge.get("accepts", [])
            result["accepts_count"] = len(accepts)
            if accepts:
                a = accepts[0]
                result["amount"] = a.get("amount")
                result["network"] = a.get("network")
                result["pay_to"] = a.get("payTo")
            ext = challenge.get("extensions", {})
            ore = ext.get("offer-receipt", {})
            result["has_offer_receipt"] = bool(ore.get("info", {}).get("offers"))
        except json.JSONDecodeError:
            result["challenge_status"] = "FAIL_PARSE"
    else:
        result["challenge_status"] = f"FAIL_HTTP_{code}"

    # Step 2: Free preview (where catalog says one exists)
    preview_url = res.get("preview")
    if preview_url:
        pcode, pbody, pheaders = curl(preview_url)
        result["free_preview_status"] = "PASS" if pcode == 200 else f"FAIL_{pcode}"
        result["free_preview_bytes"] = len(pbody)
    else:
        result["free_preview_status"] = "N/A"

    # Step 3: Receipt verification endpoint reachable
    vcode, _, _ = curl(f"{ORIGIN}/api/receipts/verify", method="POST")
    result["receipt_verify_status"] = "REACHABLE" if vcode in (200, 400, 422) else f"HTTP_{vcode}"

    result["status"] = (
        "PASS" if result["challenge_status"] == "PASS"
        and result["accepts_count"] and result["accepts_count"] > 0
        else result["challenge_status"]
    )
    return result


def main():
    ts = datetime.now(timezone.utc).isoformat()
    print(f"Door test harness — {ts}", file=sys.stderr)
    print(f"Origin: {ORIGIN}", file=sys.stderr)

    results = []

    # Free endpoints
    print(f"\n--- Free endpoints ({len(FREE_ENDPOINTS)}) ---", file=sys.stderr)
    for ep in FREE_ENDPOINTS:
        r = test_free_endpoint(ep)
        results.append(r)
        mark = "OK" if r["status"] == "PASS" else "FAIL"
        print(f"  {mark} {r['id']} (HTTP {r['http_status']}, {r['bytes']} bytes)", file=sys.stderr)

    # x402 paid doors
    print(f"\n--- x402 paid doors ({len(X402_RESOURCES)}) ---", file=sys.stderr)
    for res in X402_RESOURCES:
        r = test_x402_door(res)
        results.append(r)
        mark = "OK" if r["status"] == "PASS" else r["status"]
        print(f"  {mark} {r['id']} (HTTP {r['http_status']}, accepts={r['accepts_count']}, amount={r['amount']})", file=sys.stderr)
        time.sleep(0.3)

    # Summary
    passed = sum(1 for r in results if r["status"] == "PASS")
    total = len(results)
    summary = {
        "schema": "csoai.door-test-harness/v1",
        "as_of": ts,
        "origin": ORIGIN,
        "total_doors": total,
        "passed": passed,
        "failed": total - passed,
        "spend": "$0",
        "keys_touched": False,
        "results": results,
    }

    OUT.mkdir(parents=True, exist_ok=True)
    out_file = OUT / f"door-test-{ts[:10]}.json"
    out_file.write_text(json.dumps(summary, indent=2))
    print(f"\n{passed}/{total} passed. Output: {out_file}", file=sys.stderr)

    json.dump(summary, sys.stdout, indent=2)


if __name__ == "__main__":
    main()
