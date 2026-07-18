#!/usr/bin/env python3
"""Uptime monitor for critical empire endpoints.

Usage:
    python3 scripts/uptime-monitor.py
    python3 scripts/uptime-monitor.py --submit-sov3
    python3 scripts/uptime-monitor.py --alert-email

Checks:
    - csoai.org
    - meok.ai
    - cobolbridge.ai
    - proofof.ai
    - meok-attestation-api.vercel.app
    - 127.0.0.1:3101 (SOV3)
"""
from __future__ import annotations

import argparse
import json
import ssl
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd")
REPORT = ROOT / "_findings" / "UPTIME_MONITOR_2026-06-17.json"
SOV3_SCRIPT = ROOT / "scripts" / "enable_coordination.py"

ssl._create_default_https_context = ssl._create_unverified_context

ENDPOINTS = [
    {"name": "csoai.org", "url": "https://csoai.org", "critical": True},
    {"name": "meok.ai", "url": "https://meok.ai", "critical": True},
    {"name": "cobolbridge.ai", "url": "https://cobolbridge.ai", "critical": True},
    {"name": "proofof.ai", "url": "https://proofof.ai", "critical": True},
    {"name": "meok-attestation-api", "url": "https://meok-attestation-api.vercel.app/health", "critical": True},
    {"name": "sov3-local", "url": "http://127.0.0.1:3101/mcp", "critical": True, "method": "POST", "payload": b'{"jsonrpc":"2.0","method":"tools/list","id":1}'},
    {"name": "meok-api", "url": "http://127.0.0.1:3200/health", "critical": False},
    {"name": "meok-mcp", "url": "http://127.0.0.1:3102/health", "critical": False},
]


def check(endpoint: dict) -> dict:
    url = endpoint["url"]
    method = endpoint.get("method", "GET")
    payload = endpoint.get("payload")
    result = {
        "name": endpoint["name"],
        "url": url,
        "critical": endpoint.get("critical", False),
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        req = urllib.request.Request(
            url,
            data=payload,
            headers={"User-Agent": "MEOK-UptimeBot/1.0", "Content-Type": "application/json"},
            method=method,
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            result["status_code"] = resp.getcode()
            body = resp.read(1024).decode("utf-8", errors="ignore")
            result["body_preview"] = body[:200]
    except urllib.error.HTTPError as e:
        result["status_code"] = e.code
        result["error"] = str(e)
    except Exception as e:
        result["status_code"] = 0
        result["error"] = str(e)

    result["ok"] = result.get("status_code") == 200
    return result


def submit_sov3(failures: list[str]):
    if not SOV3_SCRIPT.exists():
        print("SOV3 script not found; skipping submit.")
        return
    title = f"Uptime monitor: {len(failures)} critical failure(s)"
    desc = "Failed endpoints: " + ", ".join(failures)
    subprocess.run(
        [sys.executable, str(SOV3_SCRIPT), "--submit", title, "--description", desc],
        capture_output=True,
        text=True,
    )


def main():
    parser = argparse.ArgumentParser(description="Uptime monitor")
    parser.add_argument("--submit-sov3", action="store_true", help="Submit SOV3 task on failure")
    args = parser.parse_args()

    results = [check(e) for e in ENDPOINTS]
    failed = [r["name"] for r in results if not r["ok"] and r["critical"]]
    all_ok = not failed

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "all_ok": all_ok,
        "critical_failures": failed,
        "results": results,
    }

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")

    for r in results:
        icon = "✅" if r["ok"] else "❌"
        critical = " (CRITICAL)" if r["critical"] else ""
        print(f"{icon} {r['name']}: {r.get('status_code', 'ERR')}{critical}")

    if failed:
        print(f"\n⚠️ {len(failed)} critical endpoint(s) down: {', '.join(failed)}")
        if args.submit_sov3:
            submit_sov3(failed)
        sys.exit(1)
    else:
        print("\n✅ All critical endpoints healthy")


if __name__ == "__main__":
    main()
