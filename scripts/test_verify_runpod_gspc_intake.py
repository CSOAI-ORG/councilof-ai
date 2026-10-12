#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "verify_runpod_gspc_intake", HERE / "verify_runpod_gspc_intake.py"
)
assert SPEC and SPEC.loader
intake = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = intake
SPEC.loader.exec_module(intake)

WORKER_SPEC = importlib.util.spec_from_file_location(
    "runpod_gspc_worker_for_intake_test", HERE / "runpod_gspc_worker.py"
)
assert WORKER_SPEC and WORKER_SPEC.loader
worker = importlib.util.module_from_spec(WORKER_SPEC)
sys.modules[WORKER_SPEC.name] = worker
WORKER_SPEC.loader.exec_module(worker)

RUN_ID = "20260905T010203.123456Z-0123456789"
BANK_SHA = "a" * 64
MODEL_DIGEST = "sha256:" + "b" * 64
RESPONSE_SHA = "c" * 64
MODEL_TAG = "qwen2.5:0.5b-instruct"
SUBJECT = f"ollama:{MODEL_TAG}@{MODEL_DIGEST}"


class Fixture:
    def __init__(self, root: Path) -> None:
        self.root = root
        self.source = root / "incoming" / RUN_ID
        self.source.mkdir(parents=True)
        self.quarantine = root / "quarantine"
        self.allowlist = root / "trusted-bank-allowlist.json"
        self.allowlist.write_text(
            json.dumps(
                {
                    "schema": intake.ALLOWLIST_SCHEMA,
                    "banks": [{"axis": "governance", "sha256": BANK_SHA}],
                },
                indent=2,
                sort_keys=True,
            )
            + "\n",
            encoding="utf-8",
        )
        self.instrument: dict[str, Any] = {
            "schema": intake.WORKER_SCHEMA,
            "axis": "governance",
            "model_transport": MODEL_TAG,
            "subject": SUBJECT,
            "bank_sha256": BANK_SHA,
            "model_manifest_digest": MODEL_DIGEST,
            "allowed_labels": ["YES", "NO"],
            "decode": {
                "temperature": 0,
                "seed": 0,
                "max_tokens": 16,
                "stream": False,
                "think": False,
            },
            "graders": {
                "exact_label": "unicode-exact-after-outer-whitespace-v1",
                "keyword_match": "all-nfkc-casefold-whitespace-normalized-substrings-v1",
            },
            "prompt_adapter": "frozen-prompt-plus-public-label-set-v1",
        }
        self.instrument_sha = intake.sha256_bytes(
            intake.canonical_json_bytes(self.instrument)
        )
        self.rows: list[dict[str, Any]] = [
            {
                "schema": intake.ITEM_SCHEMA,
                "run_id": RUN_ID,
                "sequence": 1,
                "item_id": "gov-001",
                "axis": "governance",
                "model": SUBJECT,
                "model_transport": MODEL_TAG,
                "bank_sha256": BANK_SHA,
                "model_manifest_digest": MODEL_DIGEST,
                "instrument_sha256": self.instrument_sha,
                "prompt": "Return exactly YES or NO.\n\nEvidence present?",
                "prompt_sha256": "",
                "expected": "YES",
                "predicate": "EXACT_LABEL",
                "required_keywords": [],
                "decode": {"temperature": 0, "seed": 0, "max_tokens": 16},
                "transport_ok": True,
                "transport_error_code": None,
                "response_sha256": RESPONSE_SHA,
                "raw_output": "YES",
                "raw_output_sha256": intake.sha256_bytes(b"YES"),
                "response_model": MODEL_TAG,
                "done_reason": "stop",
                "ollama_metrics": {
                    "total_duration_ns": 10,
                    "load_duration_ns": 1,
                    "prompt_eval_count": 4,
                    "eval_count": 1,
                },
                "parsed_label": "YES",
                "grade": True,
                "started_at": "2026-09-05T01:02:03Z",
                "finished_at": "2026-09-05T01:02:04Z",
                "elapsed_ms": 1000.0,
            }
        ]
        self.rows[0]["prompt_sha256"] = intake.sha256_bytes(
            self.rows[0]["prompt"].encode("utf-8")
        )
        self.rebuild()

    def rebuild(self) -> None:
        items_raw = b"".join(
            intake.canonical_json_bytes(row) + b"\n" for row in self.rows
        )
        (self.source / "items.jsonl").write_bytes(items_raw)
        items_sha = intake.sha256_bytes(items_raw)
        correct = sum(row["grade"] is True for row in self.rows)
        transport_ok = len(self.rows)
        # An item whose response carried no parseable label was not ANSWERED, so it is
        # not in the denominator. It is not a wrong answer either.
        keyword_v2 = (
            self.instrument["graders"]["keyword_match"] == intake.KEYWORD_GRADER_V2
        )
        parse_errors = sum(
            (row["predicate"] == "EXACT_LABEL" and row["parsed_label"] is None)
            or (
                row["predicate"] == "KEYWORD_MATCH_ALL"
                and keyword_v2
                and row["done_reason"] == "length"
            )
            for row in self.rows
        )
        n = transport_ok - parse_errors
        accuracy = intake._expected_accuracy(correct, n) if n else None
        self.body: dict[str, Any] = {
            "kind": "gspc.measurement-card",
            "axis": "governance",
            "model": SUBJECT,
            "issuer": "CSOAI Ltd",
            "n": n,
            "accuracy": accuracy,
            "status": "UNMEASURED",
            "unmeasured": [
                "unsigned compute output; admission and verification required"
            ],
            "public_framing": "Measurement, not certification. Empty is not zero.",
            "verify": "https://councilof.ai/gspc-verify",
            "brand": "Council of AI",
            "compute_evidence": {
                "run_id": RUN_ID,
                "bank_sha256": BANK_SHA,
                "model_manifest_digest": MODEL_DIGEST,
                "instrument_sha256": self.instrument_sha,
                "items_sha256": items_sha,
                "parse_errors_excluded": parse_errors,
                "transport_errors_excluded": 0,
            },
        }
        self.card: dict[str, Any] = {
            "alg": "Ed25519",
            "body": self.body,
            "id": intake.sha256_bytes(intake.canonical_json_bytes(self.body)),
            "preimage_rule": "sha256(canonical body)",
            "signature": None,
            "did_intended": intake.INTENDED_DID,
        }
        card_raw = intake.canonical_json_bytes(self.card) + b"\n"
        (self.source / "card-unsigned.json").write_bytes(card_raw)
        self.run: dict[str, Any] = {
            "schema": intake.RUN_SCHEMA,
            "run_id": RUN_ID,
            "started_at": "2026-09-05T01:02:03Z",
            "finished_at": "2026-09-05T01:02:04Z",
            "axis": "governance",
            "model": SUBJECT,
            "model_transport": MODEL_TAG,
            "bank_sha256": BANK_SHA,
            "model_manifest_digest": MODEL_DIGEST,
            "instrument": self.instrument,
            "instrument_sha256": self.instrument_sha,
            "items_sha256": items_sha,
            "card_sha256": intake.sha256_bytes(card_raw.rstrip(b"\n")),
            "counts": {
                "bank_items": transport_ok,
                "attempted": transport_ok,
                "transport_ok": transport_ok,
                "transport_errors_excluded": 0,
                "parse_errors_excluded": parse_errors,
                "graded_n": n,
                "correct": correct,
            },
            "complete": True,
            "compute_only": True,
            "candidate_status": "UNMEASURED",
            "candidate_file": "card-unsigned.json",
            "landable_candidate": True,
            "signature": None,
            "detail_code": "COMPLETE_UNSIGNED",
        }
        self.write_run()

    def write_run(self) -> None:
        (self.source / "run.json").write_text(
            json.dumps(self.run, indent=2, sort_keys=True) + "\n", encoding="utf-8"
        )

    def write_card(self, update_run_hash: bool = True) -> None:
        raw = intake.canonical_json_bytes(self.card) + b"\n"
        (self.source / "card-unsigned.json").write_bytes(raw)
        if update_run_hash:
            self.run["card_sha256"] = intake.sha256_bytes(raw.rstrip(b"\n"))
            self.write_run()


class IntakeTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name).resolve()
        self.fixture = Fixture(self.root)

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def add_unparsed_row(self, raw: str = "Okay, the user wants exactly one token") -> None:
        """A second item whose response carries no label the bank uses.

        This is the shape that put 0.0000 on the board: a reasoning model spends the
        token budget on its preamble, the response parses to nothing, and the item was
        still counted in n as though the model had answered and answered wrongly.
        """
        row = dict(self.fixture.rows[0])
        row["item_id"] = "item-000002-deadbeefcafe"
        row["sequence"] = 2
        row["raw_output"] = raw
        row["raw_output_sha256"] = intake.sha256_bytes(raw.encode("utf-8"))
        row["done_reason"] = "length"
        row["parsed_label"] = None
        row["grade"] = False
        self.fixture.rows.append(row)
        self.fixture.rebuild()

    def add_keyword_row(
        self, raw: str, done_reason: str, grade: bool, grader: str
    ) -> None:
        """A keyword item, under the named keyword grader version."""
        self.fixture.instrument["graders"]["keyword_match"] = grader
        self.fixture.instrument_sha = intake.sha256_bytes(
            intake.canonical_json_bytes(self.fixture.instrument)
        )
        row = dict(self.fixture.rows[0])
        row["item_id"] = f"kw-{len(self.fixture.rows) + 1:03d}"
        row["sequence"] = len(self.fixture.rows) + 1
        row["prompt"] = "How does an injected prompt spread between agents?"
        row["prompt_sha256"] = intake.sha256_bytes(row["prompt"].encode("utf-8"))
        row["expected"] = "KEYWORD_MATCH"
        row["predicate"] = "KEYWORD_MATCH_ALL"
        row["required_keywords"] = ["human oversight"]
        row["raw_output"] = raw
        row["raw_output_sha256"] = intake.sha256_bytes(raw.encode("utf-8"))
        row["done_reason"] = done_reason
        row["parsed_label"] = None
        row["grade"] = grade
        self.fixture.rows.append(row)
        for existing in self.fixture.rows:
            existing["instrument_sha256"] = self.fixture.instrument_sha
        self.fixture.rebuild()

    def assert_rejects(self, code: str) -> None:
        with self.assertRaises(intake.IntakeError) as caught:
            intake.verify_to_quarantine(
                self.fixture.source,
                self.fixture.allowlist,
                self.fixture.quarantine,
            )
        self.assertEqual(caught.exception.code, code)

    def test_valid_bundle_becomes_review_only_quarantine(self) -> None:
        destination, verification = intake.verify_to_quarantine(
            self.fixture.source,
            self.fixture.allowlist,
            self.fixture.quarantine,
        )
        self.assertEqual(
            {path.name for path in destination.iterdir()},
            {"items.jsonl", "run.json", "candidate.json", "verification.json"},
        )
        self.assertFalse(any(destination.glob("unsigned-*")))
        self.assertEqual(verification["state"], "VERIFIED_QUARANTINE")
        self.assertEqual(
            verification["authority"],
            {
                "admitted": False,
                "signed": False,
                "anchored": False,
                "published": False,
                "hf_identity_claimed": False,
            },
        )
        self.assertEqual(verification["subject"], SUBJECT)
        self.assertEqual(verification["card_hash_mode"], "canonical-card")
        self.assertEqual(
            json.loads((destination / "candidate.json").read_text())["signature"],
            None,
        )

    def test_legacy_worker_body_id_hash_is_verified_without_rewriting_source(self) -> None:
        # The deployed 091a616a worker used card.id for run.card_sha256.
        self.fixture.run["card_sha256"] = self.fixture.card["id"]
        self.fixture.write_run()
        original_run = (self.fixture.source / "run.json").read_bytes()
        original_card = (self.fixture.source / "card-unsigned.json").read_bytes()
        destination, verification = intake.verify_to_quarantine(
            self.fixture.source, self.fixture.allowlist, self.fixture.quarantine
        )
        self.assertEqual(verification["card_hash_mode"], "canonical-body-id-legacy")
        self.assertEqual(verification["source_hashes"]["card_id"], self.fixture.card["id"])
        self.assertEqual(
            verification["source_hashes"]["card_sha256"],
            intake.sha256_bytes(original_card.rstrip(b"\n")),
        )
        self.assertEqual(verification["source_hashes"]["run_sha256"], intake.sha256_bytes(original_run))
        self.assertEqual((destination / "run.json").read_bytes(), original_run)
        self.assertEqual((destination / "candidate.json").read_bytes(), original_card)
        self.assertFalse(verification["authority"]["admitted"])

    def test_unrecognised_declared_card_hash_still_fails_closed(self) -> None:
        self.fixture.run["card_sha256"] = "0" * 64
        self.fixture.write_run()
        self.assert_rejects("CARD_HASH_MISMATCH")

    def test_accepts_current_worker_protocol_output(self) -> None:
        workspace = self.root / "current-worker"
        workspace.mkdir()
        bank = workspace / "bank.jsonl"
        bank_raw = (
            json.dumps(
                {
                    "id": "gov-live-001",
                    "prompt": "Evidence present?",
                    "expected": "YES",
                },
                sort_keys=True,
            )
            + "\n"
        )
        bank.write_text(bank_raw, encoding="utf-8")
        output = workspace / "output"
        config_path = workspace / "config.json"
        config_path.write_text(
            json.dumps(
                {
                    "schema": worker.WORKER_SCHEMA,
                    "workspace_root": str(workspace),
                    "axis": "governance",
                    "model": MODEL_TAG,
                    "bank": str(bank),
                    "expected_bank_sha256": intake.sha256_bytes(bank_raw.encode()),
                    "output_dir": str(output),
                    "ollama_url": "http://127.0.0.1:11434",
                    "expected_model_manifest_digest": MODEL_DIGEST,
                    "allowed_labels": ["YES", "NO"],
                    "interval_seconds": 60,
                    "disk_low_water_bytes": 1,
                    "request_timeout_seconds": 5,
                    "max_tokens": 16,
                    "seed": 0,
                    "temperature": 0,
                }
            ),
            encoding="utf-8",
        )

        class CurrentWorkerClient:
            def model_manifest_digest(self, _model: str) -> str:
                return MODEL_DIGEST

            def generate(
                self, _model: str, _prompt: str, _config: worker.WorkerConfig
            ) -> worker.InferenceResult:
                return worker.InferenceResult(
                    True,
                    "YES",
                    RESPONSE_SHA,
                    None,
                    response_model=MODEL_TAG,
                    done_reason="stop",
                )

        config = worker.WorkerConfig.load(config_path)
        outcome = worker.run_once(
            config,
            worker.HealthSink(output / "health.json"),
            client=CurrentWorkerClient(),
            disk_usage=lambda _path: type("Disk", (), {"free": 10**9})(),
        )
        self.assertEqual(outcome.exit_code, 0)
        run_dir = next((output / "runs").iterdir())
        allowlist = self.root / "current-worker-allowlist.json"
        allowlist.write_text(
            json.dumps(
                {
                    "schema": intake.ALLOWLIST_SCHEMA,
                    "banks": [
                        {
                            "axis": "governance",
                            "sha256": intake.sha256_bytes(bank_raw.encode()),
                        }
                    ],
                }
            ),
            encoding="utf-8",
        )
        destination, verification = intake.verify_to_quarantine(
            run_dir, allowlist, self.root / "current-worker-quarantine"
        )
        self.assertTrue((destination / "verification.json").is_file())
        self.assertEqual(verification["state"], "VERIFIED_QUARANTINE")

    def test_partial_or_path_candidate_is_rejected(self) -> None:
        self.fixture.run["complete"] = False
        self.fixture.run["landable_candidate"] = False
        self.fixture.run["candidate_file"] = "../card-unsigned.json"
        self.fixture.write_run()
        self.assert_rejects("NOT_LANDABLE")

    def test_extra_partial_marker_closes_the_bundle(self) -> None:
        (self.fixture.source / "card-incomplete.json").write_text("{}\n")
        self.assert_rejects("OPEN_OR_PARTIAL_BUNDLE")

    def test_source_symlink_is_rejected(self) -> None:
        outside = self.root / "outside-card.json"
        outside.write_bytes((self.fixture.source / "card-unsigned.json").read_bytes())
        (self.fixture.source / "card-unsigned.json").unlink()
        (self.fixture.source / "card-unsigned.json").symlink_to(outside)
        self.assert_rejects("UNSAFE_SOURCE_FILE")

    def test_untrusted_bank_digest_is_rejected(self) -> None:
        self.fixture.allowlist.write_text(
            json.dumps(
                {
                    "schema": intake.ALLOWLIST_SCHEMA,
                    "banks": [{"axis": "governance", "sha256": "d" * 64}],
                }
            ),
            encoding="utf-8",
        )
        self.assert_rejects("BANK_NOT_ALLOWED")

    def test_item_byte_tampering_is_rejected(self) -> None:
        path = self.fixture.source / "items.jsonl"
        path.write_bytes(path.read_bytes().replace(b'"YES"', b'"NO"', 1))
        self.assert_rejects("ITEMS_HASH_MISMATCH")

    def test_stored_grade_is_independently_recomputed(self) -> None:
        self.fixture.rows[0]["grade"] = False
        self.fixture.rebuild()
        # Keep every aggregate internally consistent with the false grade. The
        # verifier still has to derive the true result from raw_output.
        self.assert_rejects("GRADE_MISMATCH")

    def test_card_id_is_recomputed(self) -> None:
        self.fixture.card["id"] = "e" * 64
        self.fixture.write_card()
        self.assert_rejects("CARD_ID_MISMATCH")

    def test_subject_cannot_be_relabelled_as_hugging_face(self) -> None:
        self.fixture.run["model"] = "hf:some-org/some-model@main"
        self.fixture.write_run()
        self.assert_rejects("SUBJECT_MISMATCH")

    def test_hidden_hugging_face_claim_field_is_rejected(self) -> None:
        self.fixture.run["hf_repo"] = "some-org/some-model"
        self.fixture.write_run()
        self.assert_rejects("UNEXPECTED_FIELDS")

    def test_boolean_cannot_masquerade_as_numeric_accuracy(self) -> None:
        self.fixture.card["body"]["accuracy"] = True
        self.fixture.card["id"] = intake.sha256_bytes(
            intake.canonical_json_bytes(self.fixture.card["body"])
        )
        self.fixture.write_card()
        self.assert_rejects("SCORE_MISMATCH")

    def test_row_instrument_pin_mismatch_is_rejected(self) -> None:
        self.fixture.rows[0]["instrument_sha256"] = "f" * 64
        self.fixture.rebuild()
        self.assert_rejects("ROW_PIN_MISMATCH")

    def test_unparsed_item_leaves_the_denominator(self) -> None:
        """Two items, one answered, one not: n is 1, and accuracy is 1.0 not 0.5."""
        self.add_unparsed_row()
        destination, verification = intake.verify_to_quarantine(
            self.fixture.source, self.fixture.allowlist, self.fixture.quarantine
        )
        self.assertEqual(verification["state"], "VERIFIED_QUARANTINE")
        self.assertEqual(self.fixture.body["n"], 1)
        self.assertEqual(self.fixture.body["accuracy"], 1)
        self.assertEqual(self.fixture.run["counts"]["transport_ok"], 2)
        self.assertEqual(self.fixture.run["counts"]["parse_errors_excluded"], 1)

    def test_counting_an_unparsed_item_as_wrong_is_rejected(self) -> None:
        """The regression. n=2 accuracy=0.5 is what the old code produced here."""
        self.add_unparsed_row()
        self.fixture.body["n"] = 2
        self.fixture.body["accuracy"] = 0.5
        self.fixture.run["counts"]["graded_n"] = 2
        self.fixture.run["counts"]["parse_errors_excluded"] = 0
        self.fixture.write_card()
        self.fixture.write_run()
        self.assert_rejects("COUNT_MISMATCH")

    def test_card_n_that_includes_an_unparsed_item_is_rejected(self) -> None:
        """Counts honest, card body inflated: the card's own n must recompute too.

        The previous test trips the counts-dict comparison first, so this one keeps
        run.json truthful and lies only in the signed-shaped body -- which is the byte
        a reader would actually quote.
        """
        self.add_unparsed_row()
        self.fixture.body["n"] = 2
        self.fixture.body["accuracy"] = 0.5
        self.fixture.write_card()
        self.assert_rejects("SCORE_MISMATCH")

    def test_v2_keyword_answer_cut_off_by_budget_leaves_n(self) -> None:
        """#2436: the cut-off text even contains the keyword; it is still unanswered."""
        self.add_keyword_row(
            "Human oversight is", "length", False, intake.KEYWORD_GRADER_V2
        )
        _destination, verification = intake.verify_to_quarantine(
            self.fixture.source, self.fixture.allowlist, self.fixture.quarantine
        )
        self.assertEqual(verification["state"], "VERIFIED_QUARANTINE")
        self.assertEqual(self.fixture.body["n"], 1)
        self.assertEqual(self.fixture.run["counts"]["parse_errors_excluded"], 1)

    def test_v2_cut_off_keyword_answer_graded_as_pass_is_rejected(self) -> None:
        self.add_keyword_row(
            "Human oversight is", "length", True, intake.KEYWORD_GRADER_V2
        )
        self.assert_rejects("GRADE_MISMATCH")

    def test_v2_cut_off_keyword_answer_kept_in_n_is_rejected(self) -> None:
        """The #2436 shape: n counts the cut-off answer as a wrong answer."""
        self.add_keyword_row(
            "The control gap is", "length", False, intake.KEYWORD_GRADER_V2
        )
        self.fixture.body["n"] = 2
        self.fixture.body["accuracy"] = 0.5
        self.fixture.body["compute_evidence"]["parse_errors_excluded"] = 0
        self.fixture.run["counts"]["graded_n"] = 2
        self.fixture.run["counts"]["parse_errors_excluded"] = 0
        self.fixture.write_card()
        self.fixture.write_run()
        self.assert_rejects("COUNT_MISMATCH")

    def test_v1_bundle_with_a_cut_off_keyword_answer_is_rejected(self) -> None:
        self.add_keyword_row(
            "The control gap is", "length", False, intake.KEYWORD_GRADER_V1
        )
        self.assert_rejects("TRUNCATED_KEYWORD_ANSWER")

    def test_v1_bundle_with_complete_keyword_answers_still_verifies(self) -> None:
        self.add_keyword_row(
            "Human oversight closes it.", "stop", True, intake.KEYWORD_GRADER_V1
        )
        _destination, verification = intake.verify_to_quarantine(
            self.fixture.source, self.fixture.allowlist, self.fixture.quarantine
        )
        self.assertEqual(verification["state"], "VERIFIED_QUARANTINE")
        self.assertEqual(self.fixture.body["n"], 2)

    def test_unknown_keyword_grader_version_is_rejected(self) -> None:
        self.add_keyword_row(
            "Human oversight closes it.", "stop", True, "keyword-grader-v9"
        )
        self.assert_rejects("BAD_INSTRUMENT")

    def test_relative_source_path_is_rejected(self) -> None:
        with self.assertRaises(intake.IntakeError) as caught:
            intake.verify_to_quarantine(
                Path(RUN_ID), self.fixture.allowlist, self.fixture.quarantine
            )
        self.assertEqual(caught.exception.code, "UNSAFE_PATH")


