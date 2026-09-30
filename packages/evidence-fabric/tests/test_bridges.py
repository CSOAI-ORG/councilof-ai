# SPDX-License-Identifier: Apache-2.0
"""Ingesters and builders used by the bridges, each with a case that must say no."""
import copy, json, os
import pytest
import event as E
from ingest import garak_in, openshell_in, safe_in
from oasf import build_record

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))


def garak_report(scores, eval_fails=None):
    rows = [{"entry_type": "start_run setup", "plugins.target_type": "test.Repeat", "plugins.target_name": None},
            {"entry_type": "init", "garak_version": "0.17.0", "start_time": "2026-09-30T10:00:00", "run": "fixture-run"}]
    for i, s in enumerate(scores):
        rows.append({"entry_type": "attempt", "status": 2, "probe_classname": "p.Probe", "seq": i, "detector_results": {"d.Det": [s]}})
    fails = sum(1 for s in scores if s >= 0.5) if eval_fails is None else eval_fails
    rows.append({"entry_type": "eval", "probe": "p.Probe", "detector": "d.Det", "passed": len(scores) - fails, "fails": fails, "total_evaluated": len(scores)})
    return ("\n".join(json.dumps(r) for r in rows) + "\n").encode()


def test_garak_recount_consistent_and_value_measured():
    [ev] = garak_in.ingest(garak_report([1.0, 0.0, 1.0, 0.0]), target_note="FIXTURE")
    assert ev["state"] == "CONSISTENT" and ev["value"] == 0.5
    assert ev["method"]["holder"] == "third_party:nvidia/garak"
    assert ev["negative_control"]["got"] == "DIVERGENT"


def test_garak_eval_row_that_disagrees_is_divergent_with_no_value():
    [ev] = garak_in.ingest(garak_report([1.0, 0.0, 1.0, 0.0], eval_fails=1), target_note="FIXTURE")
    assert ev["state"] == "DIVERGENT" and ev["value"] is None


ROWS = os.path.join(ROOT, "harness", "openshell-adapter", "capture-2026-09-28", "out", "rows.json")


@pytest.mark.skipif(not os.path.exists(ROWS), reason="harness capture not in this checkout")
def test_openshell_rows_to_events():
    raw = open(ROWS, "rb").read()
    evs = openshell_in.ingest(raw, read_at="2026-09-28T13:43:00Z", control="DIVERGENT", subject="urn:fixture")
    assert [e["state"] for e in evs] == ["CONSISTENT", "DIVERGENT", "CONSISTENT"]
    nd = openshell_in.ingest(raw, read_at="2026-09-28T13:43:00Z", control="CONSISTENT", subject="urn:fixture")
    assert {e["state"] for e in nd} == {"NOT_DISCRIMINATING"}   # a control that did not diverge proves nothing


PACK = os.path.join(ROOT, "docs", "standards", "osaia-safe-evidence-pack", "records")


@pytest.mark.skipif(not os.path.isdir(PACK), reason="SAFE pack not in this checkout")
def test_safe_records_to_events():
    import glob
    for p in sorted(glob.glob(os.path.join(PACK, "*.safe-rv.json"))):
        rec = json.load(open(p))
        ev = safe_in.to_event(rec, os.path.basename(p))
        assert E.validate(ev) == []
        if rec["result"]["state"] == "UNMEASURED":
            assert ev["state"] == "UNMEASURED" and ev["value"] is None


DRAFT = {"name": "ai.councilof/gspc", "version": "1.4.2", "schema_version": "1.1.0", "description": "fixture", "authors": ["Council of AI"],
         "created_at": "2026-09-28T00:00:00Z", "skills": [{"id": 71002, "name": "ai_ml_engineering/model_evaluation/agent_evaluation"}],
         "domains": [{"id": 405, "name": "trust_and_safety/risk_management"}],
         "locators": [{"type": "url", "urls": ["https://councilof.ai/mcp/free"]}],
         "modules": [{"name": "integration/mcp", "id": 202, "data": {"name": "ai.councilof/gspc", "connections": [{"type": "streamable-http", "url": "https://councilof.ai/mcp/free"}],
                      "mcp_data": {"name": "ai.councilof/gspc", "version": "1.4.2", "remotes": [{"type": "streamable-http", "url": "https://councilof.ai/mcp/free"}]}}}]}


def test_oasf_evidence_record_validates_and_carries_no_grade():
    jsonschema = pytest.importorskip("jsonschema")
    S = json.load(open(os.path.join(os.path.dirname(HERE), "oasf", "oasf-record-1.1.0.schema.json")))
    V = jsonschema.validators.validator_for(S)(S)
    before = json.dumps(DRAFT, sort_keys=True)
    r = build_record.build(DRAFT, "1.4.3", "2026-09-30T10:20:00Z")
    assert json.dumps(DRAFT, sort_keys=True) == before          # the source draft is never edited
    assert not list(V.iter_errors(r))
    ev = next(m for m in r["modules"] if m["name"] == "core/evaluation")
    assert "overall_rating" not in ev["data"] and "overall_scores" not in ev["data"]
    bad = copy.deepcopy(r); bad["modules"][-1]["data"]["overall_rating"] = "A"
    assert list(V.iter_errors(bad))
