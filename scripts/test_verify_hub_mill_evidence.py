from __future__ import annotations

import copy
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
import sign_mill_cards as signer
import flip_hub_queue as flip
from land_mill_cards import bind_run_provenance
from verify_hub_mill_evidence import EvidenceError, admit, validate_admission, validate_bundle, validate_signed_admission


class EvidenceV02Test(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        banks = self.root / "banks"
        banks.mkdir()
        (banks / "governance.jsonl").write_text("".join(
            json.dumps({"prompt": f"question {i}", "expected": "YES" if i % 2 == 0 else "NO"}) + "\n"
            for i in range(30)
        ))
        queue = self.root / "queue.jsonl"
        queue.write_text(json.dumps({"rank": 1, "id": "org/model", "status": "UNMEASURED",
                                     "card_id": "", "pipeline_tag": "text-generation"}) + "\n")
        self.staged = self.root / "staged"

        def infer(model, prompt):
            mill._ROUTE[model] = "hf-router:org/model:featherless-ai"
            return "OK", "YES"

        with mock.patch.object(mill, "infer_hub", side_effect=infer):
            mill.mill(queue, self.staged, pick_n=1, grade_n=1, banks_dir=banks,
                      bank_dataset="csoai/gspc-gov", bank_revision="a" * 40,
                      revision_fetch=lambda _: "b" * 40)
        self.card_path = next(self.staged.glob("unsigned-*.json"))
        self.wrap = bind_run_provenance(json.loads(self.card_path.read_text()), "777")
        self.evidence = self.root / "evidence"

    def test_full_bundle_admits_and_binds_exact_card(self):
        admission = admit(self.wrap, self.staged, self.evidence)
        self.wrap["admission"] = admission
        receipt = validate_admission(self.wrap, self.evidence)
        self.assertEqual(receipt["summary"]["answered"], 30)
        self.assertEqual(receipt["source_card_id"], self.wrap["id"])

    def test_negative_mutations_fail_closed(self):
        base = copy.deepcopy(self.wrap["body"])
        cases = []
        for mutate in (
            lambda b: b["evidence"].__setitem__("schema", "csoai.mill-item-evidence/0.1"),
            lambda b: b["evidence"].pop("model_hf_revision"),
            lambda b: b.__setitem__("accuracy", 0.1234),
        ):
            body = copy.deepcopy(base); mutate(body); cases.append(body)
        for body in cases:
            with self.subTest(body=body), self.assertRaises(EvidenceError):
                validate_bundle(body, self.staged)

        items = self.staged / base["evidence"]["items_file"]
        original = items.read_bytes()
        row = json.loads(original.splitlines()[0])
        for field, value in (("prompt", "changed"), ("raw_output", "NO"),
                             ("provider_route", None), ("elapsed_ms", -1)):
            changed = dict(row); changed[field] = value
            items.write_bytes(json.dumps(changed, sort_keys=True, separators=(",", ":")).encode() + b"\n"
                              + b"\n".join(original.splitlines()[1:]) + b"\n")
            body = copy.deepcopy(base)
            body["evidence"]["items_sha256"] = hashlib.sha256(items.read_bytes()).hexdigest()
            with self.subTest(field=field), self.assertRaises(EvidenceError):
                validate_bundle(body, self.staged)
            items.write_bytes(original)

    def test_signer_requires_current_receipt(self):
        source = self.root / "source"; source.mkdir()
        (source / "unsigned-card.json").write_text(json.dumps(self.wrap))
        with mock.patch.object(signer, "DST", self.root / "signed"), \
             mock.patch.object(signer, "LEDGER", self.root / "signed" / "SUPERSEDED.jsonl"), \
             mock.patch.object(signer, "sign_via_oidc_attested") as signing:
            self.assertEqual(signer.main(["--source-dir", str(source), "--evidence-dir",
                                          str(self.evidence), "--require-hub-admission"]), 1)
            signing.assert_not_called()

        admitted = copy.deepcopy(self.wrap)
        admitted["admission"] = admit(admitted, self.staged, self.evidence)
        (source / "unsigned-card.json").write_text(json.dumps(admitted))
        with mock.patch.object(signer, "DST", self.root / "signed"), \
             mock.patch.object(signer, "LEDGER", self.root / "signed" / "SUPERSEDED.jsonl"), \
             mock.patch.object(signer, "sign_via_oidc_attested", return_value=("aa", "f" * 64)):
            self.assertEqual(signer.main(["--source-dir", str(source), "--evidence-dir",
                                          str(self.evidence), "--require-hub-admission"]), 0)
        signed = json.loads(next((self.root / "signed").glob("signed-*.json")).read_text())
        self.assertEqual(signed["body"]["admission"], admitted["admission"])
        self.assertEqual(signed["body"]["status"], "MEASURED")
        self.assertEqual(validate_signed_admission(signed, self.evidence)["source_card_id"], admitted["id"])

    def test_queue_retires_matching_legacy_positive_cell_without_changing_card(self):
        card_id = "c" * 64
        rows = [{"id": "org/model", "measured_axes": {
            "governance": {"status": "MEASURED", "card_id": card_id},
        }}]
        wraps = [{"id": card_id, "body": {"model": "org/model", "axis": "governance",
                  "evidence": {"schema": "csoai.mill-item-evidence/0.1"}},
                  "_verdict": "UNCHECKABLE", "_reason": "legacy evidence"}]
        before = copy.deepcopy(wraps)
        self.assertEqual(flip.retire_unreproducible_cells(rows, wraps), 1)
        self.assertEqual(rows[0]["measured_axes"]["governance"]["status"], "UNMEASURED")
        self.assertIsNone(rows[0]["measured_axes"]["governance"]["card_id"])
        self.assertEqual(rows[0]["measured_axes"]["governance"]["historical_card_id"], card_id)
        self.assertEqual(wraps, before)


if __name__ == "__main__":
    unittest.main()
