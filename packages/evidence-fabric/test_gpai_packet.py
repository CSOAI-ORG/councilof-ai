# SPDX-License-Identifier: Apache-2.0
import copy
import hashlib
import json
import os
from pathlib import Path
import tempfile
import unittest

import event
import gpai_packet as gp


def packet(slots=None):
    return {"packet_id": "fixture:gpai-packet-test",
            "checked_at": "2026-11-04T12:00:00Z",
            "legal_source": {"version_label": "SYNTHETIC TEST; legal source version unverified",
                             "source_bytes_sha256": None, "retrieval_record_ref": None},
            "slots": [] if slots is None else slots}


def declaration(slot_id="53.1.a", path="technical.txt", raw=b"Synthetic document, not legal evidence.\n"):
    return {"slot_id": slot_id, "path": path,
            "expected_sha256": hashlib.sha256(raw).hexdigest(), "applicability": {"state": "UNKNOWN"}}


class PacketTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / "packet"
        self.root.mkdir()
        self.raw = b"Synthetic document, not legal evidence.\n"
        (self.root / "technical.txt").write_bytes(self.raw)
        self.packet = packet([declaration()])

    def first(self, p=None, **kwargs):
        return gp.check_packet(self.packet if p is None else p, self.root, **kwargs)["events"][0]

    def test_matching_bytes_are_partial_and_applicability_remains_unknown(self):
        result = self.first()
        self.assertEqual(result["state"], "PARTIAL")
        self.assertEqual(result["observed"]["status"], "BYTES_MATCH")
        self.assertEqual(result["observed"]["applicability_declaration"], {"state": "UNKNOWN"})
        self.assertEqual(result["observed"]["legal_outcome"], "NOT_ESTABLISHED")
        self.assertIsNone(result["signature"])

    def test_every_named_slot_is_reported_even_when_absent(self):
        out = gp.check_packet(packet(), self.root)
        self.assertEqual(out["counts"]["enumerated_slots"], 9)
        self.assertEqual(out["counts"]["uncheckable_slots"], 9)
        self.assertEqual({e["observed"]["slot_id"] for e in out["events"]}, set(gp.SLOTS))
        self.assertTrue(all(e["state"] == "UNCHECKABLE" for e in out["events"]))

    def test_missing_declared_file(self):
        (self.root / "technical.txt").unlink()
        result = self.first()
        self.assertEqual(result["state"], "UNCHECKABLE")
        self.assertEqual(result["observed"]["status"], "MISSING")

    def test_deliberate_file_tampering_is_detected(self):
        before = self.first()
        (self.root / "technical.txt").write_bytes(self.raw + b"tampered")
        after = self.first()
        self.assertEqual(before["state"], "PARTIAL")
        self.assertEqual(after["state"], "UNCHECKABLE")
        self.assertEqual(after["observed"]["status"], "DIGEST_MISMATCH")
        self.assertNotEqual(before["event_id"], after["event_id"])

    def test_expected_digest_tampering_is_detected(self):
        self.packet["slots"][0]["expected_sha256"] = "0" * 64
        self.assertEqual(self.first()["observed"]["status"], "DIGEST_MISMATCH")

    def test_path_traversal_and_absolute_paths_are_rejected(self):
        for path in ("../outside.txt", "/etc/passwd", "sub/../../outside.txt", "sub/../technical.txt",
                     "./technical.txt", "sub\\file.txt", "sub//file.txt", "bad\x00file"):
            with self.subTest(path=path):
                p = copy.deepcopy(self.packet); p["slots"][0]["path"] = path
                with self.assertRaises(gp.PacketError):
                    self.first(p)

    def test_final_symlink_outside_root_is_refused(self):
        outside = Path(self.tmp.name) / "outside.txt"; outside.write_bytes(self.raw)
        (self.root / "linked.txt").symlink_to(outside)
        p = packet([declaration(path="linked.txt")])
        self.assertEqual(self.first(p)["observed"]["status"], "UNSAFE_PATH_REFUSED")

    def test_directory_symlink_outside_root_is_refused(self):
        outside = Path(self.tmp.name) / "outside"; outside.mkdir()
        (outside / "file.txt").write_bytes(self.raw)
        (self.root / "linked").symlink_to(outside, target_is_directory=True)
        p = packet([declaration(path="linked/file.txt")])
        self.assertEqual(self.first(p)["observed"]["status"], "UNSAFE_PATH_REFUSED")

    def test_symlink_packet_root_is_rejected(self):
        link = Path(self.tmp.name) / "rootlink"; link.symlink_to(self.root, target_is_directory=True)
        with self.assertRaisesRegex(gp.PacketError, "symlink"):
            gp.check_packet(self.packet, link)

    def test_directory_cannot_be_evidence_file(self):
        (self.root / "directory").mkdir()
        p = packet([declaration(path="directory")])
        self.assertEqual(self.first(p)["observed"]["status"], "NONREGULAR_REFUSED")

    def test_fifo_does_not_block_and_is_refused(self):
        os.mkfifo(self.root / "pipe")
        p = packet([declaration(path="pipe")])
        self.assertEqual(self.first(p)["observed"]["status"], "NONREGULAR_REFUSED")

    def test_file_size_limit_is_explicit(self):
        result = self.first(max_bytes=1)
        self.assertEqual(result["observed"]["status"], "SIZE_LIMIT")
        self.assertIsNone(result["observed"]["actual_sha256"])

    def test_nested_regular_file_is_accepted(self):
        (self.root / "documents").mkdir()
        (self.root / "documents/evaluation.json").write_bytes(self.raw)
        p = packet([declaration(path="documents/evaluation.json")])
        self.assertEqual(self.first(p)["observed"]["status"], "BYTES_MATCH")

    def test_unknown_keys_rejected_at_each_level(self):
        for level in ("top", "legal_source", "slot", "applicability"):
            p = copy.deepcopy(self.packet)
            target = p if level == "top" else p["legal_source"] if level == "legal_source" else p["slots"][0] if level == "slot" else p["slots"][0]["applicability"]
            target["execute"] = "forbidden"
            with self.assertRaisesRegex(gp.PacketError, "unknown keys"):
                self.first(p)

    def test_duplicate_or_unknown_slots_rejected(self):
        with self.assertRaisesRegex(gp.PacketError, "duplicate"):
            self.first(packet([declaration(), declaration()]))
        p = packet([declaration(slot_id="99")])
        with self.assertRaisesRegex(gp.PacketError, "unknown evidence slot"):
            self.first(p)

    def test_duplicate_json_keys_rejected(self):
        p = Path(self.tmp.name) / "duplicate.json"; p.write_text('{"slots":[],"slots":[]}')
        with self.assertRaisesRegex(gp.PacketError, "duplicate JSON"):
            gp.read_json(p)

    def test_claimed_applicability_requires_reference_and_never_promotes_result(self):
        p = copy.deepcopy(self.packet)
        p["slots"][0]["applicability"] = {"state": "APPLICABLE"}
        with self.assertRaisesRegex(gp.PacketError, "review reference"):
            self.first(p)
        p["slots"][0]["applicability"].update({"review_event_id": "sha256:" + "c" * 64,
                                               "reviewer_ref": "fixture:reviewer", "reason": "Synthetic declaration"})
        result = self.first(p)
        self.assertEqual(result["state"], "PARTIAL")
        self.assertEqual(result["observed"]["applicability_verification"], "NOT_PERFORMED")
        self.assertEqual(result["observed"]["legal_outcome"], "NOT_ESTABLISHED")

    def test_legal_source_digest_is_declared_not_verified(self):
        p = copy.deepcopy(self.packet)
        p["legal_source"]["source_bytes_sha256"] = "e" * 64
        self.assertEqual(self.first(p)["observed"]["legal_source_verification"], "NOT_FETCHED_OR_VERIFIED")

    def test_all_slots_can_match_without_nine_unique_artifacts_or_legal_outcomes(self):
        p = packet([declaration(slot_id=slot) for slot in gp.SLOTS])
        out = gp.check_packet(p, self.root)
        self.assertEqual(out["counts"]["matching_slots"], 9)
        self.assertEqual(out["counts"]["unique_matched_digests"], 1)
        self.assertEqual(out["counts"]["legal_outcomes_established"], 0)
        self.assertTrue(all(event.validate(e) == [] and e["state"] == "PARTIAL" for e in out["events"]))

    def test_identical_packet_and_files_produce_identical_events(self):
        self.assertEqual(gp.check_packet(self.packet, self.root), gp.check_packet(self.packet, self.root))

    def test_checked_at_is_required_timezone_aware_and_binds_new_inspection(self):
        for bad in (None, "", "not-a-date", "2026-11-04T12:00:00"):
            p = copy.deepcopy(self.packet); p["checked_at"] = bad
            with self.assertRaises(gp.PacketError):
                self.first(p)
        before = self.first()
        p = copy.deepcopy(self.packet); p["checked_at"] = "2026-11-05T12:00:00Z"
        after = self.first(p)
        self.assertNotEqual(before["event_id"], after["event_id"])
        self.assertEqual(after["observed"]["timestamp_basis"], "CALLER_SUPPLIED_INSPECTION_TIME")


if __name__ == "__main__":
    unittest.main()
