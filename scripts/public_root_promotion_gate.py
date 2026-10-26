#!/usr/bin/env python3
"""Promote the public-root candidate: merge it only after pr-gates passed on the EXACT bytes.

WHY THIS EXISTS. The gate lived as shell inside
.github/workflows/public-root-candidate-upgrade.yml, and it read the candidate's head ONCE, at the
moment the job had just pushed the upgraded proof. A pull request's headRefOid LAGS the branch by
seconds after that push, so the step read the PREVIOUS commit and watched a pr-gates run for
those OLDER bytes. On 2026-10-26 it read 9e6f0cc70 (the commit before the proof upgrade) while
the branch had already moved to d43b1a605, watched the gates for the older bytes, and halted the
promotion with "HALT: pr-gates run 40301090584 did not pass on 9e6f0cc70" - even though the
proof had been upgraded to CONFIRMED_BITCOIN, the candidate's gates were queued on the exact head,
and the promotion was one step from merging.

The fix is not "read it later". It is:

  * read the BRANCH REF, never the pull request's view of it - the ref is the branch the pull
    request is opened from and it is never stale;
  * re-read it every cycle, because a reconcile can move the branch while the gates run;
  * never merge bytes whose gates did not run: if the branch moved during the gates, the gates are
    run again on the new head instead of the new head being merged on the old head's pass.

Nothing here weakens the gate. It makes the gate bind to the bytes it actually merges.

    python3 scripts/public_root_promotion_gate.py --repo CSOAI-ORG/councilof-ai \
        --branch public-root/pending --pr https://github.com/CSOAI-ORG/councilof-ai/pull/3501

Exit 0 = merged. Exit 1 = the candidate stays open for a human.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time

GATE_WORKFLOW = "pr-gates.yml"

# The status-check contexts this repo's branch protection requires.
#
# Measured 2026-10-26 from
#   gh api repos/CSOAI-ORG/councilof-ai/branches/master/protection/required_status_checks
#     -> {"checks": [{"app_id": 15368, "context": "gates"}, ...],
#         "contexts": ["gates", "build", "stamped-bytes", "hold-guard"],
#         "strict": true}
#
# WHY THIS IS A CONSTANT AND ALSO READ LIVE. The live read is the truth about what protection
# requires, but that endpoint needs ADMIN permission on the repository. Under the promotion
# workflow's own GITHUB_TOKEN it answers "403 Resource not accessible by integration" -
# measured on 2026-10-26 in run 40322739137, where the gate CRASHED at the exact moment the
# candidate's gates had passed and it was ready to merge. A gate that dies when it cannot read
# its own list is a gate that never merges. So this list is the FLOOR, the live read is added to
# it when it is readable, and neither can weaken the other.
REQUIRED_CONTEXTS = ("gates", "build", "stamped-bytes", "hold-guard")


class GitHub:
    """The four GitHub calls this gate makes. Injectable so the rules can be tested offline."""

    def __init__(self, runner=None):
        self._runner = runner or self._subprocess

    @staticmethod
    def _subprocess(argv):
        proc = subprocess.run(argv, capture_output=True, text=True)
        return proc.returncode, proc.stdout, proc.stderr

    def _json(self, argv):
        rc, out, err = self._runner(argv)
        if rc != 0:
            raise RuntimeError(f"{' '.join(argv[:6])} failed ({rc}): {err.strip()[:200]}")
        return json.loads(out)

    def branch_head(self, repo: str, branch: str) -> str:
        """The branch's current head. The pull request's headRefOid is NOT this: after a push
        the pull request's view lags the branch by seconds, and that lag is what broke the
        promotion on 2026-10-26."""
        ref = self._json(["gh", "api", f"repos/{repo}/git/ref/heads/{branch}"])
        return ref["object"]["sha"]

    def runs(self, repo: str, workflow: str, branch: str) -> list:
        raw = self._json([
            "gh", "run", "list", "--repo", repo, "--workflow", workflow, "--branch", branch,
            "--limit", "50", "--json", "databaseId,headSha,status,conclusion,createdAt,event",
        ])
        return raw if isinstance(raw, list) else []

    def all_runs(self, repo: str, branch: str) -> list:
        """Every workflow's run on this branch, not only the gate's own workflow.

        Needed because the required contexts do not all come from one workflow: `gates`,
        `stamped-bytes` and `hold-guard` are pr-gates jobs, and `build` is a CI job. A run
        that has not been approved produces NO check run at all, so a context whose workflow
        is still waiting for approval is invisible to the gate - it reads as absent, not as
        failed, and the merge is refused with "the base branch policy prohibits the merge"
        while every gate that did run is green.
        """
        raw = self._json([
            "gh", "run", "list", "--repo", repo, "--branch", branch,
            "--limit", "100",
            "--json", "databaseId,headSha,status,conclusion,createdAt,event,name,workflowName",
        ])
        return raw if isinstance(raw, list) else []

    def required_contexts(self, repo: str, branch: str = "master", log=None) -> list:
        """The status-check contexts that must be green on the head before a merge is attempted.

        The live branch-protection read is preferred, and it is ADDED to the recorded floor,
        never substituted for it. Two reasons, both measured on 2026-10-26:

        - the endpoint needs admin permission on the repository. Under the promotion
          workflow's own GITHUB_TOKEN it answers 403 "Resource not accessible by
          integration", so a gate that depends on it dies exactly when the gates have
          passed and the candidate is ready to merge (run 40322739137).
        - a protection rule that names a context in `checks` but not in `contexts` reads
          back as an EMPTY list, and a gate that checks an empty list checks nothing.

        A read that cannot be made is reported, never raised: the recorded floor still applies,
        and the merge is still gated on it.
        """
        contexts = set(REQUIRED_CONTEXTS)
        try:
            data = self._json([
                "gh", "api", f"repos/{repo}/branches/{branch}/protection/required_status_checks",
            ])
        except Exception as exc:  # reported, never swallowed into a wider list
            if log:
                log(f"branch protection is not readable with this token ({exc}); "
                    f"using the recorded required contexts: {', '.join(sorted(contexts))}")
            return sorted(contexts)
        live = set(data.get("contexts") or [])
        for check in data.get("checks") or []:
            name = check.get("context")
            if isinstance(name, str) and name:
                live.add(name)
        if live:
            contexts |= live
        elif log:
            log("branch protection named no contexts; using the recorded required contexts")
        return sorted(contexts)

    def context_conclusions(self, repo: str, head: str) -> dict:
        """The LATEST check-run conclusion per context on this head.

        "Latest" matters: branch protection reads the most recent check run for each context,
        so a context that was green an hour ago and was then re-run and cancelled is NOT
        satisfied. Check-run ids increase monotonically, so the highest id for a context is the
        latest one.
        """
        data = self._json([
            "gh", "api", f"repos/{repo}/commits/{head}/check-runs?per_page=100",
        ])
        latest: dict = {}
        for run in data.get("check_runs") or []:
            name = run.get("name")
            ident = run.get("id") or 0
            if name is None:
                continue
            if name not in latest or ident > latest[name][0]:
                latest[name] = (ident, run.get("conclusion") or run.get("status") or "unknown")
        return {name: value[1] for name, value in latest.items()}

    def dispatch(self, repo: str, workflow: str, ref: str) -> None:
        self._runner(["gh", "workflow", "run", workflow, "--repo", repo, "--ref", ref])

    def approve(self, repo: str, run_id) -> bool:
        rc, _out, _err = self._runner(
            ["gh", "api", "-X", "POST", f"repos/{repo}/actions/runs/{run_id}/approve"]
        )
        return rc == 0

    def watch(self, repo: str, run_id) -> bool:
        """Block until the run finishes. True = it passed."""
        rc, _out, _err = self._runner([
            "gh", "run", "watch", str(run_id), "--repo", repo, "--exit-status", "--interval", "30",
        ])
        return rc == 0

    def merge(self, repo: str, url: str, head: str):
        return self._runner([
            "gh", "pr", "merge", url, "--repo", repo, "--squash", "--match-head-commit", head,
        ])


def select_run(runs: list, head: str):
    """The gate run for these exact bytes, or None.

    A run that is still going counts (we wait for it). A run that finished successfully counts.
    A run that is waiting for approval counts: it has not been refused, it has not been judged,
    and it becomes a real run once approved. A run that finished with anything else does not -
    and neither does a run for OTHER bytes: that is the defect this module exists to remove, so
    the head is matched, never assumed.

    A pull_request run is PREFERRED, and the reason is not a preference. The `hold-guard` job
    is declared `if: github.event_name == 'pull_request'`, so a run dispatched with
    `workflow_dispatch` reports that required context as SKIPPED, and a skipped required check
    does not satisfy branch protection: the merge is refused with "the base branch policy
    prohibits the merge" while every gate that did run is green. Selecting the newest run
    blindly can pick exactly that run.
    """
    matching = [run for run in runs if run.get("headSha") == head]
    for run in matching:
        status, conclusion = run.get("status"), run.get("conclusion")
        if status != "completed" or conclusion in ("success", "action_required"):
            if run.get("event") == "pull_request":
                return run
    for run in matching:
        status, conclusion = run.get("status"), run.get("conclusion")
        if status != "completed" or conclusion in ("success", "action_required"):
            return run
    return None


def needs_approval(run: dict) -> bool:
    return (run or {}).get("conclusion") == "action_required"


def promote(gh, repo, branch, url, workflow: str = GATE_WORKFLOW,
            max_cycles: int = 60, pause: float = 20.0, sleep=time.sleep, log=print) -> str:
    """Run the promotion gate. Returns a one-line verdict.

    THE INVARIANT. The merge happens only when every status-check context this repo's branch
    protection requires is SUCCESSFUL on the exact commit being merged, and only if that commit
    is still the branch's head when the merge is issued. A green run is not the invariant - a
    green run for OTHER bytes is not the invariant, and neither is a green run whose required
    context was SKIPPED (a workflow_dispatch run skips `hold-guard`, because that job is
    declared `if: github.event_name == 'pull_request'`).
    """
    required = None
    for cycle in range(1, max_cycles + 1):
        head = gh.branch_head(repo, branch)
        # Approve EVERY gated run for these bytes, not only the gate's own run. The required
        # contexts do not come from one workflow - `build` is a CI job - and a run that is
        # still waiting for approval produces no check run at all, so its context reads as
        # absent and branch protection refuses the merge with "the base branch policy
        # prohibits the merge" while every gate that did run is green. Measured 2026-10-26:
        # PR #3501's CI run sat at action_required and the gate approved only the pr-gates
        # run, so `build` never existed and the candidate could not merge.
        for gated in gh.all_runs(repo, branch):
            if gated.get("headSha") == head and needs_approval(gated):
                which = gated.get("workflowName") or gated.get("name") or "a workflow"
                log(f"cycle {cycle}: approving gated run {gated['databaseId']} ({which})")
                if not gh.approve(repo, gated["databaseId"]):
                    log(f"cycle {cycle}: approve of {gated['databaseId']} refused; continuing to watch")
        run = select_run(gh.runs(repo, workflow, branch), head)
        if run is None:
            log(f"cycle {cycle}: no gate run for {head[:9]} yet; dispatching one")
            gh.dispatch(repo, workflow, branch)
            sleep(pause)
            continue
        run_id = run["databaseId"]
        log(f"cycle {cycle}: waiting for pr-gates run {run_id} on {head}")
        if not gh.watch(repo, run_id):
            return (f"HALT: pr-gates run {run_id} did not pass on {head}; the candidate stays open "
                    "for a human.")
        # The branch must not have moved while the gates ran. A pass on older bytes must never
        # merge newer bytes; re-run the gates on the new head instead.
        now = gh.branch_head(repo, branch)
        if now != head:
            log(f"cycle {cycle}: the branch moved during the gates ({head[:9]} -> {now[:9]}); "
                "the gates are re-run on the new head")
            sleep(pause)
            continue
        # The run passed. That is not yet the invariant: every context this repo's branch
        # protection REQUIRES must be green on these exact bytes, or the merge is refused by
        # GitHub with "the base branch policy prohibits the merge" while every gate that did
        # run is green. The usual cause is `hold-guard`, which is declared
        # `if: github.event_name == 'pull_request'` and is therefore SKIPPED by a
        # workflow_dispatch run - and a skipped required check does not satisfy protection.
        if required is None:
            required = gh.required_contexts(repo, log=log)
        conclusions = gh.context_conclusions(repo, head)
        unsatisfied = {name: conclusions.get(name, "absent") for name in required
                       if conclusions.get(name) != "success"}
        if unsatisfied:
            detail = ", ".join(f"{name}={value}" for name, value in sorted(unsatisfied.items()))
            log(f"cycle {cycle}: pr-gates passed on {head[:9]} but the required contexts are not "
                f"all green on it ({detail}); a context that is skipped or cancelled does not "
                f"satisfy branch protection, so the merge is not attempted")
            sleep(pause)
            continue
        rc, _out, err = gh.merge(repo, url, head)
        if rc != 0:
            return f"HALT: merge of {head} failed: {err.strip()[:200]}"
        return f"merged {url} at {head}"
    return "HALT: no gate run for the candidate head within the wait window; not merging"


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--repo", required=True)
    ap.add_argument("--branch", required=True)
    ap.add_argument("--pr", required=True)
    ap.add_argument("--workflow", default=GATE_WORKFLOW)
    ap.add_argument("--max-cycles", type=int, default=60)
    ap.add_argument("--pause", type=float, default=20.0)
    args = ap.parse_args(argv)
    verdict = promote(GitHub(), args.repo, args.branch, args.pr, args.workflow,
                      max_cycles=args.max_cycles, pause=args.pause)
    print(verdict)
    return 0 if verdict.startswith("merged") else 1


if __name__ == "__main__":
    sys.exit(main())
