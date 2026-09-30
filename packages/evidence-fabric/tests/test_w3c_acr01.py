# SPDX-License-Identifier: Apache-2.0
"""render/w3c_acr01.py: golden reports over REAL signed bytes (the OSAIA SAFE evidence pack frozen 30 Sep 2026,
board-signed did:web:csoai.org#board-attestation-1), a real control-run fail, and the rejection table saying no.

Fixtures in fixtures/safe-pack/ are byte copies of docs/standards/osaia-safe-evidence-pack/{FREEZE.json,
FREEZE.signed.json, did.json, events/events.jsonl}; test_fixture_bytes_are_the_signed_bytes pins them."""
import copy, hashlib, json, os
import pytest
import event as E
from render import w3c_acr01 as W

HERE = os.path.dirname(os.path.abspath(__file__))
FX = os.path.join(HERE, "fixtures", "safe-pack")
G = os.path.join(HERE, "golden")
rb = lambda n: open(os.path.join(FX, n), "rb").read()
EV_RAW = rb("events.jsonl")
EVS = [json.loads(l) for l in EV_RAW.decode().splitlines() if l.strip()]
CAUSES = json.loads(rb("causes.json"))["causes"]
FIX_EVS = E.read_jsonl(os.path.join(HERE, "fixtures", "events.jsonl"))
crypto = pytest.importorskip("cryptography")


def events_rep():
    return W.events_report(EVS, EV_RAW, CAUSES, source_ref="docs/standards/osaia-safe-evidence-pack/events/events.jsonl")


def sig_rep():
    return W.signature_report(rb("FREEZE.json"), rb("FREEZE.signed.json"), rb("did.json"),
                              "docs/standards/osaia-safe-evidence-pack/FREEZE.json")


def test_fixture_bytes_are_the_signed_bytes():
    signed = json.loads(rb("FREEZE.signed.json"))
    assert hashlib.sha256(rb("FREEZE.json")).hexdigest() == signed["payload"]["artifact"]["sha256"]
    assert json.loads(rb("FREEZE.json"))["events"] == len(EVS) == 10
    assert signed["signature"]["did"] == "did:web:csoai.org#board-attestation-1"


def test_goldens_unchanged():
    assert W.dump(events_rep()) == open(os.path.join(G, "w3c_acr01.safe-events.json"), encoding="utf-8").read()
    assert W.dump(sig_rep()) == open(os.path.join(G, "w3c_acr01.safe-signature.json"), encoding="utf-8").read()


def test_our_reports_are_accepted_by_the_rejection_table():
    assert W.rejections(events_rep()) == []
    assert W.rejections(sig_rep()) == []
    assert W.rejections(W.events_report(FIX_EVS, b"x")) == []


# ---------------- state mapping
def test_state_mapping_exact():
    got = {e["state"]: W.event_record(e)["state"] for e in FIX_EVS[:6]}
    assert got == {"CONSISTENT": "pass", "DIVERGENT": "fail", "PARTIAL": "inconclusive",
                   "UNMEASURED": "not-exercised", "UNCHECKABLE": "inconclusive", "NOT_DISCRIMINATING": "void"}
    nd = W.event_record(FIX_EVS[5])
    assert nd["cause"] == "evidence-does-not-hold"


@pytest.mark.parametrize("state", ["UNMEASURED", "UNCHECKABLE"])
def test_unmeasured_never_becomes_a_verdict(state):
    for ev in [e for e in FIX_EVS + EVS if e["state"] == state]:
        r = W.event_record(ev)
        assert r["state"] not in ("pass", "fail") and r["cause"] in W.CAUSES
        assert "value" not in r.get("x-csoai", {})
        assert r["other_verdict"] == "unknown" and r["discrimination"] == "unknown"


@pytest.mark.parametrize("value", [0.42, 0, 1])
def test_unmeasured_with_a_number_is_refused_not_rendered(value):
    ev = copy.deepcopy(next(e for e in EVS if e["state"] == "UNMEASURED"))
    ev["value"] = value
    ev["event_id"] = E.compute_event_id(ev)
    with pytest.raises(E.DoctrineError):
        W.event_record(ev)


def test_board_unmeasured_axis_is_never_pass_or_fail():
    for status in ("UNMEASURED", "UNCHECKABLE", None, "SOMETHING_NEW"):
        for sep in ("SEPARATED", "TIE", "UNTESTED", None):
            for r in W.axis_records({"axis": "a", "status": status, "separation": sep, "kind": "model-comparison"}):
                assert r["state"] not in ("pass", "fail"), (status, sep, r)
                assert r["cause"] in W.CAUSES


