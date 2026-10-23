#!/usr/bin/env python3
"""Offline continuity tests: real collector, local Git, simulated GitHub."""
from __future__ import annotations

import copy
import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest import mock
from urllib.parse import parse_qs

import provider_watch as pw
import provider_watch_promotion as promotion
import test_provider_watch as fixtures


def git(cwd: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", *args], cwd=cwd, check=True,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
    )
    return result.stdout.strip()


class LocalGitHub(promotion.Repository):
    """Run Git normally; simulate only GitHub API/PR operations."""

    def __init__(self, root: Path):
        super().__init__(root, "CSOAI-ORG/councilof-ai")
        self.prs: list[dict] = []
        self.fail_create = False
        self.commands: list[list[str]] = []

    def check_origin(self) -> None:
        # This fixture's origin is a private temporary bare repository.
        pass

    def command(self, args, data=None, env=None):
        self.commands.append(list(args))
        if args[:2] == ["gh", "api"]:
            query = parse_qs(args[-1].partition("?")[2])
            rows = copy.deepcopy(self.prs)
            heads = self.heads()
            for row in rows:
                if row["head"]["repo"]["full_name"] == self.name:
                    row["head"]["sha"] = heads.get(
                        row["head"]["ref"], row["head"]["sha"],
                    )
            if query.get("state") == ["open"]:
                rows = [row for row in rows if row["state"] == "open"]
            if "head" in query:
                branch = query["head"][0].split(":", 1)[1]
                rows = [row for row in rows if row["head"]["ref"] == branch]
            return json.dumps([rows]).encode()
        if args[:3] == ["gh", "pr", "create"]:
            if self.fail_create:
                raise RuntimeError("fixture: PR creation failed after push")
            branch = args[args.index("--head") + 1]
            self.prs.append({
                "number": len(self.prs) + 1,
                "state": "open",
                "base": {"ref": "master"},
                "head": {
                    "ref": branch,
                    "sha": self.heads()[branch],
                    "repo": {"full_name": self.name},
                },
            })
            return b"https://github.com/CSOAI-ORG/councilof-ai/pull/1\n"
        return super().command(args, data, env)


class PromotionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.home = Path(self.temp.name)
        self.origin = self.home / "origin.git"
        self.root = self.home / "checkout"
        self.root.mkdir()
        git(self.home, "init", "--bare", "--initial-branch=master", str(self.origin))
        git(self.root, "init", "--initial-branch=master")
        git(self.root, "config", "user.name", "fixture")
        git(self.root, "config", "user.email", "fixture@example.test")
        git(self.root, "remote", "add", "origin", str(self.origin))
        self.feed = self.root / promotion.FEED
        self.feed.mkdir(parents=True)
        state = {
            "schema": pw.STATE_SCHEMA,
            "normaliser": pw.NORMALISER,
            "created_at": "2026-09-30T00:00:00Z",
            "updated_at": "2026-09-30T00:00:00Z",
            "targets": {},
            "runs": [],
        }
        self.write_state(self.feed, state)
        self.observation_count = 0
        self.observe(self.feed, 1, "original")
        self.observe(self.feed, 2, "original")
        (self.root / "trusted-master-code.txt").write_text("master code\n")
        git(self.root, "add", "public/feeds/provider-diff", "trusted-master-code.txt")
        git(self.root, "commit", "-m", "fixture published baseline")
        git(self.root, "push", "origin", "master")
        self.master = git(self.root, "rev-parse", "HEAD")
        self.repo = LocalGitHub(self.root)
        self.published = promotion.read_directory(self.feed)

    def write_state(self, directory, state):
        directory.mkdir(parents=True, exist_ok=True)
        (directory / "state.json").write_text(json.dumps(state))
        (directory / "index.json").write_text(
            json.dumps(pw.build_index(state, [fixtures.T_A]))
        )

    def observe(self, directory, day, text, status=200):
        state = pw.load_state(directory / "state.json")
        (directory / "leaves").mkdir(parents=True, exist_ok=True)
        url = fixtures.T_A["url"]
        body = (
            "<html><head><title>Provider policy</title></head><body>"
            f"<main><h1>Usage policy</h1><p>{text}. "
            "This public policy describes permitted use and document changes."
            "</p></main></body></html>"
        ).encode()
        fetch = fixtures.fake_fetcher({
            "https://acme.example/robots.txt": fixtures._res(
                200, b"User-agent: *\nAllow: /\n",
                {"content-type": "text/plain"},
            ),
            url: fixtures._res(
                status, body, {"content-type": "text/html"}, final_url=url,
            ),
        })
        pw.run_once(
            [fixtures.T_A], state, fetch, fixtures.UA,
            directory / "leaves",
            run_at=f"2026-10-{day:02d}T05:20:00Z", pause=0,
        )
        self.observation_count += 1
        self.write_state(directory, state)
        return state

    def prepare(self, run_id, dry_run=False):
        bundle = self.home / ("bundle-" + run_id)
        bundle.mkdir()
        receipt = promotion.prepare(self.repo, bundle, run_id, dry_run)
        return bundle, receipt

    def completed(self, run_id, day, text="changed"):
        bundle, receipt = self.prepare(run_id)
        self.observe(bundle / "capture", day, text)
        promotion.finalize(bundle, 0)
        return bundle, receipt

    def push_count(self):
        return sum(command[:2] == ["git", "push"] for command in self.repo.commands)

    def test_two_captures_continue_one_pr_and_confirm_pending_change(self):
        first, selected = self.completed("101", 3)
        first_result = promotion.promote(self.repo, first, "7001")
        pending = pw.load_state(first / "capture/state.json")
        target = fixtures.T_A["id"]
        self.assertIsNotNone(pending["targets"][target]["pending"])

        second, selected_again = self.completed("102", 4)
        self.assertEqual(selected_again["baseline_sha"], first_result["commit_sha"])
        self.assertEqual(selected_again["branch"], selected["branch"])
        second_result = promotion.promote(self.repo, second, "7002")
        captured = promotion.read_directory(second / "capture")
        state = promotion.validate_snapshot(captured)

        self.assertEqual(len(self.repo.prs), 1)
        self.assertEqual(first_result["pr_number"], second_result["pr_number"])
        self.assertEqual(
            git(self.root, "rev-parse", second_result["commit_sha"] + "^"),
            first_result["commit_sha"],
        )
        self.assertIsNone(state["targets"][target].get("pending"))
        self.assertNotEqual(
            state["targets"][target]["last_ok"]["norm_sha256"],
            json.loads(self.published[promotion.FEED + "state.json"])
            ["targets"][target]["last_ok"]["norm_sha256"],
        )
        promotion.assert_extends(self.published, captured)
        self.assertEqual(git(self.root, "rev-parse", "HEAD"), self.master)
        self.assertEqual((self.root / "trusted-master-code.txt").read_text(), "master code\n")
        self.assertFalse(any("--force" in command for command in self.repo.commands))

    def test_downloaded_pre_push_bundle_recreates_exact_commit(self):
        bundle, _ = self.completed("201", 3)
        downloaded = self.home / "downloaded-artifact"
        shutil.copytree(bundle, downloaded)  # Artifact precedes commit and push.
        self.assertNotIn(
            "commit_sha", json.loads((downloaded / "promotion.json").read_text())
        )
        self.repo.fail_create = True
        with self.assertRaisesRegex(RuntimeError, "PR creation failed"):
            promotion.promote(self.repo, bundle, "7101")
        pushed = next(iter(self.repo.heads().values()))
        pushes = self.push_count()

        self.repo.fail_create = False
        with mock.patch.dict(os.environ, {
            "GIT_AUTHOR_DATE": "2030-01-01T00:00:00Z",
            "GIT_COMMITTER_DATE": "2031-01-01T00:00:00Z",
            "GIT_AUTHOR_NAME": "unrelated inherited identity",
            "GIT_COMMITTER_NAME": "unrelated inherited identity",
        }):
            result = promotion.promote(self.repo, downloaded, "7102")
        self.assertEqual(result["commit_sha"], pushed)
        self.assertEqual(self.push_count(), pushes)
        self.assertEqual(len(self.repo.prs), 1)

    def test_orphan_recovery_does_not_capture_fetch_commit_or_push(self):
        bundle, _ = self.completed("301", 3)
        self.repo.fail_create = True
        with self.assertRaises(RuntimeError):
            promotion.promote(self.repo, bundle, "7201")
        original = promotion.read_directory(bundle / "capture")
        observations = self.observation_count
        recovered, receipt = self.prepare("302")
        self.assertEqual(receipt["state"], "RESUME_PUBLICATION")
        self.assertEqual(promotion.read_directory(recovered / "capture"), original)
        start = len(self.repo.commands)
        self.repo.fail_create = False
        result = promotion.promote(self.repo, recovered, "7202")
        self.assertEqual(result["state"], "REVIEW_PENDING")
        self.assertEqual(self.observation_count, observations)
        forbidden = {"fetch", "push", "commit-tree", "hash-object", "update-index"}
        self.assertFalse(any(
            len(command) > 1 and command[0] == "git" and command[1] in forbidden
            for command in self.repo.commands[start:]
        ))

    def test_orphan_dry_run_stays_capture_eligible_without_publication(self):
        bundle, _ = self.completed("351", 3)
        self.repo.fail_create = True
        with self.assertRaises(RuntimeError):
            promotion.promote(self.repo, bundle, "7251")
        original = promotion.read_directory(bundle / "capture")
        heads, pushes = self.repo.heads(), self.push_count()
        dry, receipt = self.prepare("352", dry_run=True)
        self.assertEqual(receipt["state"], "PREPARED")
        self.assertFalse(receipt.get("resume_only"))
        self.assertTrue(receipt["dry_run"])
        self.assertEqual(promotion.read_directory(dry / "capture"), original)
        self.assertEqual(self.repo.heads(), heads)
        self.assertEqual(self.push_count(), pushes)
        with self.assertRaises(ValueError):
            promotion.promote(self.repo, dry, "7252")

    def test_moved_head_is_not_overwritten(self):
        first, _ = self.completed("401", 3)
        first_result = promotion.promote(self.repo, first, "7301")
        second, receipt = self.completed("402", 4)
        parent = first_result["commit_sha"]
        tree = git(self.root, "rev-parse", parent + "^{tree}")
        other = self.repo.git(
            "commit-tree", tree, "-p", parent, data=b"other writer\n",
        ).decode().strip()
        git(self.root, "push", "origin", other + ":refs/heads/" + receipt["branch"])
        with self.assertRaisesRegex(ValueError, "Pending head moved"):
            promotion.promote(self.repo, second, "7302")
        self.assertEqual(self.repo.heads()[receipt["branch"]], other)

    def test_missing_artifact_and_dry_run_cannot_publish(self):
        bundle, _ = self.completed("501", 3)
        with self.assertRaisesRegex(ValueError, "artifact id"):
            promotion.promote(self.repo, bundle, "")
        dry, _ = self.prepare("502", dry_run=True)
        with self.assertRaises(ValueError):
            promotion.finalize(dry, 0)
        with self.assertRaises(ValueError):
            promotion.promote(self.repo, dry, "7401")
        self.assertEqual(self.repo.heads(), {})

    def test_outage_retains_pending_confirmation_and_last_ok(self):
        first, _ = self.completed("601", 3)
        promotion.promote(self.repo, first, "7501")
        second, _ = self.prepare("602")
        before = pw.load_state(second / "capture/state.json")
        after = self.observe(second / "capture", 4, "outage", status=503)
        target = fixtures.T_A["id"]
        self.assertEqual(
            after["targets"][target]["last_ok"],
            before["targets"][target]["last_ok"],
        )
        self.assertEqual(
            after["targets"][target]["pending"],
            before["targets"][target]["pending"],
        )
        receipt = promotion.finalize(second, 2)
        self.assertEqual(receipt["capture_exit"], 2)
        self.assertEqual(receipt["state"], "CAPTURE_QUALIFIED")

    def test_corrupt_successful_capture_fields_are_rejected(self):
        original = pw.load_state(self.feed / "state.json")
        target = fixtures.T_A["id"]
        for capture_key in ("latest", "last_ok"):
            for field, value in (
                ("bytes_sha256", None), ("norm_sha256", None),
                ("byte_length", None), ("byte_length", -1),
                ("byte_length", True),
            ):
                with self.subTest(capture=capture_key, field=field, value=value):
                    bad = copy.deepcopy(original)
                    bad["targets"][target][capture_key][field] = value
                    path = self.home / "corrupt-state.json"
                    path.write_text(json.dumps(bad))
                    with self.assertRaises(ValueError):
                        pw.load_state(path)
        path = self.home / "invalid-json.json"
        path.write_text("{not json")
        with self.assertRaises(ValueError):
            pw.load_state(path)

    def test_foreign_matching_branch_is_excluded_without_fetching(self):
        foreign = "automation/provider-watch-2026-10-20T0520Z"
        self.repo.prs.append({
            "number": 999, "state": "open", "base": {"ref": "master"},
            "head": {
                "ref": foreign, "sha": "a" * 40,
                "repo": {"full_name": "someone-else/councilof-ai"},
            },
        })
        _, receipt = self.prepare("701")
        self.assertEqual(receipt["state"], "PREPARED")
        self.assertEqual(
            receipt["not_imported"][0]["state"],
            "FOREIGN_OR_OTHER_BASE_NOT_IMPORTED",
        )
        self.assertFalse(any(
            command[:2] == ["git", "fetch"]
            and "refs/heads/" + foreign in command
            for command in self.repo.commands
        ))

    def test_history_leaf_and_path_rewrites_are_rejected(self):
        files = dict(self.published)
        state = json.loads(files[promotion.FEED + "state.json"])
        state["runs"] = state["runs"][1:]
        files[promotion.FEED + "state.json"] = json.dumps(state).encode()
        files[promotion.FEED + "index.json"] = json.dumps(
            pw.build_index(state, [fixtures.T_A])
        ).encode()
        with self.assertRaises(ValueError):
            promotion.assert_extends(self.published, files)

        files = dict(self.published)
        leaf = next(path for path in files if "/leaves/" in path)
        files[leaf] = files[leaf] + b"\n"  # Valid JSON; immutable bytes changed.
        with self.assertRaisesRegex(ValueError, "Immutable provider leaf"):
            promotion.assert_extends(self.published, files)

        directory = self.home / "unsafe"
        promotion.materialize(self.published, directory)
        (directory / "unexpected.py").write_text("untrusted\n")
        with self.assertRaisesRegex(ValueError, "Unexpected provider output"):
            promotion.read_directory(directory)
        (directory / "unexpected.py").unlink()
        (directory / "state.json").unlink()
        (directory / "state.json").symlink_to(self.feed / "state.json")
        with self.assertRaisesRegex(ValueError, "Symlink"):
            promotion.read_directory(directory)


if __name__ == "__main__":
    unittest.main()
