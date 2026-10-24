#!/usr/bin/env python3
"""Synthetic publication contract tests. No GitHub, git or provider execution."""
import copy
import io
import json
import os
import subprocess
import tempfile
import unittest
from contextlib import redirect_stdout, redirect_stderr
from unittest import mock

import canary_delivery as delivery

PRIVATE = "SYNTHETIC_CANARY_PRIVATE_DO_NOT_PRINT"
HEAD = "a" * 40
REPO = delivery.REPOSITORY


def pull_request():
    return {"number": 123, "html_url": "https://github.com/" + REPO + "/pull/123",
            "state": "open", "merged": False, "draft": False, "auto_merge": None,
            "head": {"ref": "canary-push/321", "sha": HEAD, "repo": {"full_name": REPO}},
            "base": {"ref": "master", "repo": {"full_name": REPO}}}


class Commands:
    def __init__(self):
        self.calls = []
        self.fail = None
        self.raise_error = None
        self.existing = True
        self.created = False
        self.difference = 1
        self.paths = delivery.DIRECTORY + "baseline.jsonl\0"
        self.remote = "https://github.com/" + REPO
        self.pr = pull_request()
        self.list_override = None

    def __call__(self, argv, **kwargs):
        self.calls.append(argv)
        if kwargs != {"capture_output": True, "text": True, "timeout": 120, "check": False}:
            raise AssertionError("command output must stay captured and bounded by a timeout")
        if self.fail and self.fail(argv):
            if self.raise_error:
                raise self.raise_error
            return subprocess.CompletedProcess(argv, 1, PRIVATE, "GH013 Push cannot contain secrets " + PRIVATE)
        output, code = "", 0
        if argv[:3] == ["git", "remote", "get-url"]:
            output = self.remote + "\n"
        elif argv[:4] == ["git", "diff", "--cached", "--name-only"]:
            output = self.paths
        elif argv == ["git", "diff", "--cached", "--quiet"]:
            code = self.difference
        elif argv == ["git", "rev-parse", "HEAD"]:
            output = HEAD + "\n"
        elif argv[:3] == ["gh", "pr", "list"]:
            output = self.list_override if self.list_override is not None else json.dumps(
                [{"number": 123}] if self.existing or self.created else [])
        elif argv[:3] == ["gh", "pr", "create"]:
            self.created = True
            output = PRIVATE  # Successful command output is not the receipt either.
        elif argv[:2] == ["gh", "api"]:
            output = json.dumps(self.pr)
        return subprocess.CompletedProcess(argv, code, output, PRIVATE)


