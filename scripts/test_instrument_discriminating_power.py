#!/usr/bin/env python3
"""Tests for scripts/instrument_discriminating_power.py.

pytest-style (`python3 -m pytest scripts/test_instrument_discriminating_power.py`)
and runnable plain (`python3 scripts/test_instrument_discriminating_power.py`)
because the pod's CI clone has no pytest.

Three fixtures prove the census can fail:
  1. a known-negative control read as negative (DEMONSTRATED) — and the SAME
     fixture with the negative flipped to a pass must NOT be DEMONSTRATED and
     must carry the exact reason "control never produced a negative";
  2. no control at all, and a subject-domain "control_facts" field, must both
     be NOT_RECORDED (the subject-domain name must be listed as excluded);
  3. a prose control and an unparseable file must both be UNCHECKABLE.
Plus an injected defect into the judge itself: with negative recognition
disabled, fixture 1 must stop being DEMONSTRATED (grader_can_fail).
"""
from __future__ import annotations

import copy
import json
import os
import sys
import tempfile
import traceback
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import instrument_discriminating_power as idp  # noqa: E402

REASON_NEVER_NEGATIVE = "control never produced a negative"


def _population(tmp: Path, docs: dict[str, object]) -> list[Path]:
    (tmp / "public" / "interop").mkdir(parents=True, exist_ok=True)
    files = []
    for name, doc in docs.items():
        p = tmp / "public" / "interop" / name
        if isinstance(doc, bytes):
            p.write_bytes(doc)
        else:
            p.write_text(json.dumps(doc), encoding="utf-8")
        files.append(p)
    return sorted(files)


def _census(tmp: Path, docs: dict[str, object]) -> dict:
    files = _population(tmp, docs)
    return idp.build_census(tmp, files, globs=("public/interop/*.json",), excluded_self=None)


def _row(census: dict, name: str) -> dict:
    return next(r for r in census["rows"] if r["file"].endswith(name))


# --- fixture 1: negative control demonstrated, and flipped ------------------

FIX_NEG = {
    "schema": "csoai.fixture/0.1",
    "controls": {
        "control:known_bad": {"expected": "FAIL", "got": "FAIL", "passed": True},
        "control:known_good": {"expected": "PASS", "got": "PASS", "passed": True},
    },
}


def test_known_negative_read_as_negative_is_demonstrated():
    with tempfile.TemporaryDirectory() as d:
        c = _census(Path(d), {"neg.json": FIX_NEG})
        row = _row(c, "neg.json")
        assert row["state"] == "DEMONSTRATED", row
        assert row["reason_code"] == "NEGATIVE_OBSERVED"
        assert any(e["path"].endswith("control:known_bad") for e in row["evidence"])
        assert c["totals"]["DEMONSTRATED"] == 1


def test_control_that_never_went_negative_is_not_recorded_with_exact_reason():
    flipped = copy.deepcopy(FIX_NEG)
    flipped["controls"]["control:known_bad"]["got"] = "PASS"
    flipped["controls"]["control:known_bad"]["expected"] = "PASS"
    with tempfile.TemporaryDirectory() as d:
        c = _census(Path(d), {"flipped.json": flipped})
        row = _row(c, "flipped.json")
        assert row["state"] == "NOT_RECORDED", row
        assert row["reason_code"] == "CONTROL_NEVER_NEGATIVE"
        assert row["reason"] == REASON_NEVER_NEGATIVE
        assert c["totals"]["DEMONSTRATED"] == 0
        assert row["controls_judged"] == 2  # both controls were seen, neither negative


def test_injected_defect_changes_the_verdict():
    with tempfile.TemporaryDirectory() as d:
        c = _census(Path(d), {"neg.json": FIX_NEG})
        g = c["self_controls"]["grader_can_fail"]
        assert g["verdict_without_defect"] == "DEMONSTRATED"
        assert g["verdict_with_defect"] != "DEMONSTRATED"
        assert g["changed_as_required"] is True
    # and directly on the judge: same document, defective judge, different verdict
    ok = idp.judge_document(FIX_NEG)["state"]
    broken = idp.judge_document(FIX_NEG, negative_tokens=set(), honour_control_fired=False)["state"]
    assert ok == "DEMONSTRATED" and broken == "NOT_RECORDED", (ok, broken)


# --- fixture 2: nothing recorded / subject-domain controls -------------------

FIX_NONE = {"schema": "csoai.fixture/0.1", "rows": [{"n": 1, "state": "MEASURED"}]}
FIX_SUBJECT = {
    "schema": "csoai.fixture/0.1",
    "issuers": [{"control_facts": {"can_freeze": True, "requires_auth": False}}],
    "custody_controls": {"split": "2-of-3"},
    # a string pointer into a subject-domain axis: must not be read as a prose control
    "siblings": {"provenance_controls_measured_n6": "/interop/financial-measure-run-v2.json"},
}


