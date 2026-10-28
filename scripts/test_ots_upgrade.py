#!/usr/bin/env python3
"""The OTS upgrader must report WHY a proof is still pending, and must ask the
calendar the question the reference client asks.

THE DEFECT THESE CASES SHIP WITH. On 2026-10-26 the public root's
OpenTimestamps proof was already committed in Bitcoin block 973216, and two
calendars had the transaction in hand - both answering "waiting for 6
confirmations". scripts/ots-upgrade.py printed only the exception class, so the
log said "CommitmentNotFoundError" four times. That reads exactly like "the
calendar never received it", sent the investigation after the wrong cause, and
left the estate waiting on a cause that had already been measured. The class
name is a category; the calendar's 404 body is the evidence.

What is pinned here:

  1. The calendar's OWN reason reaches the operator, in the per-calendar line
     and in the file's summary line.
  2. The calendar is asked with the message of the node that CARRIES the pending
     attestation. In a nested proof the calendar's commitment is an INTERMEDIATE
     digest, not the file digest; the reference client (otsclient) asks the same
     way, per sub-stamp. Asking with the top-level message returns "Not found"
     from every calendar, forever, which looks like a dead calendar.
  3. The batch discipline survives the change: one unparseable file does not
     strand the rest, a file that did not improve is never rewritten, and a file
     that gains a Bitcoin attestation is.

No network, no fixtures on disk: every proof here is built in the test.
"""
from __future__ import annotations

import importlib.util
import io
import os
import sys
import tempfile
import unittest
from contextlib import redirect_stdout

HERE = os.path.dirname(os.path.abspath(__file__))


def _load_ots_upgrade():
    """scripts/ots-upgrade.py has a dash in its name; load it by path."""
    spec = importlib.util.spec_from_file_location(
        "ots_upgrade_under_test", os.path.join(HERE, "ots-upgrade.py")
    )
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


ots_upgrade = _load_ots_upgrade()

from opentimestamps.calendar import CommitmentNotFoundError  # noqa: E402
from opentimestamps.core.notary import (  # noqa: E402
    BitcoinBlockHeaderAttestation,
    PendingAttestation,
)
from opentimestamps.core.op import OpSHA256  # noqa: E402
from opentimestamps.core.serialize import (  # noqa: E402
    StreamDeserializationContext,
    StreamSerializationContext,
)
from opentimestamps.core.timestamp import (  # noqa: E402
    DetachedTimestampFile,
    Timestamp,
)

CAL_URI = "https://calendar.example.test/cal"
TXID = "4be7e9220fa5095dfc57f9bd67f79cbfb029e9568d64ebce3a0aef8af5a593da"
REASON = f"Timestamped by transaction {TXID}; waiting for 6 confirmations"


def build_proof_bytes(uri: str = CAL_URI) -> bytes:
    """A nested proof: the pending attestation sits on an INNER node, so the
    calendar key is an intermediate digest and not the file digest."""
    top = Timestamp(b"\x11" * 32)
    inner = top.ops.add(OpSHA256())
    inner.attestations.add(PendingAttestation(uri))
    buf = io.BytesIO()
    DetachedTimestampFile(OpSHA256(), top).serialize(StreamSerializationContext(buf))
    return buf.getvalue()


def messages_of(path: str):
    """(message of the node carrying the pending attestation, top-level message)."""
    with open(path, "rb") as fh:
        raw = fh.read()
    dtf = DetachedTimestampFile.deserialize(StreamDeserializationContext(io.BytesIO(raw)))
    carrying = []

    def walk(t):
        for att in t.attestations:
            if isinstance(att, PendingAttestation):
                carrying.append(t.msg)
        for sub in t.ops.values():
            walk(sub)

    walk(dtf.timestamp)
    return carrying[0], dtf.timestamp.msg


class FakeCalendar:
    """Records the key it was asked for; answers as the test dictates."""

    def __init__(self, uri, behaviour):
        self.uri = uri
        self.behaviour = behaviour
        self.keys = []

    def get_timestamp(self, commitment, timeout=None):
        self.keys.append(commitment)
        return self.behaviour(commitment)


