# SPDX-License-Identifier: Apache-2.0
import copy, json, os
import pytest
import event as E

HERE = os.path.dirname(os.path.abspath(__file__))
EVS = E.read_jsonl(os.path.join(HERE, "fixtures", "events.jsonl"))


def test_jcs_rfc8785_numbers_and_key_order():
    # RFC 8785 appendix-style vectors
    assert E._num(1e21) == "1e+21" and E._num(1e-7) == "1e-7" and E._num(0.000001) == "0.000001"
    assert E._num(333333333.33333329) == "333333333.3333333" and E._num(100.0) == "100" and E._num(-0.0) == "0"
    assert E.jcs({"€": 1, "\r": 2, "b": [True, None], "a": "é"}) == '{"\\r":2,"a":"é","b":[true,null],"€":1}'.encode()
    with pytest.raises(E.DoctrineError):
        E.jcs({"x": float("nan")})


def test_event_id_is_stable_and_excludes_signature_and_anchors():
    ev = copy.deepcopy(EVS[0])
    i = E.compute_event_id(ev)
    ev["signature"] = {"alg": "Ed25519", "kid": "did:web:csoai.org#board-attestation-1", "sig": "00"}
    ev["anchors"] = {"ots": "bitcoin:900000", "rekor": {"log_index": 1, "uuid": "x"}}
    assert E.compute_event_id(ev) == i == ev["event_id"]
    ev["claim"]["text"] += " "
    assert E.compute_event_id(ev) != i


def test_all_fixtures_valid():
    for ev in EVS:
        assert E.validate(ev) == [], ev["state"]


BAD = {
    "UNMEASURED carrying a number": lambda e: e.update(state="UNMEASURED", value=0.42),
    "UNCHECKABLE carrying a zero": lambda e: e.update(state="UNCHECKABLE", value=0),
    "state outside the vocabulary": lambda e: e.update(state="CERTIFIED"),
    "no limits": lambda e: e.update(limits=[]),
    "value that is a string score": lambda e: e.update(value="A+"),
    "bool smuggled as number": lambda e: e.update(value=True),
    "holder not declared": lambda e: e["method"].update(holder="nvidia"),
    "negative control that did not discriminate": lambda e: e["negative_control"].update(expected="DIVERGENT", got="CONSISTENT"),
    "CONSISTENT with no control run": lambda e: e.update(negative_control={"id": None, "expected": None, "got": "NOT_RUN"}),
    "doctrine word in the claim": lambda e: e["claim"].update(text="The server is certified."),
}


@pytest.mark.parametrize("label", sorted(BAD))
def test_validate_says_no(label):
    ev = copy.deepcopy(EVS[0])
    BAD[label](ev)
    ev["event_id"] = E.compute_event_id(ev)
    assert E.validate(ev), label


def test_tampered_event_id_rejected():
    ev = copy.deepcopy(EVS[1])
    ev["observed"] = {"tools": 3}
    assert any("event_id" in x for x in E.validate(ev))


def test_json_schema_agrees():
    jsonschema = pytest.importorskip("jsonschema")
    S = json.load(open(os.path.join(os.path.dirname(HERE), "schema", "evidence-event-0.1.schema.json")))
    V = jsonschema.Draft7Validator(S)
    for ev in EVS:
        assert not list(V.iter_errors(ev))
    for label in ("UNMEASURED carrying a number", "state outside the vocabulary", "no limits", "value that is a string score",
                  "CONSISTENT with no control run", "holder not declared"):
        ev = copy.deepcopy(EVS[0]); BAD[label](ev); ev["event_id"] = E.compute_event_id(ev)
        assert list(V.iter_errors(ev)), label


def test_batch_record(tmp_path):
    p = tmp_path / "events.jsonl"
    E.write_jsonl(str(p), EVS)
    b = E.batch_record("fixture", str(p), "2026-09-30T12:00:00Z")
    assert b["events_file"]["n_events"] == len(EVS) and len(b["event_ids"]) == len(EVS)
    assert b["state_counts"]["DIVERGENT"] == 2
    assert all(isinstance(v, (int, str, list, dict)) for v in b.values())
