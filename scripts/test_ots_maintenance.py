"""Offline tests only. Synthetic Bitcoin attestations MUST remain UNVERIFIED."""
import hashlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock

from opentimestamps.core.notary import BitcoinBlockHeaderAttestation, PendingAttestation
from opentimestamps.core.op import OpSHA256
from opentimestamps.core.serialize import StreamSerializationContext
from opentimestamps.core.timestamp import DetachedTimestampFile, Timestamp, make_merkle_tree

from maintain_card_ots import maintain, parse, serialize, sha, NoRedirect

CALENDAR = "https://a.pool.opentimestamps.org"


class MaintenanceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / "cards").mkdir()
        self.output = self.root / "upgrade-new"
        self.manifest = self.root / "manifest.json"

    def fixture(self, count=1, calendar=CALENDAR, proofs=True):
        rows, detached = [], []
        for index in range(count):
            relative = f"cards/signed-fixture-{index:012x}.json"
            raw = json.dumps({"fixture": index, "not_a_real_measurement": True}).encode()
            (self.root / relative).write_bytes(raw)
            rows.append({"path": relative, "bytes": len(raw), "sha256": sha(raw), "public_url": "https://councilof.ai/interop/mill-cards-signed/" + Path(relative).name})
            detached.append(DetachedTimestampFile(OpSHA256(), Timestamp(hashlib.sha256(raw).digest())))
        # Use the official Merkle operation graph; all independent detached
        # proofs share one pending commitment as a real multi-file CLI batch does.
        tip = make_merkle_tree([d.timestamp for d in detached])
        tip.attestations.add(PendingAttestation(calendar))
        if proofs:
            for row, proof in zip(rows, detached):
                (self.root / (row["path"] + ".ots")).write_bytes(serialize(proof))
        manifest = {"schema": "csoai.exact-card-ots-preparation/1", "count": count, "total_bytes": sum(r["bytes"] for r in rows), "files": rows}
        self.manifest.write_text(json.dumps(manifest))
        return manifest, sha(self.manifest.read_bytes())

    @staticmethod
    def synthetic_unverified_bitcoin(url, commitment, timeout):
        # This is NOT a valid Bitcoin proof. The upgrader must say so.
        timestamp = Timestamp(commitment)
        timestamp.attestations.add(BitcoinBlockHeaderAttestation(12345))
        out = io.BytesIO()
        timestamp.serialize(StreamSerializationContext(out))
        return out.getvalue()

    def test_default_is_offline_and_pending_not_anchored(self):
        _, digest = self.fixture()
        network = Mock(side_effect=AssertionError("network forbidden"))
        report = maintain(self.manifest, digest, fetcher=network)
        network.assert_not_called()
        self.assertEqual(report["mode"], "OFFLINE_DRY_RUN")
        self.assertEqual(report["results"][0]["after"]["state"], "STAMPED_PENDING_BITCOIN")
        self.assertFalse(report["chain_verified"])
        self.assertFalse(self.output.exists())

    def test_missing_proof_is_absent_never_submitted_or_fabricated(self):
        _, digest = self.fixture(proofs=False)
        network = Mock(side_effect=AssertionError("network forbidden"))
        report = maintain(self.manifest, digest, upgrade=True, output_dir=self.output, fetcher=network)
        network.assert_not_called()
        self.assertEqual(report["results"][0]["after"]["state"], "ABSENT")
        self.assertEqual(report["proofs_changed"], 0)
        self.assertFalse((self.output / "candidates").exists())

    def test_stages_upgrades_once_per_commitment_preserving_originals(self):
        manifest, digest = self.fixture(count=2)
        originals = {r["path"]: (self.root / (r["path"] + ".ots")).read_bytes() for r in manifest["files"]}
        network = Mock(side_effect=self.synthetic_unverified_bitcoin)
        report = maintain(self.manifest, digest, upgrade=True, output_dir=self.output, fetcher=network)
        self.assertEqual(network.call_count, 1)
        self.assertEqual(report["proofs_changed"], 2)
        for row in manifest["files"]:
            relative = row["path"] + ".ots"
            self.assertEqual((self.root / relative).read_bytes(), originals[row["path"]])
            self.assertEqual((self.output / "originals" / relative).read_bytes(), originals[row["path"]])
            parse((self.output / "candidates" / relative).read_bytes(), row["sha256"])
        for result in report["results"]:
            self.assertEqual(result["after"]["state"], "BITCOIN_ATTESTATION_UNVERIFIED")
            self.assertFalse(result["after"]["chain_verified"])

    def test_refuses_output_reuse_before_any_request(self):
        _, digest = self.fixture()
        self.output.mkdir()
        network = Mock()
        with self.assertRaisesRegex(ValueError, "new output"):
            maintain(self.manifest, digest, upgrade=True, output_dir=self.output, fetcher=network)
        network.assert_not_called()

    def test_hash_and_card_change_fail_before_network(self):
        manifest, digest = self.fixture()
        network = Mock()
        with self.assertRaisesRegex(ValueError, "manifest SHA256"):
            maintain(self.manifest, "0" * 64, fetcher=network)
        (self.root / manifest["files"][0]["path"]).write_bytes(b"changed")
        with self.assertRaisesRegex(ValueError, "card bytes"):
            maintain(self.manifest, digest, upgrade=True, output_dir=self.output, fetcher=network)
        network.assert_not_called()

    def test_different_digest_or_nonproof_is_rejected(self):
        manifest, digest = self.fixture()
        proof_path = self.root / (manifest["files"][0]["path"] + ".ots")
        wrong = Timestamp(b"x" * 32)
        wrong.attestations.add(PendingAttestation(CALENDAR))
        proof_path.write_bytes(serialize(DetachedTimestampFile(OpSHA256(), wrong)))
        with self.assertRaisesRegex(ValueError, "exact SHA256"):
            maintain(self.manifest, digest)
        proof_path.write_bytes(b"not an OTS file")
        with self.assertRaises(Exception):
            maintain(self.manifest, digest)

    def test_path_escape_and_symlinks_rejected(self):
        manifest, digest = self.fixture()
        row = manifest["files"][0]
        card = self.root / row["path"]
        held = self.root / "held.json"
        card.rename(held)
        card.symlink_to(held)
        with self.assertRaisesRegex(ValueError, "symlink"):
            maintain(self.manifest, digest)
        row["path"] = "../escape.json"
        self.manifest.write_text(json.dumps(manifest))
        with self.assertRaisesRegex(ValueError, "unexpected"):
            maintain(self.manifest, sha(self.manifest.read_bytes()))

    def test_unadmitted_calendar_and_redirect_never_followed(self):
        _, digest = self.fixture(calendar="http://127.0.0.1/private")
        network = Mock()
        report = maintain(self.manifest, digest, upgrade=True, output_dir=self.output, fetcher=network)
        network.assert_not_called()
        self.assertEqual(report["results"][0]["issues"], ["CALENDAR_NOT_ADMITTED"])
        with self.assertRaisesRegex(ValueError, "redirect"):
            NoRedirect().redirect_request(None, None, 302, "", {}, "http://127.0.0.1/")

    def test_network_failure_retains_pending_and_no_candidate(self):
        _, digest = self.fixture()
        report = maintain(self.manifest, digest, upgrade=True, output_dir=self.output, fetcher=Mock(side_effect=TimeoutError()))
        self.assertEqual(report["proofs_changed"], 0)
        self.assertEqual(report["results"][0]["after"]["state"], "STAMPED_PENDING_BITCOIN")
        self.assertIn("CALENDAR_UNAVAILABLE:TimeoutError", report["results"][0]["issues"])

    def test_existing_bitcoin_attestation_is_not_downgraded_or_declared_verified(self):
        manifest, digest = self.fixture()
        path = self.root / (manifest["files"][0]["path"] + ".ots")
        proof = parse(path.read_bytes(), manifest["files"][0]["sha256"])
        proof.timestamp.attestations.add(BitcoinBlockHeaderAttestation(12345))
        original = serialize(proof)
        path.write_bytes(original)
        network = Mock(side_effect=AssertionError("no repeat upgrade needed"))
        report = maintain(self.manifest, digest, upgrade=True, output_dir=self.output, fetcher=network)
        network.assert_not_called()
        self.assertEqual(path.read_bytes(), original)
        self.assertEqual(report["proofs_changed"], 0)
        self.assertEqual(report["results"][0]["after"]["state"], "BITCOIN_ATTESTATION_UNVERIFIED")
        self.assertFalse(report["chain_verified"])

    def test_source_race_is_rejected_without_staged_output(self):
        manifest, digest = self.fixture()
        def changed(url, commitment, timeout):
            (self.root / manifest["files"][0]["path"]).write_bytes(b"changed during request")
            return self.synthetic_unverified_bitcoin(url, commitment, timeout)
        with self.assertRaisesRegex(ValueError, "source changed"):
            maintain(self.manifest, digest, upgrade=True, output_dir=self.output, fetcher=changed)
        self.assertFalse(self.output.exists())

    def test_budget_caps_unique_calendar_requests(self):
        manifest, digest = self.fixture()
        path = self.root / (manifest["files"][0]["path"] + ".ots")
        proof = parse(path.read_bytes(), manifest["files"][0]["sha256"])
        proof.timestamp.attestations.add(PendingAttestation("https://b.pool.opentimestamps.org"))
        path.write_bytes(serialize(proof))
        network = Mock(side_effect=TimeoutError())
        report = maintain(self.manifest, digest, upgrade=True, output_dir=self.output, max_requests=1, fetcher=network)
        self.assertEqual(network.call_count, 1)
        self.assertIn("REQUEST_BUDGET_EXHAUSTED", report["results"][0]["issues"])

    def test_same_bytes_symlink_swap_is_rejected_without_output(self):
        manifest, digest = self.fixture()
        def swapped(url, commitment, timeout):
            card = self.root / manifest["files"][0]["path"]
            held = self.root / "held.json"
            card.rename(held)
            card.symlink_to(held)
            return self.synthetic_unverified_bitcoin(url, commitment, timeout)
        with self.assertRaisesRegex(ValueError, "symlink"):
            maintain(self.manifest, digest, upgrade=True, output_dir=self.output, fetcher=swapped)
        self.assertFalse(self.output.exists())


if __name__ == "__main__":
    unittest.main()
