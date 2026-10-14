#!/usr/bin/env python3
"""Offline tests for anthropic_gspc_worker.py. No network, no key."""
from __future__ import annotations

import json
import os
import sys
import tempfile
import concurrent.futures
import threading
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import anthropic_gspc_worker as aw  # noqa: E402

LABEL_BANK = [
    {"id": "a1", "text": "Scenario one", "expected": "PERMITTED"},
    {"id": "a2", "text": "Scenario two", "expected": "PROHIBITED"},
    {"id": "a3", "text": "Scenario three", "expected": "PROHIBITED"},
]
KEYWORD_BANK = [
    {"id": "k1", "prompt": "Name two colours", "expected": "KEYWORD_MATCH", "must_inc": ["red", "blue"]},
    {"id": "k2", "prompt": "Name a fruit", "expected": "KEYWORD_MATCH", "must_inc": ["apple"]},
]


def write_bank(directory: Path, name: str, rows: list[dict]) -> tuple[Path, str]:
    path = directory / name
    path.write_text("".join(json.dumps(row) + "\n" for row in rows), encoding="utf-8")
    return path, aw.sha256_file(path)


def response(text: str, *, stop: str = "end_turn", model: str = "claude-haiku-5-5", details=None) -> bytes:
    return json.dumps({
        "id": "msg_x", "type": "message", "role": "assistant", "model": model,
        "content": [{"type": "thinking", "thinking": "(not graded)"}, {"type": "text", "text": text}],
        "stop_reason": stop, "stop_details": details,
        "usage": {"input_tokens": 40, "output_tokens": 3},
    }).encode()


class ScriptedTransport:
    """Pops one scripted (status, headers, body) per /v1/messages call; models API is static."""

    def __init__(self, replies: list[tuple[int, dict, bytes]], model: str = "claude-haiku-5-5", record_versions=None) -> None:
        self.replies = list(replies)
        self.model = model
        self.record_versions = list(record_versions or [{"id": model, "type": "model", "display_name": "x"}])
        self.bodies: list[dict] = []
        self.headers_seen: list[dict] = []

    def __call__(self, method, url, headers, body, timeout):
        self.headers_seen.append(headers)
        if url.endswith(f"/v1/models/{self.model}"):
            record = self.record_versions[0] if len(self.record_versions) == 1 else self.record_versions.pop(0)
            return 200, {}, json.dumps(record).encode()
        self.bodies.append(json.loads(body))
        return self.replies.pop(0)


class WorkerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.banks = self.root / "banks"
        self.banks.mkdir()
        self.out = self.root / "out"
        _, self.label_sha = write_bank(self.banks, "gspc-art5.jsonl", LABEL_BANK)
        _, self.kw_sha = write_bank(self.banks, "gspc-swarm.jsonl", KEYWORD_BANK)
        self.allowlist = {"art5-safeguard": [self.label_sha], "swarm": [self.kw_sha]}

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def job(self, axis: str, model: str = "claude-haiku-5-5") -> aw.AnthropicJob:
        jobs = aw.plan_jobs(
            model=model, axes=[axis], banks_dir=self.banks, allowlist=self.allowlist, output_dir=self.out,
            effort="low", max_tokens_label=2048, max_tokens_keyword=1024, request_timeout_seconds=30,
        )
        return jobs[0]

    def client(self, transport) -> aw.AnthropicClient:
        return aw.AnthropicClient("test-key-not-real", transport=transport, sleep=lambda _s: None)

    def go(self, job, transport, budget=50.0):
        return aw.run_job(job, self.client(transport), budget=aw.BudgetGuard(job.model, budget, 0.01),
                          concurrency=1, log=lambda _m: None)

    def run_dir(self, manifest) -> Path:
        return self.out / "runs" / manifest["run_id"]

    def test_plan_derives_labels_and_instrument_from_bank(self) -> None:
        job = self.job("art5-safeguard")
        self.assertEqual(job.allowed_labels, ("PERMITTED", "PROHIBITED"))
        self.assertEqual(job.max_tokens, 2048)
        self.assertEqual(self.job("swarm").max_tokens, 1024)
        self.assertEqual(self.job("swarm").allowed_labels, ())

    def test_request_shape_per_model(self) -> None:
        self.assertNotIn("thinking", self.job("art5-safeguard", "claude-opus-5-5").request_shape())
        self.assertNotIn("thinking", self.job("art5-safeguard", "claude-fable-5-1").request_shape())
        self.assertEqual(self.job("art5-safeguard", "claude-sonnet-5-5").request_shape()["thinking"], {"type": "between_tools"})
        self.assertEqual(self.job("art5-safeguard", "claude-haiku-5-5").request_shape()["thinking"], {"type": "disabled"})
        for model in aw.THINKING_BY_MODEL:
            shape = self.job("art5-safeguard", model).request_shape()
            self.assertNotIn("temperature", shape)
            self.assertEqual(shape["output_config"], {"effort": "low"})

    def test_unknown_model_and_missing_bank_halt(self) -> None:
        with self.assertRaises(aw.WorkerError):
            aw.plan_jobs(model="claude-imaginary", axes=["art5-safeguard"], banks_dir=self.banks,
                         allowlist=self.allowlist, output_dir=self.out, effort="low",
                         max_tokens_label=8, max_tokens_keyword=8, request_timeout_seconds=1)
        with self.assertRaises(aw.WorkerError) as caught:
            aw.plan_jobs(model="claude-haiku-5-5", axes=["art5-safeguard"], banks_dir=self.banks,
                         allowlist={"art5-safeguard": ["0" * 64]}, output_dir=self.out, effort="low",
                         max_tokens_label=8, max_tokens_keyword=8, request_timeout_seconds=1)
        self.assertEqual(caught.exception.code, "BANK_NOT_FOUND")

    def test_complete_label_run_grades_and_stages_unsigned_card(self) -> None:
        transport = ScriptedTransport([(200, {}, response("PERMITTED")), (200, {}, response("PROHIBITED")),
                                       (200, {}, response("PERMITTED"))])
        manifest = self.go(self.job("art5-safeguard"), transport)
        self.assertTrue(manifest["landable_candidate"])
        self.assertEqual(manifest["counts"]["graded_n"], 3)
        self.assertEqual(manifest["counts"]["correct"], 2)
        card = json.loads((self.run_dir(manifest) / "card-unsigned.json").read_text())
        self.assertIsNone(card["signature"])
        self.assertEqual(card["body"]["status"], "UNMEASURED")
        self.assertEqual(card["body"]["unmeasured"], [aw.UNSIGNED_REASON])
        self.assertRegex(card["body"]["model"], r"^anthropic-api:claude-haiku-5-5@sha256:[0-9a-f]{64}$")
        self.assertEqual(card["body"]["accuracy"], 0.6667)
        self.assertLessEqual(len(aw.canonical_json_bytes(card)), aw.MAX_CARD_BYTES)
        self.assertEqual(card["id"], aw.sha256_bytes(aw.canonical_json_bytes(card["body"])))
        rows = [json.loads(line) for line in (self.run_dir(manifest) / "items.jsonl").read_text().splitlines()]
        self.assertEqual([row["sequence"] for row in rows], [1, 2, 3])
        self.assertTrue(all("(not graded)" not in json.dumps(row) for row in rows), "thinking text must never be stored")
        self.assertEqual(manifest["items_sha256"], aw.sha256_file(self.run_dir(manifest) / "items.jsonl"))
        sent = transport.bodies[0]
        self.assertEqual(sent["thinking"], {"type": "disabled"})
        self.assertTrue(sent["messages"][0]["content"].endswith("Reply with exactly one label and no other text: PERMITTED | PROHIBITED"))

    def test_refusal_is_excluded_not_wrong(self) -> None:
        transport = ScriptedTransport([(200, {}, response("", stop="refusal", details={"category": "x"})),
                                       (200, {}, response("PROHIBITED")), (200, {}, response("PROHIBITED"))])
        manifest = self.go(self.job("art5-safeguard"), transport)
        self.assertEqual(manifest["counts"]["parse_errors_excluded"], 1)
        self.assertEqual(manifest["counts"]["graded_n"], 2)
        self.assertEqual(manifest["counts"]["correct"], 2)
        self.assertEqual(manifest["stop_reason_counts"], {"end_turn": 2, "refusal": 1})

    def test_keyword_cut_off_by_max_tokens_leaves_n(self) -> None:
        transport = ScriptedTransport([(200, {}, response("red and", stop="max_tokens")), (200, {}, response("An apple"))])
        manifest = self.go(self.job("swarm"), transport)
        self.assertEqual(manifest["counts"]["graded_n"], 1)
        self.assertEqual(manifest["counts"]["correct"], 1)

    def test_retry_on_429_then_success(self) -> None:
        transport = ScriptedTransport([(429, {"retry-after": "1"}, b"{}"), (200, {}, response("PERMITTED")),
                                       (200, {}, response("PROHIBITED")), (200, {}, response("PROHIBITED"))])
        manifest = self.go(self.job("art5-safeguard"), transport)
        self.assertTrue(manifest["landable_candidate"])
        rows = [json.loads(line) for line in (self.run_dir(manifest) / "items.jsonl").read_text().splitlines()]
        self.assertEqual(rows[0]["attempts"], 2)

    def test_non_retryable_error_is_transport_and_not_landable(self) -> None:
        transport = ScriptedTransport([(400, {}, b'{"error":{}}'), (200, {}, response("PROHIBITED")), (200, {}, response("PROHIBITED"))])
        manifest = self.go(self.job("art5-safeguard"), transport)
        self.assertFalse(manifest["landable_candidate"])
        self.assertEqual(manifest["counts"]["transport_errors_excluded"], 1)
        self.assertTrue((self.run_dir(manifest) / "card-incomplete.json").exists())

    def test_substituted_model_is_never_graded(self) -> None:
        transport = ScriptedTransport([(200, {}, response("PERMITTED", model="claude-other")),
                                       (200, {}, response("PROHIBITED")), (200, {}, response("PROHIBITED"))])
        manifest = self.go(self.job("art5-safeguard"), transport)
        self.assertEqual(manifest["counts"]["transport_errors_excluded"], 1)
        self.assertFalse(manifest["landable_candidate"])

    def test_model_record_change_during_run_rejects(self) -> None:
        records = [{"id": "claude-haiku-5-5", "type": "model", "v": 1}, {"id": "claude-haiku-5-5", "type": "model", "v": 2}]
        transport = ScriptedTransport([(200, {}, response("PERMITTED"))] * 3, record_versions=records)
        manifest = self.go(self.job("art5-safeguard"), transport)
        self.assertEqual(manifest["detail_code"], "MODEL_RECORD_CHANGED_DURING_RUN")
        self.assertFalse(manifest["landable_candidate"])

    def test_budget_cap_halts(self) -> None:
        transport = ScriptedTransport([(200, {}, response("PERMITTED"))] * 3)
        manifest = self.go(self.job("art5-safeguard"), transport, budget=0.0)
        self.assertEqual(manifest["detail_code"], "BUDGET_CAP")
        self.assertFalse(manifest["landable_candidate"])
        self.assertEqual(transport.bodies, [], "no request may be sent once the cap is reached")

    def test_dry_run_is_never_landable(self) -> None:
        manifest = aw.run_job(self.job("art5-safeguard"), aw.DryRunClient(), budget=aw.BudgetGuard("claude-haiku-5-5", 1.0),
                              dry_run=True, log=lambda _m: None)
        self.assertFalse(manifest["landable_candidate"])
        self.assertEqual(manifest["detail_code"], "DRY_RUN")
        self.assertTrue(manifest["instrument"]["dry_run"])

    def test_key_file_must_be_private(self) -> None:
        key = self.root / "key"
        key.write_text("k\n")
        os.chmod(key, 0o644)
        with self.assertRaises(aw.WorkerError):
            aw.read_api_key(str(key))
        os.chmod(key, 0o600)
        self.assertEqual(aw.read_api_key(str(key)), "k")

    def test_key_is_sent_only_as_header(self) -> None:
        transport = ScriptedTransport([(200, {}, response("PERMITTED"))] * 3)
        manifest = self.go(self.job("art5-safeguard"), transport)
        evidence = "".join(path.read_text() for path in self.run_dir(manifest).iterdir())
        self.assertNotIn("test-key-not-real", evidence)
        self.assertEqual(transport.headers_seen[0]["x-api-key"], "test-key-not-real")


    def test_terminal_states_precede_exact_label_grading(self) -> None:
        for stop in ("refusal", "max_tokens", "model_context_window_exceeded"):
            with self.subTest(stop=stop):
                transport = ScriptedTransport([(200, {}, response("PERMITTED", stop=stop)),
                                               (200, {}, response("PROHIBITED")),
                                               (200, {}, response("PROHIBITED"))])
                manifest = self.go(self.job("art5-safeguard"), transport)
                self.assertEqual(manifest["counts"]["graded_n"], 2)
                self.assertEqual(manifest["counts"]["correct"], 2)
                self.assertEqual(manifest["counts"]["parse_errors_excluded"], 1)
                rows = [json.loads(s) for s in (self.run_dir(manifest) / "items.jsonl").read_text().splitlines()]
                self.assertIsNone(rows[0]["parsed_label"])
                self.assertIsNone(rows[0]["grade"])
                self.assertEqual(rows[0]["raw_output"], "PERMITTED")
                card = json.loads((self.run_dir(manifest) / manifest["candidate_file"]).read_text())
                self.assertEqual((card["body"]["n"], card["body"]["accuracy"]), (2, 1))

    def test_terminal_states_precede_keyword_grading(self) -> None:
        for stop in ("refusal", "max_tokens", "model_context_window_exceeded"):
            with self.subTest(stop=stop):
                transport = ScriptedTransport([(200, {}, response("red blue", stop=stop)),
                                               (200, {}, response("apple"))])
                manifest = self.go(self.job("swarm"), transport)
                self.assertEqual(manifest["counts"]["graded_n"], 1)
                self.assertEqual(manifest["counts"]["correct"], 1)
                card = json.loads((self.run_dir(manifest) / manifest["candidate_file"]).read_text())
                self.assertEqual((card["body"]["n"], card["body"]["accuracy"]), (1, 1))

    def test_missing_null_empty_model_is_never_attributed(self) -> None:
        for missing in ("absent", None, ""):
            with self.subTest(model=missing):
                payload = json.loads(response("PERMITTED"))
                if missing == "absent":
                    del payload["model"]
                else:
                    payload["model"] = missing
                transport = ScriptedTransport([(200, {}, json.dumps(payload).encode()),
                                               (200, {}, response("PROHIBITED")),
                                               (200, {}, response("PROHIBITED"))])
                manifest = self.go(self.job("art5-safeguard"), transport)
                self.assertEqual(manifest["counts"]["transport_errors_excluded"], 1)
                self.assertEqual(manifest["counts"]["graded_n"], 2)
                self.assertFalse(manifest["landable_candidate"])
                first = json.loads((self.run_dir(manifest) / "items.jsonl").read_text().splitlines()[0])
                self.assertEqual(first["transport_error_code"], "API_MODEL_MISMATCH")
                self.assertIsNone(first["grade"])

    def test_atomic_reservations_bound_four_contenders(self) -> None:
        budget = aw.BudgetGuard("claude-haiku-5-5", 2, 1)
        barrier = threading.Barrier(4)
        def contender():
            barrier.wait(timeout=5)
            return budget.reserve()
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            tickets = list(pool.map(lambda _: contender(), range(4)))
        self.assertEqual(sum(t is not None for t in tickets), 2)
        self.assertEqual(budget.committed_usd, 2)

    def test_run_job_reserves_before_concurrent_transport(self) -> None:
        denied = threading.Event()
        class ObservedBudget(aw.BudgetGuard):
            def reserve(self):
                ticket = super().reserve()
                if ticket is None:
                    denied.set()
                return ticket
        class BlockingTransport(ScriptedTransport):
            def __call__(self, method, url, headers, body, timeout):
                if method == "POST":
                    if not denied.wait(timeout=5):
                        raise AssertionError("third contender never reached the reservation guard")
                return super().__call__(method, url, headers, body, timeout)
        transport = BlockingTransport([(200, {}, response("PERMITTED"))] * 3)
        budget = ObservedBudget("claude-haiku-5-5", 2, 1)
        manifest = aw.run_job(self.job("art5-safeguard"), self.client(transport),
                              budget=budget, concurrency=3, log=lambda _: None)
        self.assertEqual(len(transport.bodies), 2)
        self.assertEqual(manifest["detail_code"], "BUDGET_CAP")
        self.assertFalse(manifest["landable_candidate"])
        self.assertLessEqual(budget.committed_usd, 2)

    def test_insufficient_remaining_budget_sends_nothing(self) -> None:
        transport = ScriptedTransport([(200, {}, response("PERMITTED"))] * 3)
        manifest = aw.run_job(self.job("art5-safeguard"), self.client(transport),
                              budget=aw.BudgetGuard("claude-haiku-5-5", 0.005, 0.01),
                              concurrency=1, log=lambda _: None)
        self.assertEqual(transport.bodies, [])
        self.assertEqual(manifest["detail_code"], "BUDGET_CAP")

    def test_missing_request_bound_sends_nothing(self) -> None:
        transport = ScriptedTransport([(200, {}, response("PERMITTED"))] * 3)
        manifest = aw.run_job(self.job("art5-safeguard"), self.client(transport),
                              budget=aw.BudgetGuard("claude-haiku-5-5", 1),
                              concurrency=1, log=lambda _: None)
        self.assertEqual(transport.bodies, [])
        self.assertEqual(manifest["detail_code"], "BUDGET_BOUND_REQUIRED")

    def test_retry_requires_another_full_reservation(self) -> None:
        transport = ScriptedTransport([(429, {}, b"{}"), (200, {}, response("PERMITTED"))])
        budget = aw.BudgetGuard("claude-haiku-5-5", 0.01, 0.01)
        manifest = aw.run_job(self.job("art5-safeguard"), self.client(transport),
                              budget=budget, concurrency=1, log=lambda _: None)
        self.assertEqual(len(transport.bodies), 1)
        self.assertEqual(budget.committed_usd, 0.01)
        self.assertEqual(budget.spent_usd, 0)
        self.assertEqual(manifest["detail_code"], "BUDGET_CAP")
        self.assertFalse(manifest["landable_candidate"])

    def test_timeout_retains_bound_instead_of_zero_charge(self) -> None:
        class TimeoutTransport(ScriptedTransport):
            def __call__(self, method, url, headers, body, timeout):
                if method == "POST":
                    self.bodies.append(json.loads(body))
                    raise TimeoutError
                return super().__call__(method, url, headers, body, timeout)
        transport = TimeoutTransport([])
        budget = aw.BudgetGuard("claude-haiku-5-5", 0.02, 0.01)
        manifest = aw.run_job(self.job("art5-safeguard"), self.client(transport),
                              budget=budget, concurrency=1, log=lambda _: None)
        self.assertEqual(len(transport.bodies), 2)
        self.assertEqual(budget.committed_usd, 0.02)
        self.assertEqual(manifest["detail_code"], "BUDGET_CAP")

    def test_missing_or_invalid_usage_stops_further_sends(self) -> None:
        for usage in (None, {}, {"input_tokens": -1, "output_tokens": 3},
                      {"input_tokens": True, "output_tokens": 3},
                      {"input_tokens": 40.5, "output_tokens": 3}):
            with self.subTest(usage=usage):
                payload = json.loads(response("PERMITTED"))
                payload["usage"] = usage
                transport = ScriptedTransport([(200, {}, json.dumps(payload).encode())] * 3)
                budget = aw.BudgetGuard("claude-haiku-5-5", 1, 0.01)
                manifest = aw.run_job(self.job("art5-safeguard"), self.client(transport),
                                      budget=budget, concurrency=1, log=lambda _: None)
                self.assertEqual(len(transport.bodies), 1)
                self.assertEqual(budget.committed_usd, 0.01)
                self.assertEqual(manifest["detail_code"], "BUDGET_USAGE_UNKNOWN")
                self.assertEqual(manifest["counts"]["graded_n"], 0)
                self.assertFalse(manifest["landable_candidate"])

    def test_exceeded_operator_bound_halts_and_remains_unlandable(self) -> None:
        transport = ScriptedTransport([(200, {}, response("PERMITTED"))] * 3)
        budget = aw.BudgetGuard("claude-haiku-5-5", 1, 0.000001)
        manifest = aw.run_job(self.job("art5-safeguard"), self.client(transport),
                              budget=budget, concurrency=1, log=lambda _: None)
        self.assertEqual(len(transport.bodies), 1)
        self.assertEqual(manifest["detail_code"], "BUDGET_BOUND_EXCEEDED")
        self.assertFalse(manifest["landable_candidate"])
        self.assertGreater(budget.spent_usd, 0.000001)

    def test_valid_usage_releases_only_unused_reservation(self) -> None:
        budget = aw.BudgetGuard("claude-haiku-5-5", 0.02, 0.01)
        first, second = budget.reserve(), budget.reserve()
        self.assertIsNone(budget.reserve())
        self.assertIsNone(budget.reconcile(first, response("PERMITTED")))
        self.assertAlmostEqual(budget.spent_usd, 0.0000055)
        self.assertAlmostEqual(budget.committed_usd, 0.0100055)
        self.assertIsNone(budget.reserve(), "second reservation must remain charged")
        budget.retain(second)
        self.assertAlmostEqual(budget.committed_usd, 0.0100055)

    def test_nonfinite_negative_and_zero_bound_configs_refused(self) -> None:
        for cap, bound in ((float("nan"), 1), (float("inf"), 1), (-1, 1),
                           (1, float("nan")), (1, float("inf")), (1, 0), (1, -1)):
            with self.subTest(cap=cap, bound=bound), self.assertRaises(aw.WorkerError) as caught:
                aw.BudgetGuard("claude-haiku-5-5", cap, bound)
            self.assertEqual(caught.exception.code, "BUDGET_CONFIG")

    def test_models_have_separate_explicit_budgets(self) -> None:
        a = aw.BudgetGuard("claude-haiku-5-5", 1, 1)
        b = aw.BudgetGuard("claude-sonnet-5-5", 1, 1)
        self.assertIsNotNone(a.reserve())
        self.assertIsNotNone(b.reserve())
        self.assertIsNone(a.reserve())
        self.assertIsNone(b.reserve())


if __name__ == "__main__":
    unittest.main()
