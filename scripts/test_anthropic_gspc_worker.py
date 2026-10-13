#!/usr/bin/env python3
"""Offline tests for anthropic_gspc_worker.py. No network, no key."""
from __future__ import annotations

import json
import os
import sys
import tempfile
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
        return aw.run_job(job, self.client(transport), budget=aw.BudgetGuard(job.model, budget),
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


if __name__ == "__main__":
    unittest.main()
