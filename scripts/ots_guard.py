#!/usr/bin/env python3
"""Every published .ots file must actually be an OpenTimestamps proof.

WHY THIS EXISTS (found 2026-09-04). scripts/badger/csoai-layer0-ceremony.py was writing:

    public/interop/layer0-root-<ts>.ots
    === OTS PENDING ===
    merkle_root:
    status: pending
    anchor_time: 20260904T051418Z
    ===

A plain-text placeholder with an .ots extension. It is not a timestamp — the reference
opentimestamps library rejects it with BadMagicError, because it carries none of the format's
magic bytes. Fifteen were written in 45 minutes on one morning, eleven of them with an EMPTY
merkle_root, so they did not even record which digest they claimed to be stamping. They live in
public/interop/, i.e. they are served.

That matters beyond tidiness. The estate counts .ots files as evidence of Bitcoin anchoring, and
this repository's real anchoring is genuinely good: of 1080 tracked .ots files, 656 carry a real
Bitcoin block-header attestation and 409 are honestly calendar-pending. Mixing fifteen text stubs
into that population makes the honest number unquotable, and an anchoring claim is the one claim
this estate cannot afford to have a soft edge on.

WHAT IS CHECKED, and deliberately no more: the OpenTimestamps magic header. That is enough to
separate a real proof from a stub with the right file name, and it needs no dependency, so this
guard runs anywhere — including in a CI job that has not pip-installed the OTS client. It does
NOT verify that a stamp is confirmed in Bitcoin; `ots verify` with a node does that, and claiming
otherwise here would be the same class of error this guard exists to catch.

    python3 scripts/ots_guard.py            # walk public/, exit 1 on any non-OTS .ots
    python3 scripts/ots_guard.py --selftest # prove it catches a stub and passes a real proof
"""
from __future__ import annotations
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUB = ROOT / "public"

# The OpenTimestamps detached-proof header, from the format spec: a NUL-padded ASCII banner
# followed by a fixed 8-byte tag. Any file that does not open with this is not a proof.
OTS_MAGIC = b"\x00OpenTimestamps\x00\x00Proof\x00\xbf\x89\xe2\xe8\x84\xe8\x92\x94"

# Bitcoin block-header attestation vs pending calendar attestation, reported for context only.
BTC_TAG = bytes.fromhex("0588960d73d71901")
PENDING_TAG = bytes.fromhex("83dfe30d2ef90c8e")


def looks_like_ots(b: bytes) -> bool:
    return b.startswith(OTS_MAGIC)


def scan(root: Path) -> tuple[list[Path], list[Path], int, int]:
    good: list[Path] = []
    bad: list[Path] = []
    btc = pending = 0
    for p in sorted(root.rglob("*.ots")):
        b = p.read_bytes()
        if looks_like_ots(b):
            good.append(p)
            if BTC_TAG in b:
                btc += 1
            elif PENDING_TAG in b:
                pending += 1
        else:
            bad.append(p)
    return good, bad, btc, pending


def selftest() -> int:
    import tempfile

    d = Path(tempfile.mkdtemp())
    # the exact shape the ceremony was emitting
    (d / "stub.ots").write_bytes(b"=== OTS PENDING ===\nmerkle_root: \nstatus: pending\n===\n")
    (d / "real.ots").write_bytes(OTS_MAGIC + b"\x01" + b"\x00" * 32)
    good, bad, _, _ = scan(d)
    fails = []
    if [p.name for p in bad] != ["stub.ots"]:
        fails.append(f"expected the text stub to be caught, got bad={[p.name for p in bad]}")
    if [p.name for p in good] != ["real.ots"]:
        fails.append(f"expected the real header to pass, got good={[p.name for p in good]}")
    for f in fails:
        print("FAIL:", f)
    print("selftest:", "FAILED" if fails else "ok — a text stub is rejected, a real header passes")
    return 1 if fails else 0


def main() -> int:
    if "--selftest" in sys.argv:
        return selftest()
    if not PUB.exists():
        print(f"ots-guard: no {PUB} — nothing scanned")
        return 2
    good, bad, btc, pending = scan(PUB)
    print(f"ots-guard: {len(good) + len(bad)} .ots file(s) under public/")
    print(f"  parse as OpenTimestamps proofs : {len(good)}")
    print(f"    of those, Bitcoin-attested   : {btc}")
    print(f"    of those, calendar-pending   : {pending}")
    if bad:
        print(f"\n✗ NOT OpenTimestamps proofs — {len(bad)} file(s) carrying the .ots name:")
        for p in bad:
            print(f"    {p.relative_to(ROOT)}  ({p.stat().st_size}b)")
        print("\n  An .ots name is a claim that the bytes are a timestamp. Rename the file or")
        print("  produce a real stamp; do not publish a placeholder under this extension.")
        return 1
    print("\n✓ every .ots file under public/ is a real OpenTimestamps proof.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
