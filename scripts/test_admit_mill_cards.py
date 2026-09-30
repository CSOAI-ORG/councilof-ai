"""Tests for scripts/admit_mill_cards.py — the mill ADMISSION step.

Every fixture is built from scratch in a temp dir and signed by the REAL
scripts/sign_mill_cards.py with a throwaway Ed25519 key (lib.estate_sign
.generate_throwaway_key). No production key, token or card is used.

Negative controls (each must be NOT_ADMITTED with its reason code):
  same host twice, digest differs, result differs, unsigned, intake fails,
  two items flip with equal totals (ITEM_MISMATCH), per-item evidence absent
(plus: forged signature, no reproduction, same run, undeclared runtime, tampered
or self-inconsistent per-item evidence). Pass case: raw outputs differ, grades equal.
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


def make_items(n=71, correct=41) -> list[dict]:
    """postprocess.py slim rows: items 1..correct right, the last one a parse error."""
    rows = []
    for s in range(1, n + 1):
        iid = f"item-{s:06d}-{s:012x}"
        grade = s <= correct
        rows.append({"sequence": s, "item_id": iid, "prompt_sha256": sha(iid.encode()),
                     "raw_output_sha256": sha(f"out-{s}".encode()),
                     "parsed_label": None if s == n else ("REFUSE" if grade else "PROCEED"),
                     "grade": grade, "done_reason": "stop"})
    return rows


def flip(rows: list[dict], seq: int, **fields) -> None:
    rows[seq - 1].update(fields)


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
        self.primary_items = make_items()
        self.repro_items = make_items()
        self.item_level = True
        self.write_items = True

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
        if self.item_level:
            # the reproduction's intake-bound items.jsonl, and a card/receipt that bind it
            items_raw = "".join(json.dumps(r) + "\n" for r in self.repro_items).encode()
            if self.write_items:
                (self.repro / "items.jsonl").write_bytes(items_raw)
            self.repro_card["body"]["compute_evidence"]["items_sha256"] = sha(items_raw)
            self.repro_card["id"] = sha(canonical_body_bytes(self.repro_card["body"]))
            self.repro_receipt["source_hashes"].update(items_sha256=sha(items_raw), card_id=self.repro_card["id"])
            self.repro_receipt = rebundle(self.repro_receipt)
        (self.repro / "verification.json").write_text(json.dumps(self.repro_receipt))
        (self.repro / "unsigned-qwen2.5-7b-jail.json").write_text(json.dumps(self.repro_card))
        decl = {"schema": admit.DECLARATION_SCHEMA, "run_id": self.repro_receipt["run_id"],
                "intake_bundle_sha256": self.repro_receipt["bundle_sha256"], "runtime": self.repro_runtime,
                "baseline_runtime": {**self.primary_runtime, "runs": [
                    {"run_id": r["run_id"], "bundle_sha256": r["bundle_sha256"]}]}}
        if self.item_level:
            diffs = [{"item_id": b["item_id"], "sequence": b["sequence"],
                      "rtx3090": {k: a[k] for k in admit.SIDE_FIELDS}, "t4": {k: b[k] for k in admit.SIDE_FIELDS}}
                     for a, b in zip(self.primary_items, self.repro_items)
                     if any(a[k] != b[k] for k in admit.SIDE_FIELDS)]
            decl["per_item_results"] = self.repro_items
            decl["per_item_results_sha256"] = admit.per_item_sha256(self.repro_items)
            decl["parity"] = {"per_item_cross_hardware": {
                "n_items": len(self.repro_items), "differing_items": diffs,
                "grade_equal": sum(a["grade"] == b["grade"] for a, b in zip(self.primary_items, self.repro_items))}}
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

    def test_raw_differs_grade_equal_is_admitted_and_recorded(self):
        # the safety case: outputs differ (and one done_reason), every grade is the same
        flip(self.w.repro_items, 5, raw_output_sha256="cc" * 32)
        flip(self.w.repro_items, 50, raw_output_sha256="dd" * 32, done_reason="length")
        flip(self.w.repro_items, 71, raw_output_sha256="ee" * 32)
        d = self.w.decide()
        self.assertEqual(d["state"], "ADMITTED", d)
        rec = d["record"]["item_parity"]
        self.assertEqual(rec["grade_differs"], [])
        self.assertEqual([x["item_id"] for x in rec["non_grade_differs"]],
                         [self.w.repro_items[i]["item_id"] for i in (4, 49, 70)])
        self.assertEqual(rec["non_grade_differs"][1]["fields"], ["raw_output_sha256", "done_reason"])
        card = json.loads((self.w.signed / d["card_file"]).read_text())
        self.assertEqual([], admit.validate_admission_record(d["record"], card, self.w.primary_receipt, self.w.did_doc))

    def test_forged_item_parity_in_record_is_refused(self):
        d = self.w.decide()
        card = json.loads((self.w.signed / d["card_file"]).read_text())
        rec = copy.deepcopy(d["record"])                        # hide a declared flip
        rec["item_evidence"]["per_item_cross_hardware"]["differing_items"] = [{
            "item_id": self.w.repro_items[14]["item_id"],
            "rtx3090": {**{k: self.w.repro_items[14][k] for k in admit.SIDE_FIELDS}, "grade": False},
            "t4": {k: self.w.repro_items[14][k] for k in admit.SIDE_FIELDS}}]
        self.assertTrue(admit.validate_admission_record(rec, card, self.w.primary_receipt, self.w.did_doc))
        rec = copy.deepcopy(d["record"])                        # edit the recorded parity
        rec["item_parity"]["non_grade_differs"] = [{"item_id": "x", "fields": ["raw_output_sha256"]}]
        self.assertTrue(admit.validate_admission_record(rec, card, self.w.primary_receipt, self.w.did_doc))

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
    flip(w.repro_items, 41, grade=False, parsed_label="PROCEED", raw_output_sha256="ff" * 32)


def items_flip_totals_equal(w: World):
    """The cross-reality/swarm case: two grades flip in opposite directions, totals agree."""
    flip(w.repro_items, 15, grade=False, parsed_label="PROCEED", raw_output_sha256="aa" * 32)
    flip(w.repro_items, 60, grade=True, parsed_label="REFUSE", raw_output_sha256="bb" * 32)


def no_item_level_evidence(w: World):
    w.item_level = False


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
    "items_flip_totals_equal": (items_flip_totals_equal, "ITEM_MISMATCH", "item_reasons"),
    "no_item_level_evidence": (no_item_level_evidence, "NO_ITEM_LEVEL_EVIDENCE", "item_reasons"),
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

    def test_items_flip_with_equal_totals(self):
        d = self.run_control("items_flip_totals_equal")
        self.assertNotAdmitted(d, "ITEM_MISMATCH")
        self.assertNotIn("RESULT_MISMATCH", d["reasons"])  # totals really are equal
        detail = next(x["detail"] for x in d["details"] if x["code"] == "ITEM_MISMATCH")
        self.assertIn(self.w.repro_items[14]["item_id"], detail)
        self.assertIn(self.w.repro_items[59]["item_id"], detail)
        self.assertEqual(d["item_parity"]["grade_differs"],
                         [self.w.repro_items[14]["item_id"], self.w.repro_items[59]["item_id"]])

    def test_no_item_level_evidence(self):
        self.assertNotAdmitted(self.run_control("no_item_level_evidence"), "NO_ITEM_LEVEL_EVIDENCE")

    def test_primary_side_missing(self):
        self.w.write()
        decl_p = self.w.repro / "runtime-declaration.json"
        decl = json.loads(decl_p.read_text())
        del decl["parity"]
        decl_p.write_text(json.dumps(decl))
        self.assertNotAdmitted(self.redecide(), "NO_ITEM_LEVEL_EVIDENCE")

    def test_tampered_per_item_results(self):
        self.w.write()
        decl_p = self.w.repro / "runtime-declaration.json"
        decl = json.loads(decl_p.read_text())
        decl["per_item_results"][3]["grade"] = not decl["per_item_results"][3]["grade"]
        decl_p.write_text(json.dumps(decl))
        self.assertNotAdmitted(self.redecide(), "NO_ITEM_LEVEL_EVIDENCE")

    def test_declared_primary_items_contradict_primary_receipt(self):
        # a flip declared on one side only: the primary's items no longer sum to its receipt
        self.w.primary_items[1]["grade"] = False
        self.w.primary_items[1]["parsed_label"] = "PROCEED"
        self.assertNotAdmitted(self.w.decide(), "NO_ITEM_LEVEL_EVIDENCE")

    def test_consistent_regrade_of_declared_items_is_caught_by_items_jsonl(self):
        # swarm-shaped forgery: flip two declared grades so every sum still agrees, rehash
        self.w.write()
        decl_p = self.w.repro / "runtime-declaration.json"
        decl = json.loads(decl_p.read_text())
        per = decl["per_item_results"]
        per[14]["grade"], per[59]["grade"] = False, True
        decl["per_item_results_sha256"] = admit.per_item_sha256(per)
        decl_p.write_text(json.dumps(decl))
        d = self.redecide()
        self.assertNotAdmitted(d, "NO_ITEM_LEVEL_EVIDENCE")
        self.assertTrue(any("items.jsonl" in x["detail"] for x in d["details"]))

    def test_repro_items_jsonl_absent_fails_closed(self):
        self.w.write_items = False
        self.assertNotAdmitted(self.w.decide(), "NO_ITEM_LEVEL_EVIDENCE")

    def redecide(self) -> dict:
        index = admit.RuntimeIndex()
        repros, _ = admit.load_repro_dirs([self.w.repro], index)
        card = next(self.w.signed.glob("signed-*.json"))
        return admit.decide(card, self.w.evidence, repros, index, self.w.did_doc, self.w.allowlist)

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

    def mutant_admits(self, name: str, also: tuple[str, ...] = ()):
        edit, code, check = CONTROLS[name]
        edit(self.w)
        with contextlib.ExitStack() as stack:
            for c in (check, *also):
                stack.enter_context(mock.patch.object(admit, c, lambda *a, **k: []))
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
        # a totals difference always implies an item difference, so the item check is
        # disabled too; with ONLY result_reasons off the card is still held by ITEM_MISMATCH
        self.mutant_admits("result_differs", also=("item_reasons",))
        (self.w.root / "b").mkdir()
        w = World(self.w.root / "b", self.key_b64, self.pub)
        result_differs(w)
        with mock.patch.object(admit, "result_reasons", lambda *a, **k: []):
            self.assertEqual(w.decide()["reasons"], ["ITEM_MISMATCH"])

    def test_old_totals_only_rule_admits_the_item_flip(self):
        """The ruling's point: under the previous totals-only rule this card was ADMITTED."""
        self.mutant_admits("items_flip_totals_equal")

    def test_old_totals_only_rule_admits_without_item_evidence(self):
        self.mutant_admits("no_item_level_evidence")

    def test_mutant_unsigned(self):
        self.mutant_admits("unsigned")

    def test_mutant_intake_fails(self):
        self.mutant_admits("intake_fails")


