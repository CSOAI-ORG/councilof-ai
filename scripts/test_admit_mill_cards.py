"""Tests for scripts/admit_mill_cards.py — the mill ADMISSION step.

Every fixture is built from scratch in a temp dir and signed by the REAL
scripts/sign_mill_cards.py with a throwaway Ed25519 key (lib.estate_sign
.generate_throwaway_key). No production key, token or card is used.

Negative controls (each must be NOT_ADMITTED with its reason code):
  same host twice, digest differs, result differs, unsigned, intake fails
(plus: forged signature, no reproduction, same run, undeclared runtime).
Each control is paired with a MUTANT test that disables exactly the check the
control relies on and asserts the same fixture then comes out ADMITTED — the
proof that the control fails because of that check and nothing else.
"""
from __future__ import annotations

import contextlib
import copy
import hashlib
import io
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent / "harness" / "gspc-top100"))
import admit_mill_cards as admit  # noqa: E402
import sign_mill_cards  # noqa: E402
from lib.estate_sign import did_document, generate_throwaway_key, public_key_raw  # noqa: E402
from verify_card import canonical_body_bytes  # noqa: E402
from verify_runpod_gspc_intake import VERIFICATION_SCHEMA, canonical_json_bytes  # noqa: E402

KEY_ENV = "ADMIT_TEST_THROWAWAY_KEY"
BANK = "0b" * 32
INSTRUMENT = "c5" * 32
MODEL_DIGEST = "sha256:" + "84" * 32
SUBJECT = f"ollama:qwen2.5:7b@{MODEL_DIGEST}"
RUN_A = "20260924T151341.811139Z-6068d3c42f"   # "3090" primary run
RUN_B = "20260926T014802.192022Z-baefb8590f"   # "T4" reproduction run
COUNTS = {"attempted": 71, "bank_items": 71, "correct": 41, "graded_n": 70,
          "parse_errors_excluded": 1, "transport_errors_excluded": 0, "transport_ok": 71}


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def unsigned_card(run_id: str, items: str, *, instrument=INSTRUMENT, model_digest=MODEL_DIGEST,
                  subject=SUBJECT, n=70, accuracy=0.5857) -> dict:
    body = {
        "accuracy": accuracy, "axis": "jail", "brand": "Council of AI",
        "compute_evidence": {"bank_sha256": BANK, "instrument_sha256": instrument, "items_sha256": items,
                             "model_manifest_digest": model_digest, "parse_errors_excluded": 1,
                             "run_id": run_id, "transport_errors_excluded": 0},
        "issuer": "CSOAI Ltd", "kind": "gspc.measurement-card", "model": subject, "n": n,
        "public_framing": "Measurement, not certification. Empty is not zero.",
        "status": "UNMEASURED", "unmeasured": list(admit.UNSIGNED_UNMEASURED),
        "verify": "https://councilof.ai/gspc-verify",
    }
    return {"alg": "Ed25519", "body": body, "did_intended": "did:web:csoai.org#card-attestation-1",
            "id": sha(canonical_body_bytes(body)), "preimage_rule": "sha256(canonical body)", "signature": None}


def receipt_for(card: dict, allowlist_sha: str, counts=None) -> dict:
    body = card["body"]
    ce = body["compute_evidence"]
    hashes = {"bank_allowlist_sha256": allowlist_sha, "card_file_sha256": "cf" * 32, "card_id": card["id"],
              "card_sha256": "cd" * 32, "items_sha256": ce["items_sha256"], "run_sha256": "ab" * 32}
    bundle = sha(canonical_json_bytes({"schema": VERIFICATION_SCHEMA, "run_id": ce["run_id"], "axis": body["axis"],
                                       "subject": body["model"], "source_hashes": hashes}))
    counts = dict(counts or COUNTS)
    return {"accuracy": body["accuracy"], "authority": {"admitted": False, "anchored": False,
            "hf_identity_claimed": False, "published": False, "signed": False},
            "axis": body["axis"], "bank_sha256": ce["bank_sha256"], "bundle_sha256": bundle,
            "candidate_file": "candidate.json", "counts": counts,
            "model_manifest_digest": ce["model_manifest_digest"], "review": "human/GHA review required",
            "run_id": ce["run_id"], "schema": VERIFICATION_SCHEMA, "source_hashes": hashes,
            "state": "VERIFIED_QUARANTINE", "subject": body["model"], "verified_at": "2026-09-26T00:00:00Z"}


