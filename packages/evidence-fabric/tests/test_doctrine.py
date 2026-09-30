# SPDX-License-Identifier: Apache-2.0
"""FAIL-FIRST test (F0): an UNMEASURED event carrying a numeric score must be refused by EVERY renderer,
and no renderer may emit a number for a state that has none. Written before the renderer guard existed;
the first run (guard absent) is recorded failing in receipts/F0.json."""
import copy, json, os
import pytest
import event as E
from render import ocsf, otel, sarif, intoto, ecs_hec, w3c_acr01, oasf_eval

HERE = os.path.dirname(os.path.abspath(__file__))
EVS = E.read_jsonl(os.path.join(HERE, "fixtures", "events.jsonl"))

RENDERERS = {
    "ocsf": ocsf.render,
    "otel": otel.attributes,
    "sarif": sarif.result,
    "intoto": intoto.statement,
    "ecs_hec": ecs_hec.hec,
    "w3c_acr01": w3c_acr01.event_record,
    "oasf_eval": oasf_eval.single,
}


def smuggled(state="UNMEASURED", value=0.42):
    ev = copy.deepcopy(next(e for e in EVS if e["state"] == state))
    ev["value"] = value
    ev["event_id"] = E.compute_event_id(ev)  # a consistent id: the only wrong thing is the number
    return ev


@pytest.mark.parametrize("name", sorted(RENDERERS))
@pytest.mark.parametrize("state,value", [("UNMEASURED", 0.42), ("UNMEASURED", 0), ("UNCHECKABLE", 7)])
def test_renderer_refuses_number_on_unmeasured(name, state, value):
    with pytest.raises(E.DoctrineError):
        RENDERERS[name](smuggled(state, value))


def _numbers(o, path=""):
    if isinstance(o, bool):
        return []
    if isinstance(o, (int, float)):
        return [path]
    if isinstance(o, dict):
        return sum((_numbers(v, path + "." + k) for k, v in o.items()), [])
    if isinstance(o, list):
        return sum((_numbers(v, path + "[]") for v in o), [])
    return []


SCORE_KEYS = ("value", "score", "confidence_score", "risk_score", "doubleValue")


@pytest.mark.parametrize("name", sorted(RENDERERS))
def test_no_score_number_in_any_unmeasured_render(name):
    for ev in EVS:
        if ev["state"] not in E.NO_NUMBER_STATES:
            continue
        out = RENDERERS[name](ev)
        bad = [p for p in _numbers(out) if p.rsplit(".", 1)[-1] in SCORE_KEYS]
        assert not bad, (name, bad)
        assert "0.42" not in json.dumps(out)


@pytest.mark.parametrize("name", sorted(RENDERERS))
def test_renderer_refuses_tampered_event(name):
    ev = copy.deepcopy(EVS[1])
    ev["observed"] = {"tools": 3}  # event_id no longer matches
    with pytest.raises(E.DoctrineError):
        RENDERERS[name](ev)
