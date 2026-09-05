from __future__ import annotations

import copy
import hashlib
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey


SCRIPT = Path(__file__).with_name("csoai-learn.py")
SPEC = importlib.util.spec_from_file_location("csoai_learn_under_test", SCRIPT)
assert SPEC and SPEC.loader
LEARN = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(LEARN)


class LearningEligibilityGateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.private_key = Ed25519PrivateKey.generate()
        cls.public_key = cls.private_key.public_key().public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw,
        )
        cls.kid = "did:web:reviewer.example#measurement-1"

    def atom(self) -> dict:
        return {
            "subject": {"kind": "model", "source": "fixture-model"},
            "scope": {"axis": "fixture-axis", "kind": "benchmark"},
            "measurement": {
                "status": "MEASURED",
                "evidence": {"score": 0.5},
                "source_url": "https://example.test/run/1",
            },
            "as_of": "2026-09-04T10:11:12Z",
            "issuer": "did:web:producer.example#measurement-1",
        }

    def admission(self, atom: dict) -> dict:
        body_sha256 = hashlib.sha256(LEARN.canonical_bytes(atom)).hexdigest()
        admission = {
            "schema": "csoai.measurement-admission/0.1",
            "body_sha256": body_sha256,
            "evidence_bundle_sha256": "1" * 64,
            "reproduction_receipt_sha256": "2" * 64,
            "method_sha256": "3" * 64,
            "reviewer": "independent-reviewer@example.test",
            "admitted_at": "2026-09-04T10:12:13Z",
            "adjudicator": {"kid": self.kid, "alg": "Ed25519"},
        }
        signature = self.private_key.sign(LEARN.canonical_bytes(admission)).hex()
        admission["adjudicator"]["signature"] = signature
        return admission

    def eligible(self) -> dict:
        atom = self.atom()
        return {
            "schema": "csoai.training-eligibility/0.1",
            "atom": atom,
            "consent": {
                "model_training": True,
                "purpose": "csoai-model-training",
                "granted_by": "data-owner@example.test",
                "granted_at": "2026-09-04T10:13:14Z",
            },
            "provenance": {
                "source_uri": "https://example.test/run/1",
                "source_sha256": hashlib.sha256(LEARN.canonical_bytes(atom)).hexdigest(),
                "producer_id": "did:web:producer.example#measurement-1",
                "license_id": "CC-BY-4.0",
                "license_uri": "https://creativecommons.org/licenses/by/4.0/",
            },
            "evidence_state": "ADMITTED_VERIFIED",
            "admission": self.admission(atom),
        }

    def validate(self, record: dict) -> dict:
        return LEARN.validate_training_record(record, self.kid, self.public_key)

    def test_accepts_only_the_versioned_consented_admitted_record(self) -> None:
        record = self.eligible()
        validated = self.validate(record)
        corpus_row = LEARN.learn_record(validated)

        self.assertIs(validated, record)
        self.assertTrue(corpus_row["training_eligibility"]["model_training"])
        self.assertEqual(corpus_row["training_eligibility"]["evidence_state"], "ADMITTED_VERIFIED")
        self.assertEqual(corpus_row["training_eligibility"]["license_id"], "CC-BY-4.0")

    def test_rejects_raw_atoms_generated_corpora_and_game_or_report_candidates(self) -> None:
        for record in (
            self.atom(),
            {"prompt": "old recursive output", "response": "must not be re-ingested"},
            {"schema": "csoai.evidence-observation/0.1", "state": "CANDIDATE"},
            {"schema": "csoai.report-receipt/0.1", "state": "REPORTED"},
        ):
            with self.subTest(record=record):
                with self.assertRaisesRegex(LEARN.EligibilityError, "record must contain exactly"):
                    self.validate(record)

    def test_requires_explicit_model_training_consent_and_exact_purpose(self) -> None:
        for key, value in (("model_training", False), ("model_training", 1), ("purpose", "research")):
            record = self.eligible()
            record["consent"][key] = value
            with self.subTest(key=key, value=value):
                with self.assertRaises(LEARN.EligibilityError):
                    self.validate(record)

    def test_requires_provenance_digest_and_complete_license(self) -> None:
        bad_digest = self.eligible()
        bad_digest["provenance"]["source_sha256"] = "0" * 64
        with self.assertRaisesRegex(LEARN.EligibilityError, "does not bind"):
            self.validate(bad_digest)

        missing_license = self.eligible()
        del missing_license["provenance"]["license_uri"]
        with self.assertRaisesRegex(LEARN.EligibilityError, "provenance must contain exactly"):
            self.validate(missing_license)

    def test_requires_verified_independent_signed_measurement_admission(self) -> None:
        for state in ("CANDIDATE", "REPORTED", "SIGNED", "LEGACY_UNADJUDICATED"):
            record = self.eligible()
            record["evidence_state"] = state
            with self.subTest(state=state):
                with self.assertRaisesRegex(LEARN.EligibilityError, "evidence_state"):
                    self.validate(record)

        forged = self.eligible()
        forged["admission"]["adjudicator"]["signature"] = "00" * 64
        with self.assertRaisesRegex(LEARN.EligibilityError, "signature is invalid"):
            self.validate(forged)

        same_actor = self.eligible()
        same_actor["provenance"]["producer_id"] = self.kid
        with self.assertRaisesRegex(LEARN.EligibilityError, "independent"):
            self.validate(same_actor)

    def test_admission_and_provenance_are_bound_to_the_exact_atom(self) -> None:
        record = self.eligible()
        changed = copy.deepcopy(record)
        changed["atom"]["measurement"]["evidence"]["score"] = 0.9
        with self.assertRaisesRegex(LEARN.EligibilityError, "does not bind"):
            self.validate(changed)

    def test_input_discovery_is_direct_and_never_recursive(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "direct.jsonl").write_text("{}\n", encoding="utf-8")
            (root / "_state.jsonl").write_text("{}\n", encoding="utf-8")
            (root / "not-jsonl.txt").write_text("{}\n", encoding="utf-8")
            nested = root / "learn"
            nested.mkdir()
            (nested / "prior-corpus.jsonl").write_text("{}\n", encoding="utf-8")
            (root / "linked-corpus.jsonl").symlink_to(nested / "prior-corpus.jsonl")

            self.assertEqual(LEARN.input_files(root), [root / "direct.jsonl"])


if __name__ == "__main__":
    unittest.main()
