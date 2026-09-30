# SPDX-License-Identifier: Apache-2.0
"""OASF 1.1.0 core/evaluation renderer (render/oasf_eval.py).

FAIL-FIRST (F-OASF): written against a stub that turned any event carrying a value into an OASF metric.
The first run is recorded failing in receipts/F-OASF.fail-first.txt; the real renderer makes it pass.
Validation is against the OFFICIAL schemas served by schema.oasf.outshift.com (pinned under vendor/ and oasf/).
"""
import copy, json, os
import pytest
import event as E
from render import oasf_eval

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
EVS = E.read_jsonl(os.path.join(HERE, "fixtures", "events.jsonl"))
EVENTS_URL = "https://fixture.example.org/evidence/events.jsonl"
CREATED = "2026-09-30T12:00:00Z"
dump = lambda o: json.dumps(o, ensure_ascii=False, sort_keys=True, indent=1) + "\n"


def smuggled(state="UNMEASURED", value=0.42):
    ev = copy.deepcopy(next(e for e in EVS if e["state"] == state))
    ev["value"] = value
    ev["event_id"] = E.compute_event_id(ev)
    return ev


def metrics_of(mod):
    return [m for r in mod["data"]["referred_evaluations"] for m in (r.get("evaluation_report") or {}).get("metrics", [])]


# ---------------- doctrine: UNMEASURED never becomes a metric value
@pytest.mark.parametrize("state,value", [("UNMEASURED", 0.42), ("UNMEASURED", 0), ("UNCHECKABLE", 7)])
def test_number_on_unmeasured_is_refused(state, value):
    with pytest.raises(E.DoctrineError):
        oasf_eval.module([smuggled(state, value)], EVENTS_URL, created_at=CREATED)


def test_unmeasured_events_render_no_metric_and_no_value():
    for ev in EVS:
        if ev["state"] not in E.NO_NUMBER_STATES:
            continue
        mod = oasf_eval.module([ev], EVENTS_URL, created_at=CREATED)
        assert metrics_of(mod) == []
        text = json.dumps(mod)
        assert "0.42" not in text
        kv = {d["name"]: d["value"] for r in mod["data"]["referred_evaluations"] for ds in r["datasets"] for d in ds.get("metadata", [])}
        assert "value" not in kv and kv["state"] == ev["state"]


def test_measured_value_is_the_only_metric():
    mod = oasf_eval.module(EVS, EVENTS_URL, created_at=CREATED)
    ms = metrics_of(mod)
    measured = [e for e in EVS if e["state"] not in E.NO_NUMBER_STATES and e.get("value") is not None]
    assert len(ms) == len(measured) == 1
    dp = {d["name"]: d["value"] for d in ms[0]["data_points"]}
    assert dp["value"] == "0.25" and dp["state"] == "DIVERGENT" and dp["event_id"] == measured[0]["event_id"]
    # every event, measured or not, is still listed as evidence (a dataset pointer), so nothing is hidden
    assert sum(len(r["datasets"]) for r in mod["data"]["referred_evaluations"]) == len(EVS)


def test_no_grade_ever():
    mod = oasf_eval.module(EVS, EVENTS_URL, created_at=CREATED)
    assert "overall_rating" not in mod["data"] and "overall_scores" not in mod["data"]
    for r in mod["data"]["referred_evaluations"]:
        assert "overall_scores" not in (r.get("evaluation_report") or {})
    bad = copy.deepcopy(mod); bad["data"]["overall_rating"] = 4.5
    with pytest.raises(E.DoctrineError):
        oasf_eval.check(bad)


def test_tampered_event_refused():
    ev = copy.deepcopy(EVS[1]); ev["observed"] = {"tools": 3}
    with pytest.raises(E.DoctrineError):
        oasf_eval.module([ev], EVENTS_URL, created_at=CREATED)


# ---------------- official OASF schemas
def _validator(path):
    jsonschema = pytest.importorskip("jsonschema")
    S = json.load(open(path))
    return jsonschema.validators.validator_for(S)(S)


def test_module_validates_against_official_evaluation_module_schema():
    V = _validator(os.path.join(ROOT, "vendor", "oasf-1.1.0-module-evaluation.schema.json"))
    mod = oasf_eval.module(EVS, EVENTS_URL, created_at=CREATED)
    errs = list(V.iter_errors(mod))
    assert not errs, [e.message for e in errs][:3]
    # the validator is live: a module with a value-less metric is rejected by the official schema
    bad = copy.deepcopy(mod)
    bad["data"]["referred_evaluations"][0]["evaluation_report"] = {"metrics": [{"name": "x", "type": "gauge", "unit_of_measurement": "1", "data_points": []}]}
    assert list(V.iter_errors(bad))


def test_record_with_module_validates_against_official_record_schema():
    V = _validator(os.path.join(ROOT, "oasf", "oasf-record-1.1.0.schema.json"))
    base = json.load(open(os.path.join(ROOT, "oasf", "ai.councilof.gspc.oasf.evidence.json")))
    before = dump(base)
    rec = oasf_eval.record(base, EVS, EVENTS_URL, created_at=CREATED)
    assert dump(base) == before                      # the input record is never edited
    errs = list(V.iter_errors(rec))
    assert not errs, [e.message for e in errs][:3]
    assert [m["name"] for m in rec["modules"]].count("core/evaluation") == 1


def test_golden_unchanged():
    got = dump(oasf_eval.module(EVS, EVENTS_URL, created_at=CREATED))
    assert got == open(os.path.join(HERE, "golden", "oasf_eval.json"), encoding="utf-8").read()
