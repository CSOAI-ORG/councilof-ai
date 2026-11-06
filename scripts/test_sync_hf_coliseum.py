#!/usr/bin/env python3
"""Offline negative controls for the existing Coliseum release writer."""
import copy
import json
from pathlib import Path
import tempfile
import unittest

from sync_hf_coliseum import (
    MANIFEST, RECEIPT, REPO, SCHEMA, Refused, digest, load_artifact,
    main, publish, safe_path, verify_readback,
)

SHA = "a" * 40


def artifact():
    files = {
        "index.html": b'<html><script type="module" src="/assets/game.js"></script></html>',
        "README.md": b"---\nsdk: static\nlicense: mit\n---\n",
        "LICENSE": b"MIT fixture",
        "assets/game.js": b"export const practice = true;",
    }
    files[MANIFEST] = json.dumps({
        "schema": SCHEMA, "source_commit": SHA,
        "files": {name: digest(data) for name, data in files.items()},
    }).encode()
    return files


class Hub:
    def __init__(self, files=None):
        self.files = copy.deepcopy(files or {})
        self.access = True
        self.checked = False
        self.commits = []
        self.revision = "old"
        self.live_wrong = False

    def check_write(self):
        self.checked = True
        if not self.access:
            raise PermissionError("target content-write denied")

    def head(self):
        assert self.checked
        return self.revision

    def read(self, name, revision):
        if revision == "live" and self.live_wrong and name == "index.html":
            return b"stale page"
        return self.files.get(name)

    def commit(self, changed, parent):
        assert self.checked
        if parent != self.revision:
            raise Refused("parent lease rejected")
        self.commits.append((copy.deepcopy(changed), parent))
        self.files.update(changed)
        self.revision = "new"
        return self.revision


