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
import hashlib
import re
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


def covers(p: Path) -> tuple[str, str]:
    """Does <name>.ots still cover the digest of <name>?

    A VALID PROOF OVER BYTES NOBODY HAS IS NOT PROVENANCE, and the format check above cannot see
    it. Observed 2026-09-04: public/interop/atom-root-2026-09-03.json.ots is a real stamp,
    genuinely anchored to Bitcoin block 965312 — and it covers cbfca3da… while the file beside it
    hashes to 6f9e25e7… and the LIVE published copy hashes to 60f79df4…. Three artefacts, one
    name, and the anchor commits to none of them. The atom root was regenerated after stamping
    (37,522 leaves, then 42,118, then 44,446), orphaning each stamp in turn.

    That is the same fault as editing signed bytes: the signature/stamp is fine, the artefact
    moved. Re-stamp the published bytes, or supersede the artefact under a new name — never
    quietly regenerate underneath a stamp that already exists.

    Returns (state, detail). UNKNOWN when the stamped file is absent, because a missing subject
    says nothing about coverage and must never read as OK.
    """
    # TWO NAMING CONVENTIONS, and only one implies a sibling file. Credit to
    # scripts/ots-coverage-audit.py (another lane, same day) for pinning this: a naive run
    # reports ~1,580 proofs as having "no target file" and looks catastrophic, when those are
    # DIGEST-NAMED — the filename IS the digest the proof commits to, so it is self-describing
    # and no sibling is expected. Only file-named proofs (foo.json.ots beside foo.json) can be
    # orphaned. Reporting the digest-named ones as UNKNOWN is not wrong, but it buries the real
    # finding under 1,580 lines of noise, and a guard nobody can read is a guard nobody runs.
    subject = p.with_suffix("")  # foo.json.ots -> foo.json
    stem = subject.name
    if not subject.exists():
        if re.fullmatch(r"[0-9a-f]{8,64}(\.[a-z]+)?", stem) or re.search(r"-[0-9a-f]{8,64}(\.[a-z]+)?$", stem):
            return ("SELF_DESCRIBING", "digest-named proof; the name is the commitment, no sibling expected")
        return ("UNKNOWN", "stamped file not present beside the proof")
    try:
        from opentimestamps.core.serialize import BytesDeserializationContext
        from opentimestamps.core.timestamp import DetachedTimestampFile

        d = DetachedTimestampFile.deserialize(BytesDeserializationContext(p.read_bytes()))
        stamped = d.timestamp.msg.hex()
    except ImportError:
        return ("UNKNOWN", "opentimestamps not installed; coverage not checked")
    except Exception as e:
        return ("UNKNOWN", f"proof did not parse for coverage ({type(e).__name__})")
    actual = hashlib.sha256(subject.read_bytes()).hexdigest()
    if stamped == actual:
        return ("COVERS", stamped[:16])
    return ("ORPHANED", f"stamp covers {stamped[:16]}… but {subject.name} is {actual[:16]}…")


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

    # COVERAGE IS TESTED WITH A REAL PROOF, not a hand-built one. The first version of this
    # selftest wrote synthetic .ots bytes (magic + a sha256) and asserted COVERS/ORPHANED while
    # allowing UNKNOWN. Those bytes do not deserialise — UnsupportedMajorVersion — so every case
    # returned UNKNOWN and both assertions passed without ever exercising the check. A guard whose
    # selftest cannot fail is the hole it was written to close, so it is built from a proof that
    # actually parses: copy a known-good stamp beside an identical file (must COVER), and beside a
    # file with one byte changed (must be ORPHANED).
    src = ROOT / "public/interop/layer0-ceremony-2026-09-03.json"
    src_ots = ROOT / "public/interop/layer0-ceremony-2026-09-03.json.ots"
    fails = []
    if src.exists() and src_ots.exists():
        import shutil

        shutil.copy(src, d / "kept.json")
        shutil.copy(src_ots, d / "kept.json.ots")
        shutil.copy(src_ots, d / "moved.json.ots")
        (d / "moved.json").write_bytes(src.read_bytes() + b" ")  # one byte differs
        ck, _ = covers(d / "kept.json.ots")
        cm, _ = covers(d / "moved.json.ots")
        if ck != "COVERS":
            fails.append(f"a real stamp over its own bytes must COVER, got {ck}")
        if cm != "ORPHANED":
            fails.append(f"the same stamp over changed bytes must be ORPHANED, got {cm}")
    else:
        fails.append("no known-good stamp available to test coverage against")
    cu, _ = covers(d / "absent.ots")
    if cu != "UNKNOWN":
        fails.append(f"a stamp with no subject file must be UNKNOWN, not OK — got {cu}")
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
    orphaned = []
    for p in good:
        state, detail = covers(p)
        if state == "ORPHANED":
            orphaned.append((p, detail))
    print(f"  stamps still covering their file : {len(good) - len(orphaned)} of {len(good)} checked")

    if orphaned:
        print(f"\n\u2717 ORPHANED — {len(orphaned)} stamp(s) anchor bytes that no longer exist:")
        for p, detail in orphaned:
            print(f"    {p.relative_to(ROOT)}")
            print(f"      {detail}")
        print("\n  The proof is real and the anchor may be real; the ARTEFACT moved after stamping.")
        print("  Re-stamp the published bytes, or supersede under a new name. Never regenerate")
        print("  underneath an existing stamp — that is 'signed bytes never edited' in another coat.")

    if bad:
        print(f"\n✗ NOT OpenTimestamps proofs — {len(bad)} file(s) carrying the .ots name:")
        for p in bad:
            print(f"    {p.relative_to(ROOT)}  ({p.stat().st_size}b)")
        print("\n  An .ots name is a claim that the bytes are a timestamp. Rename the file or")
        print("  produce a real stamp; do not publish a placeholder under this extension.")
        return 1
    if orphaned:
        return 1
    print("\n✓ every .ots file under public/ is a real proof and still covers its file.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
