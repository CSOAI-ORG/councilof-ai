#!/usr/bin/env python3
"""ots-stamp.py — create a REAL detached OpenTimestamps proof (.ots) for a file or digest.

WHY THIS WAS REWRITTEN (2026-09-16, correction C-2026-0916-02)
The previous version wrote the calendar's raw HTTP response bytes to disk and called
them a proof. A calendar's /digest/<hex> endpoint returns only the *timestamp fragment*
for the operations after the digest. A detached .ots file is:

    magic header + version + file-hash-op + file digest + serialized timestamp

so those files carried no magic header, committed to nothing verifiable, and the
OpenTimestamps library rejects them with BadMagicError. Three published proofs
(swift-measure, cobol-measure, stablecoins-extended) were affected.

A stamp is a REQUEST, not evidence. The calendars commit to Bitcoin on their own
schedule; the proof only becomes evidence once upgraded (scripts/ots-upgrade.py).
This script therefore always reports PENDING and never says "anchored".

Usage:
  ./ots-stamp.py --file <path>            # stamp the file's bytes -> <path>.ots
  ./ots-stamp.py --file <path> --out X    # explicit output path
  ./ots-stamp.py --verify <path.ots>      # deserialize and print what it commits to
"""
import argparse, hashlib, sys
from pathlib import Path

from opentimestamps.core.timestamp import DetachedTimestampFile, Timestamp
from opentimestamps.core.op import OpSHA256
from opentimestamps.core.serialize import BytesSerializationContext, BytesDeserializationContext
from opentimestamps.calendar import RemoteCalendar

CALENDARS = [
    "https://a.pool.opentimestamps.org",
    "https://b.pool.opentimestamps.org",
    "https://alice.btc.calendar.opentimestamps.org",
    "https://bob.btc.calendar.opentimestamps.org",
]


def stamp_file(path: Path, out: Path) -> dict:
    data = path.read_bytes()
    digest = hashlib.sha256(data).digest()
    ts = Timestamp(digest)
    submitted, errors = [], []
    for url in CALENDARS:
        try:
            ts.merge(RemoteCalendar(url).submit(digest, timeout=20))
            submitted.append(url)
        except Exception as e:  # a calendar being down is not a failure of the stamp
            errors.append({"calendar": url, "error": str(e)[:120]})
    if not submitted:
        return {"ok": False, "digest": digest.hex(), "errors": errors}
    dtf = DetachedTimestampFile(OpSHA256(), ts)
    ctx = BytesSerializationContext()
    dtf.serialize(ctx)
    out.write_bytes(ctx.getbytes())
    return {
        "ok": True,
        "file": str(path),
        "out": str(out),
        "sha256": digest.hex(),
        "calendars": submitted,
        "errors": errors,
        "state": "PENDING_BITCOIN_CONFIRMATION",
        "note": "A stamp is a request. Run scripts/ots-upgrade.py until a Bitcoin attestation lands.",
    }


def verify(path: Path) -> dict:
    ctx = BytesDeserializationContext(path.read_bytes())
    dtf = DetachedTimestampFile.deserialize(ctx)
    atts = [type(a).__name__ for _, a in dtf.timestamp.all_attestations()]
    return {
        "file": str(path),
        "commits_to_sha256": dtf.file_digest.hex(),
        "attestations": atts,
        "bitcoin_attested": any("Bitcoin" in a for a in atts),
    }


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--file")
    p.add_argument("--out")
    p.add_argument("--verify")
    a = p.parse_args()
    import json
    if a.verify:
        print(json.dumps(verify(Path(a.verify)), indent=2)); return 0
    if not a.file:
        p.print_help(); return 1
    src = Path(a.file)
    out = Path(a.out) if a.out else Path(str(src) + ".ots")
    r = stamp_file(src, out)
    print(json.dumps(r, indent=2))
    return 0 if r.get("ok") else 1


if __name__ == "__main__":
    sys.exit(main())
