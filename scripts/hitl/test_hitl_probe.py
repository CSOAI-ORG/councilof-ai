#!/usr/bin/env python3
"""Tests for hitl_probe.py. stdlib unittest + httpx (already used by the effect-binding probe).

Run:  python3 -m unittest scripts/hitl/test_hitl_probe.py -v
"""
import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hitl_fake_server as fake  # noqa: E402
import hitl_probe as hp  # noqa: E402


class Unit(unittest.TestCase):
    def test_sensitive_form_field_names(self):
        for name in ("password", "apiKey", "api_key", "accessToken", "card_number", "cvv", "ssn", "seedPhrase", "client_secret", "otp"):
            ev = hp.describe_elicitation({"mode": "form", "message": "x", "requestedSchema": {"type": "object", "properties": {name: {"type": "string"}}}})
            self.assertTrue(ev["form_mode_sensitive"], name)

    def test_non_sensitive_form_fields(self):
        for name in ("username", "email", "name", "confirm", "topic", "city", "passenger_count", "cardinality"):
            ev = hp.describe_elicitation({"mode": "form", "message": "Please confirm", "requestedSchema": {"type": "object", "properties": {name: {"type": "string"}}}})
            self.assertFalse(ev["form_mode_sensitive"], name)

    def test_sensitive_in_description_and_message(self):
        ev = hp.describe_elicitation({"message": "go", "requestedSchema": {"properties": {"value": {"type": "string", "description": "Your API key"}}}})
        self.assertTrue(ev["form_mode_sensitive"])
        self.assertTrue(ev["mode_omitted"])
        ev = hp.describe_elicitation({"message": "Enter your password below", "requestedSchema": {"properties": {"v": {"type": "string"}}}})
        self.assertTrue(ev["form_mode_sensitive"])

    def test_url_mode_sensitive_is_not_flagged_and_url_not_recorded(self):
        ev = hp.describe_elicitation({"mode": "url", "message": "Provide your API key", "url": "https://k.example/set?tok=SECRET", "elicitationId": "e"})
        self.assertFalse(ev["form_mode_sensitive"])
        self.assertEqual(ev["url_host"], "k.example")
        self.assertNotIn("SECRET", json.dumps(ev))

    def test_values_never_recorded(self):
        ev = hp.describe_elicitation({"mode": "form", "message": "m", "requestedSchema": {"properties": {"pin": {"type": "string", "default": "1234-DEFAULT", "enum": ["E1"]}}}})
        self.assertNotIn("1234-DEFAULT", json.dumps(ev))
        self.assertNotIn("E1", json.dumps(ev))

    def test_after_answer(self):
        self.assertEqual(hp.after_answer("tool_error", {"result": {"isError": True}})[0], "STOPPED_WITH_ERROR")
        self.assertEqual(hp.after_answer("ok", {"result": {"content": [{"type": "text", "text": "User declined."}]}})[0], "STOPPED_ACKNOWLEDGED")
        self.assertEqual(hp.after_answer("ok", {"result": {"content": [{"type": "text", "text": "Here you go: 42"}]}})[0], "PROCEEDED")
        self.assertEqual(hp.after_answer("no_response", None)[0], "NO_FINAL_RESPONSE")
        self.assertEqual(hp.after_answer("tool_error", {"result": {"isError": True}}, flip="errors_are_success")[0], "PROCEEDED")

    def test_read_only_rule(self):
        self.assertTrue(hp.is_read_only({"name": "get_report", "description": "Read"}))
        self.assertFalse(hp.is_read_only({"name": "delete_all_records"}))
        self.assertFalse(hp.is_read_only({"name": "get_and_send", "description": "x"}))
        self.assertFalse(hp.is_read_only({"name": "get_x", "annotations": {"readOnlyHint": False}}))

    def test_protocol_supports_elicitation(self):
        self.assertTrue(hp.protocol_supports_elicitation("2025-06-18"))
        self.assertTrue(hp.protocol_supports_elicitation("2026-07-28"))
        self.assertFalse(hp.protocol_supports_elicitation("2025-03-26"))
        self.assertFalse(hp.protocol_supports_elicitation(None))

    def test_choose_is_deterministic(self):
        bank = {"rows": [{"name": f"s{i}", "self": False, "description": "confirm" if i % 7 == 0 else "", "remotes": [{"type": "streamable-http", "url": f"https://h{i}.example/mcp"}]} for i in range(200)]}
        a1 = hp.choose(bank, 20, 5, 7)
        a2 = hp.choose(bank, 20, 5, 7)
        self.assertEqual([r["name"] for r in a1[1] + a1[2]], [r["name"] for r in a2[1] + a2[2]])
        self.assertFalse({r["name"] for r in a1[1]} & {r["name"] for r in a1[2]})