def rebundle(receipt: dict) -> dict:
    """Recompute bundle_sha256 after a deliberate edit (so only the intended check trips)."""
    receipt["bundle_sha256"] = sha(canonical_json_bytes({k: receipt[k] for k in
                                   ("schema", "run_id", "axis", "subject", "source_hashes")}))
    return receipt


class World:
    """A temp repo slice: allowlist, DID doc, evidence dir, one signed primary, one repro dir."""

    def __init__(self, root: Path, key_b64: str, pub: bytes):
        self.root, self.key_b64 = root, key_b64
        self.allowlist = root / "allowlist.json"
        self.allowlist.write_text(json.dumps({"banks": [{"axis": "jail", "sha256": BANK}]}))
        self.allow_sha = sha(self.allowlist.read_bytes())
        self.did_doc = did_document(pub, did="did:web:csoai.org", kid="board-attestation-1")
        self.evidence = root / "evidence"
        self.signed = root / "signed"
        self.repro = root / "repro"
        for d in (self.evidence, self.signed, self.repro):
            d.mkdir()
        self.primary_unsigned = unsigned_card(RUN_A, "11" * 32)
        self.primary_receipt = receipt_for(self.primary_unsigned, self.allow_sha)
        self.repro_card = unsigned_card(RUN_B, "22" * 32)
        self.repro_receipt = receipt_for(self.repro_card, self.allow_sha)
        self.primary_runtime = {"substrate": "RunPod RTX 3090 pod fpowppss5ngtkw"}
        self.repro_runtime = {"substrate": "Kaggle kernel csoai-mill-kaggle-slice T4x2"}
        self.sign = True

    # ---- materialise
    def signed_card(self) -> Path:
        inbox = self.root / "inbox"
        inbox.mkdir(exist_ok=True)
        (inbox / "unsigned-jail-primary.json").write_text(json.dumps(self.primary_unsigned))
        if not self.sign:
            p = self.signed / "signed-jail-unsigned.json"
            w = copy.deepcopy(self.primary_unsigned)
            w["body"]["status"] = "MEASURED"
            w["body"]["unmeasured"] = []
            w["body"]["signature_state"] = "SIGNED"
            w["id"] = sha(canonical_body_bytes(w["body"]))
            p.write_text(json.dumps(w))
            return p
        with mock.patch.dict(os.environ, {KEY_ENV: self.key_b64}), contextlib.redirect_stdout(io.StringIO()):
            rc = sign_mill_cards.main(["--source-dir", str(inbox), "--dest-dir", str(self.signed),
                                       "--key-env", KEY_ENV, "--did", "did:web:csoai.org#board-attestation-1"])
        assert rc == 0, "throwaway-key signing failed"
        return next(self.signed.glob("signed-*.json"))

    def write(self) -> Path:
        card = self.signed_card()
        r = self.primary_receipt
        (self.evidence / f"runpod-verification-{r['bundle_sha256'][:12]}.json").write_text(json.dumps(r))
        (self.repro / "verification.json").write_text(json.dumps(self.repro_receipt))
        (self.repro / "unsigned-qwen2.5-7b-jail.json").write_text(json.dumps(self.repro_card))
        decl = {"schema": admit.DECLARATION_SCHEMA, "run_id": self.repro_receipt["run_id"],
                "intake_bundle_sha256": self.repro_receipt["bundle_sha256"], "runtime": self.repro_runtime,
                "baseline_runtime": {**self.primary_runtime, "runs": [
                    {"run_id": r["run_id"], "bundle_sha256": r["bundle_sha256"]}]}}
        (self.repro / "runtime-declaration.json").write_text(json.dumps(decl))
        (self.root / "did.json").write_text(json.dumps(self.did_doc))
        return card

    def decide(self) -> dict:
        card = self.write()
        index = admit.RuntimeIndex()
        repros, _ = admit.load_repro_dirs([self.repro], index)
        return admit.decide(card, self.evidence, repros, index, self.did_doc, self.allowlist)


