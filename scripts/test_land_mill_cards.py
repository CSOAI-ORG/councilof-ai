import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from land_mill_cards import bind_run_provenance, canonical_body_bytes, land, land_evidence


class RunProvenanceTest(unittest.TestCase):
    def test_landing_binds_run_before_content_addressing(self):
        body = {
            "kind": "gspc.measurement-card",
            "axis": "machinery-conformity",
            "model": "example/model",
            "n": 30,
            "status": "UNMEASURED",
        }
        wrap = {"body": body, "id": hashlib.sha256(canonical_body_bytes(body)).hexdigest(), "signature": None}
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            staged, inbox, signed = root / "staged", root / "inbox", root / "signed"
            staged.mkdir()
            (staged / "unsigned-old.json").write_text(json.dumps(wrap))
            report = land(staged, inbox, signed, "12345")
            self.assertEqual(len(report["landed"]), 1)
            landed = json.loads(next(inbox.glob("unsigned-*.json")).read_text())
            self.assertEqual(landed["body"]["run_id"], "gha-12345")
            self.assertEqual(landed["id"], hashlib.sha256(canonical_body_bytes(landed["body"])).hexdigest())

    def test_conflicting_run_is_rejected(self):
        with self.assertRaises(ValueError):
            bind_run_provenance({"body": {"run_id": "gha-1"}}, "2")


def _card_with_evidence(items_text: str) -> tuple[dict, str]:
    """An honest unsigned card bound to an item-evidence bundle (the mill's new output)."""
    items_sha = hashlib.sha256(items_text.encode()).hexdigest()
    name = f"items-governan-{items_sha[:12]}.jsonl"
    body = {
        "kind": "gspc.measurement-card",
        "axis": "governance",
        "model": "example/model",
        "n": 30,
        "accuracy": 0.5,
        "status": "UNMEASURED",
        "evidence": {
            "schema": "csoai.mill-item-evidence/0.1",
            "items_file": name,
            "items_sha256": items_sha,
            "bank_sha256": "ab" * 32,
        },
    }
    wrap = {"body": body, "id": hashlib.sha256(canonical_body_bytes(body)).hexdigest(), "signature": None}
    return wrap, name


class EvidenceLandingTest(unittest.TestCase):
    ITEMS = "".join(
        json.dumps({"i": i, "prompt_sha256": "00" * 32, "expected": "YES", "observed": "YES", "ok": True})
        + "\n"
        for i in range(30)
    )

    def _stage(self, root: Path, wrap: dict, bundle_name: str | None, bundle_text: str | None):
        staged, inbox, signed, evdir = root / "staged", root / "inbox", root / "signed", root / "ev"
        staged.mkdir()
        (staged / "unsigned-card.json").write_text(json.dumps(wrap))
        if bundle_name and bundle_text is not None:
            (staged / bundle_name).write_text(bundle_text)
        return staged, inbox, signed, evdir

    def test_card_and_bundle_land_together(self):
        wrap, name = _card_with_evidence(self.ITEMS)
        with tempfile.TemporaryDirectory() as td:
            staged, inbox, signed, evdir = self._stage(Path(td), wrap, name, self.ITEMS)
            rep = land(staged, inbox, signed, "777", evidence_dir=evdir, require_evidence=True)
            self.assertEqual(len(rep["landed"]), 1, rep["skipped"])
            self.assertTrue((evdir / name).is_file(), "the bundle lands next to the inbox")
            landed = json.loads(next(inbox.glob("unsigned-*.json")).read_text())
            self.assertEqual(landed["body"]["evidence"]["items_sha256"], wrap["body"]["evidence"]["items_sha256"])

    def test_bundle_sha_mismatch_fails_closed(self):
        wrap, name = _card_with_evidence(self.ITEMS)
        with tempfile.TemporaryDirectory() as td:
            staged, inbox, signed, evdir = self._stage(Path(td), wrap, name, self.ITEMS + "tampered\n")
            rep = land(staged, inbox, signed, "777", evidence_dir=evdir)
            self.assertEqual(len(rep["landed"]), 0)
            self.assertIn("mismatch", rep["skipped"][0]["reason"])

    def test_absent_bundle_fails_closed(self):
        wrap, name = _card_with_evidence(self.ITEMS)
        with tempfile.TemporaryDirectory() as td:
            staged, inbox, signed, evdir = self._stage(Path(td), wrap, None, None)
            rep = land(staged, inbox, signed, "777", evidence_dir=evdir)
            self.assertEqual(len(rep["landed"]), 0)
            self.assertIn("absent", rep["skipped"][0]["reason"])

    def test_require_evidence_stops_aggregate_only_cards(self):
        body = {"kind": "gspc.measurement-card", "axis": "safety", "model": "old/model",
                "n": 30, "accuracy": 0.5, "status": "UNMEASURED"}
        wrap = {"body": body, "id": hashlib.sha256(canonical_body_bytes(body)).hexdigest(), "signature": None}
        with tempfile.TemporaryDirectory() as td:
            staged, inbox, signed, evdir = self._stage(Path(td), wrap, None, None)
            rep = land(staged, inbox, signed, "777", evidence_dir=evdir, require_evidence=True)
            self.assertEqual(len(rep["landed"]), 0)
            self.assertIn("aggregate-only", rep["skipped"][0]["reason"])

    def test_legacy_card_still_lands_without_the_flag(self):
        body = {"kind": "gspc.measurement-card", "axis": "safety", "model": "old/model",
                "n": 30, "accuracy": 0.5, "status": "UNMEASURED"}
        wrap = {"body": body, "id": hashlib.sha256(canonical_body_bytes(body)).hexdigest(), "signature": None}
        with tempfile.TemporaryDirectory() as td:
            staged, inbox, signed, evdir = self._stage(Path(td), wrap, None, None)
            rep = land(staged, inbox, signed, "777", evidence_dir=evdir)
            self.assertEqual(len(rep["landed"]), 1)


if __name__ == "__main__":
    unittest.main()
