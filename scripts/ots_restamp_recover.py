#!/usr/bin/env python3
"""Recover .ots.invalid files that are actually healthy calendar response fragments.

The earlier producer defect: writing the HTTP response straight to *.ots produced
fragments that ots_guard.py correctly rejected as "NOT OpenTimestamps proofs" — but the
fragments are perfectly healthy calendar responses (130-210 bytes starting f008...).
We need to RE-STAMP each one as a proper detached proof by submitting the source
artifact's digest to the calendar and assembling a real proof file.
"""
import argparse, hashlib, io, json, pathlib, sys
from opentimestamps.core.serialize import StreamDeserializationContext, BytesSerializationContext
from opentimestamps.core.timestamp import DetachedTimestampFile, Timestamp
from opentimestamps.core.op import OpSHA256
from opentimestamps.calendar import RemoteCalendar

CALENDARS = ["https://a.pool.opentimestamps.org", "https://b.pool.opentimestamps.org",
             "https://alice.btc.calendar.opentimestamps.org", "https://bob.btc.calendar.opentimestamps.org"]


def is_proof(b):
    try:
        DetachedTimestampFile.deserialize(StreamDeserializationContext(io.BytesIO(b)))
        return True
    except Exception:
        return False


def find_source(ots_path: pathlib.Path):
    """Aggressive resolver: handles direct siblings + underscore-flat mirror paths."""
    stem = ots_path.name[:-len('.ots.invalid')]
    parent = ots_path.parent

    # 1) Direct sibling candidates
    for ext in ['.json', '.unsigned.json']:
        cand = parent / f"{stem}{ext}"
        if cand.exists():
            return cand

    # 2) Underscore-flattened mirror encoding
    # /public/interop/foo/bar/baz.json → public_interop_foo_bar_baz.json (in /ots/)
    if stem.startswith('public_interop_'):
        rest = stem[len('public_interop_'):]
        for root in [pathlib.Path('public/interop'), pathlib.Path('public')]:
            for ext in ['.json', '.unsigned.json']:
                cand = root / f"{rest}{ext}"
                if cand.exists():
                    return cand
            # Try nested: split at next underscore
            for split_at in range(1, len(rest)):
                cand = root / rest[:split_at] / f"{rest[split_at+1:]}.json"
                if cand.exists():
                    return cand
                cand = root / rest[:split_at] / f"{rest[split_at+1:]}.unsigned.json"
                if cand.exists():
                    return cand

    if stem.startswith('public_well-known_'):
        rest = stem[len('public_well-known_'):]
        for root in [pathlib.Path('public/.well-known'), pathlib.Path('public')]:
            for ext in ['.json', '.unsigned.json']:
                cand = root / f"{rest}{ext}"
                if cand.exists():
                    return cand

    return None


def stamp(src: pathlib.Path):
    """Submit digest to calendars and return a properly serialized proof."""
    digest = hashlib.sha256(src.read_bytes()).digest()
    ts = Timestamp(digest)
    got = []
    for url in CALENDARS:
        try:
            cal = RemoteCalendar(url)
            ts.merge(cal.submit(digest, timeout=15))
            got.append(url)
        except Exception:
            pass
    if not got:
        return None, digest.hex()
    ctx = BytesSerializationContext()
    DetachedTimestampFile(OpSHA256(), ts).serialize(ctx)
    return ctx.getbytes(), digest.hex()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--root", default="public")
    ap.add_argument("--max", type=int, default=0, help="0 = unlimited")
    a = ap.parse_args()

    root = pathlib.Path(a.root)
    invalid_files = sorted(root.rglob('*.ots.invalid'))

    repaired = []
    skipped_no_source = []
    failed = []

    count = 0
    for f in invalid_files:
        if a.max and count >= a.max:
            break
        src = find_source(f)
        if src is None:
            skipped_no_source.append(str(f))
            continue
        if a.dry_run:
            repaired.append({"invalid": str(f), "source": str(src), "state": "would_repair"})
            count += 1
            continue
        # Re-stamp from the source bytes
        ots_bytes, digest_hex = stamp(src)
        if ots_bytes is None:
            failed.append({"invalid": str(f), "sha256": digest_hex, "reason": "no_calendar_response"})
            continue
        # Write to the .ots.invalid path (replace the false content with the real proof)
        f.write_bytes(ots_bytes)
        # ALSO write the proper sibling .ots next to the source if not present
        sibling = src.with_name(src.name + '.ots')
        if not sibling.exists():
            sibling.write_bytes(ots_bytes)
        # Rename: drop the .invalid suffix so ots_guard sees it as a real .ots
        if str(f).endswith('.ots.invalid'):
            new_path = pathlib.Path(str(f)[:-len('.invalid')])
            f.rename(new_path)
            repaired.append({"proof": str(new_path), "source": str(src), "sha256": digest_hex, "state": "PENDING_BITCOIN_CONFIRMATION"})
        else:
            repaired.append({"proof": str(f), "source": str(src), "sha256": digest_hex, "state": "PENDING_BITCOIN_CONFIRMATION"})
        count += 1
        if count % 50 == 0:
            print(f"  ... {count} repaired", file=sys.stderr)

    print(json.dumps({
        "repaired_count": len(repaired),
        "skipped_no_source_count": len(skipped_no_source),
        "failed_count": len(failed),
        "repaired_sample": repaired[:3] + (repaired[-3:] if len(repaired) > 6 else []),
        "skipped_no_source_sample": skipped_no_source[:5],
        "failed_sample": failed[:5],
    }, indent=2))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
