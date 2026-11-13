"""Filesystem/service tests use temporary synthetic conversations only."""
from concurrent.futures import ThreadPoolExecutor
import copy
import fcntl
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import core
import memory_store as memory
from memory_auth import MemoryAuthError
from test_memory_auth import oauth, PROFILE

OWNER_A = hashlib.sha256(b"owner-a").hexdigest()
OWNER_B = hashlib.sha256(b"owner-b").hexdigest()


def state(text="A synthetic question"):
    value = core.fresh_session()
    value["chat_messages"] = [{"role": "user", "content": text},
                              {"role": "assistant", "content": "A synthetic answer"}]
    value["turns"] = copy.deepcopy(value["chat_messages"])
    value["episodes"] = [{"not_to_restore": "authority"}]
    value["events"] = [{"not_to_restore": "evidence"}]
    value["chat_last_details"] = {"not_to_restore": "receipt"}
    value["permissions"] = {"not_to_restore": True}
    return value


class StoreTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.store = memory.SnapshotStore(self.root, require_mount=False)
        self.provenance = memory.source_provenance()

    def save(self, owner=OWNER_A, value=None):
        return self.store.save(owner, state() if value is None else value, self.provenance)

    def path(self, row, owner=OWNER_A):
        return self.root / "chat-v1" / owner / (row["snapshot_id"] + ".json")

    def test_save_reopen_restores_original_unicode_text_and_only_text(self):
        original = state("Original text: café 🐕\nline two")
        row = self.save(value=original)
        reopened = memory.SnapshotStore(self.root, require_mount=False)
        restored, readback = reopened.restore(OWNER_A, row["snapshot_id"])
        self.assertEqual(restored["chat_messages"], original["chat_messages"])
        self.assertEqual(restored["turns"], original["turns"])
        self.assertEqual(restored["episodes"], [])
        self.assertEqual(restored["events"], [])
        self.assertNotIn("permissions", restored)
        self.assertNotIn("chat_last_details", restored)
        self.assertTrue(restored["chat_imported"])
        self.assertEqual(row, readback)
        self.assertEqual(reopened.list(OWNER_A), [row])

    def test_durable_reopen_in_independent_process(self):
        row = self.save()
        code = ("import json,sys;from memory_store import SnapshotStore;"
                "s=SnapshotStore(sys.argv[1],require_mount=False);"
                "v,r=s.restore(sys.argv[2],sys.argv[3]);"
                "print(json.dumps({'messages':v['chat_messages'],'row':r,'count':len(s.list(sys.argv[2]))}))")
        env = dict(os.environ, GRADIO_ANALYTICS_ENABLED="false")
        run = subprocess.run([sys.executable, "-c", code, str(self.root), OWNER_A, row["snapshot_id"]],
                             cwd=Path(__file__).parent, env=env, text=True,
                             capture_output=True, timeout=40, check=True)
        output = json.loads(run.stdout)
        self.assertEqual(output["count"], 1)
        self.assertEqual(output["messages"], state()["chat_messages"])
        self.assertEqual(output["row"], row)

    def test_full_checksums_provenance_and_no_state_authority_persisted(self):
        row = self.save()
        record = json.loads(self.path(row).read_text())
        body = {k: v for k, v in record.items() if k != "snapshot_sha256"}
        self.assertEqual(hashlib.sha256(memory._canonical(body)).hexdigest(), row["snapshot_id"])
        self.assertEqual(hashlib.sha256(record["export_text"].encode()).hexdigest(), row["export_sha256"])
        self.assertEqual(len(row["provenance"]["runtime_source_sha256"]), 64)
        self.assertEqual(row["provenance"]["base_space_revision"], memory.BASE_SPACE_REVISION)
        self.assertNotIn("not_to_restore", self.path(row).read_text())

    def test_each_save_is_immutable_and_distinct(self):
        first = self.save()
        bytes_before = self.path(first).read_bytes()
        second = self.save()
        self.assertNotEqual(first["snapshot_id"], second["snapshot_id"])
        self.assertEqual(self.path(first).read_bytes(), bytes_before)
        self.assertEqual(len(self.store.list(OWNER_A)), 2)

    def test_cross_account_list_read_and_remove_are_denied(self):
        row = self.save()
        self.assertEqual(self.store.list(OWNER_B), [])
        for operation in (self.store.restore, self.store.remove):
            with self.assertRaises(memory.MemoryStoreError):
                operation(OWNER_B, row["snapshot_id"])
        self.assertTrue(self.path(row).exists())

    def test_owner_mismatch_is_rejected_even_when_file_is_copied(self):
        row = self.save()
        other = self.save(OWNER_B)
        copied = self.path(row, OWNER_B)
        copied.write_bytes(self.path(row).read_bytes())
        with self.assertRaises(memory.MemoryStoreError):
            self.store.restore(OWNER_B, row["snapshot_id"])
        self.assertTrue(self.path(other, OWNER_B).exists())

    def test_tampered_copy_is_rejected_for_list_restore_and_remove(self):
        row = self.save()
        record = json.loads(self.path(row).read_text())
        record["export_text"] = record["export_text"].replace("synthetic question", "changed question")
        self.path(row).write_text(json.dumps(record))
        for call in (lambda: self.store.list(OWNER_A),
                     lambda: self.store.restore(OWNER_A, row["snapshot_id"]),
                     lambda: self.store.remove(OWNER_A, row["snapshot_id"])):
            with self.assertRaises(memory.MemoryStoreError):
                call()
        self.assertTrue(self.path(row).exists())

    def test_duplicate_json_fields_are_rejected(self):
        row = self.save()
        raw = self.path(row).read_text()
        self.path(row).write_text('{"schema":"duplicate",' + raw[1:])
        with self.assertRaises(memory.MemoryStoreError):
            self.store.restore(OWNER_A, row["snapshot_id"])

    def test_truncated_or_oversized_record_is_rejected(self):
        row = self.save()
        for content in (b"{", b" " * (memory.MAX_RECORD_BYTES + 1)):
            self.path(row).write_bytes(content)
            with self.assertRaises(memory.MemoryStoreError):
                self.store.restore(OWNER_A, row["snapshot_id"])

    def test_empty_or_oversized_conversation_is_not_stored(self):
        too_large = state()
        too_large["chat_messages"] = [
            {"role": "user" if n % 2 == 0 else "assistant", "content": "🐕" * 10000}
            for n in range(80)]
        for value in (core.fresh_session(), too_large, state("\ud800")):
            with self.assertRaises((ValueError, UnicodeError)):
                self.save(value=value)
        self.assertFalse((self.root / "chat-v1").exists())

    def test_traversal_and_non_hash_keys_are_rejected(self):
        row = self.save()
        for bad in ("../other", "/etc/passwd", "a" * 63, "A" * 64, None):
            with self.subTest(bad=bad), self.assertRaises(memory.MemoryStoreError):
                self.store.restore(OWNER_A, bad)
            with self.assertRaises(memory.MemoryStoreError):
                self.store.list(bad)
        self.assertTrue(self.path(row).exists())

    def test_snapshot_symlink_and_hardlink_are_rejected(self):
        row = self.save()
        path = self.path(row)
        backup = self.root / "original.json"
        path.rename(backup)
        path.symlink_to(backup)
        with self.assertRaises((memory.MemoryStoreError, OSError)):
            self.store.restore(OWNER_A, row["snapshot_id"])
        path.unlink()
        os.link(backup, path)
        with self.assertRaises(memory.MemoryStoreError):
            self.store.restore(OWNER_A, row["snapshot_id"])

    def test_root_namespace_owner_and_lock_symlinks_are_rejected(self):
        for layer in ("root", "namespace", "owner", "lock"):
            with self.subTest(layer=layer), tempfile.TemporaryDirectory() as directory:
                base = Path(directory).resolve()
                outside = base / "outside"
                outside.mkdir()
                target = base / "store"
                target.mkdir()
                if layer == "root":
                    target.rmdir()
                    target.symlink_to(outside, target_is_directory=True)
                else:
                    namespace = target / "chat-v1"
                    if layer == "namespace":
                        namespace.symlink_to(outside, target_is_directory=True)
                    else:
                        namespace.mkdir()
                        own = namespace / OWNER_A
                        if layer == "owner":
                            own.symlink_to(outside, target_is_directory=True)
                        else:
                            own.mkdir()
                            outside_file = outside / "untouched"
                            outside_file.write_text("unchanged")
                            (own / ".lock").symlink_to(outside_file)
                store = memory.SnapshotStore(target, require_mount=False)
                with self.assertRaises((memory.MemoryStoreError, OSError)):
                    store.save(OWNER_A, state(), self.provenance)
                self.assertEqual(list(outside.glob("*.json")), [])

    def test_unmounted_or_missing_path_is_not_created(self):
        root = self.root / "not-mounted"
        with self.assertRaises(memory.MemoryStoreError):
            memory.SnapshotStore(root).save(OWNER_A, state(), self.provenance)
        self.assertFalse(root.exists())
        with self.assertRaises(memory.MemoryStoreError):
            memory.SnapshotStore(self.root).list(OWNER_A)
        self.assertFalse((self.root / "chat-v1").exists())

    def test_concurrent_saves_are_distinct_bounded_and_reopenable(self):
        def attempt(index):
            try:
                return self.save(value=state("Concurrent question " + str(index)))
            except memory.MemoryStoreError:
                return None
        with ThreadPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(attempt, range(24)))
        saved = [row for row in results if row is not None]
        self.assertEqual(len(saved), memory.MAX_COPIES)
        self.assertEqual(len({row["snapshot_id"] for row in saved}), memory.MAX_COPIES)
        self.assertEqual(len(self.store.list(OWNER_A)), memory.MAX_COPIES)
        for row in saved:
            restored, _ = self.store.restore(OWNER_A, row["snapshot_id"])
            self.assertIn("Concurrent question", restored["chat_messages"][0]["content"])

    def test_lock_contention_is_truthfully_refused(self):
        row = self.save()
        with (self.path(row).parent / ".lock").open("rb") as held:
            fcntl.flock(held.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            with self.assertRaises(memory.MemoryStoreError):
                self.store.list(OWNER_A)

    def test_failed_write_or_readback_never_reports_success(self):
        for seam in ("fsync", "readback"):
            with self.subTest(seam=seam):
                target = patch("memory_store.os.fsync", side_effect=OSError("storage unavailable")) if seam == "fsync" else patch.object(self.store, "_read", side_effect=memory.MemoryStoreError("checksum mismatch"))
                with target, self.assertRaises((memory.MemoryStoreError, OSError)):
                    self.save()
                self.assertEqual(list((self.root / "chat-v1" / OWNER_A).glob("*.json")), [])

    def test_remove_only_selected_copy_and_confirm_absence(self):
        one = self.save()
        two = self.save()
        result = self.store.remove(OWNER_A, one["snapshot_id"])
        self.assertEqual(result["removed_snapshot_id"], one["snapshot_id"])
        self.assertFalse(self.path(one).exists())
        self.assertTrue(self.path(two).exists())
        self.assertEqual(self.store.list(OWNER_A), [two])

    def test_failed_remove_retains_copy_and_raises(self):
        row = self.save()
        with patch("memory_store.os.unlink", side_effect=OSError("read only")):
            with self.assertRaises(OSError):
                self.store.remove(OWNER_A, row["snapshot_id"])
        self.assertTrue(self.path(row).exists())


class ServiceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.store = memory.SnapshotStore(Path(self.temp.name).resolve(), require_mount=False)
        self.backend = patch("memory_store.configured_store", return_value=self.store)
        self.backend_call = self.backend.start()
        self.addCleanup(self.backend.stop)
        self.auth = patch("memory_auth.HfApi")
        self.api = self.auth.start()
        self.addCleanup(self.auth.stop)
        self.api.return_value.whoami.return_value = dict(PROFILE)
        self.service = memory.MemoryService()

    def test_all_four_operations_freshly_verify_and_restore_clears_authority(self):
        token = oauth()
        row = self.service.save(state(), True, token)
        self.assertEqual(self.service.list(token), [row])
        restored, _ = self.service.restore(row["snapshot_id"], token)
        self.assertEqual(restored["episodes"], [])
        self.service.remove(row["snapshot_id"], token)
        self.assertEqual(self.api.return_value.whoami.call_count, 4)

    def test_every_operation_denies_missing_auth_before_storage(self):
        calls = [lambda: self.service.save(state(), True),
                 self.service.list, lambda: self.service.restore("a" * 64),
                 lambda: self.service.remove("a" * 64)]
        for call in calls:
            with self.assertRaises(MemoryAuthError):
                call()
        self.backend_call.assert_not_called()

    def test_revoked_identity_cannot_read_or_remove_previously_saved_copy(self):
        row = self.service.save(state(), True, oauth())
        self.api.return_value.whoami.side_effect = RuntimeError("revoked")
        for call in (lambda: self.service.list(oauth()),
                     lambda: self.service.restore(row["snapshot_id"], oauth()),
                     lambda: self.service.remove(row["snapshot_id"], oauth())):
            with self.assertRaises(MemoryAuthError):
                call()
        self.assertEqual(self.backend_call.call_count, 1)

    def test_second_identity_cannot_use_first_identity_snapshot_id(self):
        row = self.service.save(state(), True, oauth())
        self.api.return_value.whoami.return_value = dict(PROFILE, id="synthetic-account-b")
        self.assertEqual(self.service.list(oauth()), [])
        with self.assertRaises(memory.MemoryStoreError):
            self.service.restore(row["snapshot_id"], oauth())
        with self.assertRaises(memory.MemoryStoreError):
            self.service.remove(row["snapshot_id"], oauth())

    def test_save_is_opt_in_and_does_not_mutate_current_state(self):
        original = state()
        before = copy.deepcopy(original)
        for consent in (False, None, 1, "true"):
            with self.assertRaises(memory.MemoryStoreError):
                self.service.save(original, consent, oauth())
        self.backend_call.assert_not_called()
        self.assertEqual(original, before)

    def test_storage_failure_has_no_sensitive_error_or_success(self):
        original = state()
        before = copy.deepcopy(original)
        with patch.object(self.store, "save", side_effect=OSError("/private/path secret")):
            with self.assertRaises(memory.MemoryStoreError) as caught:
                self.service.save(original, True, oauth())
        self.assertNotIn("/private/path", str(caught.exception))
        self.assertIn("No success is claimed", str(caught.exception))
        self.assertEqual(original, before)

    def test_unconfigured_store_is_explicitly_unavailable(self):
        self.backend.stop()
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(memory.MemoryStoreError) as caught:
                self.service.list(oauth())
        self.assertIn("not configured", str(caught.exception))


if __name__ == "__main__":
    unittest.main()
