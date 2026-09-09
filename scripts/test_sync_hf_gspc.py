import copy
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from sync_hf_gspc import (  # noqa: E402
    ROOT_PATH,
    SyncRefused,
    committed_shell,
    sync_exact,
    verified_production_root,
)


class FakeHub:
    def __init__(self, initial=None, *, corrupt_readback=False):
        self.main = dict(initial or {})
        self.revisions = {"main": self.main}
        self.commits = []
        self.corrupt_readback = corrupt_readback

    @staticmethod
    def key(repo_id, repo_type, path):
        return repo_id, repo_type, path

    def read(self, repo_id, repo_type, path, revision="main"):
        value = self.revisions.get(revision, {}).get(self.key(repo_id, repo_type, path))
        if self.corrupt_readback and revision != "main" and value is not None:
            return value + b"tampered"
        return value

    def commit(self, repo_id, repo_type, files, message):
        revision = f"commit-{len(self.commits) + 1}"
        updated = dict(self.main)
        for path, payload in files.items():
            updated[self.key(repo_id, repo_type, path)] = payload
        self.main = updated
        self.revisions["main"] = self.main
        self.revisions[revision] = dict(updated)
        self.commits.append((repo_id, repo_type, dict(files), message))
        return revision


class SyncTests(unittest.TestCase):
    def test_shell_input_is_exactly_the_four_committed_head_blobs(self):
        files, revision = committed_shell(ROOT)
        self.assertEqual(tuple(files), ("README.md", "index.html", "style.css", "table.js"))
        self.assertEqual(len(revision), 40)
        for path, payload in files.items():
            self.assertEqual(payload, (ROOT / "spaces" / "gspc-board" / path).read_bytes())

    def test_exact_sync_is_idempotent_and_commits_only_changed_files(self):
        repo_id = "csoai/gspc-board"
        repo_type = "space"
        desired = {"README.md": b"readme", "index.html": b"index"}
        initial = {FakeHub.key(repo_id, repo_type, "README.md"): b"readme"}
        hub = FakeHub(initial)

        first = sync_exact(hub, repo_id, repo_type, desired, "sync")
        second = sync_exact(hub, repo_id, repo_type, desired, "sync")

        self.assertEqual(first.state, "PUBLISHED")
        self.assertEqual(first.changed, ("index.html",))
        self.assertEqual(hub.commits[0][2], {"index.html": b"index"})
        self.assertEqual(second.state, "UNCHANGED")
        self.assertEqual(len(hub.commits), 1)

    def test_post_publish_hash_mismatch_fails_closed(self):
        hub = FakeHub(corrupt_readback=True)
        with self.assertRaisesRegex(SyncRefused, "post-publish readback mismatch"):
            sync_exact(
                hub,
                "csoai/gspc-boards",
                "dataset",
                {ROOT_PATH: b"signed bytes"},
                "sync",
                readback_sleep=lambda _seconds: None,
            )

    def test_root_validation_returns_original_bytes_and_rejects_leaf_tamper(self):
        root_bytes = (ROOT / "public" / "root.json").read_bytes()
        did_bytes = (ROOT / "public" / ".well-known" / "did.json").read_bytes()

        payload, identity = verified_production_root(
            lambda url: root_bytes if url.endswith("root.json") else did_bytes
        )
        self.assertEqual(payload, root_bytes)
        self.assertEqual(len(identity), 64)

        tampered = json.loads(root_bytes)
        tampered = copy.deepcopy(tampered)
        tampered["card_sha256"][0] = "00" * 32
        bad_bytes = json.dumps(tampered).encode()
        with self.assertRaisesRegex(SyncRefused, "merkle_root"):
            verified_production_root(lambda url: bad_bytes if url.endswith("root.json") else did_bytes)

    def test_dry_run_never_commits(self):
        hub = FakeHub()
        result = sync_exact(
            hub,
            "csoai/gspc-boards",
            "dataset",
            {ROOT_PATH: b"candidate"},
            "sync",
            dry_run=True,
        )
        self.assertEqual(result.state, "DRY_RUN")
        self.assertEqual(hub.commits, [])


if __name__ == "__main__":
    unittest.main()
