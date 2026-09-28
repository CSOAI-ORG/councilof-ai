#!/usr/bin/env python3
"""x402-wellknown-parity: each state is reachable, and the must-fail controls stay failing.

    python3 -m unittest -v test_x402_wellknown_parity.py
"""
import base64, importlib.util, json, os, unittest

spec = importlib.util.spec_from_file_location("wk", os.path.join(os.path.dirname(os.path.abspath(__file__)), "x402-wellknown-parity.py"))
wk = importlib.util.module_from_spec(spec); spec.loader.exec_module(wk)

A = "0x" + "a" * 40
B = "0x" + "b" * 40
LIVE_A = json.dumps({"x402Version": 2, "accepts": [{"payTo": A.upper().replace("0X", "0x"), "network": "eip155:8453"}]})


class Fetch(unittest.TestCase):
    def test_spa_html_is_not_a_document(self):  # must-fail: a 200 SPA fallback is NOT a discovery document
        self.assertEqual(wk.classify_fetch(200, "<!doctype html><html>app</html>")[0], "NOT_JSON")
        self.assertEqual(wk.classify_fetch(200, "[1,2]")[0], "NOT_JSON")

    def test_states(self):
        self.assertEqual(wk.classify_fetch(404, "")[0], "ABSENT")
        self.assertEqual(wk.classify_fetch(301, "")[0], "REDIRECT")
        self.assertEqual(wk.classify_fetch(500, "")[0], "OTHER_STATUS")
        self.assertEqual(wk.classify_fetch(None, "")[0], "ERROR")
        self.assertEqual(wk.classify_fetch(200, '{"x402Version":2}')[0], "PRESENT_JSON")


class Parity(unittest.TestCase):
    def live(self, body, status=402, headers=None):
        return wk.live_reading(status, headers or {}, body)

    def test_consistent_case_insensitive_evm(self):
        c = wk.compare({"x402Version": 2, "resources": [{"payTo": A}]}, *self.live(LIVE_A))
        self.assertEqual(c["PAY_TO"]["state"], "CONSISTENT")
        self.assertEqual(c["X402_VERSION"]["state"], "CONSISTENT")

    def test_must_fail_declared_other_recipient(self):  # must-fail: a document naming B while the door pays A
        c = wk.compare({"x402Version": 1, "payTo": B}, *self.live(LIVE_A))
        self.assertEqual(c["PAY_TO"]["state"], "INCONSISTENT")
        self.assertEqual(c["X402_VERSION"]["state"], "INCONSISTENT")

    def test_single_surface_and_uncheckable(self):
        c = wk.compare({"name": "x"}, *self.live(LIVE_A))
        self.assertEqual(c["PAY_TO"]["state"], "SINGLE_SURFACE")
        self.assertEqual(c["X402_VERSION"]["state"], "SINGLE_SURFACE")
        c = wk.compare({"payTo": A}, *self.live("", status=200))
        self.assertEqual(c["PAY_TO"]["state"], "UNCHECKABLE")

    def test_header_only_requirements(self):
        h = {"PAYMENT-REQUIRED": base64.b64encode(LIVE_A.encode()).decode()}
        ver, pay, why = self.live("not json", headers=h)
        self.assertEqual((ver, why), (2, None))
        self.assertIn(A, pay)


if __name__ == "__main__":
    unittest.main()