# ------------------------------------------------------------------ condition 4: instrument guard

def guard_world(w: World, *, exposure="PRIVATE", canaries=True, probes=(), records=True) -> "admit.Guard":
    """A commitments record naming the fixture bank, plus public probe records, in temp dirs.
    Canaries are minted in-process and discarded; only their commitment and digests are written."""
    gdir, pdir = w.root / "guard", w.root / "probes"
    gdir.mkdir(exist_ok=True)
    pdir.mkdir(exist_ok=True)
    w.canaries = admit.ig.make_canaries("gspc-fixture", 4)
    other = admit.ig.make_canaries("gspc-other", 2)          # keeps the digest set non-empty
    bank = {"bank_id": "gspc-fixture", "bank_sha256": BANK, "exposure": exposure}
    if canaries:
        bank["canary_set"] = {"k": 4, "commitment_sha256": admit.ig.canary_set_commitment(w.canaries),
                              "leakscan_digests": admit.ig.leakscan_digests(w.canaries)}
    rec = {"schema": admit.ig.SCHEMA_COMMIT, "banks": [bank, {
        "bank_id": "gspc-other", "bank_sha256": "0c" * 32, "exposure": "PRIVATE",
        "canary_set": {"k": 2, "commitment_sha256": admit.ig.canary_set_commitment(other),
                       "leakscan_digests": admit.ig.leakscan_digests(other)}}]}
    if records:
        (gdir / "bank-commitments-2099-01-01.json").write_text(json.dumps(rec))
    for i, (state, commitment, model) in enumerate(probes):
        (pdir / f"contamination-probe-{i}.json").write_text(json.dumps({"schema": admit.ig.SCHEMA_PROBE, "results": [{
            "schema": admit.ig.SCHEMA_PROBE, "model_id": model, "bank_id": "gspc-fixture",
            "canary_set_commitment": commitment, "state": state}]}))
    return admit.load_guard(gdir, [pdir])