class Base(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        key, cls.key_b64 = generate_throwaway_key()
        cls.pub = public_key_raw(key)

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.w = World(Path(self.tmp.name), self.key_b64, self.pub)

    def assertNotAdmitted(self, d: dict, code: str):
        self.assertEqual(d["state"], "NOT_ADMITTED", d)
        self.assertIn(code, d["reasons"], d)
        self.assertNotIn("record", d)


# ------------------------------------------------------------------ positive

class Positive(Base):
    def test_independent_equal_signed_card_is_admitted(self):
        d = self.w.decide()
        self.assertEqual(d["state"], "ADMITTED", d)
        self.assertEqual(d["reasons"], [])
        rec = d["record"]
        self.assertEqual(rec["state"], "ADMITTED")
        self.assertIs(rec["authority"]["admitted"], True)
        self.assertNotEqual(rec["primary_runtime"]["runtime_id"], rec["reproduction"]["runtime_id"])

    def test_record_revalidates_offline(self):
        d = self.w.decide()
        card = json.loads((self.w.signed / d["card_file"]).read_text())
        self.assertEqual([], admit.validate_admission_record(d["record"], card, self.w.primary_receipt, self.w.did_doc))

    def test_forged_record_is_refused_by_revalidation(self):
        d = self.w.decide()
        card = json.loads((self.w.signed / d["card_file"]).read_text())
        rec = copy.deepcopy(d["record"])
        rec["reproduction"]["runtime_id"] = rec["primary_runtime"]["runtime_id"]
        self.assertTrue(admit.validate_admission_record(rec, card, self.w.primary_receipt, self.w.did_doc))
        rec = copy.deepcopy(d["record"])
        rec["reproduction"]["receipt"]["counts"]["correct"] = 40
        self.assertTrue(admit.validate_admission_record(rec, card, self.w.primary_receipt, self.w.did_doc))
        self.assertTrue(admit.validate_admission_record(d["record"], card, self.w.primary_receipt, None))

    def test_dry_run_writes_nothing(self):
        self.w.write()
        before = sorted(str(p) for p in self.w.root.rglob("*"))
        with contextlib.redirect_stdout(io.StringIO()) as out:
            rc = admit.main(["--cards", str(self.w.signed), "--evidence-dir", str(self.w.evidence),
                             "--repro-dir", str(self.w.repro), "--did-doc", str(self.w.root / "did.json"),
                             "--bank-allowlist", str(self.w.allowlist)])
        self.assertEqual(rc, 0)
        self.assertIn("DRY-RUN cards=1 admitted=1", out.getvalue())
        self.assertEqual(before, sorted(str(p) for p in self.w.root.rglob("*")))

    def test_apply_writes_one_immutable_record(self):
        self.w.write()
        out_dir = self.w.root / "out"
        argv = ["--cards", str(self.w.signed), "--evidence-dir", str(self.w.evidence), "--repro-dir",
                str(self.w.repro), "--did-doc", str(self.w.root / "did.json"),
                "--bank-allowlist", str(self.w.allowlist), "--apply", "--out-dir", str(out_dir)]
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(admit.main(argv), 0)
            self.assertEqual(admit.main(argv), 0)  # idempotent: never rewrites
        recs = list(out_dir.glob("runpod-admission-*.json"))
        self.assertEqual(len(recs), 1)
        self.assertEqual(json.loads(recs[0].read_text())["state"], "ADMITTED")

    def test_apply_requires_explicit_out_dir(self):
        with self.assertRaises(SystemExit), contextlib.redirect_stderr(io.StringIO()):
            admit.main(["--cards", str(self.w.signed), "--apply"])


# ------------------------------------------------------------------ negative controls

def same_host(w: World):
    w.repro_runtime = dict(w.primary_runtime)


def digest_differs(w: World):
    w.repro_card = unsigned_card(RUN_B, "22" * 32, instrument="c6" * 32)
    w.repro_receipt = receipt_for(w.repro_card, w.allow_sha)


def model_digest_differs(w: World):
    other = "sha256:" + "85" * 32
    w.repro_card = unsigned_card(RUN_B, "22" * 32, model_digest=other, subject=f"ollama:qwen2.5:7b@{other}")
    w.repro_receipt = receipt_for(w.repro_card, w.allow_sha)


def result_differs(w: World):
    w.repro_card = unsigned_card(RUN_B, "22" * 32, accuracy=0.5714)
    w.repro_receipt = receipt_for(w.repro_card, w.allow_sha, counts={**COUNTS, "correct": 40})


def unsigned(w: World):
    w.sign = False


def intake_fails(w: World):
    # the bank allowlist changed after the primary run was verified: land_mill_cards refuses it
    w.primary_receipt["source_hashes"]["bank_allowlist_sha256"] = "99" * 32
    w.primary_receipt = rebundle(w.primary_receipt)


CONTROLS = {
    # name: (fixture edit, expected code, check that, when disabled, lets the fixture through)
    "same_host_twice": (same_host, "NO_INDEPENDENT_REPRODUCTION", "independence_reasons"),
    "digest_differs": (digest_differs, "DIGEST_MISMATCH", "digest_reasons"),
    "model_digest_differs": (model_digest_differs, "DIGEST_MISMATCH", "digest_reasons"),
    "result_differs": (result_differs, "RESULT_MISMATCH", "result_reasons"),
    "unsigned": (unsigned, "UNSIGNED", "signature_reasons"),
    "intake_fails": (intake_fails, "INTAKE_FAILED", "intake_reasons"),
}


class NegativeControls(Base):
    def run_control(self, name: str) -> dict:
        edit, _, _ = CONTROLS[name]
        edit(self.w)
        return self.w.decide()

    def test_same_host_twice(self):
        d = self.run_control("same_host_twice")
        self.assertNotAdmitted(d, "NO_INDEPENDENT_REPRODUCTION")
        self.assertTrue(any("same runtime/host id" in x["detail"] for x in d["details"]))

    def test_digest_differs(self):
        self.assertNotAdmitted(self.run_control("digest_differs"), "DIGEST_MISMATCH")

    def test_model_digest_differs(self):
        self.assertNotAdmitted(self.run_control("model_digest_differs"), "DIGEST_MISMATCH")

    def test_result_differs(self):
        self.assertNotAdmitted(self.run_control("result_differs"), "RESULT_MISMATCH")

    def test_unsigned(self):
        self.assertNotAdmitted(self.run_control("unsigned"), "UNSIGNED")

    def test_intake_fails(self):
        d = self.run_control("intake_fails")
        self.assertNotAdmitted(d, "INTAKE_FAILED")
        self.assertTrue(any("allowlist changed" in x["detail"] for x in d["details"]))

    # ---- further fail-closed cases
    def test_forged_signature(self):
        card = self.w.write()
        w = json.loads(card.read_text())
        w["signature"] = ("0" if w["signature"][0] != "0" else "1") + w["signature"][1:]
        card.write_text(json.dumps(w))
        index = admit.RuntimeIndex()
        repros, _ = admit.load_repro_dirs([self.w.repro], index)
        d = admit.decide(card, self.w.evidence, repros, index, self.w.did_doc, self.w.allowlist)
        self.assertNotAdmitted(d, "SIGNATURE_INVALID")

    def test_signature_from_a_key_not_in_the_did_doc(self):
        other, _ = generate_throwaway_key()
        self.w.did_doc = did_document(public_key_raw(other), did="did:web:csoai.org", kid="board-attestation-1")
        self.assertNotAdmitted(self.w.decide(), "SIGNATURE_INVALID")

    def test_no_did_doc_fails_closed(self):
        self.w.did_doc = None
        self.assertNotAdmitted(self.w.decide(), "SIGNATURE_INVALID")

    def test_no_reproduction(self):
        card = self.w.write()
        d = admit.decide(card, self.w.evidence, [], admit.RuntimeIndex(), self.w.did_doc, self.w.allowlist)
        self.assertNotAdmitted(d, "NO_INDEPENDENT_REPRODUCTION")

    def test_reproduction_is_the_same_run(self):
        self.w.repro_card = copy.deepcopy(self.w.primary_unsigned)
        self.w.repro_receipt = copy.deepcopy(self.w.primary_receipt)
        self.assertNotAdmitted(self.w.decide(), "NO_INDEPENDENT_REPRODUCTION")

    def test_primary_runtime_undeclared(self):
        self.w.primary_runtime = {"substrate": "UNRECORDED"}
        d = self.w.decide()
        self.assertNotAdmitted(d, "NO_INDEPENDENT_REPRODUCTION")
        self.assertTrue(any("primary runtime unproven" in x["detail"] for x in d["details"]))

    def test_declaration_not_bound_to_the_intake_bundle(self):
        self.w.write()
        decl = json.loads((self.w.repro / "runtime-declaration.json").read_text())
        decl["intake_bundle_sha256"] = "ee" * 32
        (self.w.repro / "runtime-declaration.json").write_text(json.dumps(decl))
        index = admit.RuntimeIndex()
        repros, _ = admit.load_repro_dirs([self.w.repro], index)
        card = next(self.w.signed.glob("signed-*.json"))
        d = admit.decide(card, self.w.evidence, repros, index, self.w.did_doc, self.w.allowlist)
        self.assertNotAdmitted(d, "NO_INDEPENDENT_REPRODUCTION")

    def test_conflicting_runtime_declarations(self):
        self.w.write()
        extra = self.w.root / "extra-decl.json"
        extra.write_text(json.dumps({"schema": admit.DECLARATION_SCHEMA, "run_id": RUN_A,
                                     "intake_bundle_sha256": self.w.primary_receipt["bundle_sha256"],
                                     "runtime": {"substrate": "some other host"}}))
        index = admit.RuntimeIndex()
        admit.load_declarations([extra], index)
        repros, _ = admit.load_repro_dirs([self.w.repro], index)
        card = next(self.w.signed.glob("signed-*.json"))
        d = admit.decide(card, self.w.evidence, repros, index, self.w.did_doc, self.w.allowlist)
        self.assertNotAdmitted(d, "NO_INDEPENDENT_REPRODUCTION")

    def test_missing_intake_receipt(self):
        card = self.w.write()
        for p in self.w.evidence.glob("runpod-verification-*.json"):
            p.unlink()
        index = admit.RuntimeIndex()
        repros, _ = admit.load_repro_dirs([self.w.repro], index)
        d = admit.decide(card, self.w.evidence, repros, index, self.w.did_doc, self.w.allowlist)
        self.assertNotAdmitted(d, "INTAKE_FAILED")

    def test_reproduction_that_fails_its_own_intake(self):
        self.w.repro_receipt["source_hashes"]["bank_allowlist_sha256"] = "98" * 32
        self.w.repro_receipt = rebundle(self.w.repro_receipt)
        self.assertNotAdmitted(self.w.decide(), "NO_INDEPENDENT_REPRODUCTION")


class Mutants(Base):
    """Break exactly one check; its control must then come out ADMITTED.

    This proves each negative control is caught by the check it names — if the check
    were missing or vacuous (always passing), the control would silently admit.
    """

    def mutant_admits(self, name: str):
        edit, code, check = CONTROLS[name]
        edit(self.w)
        with mock.patch.object(admit, check, lambda *a, **k: []):
            d = self.w.decide()
        self.assertEqual(d["state"], "ADMITTED",
                         f"{name}: with {check} disabled the fixture should admit; got {d['reasons']}")

    def test_mutant_same_host_twice(self):
        self.mutant_admits("same_host_twice")

    def test_mutant_digest_differs(self):
        self.mutant_admits("digest_differs")

    def test_mutant_model_digest_differs(self):
        self.mutant_admits("model_digest_differs")

    def test_mutant_result_differs(self):
        self.mutant_admits("result_differs")

    def test_mutant_unsigned(self):
        self.mutant_admits("unsigned")

    def test_mutant_intake_fails(self):
        self.mutant_admits("intake_fails")


if __name__ == "__main__":
    unittest.main()
