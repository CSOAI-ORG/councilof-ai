#!/usr/bin/env python3
"""Upgrade detached .ots proofs from pending-calendar to real Bitcoin attestations.

WHY THIS EXISTS. An OpenTimestamps stamp is created instantly but carries only
PendingAttestations until a calendar's commitment lands in a Bitcoin block (~1-6h).
The proof must then be UPGRADED — fetched back from the calendar — or the published
file stays pending forever even though the Bitcoin proof exists.

On 2026-09-03 the public root's .ots had been pending 20+ hours while the estate
described it as Bitcoin-anchored. The commitment WAS in the chain; nothing had ever
run the upgrade. An unupgraded stamp is not a failed stamp, but it is not a proof
either. Run this over every .ots we publish, on a schedule.

    python3 scripts/ots-upgrade.py public/interop/*.ots

Exit 0 = at least one file now carries a Bitcoin attestation.
Exit 1 = still pending everywhere. Not an error: the calendars simply have not
         committed yet. A file that did not improve is never rewritten.
"""
from __future__ import annotations

import io
import sys
from pathlib import Path

from opentimestamps.calendar import RemoteCalendar
from opentimestamps.core.notary import BitcoinBlockHeaderAttestation, PendingAttestation
from opentimestamps.core.serialize import (
    StreamDeserializationContext,
    StreamSerializationContext,
)
from opentimestamps.core.timestamp import DetachedTimestampFile


def attestations(t):
    out = list(t.attestations)
    for sub in t.ops.values():
        out += attestations(sub)
    return out


def upgrade(t) -> bool:
    changed = False
    for att in list(t.attestations):
        if isinstance(att, PendingAttestation):
            uri = att.uri.decode() if isinstance(att.uri, bytes) else att.uri
            try:
                t.merge(RemoteCalendar(uri).get_timestamp(t.msg))
                changed = True
            except Exception as exc:  # reported, never swallowed
                print(f"    {uri}: {type(exc).__name__}")
    for sub in t.ops.values():
        changed |= upgrade(sub)
    return changed


def main(paths: list[str]) -> int:
    any_btc = False
    unreadable = 0
    for p in paths:
        path = Path(p)
        if not path.exists():
            print(f"  MISSING {path}")
            continue
        # An unparseable .ots must NOT stop the run. Before this, one BadMagicError
        # raised out of main() and every remaining file in the batch went unupgraded
        # — so a handful of pre-fix fragments could silently hold the whole estate
        # at "pending". Report it and carry on; that file is a non-proof, not a
        # reason to abandon the real ones behind it.
        try:
            dtf = DetachedTimestampFile.deserialize(
                StreamDeserializationContext(io.BytesIO(path.read_bytes()))
            )
        except Exception as exc:
            print(f"  {path.name}: NOT A TIMESTAMP ({type(exc).__name__}) — skipped, never a proof")
            unreadable += 1
            continue
        upgrade(dtf.timestamp)
        after = attestations(dtf.timestamp)
        blocks = sorted(
            a.height for a in after if isinstance(a, BitcoinBlockHeaderAttestation)
        )
        if blocks:
            out = io.BytesIO()
            dtf.serialize(StreamSerializationContext(out))
            path.write_bytes(out.getvalue())
            print(f"  {path.name}: BITCOIN blocks {blocks}")
            any_btc = True
        else:
            print(f"  {path.name}: still pending — not rewritten")
    if unreadable:
        print(f"\n  {unreadable} file(s) are not timestamps at all. They are not stamps and never")
        print("  proofs; re-stamp them from source with scripts/badger/ots_stamp.py.")
    return 0 if any_btc else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:] or ["public/interop/layer0-ceremony-2026-09-03.json.ots"]))