def test_board_measured_axes():
    sep = {s: W.axis_records({"axis": "a", "status": "MEASURED", "separation": s, "kind": "model-comparison"})[1]["state"]
           for s in ("SEPARATED", "TIE", "UNTESTED")}
    assert sep == {"SEPARATED": "pass", "TIE": "fail", "UNTESTED": "not-exercised"}
    facts = W.axis_records({"axis": "f", "status": "MEASURED", "separation": None, "kind": "deterministic-facts"})
    assert [r["check_id"] for r in facts] == ["gspc/f/measurement"] and facts[0]["state"] == "pass"


def test_cards():
    assert W.card_record("c1", "MEASURED")["state"] == "pass"
    assert W.card_record("c1", "UNMEASURED")["state"] == "not-exercised"
    assert W.card_record("c1", "MEASURED", body_verifies=False)["state"] == "void"
    assert W.card_record("c1", "UNMEASURED", body_verifies=False)["state"] == "void"


def test_causes_declared_and_defaulted_are_labelled():
    rep = events_rep()
    un = [r for r in rep["checks"] if r["x-csoai"]["event_state"] in ("UNMEASURED", "PARTIAL")]
    assert {r["cause"] for r in un} == {"unavailable", "withheld"}
    assert all(r["x-csoai"]["cause_basis"].startswith("declared") for r in un)
    bare = W.event_record(next(e for e in EVS if e["state"] == "UNMEASURED"))
    assert bare["x-csoai"]["cause_basis"].startswith("state default")


def test_negative_control_declaration_is_not_a_demonstration():
    for r in events_rep()["checks"]:
        assert r["discrimination"] == "unknown"
        assert r["other_verdict"] in ("unknown", "possible-not-demonstrated")


# ---------------- 5.4: a real fail, observed, under the same checker and configuration
def test_real_bytes_pass_and_every_control_fails_with_its_rule():
    rep = sig_rep()
    (rec,) = rep["checks"]
    assert rec["state"] == "pass"
    dp = rep["rollup"]["discriminating_power"]
    assert dp["basis"] == "control" and len(dp["controls"]) == 3
    rev = W.checker_revision()
    cfg = W.config_digest(rb("did.json"))
    for c in dp["controls"]:
        assert c["observed_state"] == "fail" and c["rule"] == c["expected_rule"]
        assert c["checker_revision"] == rev and c["config_digest"] == cfg


def test_controls_are_run_not_declared():
    a, s, d = rb("FREEZE.json"), rb("FREEZE.signed.json"), json.loads(rb("did.json"))
    assert W.check_signed_artifact(a, s, d) == ("pass", None)
    assert W.check_signed_artifact(a + b"\n", s, d) == ("fail", "artifact-digest")
    assert W.check_signed_artifact(a, W._flip_sig(s), d) == ("fail", "ed25519-signature")
    assert W.check_signed_artifact(a, W._alter_artifact_digest(s), d) == ("fail", "payload-digest")


def test_isolation_sweep_is_reported_as_observed():
    fx = {f["fixture_id"]: f["x-csoai-isolation-observed"] for f in sig_rep()["control_fixtures"]}
    assert fx["csoai-safe-freeze-trailing-byte-appended"]["artifact-digest"] == "pass"
    assert fx["csoai-safe-freeze-signature-bit-flipped"]["ed25519-signature"] == "pass"
    # two rules guard the altered payload digest: relaxing one of them does not flip it. Reported, not hidden.
    assert fx["csoai-safe-freeze-artifact-digest-altered"]["payload-digest"] == "fail"


def test_all_pass_with_no_control_says_nothing_not_silence():
    passes = [e for e in EVS if e["state"] == "CONSISTENT"]
    rep = W.events_report(passes, b"")
    assert rep["rollup"]["discriminating_power"] == {"basis": "nothing"}
    assert W.rejections(rep) == []


def test_events_report_with_real_fails_is_shown_by_run():
    dp = events_rep()["rollup"]["discriminating_power"]
    assert dp == {"basis": "shown-by-run", "fail_count": 3}


def test_inconclusive_or_void_never_supplies_the_fail():
    evs = [e for e in FIX_EVS if e["state"] in ("CONSISTENT", "PARTIAL", "NOT_DISCRIMINATING")]
    assert W.events_report(evs, b"")["rollup"]["discriminating_power"]["basis"] == "nothing"


