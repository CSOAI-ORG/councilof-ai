"""Deterministic interface tests. Scenario evidence is synthetic unless named live."""
from copy import deepcopy
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = Path(__file__).with_name("fixtures")
SPEC = importlib.util.spec_from_file_location("recheck_schedule", ROOT / "recheck_schedule.py")
scheduler = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(scheduler)
NOW = "2026-11-07T12:00:00Z"


def row(claim="c1", state="NO_CHANGE", seq=0, **extra):
    return {"event_seq": seq, "observed_at": "2026-11-07T10:00:00Z",
            "subject_sealed_id": "0123456789abcdef", "claim_ref": claim,
            "event_state": "CONFIRMED", "receipt_state": None,
            "reaction_state": state, "reason": "SYNTHETIC fixture",
            "counter_reaction": {"required": state in ("RECHECK_REQUIRED", "SOURCE_RETRY_REQUIRED")}, **extra}


def projection(*rows):
    unique = {r["event_seq"]: r for r in rows}
    counts = {}
    for r in unique.values():
        counts[r["reaction_state"]] = counts.get(r["reaction_state"], 0) + 1
    return {"schema": scheduler.REACTION_SCHEMA, "source_verification": "VERIFIES",
            "since_exclusive": -1, "fixture_evidence_kind": "SYNTHETIC_INTERFACE_ASSERTION",
            "n_events": len(unique), "by_state": counts,
            "n_counter_reaction_required": sum(r["counter_reaction"]["required"] for r in unique.values()),
            "reactions": list(rows)}


def claim(ref="c1", **extra):
    return {"subject_sealed_id": "0123456789abcdef", "claim_ref": ref,
            "method_version": "synthetic-method/1", "provider_id": "offline-fixture",
            "estimated_cost_units": 2, "max_age_seconds": 3600,
            "last_success_at": "2026-11-07T09:00:00Z", **extra}


def policy(*claims, **extra):
    return {"budget_units": 4, "max_items": 10, "allowed_provider_ids": ["offline-fixture"],
            "exploration_slots": 1, "claims": list(claims), **extra}


def selected(result):
    return [key["claim_ref"] for key in result["selected_order"]]


