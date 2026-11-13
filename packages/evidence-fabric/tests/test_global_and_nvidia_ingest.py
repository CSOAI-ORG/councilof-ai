#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Unit tests for NVIDIA NeMo Guardrails (`nemo_guardrails_in.py`), Global/China Open-Source
Evaluation Harness + Native UK AISI Inspect (`global_eval_in.py`), and 3-Dialect OTLP (`otlp_in.py`).
"""
import json
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.dirname(HERE)
if PKG not in sys.path:
    sys.path.insert(0, PKG)

import event as E  # noqa: E402
from ingest import global_eval_in, nemo_guardrails_in, otlp_in  # noqa: E402
from render import ecs_hec, intoto, oasf_eval, ocsf, otel, sarif, w3c_acr01  # noqa: E402

READ_AT = "2026-10-24T05:50:00Z"


class GlobalAndNvidiaIngestTest(unittest.TestCase):
    def test_nemo_guardrails_consistent_divergent_and_unmeasured(self) -> None:
        trace_doc = {
            "nemo_guardrails_version": "0.11.0",
            "model": "nvidia/llama-3.1-nemotron-70b-instruct",
            "turns": [
                {
                    "turn_id": "t1-consistent-block",
                    "expected_action": "block",
                    "declared_rails": ["self_check_input", "jailbreak_detection_heuristics"],
                    "activated_rails": [
                        {"name": "self_check_input", "decision": "allow"},
                        {"name": "jailbreak_detection_heuristics", "decision": "block"},
                    ],
                },
                {
                    "turn_id": "t2-divergent-bypass",
                    "expected_action": "block",
                    "declared_rails": ["self_check_input"],
                    "activated_rails": [
                        {"name": "self_check_input", "decision": "allow"},
                    ],
                },
                {
                    "turn_id": "t3-unmeasured-no-trace",
                    "expected_action": "allow",
                    "declared_rails": ["output_moderation"],
                    "activated_rails": [],
                },
                {
                    "turn_id": "t4-unmeasured-missing-decision-never-defaults-to-allow",
                    "expected_action": "allow",
                    "declared_rails": ["self_check_input"],
                    "activated_rails": [
                        {"name": "self_check_input"},
                    ],
                },
            ],
        }
        raw = json.dumps(trace_doc).encode("utf-8")
        evs = nemo_guardrails_in.ingest(raw, read_at=READ_AT)
        self.assertEqual(len(evs), 4)
        for ev in evs:
            self.assertEqual(E.validate(ev), [])
            self.assertIsNone(ev["value"])
            # Render through every evidence-fabric renderer without error
            self.assertIsNotNone(otel.log_record(ev))
            self.assertIsNotNone(ocsf.render(ev))
            self.assertIsNotNone(sarif.result(ev))
            self.assertIsNotNone(intoto.statement(ev))
            self.assertIsNotNone(ecs_hec.hec(ev))
            self.assertIsNotNone(w3c_acr01.event_record(ev))
            self.assertIsNotNone(oasf_eval.single(ev))

        self.assertEqual(evs[0]["state"], "CONSISTENT")
        self.assertEqual(evs[0]["negative_control"]["got"], "DIVERGENT")
        self.assertEqual(evs[1]["state"], "DIVERGENT")
        self.assertEqual(evs[2]["state"], "UNMEASURED")
        self.assertEqual(evs[3]["state"], "UNMEASURED")
        self.assertIn("missing a valid decision/status field", evs[3]["observed"]["reason"])

    def test_global_eval_opencompass_and_flageval_recount(self) -> None:
        eval_doc = {
            "harness": "opencompass",
            "harness_version": "0.3.9",
            "model": "deepseek-ai/DeepSeek-R1",
            "tasks": [
                {
                    "task_id": "ceval-hard-stem",
                    "declared_passed": 3,
                    "declared_total": 4,
                    "declared_accuracy": 0.75,
                    "samples": [
                        {"id": "s1", "passed": True},
                        {"id": "s2", "passed": True},
                        {"id": "s3", "passed": False},
                        {"id": "s4", "passed": True},
                    ],
                },
                {
                    "task_id": "humaneval-cn",
                    "declared_passed": 4,
                    "declared_total": 4,
                    "declared_accuracy": 1.0,
                    "samples": [
                        {"id": "s1", "passed": True},
                        {"id": "s2", "passed": False},
                        {"id": "s3", "passed": True},
                        {"id": "s4", "passed": False},
                    ],
                },
                {
                    "task_id": "summary-only-leaderboard-claim",
                    "declared_passed": 95,
                    "declared_total": 100,
                    "declared_accuracy": 0.95,
                },
            ],
        }
        raw = json.dumps(eval_doc).encode("utf-8")
        evs = global_eval_in.ingest(raw, read_at=READ_AT)
        self.assertEqual(len(evs), 3)
        for ev in evs:
            self.assertEqual(E.validate(ev), [])

        self.assertEqual(evs[0]["state"], "CONSISTENT")
        self.assertAlmostEqual(evs[0]["value"], 0.75)
        self.assertEqual(evs[0]["negative_control"]["got"], "DIVERGENT")

        self.assertEqual(evs[1]["state"], "DIVERGENT")
        self.assertIsNone(evs[1]["value"])

        self.assertEqual(evs[2]["state"], "UNCHECKABLE")
        self.assertIsNone(evs[2]["value"])

    def test_native_inspect_top_level_export_and_aborted_run(self) -> None:
        native_inspect_doc = {
            "version": 2,
            "status": "success",
            "eval": {
                "task": "mini",
                "model": "mockllm/model",
            },
            "results": {
                "total_samples": 4,
                "completed_samples": 4,
                "scores": [
                    {
                        "name": "match",
                        "scorer": "match",
                        "metrics": {"accuracy": {"name": "accuracy", "value": 0.5}},
                    }
                ],
            },
            "samples": [
                {"id": 1, "scores": {"match": {"value": "C"}}},
                {"id": 2, "scores": {"match": {"value": "I"}}},
                {"id": 3, "scores": {"match": {"value": "C"}}},
                {"id": 4, "scores": {"match": {"value": "I"}}},
            ],
        }
        evs = global_eval_in.ingest(json.dumps(native_inspect_doc).encode("utf-8"), read_at=READ_AT)
        self.assertEqual(len(evs), 1)
        self.assertEqual(E.validate(evs[0]), [])
        self.assertEqual(evs[0]["method"]["id"], "inspect-native-recount")
        self.assertEqual(evs[0]["state"], "CONSISTENT")
        self.assertAlmostEqual(evs[0]["value"], 0.5)
        self.assertEqual(evs[0]["negative_control"]["got"], "DIVERGENT")

        # Aborted run -> UNMEASURED
        aborted_doc = dict(native_inspect_doc, status="cancelled")
        evs_aborted = global_eval_in.ingest(json.dumps(aborted_doc).encode("utf-8"), read_at=READ_AT)
        self.assertEqual(len(evs_aborted), 1)
        self.assertEqual(E.validate(evs_aborted[0]), [])
        self.assertEqual(evs_aborted[0]["state"], "UNMEASURED")
        self.assertIsNone(evs_aborted[0]["value"])

    def test_otlp_three_dialects_and_missing_score_unmeasured(self) -> None:
        fixtures_dir = os.path.expanduser("~/_alignment/otlp-ingest")
        if not os.path.isdir(fixtures_dir):
            self.skipTest("otlp-ingest fixtures directory not present")
        expected_cases = [
            ("fixture-genai.json", "CONSISTENT"),
            ("fixture-openinference.json", "CONSISTENT"),
            ("fixture-langfuse.json", "PARTIAL"),
            ("fixture-rerouted.json", "DIVERGENT"),
            ("fixture-eval-score.json", "CONSISTENT"),
            ("fixture-eval-no-score.json", "UNMEASURED"),
        ]
        for fname, expected_state in expected_cases:
            with self.subTest(fixture=fname):
                raw = open(os.path.join(fixtures_dir, fname), "rb").read()
                evs = otlp_in.ingest(raw, origin="fixture", read_at=READ_AT)
                self.assertEqual(len(evs), 1)
                self.assertEqual(E.validate(evs[0]), [])
                self.assertEqual(evs[0]["state"], expected_state)


if __name__ == "__main__":
    unittest.main()
