#!/usr/bin/env python3
"""Offline provenance and no-leakage controls for retrospective source audit."""
from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from audit_frozen_raw_think import audit, Uncheckable, digest


def make_fixture(root: Path, *, add_think: bool = False, missing: bool = False):
    rows = []
    texts = ["COMPLY", "<think>unfinished\nREFUSE" if add_think else "REFUSE"]
    for index, value in enumerate(texts):
        row = {"schema": "synthetic-only", "axis": "synthetic", "i": index}
        if not (missing and index == 1):
            row["raw_output"] = value
            row["raw_output_sha256"] = digest(value.encode())
        rows.append(row)
    payload = b"".join((json.dumps(r, sort_keys=True) + "\n").encode() for r in rows)
    name = "items-synthetic-123456789012.jsonl"
    (root / name).write_bytes(payload)
    desc = [{"cell": name, "cell_sha256": digest(payload), "n_rows": len(rows), "axis": "synthetic"}]
    db = (json.dumps(desc[0], sort_keys=True) + "\n").encode()
    return db, desc, payload, name


def evaluate_case(root: Path, db: bytes, *, total=2):
    return audit(db, root, required_descriptor_digest=digest(db),
                 required_cell_count=1, required_rows=total)


class PinnedArchiveAuditTests(unittest.TestCase):
    def test_known_clean_fixture_no_think(self):
        with TemporaryDirectory() as p:
            root = Path(p)
            db, _, _, _ = make_fixture(root)
            x = evaluate_case(root, db)
            self.assertEqual(x["reasoning_tag_candidates"], 0)
            self.assertEqual(x["raw_outputs_verified"], 2)
            self.assertEqual(x["historical_scope"], "TEST_FIXTURE_ONLY")
            self.assertIsNone(x["frozen_hf_revision"])
            self.assertFalse(x["historical_grader_scores_rewritten"])
            self.assertFalse(x["independent_calibration_performed"])

    def test_unterminated_think_is_candidate_only_not_proved_wrong(self):
        with TemporaryDirectory() as p:
            root = Path(p)
            db, _, _, _ = make_fixture(root, add_think=True)
            x = evaluate_case(root, db)
            self.assertEqual(x["reasoning_tag_candidates"], 1)
            self.assertEqual(x["candidate_axes"]["synthetic"], 1)
            self.assertNotIn("actual_wrong", x)
            self.assertFalse(x["model_safety_certified"])

    def test_missing_raw_not_silently_zero(self):
        with TemporaryDirectory() as p:
            root = Path(p)
            db, _, _, _ = make_fixture(root, missing=True)
            x = evaluate_case(root, db)
            self.assertEqual(x["raw_outputs_verified"], 1)
            self.assertEqual(x["raw_output_unavailable"], 1)

    def test_tampered_raw_without_updating_cell_hash_fails(self):
        with TemporaryDirectory() as p:
            root = Path(p)
            db, _, _, name = make_fixture(root)
            (root / name).write_bytes(b"malicious unrelated replacement\n")
            with self.assertRaisesRegex(Uncheckable, "CELL_DIGEST_MISMATCH"):
                evaluate_case(root, db)

    def test_tampered_cell_rehashed_but_raw_digest_mismatch_fails(self):
        with TemporaryDirectory() as p:
            root = Path(p)
            db, descriptors, body, name = make_fixture(root)
            rows = [json.loads(r) for r in body.splitlines()]
            rows[0]["raw_output"] = "UNEXPECTED"
            payload = b"".join((json.dumps(r, sort_keys=True)+"\n").encode() for r in rows)
            (root/name).write_bytes(payload)
            descriptors[0]["cell_sha256"] = digest(payload)
            db = (json.dumps(descriptors[0], sort_keys=True)+"\n").encode()
            with self.assertRaisesRegex(Uncheckable, "RAW_OUTPUT_DIGEST_MISMATCH"):
                evaluate_case(root, db)

    def test_wrong_frozen_manifest_sha_is_fatal(self):
        with TemporaryDirectory() as p:
            root = Path(p)
            db, _, _, _ = make_fixture(root)
            with self.assertRaisesRegex(Uncheckable, "FROZEN_DESCRIPTOR_MISMATCH"):
                audit(db, root)

    def test_duplicate_descriptor_name_fails(self):
        with TemporaryDirectory() as p:
            root = Path(p)
            _, desc, _, _ = make_fixture(root)
            db = b"".join((json.dumps(desc[0]) + "\n").encode() for _ in range(2))
            with self.assertRaisesRegex(Uncheckable, "DUPLICATE_OR_UNSAFE_FILENAME"):
                audit(db, root, required_descriptor_digest=digest(db),
                      required_cell_count=2, required_rows=4)

    def test_traversal_filename_fails(self):
        with TemporaryDirectory() as p:
            root = Path(p)
            _, desc, _, _ = make_fixture(root)
            desc[0]["cell"] = "../outside.jsonl"
            db = (json.dumps(desc[0]) + "\n").encode()
            with self.assertRaisesRegex(Uncheckable, "DUPLICATE_OR_UNSAFE_FILENAME"):
                evaluate_case(root, db)

    def test_wrong_row_count_fails(self):
        with TemporaryDirectory() as p:
            root = Path(p)
            db, _, _, _ = make_fixture(root)
            with self.assertRaisesRegex(Uncheckable, "ARCHIVE_ROW_COUNT_MISMATCH"):
                audit(db, root, required_descriptor_digest=digest(db),
                      required_cell_count=1, required_rows=3)

    def test_untrusted_body_not_reprinted(self):
        with TemporaryDirectory() as p:
            root = Path(p)
            db, _, _, _ = make_fixture(root, add_think=True)
            x = evaluate_case(root, db)
            s = json.dumps(x)
            self.assertNotIn("unfinished", s)
            self.assertNotIn("REFUSE", s)

    def test_invalid_input_types_fail(self):
        with TemporaryDirectory() as p:
            with self.assertRaises(Uncheckable):
                audit("not bytes", Path(p))
            with self.assertRaises(Uncheckable):
                audit(b"{}", Path(p), required_descriptor_digest="NOT_SHA")

    def test_output_missing_digest_fails_even_with_rehashed_cell(self):
        with TemporaryDirectory() as p:
            root = Path(p)
            db, desc, payload, name = make_fixture(root)
            rows = [json.loads(q) for q in payload.splitlines()]
            del rows[0]["raw_output_sha256"]
            updated = b"".join((json.dumps(q, sort_keys=True)+"\n").encode() for q in rows)
            (root/name).write_bytes(updated)
            desc[0]["cell_sha256"] = digest(updated)
            db = (json.dumps(desc[0], sort_keys=True)+"\n").encode()
            with self.assertRaisesRegex(Uncheckable, "RAW_OUTPUT_DIGEST_ABSENT"):
                evaluate_case(root, db)


if __name__ == "__main__":
    unittest.main(verbosity=2)