class ArtifactControls(unittest.TestCase):
    def write(self, root, files):
        for name, data in files.items():
            path = root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)

    def validate(self, files, sha=SHA):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            self.write(root, files)
            return load_artifact(root, sha)

    def test_exact_files_and_digest_returned(self):
        self.assertEqual(self.validate(artifact()), artifact())

    def test_wrong_source_sha_refuses(self):
        with self.assertRaisesRegex(Refused, "source"):
            self.validate(artifact(), "b" * 40)

    def test_changed_bytes_refuse(self):
        files = artifact()
        files["assets/game.js"] += b"tampered"
        with self.assertRaisesRegex(Refused, "digest"):
            self.validate(files)

    def test_missing_dependency_refuses(self):
        files = artifact()
        del files["assets/game.js"]
        with self.assertRaisesRegex(Refused, "missing"):
            self.validate(files)

    def test_unlisted_file_refuses(self):
        files = artifact()
        files["extra.js"] = b"unexpected"
        with self.assertRaisesRegex(Refused, "unlisted"):
            self.validate(files)

    def test_path_traversal_and_hidden_paths_refuse(self):
        for path in ["../token", "/index.html", "assets/../index.html",
                     "assets/.secret", "assets//x.js", "assets/x\\y", RECEIPT]:
            with self.subTest(path=path):
                self.assertFalse(safe_path(path))

    def test_manifest_cannot_list_itself(self):
        files = artifact()
        manifest = json.loads(files[MANIFEST])
        manifest["files"][MANIFEST] = "0" * 64
        files[MANIFEST] = json.dumps(manifest).encode()
        with self.assertRaisesRegex(Refused, "path"):
            self.validate(files)

    def test_symlink_refuses(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            self.write(root, artifact())
            (root / "assets" / "game.js").unlink()
            (root / "assets" / "game.js").symlink_to(root / "index.html")
            with self.assertRaisesRegex(Refused, "symlink"):
                load_artifact(root, SHA)

    def test_bad_schema_and_invalid_json_refuse(self):
        for data in [b"[]", b"no json", b'{"schema":"other"}']:
            files = artifact()
            files[MANIFEST] = data
            with self.subTest(data=data), self.assertRaises(Refused):
                self.validate(files)

    def test_no_credential_offline_verification(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            self.write(root, artifact())
            self.assertEqual(main(["--artifact", str(root), "--expected-sha", SHA,
                                   "--verify-only"]), 0)


class PublisherControls(unittest.TestCase):
    def publish(self, hub, run=12):
        return publish(hub, artifact(), SHA, run, sleep=lambda _: None)

    def test_write_permission_is_required_even_for_unchanged_bytes(self):
        hub = Hub(artifact())
        hub.access = False
        with self.assertRaises(PermissionError):
            self.publish(hub)
        self.assertEqual(hub.commits, [])

    def test_publish_preserves_existing_unique_evidence(self):
        hub = Hub({"test_coliseum_viewer_node.cjs": b"legacy evidence"})
        result = self.publish(hub)
        self.assertEqual(result["state"], "PUBLISHED_AND_VERIFIED")
        self.assertEqual(hub.files["test_coliseum_viewer_node.cjs"], b"legacy evidence")
        self.assertEqual(hub.commits[0][1], "old")
        self.assertEqual(json.loads(hub.files[RECEIPT])["upstream_run_id"], 12)

    def test_same_release_is_idempotent(self):
        hub = Hub()
        self.publish(hub)
        result = self.publish(hub)
        self.assertEqual(result["state"], "UNCHANGED_AND_VERIFIED")
        self.assertEqual(len(hub.commits), 1)

    def test_older_release_cannot_overwrite_newer(self):
        hub = Hub()
        self.publish(hub, 13)
        with self.assertRaisesRegex(Refused, "older"):
            self.publish(hub, 12)
        self.assertEqual(len(hub.commits), 1)

    def test_conflicting_same_run_refuses(self):
        hub = Hub({RECEIPT: json.dumps({
            "source_commit": "b" * 40, "upstream_run_id": 12,
        }).encode()})
        with self.assertRaisesRegex(Refused, "conflicting"):
            self.publish(hub)
        self.assertEqual(hub.commits, [])

    def test_malformed_existing_receipt_refuses(self):
        hub = Hub({RECEIPT: b"broken"})
        with self.assertRaisesRegex(Refused, "malformed"):
            self.publish(hub)
        self.assertEqual(hub.commits, [])

    def test_parent_lease_failure_does_not_retry_commit(self):
        class RacingHub(Hub):
            def commit(self, changed, parent):
                self.revision = "another-writer"
                return super().commit(changed, parent)
        hub = RacingHub()
        with self.assertRaisesRegex(Refused, "lease"):
            self.publish(hub)
        self.assertEqual(hub.commits, [])

    def test_wrong_live_page_fails_after_one_commit(self):
        hub = Hub()
        hub.live_wrong = True
        with self.assertRaisesRegex(Refused, "readback"):
            self.publish(hub)
        self.assertEqual(len(hub.commits), 1)

    def test_repository_mismatch_and_network_errors_are_bounded(self):
        calls = []
        class MissingHub:
            def read(self, name, revision):
                calls.append(name)
                raise ConnectionError("offline")
        with self.assertRaisesRegex(Refused, "readback"):
            verify_readback(MissingHub(), {"index.html": b"wanted"}, "main",
                            attempts=3, sleep=lambda _: None)
        self.assertEqual(len(calls), 3)

    def test_missing_successful_run_refuses_before_auth(self):
        hub = Hub()
        with self.assertRaisesRegex(Refused, "run ID"):
            self.publish(hub, 0)
        self.assertFalse(hub.checked)


import sync_hf_coliseum as publisher
# Integrate in existing scripts/test_sync_hf_coliseum.py with its module reference.
# Replace publisher below with that test module's existing imported publisher.
from types import SimpleNamespace
from hashlib import sha256
from urllib.parse import unquote

class FakeBucket:
    def __init__(self, existing=None):
        self.data = dict(existing or {})
        self.writes = []
    def get_bucket_paths_info(self, bucket, paths):
        assert bucket == "csoai/csoai-catalogue"
        return [SimpleNamespace(path=p, size=len(self.data[p])) for p in paths if p in self.data]
    def batch_bucket_files(self, bucket, *, add):
        assert bucket == "csoai/csoai-catalogue"
        self.writes.append(add)
        for data, remote in add:
            self.data[remote] = data
    def read(self, url, limit):
        remote = unquote(url.split("/resolve/", 1)[1])
        return self.data[remote][:limit]

class BucketCopyControls(unittest.TestCase):
    def key(self, data=b"public asset", base="game.js"):
        return "games/coliseum/" + sha256(data).hexdigest() + "/" + base
    def copy(self, api, files, **extra):
        return publisher.copy_coliseum_assets_to_bucket(api, files,
            no_new_charge_confirmed=True, read_public=api.read, **extra)
    def test_adds_and_reads_back_only_verified_assets(self):
        api = FakeBucket()
        report = self.copy(api, {"assets/game.js": b"public asset", "index.html": b"not copied"})
        self.assertEqual(report["state"], "verified")
        self.assertEqual(list(api.data), [self.key()])
        self.assertEqual(report["objects"][0]["state"], "added")
    def test_skips_exact_existing_object(self):
        api = FakeBucket({self.key(): b"public asset"})
        report = self.copy(api, {"assets/game.js": b"public asset"})
        self.assertEqual(api.writes, [])
        self.assertEqual(report["objects"][0]["state"], "existing-exact")
    def test_refuses_conflict_before_any_writes(self):
        api = FakeBucket({self.key(): b"wrong bytes!"})
        with self.assertRaises(ValueError):
            self.copy(api, {"assets/new.js": b"new", "assets/game.js": b"public asset"})
        self.assertEqual(api.writes, [])
    def test_refuses_traversal_and_private_input(self):
        api = FakeBucket()
        with self.assertRaises(ValueError):
            self.copy(api, {"assets/../private.json": b"private"})
        self.assertEqual(api.writes, [])
    def test_holds_without_qualified_existing_allowance(self):
        api = FakeBucket()
        report = publisher.copy_coliseum_assets_to_bucket(api, {"assets/game.js": b"public asset"})
        self.assertEqual(report["state"], "held")
        self.assertEqual(api.writes, [])
    def test_readback_failure_is_not_success(self):
        api = FakeBucket()
        api.read = lambda _url, _limit: b"wrong"
        with self.assertRaises(ValueError):
            self.copy(api, {"assets/game.js": b"public asset"})


if __name__ == "__main__":
    unittest.main()
