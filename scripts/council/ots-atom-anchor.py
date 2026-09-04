#!/usr/bin/env python3
"""Stamp the atom root AS PUBLISHED, and prove the stamp still covers it.

WHY THIS EXISTS (2026-09-04). The atom root was stamped and genuinely anchored to
Bitcoin block 965312, and then the artifact was regenerated underneath the stamp. Four
different files claimed to be "atom-root-2026-09-03":

  published live   sha 60f79df4…  merkle ec680527…  37522 leaves
  repo copy        sha 6f9e25e7…  merkle 52166cbf…  42118 leaves
  repo copy -2     sha 103866d3…  merkle b285e8bd…  44446 leaves
  stamp A covers   sha cbfca3da…   <- matches none of them
  stamp B covers   sha eebb7987…   <- matches none of them

Both stamps carry a real BitcoinBlockHeaderAttestation at height 965312 (block mined
2026-09-03T12:32:49Z), so the anchors are not fake — they simply anchor bytes nobody
has any more. Meanwhile the published file asserts in its own anchor_rule that "ONE
OpenTimestamps stamp commits this root", which for the published bytes was false.

An anchor over bytes that no longer exist is worse than no anchor: it reads as proof.

THE RULE. A stamped artifact is immutable. Do not regenerate a file under a name that
has already been stamped — publish the next snapshot under its own name and stamp that.
verify mode below fails loudly when a proof and its artifact have drifted apart, so this
cannot recur silently.

  python3 ots-atom-anchor.py stamp  <file>   # stamp a file, write <file>.ots
  python3 ots-atom-anchor.py verify <file>   # does <file>.ots still cover <file>?
"""
import hashlib
import json
import sys
from pathlib import Path

from opentimestamps.calendar import RemoteCalendar
from opentimestamps.core.notary import BitcoinBlockHeaderAttestation, PendingAttestation
from opentimestamps.core.op import OpSHA256
from opentimestamps.core.serialize import (
    BytesDeserializationContext,
    BytesSerializationContext,
)
from opentimestamps.core.timestamp import DetachedTimestampFile, Timestamp

CALENDARS = [
    "https://alice.btc.calendar.opentimestamps.org",
    "https://bob.btc.calendar.opentimestamps.org",
    "https://finney.calendar.eternitywall.com",
]


def read_proof(path: Path):
    d = DetachedTimestampFile.deserialize(BytesDeserializationContext(path.read_bytes()))
    btc = [a.height for _, a in d.timestamp.all_attestations()
           if isinstance(a, BitcoinBlockHeaderAttestation)]
    pend = [a.uri for _, a in d.timestamp.all_attestations()
            if isinstance(a, PendingAttestation)]
    return d.file_digest.hex(), btc, pend


def verify(target: Path) -> int:
    proof = target.with_suffix(target.suffix + ".ots")
    if not proof.exists():
        print(f"UNCHECKABLE — no proof at {proof}")
        return 2
    actual = hashlib.sha256(target.read_bytes()).hexdigest()
    stamped, btc, pend = read_proof(proof)
    print(f"  artifact sha256 : {actual}")
    print(f"  proof covers    : {stamped}")
    print(f"  bitcoin blocks  : {btc or 'none yet'}")
    print(f"  pending calendars: {len(pend)}")
    if actual != stamped:
        print("\nDRIFTED — the proof does not cover this artifact. The file was regenerated "
              "after it was stamped, so this anchor proves the existence of bytes that are "
              "no longer here. Publish the current snapshot under a new name and stamp that; "
              "do NOT present this proof as covering the current file.")
        return 1
    print("\nMATCH — the proof covers exactly these bytes."
          + ("" if btc else " Not yet in a Bitcoin block: STAMPED, not ANCHORED."))
    return 0


def stamp(target: Path) -> int:
    digest = hashlib.sha256(target.read_bytes()).digest()
    ts = Timestamp(digest)
    used = []
    for url in CALENDARS:
        try:
            ts.merge(RemoteCalendar(url).submit(digest, timeout=30))
            used.append(url)
        except Exception as e:  # a calendar being down is not a failure of the stamp
            print(f"  calendar {url} unavailable: {type(e).__name__}")
    if not used:
        print("FAILED — no calendar accepted the digest; nothing written.")
        return 1
    d = DetachedTimestampFile(OpSHA256(), ts)
    ctx = BytesSerializationContext()
    d.serialize(ctx)
    out = target.with_suffix(target.suffix + ".ots")
    out.write_bytes(ctx.getbytes())
    print(f"  stamped {target.name} ({digest.hex()[:16]}…) via {len(used)} calendar(s) -> {out.name}")
    print("  STAMPED, not yet ANCHORED — a stamp becomes an anchor only when a calendar "
          "commits it to a Bitcoin block and the proof is upgraded, hours later.")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] not in ("stamp", "verify"):
        print(__doc__)
        sys.exit(2)
    sys.exit((stamp if sys.argv[1] == "stamp" else verify)(Path(sys.argv[2])))
