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
        return {"state": "bitcoin", "block_height": min(heights)}
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
        return f"Anchored: Bitcoin block {state['block_height']}."
    if s == "pending":
        return ("Not anchored: a calendar holds this digest and has not yet committed it "
                "to Bitcoin. Re-run scripts/ots-upgrade.py to complete the proof.")
    if s == "unreadable":
        return "Not anchored: the stamp bytes do not parse. Treat as no stamp."
    return "Not anchored: no OTS stamp was made."
