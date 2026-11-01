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
from unittest import mock
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

    def assert_clients_unmeasured(self, bundle) -> None:
        skill = bundle["skill_qualification"]
        report = bundle["portability_report"]
        self.assertIsNone(skill["qualified"])
        self.assertEqual(skill["state"], "UNMEASURED")
        self.assertIsNone(skill["client_execution_receipt"])
        self.assertEqual(report["overall_state"], "UNMEASURED")
        self.assertIsNone(report["clients_tested"])
        self.assertIsNone(report["client_results"])
        for profile in report["fixture_profile_results"]:
            self.assertEqual(profile["execution_scope"], "LOCAL_FIXTURE_SIMULATION")
            self.assertEqual(profile["client_execution_state"], "UNMEASURED")
            self.assertIsNone(profile["client_execution_receipt"])
            self.assertIsNone(profile["allowed_tools_boundary_observed"])
            self.assertIsNone(profile["allowed_tools_boundary_receipt"])
            self.assertFalse(profile["declaration_is_execution_grant"])

    def test_portability_report_three_public_outputs(self) -> None:
        bundle = PR.run_portability_comparison()
        self.assert_clients_unmeasured(bundle)
        report = bundle["portability_report"]
        self.assertEqual(report["local_fixture_state"], "CONSISTENT")
        self.assertEqual(report["fixture_profiles_tested"], 3)
        for profile in report["fixture_profile_results"]:
            self.assertTrue(profile["local_evidence_properties_preserved"])
            controls = profile["controls"]
            for name in ("positive_valid_artifact", "adverse_altered_copy",
                         "adverse_unsupported_mode", "adverse_unavailable_source"):
                self.assertEqual(controls[name]["got"], controls[name]["expected"])
            self.assertRegex(controls["positive_valid_artifact"]["artifact_sha256"], r"^[0-9a-f]{64}$")
            self.assertEqual(controls["positive_valid_artifact"]["preserved_limits"], self.events[0]["limits"])
        history = bundle["compatibility_history"]
        self.assertGreaterEqual(len(history["entries"]), 2)
        self.assertEqual(history["client_retest_state"], "UNMEASURED")
        self.assertIsNone(history["client_retest_receipt"])
        for entry in history["entries"]:
            self.assertIsNone(entry["prior_conclusions_require_recheck"])

    def test_profile_and_permission_claims_cannot_qualify_a_host(self) -> None:
        labels = ("ENFORCED", "PROMPTED_FOR_APPROVAL", "REJECTED_ACTION",
                  "IGNORED_EXPERIMENTAL_DECLARATION", "ADMIN_APPROVED")
        with mock.patch.object(PSV, "verify_artifact", wraps=PSV.verify_artifact) as local:
            for label in labels:
                with self.subTest(label=label):
                    bundle = PR.run_portability_comparison(clients=[{
                        "client_id": "synthetic-host",
                        "boundary_observed": label,
                        "qualified": True,
                        "client_execution_receipt": {"source": "unobserved caller claim"},
                        "allowed_tools_boundary_receipt": {"approval": "unobserved"},
                    }])
                    self.assert_clients_unmeasured(bundle)
                    profile = bundle["portability_report"]["fixture_profile_results"][0]
                    self.assertEqual(profile["declared_boundary_observation"], label)
                    self.assertEqual(bundle["portability_report"]["local_fixture_state"], "CONSISTENT")
            self.assertEqual(local.call_count, len(labels) * 4)
            for invocation in local.call_args_list:
                self.assertEqual(invocation.kwargs["client_id"], "local-fixture-runner")
                self.assertEqual(invocation.kwargs["client_boundary_observation"], "UNMEASURED")

    def test_declared_fixture_clock_is_not_an_observed_client_time(self) -> None:
        actual_local_clock = "2026-10-25T02:00:00Z"
        declared_fixture_clock = "2020-01-01T00:00:00Z"
        with mock.patch.object(PR, "_now_utc", return_value=actual_local_clock):
            bundle = PR.run_portability_comparison(as_of_utc=declared_fixture_clock)
        for name in ("skill_qualification", "portability_report", "compatibility_history"):
            output = bundle[name]
            self.assertEqual(output["execution_scope"], "LOCAL_FIXTURE_SIMULATION")
            self.assertEqual(output["generated_at_utc"], actual_local_clock)
            self.assertEqual(output["declared_fixture_as_of_utc"], declared_fixture_clock)
            self.assertIsNone(output["as_of_utc"])
        self.assert_clients_unmeasured(bundle)

    def test_no_profiles_is_not_a_local_pass_or_a_client_count(self) -> None:
        bundle = PR.run_portability_comparison(clients=[])
        self.assert_clients_unmeasured(bundle)
        report = bundle["portability_report"]
        self.assertEqual(report["fixture_profiles_tested"], 0)
        self.assertEqual(report["fixture_profile_results"], [])
        self.assertEqual(report["local_fixture_state"], "UNMEASURED")
        self.assertEqual(bundle["skill_qualification"]["local_fixture_state"], "UNMEASURED")

    def test_failed_local_control_stays_visible_without_host_qualification(self) -> None:
        verify = PSV.verify_artifact

        def fail_positive(artifact, **kwargs):
            result = verify(artifact, **kwargs)
            if Path(artifact).name == "valid_event.json" and kwargs["mode"] == "structure":
                result["verdict_state"] = "INVALID"
            return result

        with mock.patch.object(PSV, "verify_artifact", side_effect=fail_positive):
            bundle = PR.run_portability_comparison(clients=[{"client_id": "synthetic-host"}])
        self.assert_clients_unmeasured(bundle)
        self.assertEqual(bundle["portability_report"]["local_fixture_state"], "DIVERGENT")
        self.assertEqual(bundle["skill_qualification"]["local_fixture_state"], "DIVERGENT")
        controls = bundle["portability_report"]["fixture_profile_results"][0]["controls"]
        self.assertEqual(controls["positive_valid_artifact"]["got"], "INVALID")

    def test_open_responses_rejects_injected_supersedes_without_prior(self) -> None:
        original = self.events[0]
        self.assertIsNone(original.get("supersedes"))
        envelope = ORS.event_to_open_response(original)
        payload = json.loads(envelope["output"][1]["output"])
        payload["supersedes"] = {"event_id": self.events[1]["event_id"]}
        envelope["output"][1]["output"] = json.dumps(payload)
        result = ORS.verify_open_response_survival(original, envelope)
        self.assertEqual(result["verdict"], "DIVERGENT")
        self.assertFalse(result["checks"]["unrelated_finding_not_closed"])

    def test_open_responses_rejects_injected_same_endpoint_finding(self) -> None:
        original = self.events[0]
        prior = copy.deepcopy(self.events[1])
        prior["subject"] = copy.deepcopy(original["subject"])
        prior["method"] = copy.deepcopy(original["method"])
        prior["event_id"] = E.compute_event_id(prior)
        self.assertNotEqual(prior["event_id"], original["event_id"])
        envelope = ORS.event_to_open_response(original)
        payload = json.loads(envelope["output"][1]["output"])
        payload["supersedes"] = {"event_id": prior["event_id"]}
        envelope["output"][1]["output"] = json.dumps(payload)
        result = ORS.verify_open_response_survival(
            original, envelope, unrelated_prior_event=prior
        )
        self.assertEqual(result["verdict"], "DIVERGENT")
        self.assertFalse(result["checks"]["unrelated_finding_not_closed"])
        for name, holds in result["checks"].items():
            if name != "unrelated_finding_not_closed":
                self.assertTrue(holds, name)

    def test_open_responses_preserves_legitimate_and_unasserted_lineage(self) -> None:
        original = copy.deepcopy(self.events[0])
        prior = copy.deepcopy(self.events[1])
        prior["subject"] = copy.deepcopy(original["subject"])
        prior["method"] = copy.deepcopy(original["method"])
        prior["event_id"] = E.compute_event_id(prior)
        original["supersedes"] = {"event_id": prior["event_id"]}
        original["event_id"] = E.compute_event_id(original)
        result = ORS.verify_open_response_survival(
            original, ORS.event_to_open_response(original), unrelated_prior_event=prior
        )
        self.assertEqual(result["verdict"], "CONSISTENT")
        self.assertTrue(result["checks"]["unrelated_finding_not_closed"])
        # Existing envelopes emit null for an absent relation; removing that
        # optional null must still mean no supersedes relation.
        unasserted = copy.deepcopy(self.events[0])
        unasserted.pop("supersedes", None)
        unasserted["event_id"] = E.compute_event_id(unasserted)
        envelope = ORS.event_to_open_response(unasserted)
        self.assertEqual(ORS.verify_open_response_survival(unasserted, envelope)["verdict"], "CONSISTENT")
        payload = json.loads(envelope["output"][1]["output"])
        self.assertIsNone(payload.pop("supersedes"))
        envelope["output"][1]["output"] = json.dumps(payload)
        self.assertEqual(ORS.verify_open_response_survival(unasserted, envelope)["verdict"], "CONSISTENT")

    def test_valid_passing_retest_cannot_close_an_unrelated_finding(self) -> None:
        prior = self.events[1]
        passing = copy.deepcopy(self.events[0])
        passing["supersedes"] = {"event_id": prior["event_id"]}
        passing["event_id"] = E.compute_event_id(passing)
        envelope = ORS.event_to_open_response(passing)
        result = ORS.verify_open_response_survival(
            passing, envelope, unrelated_prior_event=prior
        )
        self.assertEqual(result["verdict"], "DIVERGENT")
        self.assertFalse(result["checks"]["unrelated_finding_not_closed"])
        for name, holds in result["checks"].items():
            if name != "unrelated_finding_not_closed":
                self.assertTrue(holds, name)


if __name__ == "__main__":
    unittest.main(verbosity=2)
