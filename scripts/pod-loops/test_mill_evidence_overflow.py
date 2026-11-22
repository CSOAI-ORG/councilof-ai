#!/usr/bin/env python3
"""Offline controls for exact 3,608-file, no-overwrite HF overflow stage."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import mill_evidence_overflow as stage
import evidence_sync as mirror


def item(name, blob, root):
    (root / name).write_bytes(blob)
    digest = hashlib.sha256(blob).hexdigest()
    return {"name": name, "sha256": digest, "bytes": len(blob), "shard": digest[:2]}


def manifest(rows):
    return {
        "schema": "csoai.mill-evidence-overflow/1",
        "source_commit": stage.SOURCE_SHA,
        "dataset": mirror.REPO,
        "original_prefix": "interop/mill-evidence/",
        "shard_prefix": stage.PREFIX + "/",
        "files": rows,
    }


class OverflowTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.blob = b'{"state":"VERIFIED_ADMISSION","admitted":false}\n'
        self.sha = hashlib.sha256(self.blob).hexdigest()
        self.admission = "admission-" + self.sha[:12] + ".json"
        self.valid = item(self.admission, self.blob, self.root)

    def write(self, rows):
        path = self.root / "plan.json"
        path.write_text(json.dumps(manifest(rows)))
        return path

    def test_exact_admission_and_items_paths(self):
        other = item("items-art5-saf-abcdef123456.jsonl", b'{"item":1}\n', self.root)
        files, digests, counts, total, shards = stage.validate_manifest(
            self.write([self.valid, other]), self.root, strict=False
        )
        self.assertEqual(counts, {"admission": 1, "items": 1})
        self.assertEqual(len(files), 2)
        self.assertEqual(total, len(self.blob) + len(b'{"item":1}\n'))
        self.assertIn(stage.PREFIX + "/" + self.sha[:2] + "/" + self.admission, files)
        self.assertEqual(set(digests), set(files))
        self.assertEqual(sum(shards.values()), 2)

    def test_filename_traversal_denied(self):
        entry = dict(self.valid, name="../../secrets.txt")
        with self.assertRaisesRegex(stage.EvidenceError, "ENTRY_NAME_INVALID"):
            stage.checked_entry(entry, self.root)

    def test_changed_source_bytes_denied(self):
        (self.root / self.admission).write_text('{"tampered":true}\n')
        with self.assertRaisesRegex(stage.EvidenceError, "ENTRY_SOURCE_BYTES_MISMATCH"):
            stage.checked_entry(self.valid, self.root)

    def test_changed_shard_denied(self):
        entry = dict(self.valid, shard=("ff" if self.sha[:2] != "ff" else "00"))
        with self.assertRaisesRegex(stage.EvidenceError, "ENTRY_SHARD_MISMATCH"):
            stage.checked_entry(entry, self.root)

    def test_admission_name_must_bind_digest(self):
        other = "admission-deadbeef1234.json"
        (self.root / other).write_bytes(self.blob)
        entry = dict(self.valid, name=other)
        with self.assertRaisesRegex(stage.EvidenceError, "ADMISSION_NAME_DIGEST_MISMATCH"):
            stage.checked_entry(entry, self.root)

    def test_duplicate_destination_denied(self):
        with self.assertRaisesRegex(stage.EvidenceError, "DUPLICATE_DESTINATION"):
            stage.validate_manifest(self.write([self.valid, self.valid]), self.root, strict=False)

    def test_no_extra_unreviewed_fields(self):
        entry = dict(self.valid, approved=True)
        with self.assertRaisesRegex(stage.EvidenceError, "ENTRY_FIELDS_INVALID"):
            stage.checked_entry(entry, self.root)

    def test_immutable_manifest_required_in_apply_path(self):
        with self.assertRaisesRegex(stage.EvidenceError, "IMMUTABLE_MANIFEST_SHA256_MISMATCH"):
            stage.validate_manifest(self.write([self.valid]), self.root, strict=True)

    def test_remote_byte_identity_and_conflict(self):
        correct = (mirror.git_blob_sha(self.blob), None)
        self.assertTrue(stage.remote_match(self.root / self.admission, correct))
        self.assertFalse(stage.remote_match(self.root / self.admission, ("0" * 40, None)))
        self.assertFalse(stage.remote_match(self.root / self.admission, None))

    def test_anonymous_readback_failure_remains_failure(self):
        files = {"a": self.root / self.admission}
        with patch.object(mirror, "anon_probe", return_value=["a HTTP 404"]):
            self.assertEqual(stage.anonymous_readback(files, ["a"], workers=1), ["a"])
        with patch.object(mirror, "anon_probe", return_value=[]):
            self.assertEqual(stage.anonymous_readback(files, ["a"], workers=1), [])


if __name__ == "__main__":
    unittest.main()