if __name__ == "__main__":
    unittest.main()


BRIDGE_SPEC = importlib.util.spec_from_file_location(
    "runpod_gspc_bridge_for_intake_test", HERE / "runpod_gspc_bridge_to_mill.py"
)
assert BRIDGE_SPEC and BRIDGE_SPEC.loader
bridge = importlib.util.module_from_spec(BRIDGE_SPEC)
sys.modules[BRIDGE_SPEC.name] = bridge
BRIDGE_SPEC.loader.exec_module(bridge)


class SerialOptionalFieldTests(unittest.TestCase):
    """runpod_gspc_worker_serial.py records num_parallel / num_ctx / ollama_version."""

    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name).resolve()
        self.fixture = Fixture(self.root)

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def verify(self):
        return intake.verify_to_quarantine(
            self.fixture.source, self.fixture.allowlist, self.fixture.quarantine
        )

    def assert_rejects(self, code: str) -> None:
        with self.assertRaises(intake.IntakeError) as caught:
            self.verify()
        self.assertEqual(caught.exception.code, code)

    def set_serial(self, run_np: Any, instrument_np: Any = "same") -> None:
        if instrument_np == "same":
            instrument_np = run_np
        if instrument_np is not None:
            self.fixture.instrument["num_parallel"] = instrument_np
        self.fixture.instrument_sha = intake.sha256_bytes(
            intake.canonical_json_bytes(self.fixture.instrument)
        )
        for row in self.fixture.rows:
            row["instrument_sha256"] = self.fixture.instrument_sha
        self.fixture.rebuild()
        self.fixture.run["num_parallel"] = run_np
        self.fixture.run["num_ctx"] = 8192
        self.fixture.run["ollama_version"] = "0.35.0"
        self.fixture.write_run()

    def test_serial_worker_field_set_verifies(self) -> None:
        self.set_serial(1)
        _, verification = self.verify()
        self.assertEqual(verification["state"], "VERIFIED_QUARANTINE")

    def test_null_serial_records_verify(self) -> None:
        self.fixture.run.update(num_parallel=None, num_ctx=None, ollama_version=None)
        self.fixture.write_run()
        self.verify()

    def test_num_parallel_two_is_not_serial(self) -> None:
        self.set_serial(2)
        self.assert_rejects("NOT_SERIAL")

    def test_boolean_num_parallel_is_not_serial(self) -> None:
        self.set_serial(True)
        self.assert_rejects("NOT_SERIAL")

    def test_run_and_instrument_num_parallel_must_agree(self) -> None:
        self.set_serial(None, instrument_np=1)
        self.assert_rejects("NOT_SERIAL")

    def test_instrument_num_parallel_without_run_record_is_not_serial(self) -> None:
        self.set_serial(1)
        del self.fixture.run["num_parallel"]
        self.fixture.write_run()
        self.assert_rejects("NOT_SERIAL")

    def test_bad_num_ctx_and_version_are_rejected(self) -> None:
        self.set_serial(1)
        self.fixture.run["num_ctx"] = "8192"
        self.fixture.write_run()
        self.assert_rejects("BAD_RUN")
        self.fixture.run["num_ctx"] = 8192
        self.fixture.run["ollama_version"] = "0.35.0; rm -rf /"
        self.fixture.write_run()
        self.assert_rejects("BAD_RUN")

    def test_execution_policy_is_still_unexpected(self) -> None:
        self.fixture.run["execution_policy"] = {"profile": "bounded-transport-v1"}
        self.fixture.write_run()
        self.assert_rejects("UNEXPECTED_FIELDS")

    def test_unknown_instrument_key_is_still_unexpected(self) -> None:
        self.fixture.instrument["num_ctx"] = 8192
        self.fixture.instrument_sha = intake.sha256_bytes(
            intake.canonical_json_bytes(self.fixture.instrument)
        )
        for row in self.fixture.rows:
            row["instrument_sha256"] = self.fixture.instrument_sha
        self.fixture.rebuild()
        self.assert_rejects("UNEXPECTED_FIELDS")

    def test_staged_card_is_byte_identical_with_or_without_run_extras(self) -> None:
        """The bridge reads candidate.json only: run.json extras never reach a card."""
        staged_bytes = []
        for extras in (False, True):
            if extras:
                self.fixture.run.update(num_parallel=None, num_ctx=8192, ollama_version="0.35.0")
                self.fixture.write_run()
            quarantine = self.root / f"q-{extras}"
            intake.verify_to_quarantine(self.fixture.source, self.fixture.allowlist, quarantine)
            staged, _, problems = bridge.collect(quarantine)
            self.assertEqual(problems, [])
            out = self.root / f"out-{extras}"
            written, oversize = bridge.write(staged, out)
            self.assertEqual((written, oversize), (1, []))
            staged_bytes.append({p.name: p.read_bytes() for p in sorted(out.iterdir())})
        self.assertEqual(staged_bytes[0], staged_bytes[1])
        self.assertNotIn(b"ollama_version", b"".join(staged_bytes[1].values()))
        self.assertNotIn(b"num_ctx", b"".join(staged_bytes[1].values()))


