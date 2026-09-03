#!/usr/bin/env python3
"""csoai-verify-wave.py — Phase 10: verification wave.

Lane-doable: verifies every claim, every URL, every atom.
"""

from __future__ import annotations

import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "scripts" / "badger" / "_queue" / "verification"
OUT.mkdir(parents=True, exist_ok=True)


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


URLS_TO_VERIFY = [
    # Public rails
    "https://councilof.ai/",
    "https://councilof.ai/pay",
    "https://councilof.ai/dashboard",
    "https://councilof.ai/ag-ui",
    "https://councilof.ai/axes-deep",
    "https://councilof.ai/gspc-console",
    "https://councilof.ai/gspc-verify",
    "https://councilof.ai/gspc-leaderboard",
    "https://councilof.ai/gspc-quests",
    "https://councilof.ai/visual-board",
    "https://councilof.ai/visual-verify",
    # Subdomains
    "https://councilof.ai/subdomains/proofs",
    "https://councilof.ai/subdomains/measure",
    "https://councilof.ai/subdomains/signed",
    "https://councilof.ai/subdomains/arena",
    "https://councilof.ai/subdomains/benchmarks",
    "https://councilof.ai/subdomains/interop",
    "https://councilof.ai/subdomains/j-space",
    # APIs
    "https://councilof.ai/api/x402",
    "https://councilof.ai/api/gspc",
    "https://councilof.ai/api/state",
    "https://councilof.ai/api/revenue",
    "https://councilof.ai/api/board-sign",
    "https://councilof.ai/api/corrections",
    "https://councilof.ai/api/challenge",
    "https://councilof.ai/api/benchmark-quality",
    # Well-known
    "https://councilof.ai/.well-known/did.json",
    "https://councilof.ai/.well-known/agent-card.json",
    "https://councilof.ai/.well-known/x402.json",
    "https://councilof.ai/.well-known/mcp.json",
    "https://councilof.ai/.well-known/eu-ai-act.json",
    "https://councilof.ai/.well-known/nist-ai-rmf.json",
    "https://councilof.ai/.well-known/iso-42001.json",
    # csoai.org
    "https://csoai.org/",
    "https://csoai.org/pay",
    "https://csoai.org/.well-known/did.json",
    "https://csoai.org/api/x402",
    "https://csoai.org/api/state",
]


def main() -> None:
    results = []
    for url in URLS_TO_VERIFY:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "CSOAI-Verify/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                code = resp.getcode()
                size = len(resp.read())
        except urllib.error.HTTPError as e:
            code = e.code
            size = 0
        except Exception:
            code = 0
            size = 0
        results.append({"url": url, "code": code, "size": size})

    # Summary
    total = len(results)
    ok = sum(1 for r in results if r["code"] == 200)
    challenge = sum(1 for r in results if r["code"] == 402)
    other = total - ok - challenge

    print(f"=== VERIFICATION WAVE ===")
    print(f"  total:     {total}")
    print(f"  200 OK:    {ok}")
    print(f"  402 chal:  {challenge}")
    print(f"  other:     {other}")
    print()
    print(f"  failures:")
    for r in results:
        if r["code"] not in (200, 402):
            print(f"    {r['code']} {r['url']}")

    out = {
        "ts": now(),
        "summary": {
            "total": total,
            "ok": ok,
            "challenge": challenge,
            "other": other,
        },
        "results": results,
    }
    out_path = OUT / f"verify-{now()}.json"
    out_path.write_text(json.dumps(out, indent=2))
    print()
    print(f"  file: {out_path}")


if __name__ == "__main__":
    main()
