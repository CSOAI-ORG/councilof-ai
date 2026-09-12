#!/usr/bin/env python3
"""Tests for the silent-route canary harness (G3.6). Plain python, no network.

Asserts: config validity, digest determinism, drift fires on change and stays
silent on identical digests, the UNAVAILABLE path when no credential exists,
THIN labelling on every artifact row, and the doctrine lock: nothing under
scripts/canary touches signing or publisher code.
"""
import json
import os
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import canary_run  # noqa: E402


class CanaryTest(unittest.TestCase):
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

    def test_artifacts_all_thin(self):
        for path in (canary_run.BASELINE_PATH, canary_run.DRIFT_PATH):
            if os.path.exists(path):
                for row in canary_run.read_jsonl(path):
                    self.assertEqual(row.get("label"), "THIN", path)

    def test_never_touches_signing_or_publisher(self):
        for name in os.listdir(HERE):
            if not name.endswith(".py") or name == os.path.basename(__file__):
                continue
            src = open(os.path.join(HERE, name), encoding="utf-8").read()
            self.assertNotIn("publish_public_root", src, name)
            self.assertNotIn("board-sign", src, name)
            self.assertNotIn("sign_card", src, name)
            self.assertNotIn("ed25519", src.lower(), name)


if __name__ == "__main__":
    unittest.main()