class Controls(unittest.TestCase):
    """End-to-end against the local fake servers: the probe must classify every control correctly."""

    @classmethod
    def setUpClass(cls):
        cls.saved = hp.PACE_S
        hp.PACE_S = 0.0
        cls.tmp = tempfile.mkdtemp(prefix="hitl-test-")
        cls.log = hp.Log(os.path.join(cls.tmp, "log.jsonl"))

    @classmethod
    def tearDownClass(cls):
        hp.PACE_S = cls.saved

    def run_mode(self, mode, flip=""):
        s = fake.start(mode)
        try:
            hp.reset_pacing()
            row = {"name": f"control:{mode}", "remotes": [{"type": "sse" if mode == "legacy_sse" else "streamable-http", "url": s.url}]}
            return hp.probe_server(row, self.log, flip=flip), s
        finally:
            s.stop()

    def test_a_honours_decline(self):
        r, s = self.run_mode("honours")
        self.assertEqual(r["outcome"], "HONOURS_DECLINE")
        self.assertEqual(r["cancel"]["status"], "HONOURS_CANCEL")
        self.assertNotIn("FORM_MODE_SENSITIVE_REQUEST", r["flags"])
        self.assertEqual([e["answered"] for e in r["elicitations"]], ["decline", "cancel"])
        self.assertTrue(all(rep.get("result", {}).get("action") in ("decline", "cancel") for rep in s.state["replies"]))

    def test_a2_honours_with_acknowledgement(self):
        r, _ = self.run_mode("honours_ack")
        self.assertEqual(r["outcome"], "HONOURS_DECLINE")
        self.assertEqual(r["calls"][0]["after_answer"], "STOPPED_ACKNOWLEDGED")

    def test_b_proceeds_after_decline(self):
        r, _ = self.run_mode("proceeds")
        self.assertEqual(r["outcome"], "PROCEEDS_AFTER_DECLINE")
        self.assertIn("PROCEEDS_AFTER_CANCEL", r["flags"])

    def test_c_password_in_form_mode(self):
        r, _ = self.run_mode("password")
        self.assertEqual(r["outcome"], "HONOURS_DECLINE")
        self.assertIn("FORM_MODE_SENSITIVE_REQUEST", r["flags"])
        self.assertEqual({f["name"] for f in r["elicitations"][0]["fields"]}, {"username", "password"})

    def test_c2_api_key_in_url_mode_not_flagged(self):
        r, _ = self.run_mode("url_apikey")
        self.assertEqual(r["outcome"], "HONOURS_DECLINE")
        self.assertNotIn("FORM_MODE_SENSITIVE_REQUEST", r["flags"])
        self.assertEqual(r["elicitations"][0]["mode"], "url")

    def test_d_never_elicits(self):
        r, _ = self.run_mode("never")
        self.assertEqual(r["outcome"], "NO_ELICITATION_OBSERVED")
        self.assertEqual(r["cancel"]["status"], "NOT_RUN")

    def test_e_get_stream_channel(self):
        r, _ = self.run_mode("json_getstream")
        self.assertEqual(r["outcome"], "PROCEEDS_AFTER_DECLINE")
        self.assertIn("ELICITED_ON_GET_STREAM", r["flags"])

    def test_f_legacy_sse(self):
        r, _ = self.run_mode("legacy_sse")
        self.assertEqual(r["initialize"]["transport"], "sse")
        self.assertEqual(r["outcome"], "HONOURS_DECLINE")

    def test_g_url_required_error(self):
        r, _ = self.run_mode("url_required_error")
        self.assertEqual(r["outcome"], "URL_ELICITATION_REQUIRED_ERROR")

    def test_h_write_tool_never_called(self):
        r, s = self.run_mode("write_only")
        self.assertEqual(r["outcome"], "NO_READONLY_TOOL")
        self.assertEqual(s.state["tools_call_count"], 0)

    def test_i_grader_can_fail(self):
        r, _ = self.run_mode("honours", flip="errors_are_success")
        self.assertEqual(r["outcome"], "PROCEEDS_AFTER_DECLINE")

    def test_j_never_accepts(self):
        with open(self.log.path) as f:
            for line in f:
                rec = json.loads(line)
                body = rec.get("body")
                if rec.get("kind") == "reply-to-server" and isinstance(body, dict) and "result" in body:
                    self.assertIn(body["result"].get("action"), ("decline", "cancel", None))

    def test_k_run_controls_passes(self):
        out = hp.run_controls(tempfile.mkdtemp(prefix="hitl-ctl-"))
        self.assertTrue(out["passed"], json.dumps(out["controls"], indent=1))


if __name__ == "__main__":
    unittest.main()
