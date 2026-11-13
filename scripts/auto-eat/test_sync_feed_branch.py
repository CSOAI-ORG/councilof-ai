#!/usr/bin/env python3
"""Integration tests for safe migration of the legacy auto-eat feed branch."""
import subprocess
import tempfile
import unittest
from pathlib import Path

HELPER = Path(__file__).with_name("sync_feed_branch.py")


def run(repo, *args, check=True):
    p = subprocess.run(
        ["git", "-C", str(repo), *args],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
    )
    if check and p.returncode:
        raise AssertionError(p.stderr)
    return p


def put(repo, name, value):
    path = repo / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(value, encoding="utf-8")


class SyncFeedBranchTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="eat-feed-sync-test-")
        self.repo = Path(self.tmp.name)
        run(self.repo, "init", "-b", "master")
        run(self.repo, "config", "user.name", "EAT sync test")
        run(self.repo, "config", "user.email", "eat-sync-test@example.invalid")
        put(self.repo, "README.md", "current master README\n")
        put(self.repo, "master-only.txt", "current master only\n")
        put(self.repo, "scripts/auto-eat/eat-loop.sh", "current master keeper code\n")
        put(self.repo, "scripts/auto-eat/STATUS.md", "master status (must be replaced)\n")
        put(self.repo, "public/interop/auto-eat/cards-compact.json", "{}\n")
        put(self.repo, "public/interop/auto-eat/queue.jsonl", "master queue\n")
        put(self.repo, "public/interop/auto-eat/master-only.json", "{}\n")
        run(self.repo, "add", "-A")
        run(self.repo, "commit", "-m", "master root")
        self.master = run(self.repo, "rev-parse", "HEAD").stdout.strip()

        run(self.repo, "checkout", "--orphan", "feed")
        run(self.repo, "rm", "-rf", ".", check=False)
        put(self.repo, "README.md", "stale feed README (must not survive)\n")
        put(self.repo, "legacy-only.txt", "stale non-feed file (must not survive)\n")
        put(self.repo, "scripts/auto-eat/eat-loop.sh", "stale keeper code (must not survive)\n")
        put(self.repo, "scripts/auto-eat/STATUS.md", "feed-owned status\n")
        put(self.repo, "public/interop/auto-eat/cards-compact.json", "{\"feed\":true}\n")
        put(self.repo, "public/interop/auto-eat/queue.jsonl", "feed queue\n")
        put(self.repo, "public/interop/auto-eat/probed.json", "{}\n")
        run(self.repo, "add", "-A")
        run(self.repo, "commit", "-m", "legacy feed root")
        self.feed = run(self.repo, "rev-parse", "HEAD").stdout.strip()
        run(self.repo, "update-ref", "refs/remotes/origin/feed", self.feed)

    def tearDown(self):
        self.tmp.cleanup()

    def migrate(self):
        return subprocess.run(
            ["python3", str(HELPER), "--branch", "feed", "--master", "master"],
            cwd=self.repo, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
        )

    def test_unrelated_history_becomes_fast_forward_safe_master_plus_feed(self):
        self.assertNotEqual(
            run(self.repo, "merge-base", "feed", "master", check=False).returncode, 0
        )
        p = self.migrate()
        self.assertEqual(p.returncode, 0, p.stdout + p.stderr)
        head = run(self.repo, "rev-parse", "HEAD").stdout.strip()
        parents = run(self.repo, "rev-list", "--parents", "-n", "1", head).stdout.split()
        self.assertEqual(parents[1:], [self.feed, self.master])
        self.assertEqual(run(self.repo, "show", "HEAD:README.md").stdout, "current master README\n")
        self.assertEqual(
            run(self.repo, "show", "HEAD:scripts/auto-eat/eat-loop.sh").stdout,
            "current master keeper code\n",
        )
        self.assertEqual(
            run(self.repo, "show", "HEAD:scripts/auto-eat/STATUS.md").stdout,
            "feed-owned status\n",
        )
        self.assertEqual(
            run(self.repo, "show", "HEAD:public/interop/auto-eat/cards-compact.json").stdout,
            "{\"feed\":true}\n",
        )
        self.assertEqual(
            run(self.repo, "show", "HEAD:public/interop/auto-eat/queue.jsonl").stdout,
            "feed queue\n",
        )
        self.assertEqual(run(self.repo, "show", "HEAD:master-only.txt").stdout, "current master only\n")
        self.assertNotEqual(run(self.repo, "cat-file", "-e", "HEAD:legacy-only.txt", check=False).returncode, 0)
        self.assertEqual(
            run(self.repo, "show", "HEAD:public/interop/auto-eat/master-only.json").stdout,
            "{}\n",  # later master-only evidence must never be silently deleted
        )
        self.assertEqual(run(self.repo, "merge-base", "HEAD", "master").stdout.strip(), self.master)
        self.assertEqual(
            run(self.repo, "merge-base", "HEAD", "refs/remotes/origin/feed").stdout.strip(),
            self.feed,
        )
        self.assertEqual(run(self.repo, "status", "--porcelain").stdout, "")

    def test_second_sync_is_idempotent(self):
        first = self.migrate()
        self.assertEqual(first.returncode, 0, first.stdout + first.stderr)
        head = run(self.repo, "rev-parse", "HEAD").stdout.strip()
        second = self.migrate()
        self.assertEqual(second.returncode, 0, second.stdout + second.stderr)
        self.assertIn("ALREADY_RELATED", second.stdout)
        self.assertEqual(run(self.repo, "rev-parse", "HEAD").stdout.strip(), head)

    def test_dirty_worktree_refuses_without_moving_branch(self):
        put(self.repo, "dirty.txt", "uncommitted\n")
        p = self.migrate()
        self.assertNotEqual(p.returncode, 0)
        self.assertIn("working tree/index must be clean", p.stdout + p.stderr)
        self.assertEqual(run(self.repo, "rev-parse", "HEAD").stdout.strip(), self.feed)

    def test_missing_frozen_queue_refuses_without_moving_branch(self):
        run(self.repo, "rm", "public/interop/auto-eat/queue.jsonl")
        run(self.repo, "commit", "-m", "invalid incomplete feed")
        invalid_head = run(self.repo, "rev-parse", "HEAD").stdout.strip()
        p = self.migrate()
        self.assertNotEqual(p.returncode, 0)
        self.assertIn("missing the frozen queue.jsonl", p.stdout + p.stderr)
        self.assertEqual(run(self.repo, "rev-parse", "HEAD").stdout.strip(), invalid_head)


if __name__ == "__main__":
    unittest.main(verbosity=2)
