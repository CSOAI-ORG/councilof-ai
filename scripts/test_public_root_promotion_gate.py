#!/usr/bin/env python3
"""The public-root promotion gate must merge the bytes whose gates ran, and no other bytes.

THE DEFECT THESE CASES SHIP WITH. The promotion gate lived as shell in
.github/workflows/public-root-candidate-upgrade.yml and read the candidate's head ONCE, from the
pull request's headRefOid, at the moment the job had just pushed the upgraded proof. That view
LAGS the branch by seconds after a push, so on 2026-10-26 the step read 9e6f0cc70 - the commit
BEFORE the proof upgrade - while the branch had already moved to d43b1a605. It watched a
pr-gates run for those older bytes and halted the promotion with "HALT: pr-gates run 40301090584
did not pass on 9e6f0cc70", even though the proof was CONFIRMED_BITCOIN and the candidate's gates
were queued on the exact head.

Pinned here:
  * the head is the BRANCH REF, never the pull request's view of it;
  * a gate run for other bytes is never selected and never merged;
  * if the branch moves while the gates run, the gates run again on the new head - the new head
    is never merged on the old head's pass;
  * a failed gate run halts, and the candidate stays open for a human;
  * a run awaiting approval is approved before it is watched.

No network: the GitHub calls are a fake.
"""
from __future__ import annotations

import importlib.util
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))


def _load():
    spec = importlib.util.spec_from_file_location(
        "public_root_promotion_gate", os.path.join(HERE, "public_root_promotion_gate.py")
    )
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


gate = _load()

HEAD_OLD = "9e6f0cc70652046c89ce12453993f87944fe2a45"
HEAD_NEW = "d43b1a6059289f2ca18be16d67abb5a13aa683fa"
HEAD_MOVED = "c0ffee1111111111111111111111111111111111"


ALL_GREEN = {"gates": "success", "build": "success", "stamped-bytes": "success",
             "hold-guard": "success"}
REQUIRED = ["gates", "build", "stamped-bytes", "hold-guard"]


class FakeGitHub:
    def __init__(self, heads, runs, watch_results=None, contexts=None, required=None):
        self.heads = list(heads)          # consumed one per branch_head() call
        self.run_rows = runs              # list of run dicts
        self.watch_results = list(watch_results or [True])
        self.dispatched = []
        self.approved = []
        self.merged = []
        self.watched = []
        # The status-check contexts the repo requires, and their conclusions on the head.
        self.required = list(required if required is not None else REQUIRED)
        self.contexts = dict(contexts if contexts is not None else ALL_GREEN)

    def branch_head(self, repo, branch):
        return self.heads.pop(0) if len(self.heads) > 1 else self.heads[0]

    def runs(self, repo, workflow, branch):
        return self.run_rows

    def required_contexts(self, repo, branch="master"):
        return list(self.required)

    def context_conclusions(self, repo, head):
        return dict(self.contexts)

    def dispatch(self, repo, workflow, ref):
        self.dispatched.append(ref)

    def approve(self, repo, run_id):
        self.approved.append(run_id)
        return True

    def watch(self, repo, run_id):
        self.watched.append(run_id)
        return self.watch_results.pop(0) if self.watch_results else True

    def merge(self, repo, url, head):
        self.merged.append(head)
        return 0, "", ""


def run_promote(fake, max_cycles=6):
    return gate.promote(fake, "CSOAI-ORG/councilof-ai", "public-root/pending",
                        "https://github.com/CSOAI-ORG/councilof-ai/pull/3501",
                        max_cycles=max_cycles, pause=0, sleep=lambda _s: None,
                        log=lambda *_a, **_k: None)


