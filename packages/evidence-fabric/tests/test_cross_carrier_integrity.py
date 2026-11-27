# SPDX-License-Identifier: Apache-2.0
"""Composed evidence-carrier regression, not an external host or model test."""
import copy
import json
from pathlib import Path
import unittest

import event as E
from ingest import openshell_in
from render import ecs_hec, intoto, oasf_eval, ocsf, otel, sarif, w3c_acr01

ROOT = Path(E.__file__).resolve().parent
CAPTURE = ROOT.parent.parent / "harness/openshell-adapter/capture-2026-09-28/out/rows.json"
FIXTURES = ROOT / "tests/fixtures/events.jsonl"


def fields(record, carrier):
    if carrier == "OCSF":
        x = record["unmapped"]["csoai"]
        return record["finding_info"]["uid"], x["state"], x.get("value"), x["limits"], "value" in x
    if carrier == "OTel":
        x = {a["key"]: next(iter(a["value"].values())) for a in record["attributes"]}
        return x["csoai.event_id"], x["gen_ai.evaluation.score.label"], x.get("gen_ai.evaluation.score.value"), json.loads(x["csoai.limits"]), "gen_ai.evaluation.score.value" in x
    if carrier == "SARIF":
        x = record["properties"]
        return record["fingerprints"]["csoai/event_id/v1"], x["state"], x.get("value"), x["limits"], "value" in x
    if carrier == "in-toto":
        x = record["predicate"]
        return "sha256:" + record["subject"][0]["digest"]["sha256"], x["state"], x.get("value"), x["limits"], x.get("value") is not None
    if carrier == "ECS":
        x = record["event"]["csoai"]
        return record["event"]["event"]["id"], x["state"], x.get("value"), x["limits"], "value" in x
    if carrier == "W3C":
        x = record["x-csoai"]
        return x["event_id"], x["event_state"], x.get("value"), x["limits"], "value" in x
    if carrier == "OASF":
        x = record["data"]["referred_evaluations"][0]
        m = {a["name"]: a["value"] for a in x["datasets"][0]["metadata"]}
        return m["event_id"], m["state"], float(m["value"]) if "value" in m else None, m["limits"], "value" in m
    raise AssertionError("unknown test carrier")


CARRIERS = (
    ("OCSF", ocsf.render), ("OTel", otel.log_record), ("SARIF", sarif.result),
    ("in-toto", intoto.statement), ("ECS", ecs_hec.hec),
    ("W3C", w3c_acr01.event_record), ("OASF", oasf_eval.single),
)


class CrossCarrierIntegrity(unittest.TestCase):
    def check_events(self, events):
        for ev in events:
            self.assertEqual(E.validate(ev), [])
            for carrier, render in CARRIERS:
                with self.subTest(carrier=carrier, state=ev["state"], event=ev["event_id"]):
                    before = copy.deepcopy(ev)
                    identity, state, value, limits, has_number = fields(render(ev), carrier)
                    self.assertEqual((identity, state, value), (ev["event_id"], ev["state"], ev["value"]))
                    self.assertEqual(has_number, ev["value"] is not None)
                    self.assertEqual(limits, "; ".join(ev["limits"]) if carrier == "OASF" else ev["limits"])
                    self.assertEqual(before, ev)

    def test_all_six_states_and_a_numeric_fixture(self):
        events = E.read_jsonl(FIXTURES)
        self.assertEqual({e["state"] for e in events}, set(E.STATES))
        self.assertTrue(any(e["value"] is not None for e in events))
        self.check_events(events)

    def test_retained_capture_and_missing_witness_and_failed_control(self):
        raw = CAPTURE.read_bytes()
        args = {"read_at": "2026-09-28T13:43:00Z", "subject": "urn:fixture:openshell"}
        good = openshell_in.ingest(raw, control="DIVERGENT", **args)
        self.assertEqual([e["state"] for e in good], ["CONSISTENT", "DIVERGENT", "CONSISTENT"])
        changed = json.loads(raw)
        for row in changed["rows"]:
            row["witness"] = None
        missing = openshell_in.ingest(json.dumps(changed).encode(), control="DIVERGENT", **args)
        self.assertEqual([e["state"] for e in missing], ["UNMEASURED"] * 3)
        failed = openshell_in.ingest(raw, control="CONSISTENT", **args)
        self.assertEqual([e["state"] for e in failed], ["NOT_DISCRIMINATING"] * 3)
        self.check_events(good + missing + failed)

    def test_invalid_event_rejected_by_every_carrier(self):
        events = E.read_jsonl(FIXTURES)
        bad = copy.deepcopy(events[0])
        bad["observed"] = {"fixture_mutation": 999}
        unknown = copy.deepcopy(next(e for e in events if e["state"] == "UNMEASURED"))
        unknown["value"] = 0
        unknown["event_id"] = E.compute_event_id(unknown)
        for carrier, render in CARRIERS:
            for ev in (bad, unknown):
                with self.subTest(carrier=carrier, state=ev["state"]):
                    with self.assertRaises(E.DoctrineError):
                        render(ev)


if __name__ == "__main__":
    unittest.main()