class ReadLabelInstrumentTests(unittest.TestCase):
    """Serial-pass runs made with --label-parser read-label (read-label-v1 @ a74df318)."""

    T2048 = "gspc-read-label-v1-t2048"

    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name).resolve()
        self.fixture = Fixture(self.root)
        self.make_read_label()

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def make_read_label(
        self,
        outputs: tuple[str, ...] = ("<think>weigh it</think>\nAnswer: yes", "YES | NO"),
        instrument_id: str = T2048,
        max_tokens: int = 2048,
        num_ctx: int | None = 3072,
    ) -> None:
        f = self.fixture
        f.instrument["decode"]["max_tokens"] = max_tokens
        f.instrument["label_parser"] = dict(intake.READ_LABEL_INSTRUMENT_PARSER)
        f.instrument_sha = intake.sha256_bytes(intake.canonical_json_bytes(f.instrument))
        template = dict(f.rows[0])
        f.rows = []
        for index, raw in enumerate(outputs, start=1):
            row = dict(template)
            row.update(
                schema=intake.ITEM_SCHEMA_PARSED_BY,
                sequence=index,
                item_id=f"gov-{index:03d}",
                instrument_sha256=f.instrument_sha,
                decode={"temperature": 0, "seed": 0, "max_tokens": max_tokens},
                raw_output=raw,
                raw_output_sha256=intake.sha256_bytes(raw.encode("utf-8")),
            )
            label, reason = intake.read_label_v1(raw, ["YES", "NO"])
            row.update(
                parsed_label=label,
                grade=(label == row["expected"]) if label is not None else False,
                label_parser="read-label-v1",
                parse_reason=reason,
                parse_confidence=None,
            )
            f.rows.append(row)
        f.rebuild()  # rebuild ignores parse_errors for read-label; fix up below
        self.finish(instrument_id, num_ctx)

    def finish(self, instrument_id: str | None, num_ctx: int | None) -> None:
        f = self.fixture
        parse_errors = sum(r["parsed_label"] is None for r in f.rows)
        correct = sum(r["grade"] is True for r in f.rows)
        n = len(f.rows) - parse_errors
        f.body["n"] = n
        f.body["accuracy"] = intake._expected_accuracy(correct, n) if n else None
        f.body["compute_evidence"]["parse_errors_excluded"] = parse_errors
        f.body["compute_evidence"]["label_parser"] = "read-label-v1"
        f.card["id"] = intake.sha256_bytes(intake.canonical_json_bytes(f.body))
        f.run["counts"].update(parse_errors_excluded=parse_errors, graded_n=n, correct=correct)
        f.run["label_parser"] = dict(intake.READ_LABEL_RUN_DESCRIPTOR)
        f.run.update(num_parallel=None, num_ctx=num_ctx, ollama_version="0.35.0")
        if instrument_id is not None:
            _, basis, sha = intake.PINNED_INSTRUMENTS[instrument_id]
            f.run.update(
                instrument_id=instrument_id,
                instrument_hash="sha256:" + sha,
                instrument_hash_basis=dict(basis),
            )
        f.write_card()

    def verify(self):
        return intake.verify_to_quarantine(
            self.fixture.source, self.fixture.allowlist, self.fixture.quarantine
        )

    def assert_rejects(self, code: str) -> None:
        with self.assertRaises(intake.IntakeError) as caught:
            self.verify()
        self.assertEqual(caught.exception.code, code)

    def test_read_label_run_verifies_and_rescores(self) -> None:
        _, verification = self.verify()
        self.assertEqual(verification["state"], "VERIFIED_QUARANTINE")
        self.assertEqual(self.fixture.body["n"], 1)  # the menu echo left n

    def test_parsed_label_tamper_is_rejected(self) -> None:
        row = self.fixture.rows[1]
        row.update(parsed_label="YES", grade=True, parse_reason="LAST_LINE")
        self.fixture.rebuild()
        self.finish(self.T2048, 3072)
        self.assert_rejects("GRADE_MISMATCH")

    def test_parse_reason_tamper_is_rejected(self) -> None:
        self.fixture.rows[1]["parse_reason"] = "NO_MATCH"
        self.fixture.rebuild()
        self.finish(self.T2048, 3072)
        self.assert_rejects("GRADE_MISMATCH")

    def test_parse_confidence_must_be_null(self) -> None:
        self.fixture.rows[0]["parse_confidence"] = 0.9
        self.fixture.rebuild()
        self.finish(self.T2048, 3072)
        self.assert_rejects("BAD_LABEL_PARSER")

    def test_count_tamper_is_rejected(self) -> None:
        self.fixture.run["counts"]["parse_errors_excluded"] = 0
        self.fixture.run["counts"]["graded_n"] = 2
        self.fixture.write_run()
        self.assert_rejects("COUNT_MISMATCH")

    def test_parser_off_allowlist_is_rejected(self) -> None:
        self.fixture.instrument["label_parser"] = {"id": "ollama-schema", "options": []}
        self.fixture.instrument_sha = intake.sha256_bytes(
            intake.canonical_json_bytes(self.fixture.instrument)
        )
        for row in self.fixture.rows:
            row["instrument_sha256"] = self.fixture.instrument_sha
        self.fixture.rebuild()
        self.finish(self.T2048, 3072)
        self.assert_rejects("BAD_LABEL_PARSER")

    def test_run_descriptor_must_name_pinned_reader(self) -> None:
        self.fixture.run["label_parser"]["rule"] = "something-looser"
        self.fixture.write_run()
        self.assert_rejects("BAD_LABEL_PARSER")

    def test_read_label_requires_instrument_id(self) -> None:
        for key in ("instrument_id", "instrument_hash", "instrument_hash_basis"):
            del self.fixture.run[key]
        self.fixture.write_run()
        self.assert_rejects("BAD_INSTRUMENT_ID")

    def test_unknown_instrument_id_is_rejected(self) -> None:
        self.fixture.run["instrument_id"] = "gspc-read-label-v1-t9999"
        self.fixture.write_run()
        self.assert_rejects("BAD_INSTRUMENT_ID")

    def test_basis_that_does_not_recompute_is_rejected(self) -> None:
        self.fixture.run["instrument_hash_basis"]["reader_commit"] = "0" * 40
        self.fixture.write_run()
        self.assert_rejects("INSTRUMENT_ID_MISMATCH")
        self.fixture.run["instrument_hash_basis"]["reader_commit"] = intake.READER_COMMIT
        self.fixture.run["instrument_hash"] = "sha256:" + "e" * 64
        self.fixture.write_run()
        self.assert_rejects("INSTRUMENT_ID_MISMATCH")

    def test_basis_max_tokens_must_match_decode(self) -> None:
        self.make_read_label(max_tokens=1024)
        self.assert_rejects("INSTRUMENT_ID_MISMATCH")

    def test_c8192_requires_num_ctx_8192(self) -> None:
        self.make_read_label(
            instrument_id="gspc-read-label-v1-t4096-c8192", max_tokens=4096, num_ctx=3072
        )
        self.assert_rejects("INSTRUMENT_ID_MISMATCH")
        self.make_read_label(
            instrument_id="gspc-read-label-v1-t4096-c8192", max_tokens=4096, num_ctx=8192
        )
        self.verify()

    def test_superseded_3072_instruments_are_rejected(self) -> None:
        for sha in intake.SUPERSEDED_INSTRUMENT_SHAS:
            self.fixture.run["instrument_hash"] = "sha256:" + sha
            self.fixture.write_run()
            self.assert_rejects("SUPERSEDED_INSTRUMENT")
        self.fixture.run["instrument_hash"] = "sha256:" + intake.PINNED_INSTRUMENTS[self.T2048][2]
        self.fixture.run["instrument_id"] = "gspc-read-label-v1-t4096"
        self.fixture.write_run()
        self.assert_rejects("SUPERSEDED_INSTRUMENT")

    def test_keyword_id_cannot_label_a_read_label_run(self) -> None:
        _, basis, sha = intake.PINNED_INSTRUMENTS["exact-keyword-t2048"]
        self.fixture.run.update(
            instrument_id="exact-keyword-t2048",
            instrument_hash="sha256:" + sha,
            instrument_hash_basis=dict(basis),
        )
        self.fixture.write_run()
        self.assert_rejects("INSTRUMENT_ID_MISMATCH")

    def test_card_must_name_the_reader(self) -> None:
        del self.fixture.body["compute_evidence"]["label_parser"]
        self.fixture.card["id"] = intake.sha256_bytes(
            intake.canonical_json_bytes(self.fixture.body)
        )
        self.fixture.write_card()
        self.assert_rejects("EVIDENCE_PIN_MISMATCH")

    def test_pinned_shas_recompute_from_their_bases(self) -> None:
        for _, basis, sha in intake.PINNED_INSTRUMENTS.values():
            self.assertEqual(intake.sha256_bytes(intake.canonical_json_bytes(basis)), sha)

    def test_staged_card_bytes_equal_the_worker_card(self) -> None:
        source_body = json.loads((self.fixture.source / "card-unsigned.json").read_text())["body"]
        self.verify()
        staged, _, problems = bridge.collect(self.fixture.quarantine)
        self.assertEqual(problems, [])
        out = self.root / "out"
        bridge.write(staged, out)
        (payload_file,) = out.iterdir()
        payload = json.loads(payload_file.read_text())
        self.assertEqual(
            intake.canonical_json_bytes(payload["body"]),
            intake.canonical_json_bytes(source_body),
        )
        self.assertNotIn("instrument_hash", payload_file.read_text())


