#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Unit tests for the AAIF / Receiver-Value Portability Suite:
- OTel subsecond precision, clock separation, and optional trace context
- Portable GSPC & SAFE verification skill runner (`portable_skill_verify.py`)
- Open Responses evidence-survival harness (`open_responses_survival.py`)
- OpenEnv bounded GSPC task adapter (`openenv_gspc_adapter.py`)
- OpenSandbox execution boundary recorder (`opensandbox_boundary_recorder.py`)
- Cross-client portability report & compatibility history (`portability_report.py`)
"""
import copy
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.dirname(HERE)
if PKG not in sys.path:
    sys.path.insert(0, PKG)

import event as E  # noqa: E402
from render import otel  # noqa: E402
import open_responses_survival as ORS  # noqa: E402
import openenv_gspc_adapter as OEA  # noqa: E402
import opensandbox_boundary_recorder as OBR  # noqa: E402
import portability_report as PR  # noqa: E402
import portable_skill_verify as PSV  # noqa: E402


class AaifPortabilitySuiteTest(unittest.TestCase):
    def setUp(self) -> None:
        self.events = E.read_jsonl(os.path.join(HERE, "fixtures", "events.jsonl"))

    def test_otel_subsecond_and_clock_meaning(self) -> None:
        ev_a = copy.deepcopy(self.events[0])
        ev_b = copy.deepcopy(self.events[0])
        ev_a["claim"]["read_at"] = "2026-09-30T12:00:00.100000Z"
        ev_a["event_id"] = E.compute_event_id(ev_a)
        ev_b["claim"]["read_at"] = "2026-09-30T12:00:00.900000123Z"
        ev_b["event_id"] = E.compute_event_id(ev_b)
        rec_a = otel.log_record(ev_a)
        rec_b = otel.log_record(ev_b)
        self.assertNotEqual(rec_a["timeUnixNano"], rec_b["timeUnixNano"])
        self.assertTrue(rec_a["timeUnixNano"].endswith("100000000"))
        self.assertTrue(rec_b["timeUnixNano"].endswith("900000123"))

        ev_sep = copy.deepcopy(self.events[0])
        ev_sep["observed"] = {"tools": 3, "read_at": "2026-09-30T11:58:00.250000Z"}
        ev_sep["claim"]["read_at"] = "2026-09-30T12:00:00.750000Z"
        ev_sep["event_id"] = E.compute_event_id(ev_sep)
        rec_sep = otel.log_record(ev_sep)
        self.assertLess(int(rec_sep["timeUnixNano"]), int(rec_sep["observedTimeUnixNano"]))

    def test_portable_skill_verify_controls_and_safe_pack(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            valid_path = os.path.join(tmp, "valid.json")
            tampered_path = os.path.join(tmp, "tampered.json")
            Path(valid_path).write_text(json.dumps(self.events[0]), encoding="utf-8")
            bad = copy.deepcopy(self.events[0])
            bad["observed"] = {"tools": 42}
            Path(tampered_path).write_text(json.dumps(bad), encoding="utf-8")

            r_ok = PSV.verify_artifact(
                valid_path,
                mode="structure",
                client_id="test-client",
                client_boundary_observation="ENFORCED",
            )
            self.assertEqual(r_ok["verdict_state"], "STRUCTURE_VALID")
            self.assertFalse(r_ok["declaration_is_execution_grant"])
            self.assertEqual(r_ok["preserved_limits"], self.events[0]["limits"])

            r_bad = PSV.verify_artifact(tampered_path, mode="structure")
            self.assertEqual(r_bad["verdict_state"], "INVALID")

            r_missing = PSV.verify_artifact(os.path.join(tmp, "absent.json"), mode="structure")
            self.assertEqual(r_missing["verdict_state"], "UNCHECKABLE")

            r_unsup = PSV.verify_artifact(valid_path, mode="unsupported_mode")
            self.assertEqual(r_unsup["verdict_state"], "UNCHECKABLE")

    def test_open_responses_survival_positive_and_adverse(self) -> None:
        ev_ok = self.events[0]
        env_ok = ORS.event_to_open_response(ev_ok, request_id="req_1", provider="openai-compat")
        res_ok = ORS.verify_open_response_survival(ev_ok, env_ok)
        self.assertEqual(res_ok["verdict"], "CONSISTENT")

        # Adverse: UNMEASURED event given a fabricated score 0.0 in output
        ev_unm = self.events[3]
        env_unm = ORS.event_to_open_response(ev_unm)
        bad_payload = json.loads(env_unm["output"][1]["output"])
        bad_payload["value"] = 0.0
        env_unm["output"][1]["output"] = json.dumps(bad_payload)
        res_unm_bad = ORS.verify_open_response_survival(ev_unm, env_unm)
        self.assertEqual(res_unm_bad["verdict"], "DIVERGENT")
        self.assertFalse(res_unm_bad["checks"]["unmeasured_remains_unmeasured"])

        # Adverse: later passing event falsely claims to supersede an unrelated earlier finding
        ev_prior = self.events[1]  # fixture-2
        env_false_close = ORS.event_to_open_response(ev_ok)
        p_fc = json.loads(env_false_close["output"][1]["output"])
        p_fc["supersedes"] = ev_prior["event_id"]
        env_false_close["output"][1]["output"] = json.dumps(p_fc)
        res_fc = ORS.verify_open_response_survival(ev_ok, env_false_close, unrelated_prior_event=ev_prior)
        self.assertEqual(res_fc["verdict"], "DIVERGENT")
        self.assertFalse(res_fc["checks"]["unrelated_finding_not_closed"])

    def test_openenv_gspc_adapter_three_plane_separation(self) -> None:
        env = OEA.GspcVerificationEnv()
        st = env.reset(case_id="case_01_valid_consistent")
        self.assertTrue(st["initialized"])
        self.assertFalse(st["done"])

        step_res = env.step(
            {
                "verdict_state": "STRUCTURE_VALID",
                "evidence_state": "CONSISTENT",
                "conclusion": "SUPPORTED_WITHIN_DECLARED_LIMITS",
                "retained_event_id": st["artifact"]["event_id"],
                "preserved_limits": st["artifact"]["limits"],
            }
        )
        self.assertEqual(step_res["environment_reward"]["value"], 1.0)
        self.assertTrue(step_res["environment_reward"]["reward_is_not_safety_or_compliance"])
        self.assertEqual(step_res["measurement_result"]["state"], "CONSISTENT")
        self.assertEqual(step_res["execution_evidence"]["retained_event_id"], st["artifact"]["event_id"])

        # Adverse tampered case
        st2 = env.reset(case_id="case_02_tampered_digest")
        step_res2 = env.step(
            {
                "verdict_state": "INVALID",
                "evidence_state": "INVALID",
                "conclusion": "REJECT_ALTERED_ARTIFACT",
                "retained_event_id": st2["artifact"]["event_id"],
                "preserved_limits": st2["artifact"]["limits"],
            }
        )
        self.assertEqual(step_res2["measurement_result"]["state"], "CONSISTENT")
        self.assertEqual(step_res2["measurement_result"]["verifier_verdict"], "INVALID")

    def test_opensandbox_boundary_recorder(self) -> None:
        cfg = {
            "image_digest": "sha256:1111111111111111111111111111111111111111111111111111111111111111",
            "runtime_class": "gvisor",
            "network_policy": "none",
            "filesystem_policy": "read_only_root_with_scratch",
            "expected_output_sha256": "abcd1234",
        }
        obs_ok = {
            "telemetry_available": True,
            "network_egress_attempts": [],
            "outside_scratch_writes": [],
            "output_artifact_sha256": "abcd1234",
            "events": [{"type": "proc_start"}, {"type": "proc_exit"}],
        }
        rec_ok = OBR.evaluate_sandbox_boundary("task_01", cfg, obs_ok)
        self.assertEqual(rec_ok["state"], "CONSISTENT")
        self.assertTrue(rec_ok["configuration"]["ordinary_container_distinguished_from_isolated_runtime"])
        self.assertFalse(rec_ok["blanket_runtime_safety_claimed"])

        obs_leak = copy.deepcopy(obs_ok)
        obs_leak["network_egress_attempts"] = ["198.51.100.1:443"]
        rec_div = OBR.evaluate_sandbox_boundary("task_01", cfg, obs_leak)
        self.assertEqual(rec_div["state"], "DIVERGENT")

        with self.assertRaises(ValueError):
            OBR.evaluate_sandbox_boundary("task_01", cfg, obs_ok, claimed_summary="OpenSandbox is safe for all runs")

    def test_portability_report_three_public_outputs(self) -> None:
        bundle = PR.run_portability_comparison()
        self.assertEqual(bundle["skill_qualification"]["state"], "CONSISTENT")
        self.assertEqual(bundle["portability_report"]["overall_state"], "CONSISTENT")
        self.assertEqual(bundle["portability_report"]["clients_tested"], 3)
        self.assertGreaterEqual(len(bundle["compatibility_history"]["entries"]), 2)


if __name__ == "__main__":
    unittest.main(verbosity=2)
