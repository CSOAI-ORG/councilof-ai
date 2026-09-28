import importlib.util
import sys
import unittest
from pathlib import Path

SPEC = importlib.util.spec_from_file_location("gspc_spray", Path(__file__).with_name("gspc-spray.py"))
SPRAY = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = SPRAY
SPEC.loader.exec_module(SPRAY)

STATEMENT = "behavioural axes 2026-08-12 · jail 2026-08-18 · financial-fact axes 2026-08-25"


class MeasurementDateStatementTests(unittest.TestCase):
    def test_reads_published_statement_verbatim(self):
        board = {"measured_on": {"date": STATEMENT}}
        self.assertEqual(SPRAY.measurement_date_statement(board), STATEMENT)

    def test_missing_date_is_not_inferred_from_root_or_fetch_time(self):
        board = {"as_of": "2026-09-29T00:00:00Z", "read_at": "2026-09-29T00:01:00Z"}
        self.assertIsNone(SPRAY.measurement_date_statement(board))

    def test_axis_export_labels_date_as_board_level(self):
        board = {"measured_on": {"date": STATEMENT}, "axes": [{"axis": "governance"}]}
        row = SPRAY.axis_rows(board, [])[0]
        self.assertEqual(row["board_measurement_date_statement"], STATEMENT)
        self.assertEqual(row["board_measurement_date_scope"], "board-level; not an axis-specific timestamp")

    def test_readme_and_kaggle_description_distinguish_root_time(self):
        board = {
            "measured_on": {"date": STATEMENT},
            "totals": {"lid": "Live board"},
            "axes": [{"axis": "governance", "kind": "model-comparison", "status": "MEASURED",
                      "separation": "TIE", "n": 1}],
        }
        tr = {"board": board, "root": {"card_count": 1, "merkle_root": "abc"},
              "banks": [], "as_of": "2026-09-28T07:32:07Z", "read_at": "2026-09-29T00:00:00Z",
              "lid": "Live board", "fingerprint": "abc", "did_keys": None,
              "board_sha256": "board-hash", "root_sha256": "root-hash"}
        counts = SPRAY.derive_counts(board)
        rows = SPRAY.axis_rows(board, [])
        readme = SPRAY.render_readme(tr, counts, rows)
        _, description = SPRAY.kaggle_page_text(tr)
        self.assertIn("root timestamp is not a measurement timestamp", readme)
        self.assertIn(STATEMENT, readme)
        self.assertIn(STATEMENT, description)
        self.assertIn("root timestamp is not a measurement timestamp", description)


if __name__ == "__main__":
    unittest.main()
