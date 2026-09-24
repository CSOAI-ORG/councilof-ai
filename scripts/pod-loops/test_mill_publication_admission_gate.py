import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("guard", Path(__file__).with_name("mill_publication_admission_gate.py"))
assert spec and spec.loader
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)

class GateTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.repo = Path(self.tmp.name)
        self.name = Path("public/interop/mill-cards-signed/signed-test.json")
        (self.repo / self.name).parent.mkdir(parents=True)
        self.evdir = self.repo / "public/interop/mill-evidence"
        self.evdir.mkdir(parents=True)
        self.card = {"id":"id", "body":{"axis":"governance", "model":"ollama:test", "compute_evidence":{"run_id":"run", "bank_sha256":"bank", "items_sha256":"items", "model_manifest_digest":"model"}}}
        self.receipt = {"run_id":"run", "axis":"governance", "subject":"ollama:test", "bank_sha256":"bank", "model_manifest_digest":"model", "source_hashes":{"items_sha256":"items"}, "state":"VERIFIED_QUARANTINE", "authority":{"admitted":False}}
        self.save()
    def save(self):
        (self.repo / self.name).write_text(json.dumps(self.card))
        (self.evdir / "runpod-verification-test.json").write_text(json.dumps(self.receipt))
    def check(self, status="A"):
        with patch.object(gate, "changed_signed_cards", return_value=[(status,self.name)]):
            return gate.check(self.repo,"base","HEAD")
    def test_quarantine_held(self):
        self.assertIn("admitted=False", self.check()[0])
    def test_missing_receipt_held(self):
        (self.evdir / "runpod-verification-test.json").unlink()
        self.assertIn("found 0", self.check()[0])
    def test_mismatched_evidence_held(self):
        self.receipt["source_hashes"]["items_sha256"]="other"
        self.save()
        self.assertIn("does not bind", self.check()[0])
    def test_signed_mutation_held(self):
        self.assertIn("forbidden", self.check("M")[0])
    def test_admitted_receipt_passes(self):
        self.receipt["state"]="ADMITTED"
        self.receipt["authority"]["admitted"]=True
        self.save()
        self.assertEqual([],self.check())
    def test_no_cards_passes(self):
        with patch.object(gate,"changed_signed_cards",return_value=[]):
            self.assertEqual([],gate.check(self.repo,"base","HEAD"))

if __name__ == "__main__":
    unittest.main()