def test_no_control_and_subject_domain_controls_are_not_recorded():
    with tempfile.TemporaryDirectory() as d:
        c = _census(Path(d), {"none.json": FIX_NONE, "subject.json": FIX_SUBJECT})
        none_row, subj_row = _row(c, "none.json"), _row(c, "subject.json")
        assert none_row["state"] == "NOT_RECORDED" and none_row["reason_code"] == "NO_CONTROL_RECORDED"
        assert subj_row["state"] == "NOT_RECORDED" and subj_row["reason_code"] == "NO_CONTROL_RECORDED"
        names = {n["name"]: n for n in c["field_names_matched"]["names"]}
        assert names["control_facts"]["classification"] == "subject_domain_control"
        assert names["custody_controls"]["classification"] == "subject_domain_control"
        assert names["provenance_controls_measured_n6"]["classification"] == "subject_domain_control"
        assert subj_row["state"] != "UNCHECKABLE"
        assert c["totals"]["DEMONSTRATED"] == 0
        assert c["totals"]["n"] == 2


def test_flag_only_control_is_not_recorded():
    doc = {"schema": "csoai.fixture/0.1", "flags": {"one_controlled_probe": True, "current_canary": 1}}
    with tempfile.TemporaryDirectory() as d:
        c = _census(Path(d), {"flag.json": doc})
        row = _row(c, "flag.json")
        assert row["state"] == "NOT_RECORDED" and row["reason_code"] == "FLAG_OR_COUNT_ONLY"


# --- fixture 3: prose-only and unparseable are UNCHECKABLE -------------------

FIX_PROSE = {
    "schema": "csoai.fixture/0.1",
    "proven": {"control": "one byte flipped in a body that verifies -> INVALID: InvalidSignature"},
}


def test_prose_control_is_uncheckable_even_when_it_names_a_negative():
    with tempfile.TemporaryDirectory() as d:
        c = _census(Path(d), {"prose.json": FIX_PROSE})
        row = _row(c, "prose.json")
        assert row["state"] == "UNCHECKABLE" and row["reason_code"] == "PROSE_ONLY", row


def test_unparseable_file_is_uncheckable_and_counted():
    with tempfile.TemporaryDirectory() as d:
        c = _census(Path(d), {"broken.json": b"{\"schema\": \"csoai.fixture/0.1\", "})
        row = _row(c, "broken.json")
        assert row["state"] == "UNCHECKABLE" and row["reason_code"] == "UNPARSEABLE"
        assert row["sha256"] and row["bytes"] > 0
        assert c["totals"]["UNCHECKABLE"] == 1 and c["totals"]["n"] == 1


# --- invariants of the artifact ----------------------------------------------

def test_totals_partition_the_population_and_schema_fields_are_present():
    with tempfile.TemporaryDirectory() as d:
        c = _census(Path(d), {
            "neg.json": FIX_NEG, "none.json": FIX_NONE, "prose.json": FIX_PROSE,
            "broken.json": b"not json",
        })
        t = c["totals"]
        assert t["DEMONSTRATED"] + t["NOT_RECORDED"] + t["UNCHECKABLE"] == t["n"] == 4
        assert sum(t["by_reason_code"].values()) == 4
        assert c["schema"] == "csoai.instrument-controls/0.1"
        assert c["signed"] is False
        assert c["as_of"].endswith("Z")
        assert c["population"]["n"] == 4
        assert c["field_names_matched"]["n_distinct"] >= 2
        assert c["self_controls"]["all_fixtures_passed"] is True
        assert set(r["file"] for r in c["rows"]) == set(t["demonstrated_files"]) | set(
            t["uncheckable_files"]) | {r["file"] for r in c["rows"] if r["state"] == "NOT_RECORDED"}


def test_real_shapes_from_the_estate_are_read_as_intended():
    # shapes copied from the live population, so a regression in the judge
    # shows up here before it shows up in the artifact
    eb = {"controls": {"controls": {
        "control:binds": {"expected": "BINDS", "got": "BINDS", "passed": True},
        "control:nobind": {"expected": "DOES_NOT_BIND", "got": "DOES_NOT_BIND", "passed": True}},
        "grader_can_fail": {"injected_defect": "x", "control": "control:binds",
                            "verdict_without_defect": "BINDS", "verdict_with_defect": "UNCHECKABLE",
                            "changed_as_required": True}}}
    ots = {"failing_control": {"source_proof": "p.ots",
                               "control_a": {"description": "flip", "control_fired": True},
                               "control_b": {"verdict": "BITCOIN_CLAIMED_UNVERIFIED", "control_fired": True}}}
    ledger = {"payload": {"negative_control": {"live": 6, "probed": 6, "states": {},
                                               "verdict": "6 of 6 known issuer accounts are LIVE"}}}
    owasp = {"regulators": [{"controls": {"ASI01": "Agent Goal Hijack", "ASI02": "Tool Misuse"}}]}
    assert idp.judge_document(eb)["state"] == "DEMONSTRATED"
    assert idp.judge_document(ots)["state"] == "DEMONSTRATED"
    r = idp.judge_document(ledger)
    assert r["state"] == "NOT_RECORDED" and r["reason"] == REASON_NEVER_NEGATIVE
    r = idp.judge_document(owasp)
    assert r["state"] == "NOT_RECORDED" and r["reason_code"] == "NO_CONTROL_RECORDED"
    assert any(m["classification"] == "catalogue_not_control_record" for m in r["_matches"])


def _run_plain() -> int:
    tests = [(n, f) for n, f in sorted(globals().items()) if n.startswith("test_") and callable(f)]
    failed = 0
    for name, fn in tests:
        try:
            fn()
            print(f"PASS {name}")
        except Exception:  # noqa: BLE001 - report every failure, then exit 1
            failed += 1
            print(f"FAIL {name}")
            traceback.print_exc()
    print(f"{len(tests) - failed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(_run_plain())
