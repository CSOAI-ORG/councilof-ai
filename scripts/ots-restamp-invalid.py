#!/usr/bin/env python3
"""Find every .ots under a tree that is not an OpenTimestamps proof and re-stamp it.

Companion to scripts/ots_guard.py, which refuses to let such a file ship. The guard
says what is wrong; this repairs it, from the source bytes, with a real stamp.

A file is repaired only when its source can be identified unambiguously: <name>.ots
next to <name>.json, or <name>.json.ots next to <name>.json. Anything else is listed
and left alone — guessing which bytes a proof was meant to cover is how the defect
started.

  python3 scripts/ots-restamp-invalid.py --dry-run
  python3 scripts/ots-restamp-invalid.py
"""
import hashlib, io, json, sys, pathlib

from opentimestamps.core.serialize import StreamDeserializationContext, BytesSerializationContext
from opentimestamps.core.timestamp import DetachedTimestampFile, Timestamp
from opentimestamps.core.op import OpSHA256
from opentimestamps.calendar import RemoteCalendar

CALENDARS = ["https://a.pool.opentimestamps.org", "https://b.pool.opentimestamps.org",
             "https://alice.btc.calendar.opentimestamps.org", "https://bob.btc.calendar.opentimestamps.org"]


def is_proof(p: pathlib.Path) -> bool:
    try:
        DetachedTimestampFile.deserialize(StreamDeserializationContext(io.BytesIO(p.read_bytes())))
        return True
    except Exception:
        return False


def source_for(p: pathlib.Path):
    stem = p.name[:-4] if p.name.endswith(".ots") else p.name        # drop .ots
    for cand in (p.with_name(stem), p.with_name(stem + ".json")):    # x.json.ots -> x.json ; x.ots -> x.json
        if cand.exists() and cand.is_file():
            return cand
    return None


def stamp(src: pathlib.Path, out: pathlib.Path):
    digest = hashlib.sha256(src.read_bytes()).digest()
    ts = Timestamp(digest)
    got = []
    for url in CALENDARS:
        try:
            ts.merge(RemoteCalendar(url).submit(digest, timeout=20)); got.append(url)
        except Exception:
            pass
    if not got:
        return None, digest.hex()
    ctx = BytesSerializationContext(); DetachedTimestampFile(OpSHA256(), ts).serialize(ctx)
    out.write_bytes(ctx.getbytes())
    return got, digest.hex()


def main() -> int:
    dry = "--dry-run" in sys.argv
    root = pathlib.Path(sys.argv[sys.argv.index("--root") + 1]) if "--root" in sys.argv else pathlib.Path("public")
    repaired, skipped, failed = [], [], []
    for p in sorted(root.rglob("*.ots")):
        if is_proof(p):
            continue
        src = source_for(p)
        if src is None:
            skipped.append(str(p)); continue
        if dry:
            repaired.append({"ots": str(p), "source": str(src), "dry_run": True}); continue
        # the file name claims .ots; write the real proof beside the source it covers
        out = src.with_name(src.name + ".ots")
        cals, dg = stamp(src, out)
        if cals is None:
            failed.append({"ots": str(p), "sha256": dg}); continue
        if out != p:
            p.unlink()          # the old name carried a claim the bytes could not keep
        repaired.append({"ots": str(out), "source": str(src), "sha256": dg, "calendars": len(cals),
                         "state": "PENDING_BITCOIN_CONFIRMATION"})
    print(json.dumps({"repaired": len(repaired), "skipped_no_source": skipped,
                      "failed": failed, "detail": repaired}, indent=2))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
