#!/usr/bin/env python3
"""Propose retained canary data through the existing protected PR route."""
import argparse
import json
import os
import re
import subprocess
import tempfile

REPOSITORY = "CSOAI-ORG/councilof-ai"
DIRECTORY = "public/interop/silent-route-canary-2026-09/"
FILES = frozenset((DIRECTORY + "baseline.jsonl", DIRECTORY + "drift-dryrun.jsonl"))
DIGITS = re.compile(r"[1-9][0-9]{0,19}\Z")
SHA = re.compile(r"[0-9a-f]{40}\Z")


class Failure(Exception):
    def __init__(self, stage, code=1):
        self.stage = stage
        self.code = code if type(code) is int else 1


def propose(repository, run_id, capture_artifact_id, runner=None):
    runner = runner or subprocess.run
    report = {"schema": "csoai.canary-delivery-receipt/1", "label": "THIN",
              "state": "FAILED", "stage": "CONFIG", "command_exit": 1}

    def command(stage, argv, allowed=(0,)):
        try:
            result = runner(argv, capture_output=True, text=True, timeout=120, check=False)
        except (OSError, UnicodeError, subprocess.SubprocessError):
            raise Failure(stage) from None
        if type(result.returncode) is not int or result.returncode not in allowed:
            raise Failure(stage, result.returncode)
        return result

    def bounded_text(stage, output):
        if not isinstance(output, str) or len(output) > 65536:
            raise Failure(stage)
        return output

    def document(stage, argv):
        output = bounded_text(stage, command(stage, argv).stdout)
        try:
            return json.loads(output)
        except (ValueError, TypeError):
            raise Failure(stage) from None

    def check_paths():
        output = bounded_text("STAGED_SCOPE",
                              command("STAGED_SCOPE", ["git", "diff", "--cached", "--name-only", "-z"]).stdout)
        if any(path not in FILES for path in output.split("\0") if path):
            raise Failure("STAGED_SCOPE")

    try:
        if (repository != REPOSITORY or not isinstance(run_id, str) or not DIGITS.fullmatch(run_id)
                or not isinstance(capture_artifact_id, str) or not DIGITS.fullmatch(capture_artifact_id)):
            raise Failure("CONFIG")
        report.update(repository=REPOSITORY, run_id=int(run_id),
                      capture_artifact_id=int(capture_artifact_id))
        branch = "canary-push/" + run_id
        remote = bounded_text("REMOTE", command("REMOTE", ["git", "remote", "get-url", "origin"]).stdout).strip()
        if remote not in ("https://github.com/" + REPOSITORY,
                          "https://github.com/" + REPOSITORY + ".git",
                          "git@github.com:" + REPOSITORY + ".git"):
            raise Failure("REMOTE")
        check_paths()
        command("STAGE", ["git", "add", "--", DIRECTORY])
        check_paths()
        difference = command("DIFF", ["git", "diff", "--cached", "--quiet"], (0, 1))
        if difference.returncode == 0:
            report.update(state="NO_CHANGE", stage="DIFF", command_exit=0)
            return report
        command("IDENTITY", ["git", "config", "user.email", "actions@github.com"])
        command("IDENTITY", ["git", "config", "user.name", "github-actions[bot]"])
        command("COMMIT", ["git", "commit", "-m", "canary: capture run " + run_id])
        head = bounded_text("HEAD", command("HEAD", ["git", "rev-parse", "HEAD"]).stdout).strip()
        if not SHA.fullmatch(head):
            raise Failure("HEAD")
        report["source_sha"] = head
        command("PUSH", ["git", "push", "origin", "HEAD:refs/heads/" + branch])
        listing = ["gh", "pr", "list", "--repo", REPOSITORY, "--head", branch,
                   "--state", "all", "--limit", "2", "--json", "number"]
        candidates = document("PR_LIST", listing)
        if not isinstance(candidates, list):
            raise Failure("PR_LIST")
        if not candidates:
            command("PR_CREATE", ["gh", "pr", "create", "--repo", REPOSITORY,
                                 "--head", branch, "--base", "master",
                                 "--title", "canary: capture run " + run_id,
                                 "--body", "Automatic THIN canary capture. Safe capture receipt retained "
                                 "by the workflow; this PR is not a merge or deployment."])
            candidates = document("PR_LIST", listing)
        if (len(candidates) != 1 or not isinstance(candidates[0], dict)
                or type(candidates[0].get("number")) is not int or candidates[0]["number"] <= 0):
            raise Failure("PR_LIST")
        number = candidates[0]["number"]
        pr = document("PR_READBACK", ["gh", "api", "repos/" + REPOSITORY + "/pulls/" + str(number)])
        expected_url = "https://github.com/" + REPOSITORY + "/pull/" + str(number)
        if not isinstance(pr, dict):
            raise Failure("PR_CONTRACT")
        base, source = pr.get("base"), pr.get("head")
        if (not isinstance(base, dict) or not isinstance(source, dict)
                or not isinstance(base.get("repo"), dict) or not isinstance(source.get("repo"), dict)
                or type(pr.get("number")) is not int or pr["number"] != number or pr.get("html_url") != expected_url
                or pr.get("state") != "open" or pr.get("merged") is not False
                or pr.get("draft") is not False or "auto_merge" not in pr or pr["auto_merge"] is not None
                or base["repo"].get("full_name") != REPOSITORY
                or source["repo"].get("full_name") != REPOSITORY
                or base.get("ref") != "master" or source.get("ref") != branch or source.get("sha") != head):
            raise Failure("PR_CONTRACT")
        report.update(state="PROPOSED", stage="PR_VERIFIED", command_exit=0,
                      pr_number=number, pr_url=expected_url, head_branch=branch, base_branch="master")
    except Failure as failure:
        report.update(state="FAILED", stage=failure.stage, command_exit=failure.code)
    return report


def write_receipt(path, report):
    data = json.dumps(report, sort_keys=True, allow_nan=False) + "\n"
    directory = os.path.dirname(os.path.abspath(path))
    os.makedirs(directory, exist_ok=True)
    pending = None
    try:
        with tempfile.NamedTemporaryFile(dir=directory, prefix=".delivery-", mode="w",
                                         encoding="utf-8", delete=False) as stream:
            pending = stream.name
            stream.write(data)
        os.replace(pending, path)
        pending = None
    finally:
        if pending is not None:
            os.unlink(pending)


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("--repository", required=True)
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--capture-artifact-id", required=True)
    parser.add_argument("--receipt", required=True)
    args = parser.parse_args(argv)
    report = propose(args.repository, args.run_id, args.capture_artifact_id)
    try:
        write_receipt(args.receipt, report)
    except OSError:
        print('{"state":"FAILED","stage":"RECEIPT_WRITE","command_exit":1}')
        return 1
    print(json.dumps(report, sort_keys=True))
    return 0 if report["state"] in ("PROPOSED", "NO_CHANGE") else 1


if __name__ == "__main__":
    raise SystemExit(main())
