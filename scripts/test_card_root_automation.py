"""Offline regression tests for create-only card roots and staged OTS upgrades."""
import hashlib
import io
import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import Mock

from opentimestamps.core.notary import BitcoinBlockHeaderAttestation, PendingAttestation
from opentimestamps.core.op import OpSHA256
from opentimestamps.core.serialize import StreamSerializationContext
from opentimestamps.core.timestamp import DetachedTimestampFile, Timestamp

from card_root import build
from maintain_card_ots import serialize
from maintain_card_root_ots import maintain

CALENDAR = "https://a.pool.opentimestamps.org"


def pending_proof(digest_hex):
    timestamp = Timestamp(bytes.fromhex(digest_hex))
    timestamp.attestations.add(PendingAttestation(CALENDAR))
    return serialize(DetachedTimestampFile(OpSHA256(), timestamp))


class CardRootAutomationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.signed = self.root / "signed"
        self.public = self.root / "public"
        self.signed.mkdir()
        self.public.mkdir()
        self.now = datetime(2026, 9, 14, 12, 0, tzinfo=timezone.utc)

    def card(self, suffix, marker=1):
        card = {
            "body": {"model": "fixture/model", "axis": "safety", "marker": marker},
            "id": f"fixture-{suffix}",
            "did": "did:web:example.invalid#fixture",
            "signature": "synthetic-not-valid",
        }
        path = self.signed / f"signed-safety-{suffix}.json"
        path.write_text(json.dumps(card))
        return path

    def test_same_day_change_creates_content_path_and_preserves_existing_bytes(self):
        self.card("000000000001", 1)
        submit = Mock(side_effect=pending_proof)
        first = build(stamp=True, now=self.now, signed_dir=self.signed, out_dir=self.public, submitter=submit)
        first_root = first["root_path"].read_bytes()
        first_proof = first["ots_path"].read_bytes()
        first_pointer = json.loads(first["pointer_path"].read_text())
        self.assertEqual(first_pointer["root_url"], "/interop/card-root-2026-09-14.json")
        self.assertEqual(first_pointer["root_sha256"], hashlib.sha256(first_root).hexdigest())
        self.assertEqual(first_pointer["n_leaves"], 1)
        self.assertEqual(first_pointer["ots_url"], "/interop/card-root-2026-09-14.json.ots")

        self.card("000000000002", 2)
        second = build(stamp=True, now=self.now, signed_dir=self.signed, out_dir=self.public, submitter=submit)

        self.assertEqual(first["root_path"].name, "card-root-2026-09-14.json")
        self.assertRegex(second["root_path"].name, r"card-root-2026-09-14-[a-f0-9]{12}\.json")
        self.assertNotEqual(first["root_path"], second["root_path"])
        self.assertEqual(first["root_path"].read_bytes(), first_root)
        self.assertEqual(first["ots_path"].read_bytes(), first_proof)
        self.assertEqual(second["proof_state"]["state"], "pending")
        second_pointer = json.loads(second["pointer_path"].read_text())
        self.assertEqual(second_pointer["root_url"], f"/interop/{second['root_path'].name}")
        self.assertEqual(second_pointer["root_sha256"], hashlib.sha256(second["root_path"].read_bytes()).hexdigest())
        self.assertEqual(second_pointer["n_leaves"], 2)

        calls = submit.call_count
        second_root = second["root_path"].read_bytes()
        second_proof = second["ots_path"].read_bytes()
        repeated = build(stamp=True, now=self.now, signed_dir=self.signed, out_dir=self.public, submitter=submit)
        self.assertFalse(repeated["created_root"])
        self.assertEqual(submit.call_count, calls)
        self.assertEqual(second["root_path"].read_bytes(), second_root)
        self.assertEqual(second["ots_path"].read_bytes(), second_proof)
        self.assertEqual(json.loads(repeated["pointer_path"].read_text()), second_pointer)

    def test_unstamped_root_pointer_does_not_imply_bitcoin_anchor(self):
        self.card("000000000001")
        made = build(now=self.now, signed_dir=self.signed, out_dir=self.public)
        pointer = json.loads(made["pointer_path"].read_text())
        self.assertIsNone(pointer["ots_url"])
        self.assertEqual(pointer["kind"], "DISCOVERY_POINTER_ONLY")
        self.assertIn("not proof of a Bitcoin anchor", pointer["scope"])

    def test_identical_cards_are_deduplicated(self):
        original = self.card("000000000001")
        (self.signed / "signed-safety-000000000002.json").write_bytes(original.read_bytes())
        result = build(now=self.now, signed_dir=self.signed, out_dir=self.public)
        self.assertEqual(result["n_leaves"], 1)
        doc = json.loads(result["root_path"].read_text())
        self.assertEqual(doc["n_skipped"], 1)
        self.assertIn("duplicate", doc["skipped"][0]["why"])

    def test_existing_wrong_proof_binding_fails_without_submission(self):
        self.card("000000000001")
        first = build(now=self.now, signed_dir=self.signed, out_dir=self.public)
        first["ots_path"].write_bytes(pending_proof("0" * 64))
        submit = Mock()
        with self.assertRaisesRegex(ValueError, "exact SHA256"):
            build(stamp=True, now=self.now, signed_dir=self.signed, out_dir=self.public, submitter=submit)
        submit.assert_not_called()

    def test_upgrade_stages_bitcoin_tag_but_preserves_root_and_pending_proof(self):
        self.card("000000000001")
        made = build(stamp=True, now=self.now, signed_dir=self.signed, out_dir=self.public, submitter=pending_proof)
        root_before = made["root_path"].read_bytes()
        proof_before = made["ots_path"].read_bytes()
        output = self.root / "upgrade"

        def bitcoin_response(url, commitment, timeout):
            timestamp = Timestamp(commitment)
            timestamp.attestations.add(BitcoinBlockHeaderAttestation(12345))
            out = io.BytesIO()
            timestamp.serialize(StreamSerializationContext(out))
            return out.getvalue()

        report = maintain([made["root_path"]], output, fetcher=bitcoin_response, public_dir=self.public)
        self.assertEqual(report["proofs_changed"], 1)
        self.assertFalse(report["chain_verified"])
        self.assertEqual(report["results"][0]["after"]["state"], "BITCOIN_ATTESTATION_UNVERIFIED")
        self.assertEqual(made["root_path"].read_bytes(), root_before)
        self.assertEqual(made["ots_path"].read_bytes(), proof_before)
        candidate = output / "candidates" / made["ots_path"].name
        self.assertTrue(candidate.is_file())
        self.assertNotEqual(candidate.read_bytes(), proof_before)

    def test_pending_calendar_response_is_not_staged_or_called_anchored(self):
        self.card("000000000001")
        made = build(stamp=True, now=self.now, signed_dir=self.signed, out_dir=self.public, submitter=pending_proof)
        original = made["ots_path"].read_bytes()
        output = self.root / "pending-upgrade"

        def still_pending(url, commitment, timeout):
            timestamp = Timestamp(commitment)
            timestamp.attestations.add(PendingAttestation(CALENDAR))
            out = io.BytesIO()
            timestamp.serialize(StreamSerializationContext(out))
            return out.getvalue()

        report = maintain([made["root_path"]], output, fetcher=still_pending, public_dir=self.public)
        self.assertEqual(report["proofs_changed"], 0)
        self.assertEqual(report["results"][0]["after"]["state"], "STAMPED_PENDING_BITCOIN")
        self.assertIn("STILL_PENDING_NOT_STAGED", report["results"][0]["issues"])
        self.assertEqual(made["ots_path"].read_bytes(), original)
        self.assertFalse((output / "candidates").exists())
        self.assertNotIn("anchored", json.dumps(report).lower())

    def test_changed_root_during_network_fails_without_staged_output(self):
        self.card("000000000001")
        made = build(stamp=True, now=self.now, signed_dir=self.signed, out_dir=self.public, submitter=pending_proof)
        output = self.root / "race"

        def changed(url, commitment, timeout):
            made["root_path"].write_bytes(made["root_path"].read_bytes() + b" ")
            timestamp = Timestamp(commitment)
            timestamp.attestations.add(BitcoinBlockHeaderAttestation(12345))
            out = io.BytesIO()
            timestamp.serialize(StreamSerializationContext(out))
            return out.getvalue()

        with self.assertRaisesRegex(ValueError, "source changed"):
            maintain([made["root_path"]], output, fetcher=changed, public_dir=self.public)
        self.assertFalse(output.exists())


if __name__ == "__main__":
    unittest.main()
