#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))

import mill_hf_inference
from mill_lock_update import apply_mill, restore_original_membership


class _Response:
    def __init__(self, body: dict):
        self.body = json.dumps(body).encode()

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self):
        return self.body


class MillTruthTests(unittest.TestCase):
    @patch("mill_hf_inference.urllib.request.urlopen")
    def test_empty_http_200_is_uncheckable(self, mocked):
        mocked.return_value = _Response({"choices": [{"message": {"content": ""}}]})
        status, reason = mill_hf_inference.chat("token", "org/model", "prompt")
        self.assertEqual(status, "UNCHECKABLE")
        self.assertEqual(reason, "HTTP 200 empty completion")

    def test_practice_probe_does_not_increment_measured(self):
        lock = {"models": [{"slug": "org/model", "status": "UNMEASURED"}]}
        mill = {
            "as_of": "2026-09-12T00:00:00Z",
            "rows": [{"slug": "org/model", "status": "practice-mill", "n": 1}],
        }
        result = apply_mill(lock, mill)
        self.assertEqual(result["n_practice_probed"], 1)
        self.assertEqual(result["n_measured"], 0)

    def test_true_measurement_and_probe_are_counted_separately(self):
        original = {
            "models": [
                {"slug": "org/probed", "status": "UNMEASURED"},
                {"slug": "org/measured", "status": "UNMEASURED"},
            ]
        }
        overlay = {
            "models": [
                {"slug": "org/probed", "status": "practice-mill", "n": 1},
                {"slug": "org/measured", "status": "MEASURED", "n": 30},
            ]
        }
        result = restore_original_membership(original, [overlay])
        self.assertEqual(result["n_practice_probed"], 1)
        self.assertEqual(result["n_measured"], 1)

    def test_true_measurement_upgrades_a_practice_probe(self):
        lock = {"models": [{"slug": "org/model", "status": "practice-mill", "n": 1}]}
        result = apply_mill(
            lock,
            {
                "as_of": "2026-09-12T00:00:00Z",
                "rows": [{"slug": "org/model", "status": "MEASURED", "n": 30}],
            },
        )
        self.assertEqual(result["models"][0]["status"], "MEASURED")
        self.assertEqual(result["n_practice_probed"], 0)
        self.assertEqual(result["n_measured"], 1)


if __name__ == "__main__":
    unittest.main()