class OtsUpgradeTest(unittest.TestCase):
    def _run(self, behaviour, extra_files=()):
        """Run the upgrader over one nested proof (plus any extra files) with a
        fake calendar. Returns (exit code, stdout, asked-keys)."""
        asked = []

        def fake_calendar(uri):
            cal = FakeCalendar(uri, behaviour)
            asked.append(cal)
            return cal

        with tempfile.TemporaryDirectory() as d:
            proof = os.path.join(d, "proof.json.ots")
            with open(proof, "wb") as fh:
                fh.write(build_proof_bytes())
            paths = [proof]
            for name, blob in extra_files:
                other = os.path.join(d, name)
                with open(other, "wb") as fh:
                    fh.write(blob)
                paths.insert(0, other)
            with open(proof, "rb") as fh:
                before = fh.read()
            original = ots_upgrade.RemoteCalendar
            ots_upgrade.RemoteCalendar = fake_calendar
            try:
                buf = io.StringIO()
                with redirect_stdout(buf):
                    rc = ots_upgrade.main(paths)
            finally:
                ots_upgrade.RemoteCalendar = original
            with open(proof, "rb") as fh:
                after = fh.read()
            carrying, top = messages_of(proof)
            keys = [k for cal in asked for k in cal.keys]
        return rc, buf.getvalue(), keys, carrying, top, before, after

    def test_the_calendars_own_reason_reaches_the_operator(self):
        """The defect: only the exception class was printed, so a proof already
        committed in Bitcoin looked like a proof the calendar never received."""

        def behaviour(key):
            raise CommitmentNotFoundError(REASON)

        rc, out, _keys, _carrying, _top, _before, _after = self._run(behaviour)
        self.assertEqual(rc, 1, "a proof with no Bitcoin attestation is still pending")
        self.assertIn("CommitmentNotFoundError", out)
        self.assertIn(TXID, out)
        self.assertIn("waiting for 6 confirmations", out)

    def test_the_summary_line_carries_the_reason(self):
        """The file's own line must not read as a bare 'still pending' either."""

        def behaviour(key):
            raise CommitmentNotFoundError(REASON)

        _rc, out, _k, _c, _t, _b, _a = self._run(behaviour)
        summary = [ln for ln in out.splitlines() if "still pending" in ln]
        self.assertTrue(summary, f"no summary line in:\n{out}")
        self.assertIn(TXID, summary[0])

    def test_a_failure_with_no_reason_is_still_reported(self):
        """An exception with no reason attribute must not vanish."""

        def behaviour(key):
            raise RuntimeError("socket closed")

        rc, out, _k, _c, _t, _b, _a = self._run(behaviour)
        self.assertEqual(rc, 1)
        self.assertIn("RuntimeError", out)
        self.assertIn("socket closed", out)

    def test_the_calendar_is_asked_with_the_carrying_nodes_message(self):
        """The calendar indexes the COMMITMENT it issued. In a nested proof that
        is an intermediate digest; the top-level file digest returns 'Not found'
        from every calendar, which is indistinguishable from a dead calendar."""

        def behaviour(key):
            raise CommitmentNotFoundError(REASON)

        _rc, _out, keys, carrying, top, _b, _a = self._run(behaviour)
        self.assertEqual(len(keys), 1)
        self.assertEqual(keys[0], carrying)
        self.assertNotEqual(keys[0], top, "the top-level message is the wrong key")

    def test_a_proof_that_did_not_improve_is_never_rewritten(self):
        def behaviour(key):
            raise CommitmentNotFoundError(REASON)

        _rc, out, _k, _c, _t, before, after = self._run(behaviour)
        self.assertIn("still pending", out)
        self.assertEqual(before, after, "a proof that did not improve must not be rewritten")

    def test_a_proof_that_gains_a_bitcoin_attestation_is_rewritten(self):
        def behaviour(key):
            ts = Timestamp(key)
            ts.attestations.add(BitcoinBlockHeaderAttestation(973216))
            return ts

        rc, out, _k, _c, _t, before, after = self._run(behaviour)
        self.assertEqual(rc, 0, "a proof with a Bitcoin attestation is not pending")
        self.assertIn("BITCOIN blocks [973216]", out)
        self.assertNotEqual(before, after, "the upgraded proof must be written back")
        with tempfile.TemporaryDirectory() as d:
            p = os.path.join(d, "x.ots")
            with open(p, "wb") as fh:
                fh.write(after)
            _carrying, _top = messages_of(p)
            with open(p, "rb") as fh:
                raw = fh.read()
            dtf = DetachedTimestampFile.deserialize(StreamDeserializationContext(io.BytesIO(raw)))
            heights = [
                a.height
                for a in ots_upgrade.attestations(dtf.timestamp)
                if isinstance(a, BitcoinBlockHeaderAttestation)
            ]
        self.assertEqual(heights, [973216])

    def test_one_unparseable_file_does_not_strand_the_batch(self):
        def behaviour(key):
            raise CommitmentNotFoundError(REASON)

        rc, out, keys, _c, _t, _b, _a = self._run(
            behaviour, extra_files=[("broken.json.ots", b"not a timestamp at all")]
        )
        self.assertIn("NOT A TIMESTAMP", out)
        self.assertEqual(len(keys), 1, "the real proof behind a broken one must still be attempted")
        self.assertEqual(rc, 1)


if __name__ == "__main__":
    unittest.main()
