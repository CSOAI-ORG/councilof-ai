"""Local qualification controls, not model observations."""
import json
import sys
from types import ModuleType, SimpleNamespace
import pytest
import event
from ingest import inspect_native_in as m

def row(i=1, epoch=None, score=1):
    r={"id":i,"scores":{"match":{"value":score}}}
    if epoch is not None: r["epoch"]=epoch
    return r

def raw(rows, accuracy=1, metric="accuracy", status="success"):
    return json.dumps({"version":2,"status":status,
      "eval":{"task":"identity-control","model":"fixture-only"},
      "results":{"total_samples":len(rows),"scores":[{"name":"match","metrics":{metric:{"value":accuracy}}}]},
      "samples":rows}).encode()

@pytest.mark.parametrize("rows,accuracy,metric,status,expected",[
    ([row(1),row(2,score=0)],.5,"accuracy","success","CONSISTENT"),
    ([row(1),row(1)],1,"accuracy","success","UNCHECKABLE"),
    ([{"scores":{"match":{"value":1}}},row(2)],1,"accuracy","success","UNCHECKABLE"),
    ([row(1,1),row(1,2)],1,"accuracy","success","UNCHECKABLE"),
    ([row(1,1),row(1,1)],1,"accuracy","success","UNCHECKABLE"),
    ([row(1),row(1,2)],1,"accuracy","success","UNCHECKABLE"),
    ([row(True),row(2)],1,"accuracy","success","UNCHECKABLE"),
    ([row(1,0),row(2,1)],1,"accuracy","success","UNCHECKABLE"),
    ([row(1,score=2),row(2)],1,"accuracy","success","UNCHECKABLE"),
    ([row(1)],1,"accuracy","error","UNMEASURED"),
    ([row(1),row(2,score=0)],1,"accuracy","success","DIVERGENT"),
    ([row(1)],1,"all","success","UNCHECKABLE"),
    ([row(1)],1,"compliance_rate","success","UNCHECKABLE"),
])
def test_identity_and_metric_boundaries(rows,accuracy,metric,status,expected):
    e=m.ingest(raw(rows,accuracy,metric,status),read_at="2026-11-27T00:00:00Z")[0]
    assert e["state"]==expected
    assert event.validate(e)==[]
    if expected in ("UNCHECKABLE","UNMEASURED"): assert e["value"] is None

def test_distinct_epochs_have_unique_observation_identity():
    assert m.recount([row(1,1),row(1,2)],"match")=={"passed":2,"failed":0,"total_evaluated":2}

def test_api_projection_preserves_epoch(monkeypatch):
    module=ModuleType("inspect_ai")
    api=ModuleType("inspect_ai.log")
    api.read_eval_log=lambda _:SimpleNamespace(version=2,status="success",eval=SimpleNamespace(task="t",model="m"),
      results=SimpleNamespace(total_samples=2,scores=[]),
      samples=[SimpleNamespace(id=7,epoch=i,scores={"match":SimpleNamespace(value=1)}) for i in (1,2)])
    monkeypatch.setitem(sys.modules,"inspect_ai",module)
    monkeypatch.setitem(sys.modules,"inspect_ai.log",api)
    doc=m.load_eval_log("fixture-only")
    assert [(s["id"],s["epoch"]) for s in doc["samples"]]==[(7,1),(7,2)]
