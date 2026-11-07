"""Offline fixtures: no GitHub requests or workflow dispatches."""
import copy
import unittest
from unittest.mock import patch
from types import SimpleNamespace

import bot_checks_sweeper as sweeper

REPO = "CSOAI-ORG/councilof-ai"


def pr(number, sha=None, **changes):
    value = {"number": number, "state": "open", "draft": False,
             "created_at": f"2026-11-01T00:{number:02d}:00Z",
             "head": {"sha": sha or f"{number:040x}", "ref": f"repair-{number}",
                      "repo": {"full_name": REPO}}}
    value.update(changes)
    return value


class FakeGitHub:
    repo = REPO

    def __init__(self, prs, histories=None):
        self.items = prs
        self.histories = histories or {}
        self.fresh = {item["number"]: copy.deepcopy(item) for item in prs}
        self.dispatched = []
        self.calls = []
        self.second = {}

    def pulls(self):
        return self.items

    def pull(self, number):
        return self.fresh[number]

    def history(self, sha):
        self.calls.append(sha)
        value = self.second.get(sha, self.histories.get(sha, ([], []))) if self.calls.count(sha) > 1 else self.histories.get(sha, ([], []))
        if isinstance(value, Exception):
            raise value
        return value

    def dispatch(self, item):
        self.dispatched.append(item["number"])


class SweepTests(unittest.TestCase):
    def test_missing_head_is_dispatched_once(self):
        api = FakeGitHub([pr(1)])
        result = sweeper.sweep(api)
        self.assertEqual(api.dispatched, [1])
        self.assertEqual(result["dispatch_requested"], [{"pr": 1, "head_sha": pr(1)["head"]["sha"]}])
        self.assertEqual(len(api.calls), 2)

    def test_failed_unchanged_gate_never_retries(self):
        sha = pr(1)["head"]["sha"]
        for conclusion in ("failure", "cancelled", "timed_out", "skipped", "neutral", "action_required", "success"):
            with self.subTest(conclusion=conclusion):
                api = FakeGitHub([pr(1)], {sha: ([{"head_sha": sha, "name": "gates", "status": "completed", "conclusion": conclusion}], [])})
                sweeper.sweep(api)
                self.assertEqual(api.dispatched, [])

    def test_prior_run_without_gate_never_retries(self):
        sha = pr(1)["head"]["sha"]
        for status, conclusion in (("completed", "failure"), ("completed", "cancelled"), ("completed", "timed_out"), ("completed", "success"), ("queued", None), ("in_progress", None), ("waiting", None), ("pending", None), ("requested", None)):
            with self.subTest(status=status, conclusion=conclusion):
                api = FakeGitHub([pr(1)], {sha: ([], [{"id": 123, "head_sha": sha, "status": status, "conclusion": conclusion}])})
                sweeper.sweep(api)
                self.assertEqual(api.dispatched, [])

    def test_active_gate_and_late_native_run_are_not_duplicated(self):
        sha = pr(1)["head"]["sha"]
        for status in ("queued", "in_progress", "waiting", "pending", "requested"):
            with self.subTest(status=status):
                history = ([{"head_sha": sha, "name": "gates", "status": status}], [])
                for appears_late in (False, True):
                    api = FakeGitHub([pr(1)], {} if appears_late else {sha: history})
                    if appears_late:
                        api.second[sha] = history
                    sweeper.sweep(api)
                    self.assertEqual(api.dispatched, [])

    def test_old_head_failure_does_not_block_a_new_head(self):
        old_sha, new_sha = "a" * 40, "b" * 40
        api = FakeGitHub([pr(1, new_sha)], {old_sha: ([], [{"head_sha": old_sha, "status": "completed", "conclusion": "failure"}])})
        sweeper.sweep(api)
        self.assertEqual(api.dispatched, [1])
        self.assertEqual(api.calls, [new_sha, new_sha])

    def test_cap_and_order_are_stable(self):
        items = [pr(i) for i in (5, 3, 1, 4, 2)]
        items[2]["created_at"] = items[4]["created_at"]
        api = FakeGitHub(items)
        result = sweeper.sweep(api)
        self.assertEqual(api.dispatched, [1, 2, 3])
        self.assertEqual(result["cap"], 3)

    def test_drafts_forks_closed_and_deleted_forks_are_excluded(self):
        items = [pr(1, draft=True), pr(2), pr(3, state="closed"), pr(4)]
        items[1]["head"]["repo"]["full_name"] = "fork/example"
        items[3]["head"]["repo"] = None
        api = FakeGitHub(items)
        sweeper.sweep(api)
        self.assertEqual(api.calls, [])
        self.assertEqual(api.dispatched, [])

    def test_changed_head_ref_or_state_is_refused(self):
        for field in ("sha", "ref", "draft", "closed", "number"):
            with self.subTest(field=field):
                api = FakeGitHub([pr(1)])
                if field in ("sha", "ref"):
                    api.fresh[1]["head"][field] = "c" * 40
                elif field == "draft":
                    api.fresh[1]["draft"] = True
                elif field == "number":
                    api.fresh[1]["number"] = 2
                else:
                    api.fresh[1]["state"] = "closed"
                sweeper.sweep(api)
                self.assertEqual(api.dispatched, [])

    def test_same_head_in_two_prs_is_not_dispatched_twice(self):
        api = FakeGitHub([pr(1, "a" * 40), pr(2, "a" * 40)])
        sweeper.sweep(api)
        self.assertEqual(api.dispatched, [1])

    def test_discovery_error_stops_without_dispatch(self):
        api = FakeGitHub([pr(1), pr(2)], {pr(1)["head"]["sha"]: sweeper.DiscoveryError("unreadable")})
        with self.assertRaises(sweeper.DiscoveryError):
            sweeper.sweep(api)
        self.assertEqual(api.dispatched, [])

    def test_malformed_pr_is_rejected_before_any_dispatch(self):
        invalid = pr(2)
        del invalid["head"]["sha"]
        api = FakeGitHub([pr(1), invalid])
        with self.assertRaises(sweeper.DiscoveryError):
            sweeper.sweep(api)
        self.assertEqual(api.dispatched, [])

    def test_dispatch_error_stops_subsequent_attempts(self):
        api = FakeGitHub([pr(1), pr(2)])
        with patch.object(api, "dispatch", side_effect=sweeper.DiscoveryError("ambiguous response")) as dispatch:
            with self.assertRaises(sweeper.DiscoveryError):
                sweeper.sweep(api)
            self.assertEqual(dispatch.call_count, 1)

    def test_late_history_error_stops_without_dispatch(self):
        api = FakeGitHub([pr(1)])
        api.second[pr(1)["head"]["sha"]] = sweeper.DiscoveryError("late API failure")
        with self.assertRaises(sweeper.DiscoveryError):
            sweeper.sweep(api)
        self.assertEqual(api.dispatched, [])


