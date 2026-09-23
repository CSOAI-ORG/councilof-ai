"""Offline tests. No calendar is contacted; nothing here is a real OTS proof.

These pin two claims the generator makes in passing and got wrong: the date in
the receipt's filename, and where the receipt lands. Both are claims about the
run, so both must be derived from the run.
"""
import contextlib
import datetime
import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from opentimestamps.core.notary import PendingAttestation
from opentimestamps.core.timestamp import Timestamp

import ots_stamp_new
from ots_stamp_new import main, receipt_location, receipt_name


class FakeCalendar:
    """Accepts any digest and promises nothing. Never touches the network."""

    def __init__(self, url):
        self.url = url

    def submit(self, digest, timeout=None):
        answer = Timestamp(digest)
        answer.attestations.add(PendingAttestation(self.url))
        return answer


def utc(text):
    return datetime.datetime.strptime(text, "%Y-%m-%dT%H:%M:%SZ").replace(
        tzinfo=datetime.timezone.utc)


class ReceiptTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.artifacts = self.root / "artifacts"
        self.artifacts.mkdir()
        self.elsewhere = self.root / "elsewhere"
        self.elsewhere.mkdir()
        patch = mock.patch("opentimestamps.calendar.RemoteCalendar", FakeCalendar)
        patch.start()
        self.addCleanup(patch.stop)

    def artifact(self, name="subject.json", where=None):
        path = (where or self.artifacts) / name
        path.write_text(json.dumps({"fixture": name, "not_a_measurement": True}))
        return path

    def run_stamp(self, *args, now=None, cwd=None):
        with contextlib.chdir(cwd or self.root):
            code = main([str(a) for a in args], now=now)
        self.assertEqual(code, 0)
        receipts = sorted(self.root.rglob("ots-stamp-batch-*.json"))
        self.assertEqual(len(receipts), 1, f"expected exactly one receipt, found {receipts}")
        return receipts[0], json.loads(receipts[0].read_text())

    def test_receipt_is_named_for_the_day_it_ran_not_a_baked_literal(self):
        # The regression: a literal 2026-09-17 in the generator meant a run on any
        # other day wrote a receipt whose name claimed a day it was not written on.
        today = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")
        path, receipt = self.run_stamp(self.artifact())
        self.assertEqual(path.name, f"ots-stamp-batch-{today}.json")
        self.assertTrue(receipt["as_of"].startswith(today), receipt["as_of"])

    def test_filename_date_is_the_as_of_it_records(self):
        # One instant, two surfaces. Injecting a clock far from today proves the
        # name follows the recorded timestamp rather than either a literal or a
        # second, independently sampled `now`.
        moment = utc("2027-01-02T23:59:58Z")
        path, receipt = self.run_stamp(self.artifact(), now=moment)
        self.assertEqual(path.name, "ots-stamp-batch-2027-01-02.json")
        self.assertEqual(receipt["as_of"], "2027-01-02T23:59:58Z")
        self.assertEqual(path.name[len("ots-stamp-batch-"):-len(".json")],
                         receipt["as_of"][:10])

    def test_receipt_lands_beside_the_artifacts_not_in_the_working_directory(self):
        subject = self.artifact()
        path, _ = self.run_stamp(subject, cwd=self.root)
        self.assertEqual(path.parent, self.artifacts)
        self.assertEqual(list(self.root.glob("ots-stamp-batch-*.json")), [])
        self.assertTrue((self.artifacts / (subject.name + ".ots")).is_file())

    def test_out_dir_wins_over_the_artifacts_directory(self):
        out = self.root / "receipts"
        path, _ = self.run_stamp(self.artifact(), "--out-dir", out)
        self.assertEqual(path.parent, out)
        self.assertEqual(list(self.artifacts.glob("ots-stamp-batch-*.json")), [])

    def test_inputs_spanning_directories_say_why_they_fall_back(self):
        # No single directory is "alongside" two, so the working directory is the
        # honest answer -- but the run must say so rather than litter in silence.
        where, why = receipt_location(None, [self.artifacts, self.elsewhere])
        self.assertEqual(where, Path.cwd())
        self.assertIn("--out-dir", why)
        self.assertIn("2 directories", why)
        self.assertEqual(receipt_location(None, [self.artifacts, self.artifacts])[0],
                         self.artifacts)

    def test_a_fresh_stamp_is_still_labelled_pending_never_anchored(self):
        # Load-bearing doctrine: a calendar's acceptance is a promise, not a proof.
        _, receipt = self.run_stamp(self.artifact())
        stamp = receipt["stamps"][0]
        self.assertEqual(stamp["state"], "PENDING_CALENDAR_COMMITMENT")
        self.assertTrue(stamp["proof_binds_to_file_digest"])
        self.assertIn("NOT a Bitcoin attestation", stamp["state_meaning"])
        self.assertFalse(receipt["signed"])

    def test_name_and_location_are_pure_functions_of_the_run(self):
        self.assertEqual(receipt_name(utc("2026-09-23T00:00:00Z")),
                         "ots-stamp-batch-2026-09-23.json")
        self.assertEqual(receipt_location("/tmp/x", [self.artifacts]),
                         (Path("/tmp/x"), "--out-dir"))
        self.assertEqual(receipt_location(None, [])[0], Path.cwd())
        self.assertNotIn("2026-09-17", ots_stamp_new.receipt_name(
            datetime.datetime.now(datetime.timezone.utc)))


if __name__ == "__main__":
    unittest.main()
