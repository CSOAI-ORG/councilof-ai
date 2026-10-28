"""Regression tests for the card-root build guard (real git porcelain rows)."""
import hashlib
import json
import subprocess
import tempfile
import unittest
from pathlib import Path

from card_root_guard import POINTER, GuardError, check

OLD = "public/interop/card-root-2026-10-01-35544212115c.json"
NEW = "public/interop/card-root-2026-10-12.json"


def pointer_for(repo, root):
    name = Path(root).name
    return {
        "schema": "csoai.card-root-pointer/1",
        "kind": "DISCOVERY_POINTER_ONLY",
        "root_url": f"/interop/{name}",
        "root_sha256": hashlib.sha256((repo / root).read_bytes()).hexdigest(),
        "ots_url": f"/interop/{name}.ots",
    }


class CardRootGuardTests(unittest.TestCase):
    def setUp(self):
        t = tempfile.TemporaryDirectory()
        self.addCleanup(t.cleanup)
        self.repo = Path(t.name)
        self.git("init", "-q")
        (self.repo / "public/interop").mkdir(parents=True)
        self.write(OLD, b'{"old":1}\n')
        self.write(OLD + ".ots", b"old-proof")
        self.write(POINTER, json.dumps(pointer_for(self.repo, OLD)).encode())
        self.write("public/interop/other.json", b"{}")
        self.git("add", "--", OLD, OLD + ".ots", POINTER, "public/interop/other.json")
        self.git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "base")

    def git(self, *args):
        return subprocess.check_output(["git", "-C", str(self.repo), *args], text=True)

    def write(self, rel, data):
        (self.repo / rel).write_bytes(data)

    def rows(self):
        return self.git("status", "--porcelain", "--", "public/interop/card-root-*").splitlines()

    def new_root(self, point_at=NEW):
        self.write(NEW, b'{"new":1}\n')
        self.write(NEW + ".ots", b"new-proof")
        self.write(POINTER, json.dumps(pointer_for(self.repo, point_at)).encode())

    def test_new_root_plus_pointer_is_accepted(self):
        self.new_root()
        self.assertEqual(check(self.rows(), self.repo),
                         {"root": NEW, "proof": NEW + ".ots", "pointer": POINTER})

    def test_nothing_changed(self):
        self.assertIsNone(check(self.rows(), self.repo))

    def test_pointer_to_wrong_file_is_refused(self):
        self.new_root(point_at=OLD)
        with self.assertRaises(GuardError):
            check(self.rows(), self.repo)

    def test_pointer_with_wrong_digest_is_refused(self):
        self.new_root()
        doc = json.loads((self.repo / POINTER).read_bytes()); doc["root_sha256"] = "0" * 64
        self.write(POINTER, json.dumps(doc).encode())
        with self.assertRaises(GuardError):
            check(self.rows(), self.repo)

    def test_second_modified_path_is_refused(self):
        self.new_root()
        rows = self.rows() + [" M public/interop/card-root-extra.json"]
        with self.assertRaises(GuardError):
            check(rows, self.repo)

    def test_modified_existing_root_is_refused(self):
        self.new_root()
        self.write(OLD, b'{"tampered":1}\n')
        with self.assertRaises(GuardError):
            check(self.rows(), self.repo)

    def test_modified_existing_proof_is_refused(self):
        self.new_root()
        self.write(OLD + ".ots", b"tampered")
        with self.assertRaises(GuardError):
            check(self.rows(), self.repo)

    def test_new_root_without_pointer_update_is_refused(self):
        self.write(NEW, b'{"new":1}\n')
        self.write(NEW + ".ots", b"new-proof")
        with self.assertRaises(GuardError):
            check(self.rows(), self.repo)

    def test_master_bug_reproduced_old_guard_would_refuse(self):
        self.new_root()
        self.assertTrue(any(not r.startswith("?? ") for r in self.rows()))


if __name__ == "__main__":
    unittest.main()
