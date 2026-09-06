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
        parse_errors = sum(row["parsed_label"] is None for row in self.rows)
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
        self.assertEqual(
            json.loads((destination / "candidate.json").read_text())["signature"],
            None,
        )

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

    def test_relative_source_path_is_rejected(self) -> None:
        with self.assertRaises(intake.IntakeError) as caught:
            intake.verify_to_quarantine(
                Path(RUN_ID), self.fixture.allowlist, self.fixture.quarantine
            )
        self.assertEqual(caught.exception.code, "UNSAFE_PATH")


if __name__ == "__main__":
    unittest.main()
