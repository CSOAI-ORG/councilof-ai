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
import json
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


def _denied(argv):
    """What the promotion workflow's own GITHUB_TOKEN sees on the protection endpoint.

    Measured 2026-10-26 in run 40322739137: reading branch protection needs admin permission
    on the repository, and the workflow's token does not have it. The gate died there, at the
    exact moment the candidate's gates had passed.
    """
    return 1, "", "gh: Resource not accessible by integration (HTTP 403)"


class FakeGitHub:
    def __init__(self, heads, runs, watch_results=None, contexts=None, required=None,
                 protection_readable=True, all_runs=None):
        self.heads = list(heads)          # consumed one per branch_head() call
        self.run_rows = runs              # list of run dicts
        self.all_run_rows = all_runs      # every workflow's run on the branch
        self.watch_results = list(watch_results or [True])
        self.dispatched = []
        self.approved = []
        self.reran = []
        self.merged = []
        self.watched = []
        # The status-check contexts the repo requires, and their conclusions on the head.
        self.required = list(required if required is not None else REQUIRED)
        self.contexts = dict(contexts if contexts is not None else ALL_GREEN)
        self.protection_readable = protection_readable

    def branch_head(self, repo, branch):
        return self.heads.pop(0) if len(self.heads) > 1 else self.heads[0]

    def runs(self, repo, workflow, branch):
        return self.run_rows

    def all_runs(self, repo, branch):
        return self.all_run_rows if self.all_run_rows is not None else self.run_rows

    def required_contexts(self, repo, branch="master", log=None):
        if not self.protection_readable:
            # the real implementation, with the token the workflow actually has
            return gate.GitHub(runner=_denied).required_contexts(repo, branch, log=log)
        return list(self.required)

    def context_conclusions(self, repo, head):
        return dict(self.contexts)

    def dispatch(self, repo, workflow, ref):
        self.dispatched.append(ref)

    def approve(self, repo, run_id):
        self.approved.append(run_id)
        return True

    def rerun(self, repo, run_id):
        self.reran.append(run_id)
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

    # ---- the protection read must never be able to stop the gate -------------
    #
    # THE DEFECT THESE CASES SHIP WITH. The gate read the required contexts from the repo's
    # branch protection. That endpoint needs admin permission on the repository, and the
    # promotion workflow's GITHUB_TOKEN does not have it: on 2026-10-26 the gate raised
    # "gh api repos/.../branches/master/protection/required_status_checks failed (1):
    # Resource not accessible by integration (HTTP 403)" in run 40322739137 - at the exact
    # moment the candidate's gates had PASSED and it was ready to merge. The gate died on the
    # one call it made after the evidence it needed was already in hand.

    def test_the_required_contexts_survive_a_protection_read_the_token_cannot_make(self):
        gh = gate.GitHub(runner=_denied)
        contexts = gh.required_contexts("CSOAI-ORG/councilof-ai")
        self.assertEqual(sorted(contexts), sorted(gate.REQUIRED_CONTEXTS))

    def test_a_protection_read_that_names_no_contexts_still_gates_on_the_recorded_four(self):
        """A protection rule that names a context in `checks` but not in `contexts` reads back
        as an EMPTY list, and a gate that checks an empty list checks nothing."""
        gh = gate.GitHub(runner=lambda argv: (0, json.dumps({"contexts": [], "checks": []}), ""))
        contexts = gh.required_contexts("CSOAI-ORG/councilof-ai")
        self.assertEqual(sorted(contexts), sorted(gate.REQUIRED_CONTEXTS))

    def test_a_live_protection_read_adds_to_the_recorded_floor_and_never_replaces_it(self):
        gh = gate.GitHub(runner=lambda argv: (0, json.dumps({
            "contexts": ["gates", "build", "stamped-bytes", "hold-guard", "brand-gate"],
            "checks": [{"app_id": 15368, "context": "brand-gate"}],
        }), ""))
        contexts = gh.required_contexts("CSOAI-ORG/councilof-ai")
        self.assertIn("brand-gate", contexts)
        for name in gate.REQUIRED_CONTEXTS:
            self.assertIn(name, contexts)

    def test_a_live_protection_read_that_is_smaller_than_the_floor_cannot_weaken_it(self):
        """The live read is ADDED to the floor. If the live read names fewer contexts than the
        floor, the floor still applies - a shrinking read must never be able to shrink the gate."""
        gh = gate.GitHub(runner=lambda argv: (0, json.dumps({
            "contexts": ["gates"],
            "checks": [{"app_id": 15368, "context": "gates"}],
        }), ""))
        contexts = gh.required_contexts("CSOAI-ORG/councilof-ai")
        for name in gate.REQUIRED_CONTEXTS:
            self.assertIn(name, contexts)

    def test_a_context_named_only_in_checks_is_still_required(self):
        """`checks` and `contexts` are two lists for the same rule. A context that appears in
        only one of them is still required, and the one used here is deliberately NOT one of
        the recorded four, so this case cannot pass on the floor alone."""
        gh = gate.GitHub(runner=lambda argv: (0, json.dumps({
            "contexts": [],
            "checks": [{"app_id": 15368, "context": "brand-gate"}],
        }), ""))
        contexts = gh.required_contexts("CSOAI-ORG/councilof-ai")
        self.assertIn("brand-gate", contexts)

    def test_the_gate_merges_when_the_protection_read_is_denied_and_the_head_is_green(self):
        """The regression this ships with: with the workflow's own token, the gate used to
        raise and merge nothing. It must still merge the gated head."""
        fake = FakeGitHub(
            heads=[HEAD_NEW],
            runs=[{"databaseId": 41, "headSha": HEAD_NEW, "status": "completed",
                   "conclusion": "success", "event": "pull_request"}],
            protection_readable=False,
        )
        verdict = run_promote(fake)
        self.assertTrue(verdict.startswith("merged"))
        self.assertEqual(fake.merged, [HEAD_NEW])

    def test_the_gate_still_refuses_when_the_protection_read_is_denied_and_a_context_is_not_green(self):
        """A denied protection read must not become an excuse to merge without the contexts."""
        fake = FakeGitHub(
            heads=[HEAD_NEW],
            runs=[{"databaseId": 42, "headSha": HEAD_NEW, "status": "completed",
                   "conclusion": "success", "event": "pull_request"}],
            contexts={**ALL_GREEN, "hold-guard": "skipped"},
            protection_readable=False,
        )
        verdict = run_promote(fake, max_cycles=3)
        self.assertEqual(fake.merged, [])
        self.assertIn("HALT", verdict)

    # ---- every gated run for the bytes must be approved, not only the gate's own --
    #
    # THE DEFECT THESE CASES SHIP WITH. The gate approved only the pr-gates run it watched.
    # The required `build` context is produced by the CI workflow, whose run ALSO arrives as
    # action_required - and a run that has not been approved produces no check run at all, so
    # `build` read as absent rather than as failed. On 2026-10-26 PR #3501 sat with a green
    # pr-gates run, a `build` context that did not exist, and a merge refused with "the base
    # branch policy prohibits the merge".

    def test_a_gated_run_from_another_workflow_is_approved_too(self):
        fake = FakeGitHub(
            heads=[HEAD_NEW],
            runs=[{"databaseId": 51, "headSha": HEAD_NEW, "status": "completed",
                   "conclusion": "success", "event": "pull_request"}],
            all_runs=[
                {"databaseId": 51, "headSha": HEAD_NEW, "status": "completed",
                 "conclusion": "success", "event": "pull_request", "workflowName": "pr-gates"},
                {"databaseId": 52, "headSha": HEAD_NEW, "status": "completed",
                 "conclusion": "action_required", "event": "pull_request", "workflowName": "CI"},
            ],
        )
        run_promote(fake)
        self.assertIn(52, fake.approved)

    def test_a_gated_run_for_other_bytes_is_not_approved(self):
        """Approval is for these bytes. A gated run on a different head is somebody else's."""
        fake = FakeGitHub(
            heads=[HEAD_NEW],
            runs=[{"databaseId": 53, "headSha": HEAD_NEW, "status": "completed",
                   "conclusion": "success", "event": "pull_request"}],
            all_runs=[
                {"databaseId": 53, "headSha": HEAD_NEW, "status": "completed",
                 "conclusion": "success", "event": "pull_request", "workflowName": "pr-gates"},
                {"databaseId": 54, "headSha": HEAD_OLD, "status": "completed",
                 "conclusion": "action_required", "event": "pull_request", "workflowName": "CI"},
            ],
        )
        run_promote(fake)
        self.assertNotIn(54, fake.approved)

    def test_the_gate_merges_when_another_workflow_starts_with_its_run_gated(self):
        """The end-to-end shape of the defect: the gate's own run is green, the CI run needs
        approval, and the merge must still happen - because the gate approves it."""
        fake = FakeGitHub(
            heads=[HEAD_NEW],
            runs=[{"databaseId": 55, "headSha": HEAD_NEW, "status": "completed",
                   "conclusion": "success", "event": "pull_request"}],
            all_runs=[
                {"databaseId": 55, "headSha": HEAD_NEW, "status": "completed",
                 "conclusion": "success", "event": "pull_request", "workflowName": "pr-gates"},
                {"databaseId": 56, "headSha": HEAD_NEW, "status": "completed",
                 "conclusion": "action_required", "event": "pull_request", "workflowName": "CI"},
            ],
        )
        verdict = run_promote(fake)
        self.assertTrue(verdict.startswith("merged"))
        self.assertEqual(fake.merged, [HEAD_NEW])
        self.assertIn(56, fake.approved)

    # ---- a cancelled run poisons the contexts, and only a re-run replaces them ----
    #
    # THE DEFECT THESE CASES SHIP WITH. Cancelling a workflow run does not remove the check
    # runs it produced: it produces NEW ones with HIGHER ids and a cancelled conclusion, and
    # branch protection reads the NEWEST check run per context. So a workflow_dispatch run
    # that was cancelled after the pull_request run passed leaves `hold-guard` reading as
    # cancelled, and no amount of waiting brings it back. Measured 2026-10-26 on PR #3511:
    # three cancelled suites sat above the passing one, and the gate could not see a green
    # context for bytes whose gates had all passed.

    def test_a_poisoned_context_triggers_a_rerun_of_the_passing_pull_request_run(self):
        fake = FakeGitHub(
            heads=[HEAD_NEW],
            runs=[{"databaseId": 61, "headSha": HEAD_NEW, "status": "completed",
                   "conclusion": "success", "event": "pull_request"}],
            contexts={**ALL_GREEN, "hold-guard": "cancelled"},
        )
        verdict = run_promote(fake, max_cycles=3)
        self.assertTrue(fake.reran)
        self.assertEqual(set(fake.reran), {61})
        self.assertEqual(fake.merged, [])

    def test_the_rerun_is_bounded(self):
        """A gate that can re-run forever is a gate that never answers."""
        fake = FakeGitHub(
            heads=[HEAD_NEW],
            runs=[{"databaseId": 62, "headSha": HEAD_NEW, "status": "completed",
                   "conclusion": "success", "event": "pull_request"}],
            contexts={**ALL_GREEN, "hold-guard": "cancelled"},
        )
        run_promote(fake, max_cycles=12)
        self.assertLessEqual(len(fake.reran), gate.MAX_RERUNS)

    def test_no_rerun_when_there_is_no_passing_pull_request_run(self):
        """Only a run that PASSED can be re-run to replace poisoned check runs. Re-running a
        run that did not pass would be re-gating bytes that never passed."""
        fake = FakeGitHub(
            heads=[HEAD_NEW],
            runs=[{"databaseId": 63, "headSha": HEAD_NEW, "status": "completed",
                   "conclusion": "success", "event": "workflow_dispatch"}],
            contexts={**ALL_GREEN, "hold-guard": "cancelled"},
        )
        run_promote(fake, max_cycles=3)
        self.assertEqual(fake.reran, [])


if __name__ == "__main__":
    unittest.main()
