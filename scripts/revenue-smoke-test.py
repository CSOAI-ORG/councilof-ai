#!/usr/bin/env python3
"""Revenue-path smoke test.

Verifies that the critical revenue pages and APIs are live and sane.
Does NOT make real purchases.

Usage:
    python3 scripts/revenue-smoke-test.py
"""
from __future__ import annotations

import json
import re
import ssl
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ssl._create_default_https_context = ssl._create_unverified_context
ROOT = Path("/Users/nicholas/clawd")
REPORT = ROOT / "_findings" / "REVENUE_SMOKE_TEST_2026-06-17.json"

ENDPOINTS = [
    {"name": "csoai-pricing", "url": "https://csoai.org/pricing", "check": "page_load"},
    {"name": "meok-pricing", "url": "https://meok.ai/pricing", "check": "page_load"},
    {"name": "cobolbridge-pricing", "url": "https://cobolbridge.ai/pricing", "check": "cobol_price"},
    {"name": "attestation-verify", "url": "https://meok-attestation-api.vercel.app/verify", "check": "post_endpoint"},
]


def fetch(url: str) -> tuple[int, str]:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "MEOK-SmokeBot/1.0"})
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.getcode(), resp.read(8192).decode("utf-8", errors="ignore")
    except urllib.error.HTTPError as e:
        return e.code, e.read(2048).decode("utf-8", errors="ignore")
    except Exception as e:
        return 0, str(e)


def check_page_load(url: str) -> dict:
    code, body = fetch(url)
    return {"status_code": code, "ok": code == 200, "body_preview": body[:200]}


def check_cobol_price(url: str) -> dict:
    code, body = fetch(url)
    result = {"status_code": code, "ok": code == 200}
    if code == 200:
        has_199 = bool(re.search(r"£199|199\s*/\s*month|199\.00", body))
        has_2499 = bool(re.search(r"£2[,\s]?499|2499\.00", body))
        result["has_199"] = has_199
        result["has_2499"] = has_2499
        result["price_ok"] = has_199 and not has_2499
    return result


def check_post_endpoint(url: str) -> dict:
    try:
        req = urllib.request.Request(
            url,
            data=b'{"cert_id":"test","signature":"test"}',
            headers={"Content-Type": "application/json", "User-Agent": "MEOK-SmokeBot/1.0"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = resp.read(2048).decode("utf-8", errors="ignore")
            return {"status_code": resp.getcode(), "ok": resp.getcode() in (200, 400, 422), "body_preview": body[:200]}
    except urllib.error.HTTPError as e:
        body = e.read(2048).decode("utf-8", errors="ignore")
        return {"status_code": e.code, "ok": e.code in (400, 422), "body_preview": body[:200]}
    except Exception as e:
        return {"status_code": 0, "ok": False, "error": str(e)}


def main():
    results = []
    for ep in ENDPOINTS:
        if ep["check"] == "page_load":
            res = check_page_load(ep["url"])
        elif ep["check"] == "cobol_price":
            res = check_cobol_price(ep["url"])
        elif ep["check"] == "post_endpoint":
            res = check_post_endpoint(ep["url"])
        else:
            res = {"error": "unknown check"}
        res["name"] = ep["name"]
        res["url"] = ep["url"]
        results.append(res)

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "results": results,
        "all_ok": all(r.get("ok") for r in results),
    }

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")

    for r in results:
        icon = "✅" if r.get("ok") else "❌"
        extra = ""
        if "price_ok" in r:
            extra = f" (price_ok={r['price_ok']})"
        print(f"{icon} {r['name']}: {r.get('status_code', 'ERR')}{extra}")

    print(f"\nReport: {REPORT}")
    if not report["all_ok"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
