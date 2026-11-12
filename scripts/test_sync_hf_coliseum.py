#!/usr/bin/env python3
"""Offline negative controls for the existing Coliseum release writer."""
import copy
import json
from pathlib import Path
import tempfile
import subprocess
import sys
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



# Actual immutable/raw and hosted bytes at Space commit5b0e7c37, source8b.
RAW_HF_INDEX = "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n    <meta name=\"robots\" content=\"noindex\" />\n    <title>Munder — Council Coliseum</title>\n    <meta name=\"description\" content=\"Play the Boss's Chair fictional governance game against the existing MEOK endpoint. Browser practice with explicit approval and downloadable records.\" />\n    <script type=\"module\" crossorigin src=\"/assets/coliseum.r2-BsbF5jg-.js\"></script>\n    <link rel=\"modulepreload\" crossorigin href=\"/assets/index.r2-3zDINAM_.js\">\n    <link rel=\"modulepreload\" crossorigin href=\"/assets/MunderDuel.r2-CHfASKis.js\">\n    <link rel=\"stylesheet\" crossorigin href=\"/assets/index.r2-B7hILMwH.css\">\n  </head>\n  <body><div id=\"root\"></div></body>\n</html>\n".encode("utf-8")
HOSTED_HF_INDEX = "<!doctype html>\n<html lang=\"en\">\n  <head><script>window.huggingface={variables:{\"SPACE_CREATOR_USER_ID\":\"69195dca8cf74d90adb364a6\"}};</script>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n    <meta name=\"robots\" content=\"noindex\" />\n    <title>Munder — Council Coliseum</title>\n    <meta name=\"description\" content=\"Play the Boss's Chair fictional governance game against the existing MEOK endpoint. Browser practice with explicit approval and downloadable records.\" />\n    <script type=\"module\" crossorigin src=\"/assets/coliseum.r2-BsbF5jg-.js\"></script>\n    <link rel=\"modulepreload\" crossorigin href=\"/assets/index.r2-3zDINAM_.js\">\n    <link rel=\"modulepreload\" crossorigin href=\"/assets/MunderDuel.r2-CHfASKis.js\">\n    <link rel=\"stylesheet\" crossorigin href=\"/assets/index.r2-B7hILMwH.css\">\n  <meta property=\"og:title\" content=\"Council Coliseum\"><meta property=\"og:image\" content=\"https://cdn-thumbnails.huggingface.co/social-thumbnails/spaces/csoai/council-coliseum.png\"><meta name=\"twitter:card\" content=\"summary_large_image\"><meta name=\"twitter:image\" content=\"https://cdn-thumbnails.huggingface.co/social-thumbnails/spaces/csoai/council-coliseum.png\"></head>\n  <body><div id=\"root\"></div></body>\n</html>\n".encode("utf-8")