class ScheduleTests(unittest.TestCase):
    def test_read_only_deterministic_and_selected_stale_never_fresh(self):
        p, rules = projection(row()), policy(claim())
        before = deepcopy((p, rules))
        first = scheduler.build_schedule(p, rules, NOW)
        self.assertEqual(first, scheduler.build_schedule(p, rules, NOW))
        self.assertEqual((p, rules), before)
        self.assertEqual(selected(first), ["c1"])
        self.assertEqual(first["items"][0]["freshness_state"], "STALE")
        self.assertIn("no check", first["authority_state"])

    def test_failed_or_absent_verification_and_partial_projection_fail_closed(self):
        for value in (None, "FAILED", "NOT_ESTABLISHED_FIXTURE"):
            p = projection(row())
            p["source_verification"] = value
            with self.assertRaisesRegex(ValueError, "verification"):
                scheduler.build_schedule(p, policy(claim()), NOW)
        p = projection(row())
        p["since_exclusive"] = 0
        with self.assertRaisesRegex(ValueError, "complete projection"):
            scheduler.build_schedule(p, policy(claim()), NOW)

    def test_duplicate_json_keys_rows_and_policies(self):
        with self.assertRaisesRegex(ValueError, "duplicate JSON key"):
            scheduler.read_json_bytes(b'{"budget_units":1,"budget_units":2}')
        p = projection(row(), row())
        result = scheduler.build_schedule(p, policy(claim(), claim()), NOW)
        self.assertEqual(result["duplicate_reaction_rows_collapsed"], 1)
        self.assertEqual(result["duplicate_claim_policies_collapsed"], 1)
        self.assertEqual(len(selected(result)), 1)
        with self.assertRaisesRegex(ValueError, "conflicting duplicate event_seq"):
            scheduler.build_schedule(projection(row(), row(state="RECHECK_REQUIRED")), policy(claim()), NOW)
        with self.assertRaisesRegex(ValueError, "conflicting duplicate claim policy"):
            scheduler.build_schedule(projection(row()), policy(claim(), claim(estimated_cost_units=3)), NOW)

    def test_retry_has_own_action_and_backoff_and_never_establishes_change(self):
        p = projection(row(state="SOURCE_RETRY_REQUIRED"))
        result = scheduler.build_schedule(p, policy(claim(retry_at="2026-11-07T13:00:00Z")), NOW)
        item = result["items"][0]
        self.assertEqual(item["action"], "SOURCE_RETRY")
        self.assertEqual(item["decision_reason"], "RETRY_BACKOFF")
        self.assertFalse(item["mandatory"])
        self.assertEqual(item["reactions"][0]["reaction_state"], "SOURCE_RETRY_REQUIRED")
        result = scheduler.build_schedule(p, policy(claim(retry_at="2026-11-07T11:00:00Z")), NOW)
        self.assertEqual(selected(result), ["c1"])
        self.assertEqual(result["items"][0]["freshness_state"], "STALE")
        result = scheduler.build_schedule(p, policy(claim(last_success_at="2026-11-07T11:30:00Z")), NOW)
        self.assertEqual(result["items"][0]["decision_reason"], "MISSING_RETRY_AT")
        self.assertEqual(result["items"][0]["freshness_state"], "UNKNOWN")

    def test_failed_read_does_not_clear_recheck_and_receipt_does_not_clear_retry(self):
        p = projection(row(state="RECHECK_REQUIRED", receipt_state="DELIVERY_RECEIPT"),
                       row(state="SOURCE_RETRY_REQUIRED", seq=1),
                       row(state="DELIVERY_RECEIPT", seq=2, receipt_state="DELIVERY_RECEIPT"))
        result = scheduler.build_schedule(p, policy(claim(retry_at="2026-11-07T13:00:00Z")), NOW)
        item = result["items"][0]
        self.assertEqual(item["action"], "SOURCE_RETRY")
        self.assertTrue(item["mandatory"])
        self.assertEqual(item["freshness_state"], "STALE")
        self.assertEqual(item["decision_reason"], "RETRY_BACKOFF")
        self.assertEqual(item["reactions"][0]["receipt_state"], "DELIVERY_RECEIPT")
        self.assertEqual(result["n_unmet_mandatory"], 1)

    def test_no_change_or_receipt_does_not_discharge_historical_recheck(self):
        p = projection(row(state="RECHECK_REQUIRED"), row(seq=1),
                       row(state="DELIVERY_RECEIPT", seq=2))
        result = scheduler.build_schedule(p, policy(claim(last_success_at="2026-11-07T11:59:00Z")), NOW)
        self.assertTrue(result["items"][0]["mandatory"])
        self.assertEqual(result["items"][0]["freshness_state"], "STALE")
        self.assertEqual(result["items"][0]["action"], "RECHECK")

    def test_no_change_does_not_assert_same_source_retry_resolution(self):
        p = projection(row(state="SOURCE_RETRY_REQUIRED"), row(seq=1))
        result = scheduler.build_schedule(p, policy(claim(retry_at="2026-11-07T11:00:00Z")), NOW)
        self.assertEqual(result["items"][0]["action"], "SOURCE_RETRY")

    def test_deadlines_budget_and_item_bound_are_hard(self):
        p = projection(row("large", seq=0), row("due", seq=1), row("ordinary", seq=2))
        rules = policy(claim("large", estimated_cost_units=8, deadline_at="2026-11-07T09:00:00Z"),
                       claim("due", deadline_at="2026-11-07T10:00:00Z"), claim("ordinary"),
                       budget_units=3, max_items=1)
        result = scheduler.build_schedule(p, rules, NOW)
        self.assertEqual(selected(result), ["due"])
        self.assertEqual(result["spent_cost_units"], 2)
        self.assertEqual(result["unfunded_ready_mandatory_cost_units"], 8)
        self.assertEqual(result["n_due_deadlines_not_selected"], 1)
        self.assertEqual(result["items"][1]["decision_reason"], "UNFUNDED_MANDATORY")
        result = scheduler.build_schedule(p, {**rules, "budget_units": 0}, NOW)
        self.assertEqual(selected(result), [])
        self.assertEqual(result["spent_cost_units"], 0)
        result = scheduler.build_schedule(p, {**rules, "max_items": 0}, NOW)
        self.assertEqual(selected(result), [])

    def test_unknown_exploration_reserved_before_discretionary_priority(self):
        p = projection(row("old", seq=0), row("unknown", seq=1))
        rules = policy(claim("old", impact_weight=100),
                       claim("unknown", last_success_at=None, first_pending_at="2026-11-07T08:00:00Z"),
                       budget_units=2)
        result = scheduler.build_schedule(p, rules, NOW)
        self.assertEqual(selected(result), ["unknown"])
        self.assertEqual(result["items"][1]["decision_reason"], "EXPLORATION")
        self.assertEqual(result["items"][1]["freshness_state"], "UNKNOWN")

    def test_wait_limit_promotes_but_does_not_promise_capacity(self):
        p = projection(row("waiter", seq=0), row("high", seq=1))
        rules = policy(claim("waiter", first_pending_at="2026-11-07T10:00:00Z"),
                       claim("high", impact_weight=100), max_wait_seconds=3600, budget_units=2,
                       exploration_slots=0)
        result = scheduler.build_schedule(p, rules, NOW)
        self.assertEqual(selected(result), ["waiter"])
        self.assertTrue(result["items"][1]["wait_limit_due"])
        result = scheduler.build_schedule(p, {**rules, "budget_units": 0}, NOW)
        self.assertEqual(result["n_unmet_mandatory"], 1)

    def test_cycles_fanout_cap_and_graph_completeness_are_explicit(self):
        p = projection(row())
        rules = policy(claim(dependency_graph_complete=True),
                       dependencies=[["c1", "a"], ["a", "c1"], ["a", "b"], ["b", "c"]],
                       max_dependency_count=2)
        result = scheduler.build_schedule(p, rules, NOW)
        item = result["items"][0]
        self.assertEqual(item["known_affected_dependency_count"], 2)
        self.assertTrue(item["dependency_count_capped"])
        self.assertFalse(item["dependency_graph_complete"])

    def test_missing_reaction_disallowed_provider_and_global_rows_do_not_spawn_work(self):
        p = projection(row("*"), row(None, state="BASELINE_ONLY", seq=1))
        result = scheduler.build_schedule(p, policy(claim()), NOW)
        self.assertEqual(selected(result), [])
        self.assertEqual(result["items"][0]["decision_reason"], "MISSING_REACTION_EVIDENCE")
        p = projection(row())
        result = scheduler.build_schedule(p, policy(claim(provider_id="unapproved")), NOW)
        self.assertEqual(result["items"][0]["decision_reason"], "PROVIDER_NOT_ALLOWED")

    def test_bad_cost_timestamps_and_boolean_numbers_reject(self):
        for update in ({"estimated_cost_units": 0}, {"estimated_cost_units": True},
                       {"last_success_at": "2026-11-08T00:00:00Z"},
                       {"last_success_at": "2026-11-07T09:00:00+00:00"},
                       {"known_stale": "false"}):
            with self.assertRaises(ValueError):
                scheduler.build_schedule(projection(row()), policy(claim(**update)), NOW)

    def test_summary_or_sequence_truncation_rejects(self):
        p = projection(row(), row(seq=1))
        p["reactions"].pop()
        with self.assertRaisesRegex(ValueError, "summary"):
            scheduler.build_schedule(p, policy(claim()), NOW)
        p = projection(row(seq=1))
        with self.assertRaisesRegex(ValueError, "contiguous"):
            scheduler.build_schedule(p, policy(claim()), NOW)
        p = projection(row())
        p["by_state"]["NO_CHANGE"] = True
        with self.assertRaisesRegex(ValueError, "summary"):
            scheduler.build_schedule(p, policy(claim()), NOW)

    def test_output_excludes_arbitrary_text_and_unsupported_subject_ids(self):
        canary = "PRIVATE_REPORT_TEXT_CANARY"
        p = projection(row(reason=canary, report_text=canary, recommended_checks=[canary],
                           counter_reaction={"required": False, "checks": [canary], "boundary": canary}))
        result = scheduler.build_schedule(p, policy(claim(report_text=canary)), NOW)
        self.assertNotIn(canary, json.dumps(result))
        with self.assertRaisesRegex(ValueError, "sealed identifier"):
            scheduler.build_schedule(projection(row(subject_sealed_id="Person Name")), policy(claim()), NOW)

    def test_missing_observation_time_is_not_scheduled(self):
        result = scheduler.build_schedule(projection(row(observed_at=None)), policy(claim()), NOW)
        self.assertEqual(selected(result), [])
        self.assertEqual(result["items"][0]["decision_reason"], "MISSING_OBSERVATION_TIME")

    def test_bounded_regular_files_refuse_symlinks_fifos_and_oversize(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            regular = root / "small.json"
            regular.write_bytes(b"{}")
            self.assertEqual(scheduler.read_regular_file(regular), b"{}")
            link = root / "link.json"
            link.symlink_to(regular)
            with self.assertRaises(OSError):
                scheduler.read_regular_file(link)
            fifo = root / "fifo"
            os.mkfifo(fifo)
            with self.assertRaises(ValueError):
                scheduler.read_regular_file(fifo)
            large = root / "large.json"
            with large.open("wb") as stream:
                stream.truncate(scheduler.MAX_INPUT_BYTES + 1)
            with self.assertRaises(ValueError):
                scheduler.read_regular_file(large)

    def test_fractional_deadline_sort_uses_instants(self):
        p = projection(row("whole"), row("fraction", seq=1))
        result = scheduler.build_schedule(p, policy(
            claim("whole", deadline_at="2026-11-07T10:00:00Z"),
            claim("fraction", deadline_at="2026-11-07T10:00:00.1Z"), budget_units=2), NOW)
        self.assertEqual(selected(result), ["whole"])

    def test_live_captured_projection_has_no_change_trigger_and_policy_is_separate(self):
        live = json.loads((FIXTURES / "live-reactions.json").read_text())
        rules = json.loads((FIXTURES / "example-policy.json").read_text())
        result = scheduler.build_schedule(live, rules, NOW)
        self.assertEqual(len(live["reactions"]), 9)
        self.assertFalse(any(i["mandatory"] for i in result["items"]))
        self.assertFalse(any(r["reaction_state"] == "RECHECK_REQUIRED" for r in live["reactions"]))
        self.assertEqual(len(result["items"]), 4)
        self.assertLessEqual(result["spent_cost_units"], rules["budget_units"])

    def test_cli_digest_and_json_rejection(self):
        args = [sys.executable, str(ROOT / "recheck_schedule.py"), str(FIXTURES / "live-reactions.json"),
                str(FIXTURES / "example-policy.json"), "--as-of", NOW]
        result = subprocess.run(args, capture_output=True, text=True, check=True)
        self.assertEqual(json.loads(result.stdout)["projection_bytes_sha256"],
                         hashlib.sha256((FIXTURES / "live-reactions.json").read_bytes()).hexdigest())
        result = subprocess.run(args + ["--projection-sha256", "0" * 64], capture_output=True, text=True)
        self.assertEqual(result.returncode, 2)
        self.assertEqual(json.loads(result.stdout)["status"], "REJECTED")

    def test_cli_deep_json_rejects_as_json_without_traceback(self):
        with tempfile.TemporaryDirectory() as directory:
            nested = Path(directory) / "nested.json"
            nested.write_text("[" * 2000 + "0" + "]" * 2000)
            result = subprocess.run([sys.executable, str(ROOT / "recheck_schedule.py"), str(nested),
                str(FIXTURES / "example-policy.json"), "--as-of", NOW], capture_output=True, text=True)
            self.assertEqual(result.returncode, 2)
            self.assertEqual(json.loads(result.stdout)["status"], "REJECTED")
            self.assertEqual(result.stderr, "")


if __name__ == "__main__":
    unittest.main()
