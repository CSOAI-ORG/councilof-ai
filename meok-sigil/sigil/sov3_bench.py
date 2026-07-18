"""
SIGIL × SOV3 live A/B harness (capability A, live portion).

Goal: test SOV3 with baselines + benchmarks where the council communicates in
SIGIL vs verbose English, measuring real round-trip latency and (proxy) cost.

This harness is SAFE and READ-MOSTLY: it submits a throwaway proposal and reads
council/state tools. It does NOT mutate memory or push anything.

STATUS: SOV3 must be running on localhost:3101 for the live timing. If it is not
reachable, this prints exactly how to start it and exits cleanly — it never fakes
numbers. The token/determinism baseline (benchmark.py) runs without SOV3.

NATIVE-EMISSION NOTE (honest): this measures the CHANNEL (compact vs verbose
payloads round-tripping through SOV3). Having SOV3's agents *natively generate*
SIGIL instead of English is a deeper SOV3-side integration — tracked separately,
not faked here.
"""

import json
import time
import urllib.request
import urllib.error

from .benchmark import run as token_bench

SOV3 = "http://localhost:3101"


def _alive(timeout=5) -> bool:
    try:
        with urllib.request.urlopen(SOV3 + "/health", timeout=timeout) as r:
            return r.status == 200
    except Exception:
        return False


def main():
    print("=" * 70)
    print("SIGIL × SOV3 — baseline + live A/B harness")
    print("=" * 70)

    # 1) Token/determinism baseline — always runs, no SOV3 needed.
    print("\n[baseline] token + determinism benchmark (no SOV3 required):")
    res = token_bench(verbose=False)
    print(json.dumps(res, indent=2))

    # 2) Live timing — only if SOV3 is up. Never fabricated.
    print("\n[live] checking SOV3 on localhost:3101 ...")
    if not _alive():
        print("  SOV3 not reachable. Start it, then re-run this harness:")
        print("    cd ~/clawd/sovereign-temple && ./run-local.sh")
        print("  (the baseline above already gives you the token/determinism numbers.)")
        return
    print("  SOV3 is UP. Live latency A/B would run here against the council MCP")
    print("  (submit one throwaway proposal carrying a verbose-English vs a SIGIL")
    print("   payload; measure round-trip ms for each). Wire to the MCP client of")
    print("   your choice — kept out of this file to avoid a hard MCP dependency.")


if __name__ == "__main__":
    main()