class DeliveryTest(unittest.TestCase):
    def setUp(self):
        block = mock.patch.object(delivery.subprocess, "run",
                                  side_effect=AssertionError("real command forbidden"))
        block.start()
        self.addCleanup(block.stop)

    def run_fake(self, fake, **overrides):
        stdout, stderr = io.StringIO(), io.StringIO()
        with redirect_stdout(stdout), redirect_stderr(stderr):
            result = delivery.propose(overrides.get("repository", REPO),
                                      overrides.get("run_id", "321"),
                                      overrides.get("capture_artifact_id", "456"),
                                      runner=fake)
        self.assertNotIn(PRIVATE, json.dumps(result) + stdout.getvalue() + stderr.getvalue())
        self.assertEqual(stdout.getvalue() + stderr.getvalue(), "")
        return result

    def test_existing_exact_pr_is_idempotent_and_never_auto_merged(self):
        fake = Commands()
        result = self.run_fake(fake)
        self.assertEqual(result["state"], "PROPOSED")
        self.assertEqual(result["stage"], "PR_VERIFIED")
        self.assertEqual(result["source_sha"], HEAD)
        self.assertEqual(result["capture_artifact_id"], 456)
        self.assertFalse(any(c[:3] == ["gh", "pr", "create"] for c in fake.calls))
        self.assertTrue(all("--force" not in c and "--auto" not in c for c in fake.calls))
        self.assertIn(["git", "push", "origin", "HEAD:refs/heads/canary-push/321"], fake.calls)

    def test_new_pr_requires_a_fresh_exact_api_readback(self):
        fake = Commands()
        fake.existing = False
        result = self.run_fake(fake)
        self.assertEqual(result["state"], "PROPOSED")
        self.assertEqual(sum(c[:3] == ["gh", "pr", "create"] for c in fake.calls), 1)
        self.assertEqual(sum(c[:3] == ["gh", "pr", "list"] for c in fake.calls), 2)
        self.assertEqual(fake.calls[-1], ["gh", "api", "repos/" + REPO + "/pulls/123"])

    def test_secret_protection_rejection_stops_before_any_pr_command(self):
        fake = Commands()
        fake.fail = lambda c: c[:2] == ["git", "push"]
        result = self.run_fake(fake)
        self.assertEqual(result["state"], "FAILED")
        self.assertEqual(result["stage"], "PUSH")
        self.assertEqual(result["command_exit"], 1)
        self.assertFalse(any(c[0] == "gh" for c in fake.calls))

    def test_pr_creation_failure_is_not_delivery_or_a_retry(self):
        fake = Commands()
        fake.existing = False
        fake.fail = lambda c: c[:3] == ["gh", "pr", "create"]
        result = self.run_fake(fake)
        self.assertEqual(result["stage"], "PR_CREATE")
        self.assertEqual(result["state"], "FAILED")
        self.assertEqual(sum(c[:3] == ["gh", "pr", "create"] for c in fake.calls), 1)
        self.assertFalse(any(c[:2] == ["gh", "api"] for c in fake.calls))

    def test_missing_failed_or_malformed_retention_blocks_all_commands(self):
        for artifact in ("", "0", "-1", "private", None, True, "1"*21):
            fake = Commands()
            result = self.run_fake(fake, capture_artifact_id=artifact)
            self.assertEqual(result["stage"], "CONFIG")
            self.assertEqual(fake.calls, [])

    def test_wrong_repository_and_run_id_are_rejected_without_echo(self):
        for overrides in ({"repository": PRIVATE}, {"repository": "other/repo"},
                          {"run_id": PRIVATE}, {"run_id": "0"}, {"run_id": True}):
            fake = Commands()
            result = self.run_fake(fake, **overrides)
            self.assertEqual(result["state"], "FAILED")
            self.assertEqual(fake.calls, [])

    def test_wrong_remote_and_unexpected_staged_content_block_mutation(self):
        fake = Commands()
        fake.remote = "https://example.invalid/" + PRIVATE
        self.assertEqual(self.run_fake(fake)["stage"], "REMOTE")
        self.assertEqual(len(fake.calls), 1)
        fake = Commands()
        fake.paths = ".github/workflows/deploy.yml\0"
        self.assertEqual(self.run_fake(fake)["stage"], "STAGED_SCOPE")
        self.assertFalse(any(c[:2] == ["git", "add"] for c in fake.calls))

    def test_clean_capture_is_no_change_and_diff_error_is_failure(self):
        for code, state in ((0, "NO_CHANGE"), (2, "FAILED")):
            fake = Commands()
            fake.difference = code
            result = self.run_fake(fake)
            self.assertEqual(result["state"], state)
            self.assertFalse(any(c[:2] == ["git", "commit"] or c[0] == "gh" for c in fake.calls))

    def test_unconfirmed_ambiguous_or_malformed_pr_list_is_failure(self):
        for listing in ('{"number":123}', "not-json " + PRIVATE, "[true]",
                        '[{"number":true}]', '[{"number":123},{"number":124}]',
                        "[" + " "*65537 + "]"):
            fake = Commands()
            fake.list_override = listing
            result = self.run_fake(fake)
            self.assertEqual(result["state"], "FAILED")
            self.assertFalse(any(c[:3] == ["gh", "pr", "create"] for c in fake.calls))

    def test_readback_rejects_wrong_base_head_commit_repo_and_closed_pr(self):
        paths = [
            (("state",), "closed"), (("merged",), True), (("draft",), True),
            (("auto_merge",), {}), (("number",), True), (("html_url",), PRIVATE),
            (("head", "sha"), "b"*40), (("head", "ref"), "other"),
            (("head", "repo", "full_name"), "other/repo"),
            (("base", "ref"), "other"), (("base", "repo", "full_name"), "other/repo"),
        ]
        for path, value in paths:
            fake = Commands()
            node = fake.pr
            for key in path[:-1]:
                node = node[key]
            node[path[-1]] = value
            result = self.run_fake(fake)
            self.assertEqual(result["state"], "FAILED")
            self.assertEqual(result["stage"], "PR_CONTRACT")

    def test_transport_exception_does_not_print_command_or_exception(self):
        for error in (OSError(PRIVATE), subprocess.TimeoutExpired(PRIVATE, 120, output=PRIVATE),
                      UnicodeDecodeError("utf-8", b"x", 0, 1, PRIVATE)):
            fake = Commands()
            fake.fail = lambda c: c[:2] == ["git", "push"]
            fake.raise_error = error
            result = self.run_fake(fake)
            self.assertEqual(result["stage"], "PUSH")
            self.assertEqual(result["state"], "FAILED")

    def test_failure_receipt_and_cli_exit_are_honest_and_atomic(self):
        fake = Commands()
        fake.fail = lambda c: c[:2] == ["git", "push"]
        failed = self.run_fake(fake)
        with tempfile.TemporaryDirectory() as directory:
            target = os.path.join(directory, "delivery.json")
            output = io.StringIO()
            with mock.patch.object(delivery, "propose", return_value=failed), redirect_stdout(output):
                code = delivery.main(["--repository", REPO, "--run-id", "321",
                                      "--capture-artifact-id", "456", "--receipt", target])
            self.assertEqual(code, 1)
            with open(target, encoding="utf-8") as stream:
                self.assertEqual(json.load(stream), failed)
            self.assertNotIn(PRIVATE, output.getvalue())
            self.assertEqual(os.listdir(directory), ["delivery.json"])
            with mock.patch.object(delivery.os, "replace", side_effect=OSError(PRIVATE)):
                with self.assertRaises(OSError):
                    delivery.write_receipt(os.path.join(directory, "new.json"), failed)
            self.assertEqual(os.listdir(directory), ["delivery.json"])


if __name__ == "__main__":
    unittest.main()
