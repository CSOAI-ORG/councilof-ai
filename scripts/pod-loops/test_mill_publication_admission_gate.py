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


class AdmissionRecordTests(unittest.TestCase):
    """The gate honours a csoai.mill-admission/0.1 record only after revalidating it."""

    def setUp(self):
        import contextlib, io, shutil, sys
        scripts = Path(__file__).resolve().parents[1]
        sys.path.insert(0, str(scripts))
        import test_admit_mill_cards as t  # noqa: PLC0415
        from lib.estate_sign import generate_throwaway_key, public_key_raw  # noqa: PLC0415
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        key, b64 = generate_throwaway_key()
        (root / "world").mkdir()
        self.w = t.World(root / "world", b64, public_key_raw(key))
        card = self.w.write()
        self.repo = root / "repo"
        ev = self.repo / "public/interop/mill-evidence"
        ev.mkdir(parents=True)
        (self.repo / "public/.well-known").mkdir(parents=True)
        (self.repo / "public/interop/mill-cards-signed").mkdir(parents=True)
        shutil.copy(self.w.root / "did.json", self.repo / "public/.well-known/did.json")
        for p in self.w.evidence.glob("*.json"):
            shutil.copy(p, ev / p.name)
        self.name = Path("public/interop/mill-cards-signed") / card.name
        shutil.copy(card, self.repo / self.name)
        self.admit_argv = ["--cards", str(self.repo / self.name), "--evidence-dir", str(ev),
                           "--repro-dir", str(self.w.repro), "--did-doc", str(self.w.root / "did.json"),
                           "--bank-allowlist", str(self.w.allowlist)]
        self.ev = ev
        self.t = t
        self.quiet = contextlib.redirect_stdout(io.StringIO())

    def check(self):
        with patch.object(gate, "changed_signed_cards", return_value=[("A", self.name)]):
            return gate.check(self.repo, "base", "HEAD")

    def test_unadmitted_card_is_held(self):
        self.assertIn("0 admission records", self.check()[0])

    def test_dry_run_does_not_unblock(self):
        with self.quiet:
            self.t.admit.main(self.admit_argv)
        self.assertTrue(self.check())

    def test_admission_record_unblocks(self):
        with self.quiet:
            self.t.admit.main(self.admit_argv + ["--apply", "--out-dir", str(self.ev)])
        self.assertEqual([], self.check())

    def test_tampered_admission_record_is_held(self):
        with self.quiet:
            self.t.admit.main(self.admit_argv + ["--apply", "--out-dir", str(self.ev)])
        rec_path = next(self.ev.glob("runpod-admission-*.json"))
        rec = json.loads(rec_path.read_text())
        rec["reproduction"]["runtime_id"] = rec["primary_runtime"]["runtime_id"]
        rec_path.write_text(json.dumps(rec))
        self.assertTrue(any("independent" in e for e in self.check()))

    def test_missing_did_doc_holds(self):
        with self.quiet:
            self.t.admit.main(self.admit_argv + ["--apply", "--out-dir", str(self.ev)])
        (self.repo / "public/.well-known/did.json").unlink()
        self.assertTrue(any("SIGNATURE_INVALID" in e for e in self.check()))


if __name__ == "__main__":
    unittest.main()
