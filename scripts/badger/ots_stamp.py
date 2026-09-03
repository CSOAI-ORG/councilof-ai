#!/usr/bin/env python3
"""The estate's one OpenTimestamps primitive: stamp, read, and state a proof.

WHY THIS MODULE EXISTS. A correct stamper was written into csoai-auto-ots.py on
2026-09-03 after 112 unverifiable .ots files were traced to four faults in it.
Hours later csoai-bridges.py shipped with all four faults again, because it was
written by copying the old body rather than calling the fixed one. A fix that
lives in one file's function body is not a fix; it is a fix until the next copy.

So the primitive lives here and both callers import it. Adding a third caller
means importing this, not re-typing it.

Three functions, one rule each:

  submit_ots(digest_hex)  - stamps the REAL digest, merged across calendars,
                            serialised as a DetachedTimestampFile. Returns None
                            rather than bytes no verifier can read.
  ots_reads(data)         - True only if `ots verify` could parse it at all.
  attestation_state(data) - what the proof ACTUALLY carries right now. This is
                            the honesty function: a stamp is not an anchor.
                            "pending" means a calendar accepted the digest and
                            has not yet committed it to Bitcoin. Only "bitcoin"
                            is a proof, and it names the block height.
"""
from __future__ import annotations

import io

CALENDARS = [
    "https://a.pool.opentimestamps.org",
    "https://alice.btc.calendar.opentimestamps.org",
    "https://bob.btc.calendar.opentimestamps.org",
]


def submit_ots(digest_hex: str, timeout: int = 15) -> bytes | None:
    """Stamp a digest and return REAL detached-timestamp bytes, or None.

    The four faults this exists to never repeat:
      1. Appending a constant to the digest (`digest_hex + "0123456789abcdef"`),
         so the calendar stamped sha256(atom)||constant and the proof attested
         nothing about the atom.
      2. Writing the raw HTTP body as the .ots. A calendar returns a timestamp
         FRAGMENT; the magic header and digest binding were never written, so
         every file failed to deserialize with BadMagicError.
      3. Passing a Python bytes object as a curl argument, coercing it to str.
      4. Decoding the binary response as UTF-8 with errors="ignore".

    Returns None when no calendar answers. An unverifiable proof is worse than
    an absent one: it sits beside the artifact looking like evidence.
    """
    from opentimestamps.calendar import RemoteCalendar
    from opentimestamps.core.op import OpSHA256
    from opentimestamps.core.serialize import StreamSerializationContext
    from opentimestamps.core.timestamp import DetachedTimestampFile, Timestamp

    digest = bytes.fromhex(digest_hex)
    ts = Timestamp(digest)
    answered = 0
    for url in CALENDARS:
        try:
            ts.merge(RemoteCalendar(url).submit(digest))
            answered += 1
        except Exception:
            continue
    if not answered:
        return None
    out = io.BytesIO()
    DetachedTimestampFile(OpSHA256(), ts).serialize(StreamSerializationContext(out))
    return out.getvalue()


def _parse(data: bytes):
    from opentimestamps.core.serialize import StreamDeserializationContext
    from opentimestamps.core.timestamp import DetachedTimestampFile

    return DetachedTimestampFile.deserialize(StreamDeserializationContext(io.BytesIO(data)))


def ots_reads(data: bytes) -> bool:
    """True only if the bytes are a detached timestamp `ots verify` could read."""
    try:
        _parse(data)
        return True
    except Exception:
        return False


def _attestations(t):
    out = list(t.attestations)
    for sub in t.ops.values():
        out += _attestations(sub)
    return out


def attestation_state(data: bytes | None) -> dict:
    """What a proof carries RIGHT NOW. Never what was requested of it.

    Returns one of:
      {"state": "absent"}                      - no stamp was made
      {"state": "unreadable"}                  - bytes exist but parse as nothing
      {"state": "pending", "calendars": [...]} - accepted, not yet in a block
      {"state": "bitcoin", "block_height": N}  - a proof

    Only "bitcoin" may be described as anchored. Counting "pending" as anchored
    is the specific error this function exists to make impossible.
    """
    from opentimestamps.core.notary import BitcoinBlockHeaderAttestation, PendingAttestation

    if not data:
        return {"state": "absent"}
    try:
        d = _parse(data)
    except Exception:
        return {"state": "unreadable"}
    atts = _attestations(d.timestamp)
    heights = [a.height for a in atts if isinstance(a, BitcoinBlockHeaderAttestation)]
    if heights:
        # chain_verified is False and stays False. This reads the attestation the
        # proof CARRIES; it does not walk the operation chain from the document
        # digest to that block header and check it against Bitcoin. A proof with a
        # corrupted merkle path still parses and still names a block — proven by
        # the flipped-byte case in _selftest. Calling that "anchored" without
        # saying so would be this module's own version of counting Path.exists().
        # Real validation needs `ots verify` against a Bitcoin node.
        return {"state": "bitcoin", "block_height": min(heights), "chain_verified": False}
    cals = sorted({
        a.uri.decode() if isinstance(a.uri, bytes) else a.uri
        for a in atts if isinstance(a, PendingAttestation)
    })
    if cals:
        return {"state": "pending", "calendars": cals}
    return {"state": "unreadable"}