def test_rollup_denominator_and_empty_population():
    ru = events_rep()["rollup"]
    assert ru["declared"] == 10 and ru["aggregate"]["denominator"] == 9 and ru["aggregate"]["pass"] == 5
    assert ru["completeness"]["execution"]["state"] == "not-satisfied"
    assert W.events_report([], b"")["rollup"]["completeness"]["accounting"]["state"] == "not-claimable"


# ---------------- the rejection table says no, naming the row
def _one(**rec):
    base = {"check_id": "c", "state": "pass", "other_verdict": "unknown", "discrimination": "unknown"}
    base.update(rec)
    return {"domain": {"id": "dom:x"}, "checks": [base], "evidence_objects": [],
            "rollup": {"completeness": {}, "by_state": {"fail": 1}, "discriminating_power": {"basis": "shown-by-run"}}}


@pytest.mark.parametrize("rec,row", [
    ({"state": "not-exercised"}, "1"),
    ({"state": "inconclusive", "cause": "the server timed out"}, "1"),
    ({"state": "void", "cause": "withheld"}, "2"),
    ({"state": "not-exercised", "cause": "integrity-failure"}, "3"),
    ({"state": "inconclusive", "cause": "confinement-failed-during-check"}, "4"),
    ({"state": "not-exercised", "cause": "unavailable", "declared_exclusion": True, "_state": "pass"}, None),
    ({"state": "pass", "declared_exclusion": True}, "5"),
    ({"state": "inconclusive", "cause": "unavailable", "other_verdict": "possible-not-demonstrated"}, "6"),
    ({"state": "fail", "cause": "failed"}, "7"),
    ({"other_verdict": {"foreclosed": {"constraint_set": "k", "domain": "dom:x", "evidence": "evo:a"}},
      "discrimination": {"demonstrated": "evo:a"}}, "8"),
    ({"discrimination": {"demonstrated": "evo:a"}}, "9"),
    ({"other_verdict": {"foreclosed": {"constraint_set": "k", "domain": "dom:other", "evidence": "evo:a"}}}, "10"),
    ({"other_verdict": {"demonstrated": "evo:missing"}}, "11"),
])
def test_rejection_rows(rec, row):
    rec = dict(rec)
    rec.pop("_state", None)
    rep = _one(**rec)
    rep["evidence_objects"] = [{"id": "evo:a", "changed": "input artifact", "compared": ["verdict"],
                                "observations": [{"verdict": "pass"}, {"verdict": "fail"}], "moved": ["verdict"]}]
    rows = [r for r, _ in W.rejections(rep)]
    if row is None:
        assert rows == []
    else:
        assert row in rows, rows


def test_rows_12_13_14_and_54():
    rep = sig_rep()
    bad = copy.deepcopy(rep)
    bad["evidence_objects"][0]["changed"] = "checker rule"
    assert "12" in [r for r, _ in W.rejections(bad)]
    bad = copy.deepcopy(rep)
    for ob in bad["evidence_objects"]:
        ob["observations"][1]["verdict"] = "pass"  # the verdict no longer moved; moved still says it did
    assert "13" in [r for r, _ in W.rejections(bad)]
    bad = copy.deepcopy(rep)
    bad["evidence_objects"][0]["observations"] = []
    assert "14" in [r for r, _ in W.rejections(bad)]
    bad = copy.deepcopy(rep)
    bad["rollup"]["discriminating_power"]["controls"][0]["config_digest"] = "0" * 64
    assert "5.4" in [r for r, _ in W.rejections(bad)]
    bad = copy.deepcopy(rep)
    bad["rollup"]["discriminating_power"]["controls"][0]["observed_state"] = "inconclusive"
    assert "5.4" in [r for r, _ in W.rejections(bad)]
    bad = copy.deepcopy(rep)
    del bad["rollup"]["discriminating_power"]
    assert "5.4" in [r for r, _ in W.rejections(bad)]


def test_cli_validate(tmp_path, capsys):
    p = tmp_path / "r.json"
    p.write_text(W.dump(sig_rep()))
    assert W.main(["--validate", str(p)]) == 0
    bad = sig_rep()
    bad["checks"][0]["cause"] = "failed"
    p.write_text(W.dump(bad))
    assert W.main(["--validate", str(p)]) == 1
    assert "row 7" in capsys.readouterr().out
