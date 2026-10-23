#!/usr/bin/env python3
"""Tests for the silent-route canary harness (G3.6). Plain python, no network.

Asserts: config validity, digest determinism, drift fires on change and stays
silent on identical digests, the UNAVAILABLE path when no credential exists,
THIN labelling on every artifact row, and the doctrine lock: nothing under
scripts/canary touches signing or publisher code.
"""
import io
import json
import os
import sys
import tempfile
import unittest
import urllib.error
from contextlib import nullcontext, redirect_stderr, redirect_stdout
from unittest import mock

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import canary_run  # noqa: E402


class CanaryTest(unittest.TestCase):
    def setUp(self):
        # Never inspect retained provider artifacts or call real endpoints.
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        for name, value in (
            ("BASELINE_PATH", os.path.join(tmp.name, "baseline.jsonl")),
            ("DRIFT_PATH", os.path.join(tmp.name, "drift.jsonl")),
        ):
            patcher = mock.patch.object(canary_run, name, value)
            patcher.start()
            self.addCleanup(patcher.stop)
        network = mock.patch.object(canary_run.urllib.request, "urlopen",
                                    side_effect=AssertionError("unexpected network access"))
        network.start()
        self.addCleanup(network.stop)

    def test_config_valid(self):
        cfg = canary_run.load_config()
        self.assertGreaterEqual(len(cfg["endpoints"]), 5)
        self.assertGreaterEqual(len(cfg["prompts"]), 3)
        ids = [e["id"] for e in cfg["endpoints"]]
        self.assertEqual(len(ids), len(set(ids)), "endpoint ids must be unique")
        self.assertIn("deepseek", ids)

    def test_digest_determinism_and_sensitivity(self):
        h = {"a": canary_run.sha256_hex("x"), "b": canary_run.sha256_hex("y")}
        self.assertEqual(canary_run.daily_digest(h), canary_run.daily_digest(dict(reversed(list(h.items())))))
        h2 = dict(h)
        h2["b"] = canary_run.sha256_hex("z")
        self.assertNotEqual(canary_run.daily_digest(h), canary_run.daily_digest(h2))

    def test_unavailable_when_credential_absent(self):
        endpoint = {"id": "nope", "env_key": "CANARY_TEST_DEFINITELY_UNSET", "model": "m", "base_url": "http://127.0.0.1:9"}
        os.environ.pop("CANARY_TEST_DEFINITELY_UNSET", None)
        row = canary_run.run_endpoint(endpoint, [{"id": "p1", "text": "hi"}], "2026-09-12")
        self.assertEqual(row["status"], "UNAVAILABLE")
        self.assertEqual(row["label"], "THIN")

    def test_drift_fires_and_stays_silent(self):
        with tempfile.TemporaryDirectory() as tmp:
            canary_run.BASELINE_PATH = os.path.join(tmp, "baseline.jsonl")
            canary_run.DRIFT_PATH = os.path.join(tmp, "drift.jsonl")
            ep = "test-ep"
            good = canary_run.daily_digest({"a": "1", "b": "2"})
            canary_run.append_jsonl(canary_run.BASELINE_PATH,
                                    {"date": "2026-09-11", "endpoint_id": ep, "status": "HASHED", "daily_digest": good, "label": "THIN"})
            # same digest -> silent
            today_same = [{"endpoint_id": ep, "status": "HASHED", "daily_digest": good, "label": "THIN"}]
            self.assertEqual(canary_run.detect_drift(today_same, "2026-09-12"), 0)
            # changed digest -> fires, THIN-labelled
            today_new = [{"endpoint_id": ep, "status": "HASHED", "daily_digest": "f" * 64, "label": "THIN"}]
            self.assertEqual(canary_run.detect_drift(today_new, "2026-09-12"), 1)
            drift = canary_run.read_jsonl(canary_run.DRIFT_PATH)[0]
            self.assertEqual(drift["label"], "THIN")
            self.assertIn("not signed", drift["note"])

    def safe_failure_round_trip(self, exc, expected_status, expected_error, closes=True):
        # These sentinels are synthetic, not provider-shaped credentials.
        sentinel = "SYNTHETIC_CANARY_PRIVATE_SENTINEL"
        endpoint = {"id": "synthetic", "model": "synthetic-model",
                    "env_key": "SYNTHETIC_CANARY_KEY", "base_url": "https://example.invalid"}
        cfg = {"endpoints": [endpoint], "prompts": [{"id": "p1", "text": "test"}]}
        stdout, stderr = io.StringIO(), io.StringIO()
        close_context = (mock.patch.object(exc, "close", wraps=exc.close)
                         if isinstance(exc, urllib.error.HTTPError) else nullcontext())
        with close_context as close, \
                mock.patch.object(canary_run, "load_config", return_value=cfg), \
                mock.patch.object(canary_run, "resolve_key", return_value=sentinel), \
                mock.patch.object(canary_run, "call_endpoint", side_effect=exc), \
                redirect_stdout(stdout), redirect_stderr(stderr):
            self.assertEqual(canary_run.real_run(), 0)
        if isinstance(exc, urllib.error.HTTPError):
            close.assert_called_once_with()
            if closes:
                self.assertTrue(exc.closed, "HTTP error resources must not escape into finalizers")
        with open(canary_run.BASELINE_PATH, encoding="utf-8") as stream:
            stored = stream.read()
        row = json.loads(stored.splitlines()[-1])
        self.assertEqual(row["status"], expected_status)
        self.assertEqual(row["error"], expected_error)
        self.assertIsNone(row["daily_digest"])
        self.assertEqual(row["prompt_hashes"], {})
        self.assertEqual(row["label"], "THIN")
        self.assertFalse(os.path.exists(canary_run.DRIFT_PATH))
        # Check the actual two output boundaries, plus stderr, not just the helper.
        output = stored + stdout.getvalue() + stderr.getvalue()
        for forbidden in (sentinel, "example.invalid", "?key=", "Authorization", "RAW_BODY"):
            self.assertNotIn(forbidden, output)
        self.assertIn(expected_status, stdout.getvalue())
        self.assertEqual(stderr.getvalue(), "")
        return row

    def test_http_errors_never_copy_provider_body_url_headers_or_reason(self):
        secret = "SYNTHETIC_CANARY_PRIVATE_SENTINEL"
        for code, status in ((401, "BAD_CREDENTIALS"), (402, "NO_BALANCE"),
                             (403, "FORBIDDEN"), (429, "RATE_LIMITED"),
                             (400, "ERROR"), (500, "ERROR")):
            with self.subTest(code=code):
                body = io.BytesIO(("RAW_BODY " + secret).encode())
                body.read = mock.Mock(wraps=body.read)
                exc = urllib.error.HTTPError(
                    "https://example.invalid/?key=" + secret, code,
                    "Authorization " + secret, {"Authorization": secret}, body)
                self.safe_failure_round_trip(
                    exc, status, {"category": "HTTP_ERROR", "http_status": code})
                body.read.assert_not_called()

    def test_http_errors_do_not_read_or_stringify_even_when_those_operations_fail(self):
        class HostileHTTPError(urllib.error.HTTPError):
            def read(self, *args, **kwargs):
                raise AssertionError("error bodies must not be consumed")
            def __str__(self):
                raise AssertionError("error text must not be consumed")
        self.safe_failure_round_trip(
            HostileHTTPError("https://example.invalid/?key=SYNTHETIC_CANARY_PRIVATE_SENTINEL",
                             403, "SYNTHETIC_CANARY_PRIVATE_SENTINEL", {}, None),
            "FORBIDDEN", {"category": "HTTP_ERROR", "http_status": 403})

    def test_http_cleanup_failure_does_not_publish_its_error(self):
        class BadCloseHTTPError(urllib.error.HTTPError):
            def close(self):
                raise RuntimeError("SYNTHETIC_CANARY_PRIVATE_SENTINEL")
        exc = BadCloseHTTPError("https://example.invalid", 403, "private", {}, None)
        # Dispose of the synthetic broken-close object after the test without
        # allowing its finalizer to produce an unrelated fixture warning.
        self.addCleanup(urllib.error.HTTPError.close, exc)
        self.safe_failure_round_trip(
            exc, "FORBIDDEN", {"category": "HTTP_ERROR", "http_status": 403}, closes=False)

    def test_http_status_is_a_validated_integer_not_an_untrusted_value(self):
        for code in ("SYNTHETIC_CANARY_PRIVATE_SENTINEL", True, None, 99, 600):
            with self.subTest(code_type=type(code).__name__):
                exc = urllib.error.HTTPError("https://example.invalid", code, "private", {}, None)
                self.safe_failure_round_trip(exc, "ERROR", {"category": "HTTP_ERROR"})

    def test_generic_errors_discard_messages_reasons_and_dynamic_type_names(self):
        secret = "SYNTHETIC_CANARY_PRIVATE_SENTINEL"
        named_error = type(secret, (Exception,), {})
        cases = (
            (urllib.error.URLError("https://example.invalid/?key=" + secret), "NETWORK_ERROR"),
            (TimeoutError(secret), "TIMEOUT"),
            (json.JSONDecodeError(secret, "RAW_BODY " + secret, 0), "RESPONSE_DECODE_ERROR"),
            (UnicodeDecodeError("utf-8", secret.encode(), 0, 1, secret), "RESPONSE_DECODE_ERROR"),
            (KeyError(secret), "CALL_ERROR"),
            (named_error(secret), "CALL_ERROR"),
        )
        for exc, category in cases:
            with self.subTest(category=category):
                self.safe_failure_round_trip(exc, "ERROR", {"category": category})

    def test_generic_exception_is_not_stringified(self):
        class HostileError(Exception):
            def __str__(self):
                raise AssertionError("exception text must not be consumed")
        self.safe_failure_round_trip(HostileError(), "ERROR", {"category": "CALL_ERROR"})

    def test_non_json_http_response_is_safe_at_both_output_boundaries(self):
        # Exercise the real HTTP/JSON decoder with a fake transport response.
        body = b"<html>RAW_BODY SYNTHETIC_CANARY_PRIVATE_SENTINEL</html>"
        response = mock.MagicMock()
        response.__enter__.return_value.read.return_value = body
        endpoint = {"id": "synthetic", "model": "m", "env_key": "SYNTHETIC_CANARY_KEY",
                    "base_url": "https://example.invalid/?key=SYNTHETIC_CANARY_PRIVATE_SENTINEL"}
        cfg = {"endpoints": [endpoint], "prompts": [{"id": "p1", "text": "test"}]}
        stdout, stderr = io.StringIO(), io.StringIO()
        with mock.patch.object(canary_run, "load_config", return_value=cfg), \
                mock.patch.object(canary_run, "resolve_key", return_value="synthetic-only"), \
                mock.patch.object(canary_run.urllib.request, "urlopen", return_value=response), \
                redirect_stdout(stdout), redirect_stderr(stderr):
            self.assertEqual(canary_run.real_run(), 0)
        rows = canary_run.read_jsonl(canary_run.BASELINE_PATH)
        self.assertEqual(rows[0]["error"], {"category": "RESPONSE_DECODE_ERROR"})
        self.assertEqual(rows[0]["status"], "ERROR")
        self.assertIsNone(rows[0]["daily_digest"])
        output = json.dumps(rows) + stdout.getvalue() + stderr.getvalue()
        self.assertNotIn("SYNTHETIC_CANARY_PRIVATE_SENTINEL", output)
        self.assertNotIn("RAW_BODY", output)
        self.assertNotIn("example.invalid", output)
        self.assertEqual(stderr.getvalue(), "")

    def test_partial_failure_is_not_a_measurement_or_drift(self):
        endpoint = {"id": "synthetic", "model": "m", "env_key": "SYNTHETIC_CANARY_KEY"}
        prompts = [{"id": "p1", "text": "first"}, {"id": "p2", "text": "second"}]
        with mock.patch.object(canary_run, "resolve_key", return_value="synthetic-only"), \
                mock.patch.object(canary_run, "call_endpoint",
                                  side_effect=["first response", RuntimeError("private")]):
            row = canary_run.run_endpoint(endpoint, prompts, "2026-10-23")
        self.assertEqual(row["status"], "ERROR")
        self.assertIsNone(row["daily_digest"])
        self.assertEqual(row["prompt_hashes"], {"p1": canary_run.sha256_hex("first response")})
        prior = {"date": "2026-10-21", "endpoint_id": "synthetic", "status": "HASHED",
                 "daily_digest": "a" * 64, "label": "THIN"}
        canary_run.append_jsonl(canary_run.BASELINE_PATH, prior)
        canary_run.append_jsonl(canary_run.BASELINE_PATH, row)
        self.assertEqual(canary_run.detect_drift([row], "2026-10-23"), 0)
        unavailable = dict(row, date="2026-10-24", status="UNAVAILABLE", prompt_hashes={})
        canary_run.append_jsonl(canary_run.BASELINE_PATH, unavailable)
        self.assertEqual(canary_run.detect_drift([unavailable], "2026-10-24"), 0)
        self.assertEqual(canary_run.most_recent_prior_hashed(
            canary_run.read_jsonl(canary_run.BASELINE_PATH), "synthetic", "2026-10-25"), prior)
        self.assertFalse(os.path.exists(canary_run.DRIFT_PATH))

    def test_success_and_missing_credentials_keep_existing_meaning(self):
        cfg = {"endpoints": [{"id": "synthetic", "model": "m",
                             "env_key": "SYNTHETIC_CANARY_KEY"}],
               "prompts": [{"id": "p1", "text": "first"}]}
        for key, expected in (("synthetic-only", "HASHED"), (None, "UNAVAILABLE")):
            with mock.patch.object(canary_run, "load_config", return_value=cfg), \
                    mock.patch.object(canary_run, "resolve_key", return_value=key), \
                    mock.patch.object(canary_run, "call_endpoint", return_value="answer") as call, \
                    redirect_stdout(io.StringIO()):
                self.assertEqual(canary_run.real_run(), 0)
            row = canary_run.read_jsonl(canary_run.BASELINE_PATH)[-1]
            self.assertEqual(row["status"], expected)
            self.assertNotIn("error", row)
            if key is None:
                call.assert_not_called()
                self.assertIsNone(row["daily_digest"])
            else:
                self.assertEqual(row["daily_digest"], canary_run.daily_digest(
                    {"p1": canary_run.sha256_hex("answer")}))
                self.assertNotIn("answer", json.dumps(row))
        self.assertEqual({r["label"] for r in canary_run.read_jsonl(canary_run.BASELINE_PATH)}, {"THIN"})

    def test_artifacts_all_thin(self):
        # Only synthetic fixtures are inspected; retained provider rows stay private.
        canary_run.append_jsonl(canary_run.BASELINE_PATH, {"label": "THIN", "status": "UNAVAILABLE"})
        canary_run.append_jsonl(canary_run.DRIFT_PATH, {"label": "THIN", "note": "synthetic"})
        for path in (canary_run.BASELINE_PATH, canary_run.DRIFT_PATH):
            if os.path.exists(path):
                for row in canary_run.read_jsonl(path):
                    self.assertEqual(row.get("label"), "THIN", path)

    def test_never_touches_signing_or_publisher(self):
        for name in os.listdir(HERE):
            if not name.endswith(".py") or name == os.path.basename(__file__):
                continue
            with open(os.path.join(HERE, name), encoding="utf-8") as stream:
                src = stream.read()
            self.assertNotIn("publish_public_root", src, name)
            self.assertNotIn("board-sign", src, name)
            self.assertNotIn("sign_card", src, name)
            self.assertNotIn("ed25519", src.lower(), name)


if __name__ == "__main__":
    unittest.main()
