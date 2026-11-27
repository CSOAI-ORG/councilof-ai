#!/usr/bin/env python3
"""Offline positive and adversarial tests for evidence-bound Council heartbeat."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
import sys
from unittest.mock import patch

import operating_heartbeat as oh

NOW = "2026-11-24T00:30:00Z"


def valid_sources():
    data = {}
    for name, (path, kind) in oh.OBSERVATIONS.items():
        if kind == "PR":
            number = int(path.split("/")[-1])
            data[name] = {"number": number, "state": "closed",
                          "merged_at": "2026-11-23T09:44:21Z",
                          "updated_at": "2026-11-23T09:45:00Z"}
        else:
            data[name] = {"workflow_runs": [{
                "id": 1234567, "status": "completed", "conclusion": "success",
                "created_at": "2026-11-23T12:00:00Z",
                "html_url": "https://github.com/CSOAI-ORG/councilof-ai/actions/runs/1234567"}]}
    return data


class ReadOnlyHeartbeatTests(unittest.TestCase):
    def test_all_source_success_is_not_external_effect(self):
        x = oh.make_snapshot(valid_sources(), NOW)
        self.assertEqual(x["release_holds_from_open_or_unknown_prs"], [])
        self.assertFalse(x["external_effect_verified"])
        self.assertEqual(x["mutations_performed"], 0)
        self.assertEqual(x["independent_evidence_states"]["qualified_customer_count"], "NOT_MEASURED")
        self.assertEqual(x["independent_evidence_states"]["human_reviewers_independently_authorised"], "NOT_MEASURED")
        self.assertEqual(x["independent_evidence_states"]["downstream_recipient_effect_verified"], "NOT_MEASURED")

    def test_open_root_and_freshness_hold(self):
        x = valid_sources()
        for name in ("signed_root_candidate", "evidence_full_set_freshness"):
            x[name]["state"] = "open"
            x[name]["merged_at"] = None
        y = oh.make_snapshot(x, NOW)
        self.assertEqual(set(y["release_holds_from_open_or_unknown_prs"]),
                         {"signed_root_candidate", "evidence_full_set_freshness"})

    def test_merging_source_is_not_live_deployment(self):
        x = oh.make_snapshot(valid_sources(), NOW)
        self.assertEqual(x["source_observations"]["signed_root_candidate"]["state"], "MERGED_SOURCE_ONLY")
        self.assertIn("NOT_DEPLOYMENT", x["scope"])

    def test_missing_pr_source_holds(self):
        x = valid_sources()
        del x["signed_root_candidate"]
        y = oh.make_snapshot(x, NOW)
        self.assertIn("signed_root_candidate", y["release_holds_from_open_or_unknown_prs"])
        self.assertEqual(y["source_observations"]["signed_root_candidate"]["reason"], "SOURCE_FETCH_UNAVAILABLE")

    def test_failed_workflow_requires_review(self):
        x = valid_sources()
        x["metrology_ci"]["workflow_runs"][0]["conclusion"] = "failure"
        y = oh.make_snapshot(x, NOW)
        self.assertEqual(y["source_observations"]["metrology_ci"]["state"], "FAILED_OR_BLOCKED")
        self.assertIn("metrology_ci", y["recheck_or_operator_review"])

    def test_workflow_queued_not_green(self):
        x = valid_sources()
        x["production_deployment_ci"]["workflow_runs"][0].update({"status": "queued", "conclusion": None})
        self.assertEqual(oh.make_snapshot(x, NOW)["source_observations"]["production_deployment_ci"]["state"], "IN_PROGRESS")

    def test_empty_workflow_not_green(self):
        x = valid_sources()
        x["metrology_ci"]["workflow_runs"] = []
        self.assertEqual(oh.make_snapshot(x, NOW)["source_observations"]["metrology_ci"]["state"], "UNKNOWN")

    def test_stale_success_not_green(self):
        x = valid_sources()
        x["metrology_ci"]["workflow_runs"][0]["created_at"] = "2026-11-01T12:00:00Z"
        self.assertEqual(oh.make_snapshot(x, NOW)["source_observations"]["metrology_ci"]["state"], "STALE_OBSERVATION")

    def test_future_workflow_not_green(self):
        x = valid_sources()
        x["metrology_ci"]["workflow_runs"][0]["created_at"] = "2026-11-25T12:00:00Z"
        self.assertEqual(oh.make_snapshot(x, NOW)["source_observations"]["metrology_ci"]["state"], "UNKNOWN")

    def test_nonmaster_pr_only_ci_is_reported_with_branch_boundary(self):
        x = valid_sources()
        x["metrology_ci"]["workflow_runs"][0]["head_branch"] = "research/check-standard"
        y = oh.make_snapshot(x, NOW)["source_observations"]["metrology_ci"]
        self.assertEqual(y["state"], "SUCCEEDED_NONMASTER_SOURCE_ONLY")
        self.assertEqual(y["run_head_branch"], "research/check-standard")

    def test_unattributed_ci_cannot_claim_master(self):
        x = valid_sources()
        y = oh.make_snapshot(x, NOW)["source_observations"]["metrology_ci"]
        self.assertEqual(y["state"], "SUCCEEDED_UNATTRIBUTED_SOURCE_ONLY")
        self.assertIsNone(y["run_head_branch"])

    def test_master_attributed_ci_remains_source_only(self):
        x = valid_sources()
        x["metrology_ci"]["workflow_runs"][0]["head_branch"] = "master"
        y = oh.make_snapshot(x, NOW)["source_observations"]["metrology_ci"]
        self.assertEqual(y["state"], "SUCCEEDED_SOURCE_ONLY")
        self.assertNotIn("deployed", json.dumps(y).lower())

    def test_skipped_workflow_not_green(self):
        x = valid_sources()
        x["metrology_ci"]["workflow_runs"][0]["conclusion"] = "skipped"
        self.assertEqual(oh.make_snapshot(x, NOW)["source_observations"]["metrology_ci"]["state"], "NO_SUCCESS_CLAIM")

    def test_wrong_pr_number_not_green(self):
        x = valid_sources()
        x["signed_root_candidate"]["number"] = 1234
        self.assertEqual(oh.make_snapshot(x, NOW)["source_observations"]["signed_root_candidate"]["state"], "UNKNOWN")

    def test_closed_unmerged_is_not_success(self):
        x = valid_sources()
        x["signed_root_candidate"].update({"merged_at": None, "state": "closed"})
        self.assertEqual(oh.make_snapshot(x, NOW)["source_observations"]["signed_root_candidate"]["state"], "CLOSED_UNMERGED")
        self.assertIn("signed_root_candidate", oh.make_snapshot(x, NOW)["release_holds_from_open_or_unknown_prs"])

    def test_conflicting_merged_and_open_not_green(self):
        x = valid_sources()
        x["signed_root_candidate"]["state"] = "open"
        self.assertEqual(oh.make_snapshot(x, NOW)["source_observations"]["signed_root_candidate"]["state"], "UNKNOWN")

    def test_future_merge_not_green(self):
        x = valid_sources()
        x["signed_root_candidate"]["merged_at"] = "2026-11-25T08:00:00Z"
        self.assertEqual(oh.make_snapshot(x, NOW)["source_observations"]["signed_root_candidate"]["state"], "UNKNOWN")

    def test_fetch_error_not_green(self):
        x = valid_sources()
        x["metrology_ci"] = {"_fetch_error": 403}
        self.assertEqual(oh.make_snapshot(x, NOW)["source_observations"]["metrology_ci"]["state"], "UNKNOWN")

    def test_source_sha_deterministic(self):
        x = valid_sources()
        self.assertEqual(oh.digest(x), oh.digest(copy.deepcopy(x)))
        self.assertEqual(len(oh.digest(x)), 64)

    def test_invalid_clock_rejected(self):
        with self.assertRaises(ValueError):
            oh.make_snapshot(valid_sources(), "2026-11-24T00:30:00+01:00")

    def test_invalid_age_rejected(self):
        for val in [0, -1, 100000, True]:
            with self.subTest(age=val), self.assertRaises(ValueError):
                oh.make_snapshot(valid_sources(), NOW, val)

    def test_invalid_api_path_rejected_before_request(self):
        with self.assertRaises(ValueError):
            oh.fetch_github("../../secrets")
        with self.assertRaises(ValueError):
            oh.fetch_github("contents/data|curl")

    def test_no_private_source_responses_in_output(self):
        x = valid_sources()
        x["signed_root_candidate"]["customer_secret"] = "NEVER_PRINT_THIS"
        text = json.dumps(oh.make_snapshot(x, NOW))
        self.assertNotIn("NEVER_PRINT_THIS", text)

    def test_offline_cli_snapshot(self):
        with tempfile.TemporaryDirectory() as root:
            source = Path(root) / "input.json"
            result = Path(root) / "output.json"
            source.write_text(json.dumps(valid_sources()))
            rc = oh.main(["--fixture", str(source), "--as-of", NOW, "--output", str(result)])
            self.assertEqual(rc, 0)
            self.assertEqual(json.loads(result.read_text())["decision"], "HUMAN_TRIAGE_NO_AUTOMATED_PROMOTION")

    def test_offline_cli_unknown_exits_nonzero_but_writes_snapshot(self):
        with tempfile.TemporaryDirectory() as root:
            source = Path(root) / "input.json"
            result = Path(root) / "output.json"
            source.write_text(json.dumps({}))
            rc = oh.main(["--fixture", str(source), "--as-of", NOW, "--output", str(result)])
            self.assertEqual(rc, 4)
            self.assertIn("UNKNOWN", result.read_text())


if __name__ == "__main__":
    unittest.main(verbosity=2)
