# SPDX-License-Identifier: Apache-2.0
"""Golden files per renderer, plus each carrier's own validator."""
import json, os
import pytest
import yaml
import event as E
from render import ocsf, otel, sarif, intoto, ecs_hec

HERE = os.path.dirname(os.path.abspath(__file__))
VEND = os.path.join(os.path.dirname(HERE), "vendor")
G = os.path.join(HERE, "golden")
EVS = E.read_jsonl(os.path.join(HERE, "fixtures", "events.jsonl"))
dump = lambda o: json.dumps(o, ensure_ascii=False, sort_keys=True, indent=1) + "\n"


def golden(name):
    return open(os.path.join(G, name), encoding="utf-8").read()


def test_goldens_unchanged():
    assert dump([ocsf.render(e) for e in EVS]) == golden("ocsf.json")
    assert dump(otel.render_batch(EVS)) == golden("otel.json")
    assert dump(sarif.render_batch(EVS)) == golden("sarif.json")
    assert dump([intoto.statement(e) for e in EVS]) == golden("intoto.json")
    assert "".join(json.dumps(ecs_hec.hec(e), ensure_ascii=False, sort_keys=True) + "\n" for e in EVS) == golden("hec.ndjson")


# ---------------- OCSF 1.9.0
def test_ocsf_validates_against_1_9_0_detection_finding():
    jsonschema = pytest.importorskip("jsonschema")
    S = json.load(open(os.path.join(VEND, "ocsf-1.9.0-detection_finding.schema.json")))
    V = jsonschema.Draft7Validator(S)
    for f in json.loads(golden("ocsf.json")):
        errs = list(V.iter_errors(f))
        assert not errs, [e.message for e in errs][:3]
        assert f["class_uid"] == 2004 and f["class_uid"] != 2003
        assert f["severity_id"] == 1
        assert "confidence_score" not in f and "risk_score" not in f and "compliance" not in f


def test_ocsf_state_mapping():
    by = {e["state"]: ocsf.render(e) for e in EVS[:6]}
    assert by["CONSISTENT"]["status_id"] == 4 and by["DIVERGENT"]["status_id"] == 1
    assert by["UNMEASURED"]["status_id"] == 99 and by["UNMEASURED"]["status_detail"] == "UNMEASURED"
    assert "value" not in by["UNMEASURED"]["unmapped"]["csoai"]
    assert ocsf.render(EVS[6])["unmapped"]["csoai"]["value"] == 0.25


# ---------------- OTel
def _registry():
    reg = yaml.safe_load(open(os.path.join(VEND, "otel-genai-registry.yaml")))
    return {a["key"]: a.get("type") for a in reg["attributes"] if "key" in a}


def test_otel_event_matches_semconv():
    evd = yaml.safe_load(open(os.path.join(VEND, "otel-genai-events.yaml")))
    spec = next(g for g in evd["events"] if g.get("name") == "gen_ai.evaluation.result")
    required = [a["ref"] for a in spec["attributes"] if a.get("requirement_level") == "required"]
    assert required == ["gen_ai.evaluation.name"]
    reg = _registry()
    typ = {"string": str, "double": float}
    for ev in EVS:
        a = otel.attributes(ev)
        for r in required:
            assert r in a
        for k, v in a.items():
            if k.startswith("gen_ai."):
                assert k in reg, k
                assert isinstance(v, typ[reg[k]]), (k, reg[k])
            else:
                assert k.startswith("csoai."), k
    lr = otel.render_batch(EVS)["resourceLogs"][0]["scopeLogs"][0]["logRecords"]
    assert all(r["eventName"] == "gen_ai.evaluation.result" for r in lr)


def test_otel_no_score_for_unmeasured():
    for ev in EVS:
        a = otel.attributes(ev)
        if ev["value"] is None:
            assert "gen_ai.evaluation.score.value" not in a
    assert otel.attributes(EVS[6])["gen_ai.evaluation.score.value"] == 0.25


# ---------------- SARIF 2.1.0
def test_sarif_validates_against_2_1_0():
    jsonschema = pytest.importorskip("jsonschema")
    S = json.load(open(os.path.join(VEND, "sarif-schema-2.1.0.json")))
    V = jsonschema.Draft4Validator(S)
    doc = json.loads(golden("sarif.json"))
    errs = list(V.iter_errors(doc))
    assert not errs, [e.message for e in errs][:3]
    for r in doc["runs"][0]["results"]:
        assert (r["level"] == "warning") == (r["kind"] == "fail")
        if r["kind"] != "fail":
            assert r["level"] == "none"


def test_sarif_state_mapping():
    got = {e["state"]: sarif.result(e)["kind"] for e in EVS[:6]}
    assert got == {"CONSISTENT": "pass", "DIVERGENT": "fail", "PARTIAL": "review", "UNMEASURED": "open",
                   "UNCHECKABLE": "open", "NOT_DISCRIMINATING": "notApplicable"}


# ---------------- in-toto v1
def test_intoto_statement_v1():
    for ev in EVS:
        st = intoto.statement(ev)
        assert st["_type"] == "https://in-toto.io/Statement/v1"
        assert st["subject"][0]["digest"]["sha256"] == ev["event_id"][7:]
        assert st["predicateType"] == intoto.PREDICATE_TYPE
    try:
        from google.protobuf import json_format
        from in_toto_attestation.v1 import statement_pb2
        from in_toto_attestation.v1.statement import Statement
    except ImportError:
        pytest.skip("in-toto-attestation not installed")
    for ev in EVS:
        pb = json_format.ParseDict(intoto.statement(ev), statement_pb2.Statement())
        Statement.copy_from_pb(pb).validate()


def test_intoto_dsse_is_honestly_unsigned():
    env = intoto.dsse_unsigned(intoto.statement(EVS[0]))
    assert env["signatures"] == [] and env["payloadType"] == "application/vnd.in-toto+json"


# ---------------- ECS / HEC
def test_ecs_fields_known_and_values_allowed():
    sub = json.load(open(os.path.join(VEND, "ecs-subset.json")))["fields"]
    for ev in EVS:
        line = ecs_hec.hec(ev)
        assert set(line) == {"time", "host", "source", "sourcetype", "event"}
        doc = line["event"]
        for k in ecs_hec.flat_keys(doc):
            if k.startswith(("csoai", "labels")):
                continue
            assert k in sub, k
        for k in ("event.kind", "event.outcome"):
            top, leaf = k.split(".")
            assert doc[top][leaf] in sub[k]["allowed_values"], k
        for k in ("event.category", "event.type"):
            top, leaf = k.split(".")
            assert set(doc[top][leaf]) <= set(sub[k]["allowed_values"]), k
        assert "intrusion_detection" not in doc["event"]["category"]
        assert "risk_score" not in doc["event"]
        if ev["state"] not in ("CONSISTENT", "DIVERGENT"):
            assert doc["event"]["outcome"] == "unknown"
    for k in ecs_hec.FIELD_MAP:
        assert k == "csoai.*" or k == "labels" or k in sub, k
