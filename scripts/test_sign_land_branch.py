#!/usr/bin/env python3
"""Offline checks for scripts/sign_land_branch.py: master's code signs, the landing branch is data.

Every git test runs against a throwaway bare "origin" and a workspace clone parked on master
the way actions/checkout leaves it (detached HEAD). No network, no key, no signature.
"""
from __future__ import annotations

import contextlib
import io
import json
import os
import re
import subprocess
import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sign_land_branch as slb

ROOT = Path(__file__).resolve().parent.parent
WORKFLOWS = ROOT / ".github" / "workflows"
INTEROP = "public/interop"
GIT_ENV = {
    "GIT_AUTHOR_NAME": "test", "GIT_AUTHOR_EMAIL": "test@example.invalid",
    "GIT_COMMITTER_NAME": "test", "GIT_COMMITTER_EMAIL": "test@example.invalid",
    "GIT_CONFIG_NOSYSTEM": "1", "GIT_TERMINAL_PROMPT": "0",
}


def sh(cwd: Path, *args: str) -> str:
    env = dict(os.environ)
    env.update(GIT_ENV)
    r = subprocess.run(["git", *args], cwd=str(cwd), env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if r.returncode != 0:
        raise AssertionError(f"git {' '.join(args)}: {r.stderr.decode()}")
    return r.stdout.decode().strip()


def put(root: Path, rel: str, text: str) -> None:
    dest = root / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(text, encoding="utf-8")


MASTER_FILES = {
    "scripts/sign.py": "MASTER\n",
    ".github/workflows/sign.yml": "name: master copy\n",
    f"{INTEROP}/mill-cards-unsigned/unsigned-old.json": '{"old": true}\n',
    f"{INTEROP}/mill-evidence/admission-old.json": '{"admission": "v1"}\n',
    f"{INTEROP}/mill-cards-signed/signed-old.json": '{"signed": "old"}\n',
    f"{INTEROP}/mill-cards-signed/SUPERSEDED.jsonl": '{"superseded_id": "a"}\n',
    f"{INTEROP}/crosswalk/intoto/care-old.intoto.json": '{"pick": "old"}\n',
    f"{INTEROP}/crosswalk/intoto/index.json": '{"care": "care-old"}\n',
    f"{INTEROP}/hub-cards-index-latest.json": '{"latest": "v1"}\n',
    f"{INTEROP}/hub-cards-index.json": '{"stamped": true}\n',
    f"{INTEROP}/ots/manifest.json": '{"proofs": 1}\n',
    "public/llms.txt": "proofs 1\n",
    "public/llms-full.txt": "proofs 1 full\n",
    "functions/api/_regulatory_inventory.ts": "export const v = 1;\n",
}
BRANCH = "mill/land-care-123"


class GitCase(unittest.TestCase):
    """origin (bare) with master and one landing branch; `work` is the signer's workspace."""

    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        base = Path(self.tmp.name)
        self.origin, self.seed, self.work = base / "origin.git", base / "seed", base / "work"
        sh(base, "init", "-q", "--bare", str(self.origin))
        sh(base, "init", "-q", str(self.seed))
        sh(self.seed, "symbolic-ref", "HEAD", "refs/heads/master")
        sh(self.seed, "remote", "add", "origin", str(self.origin))
        for rel, text in MASTER_FILES.items():
            put(self.seed, rel, text)
        self.commit_all("master: start")
        sh(self.seed, "push", "-q", "origin", "master")
        # The landing branch: what a lander adds, plus edits to code it has no business making.
        sh(self.seed, "checkout", "-q", "-b", BRANCH)
        put(self.seed, f"{INTEROP}/mill-cards-unsigned/unsigned-new.json", '{"body": {"run_id": "gha-123"}}\n')
        put(self.seed, f"{INTEROP}/mill-evidence/items-care-new.jsonl", '{"item": 1}\n')
        put(self.seed, f"{INTEROP}/mill-evidence/admission-new.json", '{"admission": "new"}\n')
        put(self.seed, "scripts/sign.py", "BRANCH COPY: asks for a signature over anything\n")
        put(self.seed, "scripts/evil.py", "print('run me')\n")
        put(self.seed, ".github/workflows/sign.yml", "name: branch copy\non: push\n")
        self.commit_all("land: unsigned cards, and code edits that must never run")
        sh(self.seed, "push", "-q", "origin", BRANCH)
        sh(self.seed, "checkout", "-q", "master")
        self.park_work_on_master()
        self.out = io.StringIO()
        redirect = contextlib.redirect_stdout(self.out)
        redirect.__enter__()
        self.addCleanup(redirect.__exit__, None, None, None)
        err = contextlib.redirect_stderr(io.StringIO())
        err.__enter__()
        self.addCleanup(err.__exit__, None, None, None)

    def commit_all(self, message: str) -> None:
        sh(self.seed, "add", "-A")
        sh(self.seed, "commit", "-q", "-m", message)

    def park_work_on_master(self) -> None:
        if not self.work.exists():
            sh(self.work.parent, "clone", "-q", str(self.origin), str(self.work))
        sh(self.work, "fetch", "-q", "origin")
        sh(self.work, "checkout", "-q", "--detach", "origin/master")

    def tip(self, ref: str) -> str:
        return sh(self.origin, "rev-parse", f"refs/heads/{ref}")

    def at(self, ref: str, rel: str) -> str:
        return sh(self.origin, "show", f"refs/heads/{ref}:{rel}")

    def names(self, ref: str) -> set:
        return set(sh(self.origin, "ls-tree", "-r", "--name-only", f"refs/heads/{ref}").splitlines())

    def sign_in_workspace(self) -> None:
        """What a signing run leaves behind in the workspace: new cards and re-derived files."""
        put(self.work, f"{INTEROP}/mill-cards-signed/signed-care-abc.json", '{"signature": "ed25519"}\n')
        with (self.work / INTEROP / "mill-cards-signed" / "SUPERSEDED.jsonl").open("a") as fh:
            fh.write('{"superseded_id": "b"}\n')
        put(self.work, f"{INTEROP}/hub-cards-index-2026-10-13-aaaa.json", '{"version": 2}\n')
        (self.work / INTEROP / "hub-cards-index-2026-10-13-aaaa.json.ots").write_bytes(b"\x00OpenTimestamps\x00\xff\xfe")
        put(self.work, f"{INTEROP}/hub-cards-index-latest.json", '{"latest": "v2"}\n')
        put(self.work, f"{INTEROP}/ots/manifest.json", '{"proofs": 2}\n')
        put(self.work, "public/llms.txt", "proofs 2\n")
        # A superseded pick: the in-toto statement is renamed, so the old file goes away.
        (self.work / INTEROP / "crosswalk" / "intoto" / "care-old.intoto.json").unlink()
        put(self.work, f"{INTEROP}/crosswalk/intoto/care-new.intoto.json", '{"pick": "new"}\n')
        put(self.work, f"{INTEROP}/crosswalk/intoto/index.json", '{"care": "care-new"}\n')
        # Not outputs: must never be carried to the branch.
        put(self.work, "scripts/sign.py", "MASTER, edited in the workspace\n")
        put(self.work, "scripts/scratch.py", "scratch\n")
        put(self.work, f"{INTEROP}/hub-cards-index.json", '{"stamped": "edited"}\n')


class OverlayTests(GitCase):
    def test_overlay_copies_only_the_two_data_directories(self):
        report = slb.overlay(self.work, BRANCH)
        self.assertEqual(report["written"], 3)
        self.assertTrue((self.work / INTEROP / "mill-cards-unsigned" / "unsigned-new.json").is_file())
        self.assertTrue((self.work / INTEROP / "mill-evidence" / "items-care-new.jsonl").is_file())
        self.assertTrue((self.work / INTEROP / "mill-evidence" / "admission-new.json").is_file())
        # The branch edited scripts/ and a workflow. Master's copies are what the workspace runs.
        self.assertEqual((self.work / "scripts" / "sign.py").read_text(), "MASTER\n")
        self.assertFalse((self.work / "scripts" / "evil.py").exists())
        self.assertEqual((self.work / ".github" / "workflows" / "sign.yml").read_text(), "name: master copy\n")
        changed = sh(self.work, "status", "--porcelain", "--untracked-files=all").splitlines()
        self.assertEqual(len(changed), 3)
        for line in changed:
            self.assertTrue(line[3:].startswith((f"{INTEROP}/mill-cards-unsigned/", f"{INTEROP}/mill-evidence/")), line)
        # HEAD did not move and nothing was staged.
        self.assertEqual(sh(self.work, "rev-parse", "HEAD"), self.tip("master"))
        self.assertEqual(sh(self.work, "diff", "--cached", "--name-only"), "")

    def test_overlay_applies_what_the_branch_added_not_its_stale_copy_of_master(self):
        # Master moves on after the branch was cut: one more inbox card, one evidence file edited.
        put(self.seed, f"{INTEROP}/mill-cards-unsigned/unsigned-later.json", '{"later": true}\n')
        put(self.seed, f"{INTEROP}/mill-evidence/admission-old.json", '{"admission": "v2 on master"}\n')
        self.commit_all("master: moved after the landing branch was cut")
        sh(self.seed, "push", "-q", "origin", "master")
        self.park_work_on_master()
        slb.overlay(self.work, BRANCH)
        self.assertTrue((self.work / INTEROP / "mill-cards-unsigned" / "unsigned-later.json").is_file())
        self.assertEqual((self.work / INTEROP / "mill-evidence" / "admission-old.json").read_text(),
                         '{"admission": "v2 on master"}\n')
        self.assertTrue((self.work / INTEROP / "mill-cards-unsigned" / "unsigned-new.json").is_file())

    def test_overlay_refuses_a_symlink_and_writes_nothing(self):
        sh(self.seed, "checkout", "-q", BRANCH)
        os.symlink("../../../scripts/sign.py", str(self.seed / INTEROP / "mill-cards-unsigned" / "unsigned-link.json"))
        self.commit_all("land: a symlink into scripts/")
        sh(self.seed, "push", "-q", "origin", BRANCH)
        with self.assertRaises(slb.Refused):
            slb.overlay(self.work, BRANCH)
        self.assertFalse((self.work / INTEROP / "mill-cards-unsigned" / "unsigned-new.json").exists())
        self.assertEqual(sh(self.work, "status", "--porcelain", "--untracked-files=all"), "")

    def test_overlay_refuses_a_branch_with_no_shared_history(self):
        sh(self.seed, "checkout", "-q", "--orphan", "lonely")
        self.commit_all("orphan")
        sh(self.seed, "push", "-q", "origin", "HEAD:refs/heads/mill/land-orphan-1")
        with self.assertRaises(slb.Refused):
            slb.overlay(self.work, "mill/land-orphan-1")

    def test_overlay_refuses_names_that_are_not_mill_landing_branches(self):
        for name in ("master", "main", "runpod/land-5", "feature/x", "mill/land-", "mill/land-../../x",
                     "mill/land-a b", "mill/land-care-1\n", "mill/land-x.lock", "refs/heads/mill/land-x", ""):
            with self.assertRaises(slb.Refused, msg=name):
                slb.overlay(self.work, name)


class CommitTests(GitCase):
    def test_outputs_land_on_the_branch_tip_and_deletions_are_carried(self):
        slb.overlay(self.work, BRANCH)
        self.sign_in_workspace()
        before, master_before = self.tip(BRANCH), self.tip("master")
        result = slb.commit_onto_branch(self.work, "mill", BRANCH, "mill-measure: sign compact cards via OIDC board-sign")
        self.assertTrue(result["pushed"])
        after = self.tip(BRANCH)
        self.assertEqual(after, result["commit"])
        self.assertEqual(sh(self.origin, "rev-parse", f"{after}^"), before)          # one commit, on the old tip
        self.assertEqual(sh(self.origin, "rev-list", "--count", f"{before}..{after}"), "1")
        self.assertEqual(self.tip("master"), master_before)                           # master untouched
        names = self.names(BRANCH)
        self.assertIn(f"{INTEROP}/mill-cards-signed/signed-care-abc.json", names)
        self.assertIn(f"{INTEROP}/hub-cards-index-2026-10-13-aaaa.json", names)
        self.assertIn(f"{INTEROP}/crosswalk/intoto/care-new.intoto.json", names)
        self.assertNotIn(f"{INTEROP}/crosswalk/intoto/care-old.intoto.json", names)   # the rename's deletion
        self.assertEqual(self.at(BRANCH, f"{INTEROP}/crosswalk/intoto/index.json"), '{"care": "care-new"}')
        self.assertEqual(self.at(BRANCH, f"{INTEROP}/hub-cards-index-latest.json"), '{"latest": "v2"}')
        self.assertEqual(self.at(BRANCH, f"{INTEROP}/ots/manifest.json"), '{"proofs": 2}')
        self.assertEqual(self.at(BRANCH, "public/llms.txt"), "proofs 2")
        self.assertIn('"superseded_id": "b"', self.at(BRANCH, f"{INTEROP}/mill-cards-signed/SUPERSEDED.jsonl"))
        proof = subprocess.run(["git", "cat-file", "blob", f"refs/heads/{BRANCH}:{INTEROP}/hub-cards-index-2026-10-13-aaaa.json.ots"],
                               cwd=str(self.origin), stdout=subprocess.PIPE).stdout
        self.assertEqual(proof, b"\x00OpenTimestamps\x00\xff\xfe")                     # binary proof, byte for byte
        # Only the output paths moved. The branch keeps its own scripts; master's workspace edits stay home.
        diff = set(sh(self.origin, "diff", "--name-only", before, after).splitlines())
        self.assertTrue(all(p.startswith((f"{INTEROP}/", "public/llms")) for p in diff), diff)
        self.assertNotIn(f"{INTEROP}/hub-cards-index.json", diff)                      # the stamped file is not an output
        self.assertNotIn("scripts/scratch.py", names)
        self.assertIn("BRANCH COPY", self.at(BRANCH, "scripts/sign.py"))
        self.assertEqual(sh(self.origin, "log", "-1", "--format=%an <%ae>", after), "csoai-financial-measure <board@csoai.org>")
        # The workspace itself was not committed to, staged or moved.
        self.assertEqual(sh(self.work, "rev-parse", "HEAD"), master_before)
        self.assertEqual(sh(self.work, "diff", "--cached", "--name-only"), "")

    def test_a_second_run_with_no_change_pushes_nothing(self):
        slb.overlay(self.work, BRANCH)
        self.sign_in_workspace()
        first = slb.commit_onto_branch(self.work, "mill", BRANCH, "sign")
        tip = self.tip(BRANCH)
        second = slb.commit_onto_branch(self.work, "mill", BRANCH, "sign")
        self.assertTrue(first["pushed"])
        self.assertFalse(second["pushed"])
        self.assertEqual(self.tip(BRANCH), tip)

    def test_a_run_that_changed_nothing_pushes_nothing(self):
        tip = self.tip(BRANCH)
        self.assertFalse(slb.commit_onto_branch(self.work, "mill", BRANCH, "sign")["pushed"])
        self.assertEqual(self.tip(BRANCH), tip)

    def test_master_is_refused_as_a_push_target(self):
        self.sign_in_workspace()
        master_before = self.tip("master")
        for target, name in (("mill", "master"), ("runpod", "master"), ("mill", "main"), ("mill", "HEAD"),
                             ("mill", "feature/anything"), ("runpod", "mill/land-care-123"), ("mill", "runpod/land-5")):
            with self.assertRaises(slb.Refused, msg=f"{target} {name}"):
                slb.commit_onto_branch(self.work, target, name, "sign")
        self.assertEqual(self.tip("master"), master_before)
        self.assertEqual(slb.main(["commit", "--target", "mill", "--land-branch", "master", "--message", "sign"]), 1)

    def test_runpod_carries_signed_cards_but_never_the_unsigned_inbox(self):
        sh(self.seed, "push", "-q", "origin", "master:refs/heads/runpod/land-77")
        self.sign_in_workspace()
        put(self.work, f"{INTEROP}/mill-cards-unsigned/unsigned-stray.json", "{}\n")
        result = slb.commit_onto_branch(self.work, "runpod", "runpod/land-77", "runpod-measure: sign", intake_run_id="77")
        self.assertTrue(result["pushed"])
        names = self.names("runpod/land-77")
        self.assertIn(f"{INTEROP}/mill-cards-signed/signed-care-abc.json", names)
        self.assertNotIn(f"{INTEROP}/mill-cards-unsigned/unsigned-stray.json", names)
        with self.assertRaises(slb.Refused):                                           # bound to the intake run id
            slb.commit_onto_branch(self.work, "runpod", "runpod/land-77", "sign", intake_run_id="78")

    def test_a_branch_that_moves_before_the_push_is_rebuilt_on_the_new_tip(self):
        self.sign_in_workspace()

        def someone_else_pushes(attempt: int) -> None:
            if attempt == 1:
                sh(self.seed, "checkout", "-q", BRANCH)
                put(self.seed, "client/src/data/evidence-notes.json", "{}\n")
                self.commit_all("notes: pushed between the signer's fetch and its push")
                sh(self.seed, "push", "-q", "origin", BRANCH)

        result = slb.commit_onto_branch(self.work, "mill", BRANCH, "sign", before_push=someone_else_pushes)
        self.assertTrue(result["pushed"])
        names = self.names(BRANCH)
        self.assertIn("client/src/data/evidence-notes.json", names)                    # their commit survived
        self.assertIn(f"{INTEROP}/mill-cards-signed/signed-care-abc.json", names)       # and so did ours
        self.assertEqual(sh(self.origin, "rev-parse", f"refs/heads/{BRANCH}^"), result["parent"])

    def test_master_ahead_of_the_branch_carries_only_what_this_run_changed(self):
        # Another landing merged after this branch was cut. Its card is in the workspace but is not ours.
        put(self.seed, f"{INTEROP}/mill-cards-signed/signed-other-999.json", '{"signature": "other"}\n')
        put(self.seed, f"{INTEROP}/ots/manifest.json", '{"proofs": "master moved"}\n')
        self.commit_all("master: another landing merged")
        sh(self.seed, "push", "-q", "origin", "master")
        self.park_work_on_master()
        put(self.work, f"{INTEROP}/mill-cards-signed/signed-care-abc.json", '{"signature": "ed25519"}\n')
        result = slb.commit_onto_branch(self.work, "mill", BRANCH, "sign")
        self.assertTrue(result["pushed"])
        names = self.names(BRANCH)
        self.assertIn(f"{INTEROP}/mill-cards-signed/signed-care-abc.json", names)
        self.assertNotIn(f"{INTEROP}/mill-cards-signed/signed-other-999.json", names)
        self.assertEqual(self.at(BRANCH, f"{INTEROP}/ots/manifest.json"), '{"proofs": 1}')

    def test_a_symlink_among_the_outputs_is_refused(self):
        os.symlink("/etc/hostname", str(self.work / INTEROP / "mill-cards-signed" / "signed-link.json"))
        tip = self.tip(BRANCH)
        with self.assertRaises(slb.Refused):
            slb.commit_onto_branch(self.work, "mill", BRANCH, "sign")
        self.assertEqual(self.tip(BRANCH), tip)


class ModeTests(unittest.TestCase):
    def test_master_mode_needs_master_a_land_branch_and_the_right_name(self):
        ok = slb.resolve_mode
        self.assertEqual(ok("runpod", "refs/heads/master", "runpod/land-38312377012", "38312377012"), "master")
        self.assertEqual(ok("mill", "refs/heads/master", "mill/land-hfjobs-37598234183", ""), "master")
        # Names the landers have really used (run history, Sep to Oct 2026).
        for name in ("mill/land-art5-safeguard-34088585326", "mill/land-governance-fda19e078f5a",
                     "mill/land-multi-34831802137", "mill/land-kaggle-34852258950", "mill/land-cross-reality-34083619173"):
            self.assertEqual(ok("mill", "refs/heads/master", name, ""), "master", name)

    def test_branch_mode_is_the_old_form_and_still_passes(self):
        self.assertEqual(slb.resolve_mode("runpod", "refs/heads/runpod/land-5", "", "5"), "branch")
        self.assertEqual(slb.resolve_mode("mill", "refs/heads/mill/land-care-9", "", ""), "branch")
        self.assertEqual(slb.resolve_mode("financial", "refs/heads/master", "", ""), "direct")
        self.assertEqual(slb.resolve_mode("ledger", "refs/heads/master", "", ""), "direct")

    def test_refusals(self):
        cases = [
            ("runpod", "refs/heads/master", "", "5"),                      # master with no landing branch
            ("mill", "refs/heads/master", "", ""),
            ("runpod", "refs/heads/master", "runpod/land-6", "5"),         # not this intake run's branch
            ("runpod", "refs/heads/master", "runpod/land-5", ""),
            ("runpod", "refs/heads/master", "mill/land-care-5", "5"),      # wrong family
            ("mill", "refs/heads/master", "runpod/land-5", ""),
            ("mill", "refs/heads/master", "master", ""),
            ("mill", "refs/heads/master", "mill/land-x\n", ""),
            ("runpod", "refs/heads/master", "runpod/land-5\n", "5"),
            ("runpod", "refs/heads/master", "runpod/land-05", "05"),
            ("mill", "refs/heads/mill/land-care-9", "mill/land-care-9", ""),  # land_branch on a branch dispatch
            ("runpod", "refs/heads/runpod/land-5", "runpod/land-5", "5"),
            ("mill", "refs/tags/v1", "", ""),
            ("runpod", "refs/pull/1/merge", "", "5"),
            ("financial", "refs/heads/master", "mill/land-x", ""),
            ("anything", "refs/heads/master", "", ""),
        ]
        for case in cases:
            with self.assertRaises(slb.Refused, msg=case):
                slb.resolve_mode(*case)

    def test_mode_command_writes_the_output_and_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmp, contextlib.redirect_stdout(io.StringIO()), \
                contextlib.redirect_stderr(io.StringIO()):
            sink = os.path.join(tmp, "out")
            self.assertEqual(slb.main(["mode", "--target", "mill", "--dispatch-ref", "refs/heads/mill/land-a-1",
                                       "--land-branch", "", "--intake-run-id", "", "--github-output", sink]), 0)
            self.assertEqual(Path(sink).read_text(), "mode=branch\n")
            self.assertEqual(slb.main(["mode", "--target", "mill", "--dispatch-ref", "refs/heads/master",
                                       "--land-branch", "", "--github-output", sink]), 1)
            self.assertEqual(Path(sink).read_text(), "mode=branch\n")      # a refusal writes no mode


class FakeGh:
    """Stands in for the gh CLI. `runs` is what `gh run list` would return, newest first."""

    def __init__(self, runs=None, refuse_master=False, on_dispatch=None):
        self.runs = list(runs or [])
        self.refuse_master = refuse_master
        self.on_dispatch = on_dispatch
        self.calls = []

    def dispatches(self):
        return [c for c in self.calls if c[:3] == ["gh", "workflow", "run"]]

    def __call__(self, cmd):
        self.calls.append(list(cmd))
        done = lambda code, text="", err="": types.SimpleNamespace(returncode=code, stdout=text, stderr=err)
        if cmd[:3] == ["gh", "workflow", "run"]:
            ref = cmd[cmd.index("--ref") + 1]
            if ref == "master" and self.refuse_master:
                return done(1, err="HTTP 422: Unexpected inputs provided: [\"land_branch\"]")
            if self.on_dispatch:
                self.on_dispatch(self, ref)
            return done(0)
        if cmd[:3] == ["gh", "run", "list"]:
            rows = self.runs
            if "--branch" in cmd:
                rows = [r for r in rows if r["headBranch"] == cmd[cmd.index("--branch") + 1]]
            if "-L" in cmd:
                rows = rows[:int(cmd[cmd.index("-L") + 1])]
            return done(0, json.dumps(rows))
        if cmd[:3] == ["gh", "run", "view"]:
            return done(0, json.dumps({"jobs": [{"steps": [{"name": "Set up job", "conclusion": "success"},
                                                             {"name": "commit signed cards onto the landing branch", "conclusion": "failure"}]}]}))
        return done(1, err="unexpected")


def a_run(run_id, branch, title, status="completed", conclusion="success"):
    return {"databaseId": run_id, "headBranch": branch, "displayTitle": title, "status": status,
            "conclusion": conclusion, "createdAt": "2026-10-13T07:00:00Z"}


class LanderTests(unittest.TestCase):
    def setUp(self) -> None:
        # Captured on purpose: a "::warning::" line or a job-summary line written by a test would
        # show up in the real job that runs these tests (the gate, and the signer's self-test).
        self.err = io.StringIO()
        for stream in (contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(self.err)):
            stream.__enter__()
            self.addCleanup(stream.__exit__, None, None, None)
        env = mock.patch.dict(os.environ)
        env.start()
        self.addCleanup(env.stop)
        os.environ.pop("GITHUB_STEP_SUMMARY", None)
        self.sleeps = []

    def test_the_fallback_warning_reaches_the_job_summary(self):
        with tempfile.TemporaryDirectory() as tmp:
            os.environ["GITHUB_STEP_SUMMARY"] = os.path.join(tmp, "summary.md")
            slb.dispatch("mill", "mill/land-care-5", "5", run=FakeGh(refuse_master=True))
            self.assertIn(slb.FALLBACK_MARK, Path(tmp, "summary.md").read_text())

    def test_the_commit_message_names_the_master_commit_and_the_run(self):
        os.environ.update({"GITHUB_SHA": "a" * 40, "GITHUB_RUN_ID": "77", "GITHUB_RUN_ATTEMPT": "2"})
        text = slb.provenance("runpod-measure: sign compact cards via OIDC board-sign", "runpod/land-5")
        self.assertEqual(text.splitlines()[0], "runpod-measure: sign compact cards via OIDC board-sign")
        self.assertIn("runpod/land-5 was read as data only", text)
        self.assertIn("Code: " + "a" * 40, text)
        self.assertIn("Run: 77 attempt 2", text)

    def test_dispatch_goes_to_master_with_the_landing_branch_as_an_input(self):
        gh = FakeGh(runs=[a_run(900, "master", "sign runpod runpod/land-1")])
        result = slb.dispatch("runpod", "runpod/land-38312377012", "38312377012", run=gh)
        self.assertEqual(result, {"signer_mode": "master", "signer_after": 900})
        self.assertEqual(gh.dispatches(), [["gh", "workflow", "run", "hf-fin-shells-measure.yml", "--ref", "master",
                                            "-f", "target=runpod", "-f", "intake_run_id=38312377012",
                                            "-f", "land_branch=runpod/land-38312377012"]])
        self.assertNotIn(slb.FALLBACK_MARK, self.err.getvalue())

    def test_mill_dispatch_passes_mill_run_id(self):
        gh = FakeGh()
        slb.dispatch("mill", "mill/land-hfjobs-37598234183", "37598234183", run=gh)
        self.assertEqual(gh.dispatches()[0][5:], ["master", "-f", "target=mill", "-f", "mill_run_id=37598234183",
                                                  "-f", "land_branch=mill/land-hfjobs-37598234183"])

    def test_dispatch_falls_back_to_the_branch_when_github_refuses_master(self):
        gh = FakeGh(refuse_master=True)
        result = slb.dispatch("mill", "mill/land-care-5", "5", run=gh)
        self.assertEqual(result["signer_mode"], "branch")
        self.assertEqual([d[5] for d in gh.dispatches()], ["master", "mill/land-care-5"])
        self.assertNotIn("land_branch=mill/land-care-5", gh.dispatches()[1])          # the old form, exactly
        self.assertIn(slb.FALLBACK_MARK, self.err.getvalue())

    def test_dispatch_uses_the_branch_form_for_a_name_master_mode_would_refuse(self):
        gh = FakeGh()
        result = slb.dispatch("mill", "mill/land-odd axis-5", "5", run=gh)
        self.assertEqual(result["signer_mode"], "branch")
        self.assertEqual([d[5] for d in gh.dispatches()], ["mill/land-odd axis-5"])
        self.assertIn(slb.FALLBACK_MARK, self.err.getvalue())

    def test_wait_finds_its_own_run_on_master_by_title_and_id(self):
        title = "sign runpod runpod/land-5"
        gh = FakeGh(runs=[
            a_run(1004, "master", "sign mill mill/land-care-9", conclusion="failure"),   # another landing, newer
            a_run(1003, "master", title),                                                # ours
            a_run(1002, "runpod/land-5", title, conclusion="failure"),                   # same title, not on master
            a_run(1000, "master", title, conclusion="failure"),                          # same title, before our dispatch
        ])
        result = slb.wait("runpod", "runpod/land-5", "5", "master", 1001, 3, 20, 30, run=gh, sleep=self.sleeps.append)
        self.assertEqual(result, {"conclusion": "success", "signer_run_id": 1003, "signer_mode": "master", "fallback": "false"})
        self.assertEqual(gh.dispatches(), [])
        listing = [c for c in gh.calls if c[:3] == ["gh", "run", "list"]][0]
        self.assertEqual(listing[listing.index("--branch") + 1], "master")             # never --branch <landing branch>
        self.assertNotIn(slb.FALLBACK_MARK, self.err.getvalue())

    def test_wait_keeps_polling_until_the_run_completes(self):
        title = "sign mill mill/land-care-5"
        gh = FakeGh(runs=[a_run(11, "master", title, status="in_progress", conclusion="")])
        polls = []

        def sleep(seconds):
            polls.append(seconds)
            if len(polls) == 3:
                gh.runs[0] = a_run(11, "master", title)
        result = slb.wait("mill", "mill/land-care-5", "5", "master", 10, 10, 15, 20, run=gh, sleep=sleep)
        self.assertEqual(result["conclusion"], "success")
        self.assertEqual(polls, [20, 15, 15])

    def test_a_failed_master_run_starts_the_branch_dispatch_once_and_says_so(self):
        title = "sign runpod runpod/land-5"

        def branch_run_appears(gh, ref):
            gh.runs.insert(0, a_run(1010, ref, title))
        gh = FakeGh(runs=[a_run(1003, "master", title, conclusion="failure")], on_dispatch=branch_run_appears)
        result = slb.wait("runpod", "runpod/land-5", "5", "master", 1001, 3, 20, 30, run=gh, sleep=self.sleeps.append)
        self.assertEqual(result, {"conclusion": "success", "signer_run_id": 1010, "signer_mode": "branch-fallback", "fallback": "true"})
        self.assertEqual(gh.dispatches(), [["gh", "workflow", "run", "hf-fin-shells-measure.yml", "--ref", "runpod/land-5",
                                            "-f", "target=runpod", "-f", "intake_run_id=5"]])
        said = self.err.getvalue()
        self.assertIn(slb.FALLBACK_MARK, said)
        self.assertIn("1003", said)
        self.assertIn("commit signed cards onto the landing branch", said)             # the step that failed is named

    def test_a_failed_fallback_is_reported_as_failed_not_retried(self):
        title = "sign runpod runpod/land-5"

        def branch_run_fails(gh, ref):
            gh.runs.insert(0, a_run(1010, ref, title, conclusion="failure"))
        gh = FakeGh(runs=[a_run(1003, "master", title, conclusion="failure")], on_dispatch=branch_run_fails)
        result = slb.wait("runpod", "runpod/land-5", "5", "master", 1001, 3, 20, 30, run=gh, sleep=self.sleeps.append)
        self.assertEqual(result["conclusion"], "failure")
        self.assertEqual(len(gh.dispatches()), 1)

    def test_a_run_that_never_shows_or_never_ends_is_unknown_and_starts_no_second_signer(self):
        gh = FakeGh(runs=[a_run(1000, "master", "sign runpod runpod/land-5")])
        result = slb.wait("runpod", "runpod/land-5", "5", "master", 1001, 2, 20, 30, run=gh, sleep=self.sleeps.append)
        self.assertEqual(result["conclusion"], "unknown")
        self.assertEqual(gh.dispatches(), [])
        gh = FakeGh(runs=[a_run(1003, "master", "sign runpod runpod/land-5", status="in_progress", conclusion="")])
        result = slb.wait("runpod", "runpod/land-5", "5", "master", 1001, 2, 20, 30, run=gh, sleep=self.sleeps.append)
        self.assertEqual(result["conclusion"], "unknown")
        self.assertEqual(gh.dispatches(), [])

    def test_wait_in_branch_mode_looks_on_the_branch_and_never_falls_back(self):
        gh = FakeGh(runs=[a_run(1003, "mill/land-care-5", "sign mill mill/land-care-5", conclusion="failure")])
        result = slb.wait("mill", "mill/land-care-5", "5", "branch", 1001, 2, 15, 20, run=gh, sleep=self.sleeps.append)
        self.assertEqual(result["conclusion"], "failure")
        self.assertEqual(result["signer_mode"], "branch")
        self.assertEqual(gh.dispatches(), [])


def step_blocks(text: str) -> list:
    """Split a workflow's steps on their '      - ' markers. Text only: no YAML library on the gate."""
    return re.split(r"\n(?=      - (?:name|uses): )", text)


def block_named(text: str, fragment: str) -> str:
    found = [b for b in step_blocks(text) if fragment in b.split("\n", 1)[0]]
    if len(found) != 1:
        raise AssertionError(f"expected one step named like {fragment!r}, found {len(found)}")
    return found[0]


class WorkflowTextTests(unittest.TestCase):
    """The workflow files are the other half of this change. Read as text, pinned where it matters."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.measure = (WORKFLOWS / "hf-fin-shells-measure.yml").read_text(encoding="utf-8")
        cls.landers = {name: (WORKFLOWS / name).read_text(encoding="utf-8")
                       for name in ("runpod-land.yml", "hub-queue-land.yml", "mill-jobs-land.yml")}

    def test_signer_takes_land_branch_and_names_its_run_for_the_landers(self):
        self.assertRegex(self.measure, r"\n      land_branch:\n")
        self.assertIn("\nrun-name: sign ${{ inputs.target || 'financial' }} ${{ inputs.land_branch || github.ref_name }}\n",
                      self.measure)
        self.assertEqual(slb.run_title("runpod", "runpod/land-5"), "sign runpod runpod/land-5")
        self.assertTrue(self.measure.startswith("name: hf-fin-shells-measure\n"))      # the signer's allowlist key

    def test_the_mode_step_gets_every_input_and_runs_before_any_other_script(self):
        mode = block_named(self.measure, "Resolve the signing mode")
        for needle in ("id: mode", "sign_land_branch.py mode", '--land-branch "$LAND_BRANCH"',
                       '--intake-run-id "$INTAKE_RUN_ID"', '--dispatch-ref "$DISPATCH_REF"',
                       "LAND_BRANCH: ${{ inputs.land_branch }}", "DISPATCH_REF: ${{ github.ref }}"):
            self.assertIn(needle, mode)
        self.assertLess(self.measure.index("sign_land_branch.py mode"), self.measure.index("runpod_signing_artifact.py prepare"))
        self.assertLess(self.measure.index("sign_land_branch.py mode"), self.measure.index("sign_mill_cards.py"))

    def test_runpod_guard_admits_master_only_in_master_mode(self):
        prepare = block_named(self.measure, "Prepare only the verified RunPod artifact")
        self.assertIn("SIGN_MODE: ${{ steps.mode.outputs.mode }}", prepare)
        self.assertIn('[[ "$SIGN_MODE" == master || ( "$DISPATCH_REF" == refs/heads/* && "$DISPATCH_REF" != refs/heads/master ) ]]',
                      prepare)

    def test_the_overlay_is_mill_only_master_only_and_before_the_card_selection(self):
        overlay = block_named(self.measure, "Read the landing branch as data")
        self.assertIn("if: steps.mode.outputs.mode == 'master' && inputs.target == 'mill'", overlay)
        self.assertIn('sign_land_branch.py overlay --land-branch "$LAND_BRANCH"', overlay)
        self.assertLess(self.measure.index("sign_land_branch.py overlay"), self.measure.index("Select one exact mill run"))

    def test_master_mode_pushes_to_the_input_and_never_to_the_dispatch_ref(self):
        land = block_named(self.measure, "commit signed cards onto the landing branch")
        self.assertIn("if: steps.mode.outputs.mode == 'master'", land)
        self.assertIn("LAND_BRANCH: ${{ inputs.land_branch }}", land)
        self.assertIn('--land-branch "$LAND_BRANCH"', land)
        self.assertNotIn("github.ref_name", land)
        self.assertNotIn("git push", land)
        old = block_named(self.measure, "commit signed cards (branch dispatch")
        self.assertIn("if: steps.mode.outputs.mode != 'master'", old)
        self.assertIn("DISPATCH_BRANCH: ${{ github.ref_name }}", old)
        # github.ref_name appears in the run title and in the branch-mode step, nowhere else.
        self.assertEqual(self.measure.count("github.ref_name"), 2)
        # The input reaches the shell through env only, never pasted into a script line.
        for line in self.measure.splitlines():
            if "inputs.land_branch" in line:
                self.assertRegex(line.strip(), r"^(run-name: .*|LAND_BRANCH: \$\{\{ inputs\.land_branch \}\})$")

    def test_branch_mode_and_master_mode_carry_the_same_output_paths(self):
        old = block_named(self.measure, "commit signed cards (branch dispatch")
        for target in ("mill", "runpod"):
            section = re.search(r'\[ "\$T" = "%s" \]; then\n(.*?)\n          (?:elif|else)' % target, old, re.S).group(1)
            added = [word for line in section.splitlines() if line.strip().startswith("git add ")
                     for word in line.split()[2:]]
            self.assertEqual(sorted(added), sorted(slb.OUTPUTS[target]), target)

    def test_landers_dispatch_through_the_script_and_keep_the_pr_gates_dispatch(self):
        targets = {"runpod-land.yml": "runpod", "hub-queue-land.yml": "mill", "mill-jobs-land.yml": "mill"}
        for name, text in self.landers.items():
            self.assertNotIn("gh workflow run hf-fin-shells-measure.yml", text, name)   # no direct dispatch left
            self.assertNotRegex(text, r"gh run list --workflow hf-fin-shells-measure\.yml", name)
            self.assertEqual(text.count(f"sign_land_branch.py dispatch --target {targets[name]} "), 1, name)
            self.assertEqual(text.count(f"sign_land_branch.py wait --target {targets[name]} "), 1, name)
            self.assertIn('--land-branch "$BR"', text, name)
            # A workflow-token PR gets no pull_request checks; the landers still ask for pr-gates themselves.
            self.assertIn('gh workflow run pr-gates.yml --ref "$BR"', text, name)
        self.assertIn("--require-success", self.landers["runpod-land.yml"])            # no PR unless the signer succeeded

    def test_the_branch_names_the_landers_build_are_names_master_mode_takes(self):
        self.assertIn('BR="runpod/land-${RUN_ID}"', self.landers["runpod-land.yml"])
        self.assertIn('BR="mill/land-${AXIS}-${RUN_ID}"', self.landers["hub-queue-land.yml"])
        self.assertIn('BR="mill/land-hfjobs-${{ github.run_id }}"', self.landers["mill-jobs-land.yml"])
        slb.check_land_branch("runpod", "runpod/land-38312377012", "38312377012")
        slb.check_land_branch("mill", "mill/land-pedagogical-scaffolding-38343620041")
        slb.check_land_branch("mill", "mill/land-hfjobs-38315542833")

    def test_this_file_is_in_the_required_gate(self):
        gates = (WORKFLOWS / "pr-gates.yml").read_text(encoding="utf-8")
        self.assertIn("python3 -m pytest -q scripts/test_sign_land_branch.py", gates)


if __name__ == "__main__":
    unittest.main()
