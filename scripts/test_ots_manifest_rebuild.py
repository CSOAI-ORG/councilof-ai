"""Offline tests for scripts/ots_manifest_rebuild.py. Synthetic Bitcoin attestations MUST stay synthetic:
they prove the classifier reads the attestation kind out of the bytes, not that anything is anchored."""
import io
import json
import pathlib
import subprocess
import sys
import tempfile
import unittest

from opentimestamps.core.notary import BitcoinBlockHeaderAttestation, PendingAttestation
from opentimestamps.core.op import OpSHA256
from opentimestamps.core.serialize import StreamSerializationContext
from opentimestamps.core.timestamp import DetachedTimestampFile, Timestamp

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import ots_manifest_rebuild as r  # noqa: E402


def detached(subject: bytes, attestation) -> bytes:
    t = Timestamp(OpSHA256()(subject))
    t.attestations.add(attestation)
    dtf = DetachedTimestampFile(OpSHA256(), t)
    buf = io.BytesIO()
    dtf.serialize(StreamSerializationContext(buf))
    return buf.getvalue()


class RebuildTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.pub = pathlib.Path(self.tmp.name) / "public"
        self.a = self.pub / "interop"
        self.b = self.pub / "interop" / "ots"
        self.b.mkdir(parents=True)
        # A pending proof WITH its subject beside it.
        (self.a / "with-subject.json").write_bytes(b'{"x":1}\n')
        (self.a / "with-subject.json.ots").write_bytes(detached(b'{"x":1}\n', PendingAttestation("https://a.pool.opentimestamps.org")))
        # A synthetic Bitcoin-attested proof WITHOUT its subject: counted as BITCOIN and subject_absent.
        (self.a / "orphan.json.ots").write_bytes(detached(b"gone", BitcoinBlockHeaderAttestation(1)))
        # A stub under the .ots name in the second directory: never a proof, must be quarantined.
        (self.b / "stub.ots").write_bytes(b"=== OTS PENDING ===\nstatus: pending\n")
        # A pending proof in the second directory, so both dirs contribute rows.
        (self.b / "second.json").write_bytes(b"s")
        (self.b / "second.json.ots").write_bytes(detached(b"s", PendingAttestation("https://b.pool.opentimestamps.org")))
        self.out = self.b / "manifest.json"

    def run_apply(self):
        rc = r.main(["--dir", str(self.a), "--dir", str(self.b), "--out", str(self.out), "--public", str(self.pub), "--apply"])
        self.assertEqual(rc, 0)
        return json.loads(self.out.read_text())

    def test_counts_come_from_the_bytes_and_a_stub_is_never_a_proof(self):
        m = self.run_apply()
        self.assertEqual(m["schema"], r.SCHEMA)
        self.assertEqual(m["counts"], {"proofs": 3, "bitcoin_attested": 1, "calendar_pending": 2,
                                       "quarantined_not_proofs": 1, "subject_absent": 1})
        self.assertFalse((self.b / "stub.ots").exists())
        self.assertTrue((self.b / "stub.ots.invalid").exists())
        self.assertNotIn("stub.ots", [p["file"] for p in m["proofs"]])

    def test_rows_carry_the_served_path_and_whether_the_subject_exists(self):
        m = self.run_apply()
        by = {p["file"]: p for p in m["proofs"]}
        self.assertEqual(by["with-subject.json.ots"]["path"], "/interop/with-subject.json.ots")
        self.assertEqual(by["with-subject.json.ots"]["subject"], "/interop/with-subject.json")
        self.assertTrue(by["with-subject.json.ots"]["subject_present"])
        self.assertEqual(by["orphan.json.ots"]["state"], "BITCOIN")
        self.assertFalse(by["orphan.json.ots"]["subject_present"])
        self.assertEqual(by["second.json.ots"]["path"], "/interop/ots/second.json.ots")
        self.assertEqual(m["dirs_scanned"], ["/interop", "/interop/ots"])

    def test_a_pending_stamp_is_never_called_anchored(self):
        m = self.run_apply()
        self.assertEqual({p["state"] for p in m["proofs"]}, {"BITCOIN", "PENDING"})
        self.assertIn("not evidence of a time", m["pending_is_not_anchored"])
        self.assertIn("does not check the block header against a Bitcoin node", m["bitcoin_attested_means"])
        self.assertNotIn("staged", m["how_this_was_built"].replace("never copied from a staged manifest", ""))

    def test_dry_run_writes_nothing_and_renames_nothing(self):
        rc = r.main(["--dir", str(self.a), "--dir", str(self.b), "--out", str(self.out), "--public", str(self.pub)])
        self.assertEqual(rc, 0)
        self.assertFalse(self.out.exists())
        self.assertTrue((self.b / "stub.ots").exists())

    def test_default_scan_covers_both_served_directories(self):
        self.assertEqual(r.DEFAULT_DIRS, ["public/interop", "public/interop/ots"])
        self.assertEqual(r.DEFAULT_OUT, "public/interop/ots/manifest.json")

    def test_the_committed_manifest_is_what_the_producer_derives_from_the_tree(self):
        # The gate this row asked for: the served manifest never disagrees with the bytes.
        repo = pathlib.Path(__file__).resolve().parents[1]
        committed = repo / "public" / "interop" / "ots" / "manifest.json"
        if not committed.exists() or not (repo / "public" / "interop").exists():
            self.skipTest("sparse checkout without public/interop")
        m = json.loads(committed.read_text())
        self.assertEqual(m["schema"], r.SCHEMA)
        got, keep, drop = r.build([repo / d for d in r.DEFAULT_DIRS], repo / "public")
        self.assertEqual(drop, [], "a non-proof under the .ots name is served")
        self.assertEqual(m["counts"], got["counts"])
        self.assertEqual([p["sha256_of_proof"] for p in m["proofs"]], [p["sha256_of_proof"] for p in got["proofs"]])


if __name__ == "__main__":
    unittest.main()
