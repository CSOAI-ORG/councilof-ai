"""Read-only freshness diagnostic for the Hub-to-site revenue mirror."""
import contextlib
import importlib.util
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).with_name("pull-revenue-history.py")
spec = importlib.util.spec_from_file_location("revenue_pull", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class FreshnessCheck(unittest.TestCase):
    def test_missing_calendar_day_breaks_zero_buyer_streak(self):
        rows = [json.dumps({"date": date, "one_number": {"definition": "distinct non-self payers",
                 "all_time": 0, "last_30d": 0, "settlements": 0,
                 "self_settlements": 0, "zero_value_settlements": 0}})
                for date in ("2026-09-24", "2026-09-26", "2026-09-27")]
        result = module.build("\n".join(rows))
        self.assertEqual(result["consecutive_days_at_zero_buyers"], 2)
        self.assertEqual(result["streak_stopped_at"],
                         {"date": "2026-09-25", "all_time": None, "kind": "missing day"})

    def test_stale_public_mirror_reports_both_dates_without_writing(self):
        old_day = {"date": "2026-09-06", "all_time": 0, "last_30d": 0,
                   "settlements": 0, "self_settlements": 0,
                   "zero_value_settlements": 0, "records_unreadable": 0}
        source = [dict(date=day, fetched_at=day+"T04:00:00Z",
            one_number={"definition": "distinct non-self payers", "all_time": count,
                        "last_30d": count, "settlements": count, "self_settlements": 0,
                        "zero_value_settlements": 0, "records_unreadable": 0})
            for day, count in [("2026-09-06", 0), ("2026-09-28", 1)]]
        with tempfile.TemporaryDirectory() as directory:
            published = Path(directory) / "revenue-history.json"
            original = json.dumps({"schema": "csoai.revenue-history/0.1", "note": "source", "gates": {}, "days": [old_day]})
            published.write_text(original)
            stderr = io.StringIO()
            with patch.object(module, "OUT", published), patch.object(module, "fetch", return_value=(200, "\n".join(map(json.dumps, source)))), \
                 patch.object(sys, "argv", ["pull-revenue-history.py", "--check"]), contextlib.redirect_stderr(stderr):
                self.assertEqual(module.main(), 1)
            self.assertIn("published_latest=2026-09-06 source_latest=2026-09-28", stderr.getvalue())
            self.assertEqual(published.read_text(), original)


if __name__ == "__main__":
    unittest.main()
