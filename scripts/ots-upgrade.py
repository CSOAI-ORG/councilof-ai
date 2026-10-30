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


def calendar_reason(exc) -> str:
    """The calendar's OWN words about why it cannot complete this proof yet.

    CommitmentNotFoundError carries the calendar's HTTP 404 body in .reason:
    "Timestamped by transaction <txid>; waiting for 6 confirmations", or
    "Pending confirmation in Bitcoin blockchain". That body is the only statement
    of the proof's true state, and it is the difference between "we do not know"
    and "Bitcoin already holds this commitment and N confirmations remain".

    Printing only the exception class threw it away. On 2026-10-26 the root's
    proof was already committed in Bitcoin block 973216 and the estate's log could
    show only "CommitmentNotFoundError" four times - which reads exactly like
    "the calendar never got it" and sent the investigation after the wrong cause
    for nine hours. The class name is a category; the reason is the evidence.
    """
    reason = getattr(exc, "reason", None)
    if isinstance(reason, str) and reason.strip():
        return reason.strip()
    text = str(exc).strip()
    return text or "no reason given"


def upgrade(t, reasons=None) -> bool:
    changed = False
    for att in list(t.attestations):
        if isinstance(att, PendingAttestation):
            uri = att.uri.decode() if isinstance(att.uri, bytes) else att.uri
            try:
                # The key is the message of the node that CARRIES this pending
                # attestation, not the top-level message: a calendar indexes the
                # commitment it issued, and in a nested proof that commitment is
                # an intermediate digest. The reference client (otsclient) asks
                # the same way, per sub-stamp.
                t.merge(RemoteCalendar(uri).get_timestamp(t.msg))
                changed = True
            except Exception as exc:  # reported, never swallowed
                state = f"{type(exc).__name__}: {calendar_reason(exc)}"
                print(f"    {uri}: {state}")
                if reasons is not None:
                    reasons.setdefault(uri, state)
    for sub in t.ops.values():
        changed |= upgrade(sub, reasons)
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
        reasons: dict = {}
        upgrade(dtf.timestamp, reasons)
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
            # The reason the calendar gave is the state of this proof. Saying only
            # "still pending" is what made 2026-10-26 look like a dead calendar.
            detail = ""
            if reasons:
                detail = " — " + "; ".join(sorted(set(reasons.values())))
            print(f"  {path.name}: still pending — not rewritten{detail}")
    if unreadable:
        print(f"\n  {unreadable} file(s) are not timestamps at all. They are not stamps and never")
        print("  proofs; re-stamp them from source with scripts/badger/ots_stamp.py.")
    return 0 if any_btc else 1


if __name__ == "__main__":
    # Reviewed exact-card maintenance is manifest-bound, offline by default and
    # stages into a new directory. Preserve the legacy invocation for callers
    # outside this release; do not silently change their input/output contract.
    if any(arg == "--manifest" or arg.startswith("--manifest=") for arg in sys.argv[1:]):
        from maintain_card_ots import main as manifest_main
        sys.exit(manifest_main(sys.argv[1:]))
    sys.exit(main(sys.argv[1:] or ["public/interop/layer0-ceremony-2026-09-03.json.ots"]))