class HistoryTests(unittest.TestCase):
    def test_gate_on_second_page_is_retained(self):
        sha = "a" * 40
        other = [{"head_sha": sha, "name": f"other-{i}"} for i in range(100)]
        pages = [{"total_count": 101, "check_runs": other}, {"total_count": 101, "check_runs": [{"head_sha": sha, "name": "gates"}]}]
        self.assertEqual(sweeper.eligibility(sweeper.records(pages, "check_runs"), [], sha), "gates_already_present")

    def test_empty_history_requires_explicit_zero_and_complete_pages(self):
        self.assertEqual(sweeper.records([{"total_count": 0, "workflow_runs": []}], "workflow_runs"), [])
        for pages in ([], {}, [{}], [{"total_count": 1, "workflow_runs": []}], [{"total_count": 0}], [{"total_count": 0, "workflow_runs": [None]}], [{"total_count": 0, "workflow_runs": []}, {"total_count": 1, "workflow_runs": []}]):
            with self.subTest(pages=pages), self.assertRaises(sweeper.DiscoveryError):
                sweeper.records(pages, "workflow_runs")

    def test_wrong_head_and_unreadable_check_names_fail_closed(self):
        for checks, runs in (([{"head_sha": "b" * 40, "name": "other"}], []), ([{"head_sha": "a" * 40}], []), ([], [{"head_sha": "b" * 40}])):
            with self.subTest(checks=checks, runs=runs), self.assertRaises(sweeper.DiscoveryError):
                sweeper.eligibility(checks, runs, "a" * 40)

    def test_gh_http_error_and_bad_json_fail_closed(self):
        for response in (SimpleNamespace(returncode=1, stdout=""), SimpleNamespace(returncode=0, stdout="not-json")):
            with patch.object(sweeper.subprocess, "run", return_value=response), self.assertRaises(sweeper.DiscoveryError):
                sweeper.GitHub(REPO).pulls()

    def test_history_requests_every_page_and_all_attempts(self):
        api = sweeper.GitHub(REPO)
        responses = ['[{"total_count":0,"check_runs":[]}]', '[{"total_count":0,"workflow_runs":[]}]']
        with patch.object(api, "gh", side_effect=responses) as gh:
            self.assertEqual(api.history("a" * 40), ([], []))
        for call in gh.call_args_list:
            self.assertIn("--paginate", call.args[0])
            self.assertIn("--slurp", call.args[0])
        self.assertIn("filter=all", gh.call_args_list[0].args[0][1])
        self.assertIn("head_sha=" + "a" * 40, gh.call_args_list[1].args[0][1])

    def test_existing_gate_avoids_unneeded_workflow_history_request(self):
        api = sweeper.GitHub(REPO)
        body = '[{"total_count":1,"check_runs":[{"head_sha":"' + "a" * 40 + '","name":"gates"}]}]'
        with patch.object(api, "gh", return_value=body) as gh:
            checks, runs = api.history("a" * 40)
        self.assertEqual(sweeper.eligibility(checks, runs, "a" * 40), "gates_already_present")
        self.assertEqual(gh.call_count, 1)


if __name__ == "__main__":
    unittest.main()
