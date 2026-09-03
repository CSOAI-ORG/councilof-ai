#!/usr/bin/env python3
"""csoai-auto-ots.py — daily OTS anchorer.

Lane-doable: walks the queue, computes the digest of every atom body,
submits each one to a.pool.opentimestamps.org, saves the .ots proof
file next to the digest. The verifier at /gspc-verify reads these
.ots files to prove the timestamp.

This runs daily via com.csoai.anchor-daily LaunchAgent.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue"
MAX_PAYLOAD = 3072

# Calendars are asked directly. The /digest aggregator returns a fragment, not
# a detached proof, and writing that fragment to a .ots file is what produced
# 112 unreadable "proofs".
CALENDARS = [
    "https://alice.btc.calendar.opentimestamps.org",
    "https://bob.btc.calendar.opentimestamps.org",
    "https://btc.calendar.catallaxy.com",
    "https://finney.calendar.eternitywall.com",
]


def canonical(obj: dict) -> bytes:
    def rec(v):
        if isinstance(v, list):
            return [rec(x) for x in v]
        if isinstance(v, dict):
            return {k: rec(v[k]) for k in sorted(v.keys())}
        return v
    return json.dumps(rec(obj), separators=(",", ":"), ensure_ascii=False).encode("utf-8")



# One stamper for the estate. This file's own fixed implementation was moved to
# ots_stamp.py after a second caller shipped with the pre-fix body copied in.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from ots_stamp import submit_ots, attestation_state, ots_reads  # noqa: E402


def _ots_reads(path) -> bool:
    """True only if the file on disk is a proof `ots verify` could read.

    An unreadable .ots is worse than an absent one: it sits beside an atom
    looking like evidence. This guard lets the writer heal its own past output
    instead of skipping it on a size check.
    """
    try:
        return ots_reads(path.read_bytes())
    except Exception:
        return False


def main():
    ap = argparse.ArgumentParser(description="Daily OTS anchorer.")
    ap.add_argument("--limit", type=int, default=500)
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — AUTO OTS ANCHOR")
    print(f"  limit: {args.limit}")
    print("================================================================")
    print()

    n_anchored = 0
    n_already = 0
    n_failed = 0
    started = time.time()

    for jsonl in sorted(QUEUE.glob("**/*.jsonl")):
        if jsonl.name.startswith("_state"):
            continue
        if jsonl.parent.name.startswith("_"):
            continue
        with open(jsonl) as f:
            for line in f:
                line = line.strip()
                if not line or len(line) > MAX_PAYLOAD:
                    continue
                try:
                    atom = json.loads(line)
                except Exception:
                    continue
                blob = canonical(atom)
                digest = hashlib.sha256(blob).hexdigest()

                ots_path = jsonl.parent / f"{digest[:16]}.ots"
                # Skip only if the existing proof actually READS. Size is not a
                # validity signal: the 112 files this script wrote before the
                # 2026-09-03 fix were 150 bytes each and all failed
                # DetachedTimestampFile.deserialize with BadMagicError. A
                # size-only guard would skip every one of them forever, so the
                # repair would never happen. Parse it or replace it.
                if ots_path.exists() and _ots_reads(ots_path):
                    n_already += 1
                    continue
                if n_anchored >= args.limit:
                    break

                proof = submit_ots(digest)
                if proof:
                    ots_path.write_bytes(proof)  # binary: write_text corrupted it
                    n_anchored += 1
                    if not args.quiet and n_anchored % 25 == 0:
                        print(f"  ... {n_anchored} anchored ({time.time() - started:.0f}s)")
                else:
                    n_failed += 1
                time.sleep(0.5)  # rate-limit
            if n_anchored >= args.limit:
                break

    print(f"\n  anchored:  {n_anchored}")
    print(f"  already:   {n_already}")
    print(f"  failed:    {n_failed}")
    print(f"  total:     {n_anchored + n_already}")
    print(f"  elapsed:   {time.time() - started:.0f}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
