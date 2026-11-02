import copy
import datetime as dt
import math
import unittest
from unittest.mock import patch
import observer as o

AT = dt.datetime(2026, 9, 19, 16, 0, tzinfo=dt.timezone.utc)

def row(symbol="BTC/USDC", exchange="coinbase", **changes):
    value = dict(symbol=symbol, exchange=exchange, observed_at=AT.isoformat(),
                 bid=100.0, ask=101.0, bid_depth_quote=1000., ask_depth_quote=1000.)
    value.update(changes)
    return value

class ObserverTests(unittest.TestCase):
    def result(self, rows):
        return o.assess(rows, AT)
    def test_empty_is_unknown_not_zero_performance(self):
        result = self.result([])
        self.assertEqual(result["status"], "UNCHECKABLE")
        self.assertEqual(result["fee_slippage_latency_model"], "UNMEASURED")
    def test_full_coverage_and_no_execution(self):
        result = self.result([row(s, v) for s in o.SYMBOLS for v in o.VENUES])
        self.assertEqual(result["usable_combinations"], 12)
        self.assertEqual(len(result["quote_comparisons"]), 12)
        self.assertFalse(result["live_execution_allowed"])
    def test_missing_combination_is_explicit(self):
        self.assertEqual(len(self.result([row()])["unobserved_or_invalid"]), 11)
    def test_stale_quote_excluded(self):
        old = (AT-dt.timedelta(seconds=121)).isoformat()
        self.assertEqual(self.result([row(observed_at=old)])["usable_combinations"], 0)
    def test_future_quote_excluded(self):
        future = (AT+dt.timedelta(seconds=6)).isoformat()
        self.assertEqual(self.result([row(observed_at=future)])["usable_combinations"], 0)
    def test_naive_timestamp_excluded(self):
        self.assertEqual(self.result([row(observed_at="2026-09-19T16:00:00")])["usable_combinations"], 0)
    def test_bad_prices_excluded(self):
        for price in (None, True, 0, -1, math.nan, math.inf, "100"):
            with self.subTest(price=price):
                self.assertEqual(self.result([row(bid=price)])["usable_combinations"], 0)
    def test_crossed_book_excluded(self):
        self.assertEqual(self.result([row(bid=102)])["usable_combinations"], 0)
    def test_missing_depth_excluded(self):
        for value in (None, 0, -1, math.nan, math.inf, True):
            self.assertEqual(self.result([row(bid_depth_quote=value)])["usable_combinations"], 0)
    def test_duplicate_pair_is_not_double_counted(self):
        self.assertEqual(self.result([row(), row(), row()])["usable_combinations"], 0)
    def test_unknown_scope_excluded(self):
        self.assertEqual(self.result([row(symbol="FAKE/USDC")])["usable_combinations"], 0)
    def test_one_venue_cannot_create_cross_venue_comparison(self):
        self.assertEqual(self.result([row()])["quote_comparisons"], [])
    def test_positive_gross_never_becomes_net_profit(self):
        result = self.result([row(), row(exchange="kraken", bid=104., ask=105.)])
        comparison = result["quote_comparisons"][0]
        self.assertGreater(comparison["gross_quote_difference_bps"], 0)
        self.assertIsNone(comparison["net_return"])
        self.assertFalse(comparison["execution_eligible"])
    def receipt(self):
        rows = [row()]
        payload = {"retained_inputs": rows, "input_sha256": o.digest(rows)}
        return {"payload": payload, "payload_sha256": o.digest(payload)}
    def test_matching_hash_is_not_signature_verification(self):
        result = o.verify(self.receipt(), AT)
        self.assertEqual(result["integrity"], "MATCH")
        self.assertFalse(result["signature_verified"])
    def test_tampered_payload_rejected(self):
        receipt = self.receipt()
        receipt["payload"]["retained_inputs"][0]["bid"] = 1
        self.assertEqual(o.verify(receipt, AT)["integrity"], "UNCHECKABLE")
    def test_input_digest_checked_separately(self):
        receipt = self.receipt()
        receipt["payload"]["input_sha256"] = "0" * 64
        receipt["payload_sha256"] = o.digest(receipt["payload"])
        self.assertEqual(o.verify(receipt, AT)["integrity"], "UNCHECKABLE")
    def test_old_intact_receipt_is_still_stale(self):
        result = o.verify(self.receipt(), AT+dt.timedelta(hours=1))
        self.assertEqual(result["integrity"], "MATCH")
        self.assertEqual(result["current_assessment"]["status"], "UNCHECKABLE")
    def test_missing_receipt_is_unknown(self):
        self.assertEqual(o.verify({}, AT)["integrity"], "UNCHECKABLE")
    def test_non_allowlisted_command_cannot_run(self):
        with patch("observer.run_json") as runner:
            with self.assertRaises(ValueError):
                o.fixed_read("M4", "trade")
            runner.assert_not_called()
    def test_unknown_host_cannot_run(self):
        with self.assertRaises(ValueError):
            o.fixed_read("internet.example", "services")
    def test_collector_skew_is_reported(self):
        earlier = (AT-dt.timedelta(seconds=40)).isoformat()
        value = self.result([row(), row(exchange="kraken", observed_at=earlier)])
        self.assertEqual(value["quote_comparisons"][0]["collector_time_skew_seconds"], 40)
    def test_digest_stable_for_object_key_order(self):
        self.assertEqual(o.digest({"a": 1, "b": 2}), o.digest({"b": 2, "a": 1}))

if __name__ == "__main__":
    unittest.main(verbosity=2)
