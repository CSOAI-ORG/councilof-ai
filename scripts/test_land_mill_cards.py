import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "harness" / "gspc-top100"))
import mill_hub_queue as mill
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

    def _stage_v02(self, root: Path):
        banks = root / "banks"
        banks.mkdir()
        (banks / "governance.jsonl").write_text("".join(
            json.dumps({"prompt": f"question {i}", "expected": "YES" if i % 2 == 0 else "NO"}) + "\n"
            for i in range(30)
        ))
        queue = root / "queue.jsonl"
        queue.write_text(json.dumps({
            "rank": 1, "id": "org/model", "status": "UNMEASURED",
            "card_id": "", "pipeline_tag": "text-generation",
        }) + "\n")
        artifact = root / "artifact"
        mill_out = artifact / "mill-out"

        def infer(model, prompt):
            mill._ROUTE[model] = "hf-router:org/model:featherless-ai"
            return "OK", "YES"

        with mock.patch.object(mill, "infer_hub", side_effect=infer):
            mill.mill(
                queue, mill_out, pick_n=1, grade_n=1, banks_dir=banks,
                bank_dataset="csoai/gspc-gov", bank_revision="a" * 40,
                revision_fetch=lambda _: "b" * 40,
            )
        return artifact, mill_out, root / "inbox", root / "signed", root / "evidence"

    def test_legacy_bundle_is_preserved_but_not_admitted(self):
        wrap, name = _card_with_evidence(self.ITEMS)
        with tempfile.TemporaryDirectory() as td:
            staged, inbox, signed, evdir = self._stage(Path(td), wrap, name, self.ITEMS)
            rep = land(staged, inbox, signed, "777", evidence_dir=evdir, require_evidence=True)
            self.assertEqual(len(rep["landed"]), 0)
            self.assertIn("legacy evidence", rep["skipped"][0]["reason"])
            self.assertFalse((evdir / name).exists())

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

    def test_nested_v02_bundle_lands_and_legacy_signed_card_does_not_block_migration(self):
        with tempfile.TemporaryDirectory() as td:
            artifact, mill_out, inbox, signed, evidence = self._stage_v02(Path(td))
            signed.mkdir()
            (signed / "signed-governance-legacy.json").write_text(json.dumps({
                "id": "c" * 64,
                "signature": "old",
                "body": {
                    "model": "org/model", "axis": "governance", "n": 30,
                    "status": "MEASURED",
                },
            }))
            rep = land(artifact, inbox, signed, "777", evidence_dir=evidence, require_evidence=True)
            self.assertEqual(len(rep["landed"]), 1)
            landed = json.loads(next(inbox.glob("unsigned-*.json")).read_text())
            self.assertEqual(landed["admission"]["schema"], "csoai.mill-evidence-admission/0.2")
            self.assertTrue((evidence / landed["admission"]["file"]).is_file())
            self.assertTrue((evidence / landed["body"]["evidence"]["items_file"]).is_file())
            self.assertTrue((mill_out / landed["body"]["evidence"]["items_file"]).is_file())

    def test_current_admitted_quotable_signed_cell_still_blocks_duplicate(self):
        with tempfile.TemporaryDirectory() as td:
            artifact, _mill_out, inbox, signed, evidence = self._stage_v02(Path(td))
            rep = land(artifact, inbox, signed, "777", evidence_dir=evidence, require_evidence=True)
            self.assertEqual(len(rep["landed"]), 1)
            source = json.loads(next(inbox.glob("unsigned-*.json")).read_text())
            body = dict(source["body"])
            body.update({
                "status": "MEASURED", "unmeasured": [], "signature_state": "SIGNED",
                "admission": source["admission"],
            })
            signed.mkdir()
            (signed / "signed-governance-current.json").write_text(json.dumps({
                "id": hashlib.sha256(canonical_body_bytes(body)).hexdigest(),
                "signature": "signed", "body": body,
            }))
            second_inbox = Path(td) / "second-inbox"
            rep = land(artifact, second_inbox, signed, "777", evidence_dir=evidence, require_evidence=True)
            self.assertEqual(rep["landed"], [])
            self.assertIn("already-signed", rep["skipped"][0]["reason"])


if __name__ == "__main__":
    unittest.main()