def describe(state: dict) -> str:
    """One honest sentence for a card's notes."""
    s = state.get("state")
    if s == "bitcoin":
        return (f"Carries a Bitcoin attestation naming block {state['block_height']}. "
                "The operation chain has not been validated against the chain itself "
                "(`ots verify` with a Bitcoin node does that).")
    if s == "pending":
        return ("Not anchored: a calendar holds this digest and has not yet committed it "
                "to Bitcoin. Re-run scripts/ots-upgrade.py to complete the proof.")
    if s == "unreadable":
        return "Not anchored: the stamp bytes do not parse. Treat as no stamp."
    return "Not anchored: no OTS stamp was made."


def _selftest() -> int:
    """Prove attestation_state goes RED. A guard that has never failed is untested.

    Every case here is the shape that produced a false "anchored" count somewhere
    in this estate: bytes that look like evidence, a truthy value standing in for a
    verdict, or a key that silently returns None.

        python3 scripts/badger/ots_stamp.py --selftest
    """
    import glob
    import pathlib

    cases, failed = [], 0

    def check(name, got, want):
        nonlocal failed
        ok = got == want
        if not ok:
            failed += 1
        cases.append((ok, name, got, want))

    check("no stamp is not an anchor", attestation_state(None)["state"], "absent")
    check("empty bytes are not an anchor", attestation_state(b"")["state"], "absent")
    check("arbitrary bytes are not an anchor",
          attestation_state(b"looks like evidence")["state"], "unreadable")
    # The 12 pre-fix files: raw calendar fragments with no magic header. They sat
    # beside atoms and were counted as anchors.
    check("a raw calendar fragment is not an anchor",
          attestation_state(bytes.fromhex("00" * 64))["state"], "unreadable")

    # Fixtures are selected by INSPECTING THE PROOF DIRECTLY, never by calling the
    # function under test. Selecting them with attestation_state made the suite
    # self-defeating: a mutation that reported every pending stamp as "bitcoin"
    # emptied the pending list, so those cases SKIPPED and the suite still said
    # "0 failed". Mutation-tested by nicholas-48's suggestion; that is how it was
    # found. A guard that selects its own evidence proves nothing.
    from opentimestamps.core.notary import (
        BitcoinBlockHeaderAttestation as _BTC,
        PendingAttestation as _PEND,
    )

    def _raw_kinds(path):
        try:
            return {type(a) for a in _attestations(_parse(pathlib.Path(path).read_bytes()).timestamp)}
        except Exception:
            return set()

    real = [f for f in glob.glob("**/*.ots", recursive=True) if "node_modules" not in f]
    anchored = [f for f in real if _BTC in _raw_kinds(f)]
    pending = [f for f in real if _BTC not in _raw_kinds(f) and _PEND in _raw_kinds(f)]

    # A missing fixture is a FAILURE, not a skip. Skipping is how a mutated suite
    # stays green.
    check("a bitcoin-attested fixture exists to test against", bool(anchored), True)
    check("a pending fixture exists to test against", bool(pending), True)

    if anchored:
        data = pathlib.Path(anchored[0]).read_bytes()
        st = attestation_state(data)
        check("a real proof reports bitcoin", st["state"], "bitcoin")
        check("a real proof names a block height", isinstance(st.get("block_height"), int), True)
        # Flip one byte in the middle and watch it stop claiming an anchor.
        i = len(data) // 2
        corrupt = data[:i] + bytes([data[i] ^ 0xFF]) + data[i + 1:]
        # DOCUMENTED LIMIT, not a passing guard. A byte flipped in the merkle path
        # leaves the file parseable and the attestation intact, so this still says
        # "bitcoin". That is precisely why the result carries chain_verified=False
        # and why no caller may render it as a bare "anchored".
        check("a corrupted proof STILL claims a block — the limit is real",
              attestation_state(corrupt)["state"], "bitcoin")
        check("...so every bitcoin result declares it is not chain-verified",
              attestation_state(corrupt).get("chain_verified"), False)
        check("a genuine proof declares it too", st.get("chain_verified"), False)
        check("a truncated proof stops it reporting bitcoin",
              attestation_state(data[: len(data) // 3])["state"] != "bitcoin", True)
    else:
        check("anchored-proof cases ran", False, True)

    if pending:
        st = attestation_state(pathlib.Path(pending[0]).read_bytes())
        check("a pending stamp is NEVER reported as bitcoin", st["state"], "pending")
        check("a pending stamp carries no block height", "block_height" in st, False)
        check("a pending stamp names its calendars", bool(st.get("calendars")), True)
    else:
        check("pending-stamp cases ran", False, True)

    for ok, name, got, want in cases:
        print(f"  {'ok  ' if ok else 'FAIL'}  {name}" + ("" if ok else f"  -> got {got!r}, want {want!r}"))
    print(f"\n  {len(cases) - failed} passed, {failed} failed")
    if failed:
        print("\nots_stamp SELFTEST FAILED — attestation_state does not behave as specified.")
        return 1
    print("\nots_stamp selftest OK — a stamp, a calendar fragment and arbitrary bytes are")
    print("never reported as an anchor, and every bitcoin result declares chain_verified")
    print("False, because a proof with a corrupted merkle path still names a block.")
    return 0


if __name__ == "__main__":
    import sys as _sys
    if "--selftest" in _sys.argv:
        raise SystemExit(_selftest())
    print(__doc__)
