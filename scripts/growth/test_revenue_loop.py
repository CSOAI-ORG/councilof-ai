"""Offline regressions for the existing growth producer's demand interpretation."""
import copy
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch


SOURCE = Path(os.environ.get("REVENUE_LOOP_SOURCE", Path(__file__).with_name("revenue_loop.py")))
spec = importlib.util.spec_from_file_location("revenue_loop_under_test", SOURCE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class RepeatAcceptanceTests(unittest.TestCase):
    def run_loop(self, repeat=..., *, all_time=2, previous=1, status="MEASURED", one_override=...):
        one = {
            "all_time": all_time, "last_30d": all_time, "settlements": 3,
            "self_settlements": 0, "zero_value_settlements": 0, "status": status,
            "gates": {"≥1 repeat": "open the next door"},
        }
        if repeat is not ...:
            one["repeat_nonself_payers"] = copy.deepcopy(repeat)
        if one_override is not ...:
            one = one_override

        def getjson(url, **_):
            if url.endswith("/api/revenue"):
                return {"one_number": one}
            if "/api/receipts?" in url:
                return {"count": 3, "distinct_nonself_payers": all_time}
            if url.endswith("/api/state"):
                return {"public_count": {"value": "fixture board"}}
            return {}

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            out = root / "docs" / "growth"
            prior = out / "2000-01-01" / "loop.json"
            prior.parent.mkdir(parents=True)
            prior.write_text(json.dumps({"one_number": {"value": previous}, "next_moves": []}))
            with patch.object(module, "ROOT", root), patch.object(module, "OUT", out), \
                    patch.object(module, "getjson", side_effect=getjson), \
                    patch.object(module, "probe", return_value=200), patch("sys.argv", ["revenue_loop.py"]):
                self.assertEqual(module.main(), 0)
            generated = next(p for p in out.glob("*/loop.json") if p != prior)
            return json.loads(generated.read_text()), generated.with_suffix(".md").read_text()

    def assert_no_expansion(self, result):
        recommendations = " ".join(x["move"] for x in result["next_moves"])
        self.assertNotIn("open the next door", recommendations)
        self.assertNotIn("≥1 repeat →", recommendations)

    def test_new_wallet_growth_is_not_repeat(self):
        result, _ = self.run_loop({"all_time": 0, "last_30d": 0})
        self.assert_no_expansion(result)
        self.assertIn("no repeat-wallet evidence", result["next_moves"][0]["move"])
        self.assertFalse(result["next_moves"][0]["owner"])
        self.assertEqual(result["one_number"]["value"], 2)
        self.assertTrue(result["retro"][0]["moved"])

    def test_recent_repeat_is_review_signal_without_new_wallet_growth(self):
        result, _ = self.run_loop({"all_time": 1, "last_30d": 1}, previous=2)
        self.assert_no_expansion(result)
        self.assertIn("review delivered bytes and buyer acceptance", result["next_moves"][0]["move"])
        self.assertTrue(result["next_moves"][0]["owner"])
        self.assertFalse(result["retro"][0]["moved"])

    def test_current_live_shape_retains_historical_repeat_without_recent_repeat(self):
        result, human = self.run_loop({"all_time": 1, "last_30d": 0}, all_time=3, previous=2)
        self.assert_no_expansion(result)
        self.assertIn("historical repeat-wallet evidence only", result["next_moves"][0]["move"])
        self.assertFalse(result["next_moves"][0]["owner"])
        self.assertIn("1 all time; 0 in 30 days", human)

    def test_missing_repeat_block_is_unknown_not_zero(self):
        result, _ = self.run_loop()
        self.assert_no_expansion(result)
        evidence = result["one_number"]["repeat_nonself_payers"]
        self.assertIsNone(evidence["all_time"])
        self.assertIsNone(evidence["last_30d"])
        self.assertEqual(evidence["status"], "UNMEASURED")
        self.assertIn("unknown", result["next_moves"][0]["move"])

    def test_malformed_repeat_values_do_not_trigger_review(self):
        invalid = [None, [], "1", {}, True, -1, 1.0, {"all_time": True, "last_30d": True},
                   {"all_time": "1", "last_30d": "1"}, {"all_time": -1, "last_30d": 1},
                   {"all_time": 1.5, "last_30d": 1}, {"all_time": 1, "last_30d": 2},
                   {"all_time": 3, "last_30d": 1}]
        for value in invalid:
            with self.subTest(value=value):
                result, _ = self.run_loop(value)
                self.assert_no_expansion(result)
                self.assertEqual(result["one_number"]["repeat_nonself_payers"]["status"], "UNMEASURED")
                self.assertFalse(result["next_moves"][0]["owner"])

    def test_missing_window_preserves_known_history_without_acceptance(self):
        result, _ = self.run_loop({"all_time": 1})
        evidence = result["one_number"]["repeat_nonself_payers"]
        self.assertEqual(evidence["all_time"], 1)
        self.assertIsNone(evidence["last_30d"])
        self.assertEqual(evidence["status"], "UNMEASURED")
        self.assertFalse(result["next_moves"][0]["owner"])

    def test_unmeasured_telemetry_does_not_become_a_demand_signal(self):
        result, _ = self.run_loop({"all_time": 1, "last_30d": 1}, status="UNMEASURED")
        self.assert_no_expansion(result)
        self.assertIsNone(result["one_number"]["repeat_nonself_payers"]["last_30d"])
        self.assertIn("unavailable or malformed", result["next_moves"][0]["move"])

    def test_malformed_one_number_is_unknown(self):
        for value in (None, [], "3"):
            with self.subTest(value=value):
                result, _ = self.run_loop(one_override=value)
                self.assert_no_expansion(result)
                self.assertIsNone(result["one_number"]["value"])
                self.assertEqual(result["one_number"]["repeat_nonself_payers"]["status"], "UNMEASURED")

    def test_nested_gate_is_preserved_as_source_text_not_execution_authority(self):
        result, human = self.run_loop({"all_time": 1, "last_30d": 1})
        self.assertEqual(result["one_number"]["gate"], {"≥1 repeat": "open the next door"})
        self.assertIn("## Gates (verbatim)", human)
        self.assertIn("≥1 repeat: open the next door", human)
        self.assert_no_expansion(result)


if __name__ == "__main__":
    unittest.main()
