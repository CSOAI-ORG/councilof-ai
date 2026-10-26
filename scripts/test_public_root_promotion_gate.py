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


class FakeGitHub:
    def __init__(self, heads, runs, watch_results=None):
        self.heads = list(heads)          # consumed one per branch_head() call
        self.run_rows = runs              # list of run dicts
        self.watch_results = list(watch_results or [True])
        self.dispatched = []
        self.approved = []
        self.merged = []
        self.watched = []

    def branch_head(self, repo, branch):
        return self.heads.pop(0) if len(self.heads) > 1 else self.heads[0]

    def runs(self, repo, workflow, branch):
        return self.run_rows

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


if __name__ == "__main__":
    unittest.main()
