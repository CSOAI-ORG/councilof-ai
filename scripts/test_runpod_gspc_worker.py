#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import http.server
import json
import os
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path
from unittest import mock

HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "runpod_gspc_worker", HERE / "runpod_gspc_worker.py"
)
assert SPEC and SPEC.loader
worker = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = worker
SPEC.loader.exec_module(worker)


GOOD_DIGEST = "sha256:" + "a" * 64


class FakeClient:
    def __init__(
        self, results: list[worker.InferenceResult], digest: str = GOOD_DIGEST
    ) -> None:
        self.results = list(results)
        self.digest = digest
        self.prompts: list[str] = []

    def model_manifest_digest(self, _model: str) -> str:
        return self.digest

    def generate(
        self, _model: str, prompt: str, _config: worker.WorkerConfig
    ) -> worker.InferenceResult:
        self.prompts.append(prompt)
        return self.results.pop(0)


class ChangingDigestClient(FakeClient):
    def __init__(self, results: list[worker.InferenceResult]) -> None:
        super().__init__(results)
        self.digest_reads = 0

    def model_manifest_digest(self, _model: str) -> str:
        self.digest_reads += 1
        return GOOD_DIGEST if self.digest_reads == 1 else "sha256:" + "b" * 64


class DiskUsage:
    def __init__(self, free: int) -> None:
        self.free = free


class WorkerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def write_config(
        self,
        rows: list[dict],
        *,
        labels: list[str] | None = None,
        expected_model_digest: str = GOOD_DIGEST,
        low_water: int = 100,
    ) -> tuple[worker.WorkerConfig, Path]:
        bank = self.root / "bank.jsonl"
        raw = "".join(json.dumps(row, sort_keys=True) + "\n" for row in rows)
        bank.write_text(raw, encoding="utf-8")
        output = self.root / "output"
        config_path = self.root / "config.json"
        config_path.write_text(
            json.dumps(
                {
                    "schema": worker.WORKER_SCHEMA,
                    "workspace_root": str(self.root),
                    "axis": "governance",
                    "model": "unit/model:1",
                    "bank": str(bank),
                    "expected_bank_sha256": worker.sha256_bytes(raw.encode()),
                    "output_dir": str(output),
                    "ollama_url": "http://127.0.0.1:11434",
                    "expected_model_manifest_digest": expected_model_digest,
                    "allowed_labels": labels or [],
                    "interval_seconds": 60,
                    "disk_low_water_bytes": low_water,
                    "request_timeout_seconds": 5,
                    "max_tokens": 16,
                    "seed": 0,
                    "temperature": 0,
                }
            ),
            encoding="utf-8",
        )
        return worker.WorkerConfig.load(config_path), output

    def test_exact_label_parser_rejects_prose_substrings_and_markdown(self) -> None:
        labels = ("YES", "NO")
        self.assertEqual(worker.parse_exact_label(" \nYES\t", labels), "YES")
        self.assertIsNone(worker.parse_exact_label("The answer is YES", labels))
        self.assertIsNone(worker.parse_exact_label("**YES**", labels))
        self.assertIsNone(worker.parse_exact_label("yes", labels))

    def test_keyword_match_uses_natural_prompt_and_requires_all_phrases(self) -> None:
        item = worker.BankItem(
            item_id="k1",
            prompt="Explain the control gap.",
            expected="KEYWORD_MATCH",
            predicate="KEYWORD_MATCH_ALL",
            required_keywords=("human oversight", "risk management"),
        )
        self.assertEqual(worker.compose_prompt(item, ()), item.prompt)
        self.assertTrue(
            worker.grade_keyword_match(
                "RISK   management needs documented human oversight.",
                item.required_keywords,
            )
        )
        self.assertFalse(
            worker.grade_keyword_match("Human oversight only.", item.required_keywords)
        )

    def test_transport_error_is_excluded_not_counted_wrong(self) -> None:
        config, output = self.write_config(
            [
                {"id": "a", "prompt": "Pick a label.", "expected": "YES"},
                {"id": "b", "prompt": "Pick another label.", "expected": "NO"},
            ],
            labels=["YES", "NO"],
        )
        fake = FakeClient(
            [
                worker.InferenceResult(
                    True, "YES", "1" * 64, None, response_model="unit/model:1"
                ),
                worker.InferenceResult(False, None, None, "OLLAMA_UNREACHABLE"),
            ]
        )
        health = worker.HealthSink(output / "health.json")
        outcome = worker.run_once(
            config,
            health,
            client=fake,
            disk_usage=lambda _path: DiskUsage(10_000),
        )
        self.assertEqual(outcome.exit_code, 3)
        self.assertEqual(outcome.transport_ok, 1)
        self.assertEqual(outcome.transport_errors, 1)
        run_dir = next((output / "runs").iterdir())
        self.assertFalse((run_dir / "card-unsigned.json").exists())
        card = json.loads((run_dir / "card-incomplete.json").read_text())
        self.assertEqual(card["body"]["n"], 1)
        self.assertEqual(card["body"]["accuracy"], 1)
        self.assertEqual(card["body"]["status"], "UNMEASURED")
        self.assertIsNone(card["signature"])
        rows = [
            json.loads(line)
            for line in (run_dir / "items.jsonl").read_text().splitlines()
        ]
        self.assertIsNone(rows[1]["grade"])
        self.assertFalse(rows[1]["transport_ok"])

    def test_keyword_bank_runs_without_teaching_expected_sentinel(self) -> None:
        config, output = self.write_config(
            [
                {
                    "id": "k1",
                    "prompt": "Explain the control gap.",
                    "expected": "KEYWORD_MATCH",
                    "must_inc": ["human oversight", "risk management"],
                }
            ]
        )
        fake = FakeClient(
            [
                worker.InferenceResult(
                    True,
                    "Human oversight and risk management.",
                    "2" * 64,
                    None,
                    response_model="unit/model:1",
                )
            ]
        )
        outcome = worker.run_once(
            config,
            worker.HealthSink(output / "health.json"),
            client=fake,
            disk_usage=lambda _path: DiskUsage(10_000),
        )
        self.assertEqual(outcome.exit_code, 0)
        self.assertNotIn("KEYWORD_MATCH", fake.prompts[0])
        self.assertEqual(outcome.correct, 1)

    def test_model_digest_mismatch_halts_before_inference(self) -> None:
        config, output = self.write_config(
            [{"id": "a", "prompt": "Pick.", "expected": "YES"}], labels=["YES", "NO"]
        )
        fake = FakeClient([], digest="sha256:" + "b" * 64)
        outcome = worker.run_once(
            config,
            worker.HealthSink(output / "health.json"),
            client=fake,
            disk_usage=lambda _path: DiskUsage(10_000),
        )
        self.assertEqual(outcome.detail_code, "MODEL_DIGEST_MISMATCH")
        self.assertFalse((output / "runs").exists())
        self.assertEqual(fake.prompts, [])

    def test_model_digest_change_during_run_is_non_landable(self) -> None:
        config, output = self.write_config(
            [{"id": "a", "prompt": "Pick.", "expected": "YES"}],
            labels=["YES", "NO"],
        )
        fake = ChangingDigestClient(
            [
                worker.InferenceResult(
                    True, "YES", "4" * 64, None, response_model="unit/model:1"
                )
            ]
        )
        outcome = worker.run_once(
            config,
            worker.HealthSink(output / "health.json"),
            client=fake,
            disk_usage=lambda _path: DiskUsage(10_000),
        )
        self.assertEqual(outcome.detail_code, "MODEL_DIGEST_CHANGED_DURING_RUN")
        self.assertEqual(outcome.exit_code, 2)
        run_dir = next((output / "runs").iterdir())
        self.assertFalse((run_dir / "card-unsigned.json").exists())
        self.assertTrue((run_dir / "card-incomplete.json").exists())

    def test_response_model_substitution_makes_run_non_landable(self) -> None:
        config, output = self.write_config(
            [{"id": "a", "prompt": "Pick.", "expected": "YES"}],
            labels=["YES", "NO"],
        )
        fake = FakeClient(
            [
                worker.InferenceResult(
                    True,
                    "YES",
                    "4" * 64,
                    None,
                    response_model="other/model:1",
                )
            ]
        )
        outcome = worker.run_once(
            config,
            worker.HealthSink(output / "health.json"),
            client=fake,
            disk_usage=lambda _path: DiskUsage(10_000),
        )
        self.assertEqual(outcome.exit_code, 3)
        run_dir = next((output / "runs").iterdir())
        self.assertFalse((run_dir / "card-unsigned.json").exists())
        self.assertTrue((run_dir / "card-incomplete.json").exists())
        row = json.loads((run_dir / "items.jsonl").read_text().strip())
        self.assertEqual(row["transport_error_code"], "OLLAMA_MODEL_MISMATCH")
        self.assertIsNone(row["grade"])

    def test_playlist_rotates_valid_jobs_and_quarantines_bad_config(self) -> None:
        config_dir = self.root / "jobs"
        state_dir = self.root / "state"
        config_dir.mkdir()
        (config_dir / "00-invalid.json").write_text(
            json.dumps({"api_key": "must-not-leak"}), encoding="utf-8"
        )

        def write_job(name: str, model: str) -> Path:
            bank = self.root / f"{name}-bank.jsonl"
            bank_raw = (
                json.dumps(
                    {"id": name, "prompt": f"Prompt {name}", "expected": "YES"},
                    sort_keys=True,
                )
                + "\n"
            )
            bank.write_text(bank_raw, encoding="utf-8")
            output = self.root / f"{name}-output"
            (config_dir / f"{name}.json").write_text(
                json.dumps(
                    {
                        "schema": worker.WORKER_SCHEMA,
                        "workspace_root": str(self.root),
                        "axis": name,
                        "model": model,
                        "bank": str(bank),
                        "expected_bank_sha256": worker.sha256_bytes(bank_raw.encode()),
                        "output_dir": str(output),
                        "ollama_url": "http://127.0.0.1:11434",
                        "expected_model_manifest_digest": GOOD_DIGEST,
                        "allowed_labels": ["YES", "NO"],
                        "interval_seconds": 60,
                        "disk_low_water_bytes": 100,
                        "request_timeout_seconds": 5,
                        "max_tokens": 16,
                        "seed": 0,
                        "temperature": 0,
                    }
                ),
                encoding="utf-8",
            )
            return output

        first_output = write_job("governance", "unit/first:1")
        second_output = write_job("safety", "unit/second:1")
        order: list[str] = []

        def client_factory(config: worker.WorkerConfig) -> FakeClient:
            order.append(config.model)
            return FakeClient(
                [
                    worker.InferenceResult(
                        True,
                        "YES",
                        "5" * 64,
                        None,
                        response_model=config.model,
                    )
                ]
            )

        health = worker.HealthSink(state_dir / "health.json")
        exit_code = worker.run_playlist(
            config_dir,
            state_dir,
            health,
            forever=False,
            stop_event=threading.Event(),
            client_factory=client_factory,
            disk_usage=lambda _path: DiskUsage(10_000),
        )
        self.assertEqual(exit_code, 2)
        self.assertEqual(order, ["unit/first:1", "unit/second:1"])
        self.assertEqual(
            len(list((first_output / "runs").glob("*/card-unsigned.json"))), 1
        )
        self.assertEqual(
            len(list((second_output / "runs").glob("*/card-unsigned.json"))), 1
        )
        quarantine = list((state_dir / "quarantine").glob("*.json"))
        self.assertEqual(len(quarantine), 1)
        self.assertNotIn("must-not-leak", quarantine[0].read_text())
        public = worker.sanitized_health(health.read())
        self.assertEqual(public["jobs_total"], 2)
        self.assertEqual(public["invalid_config_count"], 1)

    def test_low_disk_halts_before_bank_or_transport(self) -> None:
        config, output = self.write_config(
            [{"id": "a", "prompt": "Pick.", "expected": "YES"}],
            labels=["YES", "NO"],
            low_water=500,
        )
        fake = FakeClient([])
        outcome = worker.run_once(
            config,
            worker.HealthSink(output / "health.json"),
            client=fake,
            disk_usage=lambda _path: DiskUsage(400),
        )
        self.assertEqual(outcome.exit_code, 75)
        self.assertEqual(outcome.detail_code, "DISK_LOW_WATER")
        self.assertEqual(fake.prompts, [])

    def test_candidate_is_canonical_small_unsigned_and_evidence_is_pinned(self) -> None:
        config, output = self.write_config(
            [{"id": "a", "prompt": "Pick.", "expected": "NO"}], labels=["YES", "NO"]
        )
        fake = FakeClient(
            [
                worker.InferenceResult(
                    True, "NO", "3" * 64, None, response_model="unit/model:1"
                )
            ]
        )
        outcome = worker.run_once(
            config,
            worker.HealthSink(output / "health.json"),
            client=fake,
            disk_usage=lambda _path: DiskUsage(10_000),
        )
        self.assertEqual(outcome.exit_code, 0)
        run_dir = next((output / "runs").iterdir())
        raw_card = (run_dir / "card-unsigned.json").read_bytes().rstrip(b"\n")
        card = json.loads(raw_card)
        self.assertEqual(raw_card, worker.canonical_json_bytes(card))
        self.assertLessEqual(len(raw_card), worker.MAX_CARD_BYTES)
        self.assertEqual(
            card["id"], worker.sha256_bytes(worker.canonical_json_bytes(card["body"]))
        )
        self.assertEqual(
            card["body"]["compute_evidence"]["model_manifest_digest"], GOOD_DIGEST
        )
        run = json.loads((run_dir / "run.json").read_text())
        self.assertEqual(
            card["body"]["compute_evidence"]["instrument_sha256"],
            run["instrument_sha256"],
        )
        self.assertEqual(
            run["items_sha256"], worker.sha256_file(run_dir / "items.jsonl")
        )
        self.assertTrue(run["compute_only"])
        self.assertIsNone(run["signature"])

    def test_unsupported_predicate_is_rejected(self) -> None:
        config, _output = self.write_config(
            [{"id": "a", "prompt": "Pick.", "expected": "REGEX", "regex": "yes"}],
            labels=["YES", "NO"],
        )
        with self.assertRaises(worker.WorkerError) as caught:
            worker.load_frozen_bank(config)
        self.assertEqual(caught.exception.code, "UNSUPPORTED_PREDICATE")

    def test_loopback_client_ignores_proxy_environment(self) -> None:
        digest = "sha256:" + "c" * 64

        class Handler(http.server.BaseHTTPRequestHandler):
            def do_GET(self) -> None:  # noqa: N802
                payload = json.dumps(
                    {"models": [{"name": "unit/model:1", "digest": digest}]}
                ).encode()
                self.send_response(200)
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)

            def log_message(self, _format: str, *_args: object) -> None:
                return

        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with mock.patch.dict(
                os.environ,
                {"HTTP_PROXY": "http://127.0.0.1:9", "NO_PROXY": ""},
                clear=False,
            ):
                client = worker.OllamaClient(
                    f"http://127.0.0.1:{server.server_address[1]}"
                )
                self.assertEqual(client.model_manifest_digest("unit/model:1"), digest)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)

    def test_read_only_health_endpoint_is_sanitized(self) -> None:
        output = self.root / "health-out"
        sink = worker.HealthSink(output / "health.json")
        sink.update(
            state="IDLE",
            model="unit/model",
            output_dir="/secret/path",
            bank="/private/bank",
            detail_code="COMPLETE_UNSIGNED",
        )
        server = worker.ReadOnlyHealthServer(sink, "127.0.0.1", 0)
        server.start()
        try:
            with urllib.request.urlopen(
                f"http://127.0.0.1:{server.port}/health", timeout=2
            ) as response:
                payload = json.loads(response.read())
                self.assertEqual(response.status, 200)
            self.assertEqual(payload["state"], "IDLE")
            self.assertNotIn("output_dir", payload)
            self.assertNotIn("bank", payload)
            request = urllib.request.Request(
                f"http://127.0.0.1:{server.port}/health", data=b"{}", method="POST"
            )
            with self.assertRaises(urllib.error.HTTPError) as caught:
                urllib.request.urlopen(request, timeout=2)
            self.assertEqual(caught.exception.code, 405)
            caught.exception.close()
        finally:
            server.close()

    def test_lock_rejects_second_instance(self) -> None:
        lock = self.root / "worker.lock"
        with worker.single_instance(lock):
            with self.assertRaises(worker.AlreadyRunning):
                with worker.single_instance(lock):
                    pass


if __name__ == "__main__":
    unittest.main()
