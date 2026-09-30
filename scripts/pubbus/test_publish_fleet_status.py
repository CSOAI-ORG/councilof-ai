#!/usr/bin/env python3
"""python3 scripts/pubbus/test_publish_fleet_status.py - the public fleet summary is a whitelist."""
import datetime as dt
import importlib.util
import json
import os
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("pfs", os.path.join(HERE, "publish-fleet-status.py"))
pfs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pfs)

NOW = dt.datetime(2026, 9, 25, 13, 0, 0, tzinfo=dt.timezone.utc)
STATUS = {
    "host": "oracle-micro-2",
    "updated": "2026-09-25T12:50:02Z",
    "funding": {"level": "GREEN", "why": "runway_h=125.8"},
    "jobs": {
        "airbench": {"age_s": 1494, "detail": "last line: Traceback at /home/ubuntu/x.py", "host": "oracle-micro-2", "state": "FAILED", "why": "FAILED"},
        "domain-watch": {"age_s": 600, "detail": "mtime", "host": "oracle-micro-2", "state": "OK"},
        "pod-loop": {"age_s": None, "host": "runpod-3090-pod", "state": "WEIRD_NEW_STATE"},
        "Bad Id!": {"state": "OK", "age_s": 1},
        "mac-trash-to-gdrive": {"state": "UNMEASURED", "host": "mac"},
        "sov-eater": {"state": "OK", "age_s": 5, "host": "oracle-micro-2"},
    },
}
FUNDING = {"at": "2026-09-25T12:45:01Z", "balance_usd": 49.63, "spend_usd_per_hr": 0.4, "runway_h": 125.8, "level": "GREEN", "source": "runpodctl user on oracle-micro-2"}


class PublicFleetStatus(unittest.TestCase):
    def build(self, funding=FUNDING, state=None, now=NOW):
        return pfs.build(STATUS, funding, state or {}, now)

    def test_only_whitelisted_fields_leave(self):
        doc, _ = self.build()
        for j in doc["jobs"]:
            self.assertEqual(set(j), {"id", "state", "last_ok"})
        text = json.dumps(doc)
        for forbidden in ("oracle-micro-2", "runpod-3090-pod", "Traceback", "/home/", "49.63", "125.8", "balance_usd", "runway_h", "spend_usd"):
            self.assertNotIn(forbidden, text)
        self.assertEqual(pfs.leaks(doc, pfs.hosts_in(STATUS)), [])

    def test_states_are_normalised_and_bad_ids_dropped(self):
        doc, _ = self.build()
        by = {j["id"]: j for j in doc["jobs"]}
        self.assertNotIn("Bad Id!", by)
        self.assertNotIn("mac-trash-to-gdrive", by, "the owner's workstation jobs are not the fleet's public state")
        self.assertNotIn("sov-eater", by, "internal system names are never public")
        self.assertEqual(by["pod-loop"]["state"], "UNMEASURED")
        self.assertEqual(by["airbench"]["state"], "FAILED")

    def test_last_ok_is_the_signal_time_and_is_remembered(self):
        doc, remembered = self.build()
        by = {j["id"]: j for j in doc["jobs"]}
        self.assertEqual(by["domain-watch"]["last_ok"], "2026-09-25T12:40:02Z")  # updated - 600 s
        self.assertIsNone(by["airbench"]["last_ok"], "never read OK -> null, not a guess")
        doc2, _ = self.build(state={"airbench": "2026-09-24T01:00:00Z"})
        self.assertEqual({j["id"]: j for j in doc2["jobs"]}["airbench"]["last_ok"], "2026-09-24T01:00:00Z")
        self.assertIn("domain-watch", remembered)

    def test_funding_is_a_colour_or_unmeasured(self):
        doc, _ = self.build()
        self.assertEqual(doc["funding"]["state"], "GREEN")
        self.assertEqual(self.build(funding=None)[0]["funding"]["state"], "UNMEASURED")
        stale = dict(FUNDING, at="2026-09-25T08:00:00Z")
        self.assertEqual(self.build(funding=stale)[0]["funding"]["state"], "UNMEASURED", "a stale colour is not reported")
        self.assertEqual(self.build(funding=dict(FUNDING, level="PURPLE"))[0]["funding"]["state"], "UNMEASURED")
        self.assertEqual(self.build(funding=dict(FUNDING, level="STOP"))[0]["funding"]["state"], "RED")

    def test_leak_check_refuses_host_strings(self):
        doc, _ = self.build()
        doc["jobs"].append({"id": "x", "state": "OK", "last_ok": "oracle-micro-2"})
        self.assertEqual(pfs.leaks(doc, pfs.hosts_in(STATUS)), ["oracle-micro-2"])

    def test_published_at_is_the_supervisors_time(self):
        doc, _ = self.build()
        self.assertEqual(doc["published_at"], "2026-09-25T12:50:02Z")


if __name__ == "__main__":
    unittest.main()