class HostedReadbackControls(unittest.TestCase):
    def verify(self, files, values, revision="live"):
        class Reader:
            def read(self, name, _revision):
                return values.get(name)
        return verify_readback(Reader(), files, revision, attempts=1, sleep=lambda _: None)

    def test_real_observed_static_additions_and_raw_bytes_match(self):
        self.assertNotEqual(RAW_HF_INDEX, HOSTED_HF_INDEX)
        self.assertTrue(publisher.hosted_index_matches(HOSTED_HF_INDEX, RAW_HF_INDEX))
        self.assertTrue(publisher.hosted_index_matches(RAW_HF_INDEX, RAW_HF_INDEX))
        self.verify({"index.html": RAW_HF_INDEX}, {"index.html": HOSTED_HF_INDEX})

    def test_changed_authored_html_or_entry_asset_is_refused(self):
        for before, after in [(b'id="root"', b'id="other"'), (b'coliseum.r2-', b'wrong.r2-'), (b'Munder', b'Other')]:
            with self.subTest(before=before):
                self.assertFalse(publisher.hosted_index_matches(HOSTED_HF_INDEX.replace(before, after), RAW_HF_INDEX))

    def test_unknown_script_is_refused(self):
        actual = HOSTED_HF_INDEX.replace(b"</head>", b"<script>unexpected()</script></head>")
        self.assertFalse(publisher.hosted_index_matches(actual, RAW_HF_INDEX))

    def test_different_even_well_formed_creator_id_is_refused(self):
        actual = HOSTED_HF_INDEX.replace(b"69195dca8cf74d90adb364a6", b"a" * 24)
        self.assertFalse(publisher.hosted_index_matches(actual, RAW_HF_INDEX))

    def test_unknown_variable_is_refused(self):
        actual = HOSTED_HF_INDEX.replace(b'"SPACE_CREATOR_USER_ID":', b'"UNKNOWN":')
        self.assertFalse(publisher.hosted_index_matches(actual, RAW_HF_INDEX))

    def test_other_space_social_metadata_is_refused(self):
        actual = HOSTED_HF_INDEX.replace(b"spaces/csoai/council-coliseum.png", b"spaces/csoai/other.png")
        self.assertFalse(publisher.hosted_index_matches(actual, RAW_HF_INDEX))

    def test_duplicate_platform_addition_is_refused(self):
        actual = HOSTED_HF_INDEX.replace(b"<head>", b"<head>" + publisher.HF_STATIC_ENV)
        self.assertFalse(publisher.hosted_index_matches(actual, RAW_HF_INDEX))

    def test_moved_platform_addition_is_refused(self):
        actual = HOSTED_HF_INDEX.replace(publisher.HF_STATIC_ENV, b"").replace(b"</body>", publisher.HF_STATIC_ENV + b"</body>")
        self.assertFalse(publisher.hosted_index_matches(actual, RAW_HF_INDEX))

    def test_repository_reads_remain_exact_for_main_and_immutable(self):
        for revision in ("main", "b" * 40):
            with self.subTest(revision=revision), self.assertRaisesRegex(Refused, "readback"):
                self.verify({"index.html": RAW_HF_INDEX}, {"index.html": HOSTED_HF_INDEX}, revision)

    def test_live_asset_corruption_still_fails_with_safe_diagnostics(self):
        with self.assertRaisesRegex(Refused, "stage=live path=assets/game.js") as caught:
            self.verify({"index.html": RAW_HF_INDEX, "assets/game.js": b"expected"},
                        {"index.html": HOSTED_HF_INDEX, "assets/game.js": b"changed"})
        self.assertIn("expected_sha256=", str(caught.exception))
        self.assertNotIn("actual_sha256=changed", str(caught.exception))

    def test_full_publish_verifies_known_static_variant(self):
        files = artifact()
        files["index.html"] = RAW_HF_INDEX
        manifest = json.loads(files[MANIFEST])
        manifest["files"]["index.html"] = digest(RAW_HF_INDEX)
        files[MANIFEST] = json.dumps(manifest).encode()
        class StaticHub(Hub):
            def read(self, name, revision):
                if revision == "live" and name == "index.html":
                    return HOSTED_HF_INDEX
                return super().read(name, revision)
        report = publish(StaticHub(), files, SHA, 12, sleep=lambda _: None)
        self.assertEqual(report["state"], "PUBLISHED_AND_VERIFIED")

    def test_read_errors_identify_stage_and_path_without_error_message(self):
        from urllib.error import HTTPError
        class Denied:
            def read(self, name, revision):
                raise HTTPError("https://public.invalid/", 403, "private-error-detail", {}, None)
        with self.assertRaisesRegex(Refused, "stage=main path=index.html read-error=HTTPError status=403") as caught:
            verify_readback(Denied(), {"index.html": b"expected"}, "main", attempts=1)
        self.assertNotIn("private-error-detail", str(caught.exception))

    def test_workflow_pins_consumer_code_separately_from_verified_artifact(self):
        workflow = (Path(__file__).resolve().parents[1] / ".github/workflows/hf-gspc-surface-sync.yml").read_text()
        consumer = workflow.split("\n  coliseum:\n", 1)[1]
        self.assertIn("ref: $" + "{{ github.workflow_sha }}", consumer)
        self.assertNotIn("ref: master", consumer)
        sparse = consumer.split("sparse-checkout: |\n", 1)[1].split("\n\n", 1)[0]
        self.assertEqual([line.strip() for line in sparse.splitlines() if line.strip()], [
            "scripts/sync_hf_coliseum.py", "scripts/test_sync_hf_coliseum.py",
            ".github/workflows/hf-gspc-surface-sync.yml",
        ])
        self.assertIn("github.event.workflow_run.conclusion == 'success'", consumer)
        self.assertIn("github.event.workflow_run.head_repository.full_name == github.repository", consumer)
        self.assertIn("name: coliseum-mirror-$" + "{{ github.event.workflow_run.head_sha }}", consumer)
        self.assertIn("run-id: $" + "{{ github.event.workflow_run.id }}", consumer)
        self.assertEqual(consumer.count("EXPECTED_SHA: $" + "{{ github.event.workflow_run.head_sha }}"), 2)
        self.assertIn('--expected-sha "$EXPECTED_SHA"', consumer)
        self.assertNotIn("npm run build", consumer)


class MinimalConsumerCheckoutControls(unittest.TestCase):
    def test_full_offline_suite_runs_with_exact_consumer_inputs(self):
        source = Path(__file__).resolve().parents[1]
        paths = [
            "scripts/sync_hf_coliseum.py", "scripts/test_sync_hf_coliseum.py",
            ".github/workflows/hf-gspc-surface-sync.yml",
        ]
        classes = [value for value in globals().values()
                   if isinstance(value, type) and issubclass(value, unittest.TestCase)
                   and value is not type(self)]
        names = sorted("test_sync_hf_coliseum." + value.__name__ for value in classes)
        expected = sum(unittest.defaultTestLoader.loadTestsFromTestCase(value).countTestCases()
                       for value in classes)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name in paths:
                target = root / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes((source / name).read_bytes())
            self.assertEqual(sorted(path.relative_to(root).as_posix()
                                    for path in root.rglob("*") if path.is_file()), sorted(paths))
            result = subprocess.run(
                [sys.executable, "-B", "-m", "unittest", *names], cwd=root / "scripts",
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=60,
            )
            self.assertEqual(result.returncode, 0, result.stdout)
            self.assertIn("Ran " + str(expected) + " tests", result.stdout)

if __name__ == "__main__":
    unittest.main()