class ExactLabelT128Tests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.fixture = Fixture(Path(self.temporary.name).resolve())

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def test_t128_id_requires_128_tokens(self) -> None:
        self.fixture.run["instrument_id"] = "exact-label-t128"
        self.fixture.write_run()
        with self.assertRaises(intake.IntakeError) as caught:
            intake.verify_to_quarantine(
                self.fixture.source, self.fixture.allowlist, self.fixture.quarantine
            )
        self.assertEqual(caught.exception.code, "BAD_INSTRUMENT_ID")

    def test_t128_id_verifies_at_128_tokens(self) -> None:
        f = self.fixture
        f.instrument["decode"]["max_tokens"] = 128
        f.instrument_sha = intake.sha256_bytes(intake.canonical_json_bytes(f.instrument))
        f.rows[0]["instrument_sha256"] = f.instrument_sha
        f.rows[0]["decode"]["max_tokens"] = 128
        f.rebuild()
        f.run["instrument_id"] = "exact-label-t128"
        f.write_run()
        intake.verify_to_quarantine(f.source, f.allowlist, f.quarantine)


class ReadLabelPortParityTests(unittest.TestCase):
    """The verifier's read-label-v1 must equal the harness reader, case by case."""

    def test_port_matches_harness_reader(self) -> None:
        sys.path.insert(0, str(HERE.parent))
        try:
            from harness.typed_output.deterministic import ReadLabelParser
        except ImportError:
            self.skipTest("harness not on path")
        parser = ReadLabelParser()
        label_sets = (["YES", "NO"], ["0", "1"], ["HIGH_RISK", "LIMITED_RISK", "MINIMAL_RISK", "PROHIBITED"], [])
        texts = (
            None, "", "  ", "YES", "yes", " Yes. ", "Answer: NO", "label - 1", "<think>YES</think>NO",
            "<THINK>a\nb</THINK>\n\nI think\nPROHIBITED", "YES | NO", "0 | 1", "Reply with: 0 or 1",
            "not PERMITTED, this is PROHIBITED", "**HIGH_RISK**", "high_risk", "The answer is YES",
            "YES\nNO", "NO\n\nYES.", "Output:`1`", "1/0", "MINIMAL_RISK vs HIGH_RISK", "\u2014 YES",
            "Answer:\nLIMITED_RISK", "(1)", "1\u20140",
        )
        for labels in label_sets:
            for text in texts:
                got = intake.read_label_v1(text, labels)
                want = parser.extract_label(text, labels)
                self.assertEqual(got, (want.label, want.reason), (text, labels))
