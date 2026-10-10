import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]

def load_module(name, filename):
    spec = importlib.util.spec_from_file_location(name, HERE / filename)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

priority = load_module("cm_priority", "claim_maintenance_priority.py")
reaction = load_module("cm_reaction", "claim_maintenance_reaction.py")

class PriorityTests(unittest.TestCase):
    def test_priority_root_proofs_verify_and_mutation_fails(self):
        _, root = priority.build()
        self.assertEqual(root["leaf_count"], 6)
        self.assertTrue(all(row["inclusion_verified"] for row in root["leaves"]))
        row = root["leaves"][0]
        mutated = ("0" if row["leaf_hash"][0] != "0" else "1") + row["leaf_hash"][1:]
        self.assertFalse(priority.verify_inclusion(
            mutated, row["inclusion_proof"], root["merkle_root"]
        ))

class ReactionTests(unittest.TestCase):
    def _write_feed(self, directory: Path, second_state="QUARANTINED", checks_all_pass=None, object_state="OBSERVED"):
        ev0 = {
            "schema": "csoai.claim-event/0.1", "seq": 0, "prev_sha256": None,
            "kind": "event", "at": "2026-10-01T00:00:00Z", "claim": "c1",
            "change_state": "CONFIRMED", "object_state": "REPRODUCED",
            "disclosure": "SEALED", "subject": None, "subject_sealed_id": "fixture1",
            "source": {"store": "history/events.jsonl", "line": 0, "line_sha256": "a" * 64},
        }
        b0 = json.dumps(ev0, sort_keys=True, separators=(",", ":")).encode()
        ev1 = {
            "schema": "csoai.claim-event/0.1", "seq": 1,
            "prev_sha256": reaction.sha256(b0),
            "kind": "event", "at": "2026-10-01T00:00:01Z", "claim": "c2",
            "change_state": second_state, "object_state": object_state,
            "disclosure": "SEALED", "subject": None, "subject_sealed_id": "fixture1",
            "source": {"store": "history/events.jsonl", "line": 1, "line_sha256": "b" * 64},
        }
        if checks_all_pass is not None:
            ev1["checks_all_pass"] = checks_all_pass
        b1 = json.dumps(ev1, sort_keys=True, separators=(",", ":")).encode()
        raw = b0 + b"\n" + b1 + b"\n"
        (directory / "events.jsonl").write_bytes(raw)
        head = {
            "as_of": "2026-10-01T00:00:02Z",
            "feed": {
                "bytes_sha256": reaction.sha256(raw), "n_lines": 2,
                "head_line_sha256": reaction.sha256(b1), "head_seq": 1,
            },
            "rules": {"disclosure": "fixture disclosure rule"},
        }
        (directory / "head.json").write_text(json.dumps(head))
        return head

    def test_current_feed_is_reproducible(self):
        doc = reaction.build(ROOT / "public/claims/events/v0.1")
        self.assertEqual(doc["source"]["n_lines"], 9)
        self.assertEqual(doc["counts"]["counter_evidence_packets"], 0)

    def test_non_confirmed_event_emits_bounded_sealed_packet(self):
        with tempfile.TemporaryDirectory() as td:
            d = Path(td)
            self._write_feed(d)
            doc = reaction.build(d)
            self.assertEqual(doc["counts"]["counter_evidence_packets"], 1)
            packet = doc["counter_evidence_packets"][0]
            self.assertEqual(packet["action"], "BOUNDED_REMEASUREMENT")
            self.assertEqual(packet["subject"]["disclosure"], "SEALED")
            self.assertNotIn("subject", packet["subject"])
            self.assertEqual(packet["subject"]["subject_sealed_id"], "fixture1")

    def test_confirmed_failed_checks_require_owner_review(self):
        action, reason = reaction.reaction_for({
            "kind": "event", "change_state": "CONFIRMED",
            "object_state": "SIGNED", "checks_all_pass": False,
        })
        self.assertEqual(action, "OWNER_REVIEW")
        self.assertIn("checks did not reproduce", reason)
        self.assertNotIn("Pinned observation reproduced", reason)

    def test_confirmed_failed_checks_emit_sealed_review_packet(self):
        with tempfile.TemporaryDirectory() as td:
            d = Path(td)
            self._write_feed(d, second_state="CONFIRMED", checks_all_pass=False, object_state="SIGNED")
            doc = reaction.build(d)
            self.assertEqual(doc["counts"]["counter_evidence_packets"], 1)
            self.assertEqual(doc["counts"]["object_states"]["SIGNED"], 1)
            packet = doc["counter_evidence_packets"][0]
            self.assertEqual(packet["action"], "OWNER_REVIEW")
            self.assertEqual(packet["subject"], {"disclosure": "SEALED", "subject_sealed_id": "fixture1"})

    def test_signed_corrections_and_quarantines_remain_bounded(self):
        for change in ("CORRECTED", "QUARANTINED"):
            with self.subTest(change=change):
                action, _ = reaction.reaction_for({
                    "kind": "event", "change_state": change,
                    "object_state": "SIGNED", "checks_all_pass": False,
                })
                self.assertEqual(action, "BOUNDED_REMEASUREMENT")

    def test_incomplete_reads_do_not_become_change_findings(self):
        cases = (
            {"kind": "source_not_reachable_this_run", "object_state": "SIGNED", "checks_all_pass": False},
            {"kind": "event", "object_state": "FETCH_FAILED", "change_state": "CONFIRMED"},
            {"kind": "event", "object_state": "UNCONFIRMED", "change_state": "CORRECTED"},
            {"kind": "event", "object_state": "SIGNED", "change_state": "UNCONFIRMED"},
        )
        for event in cases:
            with self.subTest(event=event):
                action, reason = reaction.reaction_for(event)
                self.assertEqual(action, "OBSERVE_ONLY")
                self.assertIn("source/read failure", reason)

    def test_confirmed_observations_do_not_infer_failed_checks(self):
        for value in (True, None, "false"):
            with self.subTest(checks_all_pass=value):
                action, _ = reaction.reaction_for({
                    "kind": "event", "change_state": "CONFIRMED",
                    "object_state": "SIGNED", "checks_all_pass": value,
                })
                self.assertEqual(action, "NO_REMEASUREMENT")

    def test_feed_digest_tamper_fails_closed(self):
        with tempfile.TemporaryDirectory() as td:
            d = Path(td)
            head = self._write_feed(d)
            head["feed"]["bytes_sha256"] = "0" * 64
            (d / "head.json").write_text(json.dumps(head))
            with self.assertRaisesRegex(ValueError, "feed bytes"):
                reaction.build(d)

if __name__ == "__main__":
    unittest.main()
