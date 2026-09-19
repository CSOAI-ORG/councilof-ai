import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from reconcile_evidence_factory_bindings import reconcile


class ReconciliationTests(unittest.TestCase):
    def setUp(self):
        self.definition = {
            "goal_objects": ["disclosure"],
            "declared_axes": [
                {"slot": 1, "axis": "governance", "measured": True},
                {"slot": 2, "axis": "deception", "measured": True},
            ],
            "axis_to_goal_mapping": {"governance": ["governance"], "deception": ["disclosure"]},
            "sources_bound_to_harness": [{"goal_objects": ["safety"]}],
        }
        self.board = {"axes": [{"axis": "governance", "status": "UNMEASURED"},
                                {"axis": "custody-disclosure", "status": "MEASURED"}]}

    def test_position_collision_cannot_promote_research(self):
        result = reconcile(self.definition, self.board, {})
        research = result["dimensions"][1]
        self.assertEqual(research["id"], "research:deception")
        self.assertIsNone(research["board_axis_id"])
        self.assertIsNone(research["board_status_observed"])
        self.assertEqual(result["summary"]["new_measurements"], 0)
        self.assertEqual(result["historical_position_mismatches"][0]["board_axis_at_that_position"], "custody-disclosure")

    def test_undefined_goals_remain_explicit_and_blocked(self):
        result = reconcile(self.definition, self.board, {})
        self.assertEqual(result["unresolved_goal_ids"], ["goal:governance", "goal:safety"])
        self.assertEqual(result["dimensions"][0]["binding_state"], "UNRESOLVED_GOAL_DEFINITION")
        self.assertFalse(result["automatic_execution_authorized"])

    def test_observed_board_status_wins_over_plan(self):
        result = reconcile(self.definition, self.board, {})
        self.assertEqual(result["dimensions"][0]["board_status_observed"], "UNMEASURED")

    def test_board_reordering_does_not_change_bindings(self):
        first = reconcile(self.definition, self.board, {})
        self.board["axes"].reverse()
        second = reconcile(self.definition, self.board, {})
        self.assertEqual(first["dimensions"], second["dimensions"])

    def test_duplicate_ids_fail_closed(self):
        self.board["axes"].append(copy.deepcopy(self.board["axes"][0]))
        with self.assertRaisesRegex(ValueError, "duplicate board axis"):
            reconcile(self.definition, self.board, {})

    def test_dangling_dimension_mapping_fails(self):
        self.definition["axis_to_goal_mapping"]["made-up"] = ["disclosure"]
        with self.assertRaisesRegex(ValueError, "absent dimensions"):
            reconcile(self.definition, self.board, {})

    def test_cli_rejects_tampered_board_receipt(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "definition.json").write_text(json.dumps(self.definition))
            (root / "board.json").write_text(json.dumps(self.board))
            (root / "receipt.json").write_text(json.dumps({
                "http_status": 200, "raw_sha256": "0" * 64,
                "source_url": "https://example.test/board", "fetched_at": "2026-09-19T00:00:00Z",
            }))
            result = subprocess.run([
                sys.executable, str(Path(__file__).with_name("reconcile_evidence_factory_bindings.py")),
                "--definition", str(root / "definition.json"), "--board", str(root / "board.json"),
                "--board-receipt", str(root / "receipt.json"), "--output", str(root / "output.json"),
            ], capture_output=True, text=True)
            self.assertEqual(result.returncode, 2)
            self.assertIn("does not bind", result.stderr)
            self.assertFalse((root / "output.json").exists())


if __name__ == "__main__":
    unittest.main()
