#!/usr/bin/env python3
"""Can a stranger check the bank a card pins? Today, on every axis, no.

A card commits to `compute_evidence.bank_sha256`. The only way that is a claim rather
than a decoration is if someone outside the estate can fetch the bank and get the same
digest. This fetches each published frozen bank anonymously -- no token, no account --
and compares it to what the admission allowlist pins.

Measured 2026-09-06: 0 of 14 resolve. The pod grades against reconstructions under
/opt/gspc-banks whose own rows say `"source": "rebuilt-from-peritem"`; same substance on
12 of 14 axes, different bytes, and bytes are what a digest commits to.

Exit 0 = every allowlisted digest reproduces from the published bank.
Exit 1 = at least one does not (with the axis list).
Exit 2 = could not check. A bank that did not download is UNCHECKABLE, never "matches".
"""
from __future__ import annotations

import hashlib
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ALLOWLIST = ROOT / "scripts" / "runpod_gspc_bank_allowlist.current.json"
BANK_URL = "https://huggingface.co/datasets/csoai/{}/resolve/main/items.jsonl"

# axis -> published bank repo, from scripts/generate_runpod_gspc_playlist.py AXES.
AXIS_BANK = {
    "safety": "gspc-agi", "provenance": "gspc-prv", "continuity": "gspc-asi",
    "conformance": "gspc-mcp", "openness": "gspc-oss", "machinery-conformity": "gspc-mach",
    "cross-reality": "gspc-xr", "detector-interop": "gspc-det", "art5-safeguard": "gspc-art5",
    "affect": "gspc-affect", "jail": "gspc-jail", "swarm": "gspc-swarm",
    "care": "gspc-care", "governance": "gspc-gov",
}


def fetch(url: str) -> bytes:
    # Deliberately unauthenticated: the whole question is what a stranger can do.
    req = urllib.request.Request(url, headers={"User-Agent": "csoai-bank-pin-check"})
    return urllib.request.urlopen(req, timeout=60).read()


def main() -> int:
    try:
        allow = {b["axis"]: b["sha256"] for b in json.loads(ALLOWLIST.read_text())["banks"]}
    except Exception as exc:  # noqa: BLE001
        print(f"UNCHECKABLE: cannot read the allowlist: {exc}", file=sys.stderr)
        return 2

    rows, unreadable = [], []
    for axis, pinned in sorted(allow.items()):
        repo = AXIS_BANK.get(axis)
        if not repo:
            unreadable.append((axis, "no published bank is mapped for this axis"))
            continue
        try:
            published = hashlib.sha256(fetch(BANK_URL.format(repo))).hexdigest()
        except (urllib.error.URLError, OSError) as exc:
            unreadable.append((axis, f"{repo}: {type(exc).__name__}"))
            continue
        rows.append((axis, repo, pinned, published, pinned == published))

    for axis, repo, pinned, published, ok in rows:
        print(f"  {'ok  ' if ok else 'MISS'}  {axis:22} {repo:14} pinned {pinned[:12]}  published {published[:12]}")
    for axis, why in unreadable:
        print(f"  UNCHECKABLE  {axis:22} {why}")

    miss = [r for r in rows if not r[4]]
    if unreadable:
        print(f"\nUNCHECKABLE: {len(unreadable)} bank(s) did not download. Not the same as matching.", file=sys.stderr)
        return 2
    if miss:
        print(
            f"\n[FAIL] {len(miss)} of {len(rows)} allowlisted bank digests do not reproduce from the\n"
            f"published bank, so a stranger cannot check what these cards were graded against.\n"
            f"The pod grades reconstructions under /opt/gspc-banks carrying\n"
            f'  "source": "rebuilt-from-peritem"\n'
            f"Fix by pinning the PUBLISHED bank, or by publishing the normalisation between them.\n"
            f"See docs/operations/BANK-PIN-STRANGER-RECOMPUTABILITY.md"
        )
        return 1
    print(f"\n[OK] all {len(rows)} allowlisted bank digests reproduce from the published banks.")
    return 0


def selftest() -> int:
    """Prove it can go both ways, against controlled bytes."""
    import io

    global fetch  # noqa: PLW0603
    real = fetch

    def quiet(fn):
        """main() narrates; the selftest only wants its exit code."""
        buf, saved = io.StringIO(), sys.stdout
        sys.stdout = buf
        try:
            return fn()
        finally:
            sys.stdout = saved
    body = b'{"request":"q","expected":"COMPLY"}\n'
    digest = hashlib.sha256(body).hexdigest()

    cases = []
    for label, pinned, want in (
        ("a pin that matches the published bank PASSES", digest, 0),
        ("a pin that does not match FAILS", "0" * 64, 1),
    ):
        fetch = lambda url, _b=body: _b  # noqa: E731
        saved = ALLOWLIST.read_text()
        try:
            tmp = json.dumps({"schema": "x", "banks": [{"axis": "safety", "sha256": pinned}]})
            ALLOWLIST.write_text(tmp)
            got = quiet(main)
        finally:
            ALLOWLIST.write_text(saved)
        cases.append((label, got, want))

    def unreachable(url):
        raise urllib.error.URLError("no network")

    fetch = unreachable
    saved = ALLOWLIST.read_text()
    try:
        ALLOWLIST.write_text(json.dumps({"schema": "x", "banks": [{"axis": "safety", "sha256": digest}]}))
        cases.append(("an unreachable bank is UNCHECKABLE, not a match", quiet(main), 2))
    finally:
        ALLOWLIST.write_text(saved)

    fetch = real
    bad = 0
    for label, got, want in cases:
        ok = got == want
        bad += not ok
        print(f"  {'ok  ' if ok else 'FAIL'}  {label}  (exit {got}, want {want})")
    if bad:
        print(f"\nselftest FAILED: {bad} of {len(cases)}", file=sys.stderr)
        return 1
    print(f"\n{len(cases)} passed — provably red on a bad pin, green on a good one, UNCHECKABLE when offline.")
    return 0


if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv[1:] else main())