class PromotionGateTest(unittest.TestCase):
    def test_the_head_is_the_branch_ref_not_the_pull_request_view(self):
        """The PR's headRefOid lags the branch after a push. The gate reads the ref."""
        fake = FakeGitHub(
            heads=[HEAD_NEW],
            runs=[{"databaseId": 1, "headSha": HEAD_NEW, "status": "queued", "conclusion": None}],
        )
        run_promote(fake)
        self.assertEqual(fake.merged, [HEAD_NEW])

    def test_a_run_for_other_bytes_is_never_merged(self):
        """The defect: the old head's run was watched, then the merge named the new head."""
        fake = FakeGitHub(
            heads=[HEAD_NEW],
            runs=[{"databaseId": 7, "headSha": HEAD_OLD, "status": "queued", "conclusion": None}],
        )
        verdict = run_promote(fake)
        self.assertIn("HALT", verdict)
        self.assertEqual(fake.merged, [])
        self.assertNotIn(7, fake.watched)

    def test_a_failed_gate_run_halts_and_merges_nothing(self):
        fake = FakeGitHub(
            heads=[HEAD_NEW],
            runs=[{"databaseId": 9, "headSha": HEAD_NEW, "status": "queued", "conclusion": None}],
            watch_results=[False],
        )
        verdict = run_promote(fake)
        self.assertIn("HALT", verdict)
        self.assertIn("stays open for a human", verdict)
        self.assertEqual(fake.merged, [])

    def test_a_branch_that_moves_during_the_gates_is_not_merged_on_the_old_pass(self):
        """A pass on older bytes must never merge newer bytes: the gates re-run instead."""
        fake = FakeGitHub(
            heads=[HEAD_NEW, HEAD_MOVED, HEAD_MOVED, HEAD_MOVED],
            runs=[{"databaseId": 11, "headSha": HEAD_NEW, "status": "queued", "conclusion": None},
                  {"databaseId": 12, "headSha": HEAD_MOVED, "status": "queued", "conclusion": None}],
            watch_results=[True],
        )
        verdict = run_promote(fake)
        self.assertNotIn(HEAD_NEW, fake.merged)
        self.assertEqual(fake.merged, [HEAD_MOVED])
        self.assertTrue(verdict.startswith("merged"))

    def test_a_run_awaiting_approval_is_approved_before_it_is_watched(self):
        fake = FakeGitHub(
            heads=[HEAD_NEW],
            runs=[{"databaseId": 13, "headSha": HEAD_NEW, "status": "completed",
                   "conclusion": "action_required"}],
        )
        run_promote(fake)
        self.assertEqual(fake.approved, [13])
        self.assertEqual(fake.watched, [13])

    def test_no_run_for_the_head_dispatches_one(self):
        fake = FakeGitHub(heads=[HEAD_NEW], runs=[])
        verdict = run_promote(fake, max_cycles=2)
        self.assertTrue(fake.dispatched)
        self.assertIn("public-root/pending", fake.dispatched)
        self.assertIn("HALT", verdict)
        self.assertEqual(fake.merged, [])

    def test_a_successful_run_on_the_current_head_merges_exactly_that_commit(self):
        fake = FakeGitHub(
            heads=[HEAD_NEW],
            runs=[{"databaseId": 15, "headSha": HEAD_NEW, "status": "completed",
                   "conclusion": "success"}],
        )
        verdict = run_promote(fake)
        self.assertTrue(verdict.startswith("merged"))
        self.assertEqual(fake.merged, [HEAD_NEW])

    # ---- the required-contexts rule -------------------------------------------
    def test_a_required_context_that_is_skipped_blocks_the_merge(self):
        """`hold-guard` is declared `if: github.event_name == 'pull_request'`, so a
        workflow_dispatch run reports it SKIPPED, and a skipped required check does not
        satisfy branch protection. The merge must not happen on a green run that skipped
        a context the repo requires."""
        fake = FakeGitHub(
            heads=[HEAD_NEW],
            runs=[{"databaseId": 21, "headSha": HEAD_NEW, "status": "completed",
                   "conclusion": "success", "event": "workflow_dispatch"}],
            contexts={**ALL_GREEN, "hold-guard": "skipped"},
        )
        verdict = run_promote(fake, max_cycles=3)
        self.assertEqual(fake.merged, [])
        self.assertIn("HALT", verdict)

    def test_a_required_context_that_is_cancelled_blocks_the_merge(self):
        """A context that was green and was then re-run and cancelled is not satisfied:
        branch protection reads the LATEST check run for each context."""
        fake = FakeGitHub(
            heads=[HEAD_NEW],
            runs=[{"databaseId": 22, "headSha": HEAD_NEW, "status": "completed",
                   "conclusion": "success", "event": "pull_request"}],
            contexts={**ALL_GREEN, "stamped-bytes": "cancelled"},
        )
        verdict = run_promote(fake, max_cycles=3)
        self.assertEqual(fake.merged, [])
        self.assertIn("HALT", verdict)

    def test_the_merge_waits_for_the_contexts_and_happens_once_they_are_green(self):
        """The gate may watch a run that turns the contexts green, and then merge."""
        fake = FakeGitHub(
            heads=[HEAD_NEW],
            runs=[{"databaseId": 23, "headSha": HEAD_NEW, "status": "queued",
                   "conclusion": None, "event": "pull_request"}],
            contexts={**ALL_GREEN, "hold-guard": "skipped"},
        )

        # The first cycle sees the skipped context and watches the run; the second sees green.
        original = fake.context_conclusions
        calls = {"n": 0}

        def conclusions(repo, head):
            calls["n"] += 1
            if calls["n"] == 1:
                return {**ALL_GREEN, "hold-guard": "skipped"}
            return dict(ALL_GREEN)

        fake.context_conclusions = conclusions
        verdict = run_promote(fake, max_cycles=4)
        # The run is watched on the cycle where the contexts are not yet green and again on the
        # cycle where they are; what matters is that the merge happened, and only after they were.
        self.assertTrue(fake.watched)
        self.assertTrue(all(w == 23 for w in fake.watched))
        self.assertEqual(fake.merged, [HEAD_NEW])
        self.assertTrue(verdict.startswith("merged"))

    def test_a_pull_request_run_is_preferred_over_a_dispatched_one(self):
        """Only a pull_request run produces the hold-guard context, so the gate must not
        watch a workflow_dispatch run when a pull_request run exists for the same bytes."""
        fake = FakeGitHub(
            heads=[HEAD_NEW],
            runs=[{"databaseId": 31, "headSha": HEAD_NEW, "status": "queued",
                   "conclusion": None, "event": "workflow_dispatch"},
                  {"databaseId": 32, "headSha": HEAD_NEW, "status": "queued",
                   "conclusion": None, "event": "pull_request"}],
        )
        run_promote(fake)
        self.assertEqual(fake.watched, [32])
        self.assertNotIn(31, fake.watched)


if __name__ == "__main__":
    unittest.main()
