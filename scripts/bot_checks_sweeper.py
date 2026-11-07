"""Bound automatic repair to previously unattempted PR heads; never merge or bypass gates.

The workflow's existing concurrency group serializes sweepers. Retained Actions history is
the retry record: ANY pr-gates run or gates check on this exact head requires a
source change or an explicit direct pr-gates workflow_dispatch to retry. History
must be readable and complete; API errors never mean that checks are missing.
This is not an atomic lock against external manual dispatch or a branch push
after the last read. No check result or run cancellation is written here.
"""
import json
import os
import re
import subprocess
import sys

MAX_DISPATCHES = 3
WORKFLOW = "pr-gates.yml"


class DiscoveryError(RuntimeError):
    pass


def records(pages, key=None):
    """Reject malformed or truncated paginated responses instead of assuming []."""
    if not isinstance(pages, list) or not pages:
        raise DiscoveryError("Missing paginated response")
    result = []
    totals = []
    for page in pages:
        rows = page.get(key) if isinstance(page, dict) and key else page
        if not isinstance(rows, list) or any(not isinstance(row, dict) for row in rows):
            raise DiscoveryError("Malformed paginated response")
        if key:
            total = page.get("total_count")
            if not isinstance(total, int) or isinstance(total, bool) or total < 0:
                raise DiscoveryError("Missing history count")
            totals.append(total)
        result.extend(rows)
    # GitHub caps filtered run history at 1,000: a positive record already
    # excludes this head, but incomplete evidence must never qualify it.
    if totals and (len(set(totals)) != 1 or len(result) != totals[0]):
        raise DiscoveryError("History changed or pagination was incomplete")
    return result


def validate_pr(pr, repo):
    try:
        number, head = pr["number"], pr["head"]
        sha, branch = head["sha"], head["ref"]
        if (not isinstance(number, int) or isinstance(number, bool) or number < 1
                or not isinstance(sha, str) or not re.fullmatch(r"[0-9a-f]{40}", sha)
                or not isinstance(branch, str) or not branch
                or not isinstance(pr["draft"], bool)
                or pr["state"] not in ("open", "closed")
                or not isinstance(pr["created_at"], str)):
            raise ValueError("invalid PR metadata")
        # Deleted fork repositories are ineligible as well.
        same_repo = isinstance(head.get("repo"), dict) and head["repo"].get("full_name") == repo
        return pr["state"] == "open" and not pr["draft"] and same_repo
    except (KeyError, TypeError, ValueError) as exc:
        raise DiscoveryError("Malformed PR metadata") from exc


def eligibility(checks, runs, sha):
    if (not isinstance(checks, list) or not isinstance(runs, list)
            or any(not isinstance(item, dict) for item in checks + runs)
            or any(not isinstance(item.get("name"), str) for item in checks)):
        raise DiscoveryError("Malformed check or run history")
    for item in checks + runs:
        if item.get("head_sha") != sha:
            raise DiscoveryError("History did not match the requested head")
    gates = [item for item in checks if item.get("name") == "gates"]
    if gates:
        return "gates_already_present"
    if runs:
        return "workflow_already_attempted"
    return "missing"


class GitHub:
    def __init__(self, repo):
        if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repo):
            raise DiscoveryError("Invalid repository")
        self.repo = repo

    @staticmethod
    def gh(args):
        result = subprocess.run(["gh", *args], capture_output=True, text=True, timeout=90)
        if result.returncode:
            # Do not turn failed HTTP requests or ambiguous dispatch responses
            # into permission to try another head.
            raise DiscoveryError("GitHub request failed: " + " ".join(args[:2]))
        return result.stdout

    def api(self, path, paginated=False):
        args = ["api", f"repos/{self.repo}/{path}"]
        if paginated:
            args += ["--paginate", "--slurp"]
        try:
            return json.loads(self.gh(args))
        except json.JSONDecodeError as exc:
            raise DiscoveryError("GitHub returned invalid JSON") from exc

    def pulls(self):
        return records(self.api("pulls?state=open&sort=created&direction=asc&per_page=100", True))

    def pull(self, number):
        return self.api(f"pulls/{number}")

    def history(self, sha):
        checks = records(self.api(f"commits/{sha}/check-runs?filter=all&per_page=100", True), "check_runs")
        if any(item.get("name") == "gates" for item in checks):
            return checks, []  # Any existing gate already excludes this head.
        runs = records(self.api(f"actions/workflows/{WORKFLOW}/runs?head_sha={sha}&per_page=100", True), "workflow_runs")
        return checks, runs

    def dispatch(self, pr):
        self.gh(["workflow", "run", WORKFLOW, "--repo", self.repo,
                 "--ref", pr["head"]["ref"], "-f", f"pr={pr['number']}"])


def sweep(github):
    prs = github.pulls()
    # Validate discovery before making any writes; then a stable order keeps
    # the cap reproducible. A dispatched head becomes ineligible next sweep.
    eligible = [pr for pr in prs if validate_pr(pr, github.repo)]
    eligible.sort(key=lambda pr: (pr["created_at"], pr["number"]))
    report = {"dispatch_requested": [], "skipped": [], "cap": MAX_DISPATCHES}
    seen_heads = set()
    for pr in eligible:
        if len(report["dispatch_requested"]) >= MAX_DISPATCHES:
            break
        number, sha = pr["number"], pr["head"]["sha"]
        if sha in seen_heads:
            report["skipped"].append({"pr": number, "reason": "head_already_seen"})
            continue
        seen_heads.add(sha)
        reason = eligibility(*github.history(sha), sha)
        if reason != "missing":
            report["skipped"].append({"pr": number, "reason": reason})
            continue
        fresh = github.pull(number)
        if (not validate_pr(fresh, github.repo) or fresh["number"] != number
                or fresh["head"]["sha"] != sha
                or fresh["head"]["ref"] != pr["head"]["ref"]):
            report["skipped"].append({"pr": number, "reason": "pr_changed"})
            continue
        # Native checks or a manual run may have appeared during discovery.
        reason = eligibility(*github.history(sha), sha)
        if reason != "missing":
            report["skipped"].append({"pr": number, "reason": reason})
            continue
        github.dispatch(fresh)
        report["dispatch_requested"].append({"pr": number, "head_sha": sha})
        print(f"Requested real gates for #{number} at observed head {sha}; "
              "the resulting run's head remains to be checked.", flush=True)
    return report


def main():
    try:
        print(json.dumps(sweep(GitHub(os.environ["REPO"])), sort_keys=True))
        return 0
    except (DiscoveryError, KeyError, subprocess.TimeoutExpired) as exc:
        print(f"Sweep stopped without further dispatch: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