class InstrumentGuard(Base):
    """Condition 4. Each control is paired with a mutant that disables instrument_reasons and must admit."""

    def decide_with(self, **kw) -> dict:
        card = self.w.write()
        guard = guard_world(self.w, **kw)
        index = admit.RuntimeIndex()
        repros, _ = admit.load_repro_dirs([self.w.repro], index)
        return admit.decide(card, self.w.evidence, repros, index, self.w.did_doc, self.w.allowlist, guard)

    def commit(self):
        return admit.ig.canary_set_commitment(self.w.canaries)

    # ---- pass cases
    def test_public_bank_is_admitted_as_not_applicable_never_as_clean(self):
        d = self.decide_with(exposure="CONTENT_PUBLIC", canaries=False)
        self.assertEqual(d["state"], "ADMITTED", d)
        g = d["record"]["instrument_guard"]
        self.assertEqual(g["bank_exposure"], "PUBLIC_BANK")
        self.assertTrue(g["contamination_probe"].startswith("NOT_APPLICABLE"))
        self.assertEqual(g["canary_scan"], "CLEAN")

    def test_private_bank_with_a_bound_not_detected_probe_is_admitted(self):
        self.w.write()
        guard = guard_world(self.w)                       # mint canaries first, then bind a probe to them
        commitment = self.commit()
        guard = guard_world(self.w, probes=[("NOT_DETECTED", None, SUBJECT)])
        # guard_world re-mints canaries: rebuild with the probe bound to the fresh commitment
        (self.w.root / "probes" / "contamination-probe-0.json").write_text(json.dumps({
            "schema": admit.ig.SCHEMA_PROBE, "model_id": "ollama:qwen2.5:7b", "bank_id": "gspc-fixture",
            "canary_set_commitment": self.commit(), "state": "NOT_DETECTED"}))
        guard = admit.load_guard(self.w.root / "guard", [self.w.root / "probes"])
        self.assertNotEqual(commitment, self.commit())
        index = admit.RuntimeIndex()
        repros, _ = admit.load_repro_dirs([self.w.repro], index)
        card = next(self.w.signed.glob("signed-*.json"))
        d = admit.decide(card, self.w.evidence, repros, index, self.w.did_doc, self.w.allowlist, guard)
        self.assertEqual(d["state"], "ADMITTED", d)
        self.assertEqual(d["record"]["instrument_guard"]["contamination_probe"], "NOT_DETECTED")
        self.assertEqual(d["record"]["instrument_guard"]["bank_exposure"], "PRIVATE_BANK")

    # ---- negative controls
    def test_private_bank_without_probe_is_unchecked(self):
        self.assertNotAdmitted(self.decide_with(), "CONTAMINATION_UNCHECKED")

    def test_probe_bound_to_another_commitment_does_not_count(self):
        d = self.decide_with(probes=[("NOT_DETECTED", "ab" * 32, "ollama:qwen2.5:7b")])
        self.assertNotAdmitted(d, "CONTAMINATION_UNCHECKED")

    def test_probe_of_another_model_does_not_count(self):
        self.w.write()
        guard_world(self.w)
        (self.w.root / "probes" / "contamination-probe-0.json").write_text(json.dumps({
            "schema": admit.ig.SCHEMA_PROBE, "model_id": "ollama:llama3.1:8b", "bank_id": "gspc-fixture",
            "canary_set_commitment": self.commit(), "state": "NOT_DETECTED"}))
        guard = admit.load_guard(self.w.root / "guard", [self.w.root / "probes"])
        reasons, _ = admit.instrument_reasons(json.loads(next(self.w.signed.glob("signed-*.json")).read_text()),
                                              b"{}", guard)
        self.assertIn("CONTAMINATION_UNCHECKED", [c for c, _ in reasons])

    def test_suspected_probe_is_refused(self):
        self.w.write()
        guard_world(self.w)
        (self.w.root / "probes" / "contamination-probe-0.json").write_text(json.dumps({
            "schema": admit.ig.SCHEMA_PROBE, "model_id": "ollama:qwen2.5:7b", "bank_id": "gspc-fixture",
            "canary_set_commitment": self.commit(), "state": "CONTAMINATION_SUSPECTED"}))
        guard = admit.load_guard(self.w.root / "guard", [self.w.root / "probes"])
        index = admit.RuntimeIndex()
        repros, _ = admit.load_repro_dirs([self.w.repro], index)
        card = next(self.w.signed.glob("signed-*.json"))
        d = admit.decide(card, self.w.evidence, repros, index, self.w.did_doc, self.w.allowlist, guard)
        self.assertNotAdmitted(d, "CONTAMINATION_SUSPECTED")

    def test_no_commitments_record_fails_closed(self):
        self.assertNotAdmitted(self.decide_with(records=False), "CONTAMINATION_UNCHECKED")

    def test_card_bytes_carrying_a_canary_token_are_refused(self):
        self.w.write()
        guard = guard_world(self.w, exposure="CONTENT_PUBLIC", canaries=False)
        other_digests = guard.digests
        card = json.loads(next(self.w.signed.glob("signed-*.json")).read_text())
        # a token whose digest the guard holds: take one from a record we control
        rows = admit.ig.make_canaries("gspc-leak", 1)
        guard.digests = other_digests | set(admit.ig.leakscan_digests(rows))
        raw = json.dumps({**card, "note": f"ref {rows[0]['guid']}"}).encode()
        reasons, block = admit.instrument_reasons(card, raw, guard)
        self.assertIn("CANARY_LEAK", [c for c, _ in reasons])
        self.assertEqual(block["canary_scan"], "LEAK")
        self.assertNotIn(rows[0]["guid"], json.dumps(reasons))          # the gate never prints the token
        clean, block = admit.instrument_reasons(card, json.dumps(card).encode(), guard)
        self.assertEqual((clean, block["canary_scan"]), ([], "CLEAN"))

    def test_revalidation_holds_a_record_when_the_bank_gains_canaries(self):
        d = self.decide_with(exposure="CONTENT_PUBLIC", canaries=False)
        self.assertEqual(d["state"], "ADMITTED", d)
        card = json.loads((self.w.signed / d["card_file"]).read_text())
        public_guard = admit.load_guard(self.w.root / "guard", [self.w.root / "probes"])
        self.assertEqual([], admit.validate_admission_record(d["record"], card, self.w.primary_receipt,
                                                             self.w.did_doc, public_guard))
        private_guard = guard_world(self.w)
        errs = admit.validate_admission_record(d["record"], card, self.w.primary_receipt, self.w.did_doc, private_guard)
        self.assertTrue(any("CONTAMINATION_UNCHECKED" in e for e in errs), errs)

    # ---- mutants: with instrument_reasons disabled every control above would admit
    def test_mutant_unchecked_admits(self):
        with mock.patch.object(admit, "instrument_reasons", lambda card, raw, guard: ([], {})):
            d = self.decide_with()
        self.assertEqual(d["state"], "ADMITTED", d["reasons"])

    def test_mutant_no_records_admits(self):
        with mock.patch.object(admit, "instrument_reasons", lambda card, raw, guard: ([], {})):
            d = self.decide_with(records=False)
        self.assertEqual(d["state"], "ADMITTED", d["reasons"])


if __name__ == "__main__":
    unittest.main()
